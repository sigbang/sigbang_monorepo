## Sigbang API/Web 모니터링 & 자동 복구 플로우

### 목적

- **CPU/트래픽 스파이크로 인해 API 인스턴스가 먹통이 되는 상황을 최소화**한다.
- 사람이 개입하기 전에, **가능한 범위까지 자동으로 완화/복구**한다.
- 모든 자동 액션은 **보수적인 임계치 + 안전장치**를 두어 과도한 재시작/교체를 방지한다.

---

## 구성 요약

- **인프라**
  - **API Auto Scaling Group**: `aws_autoscaling_group.api_asg`
  - **ALB + Target Group**: `aws_lb.api_alb`, `aws_lb_target_group.api_tg` (헬스 체크 `"/health"`)
  - **Web Auto Scaling Group**: `aws_autoscaling_group.web_asg`
  - **Web Target Group**: `aws_lb_target_group.web_tg` (헬스 체크 `web_health_path`, 기본 `"/robots.txt"`)

- **모니터링 / 알람 (`monitoring.tf`)**
  - **CPU Target Tracking 스케일링**
    - `aws_autoscaling_policy.api_cpu_target_scaling`
    - 메트릭: `ASGAverageCPUUtilization`
    - 타깃값: 50% (평균 CPU가 50% 근처에 머물도록 인스턴스 수 자동 조정)
    - Web 도 동일 구조: `aws_autoscaling_policy.web_cpu_target_scaling`
  - **CPU 고사용 알람 (운영 참고용)**  
    - `aws_cloudwatch_metric_alarm.api_cpu_high`
    - 조건: API ASG 평균 CPU ≥ 70% 가 3분 지속
    - 액션: `ops_alerts` SNS → 메일 알림
    - Web ASG 도 동일 구조: `aws_cloudwatch_metric_alarm.web_cpu_high`
  - **장기 고사용 알람 (자동 복구 트리거)**  
    - `aws_cloudwatch_metric_alarm.api_cpu_hot`
    - 조건: API ASG 평균 CPU ≥ 80% 가 10분 지속
    - 액션:
      - `ops_alerts` SNS → 메일 알림
      - EventBridge Rule(`cpu_hot_instance_rule`) → Lambda 자동 복구
    - Web ASG 도 동일 구조: `aws_cloudwatch_metric_alarm.web_cpu_hot` + `web_cpu_hot_instance_rule`
  - **ALB 5xx 알람**
    - `aws_cloudwatch_metric_alarm.api_alb_5xx_high`
    - 조건: ALB Target 5xx 5분 합계 ≥ 20
    - 액션: `ops_alerts` SNS → 메일 알림
  - **지속적인 헬스체크 실패(UnHealthyHostCount) 알람**
    - API: `aws_cloudwatch_metric_alarm.api_tg_unhealthy_persistent`
      - 메트릭: `AWS/ApplicationELB`, `UnHealthyHostCount`
      - 조건: Target Group 내 UnHealthyHostCount ≥ 1 이 10분 연속 지속
      - 액션: `ops_alerts` SNS → 메일 알림 (배포/환경 문제 가능성 높음)
    - Web: `aws_cloudwatch_metric_alarm.web_tg_unhealthy_persistent`
      - 동일 구조로 Web Target Group 에 적용

- **로그 수집 (`monitoring.tf`, `scripts/`)**
  - CloudWatch Log Group:
    - API 인스턴스 `userdata`: `/sigbang/api/userdata`
    - Web 인스턴스 `userdata`: `/sigbang/web/userdata`
  - EC2 `userdata` 스크립트:
    - `scripts/userdata.sh`
    - `scripts/userdata-web.sh`
  - 역할:
    - CloudWatch Agent 설치(공식 S3 배포판 사용)
    - `/var/log/userdata*.log` 를 위 Log Group 으로 전송

- **자동 복구 (고 CPU 인스턴스 교체)**
  - Lambda 코드(공용): `lambda/terminate_hot_instance.py`
  - Lambda 함수:
    - API: `aws_lambda_function.terminate_hot_instance`
    - Web: `aws_lambda_function.terminate_hot_web_instance`
  - Lambda IAM Role/Policy:
    - `aws_iam_role.lambda_terminate_hot_instance_role`
    - `aws_iam_role_policy.lambda_terminate_hot_instance_policy`
  - Rate limiting 저장소 (무한 자동 교체 방지):
    - DynamoDB Table: `aws_dynamodb_table.lambda_terminate_hot_rate_limit`
      - 파티션 키: `asg_name` (각 ASG 별로 최근 종료 이력 관리)
  - EventBridge:
    - API:
      - Rule: `aws_cloudwatch_event_rule.cpu_hot_instance_rule`
      - Target: `aws_cloudwatch_event_target.cpu_hot_instance_target`
      - Lambda Permission: `aws_lambda_permission.terminate_hot_instance_eventbridge`
    - Web:
      - Rule: `aws_cloudwatch_event_rule.web_cpu_hot_instance_rule`
      - Target: `aws_cloudwatch_event_target.web_cpu_hot_instance_target`
      - Lambda Permission: `aws_lambda_permission.terminate_hot_web_instance_eventbridge`

