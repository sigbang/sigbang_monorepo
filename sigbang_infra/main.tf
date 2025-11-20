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
# Security Group (ALB 전용)
###########################################

resource "aws_security_group" "alb_sg" {
  name        = "${var.project_name}-alb-sg"
  description = "Allow 80/443 from internet to ALB"
  vpc_id      = data.aws_vpc.default.id

  # Egress all
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

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

resource "aws_security_group_rule" "api_ssh_eic" {
  count             = var.manage_sg_rules ? 1 : 0
  type              = "ingress"
  description       = "SSH for EC2 Instance Connect"
  protocol          = "tcp"
  from_port         = 22
  to_port           = 22
  cidr_blocks       = ["0.0.0.0/0"]
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

###########################################
# SG Rules (보안 강화 - ALB/APP 분리)
###########################################

# ALB: 80/443 인바운드 개방
resource "aws_security_group_rule" "alb_http_80" {
  type              = "ingress"
  description       = "ALB HTTP 80"
  protocol          = "tcp"
  from_port         = 80
  to_port           = 80
  cidr_blocks       = ["0.0.0.0/0"]
  security_group_id = aws_security_group.alb_sg.id
}

resource "aws_security_group_rule" "alb_https_443" {
  type              = "ingress"
  description       = "ALB HTTPS 443"
  protocol          = "tcp"
  from_port         = 443
  to_port           = 443
  cidr_blocks       = ["0.0.0.0/0"]
  security_group_id = aws_security_group.alb_sg.id
}

# APP(EC2): 3000은 ALB에서만 접근 허용
resource "aws_security_group_rule" "app_from_alb_3000" {
  type                     = "ingress"
  description              = "App 3000 from ALB SG"
  protocol                 = "tcp"
  from_port                = 3000
  to_port                  = 3000
  security_group_id        = aws_security_group.api_sg.id
  source_security_group_id = aws_security_group.alb_sg.id
}


##########################################
# SSM Parameter Store (.env)
##########################################

locals {
  # Use existing var.ssm_prefix as the full base path (e.g., "sigbang-api/production")
  ssm_base = var.ssm_prefix

  # Fingerprint changes to env/tfvars to force LT user_data updates and trigger ASG refresh
  refresh_fingerprint = md5(jsonencode({
    database_url              = var.database_url
    direct_url                = var.direct_url
    supabase_url              = var.supabase_url
    supabase_anon_key         = var.supabase_anon_key
    supabase_service_role_key = var.supabase_service_role_key
    supabase_storage_bucket   = var.supabase_storage_bucket
    google_client_id          = var.google_client_id
    jwt_secret                = var.jwt_secret
    jwt_expires_in            = var.jwt_expires_in
    openai_api_key            = var.openai_api_key
    openai_recipe_model       = var.openai_recipe_model
    public_base_url           = var.public_base_url
    web_base_url              = var.web_base_url
    throttle_ttl              = var.throttle_ttl
    throttle_limit            = var.throttle_limit
    admin_job_secret          = var.admin_job_secret
    ses_from_email            = var.ses_from_email
    ses_to_email              = var.ses_to_email
    ses_region                = var.ses_region
    ghcr_username             = try(var.ghcr_username, "")
    ghcr_token                = try(var.ghcr_token, "")
  }))
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
    WEB_BASE_URL              = var.web_base_url
    THROTTLE_TTL              = var.throttle_ttl
    THROTTLE_LIMIT            = var.throttle_limit
    ADMIN_JOB_SECRET          = var.admin_job_secret
    SES_FROM_EMAIL            = var.ses_from_email
    SES_TO_EMAIL              = var.ses_to_email
    SES_REGION                = var.ses_region
    SES_CONFIGURATION_SET     = "${var.project_name}-default"
    GHCR_USERNAME             = try(var.ghcr_username, null)
    GHCR_TOKEN                = try(var.ghcr_token, null)
  } : {}

  name      = "/${local.ssm_base}/${each.key}"
  type      = "SecureString"
  value     = each.value
  overwrite = true
}

##########################################
# IAM Role (EC2가 SSM 읽기)
##########################################

resource "aws_iam_role" "api_ec2_role" {
  name               = "${var.project_name}-ec2-role"
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

resource "aws_iam_role_policy" "api_ses_policy" {
  name = "${var.project_name}-ses-policy"
  role = aws_iam_role.api_ec2_role.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect   = "Allow"
      Action   = ["ses:SendEmail", "ses:SendRawEmail"]
      Resource = "*"
    }]
  })
}

resource "aws_iam_instance_profile" "api_instance_profile" {
  name = var.instance_profile_name
  role = aws_iam_role.api_ec2_role.name
}

data "aws_iam_policy_document" "ssm_policy" {
  statement {
    actions = [
      "ssm:GetParameter",
      "ssm:GetParameters",
      "ssm:GetParametersByPath"
    ]
    resources = ["*"]
  }

  # Allow decrypting SSM SecureString values encrypted with AWS managed SSM key
  statement {
    actions = [
      "kms:Decrypt"
    ]
    resources = ["*"]
  }
}

##########################################
# ALB + Listener
##########################################

resource "aws_lb" "api_alb" {
  name               = "${var.project_name}-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb_sg.id]
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

# HTTPS Listener (443)
resource "aws_lb_listener" "https" {
  load_balancer_arn = aws_lb.api_alb.arn
  port              = 443
  protocol          = "HTTPS"
  ssl_policy        = "ELBSecurityPolicy-2016-08"
  certificate_arn   = var.acm_certificate_arn

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.api_tg.arn
  }
}

