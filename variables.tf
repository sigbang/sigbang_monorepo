variable "aws_region" {
  description = "AWS region"
  default     = "ap-northeast-2"
}

variable "project_name" {
  description = "Project name"
  default     = "sigbang-api"
}

variable "instance_type" {
  description = "Instance type for ASG"
  default     = "t2.micro"
}

variable "key_name" {
  description = "EC2 Key Pair name"
  default     = "sigbang-key"
}