---

## 전체 흐름

### 1. 평상시 스케일링 & 모니터링

- **Target Tracking 스케일링**
  - API ASG 평균 CPU를 50% 근처로 유지하려고 시도한다.
  - 부하 증가 시 인스턴스 수를 1 → 2 → 3대로 자동 확장(최대 3대).

- **일반 CPU/에러 모니터링**
  - `api_cpu_high` (70% 3분)  
    - 짧은 구간의 부하 상승을 사람이 빠르게 인지할 수 있도록 메일로 알림.
  - `api_alb_5xx_high` (5분 동안 5xx 20건 이상)  
    - 애플리케이션 레벨 장애 징후를 조기에 알림.

### 2. 장기 고사용 감지 (`api_cpu_hot`)

- **조건**
  - 메트릭: `AWS/EC2`, `CPUUtilization`
  - 차원: `AutoScalingGroupName = api_asg`
  - `period = 60`, `evaluation_periods = 10`
  - 조건: **평균 CPU ≥ 80% 가 10분 연속**

- **알람 발생 시**
  - `api_cpu_hot` 상태: `OK` → `ALARM` 전환
  - SNS (`ops_alerts`) 로 메일 알림 발송
  - 동시에 EventBridge Rule `cpu_hot_instance_rule` 이 해당 알람 이벤트를 매칭하여 Lambda 트리거

> Web ASG 도 동일 구조로, `web_cpu_hot` + `web_cpu_hot_instance_rule` 조합으로 동작한다.

### 3. EventBridge → Lambda 실행

- **EventBridge Rule 조건**
  - `source`: `"aws.cloudwatch"`
  - `detail-type`: `"CloudWatch Alarm State Change"`
  - `detail.alarmName`: `api_cpu_hot`
  - `detail.state.value`: `"ALARM"`
  - `detail.previousState.value`: `"OK"`  
    → **OK → ALARM** 으로 전환되는 순간에만 Lambda 를 실행하여  
    같은 ALARM 상태에서 반복 호출되는 것을 방지한다.

- **Target**
  - API: `aws_lambda_function.terminate_hot_instance`
  - Web: `aws_lambda_function.terminate_hot_web_instance`

### 4. Lambda 자동 복구 로직 (`terminate_hot_instance.py`)

- **환경 변수**
  - `ASG_NAME`: 대상 Auto Scaling Group 이름 (`api_asg` / `web_asg`)
  - `CPU_THRESHOLD`: `"95"`  
    → 인스턴스 개별 CPU 평균이 이 값 이상일 때 교체 후보
  - `LOOKBACK_MIN`: `"10"`  
    → 최근 10분 간의 CPU 데이터를 기준으로 판단
  - `MIN_IN_SERVICE`: `"2"` (API), `"1"` (Web)  
    → InService 인스턴스가 최소 이 개수 이상일 때만 자동 교체 수행
  - **Rate limiting 관련**
    - `RATE_LIMIT_TABLE`: DynamoDB 테이블 이름 (`lambda_terminate_hot_rate_limit`)
    - `RATE_LIMIT_MAX_TERMINATIONS`: `"3"`  
      → **동일 ASG 에 대해 Rate limit 윈도우 동안 허용되는 최대 자동 종료 횟수**
    - `RATE_LIMIT_WINDOW_MIN`: `"30"`  
      → 최근 30분 간의 종료 횟수를 기준으로 rate limit 계산
    - `OPS_ALERT_TOPIC_ARN`: `ops_alerts` SNS ARN (rate limit 발생 시 알림 발송용)

