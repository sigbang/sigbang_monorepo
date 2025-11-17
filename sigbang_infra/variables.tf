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
  default = "t2.micro"
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

variable "aws_access_key_id" {
  type = string
}

variable "aws_secret_access_key" {
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
# ACM certificate ARN for HTTPS listener
##########################################
variable "acm_certificate_arn" {
  type        = string
  description = "Existing ACM certificate ARN for api.sigbang.com in ap-northeast-2"
}