# HTTP → HTTPS Redirect (80)
resource "aws_lb_listener" "http" {
  load_balancer_arn = aws_lb.api_alb.arn
  port              = 80
  protocol          = "HTTP"
  default_action {
    type = "redirect"
    redirect {
      protocol    = "HTTPS"
      port        = "443"
      status_code = "HTTP_301"
    }
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
    name = aws_iam_instance_profile.api_instance_profile.name
  }

  network_interfaces {
    associate_public_ip_address = true
    security_groups             = [aws_security_group.api_sg.id]
  }

  user_data = base64encode(templatefile("${path.module}/scripts/userdata.sh", {
    ssm_prefix          = local.ssm_base
    region              = var.aws_region
    docker_image        = var.api_image
    refresh_fingerprint = local.refresh_fingerprint
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

  tag {
    key                 = "Name"
    value               = "${var.project_name}-api"
    propagate_at_launch = true
  }

  launch_template {
    id      = aws_launch_template.api_lt.id
    version = tostring(aws_launch_template.api_lt.latest_version)
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
# SES Domain Identity, DKIM, MAIL FROM, Config Set
##########################################

resource "aws_ses_domain_identity" "ses_domain" {
  domain = var.ses_domain
}

resource "aws_route53_record" "ses_verification" {
  zone_id = var.route53_zone_id
  name    = "_amazonses.${var.ses_domain}"
  type    = "TXT"
  ttl     = 600
  records = [aws_ses_domain_identity.ses_domain.verification_token]
}

resource "aws_ses_domain_identity_verification" "ses_domain_verified" {
  domain     = aws_ses_domain_identity.ses_domain.id
  depends_on = [aws_route53_record.ses_verification]
}

resource "aws_ses_domain_dkim" "ses_dkim" {
  domain = aws_ses_domain_identity.ses_domain.domain
}

resource "aws_route53_record" "ses_dkim_records" {
  count   = 3
  zone_id = var.route53_zone_id
  name    = "${aws_ses_domain_dkim.ses_dkim.dkim_tokens[count.index]}._domainkey.${var.ses_domain}"
  type    = "CNAME"
  ttl     = 600
  records = ["${aws_ses_domain_dkim.ses_dkim.dkim_tokens[count.index]}.dkim.amazonses.com"]
}

resource "aws_ses_domain_mail_from" "ses_mail_from" {
  domain           = aws_ses_domain_identity.ses_domain.domain
  mail_from_domain = "${var.mail_from_subdomain}.${var.ses_domain}"
}

resource "aws_route53_record" "ses_mail_from_mx" {
  zone_id = var.route53_zone_id
  name    = aws_ses_domain_mail_from.ses_mail_from.mail_from_domain
  type    = "MX"
  ttl     = 600
  records = ["10 feedback-smtp.${var.ses_region}.amazonses.com"]
}

resource "aws_route53_record" "ses_mail_from_spf" {
  zone_id = var.route53_zone_id
  name    = aws_ses_domain_mail_from.ses_mail_from.mail_from_domain
  type    = "TXT"
  ttl     = 600
  records = ["v=spf1 include:amazonses.com -all"]
}

# DMARC policy for the root domain
resource "aws_route53_record" "ses_dmarc" {
  zone_id = var.route53_zone_id
  name    = "_dmarc.${var.ses_domain}"
  type    = "TXT"
  ttl     = 600
  records = [
    "v=DMARC1; p=none; rua=mailto:support@${var.ses_domain}; ruf=mailto:support@${var.ses_domain}; fo=1; adkim=r; aspf=r; sp=none"
  ]
}

resource "aws_sesv2_configuration_set" "ses_config_set" {
  configuration_set_name = "${var.project_name}-default"
  delivery_options {
    tls_policy = "REQUIRE"
  }
}

##########################################
# Route53: Root domain email records (Google Workspace)
##########################################

# Domain verification CNAME (Google Workspace)
resource "aws_route53_record" "google_workspace_domain_verification" {
  zone_id = var.route53_zone_id
  name    = "jyuehr4qumgy"
  type    = "CNAME"
  ttl     = 600
  records = ["gv-u2jznzj6k25fnz.dv.googlehosted.com."]
}

# Root MX for Google Workspace
resource "aws_route53_record" "google_workspace_mx" {
  zone_id = var.route53_zone_id
  name    = var.ses_domain
  type    = "MX"
  ttl     = 600
  records = [
    "1 ASPMX.L.GOOGLE.COM.",
    "5 ALT1.ASPMX.L.GOOGLE.COM.",
    "5 ALT2.ASPMX.L.GOOGLE.COM.",
    "10 ALT3.ASPMX.L.GOOGLE.COM.",
    "10 ALT4.ASPMX.L.GOOGLE.COM."
  ]
}

# Root SPF to allow Gmail and SES sending
resource "aws_route53_record" "root_spf" {
  zone_id = var.route53_zone_id
  name    = var.ses_domain
  type    = "TXT"
  ttl     = 600
  records = [
    "v=spf1 include:_spf.google.com include:amazonses.com ~all"
  ]
}

##########################################
# Route53: api.<domain> → ALB
##########################################

resource "aws_route53_record" "api_a_alias" {
  zone_id = var.route53_zone_id
  name    = "api"
  type    = "A"

  alias {
    name                   = aws_lb.api_alb.dns_name
    zone_id                = aws_lb.api_alb.zone_id
    evaluate_target_health = false
  }
}

resource "aws_route53_record" "api_aaaa_alias" {
  zone_id = var.route53_zone_id
  name    = "api"
  type    = "AAAA"

  alias {
    name                   = aws_lb.api_alb.dns_name
    zone_id                = aws_lb.api_alb.zone_id
    evaluate_target_health = false
  }
}

##########################################
# Output
##########################################

output "alb_dns_name" {
  value = aws_lb.api_alb.dns_name
}