- **단계별 로직**
  0. **최근 종료 이력 조회 (Rate limiting)**
     - `RATE_LIMIT_TABLE` (DynamoDB) 에서 `asg_name = ASG_NAME` 항목을 읽어,  
       최근 `RATE_LIMIT_WINDOW_MIN` 분 안에 기록된 종료 타임스탬프 개수를 센다.
     - 개수가 `RATE_LIMIT_MAX_TERMINATIONS` 이상이면:
       - **더 이상 인스턴스를 종료하지 않고**,  
       - `ops_alerts` SNS 로 "rate limit 에 걸려 자동 복구 중단" 알림만 발송 후 함수 종료.
  1. **ASG 조회**
     - `DescribeAutoScalingGroups` 로 `ASG_NAME` 에 해당하는 그룹 조회.
     - `LifecycleState == "InService"` 인 인스턴스 목록만 사용.
  2. **안전장치: 최소 인스턴스 수 확인**
     - `InService` 갯수 `< MIN_IN_SERVICE` 이면 **자동 교체를 수행하지 않고 종료**  
       (스케일인 직후 1대만 남은 상황 등에서 과도한 종료 방지).
  3. **각 인스턴스별 CPU 수집**
     - `cloudwatch:GetMetricStatistics` 로 각 인스턴스에 대해:
       - Namespace: `AWS/EC2`
       - MetricName: `CPUUtilization`
       - Dimensions: `InstanceId = <ID>`
       - 기간: `LOOKBACK_MIN` 분
       - Period: 60초
       - Statistics: `Average`
     - 각 인스턴스의 **가장 최근 데이터 포인트의 평균 CPU** 를 기록.
  4. **가장 뜨거운 인스턴스 선택**
     - InService 인스턴스 중, 최근 평균 CPU가 가장 높은 인스턴스를 `hottest_id` 로 선택.
     - `hottest_cpu < CPU_THRESHOLD(95)` 인 경우:
       - 아직 “교체할 정도로 심각하지 않다” 판단 → 로그만 남기고 종료.
  5. **조건을 만족할 때 인스턴스 교체**
     - `hottest_cpu ≥ CPU_THRESHOLD` 이고 `InService >= MIN_IN_SERVICE` 일 때:
       - `TerminateInstanceInAutoScalingGroup(InstanceId=hottest_id, ShouldDecrementDesiredCapacity=false)` 호출.
       - 해당 인스턴스는 종료되고, ASG 가 같은 DesiredCapacity를 유지하기 위해 **새 인스턴스 1대를 자동 생성**.
  6. **종료 이력 업데이트 (Rate limiting)**
     - 종료가 정상적으로 수행되면, 현재 시각을 기존 종료 이력 리스트에 추가하고  
       DynamoDB 테이블에 다시 저장한다.

- **의도**
  - ASG 전체가 이미 뜨거운 상황(`api_cpu_hot` 조건)에 한 번 더 필터링을 걸어:
    - **가장 부담을 주는 인스턴스 1대를 교체**함으로써 상태가 꼬인 인스턴스를 제거.
  - 너무 공격적으로 동작하지 않도록:
    - 80%/10분 + 95%/인스턴스 + `MIN_IN_SERVICE` + **Rate limiting (N회/시간 윈도우)** 등의 조건으로 방어막을 겹겹이 둔다.
  - 특히 Rate limiting 덕분에:
    - 코드/DB/외부 API 장애로 인해 CPU/알람이 계속 발생하더라도  
      **일정 횟수 이상 자동 교체가 반복되지 않도록 “급브레이크” 역할**을 한다.

---

## 운영 체크리스트

### 배포 직후 1회 확인

- **Terraform**
  - `terraform init` (archive provider 포함 초기화)
  - `terraform validate`
  - `terraform plan`
  - `terraform apply`

- **CloudWatch / Lambda 설정 점검**
  - Lambda 함수:
    - 이름: `${project_name}-terminate-hot-instance` (예: `sigbang-api-terminate-hot-instance`)
      - Web: `${web_project_name}-terminate-hot-instance` (예: `sigbang-web-terminate-hot-instance`)
    - 환경 변수:
      - `ASG_NAME` 가 실제 각 ASG 이름과 일치하는지 (`api_asg` / `web_asg`)
      - `CPU_THRESHOLD = 95`, `LOOKBACK_MIN = 10`, `MIN_IN_SERVICE = 2(API)/1(Web)`
      - `RATE_LIMIT_TABLE` 가 실제 DynamoDB 테이블 이름과 일치하는지
      - `RATE_LIMIT_MAX_TERMINATIONS = 3`, `RATE_LIMIT_WINDOW_MIN = 30`
      - `OPS_ALERT_TOPIC_ARN` 이 `ops_alerts` SNS ARN 과 일치하는지
  - EventBridge Rule:
    - `sigbang-api-cpu-hot-instance-rule`, `sigbang-web-cpu-hot-instance-rule` 존재 여부
    - 각 Rule 의 Target 에 올바른 Lambda 가 연결되어 있는지
    - Event pattern 에 `detail.previousState.value = "OK"` 조건이 포함되어 있는지
  - CloudWatch 알람:
    - `api_cpu_high`, `api_cpu_hot`, `api_alb_5xx_high` 상태가 `OK` 인지
    - Web 관련: `web_cpu_high`, `web_cpu_hot` 상태가 `OK` 인지
    - 헬스체크 지속 실패 감지용:
      - `api_tg_unhealthy_persistent`, `web_tg_unhealthy_persistent` 가 존재하고 `OK` 인지
  - Logs:
    - `/sigbang/api/userdata`, `/sigbang/web/userdata` 에 각 인스턴스별 스트림 생성 여부
    - Lambda 로그 그룹에 실행 로그가 쌓이는지 (테스트 실행 시)

