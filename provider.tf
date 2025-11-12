terraform {
  required_version = ">= 1.4.0"

  backend "s3" {
    bucket = "sigbang-terraform-state"
    key    = "infra/terraform.tfstate"
    region = "ap-northeast-2"
  }
}

provider "aws" {
  region = var.aws_region
}
