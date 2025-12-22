##########################################
# Web (Next.js) on EC2 + ALB
##########################################

# Separate SG for web instances
resource "aws_security_group" "web_sg" {
  name        = "${var.web_project_name}-sg"
  description = "Allow ALB to web (3000)"
  vpc_id      = data.aws_vpc.default.id

  lifecycle {
    create_before_destroy = true
  }
}

# Allow ALB -> web:3000
resource "aws_security_group_rule" "web_from_alb_3000" {
  type                     = "ingress"
  description              = "Web 3000 from ALB SG"
  protocol                 = "tcp"
  from_port                = 3000
  to_port                  = 3000
  security_group_id        = aws_security_group.web_sg.id
  source_security_group_id = aws_security_group.alb_sg.id
}

# Egress all
resource "aws_security_group_rule" "web_egress" {
  type              = "egress"
  description       = "Allow outbound"
  protocol          = "-1"
  from_port         = 0
  to_port           = 0
  cidr_blocks       = ["0.0.0.0/0"]
  security_group_id = aws_security_group.web_sg.id
}

# Target group for web service
resource "aws_lb_target_group" "web_tg" {
  name     = "${var.web_project_name}-tg"
  port     = 3000
  protocol = "HTTP"
  vpc_id   = data.aws_vpc.default.id

  health_check {
    path                = var.web_health_path
    timeout             = 5
    unhealthy_threshold = 2
  }

  lifecycle {
    create_before_destroy = true
  }
}

# Attach additional certificate if provided (for apex/web hosts)
resource "aws_lb_listener_certificate" "web_cert" {
  count           = length(var.web_acm_certificate_arn) > 0 ? 1 : 0
  listener_arn    = aws_lb_listener.https.arn
  certificate_arn = var.web_acm_certificate_arn
}

# Route traffic by host header to web target group
resource "aws_lb_listener_rule" "https_web" {
  count        = length(var.web_hostnames) > 0 ? 1 : 0
  listener_arn = aws_lb_listener.https.arn
  priority     = 10

  action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.web_tg.arn
  }

  condition {
    host_header {
      values = var.web_hostnames
    }
  }
}

# Launch template for web instances
resource "aws_launch_template" "web_lt" {
  name_prefix   = "${var.web_project_name}-lt-"
  image_id      = var.ami_id
  instance_type = var.instance_type
  key_name      = var.key_name

  iam_instance_profile {
    name = aws_iam_instance_profile.api_instance_profile.name
  }

  network_interfaces {
    associate_public_ip_address = true
    security_groups             = [aws_security_group.web_sg.id]
  }

  user_data = base64encode(templatefile("${path.module}/scripts/userdata-web.sh", {
    docker_image        = var.web_image
    region              = var.aws_region
    web_site_url        = var.web_site_url
    web_api_base_url    = var.web_api_base_url
    web_supabase_url    = var.web_supabase_url
    web_google_client_id = var.web_google_client_id
    ghcr_username       = try(var.ghcr_username, "")
    ghcr_token          = try(var.ghcr_token, "")
  }))

  lifecycle {
    create_before_destroy = true
  }
}

# Auto Scaling Group for web
resource "aws_autoscaling_group" "web_asg" {
  name                = "${var.web_project_name}-asg"
  vpc_zone_identifier = data.aws_subnets.default.ids
  max_size            = 2
  min_size            = 1
  desired_capacity    = 1
  target_group_arns   = [aws_lb_target_group.web_tg.arn]

  tag {
    key                 = "Name"
    value               = var.web_project_name
    propagate_at_launch = true
  }

  launch_template {
    id      = aws_launch_template.web_lt.id
    version = tostring(aws_launch_template.web_lt.latest_version)
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

# Route53 records for root and www -> ALB (optional, only if hostnames include these)
resource "aws_route53_record" "root_a_alias" {
  count   = contains(var.web_hostnames, var.ses_domain) ? 1 : 0
  zone_id = var.route53_zone_id
  name    = var.ses_domain
  type    = "A"
  alias {
    name                   = aws_lb.api_alb.dns_name
    zone_id                = aws_lb.api_alb.zone_id
    evaluate_target_health = false
  }
}

resource "aws_route53_record" "root_aaaa_alias" {
  count   = contains(var.web_hostnames, var.ses_domain) ? 1 : 0
  zone_id = var.route53_zone_id
  name    = var.ses_domain
  type    = "AAAA"
  alias {
    name                   = aws_lb.api_alb.dns_name
    zone_id                = aws_lb.api_alb.zone_id
    evaluate_target_health = false
  }
}

resource "aws_route53_record" "www_a_alias" {
  count   = contains(var.web_hostnames, "www.${var.ses_domain}") ? 1 : 0
  zone_id = var.route53_zone_id
  name    = "www"
  type    = "A"
  alias {
    name                   = aws_lb.api_alb.dns_name
    zone_id                = aws_lb.api_alb.zone_id
    evaluate_target_health = false
  }
}

resource "aws_route53_record" "www_aaaa_alias" {
  count   = contains(var.web_hostnames, "www.${var.ses_domain}") ? 1 : 0
  zone_id = var.route53_zone_id
  name    = "www"
  type    = "AAAA"
  alias {
    name                   = aws_lb.api_alb.dns_name
    zone_id                = aws_lb.api_alb.zone_id
    evaluate_target_health = false
  }
}


