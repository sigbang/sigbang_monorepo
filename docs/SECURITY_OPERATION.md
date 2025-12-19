## 보안 운영 가이드 (Sigbang 인프라)

이 문서는 Sigbang 프로덕션 인프라(웹·API·인프라 리포지토리)에 대한 **보안 운영 원칙과 실제 대응 절차**를 정리한 것입니다.

---

## 1. 기본 보안 아키텍처 정리

### 1.1 네트워크 / 접근 모델

- **ALB 앞단 단일 진입점**
  - `api_alb` 로 **API(`api.sigbang.com`)와 Web(`sigbang.com`, `www.sigbang.com`) 모두 수용**.
  - 인스턴스는 직접 인터넷에 노출되지 않고, ALB → SG → EC2 경로로만 접근 허용.

- **EC2 접근 원칙**
  - **SSH(22 포트) 인바운드 규칙 제거**, 운영 접속은 **SSM Session Manager만 사용**.
  - EC2 IAM Role 에 `AmazonSSMManagedInstanceCore` 부여되어 있으므로, 
    - `Systems Manager → Session Manager` 또는 `EC2 → Connect → Session Manager` 로 접속.

- **시크릿/환경변수 관리**
  - 애플리케이션 시크릿은 **SSM Parameter Store(SecureString)** 로 관리.
  - EC2 부팅 시 userdata 스크립트가 SSM 을 읽어서 컨테이너 환경 구성.
  - `terraform.tfvars` 는 **로컬 전용**으로 관리하고, 레포에 민감 정보 저장 금지.

### 1.2 관제/모니터링 구성

- **CloudWatch Logs**
  - `/sigbang/api/userdata`, `/sigbang/web/userdata`, `/sigbang/web/app` 등에 EC2 userdata 및 Docker 로그 수집.

- **Auto Scaling / 헬스체크**
  - API / Web 모두 **ASG + Launch Template** 기반 롤링 배포.
  - ALB Target Group 헬스체크와 CloudWatch CPU 알람을 조합해 이상 징후 감지.

- **GuardDuty**
  - `ap-northeast-2` 리전에 GuardDuty Detector 활성화.
  - **중간 이상(severity ≥ 4) Finding** 은 EventBridge Rule 을 통해 `ops_alerts` SNS 로 메일 알림 발송.
  - 채굴/코인 마이너 관련 시그널(`CryptoCurrency:EC2/BitcoinTool.B!DNS`, `Execution:Container/MaliciousFile`, `AttackSequence:EC2/CompromisedInstanceGroup`) 을 중점 관제.

- **WAF (AWS WAFv2)**
  - ALB(`api_alb`) 앞에 **REGIONAL Web ACL 1개**를 붙여 L7 보호.
  - 룰 수는 **대략 10개 이내**로 유지해 복잡도·비용 모두 최적화.

---

## 2. WAF 운영 가이드

### 2.1 기본 정책

- **Web ACL 1개 (REGIONAL)**
  - Scope: REGIONAL
  - Associated resource: `api_alb` (웹/API 공통 보호)

- **룰 구성 (예시)**
  - **AWS Managed Rule Groups (3개)**
    - `AWSManagedRulesCommonRuleSet` – 일반 OWASP Top 10 방어
    - `AWSManagedRulesKnownBadInputsRuleSet` – 전형적인 exploit 입력 차단
    - `AWSManagedRulesSQLiRuleSet` – SQL 인젝션 방어
  - **Rate‑based 룰 (2개)**
    - Global: IP당 5분 2,000 요청 초과 시 차단
    - Auth: `/login`, `/api/auth/*` 에 대해 IP당 5분 200 요청 초과 시 차단
  - **커스텀 룰 (최대 4~5개)**
    - 채굴 관련 키워드: `xmrig`, `supportxmr.com`, `donate.ssl.xmrig.com` 포함 요청 탐지/차단
    - 존재하지 않는 취약 앱 경로: `/phpmyadmin`, `/wp-admin`, `/wp-login.php` 등 → 즉시 차단
    - 위험 페이로드: `bash -c`, `curl http`, `wget http`, `/etc/passwd`, `/etc/shadow` 등 포함 시 차단
    - 필요 시 User-Agent 기반 차단: `curl/`, `Wget`, `python-requests`, `masscan`, `nmap` 등

### 2.2 변경 프로세스 (서비스 영향 최소화)

1. **새 룰 추가 시 기본 원칙**
   - 최초 1~2일은 **`COUNT` 모드(Counter)** 로만 등록하여 실제 트래픽 영향 없이 로그만 관찰.
   - CloudWatch Logs 또는 WAF 로그에서 어떤 URI/UA/IP 가 해당 룰에 걸리는지 확인.

2. **Block 전환 기준**
   - 다음 조건을 모두 만족할 때 **`BLOCK`** 으로 전환:
     - 정상 사용자 플로우(웹/앱에서 사용하는 경로, API 호출)에 해당 룰이 거의/전혀 걸리지 않을 것
     - (Rate 룰의 경우) 합리적인 임계값 이상에서만 트리거 되는지 확인했을 것

3. **롤백 방법**
   - 문제 발생 시:
     - 해당 룰을 다시 `COUNT` 모드로 전환하거나, 
     - 임시로 `Override action: None` 으로 비활성화.
   - 필요 시 Web ACL 와 ALB association 을 제거해 WAF 전체를 우회시키되, 
     단기간 내 원인 분석 후 재적용을 목표로 한다.

---

## 3. GuardDuty 대응 절차

### 3.1 공통 원칙

- **Severity 기준**
  - **8 이상**: 즉시 대응 대상 (채굴/계정 탈취/데이터 유출 징후)
  - **4~7**: 당일 내 로그 분석 및 원인 파악
  - **1~3**: 주간 단위로 모아서 패턴 분석

