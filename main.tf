##########################################
# 기본 VPC/서브넷 정보
##########################################

data "aws_vpc" "default" {
  default = true
}

data "aws_subnets" "default" {
  filter {
    name   = "vpc-id"
    values = [data.aws_vpc.default.id]
  }
}

###########################################
# Security Group (본체)
###########################################

resource "aws_security_group" "api_sg" {
  name        = "${var.project_name}-sg"
  description = "Allow ALB and SSH"
  vpc_id      = data.aws_vpc.default.id

  lifecycle {
    create_before_destroy = true
  }
}

###########################################
# SG Rules (모두 분리)
###########################################

resource "aws_security_group_rule" "api_ssh" {
  count             = var.manage_sg_rules ? 1 : 0
  type              = "ingress"
  description       = "SSH from my IP"
  protocol          = "tcp"
  from_port         = 22
  to_port           = 22
  cidr_blocks       = [var.my_ip_cidr]
  security_group_id = aws_security_group.api_sg.id
}

resource "aws_security_group_rule" "api_http" {
  count             = var.manage_sg_rules ? 1 : 0
  type              = "ingress"
  description       = "API 3000"
  protocol          = "tcp"
  from_port         = 3000
  to_port           = 3000
  cidr_blocks       = ["0.0.0.0/0"]
  security_group_id = aws_security_group.api_sg.id
}

resource "aws_security_group_rule" "api_egress" {
  count             = var.manage_sg_rules ? 1 : 0
  type              = "egress"
  description       = "Allow outbound"
  protocol          = "-1"
  from_port         = 0
  to_port           = 0
  cidr_blocks       = ["0.0.0.0/0"]
  security_group_id = aws_security_group.api_sg.id
}


##########################################
# SSM Parameter Store (.env)
##########################################

locals {
  # Use existing var.ssm_prefix as the full base path (e.g., "sigbang-api/production")
  ssm_base = var.ssm_prefix
}

resource "aws_ssm_parameter" "env_vars" {
  for_each = var.manage_ssm ? {
    DATABASE_URL              = var.database_url
    DIRECT_URL                = var.direct_url
    SUPABASE_URL              = var.supabase_url
    SUPABASE_ANON_KEY         = var.supabase_anon_key
    SUPABASE_SERVICE_ROLE_KEY = var.supabase_service_role_key
    SUPABASE_STORAGE_BUCKET   = var.supabase_storage_bucket
    GOOGLE_CLIENT_ID          = var.google_client_id
    JWT_SECRET                = var.jwt_secret
    JWT_EXPIRES_IN            = var.jwt_expires_in
    OPENAI_API_KEY            = var.openai_api_key
    OPENAI_RECIPE_MODEL       = var.openai_recipe_model
    PUBLIC_BASE_URL           = var.public_base_url
    THROTTLE_TTL              = var.throttle_ttl
    THROTTLE_LIMIT            = var.throttle_limit
    ADMIN_JOB_SECRET          = var.admin_job_secret
    SES_FROM_EMAIL            = var.ses_from_email
    SES_TO_EMAIL              = var.ses_to_email
    AWS_ACCESS_KEY_ID         = var.aws_access_key_id
    AWS_SECRET_ACCESS_KEY     = var.aws_secret_access_key
    SES_REGION                = var.ses_region
  } : {}

  name  = "/${local.ssm_base}/${each.key}"
  type  = "SecureString"
  value = each.value
  overwrite = true
}

##########################################
# IAM Role (EC2가 SSM 읽기)
##########################################

resource "aws_iam_role" "api_ec2_role" {
  name = "${var.project_name}-ec2-role"
  assume_role_policy = data.aws_iam_policy_document.ec2_trust.json

  lifecycle {
    create_before_destroy = true
  }
}

data "aws_iam_policy_document" "ec2_trust" {
  statement {
    actions = ["sts:AssumeRole"]

    principals {
      type        = "Service"
      identifiers = ["ec2.amazonaws.com"]
    }
  }
}

resource "aws_iam_role_policy" "api_ssm_policy" {
  name   = "${var.project_name}-ssm-policy"
  role   = aws_iam_role.api_ec2_role.id
  policy = data.aws_iam_policy_document.ssm_policy.json
}

data "aws_iam_policy_document" "ssm_policy" {
  statement {
    actions = [
      "ssm:GetParameter",
      "ssm:GetParametersByPath"
    ]
    resources = ["arn:aws:ssm:${var.aws_region}:${var.aws_account_id}:parameter/${var.ssm_prefix}/*"]
  }
}



##########################################
# ALB + Listener
##########################################

resource "aws_lb" "api_alb" {
  name               = "${var.project_name}-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.api_sg.id]
  subnets            = data.aws_subnets.default.ids

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_lb_target_group" "api_tg" {
  name     = "${var.project_name}-tg"
  port     = 3000
  protocol = "HTTP"
  vpc_id   = data.aws_vpc.default.id

  health_check {
    path                = "/health"
    timeout             = 5
    unhealthy_threshold = 2
  }

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_lb_listener" "http" {
  load_balancer_arn = aws_lb.api_alb.arn
  port              = 80
  protocol          = "HTTP"
  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.api_tg.arn
  }
}

##########################################
# Launch Template
##########################################

resource "aws_launch_template" "api_lt" {
  name_prefix   = "${var.project_name}-lt-"
  image_id      = var.ami_id
  instance_type = var.instance_type
  key_name      = var.key_name

  iam_instance_profile {
    name = var.instance_profile_name
  }

  network_interfaces {
    associate_public_ip_address = true
    security_groups             = [aws_security_group.api_sg.id]
  }

  user_data = base64encode(templatefile("${path.module}/scripts/userdata.sh", {
    ssm_prefix   = local.ssm_base
    region       = var.aws_region
    docker_image = var.api_image
  }))

  lifecycle {
    create_before_destroy = true
  }
}

##########################################
# Auto Scaling Group (롤링 배포)
##########################################

resource "aws_autoscaling_group" "api_asg" {
  name                = "${var.project_name}-asg"
  vpc_zone_identifier = data.aws_subnets.default.ids
  max_size            = 2
  min_size            = 1
  desired_capacity    = 1
  target_group_arns   = [aws_lb_target_group.api_tg.arn]

  launch_template {
    id      = aws_launch_template.api_lt.id
    version = "$Latest"
  }

  instance_refresh {
    strategy = "Rolling"
    preferences {
      min_healthy_percentage = 50
      instance_warmup        = 30
    }
    triggers = ["launch_template"]
  }

  lifecycle {
    ignore_changes        = [desired_capacity]
    create_before_destroy = true
  }
}

##########################################
# Output
##########################################

output "alb_dns_name" {
  value = aws_lb.api_alb.dns_name
}
