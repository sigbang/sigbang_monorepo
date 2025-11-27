##########################################
# 기본 설정 변수
##########################################

variable "project_name" {
  type    = string
  default = "sigbang-api"
}

variable "aws_region" {
  type    = string
  default = "ap-northeast-2"
}

variable "instance_type" {
  type    = string
  default = "t3.micro"
}

variable "ami_id" {
  type = string
}

variable "key_name" {
  type = string
}

variable "my_ip_cidr" {
  type = string
}

variable "api_image" {
  type = string
}

##########################################
# Web (Next.js) Deployment Variables
##########################################

variable "web_project_name" {
  type    = string
  default = "sigbang-web"
}

variable "web_image" {
  type        = string
  description = "Docker image for Next.js web"
}

variable "web_hostnames" {
  type        = list(string)
  description = "Hostnames that should route to the web app via ALB (e.g., [\"sigbang.com\",\"www.sigbang.com\"])"
  default     = []
}

variable "web_acm_certificate_arn" {
  type        = string
  description = "ACM certificate ARN for the web hostnames (can be same ALB listener via additional certificate)"
  default     = ""
}

variable "web_health_path" {
  type    = string
  default = "/robots.txt"
}

variable "web_site_url" {
  type        = string
  description = "Public site URL (e.g., https://sigbang.com)"
}

variable "web_api_base_url" {
  type        = string
  description = "Public API base URL (e.g., https://api.sigbang.com)"
}

variable "web_supabase_url" {
  type        = string
  description = "Supabase URL for frontend"
}

variable "web_supabase_anon_key" {
  type        = string
  sensitive   = true
  description = "Supabase anon key for frontend"
}

##########################################
# Environment Variables (SSM)
##########################################

# Database
variable "database_url" {
  type      = string
  sensitive = true
}

variable "direct_url" {
  type      = string
  sensitive = true
}

# Supabase
variable "supabase_url" {
  type = string
}

variable "supabase_anon_key" {
  type      = string
  sensitive = true
}

variable "supabase_service_role_key" {
  type      = string
  sensitive = true
}

variable "supabase_storage_bucket" {
  type = string
}

# Google
variable "google_client_id" {
  type = string
}

variable "google_client_secret" {
  type      = string
  sensitive = true
}

# JWT
variable "jwt_secret" {
  type      = string
  sensitive = true
}

variable "jwt_expires_in" {
  type = string
}

# OpenAI
variable "openai_api_key" {
  type      = string
  sensitive = true
}

variable "openai_recipe_model" {
  type = string
}

# Admin
variable "admin_job_secret" {
  type      = string
  sensitive = true
}

# Server
variable "public_base_url" {
  type = string
}

variable "throttle_ttl" {
  type = string
}

variable "throttle_limit" {
  type = string
}

# SES
variable "ses_from_email" {
  type = string
}

variable "ses_to_email" {
  type = string
}

variable "ses_region" {
  type = string
}

##########################################
# Toggle for managing SG rules as separate resources
##########################################
variable "manage_sg_rules" {
  type    = bool
  default = false
}

##########################################
# SSM base path
##########################################
variable "ssm_prefix" {
  type = string
  # e.g. "sigbang-api/production"
}

##########################################
# AWS account id (for IAM policy ARNs)
##########################################
variable "aws_account_id" {
  type = string
}

##########################################
# Existing IAM instance profile name
##########################################
variable "instance_profile_name" {
  type        = string
  description = "Existing IAM instance profile to attach to EC2 instances"
}

##########################################
# Toggle SSM management in this run
##########################################
variable "manage_ssm" {
  type        = bool
  default     = true
  description = "If false, skip creating/updating SSM parameters (useful in CI deploy runs)"
}


##########################################
# GHCR credentials (optional, for private images)
##########################################
variable "ghcr_username" {
  type        = string
  description = "GitHub username for GHCR login (optional)"
}

variable "ghcr_token" {
  type        = string
  sensitive   = true
  description = "GitHub PAT with read:packages (optional)"
}

##########################################
# Docker Hub credentials (optional)
##########################################
variable "dockerhub_username" {
  type        = string
  default     = ""
  description = "Docker Hub username (optional)"
}

variable "dockerhub_token" {
  type        = string
  sensitive   = true
  default     = ""
  description = "Docker Hub access token or PAT (optional)"
}

##########################################
# ACM certificate ARN for HTTPS listener
##########################################
variable "acm_certificate_arn" {
  type        = string
  description = "Existing ACM certificate ARN for api.sigbang.com in ap-northeast-2"
  default     = ""
}

##########################################
# SES domain + Route53 (for domain identity/DKIM/MAIL FROM)
##########################################
variable "ses_domain" {
  type        = string
  description = "Domain to verify in SES (e.g., sigbang.com)"
}

variable "route53_zone_id" {
  type        = string
  description = "Route53 hosted zone ID for the SES domain"
}

variable "mail_from_subdomain" {
  type        = string
  default     = "mail"
  description = "Subdomain for MAIL FROM (e.g., 'mail' -> mail.sigbang.com)"
}

##########################################
# ACM management toggle
##########################################
variable "manage_acm" {
  type        = bool
  default     = false
  description = "If true and ARN vars are empty, automatically provision ACM cert for root/www/api using DNS validation"
}