### 장애/알람 발생 시 운영 Runbook

- **1) 메일 알람 확인**
  - `api_cpu_hot`, `api_cpu_high`, `api_alb_5xx_high`, `api_tg_unhealthy_persistent`  
    및 Web 측 `web_cpu_hot`, `web_cpu_high`, `web_tg_unhealthy_persistent` 중  
    어떤 알람이 언제 발생했는지 확인.

- **2) Lambda 자동 복구 동작 여부 확인**
  - CloudWatch Logs → Lambda 로그:
    - `"InService instances in ..."`, `"average CPU"`, `"Terminating hot instance ..."` 등의 메시지를 통해:
      - 어떤 인스턴스가 고 CPU였는지
      - 실제로 교체가 이루어졌는지 확인.
     - `"Rate limit reached for auto-termination"` 로그가 있다면:
       - **Rate limiting 에 걸려 더 이상 자동 종료를 하지 않는 상태**이므로,
       - 애플리케이션/DB/외부 API 상태를 우선적으로 조사하고 수동 대응을 고려.

- **3) ASG / Target Health 확인**
  - `api_asg` 의 **InService 인스턴스 수**가 기대값(최소 2대 이상)인지.
  - `web_asg` 의 InService 인스턴스 수가 최소 1대 이상인지.
  - ALB Target Health 에서:
    - 새로 생성된 인스턴스가 `healthy` 로 전환되었는지.
    - `*_tg_unhealthy_persistent` 알람이 뜬 경우:
      - 새 인스턴스들이 헬스체크를 통과하지 못하고 계속 unhealthy 로 남아 있는지 확인.

- **4) 원인 분석 필요 시**
  - 교체된 인스턴스에 대해:
    - EC2 `userdata` 로그(`/sigbang/api/userdata`)
    - 애플리케이션 로그 (필요 시 CloudWatch 로그 그룹 추가 후 사용) 확인.
  - 동일 시간대 DB/Supabase/외부 API 지연 여부 확인.

- **5) 알람/교체가 반복될 경우**
  - 임계치/기간 재조정:
    - `api_cpu_hot` 의 threshold(예: 80→85) 또는 evaluation_periods(10→12) 조정.
    - Lambda 환경 변수 `CPU_THRESHOLD`, `LOOKBACK_MIN`, `MIN_IN_SERVICE` 튜닝.
    - Rate limiting 파라미터:
      - `RATE_LIMIT_MAX_TERMINATIONS` (예: 3→2/4)  
      - `RATE_LIMIT_WINDOW_MIN` (예: 30→20/60) 를 조정해  
        자동 복구의 공격성을 조절.
  - 반복적으로 문제를 일으키는 특정 엔드포인트/쿼리가 있다면:
    - 코드/쿼리 튜닝, 캐싱, 별도 워커/배치로 분리 등 구조 개선.

---

## 튜닝 가이드

- **안정성 우선 모드**
  - 트래픽이 아직 작고, 장애가 더 무서운 단계라면:
    - ASG `min_size` 를 2로 올려 여유 인스턴스를 확보.
    - `MIN_IN_SERVICE = 2` 를 유지한 채, `CPU_THRESHOLD` 를 95~98 수준으로 보수적으로 유지.

- **비용 최적화 모드**
  - 안정성이 충분히 검증된 뒤, 비용을 조금 줄이고 싶다면:
    - `api_cpu_hot` 의 threshold 를 다소 높이거나 evaluation_periods 를 늘려  
      “정말 심각한 상황”일 때만 Lambda 가 동작하게 조정.
    - Target Tracking 스케일링의 타깃값(50%)을 55~60으로 올려 평균 CPU를 조금 높게 가져가는 것도 가능.

이 문서는 Sigbang API 인프라의 **CPU/부하 기반 자동 복구 전략**의 기준선이며,  
실제 운영 데이터(알람 빈도, Lambda 로그, 장애 사례)를 바탕으로 **임계치·기간·파라미터를 주기적으로 재검토**하는 것을 권장한다.

