import os
import json
import datetime

import boto3


ASG_NAME = os.environ.get("ASG_NAME")
CPU_THRESHOLD = float(os.environ.get("CPU_THRESHOLD", "95"))
LOOKBACK_MIN = int(os.environ.get("LOOKBACK_MIN", "10"))
MIN_IN_SERVICE = int(os.environ.get("MIN_IN_SERVICE", "2"))

autoscaling = boto3.client("autoscaling")
cloudwatch = boto3.client("cloudwatch")


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

    print(
        f"Terminating hot instance {hottest_id} with CPU {hottest_cpu:.2f}, "
        f"ASG={ASG_NAME}"
    )

    autoscaling.terminate_instance_in_auto_scaling_group(
        InstanceId=hottest_id,
        ShouldDecrementDesiredCapacity=False,
    )


