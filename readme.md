# 🏗️ Sigbang Infra (Terraform IaC)

Sigbang 인프라스트럭처를 **Terraform + AWS + GitHub Actions** 기반으로 관리하는 IaC(Infrastructure as Code) 저장소입니다.  
이 저장소에 커밋되는 코드가 곧 실제 AWS 인프라로 반영됩니다. 🚀


---

## 📁 프로젝트 구조
sigbang_infra/
├── .github/
│ └── workflows/
│ └── terraform.yml # GitHub Actions CI/CD (자동 배포)
├── main.tf # 인프라 정의 (ALB, ASG, EC2 등)
├── provider.tf # AWS Provider + S3 Backend 설정
├── variables.tf # 변수 정의
├── outputs.tf # 출력값 (ALB 주소 등)
└── README.md

--

## ⚙️ 인프라 구성 요소

| 리소스 | 설명 |
|--------|------|
| **VPC (기본)** | AWS 기본 VPC 재사용 |
| **Security Group** | ALB/SSH 트래픽 관리 |
| **ALB** | Application Load Balancer (`sigbang-api-alb`) |
| **Target Group** | `/health` 헬스체크 관리 |
| **Launch Template** | Ubuntu + Docker 기반 API 서버 런칭 |
| **Auto Scaling Group** | EC2 자동 확장 및 복구 |
| **S3 Backend** | Terraform state 파일 저장 (`sigbang-terraform-state`) |
| **GitHub Actions** | main 브랜치 커밋 시 자동 배포 |

---

## 🧱 사용 기술

- **Terraform v1.8+**
- **AWS (EC2, ALB, ASG, S3, IAM)**
- **GitHub Actions**
- **Infrastructure as Code (IaC) 기반 배포**

---

## 🚀 배포 및 실행 절차

### 1️⃣ 로컬에서 Terraform 실행 (테스트용)
```bash
terraform init
terraform plan
terraform apply