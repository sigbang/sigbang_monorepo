# ✅ 기본 VPC 사용
data "aws_vpc" "default" {
  default = true
}

data "aws_subnets" "default" {
  filter {
    name   = "vpc-id"
    values = [data.aws_vpc.default.id]
  }
}

# ✅ Security Group
resource "aws_security_group" "api_sg" {
  name        = "${var.project_name}-sg"
  description = "Allow ALB and SSH"
  vpc_id      = data.aws_vpc.default.id

  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["121.124.157.106/32"]  # 자신의 IP
  }

  ingress {
    from_port   = 3000
    to_port     = 3000
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]  # ALB → API 통신
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

# ✅ Target Group
resource "aws_lb_target_group" "api_tg" {
  name     = "${var.project_name}-tg"
  port     = 3000
  protocol = "HTTP"
  vpc_id   = data.aws_vpc.default.id

  health_check {
    path = "/health"
    interval = 10
    timeout  = 5
    healthy_threshold   = 2
    unhealthy_threshold = 2
  }
}

# ✅ ALB
resource "aws_lb" "api_alb" {
  name               = "${var.project_name}-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.api_sg.id]
  subnets            = data.aws_subnets.default.ids
}

# ✅ Listener
resource "aws_lb_listener" "http" {
  load_balancer_arn = aws_lb.api_alb.arn
  port              = 80
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.api_tg.arn
  }
}

# ✅ Launch Template
resource "aws_launch_template" "api_lt" {
  name_prefix   = "${var.project_name}-lt-"
  image_id      = "ami-010be25c3775061c9" # Ubuntu 22.04 (서울)
  instance_type = var.instance_type
  key_name      = var.key_name

  user_data = base64encode(<<EOF
#!/bin/bash
apt update -y
apt install -y docker.io
docker run -d -p 3000:3000 ghcr.io/YOUR_GITHUB/sigbang-api:latest
EOF
)
}

# ✅ Auto Scaling Group
resource "aws_autoscaling_group" "api_asg" {
  name                      = "${var.project_name}-asg"
  max_size                  = 2
  min_size                  = 1
  desired_capacity           = 1
  launch_template {
    id      = aws_launch_template.api_lt.id
    version = "$Latest"
  }
  vpc_zone_identifier = data.aws_subnets.default.ids
  target_group_arns   = [aws_lb_target_group.api_tg.arn]

  tag {
    key                 = "Name"
    value               = "${var.project_name}-instance"
    propagate_at_launch = true
  }
}
