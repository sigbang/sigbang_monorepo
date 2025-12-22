import os
import json
import datetime
from typing import List

import boto3


ASG_NAME = os.environ.get("ASG_NAME")
CPU_THRESHOLD = float(os.environ.get("CPU_THRESHOLD", "95"))
LOOKBACK_MIN = int(os.environ.get("LOOKBACK_MIN", "10"))
MIN_IN_SERVICE = int(os.environ.get("MIN_IN_SERVICE", "2"))

RATE_LIMIT_TABLE = os.environ.get("RATE_LIMIT_TABLE")
RATE_LIMIT_MAX_TERMINATIONS = int(
    os.environ.get("RATE_LIMIT_MAX_TERMINATIONS", "3")
)
RATE_LIMIT_WINDOW_MIN = int(os.environ.get("RATE_LIMIT_WINDOW_MIN", "30"))
OPS_ALERT_TOPIC_ARN = os.environ.get("OPS_ALERT_TOPIC_ARN")

autoscaling = boto3.client("autoscaling")
cloudwatch = boto3.client("cloudwatch")
dynamodb = boto3.client("dynamodb") if RATE_LIMIT_TABLE else None
sns = boto3.client("sns") if OPS_ALERT_TOPIC_ARN else None


def _now_utc() -> datetime.datetime:
    return datetime.datetime.utcnow().replace(tzinfo=datetime.timezone.utc)


def _load_recent_terminations(
    asg_name: str, window_min: int
) -> List[datetime.datetime]:
    """
    DynamoDB 에서 해당 ASG 의 최근 종료 기록을 읽어와,
    window_min 분 안에 있는 것만 반환.
    """
    if not dynamodb or not RATE_LIMIT_TABLE:
        return []

    try:
        resp = dynamodb.get_item(
            TableName=RATE_LIMIT_TABLE,
            Key={"asg_name": {"S": asg_name}},
            ConsistentRead=True,
        )
    except Exception as e:
        print(f"Failed to read rate limit table: {e}")
        return []

    item = resp.get("Item")
    if not item or "terminations" not in item:
        return []

    raw_list = item.get("terminations", {}).get("L", [])
    now = _now_utc()
    cutoff = now - datetime.timedelta(minutes=window_min)

    result: List[datetime.datetime] = []
    for v in raw_list:
        try:
            ts_str = v.get("S")
            if not ts_str:
                continue
            ts = datetime.datetime.fromisoformat(ts_str)
            # fromisoformat keeps timezone if present, else naive; normalise to UTC naive
            if ts.tzinfo is not None:
                ts = ts.astimezone(datetime.timezone.utc).replace(tzinfo=None)
            if ts >= cutoff:
                result.append(ts)
        except Exception as e:
            print(f"Failed to parse timestamp '{v}': {e}")

    return result


def _save_terminations(asg_name: str, timestamps: List[datetime.datetime]) -> None:
    """
    최근 종료 기록 리스트를 ISO 문자열로 변환해 DynamoDB 에 저장.
    """
    if not dynamodb or not RATE_LIMIT_TABLE:
        return

    try:
        dynamodb.put_item(
            TableName=RATE_LIMIT_TABLE,
            Item={
                "asg_name": {"S": asg_name},
                "terminations": {
                    "L": [{"S": t.isoformat()} for t in timestamps]
                },
            },
        )
    except Exception as e:
        print(f"Failed to write rate limit table: {e}")


def _notify_rate_limited(asg_name: str, hottest_id: str, hottest_cpu: float) -> None:
    """
    rate limit 에 걸려 더 이상 자동 종료를 하지 않을 때 SNS 로 알림 전송.
    """
    if not sns or not OPS_ALERT_TOPIC_ARN:
        print("SNS client or OPS_ALERT_TOPIC_ARN not configured, skip alert")
        return

    subject = f"[sigbang] Auto-recovery rate limited for ASG {asg_name}"
    message = (
        f"Lambda terminate_hot_instance for ASG '{asg_name}' reached "
        f"rate limit (max {RATE_LIMIT_MAX_TERMINATIONS} terminations "
        f"within {RATE_LIMIT_WINDOW_MIN} minutes).\n\n"
        f"Last hottest instance candidate: {hottest_id} "
        f"(CPU {hottest_cpu:.2f}).\n"
        "Automatic termination is temporarily stopped. Please investigate "
        "API health, traffic pattern, and instance behavior.\n"
    )

    try:
        sns.publish(
            TopicArn=OPS_ALERT_TOPIC_ARN,
            Subject=subject,
            Message=message,
        )
    except Exception as e:
        print(f"Failed to publish SNS alert: {e}")