- **알림 채널**
  - 모든 Finding 은 EventBridge → `ops_alerts` SNS → 메일로 전파.
  - 메일에는 원문 JSON 이 포함되므로, 
    - `type`, `resource.instanceDetails.instanceId`, `service.action`, `severity` 를 우선 확인.

### 3.2 채굴/코인 마이너 관련 Finding

예: `AttackSequence:EC2/CompromisedInstanceGroup`, `CryptoCurrency:EC2/BitcoinTool.B!DNS`, `Execution:Container/MaliciousFile` 등.

1. **해당 인스턴스 식별**
   - `resource.instanceDetails.instanceId` 와 `tags` 로 ASG, 용도(web/api)를 확인.

2. **즉시 영향 차단**
   - 서비스 영향 허용 범위에 따라 아래 중 택 1:
     - 해당 인스턴스를 **ALB Target Group 에서 분리**
     - 또는 ASG `desired_capacity` 를 0 으로 내려 일시적으로 웹/해당 서비스 중단

3. **현 인스턴스(가능하면 SSM Session)에서 1차 확인**
   - CPU/메모리 확인: `top`, `htop`
   - 수상 프로세스: `ps aux | grep javae`, `ps aux | grep xmrig`
   - 실행 파일 경로: `sudo readlink /proc/<PID>/exe`, `sudo readlink /proc/<PID>/cwd`
   - 컨테이너 기반인지 확인: `docker ps`, `docker logs`, `sudo grep -R "javae" /var/lib/docker/overlay2`

4. **포렌식 최소 단위 수집** (선택)
   - 실행 중 바이너리 덤프: `sudo cp /proc/<PID>/exe /tmp/javae_dump`
   - 해당 인스턴스의 CloudWatch Logs, WAF 로그, ALB 액세스 로그 스냅샷.

5. **인스턴스/컨테이너 제거**
   - 감염이 확인된 인스턴스는 **서비스 트래픽에서 완전히 제거 후 Terminate**.
   - 감염 컨테이너는 `docker rm -f <container>` 로 삭제.

6. **ASG 롤링 재배포**
   - Launch Template + userdata + 이미지가 신뢰 가능하다고 판단되면, 
     ASG 에서 새 인스턴스를 롤링으로 띄움.
   - 새 인스턴스에서 **트래픽 열기 전**:
     - `ps aux | grep javae`, `/etc/javae`, `/etc/cc.txt` 등이 없는지 확인.

7. **사후 조치**
   - 관련 시크릿(예: DB 패스워드, 토큰, API 키)은 순차적으로 회전.
   - WAF 룰/Rate limit 을 통해 동일 패턴의 재발을 최대한 차단.

---

## 4. EC2 / SSH / SSM 운영 원칙

### 4.1 SSH 금지 & SSM 우선

- **운영 환경에서는 모든 SSH 인바운드(22/tcp)를 Security Group 에서 제거**.
- EC2 접속이 필요하면 **항상 SSM Session Manager** 를 사용.
  - 장점: 
    - 별도 키 관리 부담 없음,
    - 감사 로그(세션 기록) 남기기 용이,
    - 22 포트를 외부에 열지 않아 공격 표면 감소.

### 4.2 키 페어 관리

- 기존 SSH 키페어(`sigbang-key`)는 더 이상 사용하지 않는 것을 원칙으로 하며, 
  필요하다면 **EC2 콘솔에서 키페어 자체를 삭제**해 재사용을 막는다.
- 테스트/디버깅 목적으로 SSH 가 꼭 필요할 경우에도:
  - 임시 전용 키페어를 만들고,
  - 제한된 시간 동안만 SG 인바운드를 열고,
  - 작업 후 즉시 규칙과 키페어를 제거한다.

---

## 5. 시크릿 및 구성 관리

- **SSM Parameter Store 사용**
  - 모든 민감한 설정은 `/sigbang-api/production/…` 경로 하위 SecureString 으로 저장.
  - EC2 userdata 나 애플리케이션에서 SSM 을 통해 읽어온다.

- **로컬/레포 관리 원칙**
  - `terraform.tfvars` 는 **로컬에서만 관리**하고, Git 에 커밋하지 않는다.
  - 레포에 부득이하게 값이 필요할 때는 **dummy/placeholder 값**만 두고, 실제 값은 SSM/CI 환경변수 장치로 주입.

---

## 6. 변경 관리 & 점검 주기

### 6.1 변경 관리

- 인프라 변경(Terraform 적용, WAF 룰 변경, ASG 스케일 변경)은
  - **작업 티켓/메모** 에 목적, 영향 범위, 롤백 방법을 기록 후 수행.
  - 가능하면 트래픽이 낮은 시간대(야간/주말)에 적용.

### 6.2 정기 점검 (예시)

- **일일 체크**
  - GuardDuty 새 Finding 확인 (특히 severity ≥ 4)
  - CloudWatch 대시보드에서 CPU/네트워크 이상 패턴 확인

- **주간 체크**
  - WAF 로그/Rule 매치 패턴 확인 → 불필요한 오탐/노이즈 룰 조정
  - SSM Parameter / IAM Role / SG 설정 드리프트 여부 점검

- **월간/분기별**
  - OS/런타임/라이브러리 보안 업데이트 적용 계획 수립 및 진행
  - 보안 운영 가이드(본 문서) 리뷰 및 보완

---

이 문서는 **실제 운영 중 발생한 침해 사례(코인 마이너 감염)** 를 기반으로 작성되었습니다. 
새로운 인프라 구성이나 공격 패턴이 확인되면, 해당 내용을 이 문서에 계속 보강해 나가는 것을 원칙으로 합니다.
