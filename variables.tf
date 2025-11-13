##########################################
# 기본 설정 변수
##########################################

variable "project_name" {
  type        = string
  default     = "sigbang-api"
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