def handler(event, context):
    print("Received event:", json.dumps(event))

    if not ASG_NAME:
        print("ASG_NAME env var not set, aborting")
        return

    asg_resp = autoscaling.describe_auto_scaling_groups(
        AutoScalingGroupNames=[ASG_NAME]
    )
    groups = asg_resp.get("AutoScalingGroups", [])
    if not groups:
        print(f"No Auto Scaling Group found with name {ASG_NAME}")
        return

    group = groups[0]
    instances = [
        i
        for i in group.get("Instances", [])
        if i.get("LifecycleState") == "InService"
    ]
    in_service_count = len(instances)
    print(f"InService instances in {ASG_NAME}: {in_service_count}")

    # 안전장치: 너무 소수의 인스턴스일 때는 자동 종료하지 않음
    if in_service_count < MIN_IN_SERVICE:
        print(
            f"InService instances ({in_service_count}) < MIN_IN_SERVICE "
            f"({MIN_IN_SERVICE}), skipping termination"
        )
        return

    end_time = datetime.datetime.utcnow()
    start_time = end_time - datetime.timedelta(minutes=LOOKBACK_MIN)

    hottest_id = None
    hottest_cpu = 0.0

    for inst in instances:
        instance_id = inst.get("InstanceId")
        if not instance_id:
            continue

        metrics = cloudwatch.get_metric_statistics(
            Namespace="AWS/EC2",
            MetricName="CPUUtilization",
            Dimensions=[{"Name": "InstanceId", "Value": instance_id}],
            StartTime=start_time,
            EndTime=end_time,
            Period=60,
            Statistics=["Average"],
        )

        datapoints = metrics.get("Datapoints", [])
        if not datapoints:
            print(f"No CPU datapoints for {instance_id} in lookback window")
            continue

        latest = sorted(datapoints, key=lambda x: x["Timestamp"])[-1]
        avg_cpu = latest.get("Average", 0.0)
        print(f"Instance {instance_id} average CPU: {avg_cpu}")

        if avg_cpu > hottest_cpu:
            hottest_cpu = avg_cpu
            hottest_id = instance_id

    if not hottest_id:
        print("No instance with CPU data found, nothing to do")
        return

    if hottest_cpu < CPU_THRESHOLD:
        print(
            f"Hottest instance {hottest_id} CPU {hottest_cpu:.2f} < "
            f"threshold {CPU_THRESHOLD}, skipping termination"
        )
        return

    # === Rate limit check: 최근 N분 동안 종료 횟수 제한 ===
    recent = _load_recent_terminations(ASG_NAME, RATE_LIMIT_WINDOW_MIN)
    print(
        f"Recent terminations for {ASG_NAME} within "
        f"{RATE_LIMIT_WINDOW_MIN} min: {len(recent)}"
    )

    if len(recent) >= RATE_LIMIT_MAX_TERMINATIONS:
        print(
            "Rate limit reached for auto-termination; "
            "skipping termination and sending alert"
        )
        _notify_rate_limited(ASG_NAME, hottest_id, hottest_cpu)
        return

    print(
        f"Terminating hot instance {hottest_id} with CPU {hottest_cpu:.2f}, "
        f"ASG={ASG_NAME}"
    )

    autoscaling.terminate_instance_in_auto_scaling_group(
        InstanceId=hottest_id,
        ShouldDecrementDesiredCapacity=False,
    )

    # 종료 성공 시 현재 타임스탬프를 기록하여 rate limit 창에 반영
    recent.append(_now_utc())
    _save_terminations(ASG_NAME, recent)


