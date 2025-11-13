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

##########################################
# Security Group
##########################################

resource "aws_security_group" "api_sg" {
  name        = "${var.project_name}-sg"
  description = "API server SG"
  vpc_id      = data.aws_vpc.default.id

  ingress {
    description = "SSH"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["121.124.157.106/32"]
  }

  ingress {
    description = "API 3000"
    from_port   = 3000
    to_port     = 3000
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"] # 필요하면 ALB SG로 제한 가능
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

##########################################
# SSM Parameter Store (.env)
##########################################

# Database
resource "aws_ssm_parameter" "database_url" {
  name  = "/sigbang-api/production/DATABASE_URL"
  type  = "SecureString"
  value = var.database_url
}

resource "aws_ssm_parameter" "direct_url" {
  name  = "/sigbang-api/production/DIRECT_URL"
  type  = "SecureString"
  value = var.direct_url
}

# Supabase
resource "aws_ssm_parameter" "supabase_url" {
  name  = "/sigbang-api/production/SUPABASE_URL"
  type  = "String"
  value = var.supabase_url
}

resource "aws_ssm_parameter" "supabase_anon_key" {
  name  = "/sigbang-api/production/SUPABASE_ANON_KEY"
  type  = "SecureString"
  value = var.supabase_anon_key
}

resource "aws_ssm_parameter" "supabase_service_role_key" {
  name  = "/sigbang-api/production/SUPABASE_SERVICE_ROLE_KEY"
  type  = "SecureString"
  value = var.supabase_service_role_key
}

resource "aws_ssm_parameter" "supabase_bucket" {
  name  = "/sigbang-api/production/SUPABASE_STORAGE_BUCKET"
  type  = "String"
  value = var.supabase_storage_bucket
}

# Google Auth
resource "aws_ssm_parameter" "google_client_id" {
  name  = "/sigbang-api/production/GOOGLE_CLIENT_ID"
  type  = "String"
  value = var.google_client_id
}

# JWT
resource "aws_ssm_parameter" "jwt_secret" {
  name  = "/sigbang-api/production/JWT_SECRET"
  type  = "SecureString"
  value = var.jwt_secret
}

resource "aws_ssm_parameter" "jwt_expires_in" {
  name  = "/sigbang-api/production/JWT_EXPIRES_IN"
  type  = "String"
  value = var.jwt_expires_in
}

# OpenAI
resource "aws_ssm_parameter" "openai_api_key" {
  name  = "/sigbang-api/production/OPENAI_API_KEY"
  type  = "SecureString"
  value = var.openai_api_key
}

resource "aws_ssm_parameter" "openai_recipe_model" {
  name  = "/sigbang-api/production/OPENAI_RECIPE_MODEL"
  type  = "String"
  value = var.openai_recipe_model
}

# Server settings
resource "aws_ssm_parameter" "public_base_url" {
  name  = "/sigbang-api/production/PUBLIC_BASE_URL"
  type  = "String"
  value = var.public_base_url
}

resource "aws_ssm_parameter" "throttle_ttl" {
  name  = "/sigbang-api/production/THROTTLE_TTL"
  type  = "String"
  value = var.throttle_ttl
}

resource "aws_ssm_parameter" "throttle_limit" {
  name  = "/sigbang-api/production/THROTTLE_LIMIT"
  type  = "String"
  value = var.throttle_limit
}

# Admin Job Secret
resource "aws_ssm_parameter" "admin_job_secret" {
  name  = "/sigbang-api/production/ADMIN_JOB_SECRET"
  type  = "SecureString"
  value = var.admin_job_secret
}

# SES
resource "aws_ssm_parameter" "ses_from_email" {
  name  = "/sigbang-api/production/SES_FROM_EMAIL"
  type  = "String"
  value = var.ses_from_email
}

resource "aws_ssm_parameter" "ses_to_email" {
  name  = "/sigbang-api/production/SES_TO_EMAIL"
  type  = "String"
  value = var.ses_to_email
}

resource "aws_ssm_parameter" "aws_access_key_id" {
  name  = "/sigbang-api/production/AWS_ACCESS_KEY_ID"
  type  = "String"
  value = var.aws_access_key_id
}

resource "aws_ssm_parameter" "aws_secret_access_key" {
  name  = "/sigbang-api/production/AWS_SECRET_ACCESS_KEY"
  type  = "String"
  value = var.aws_secret_access_key
}

resource "aws_ssm_parameter" "ses_region" {
  name  = "/sigbang-api/production/SES_REGION"
  type  = "String"
  value = var.ses_region
}

##########################################
# IAM Role (EC2가 SSM 읽기)
##########################################

resource "aws_iam_role" "api_ec2_role" {
  name = "${var.project_name}-ec2-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Principal = { Service = "ec2.amazonaws.com" }
      Action   = "sts:AssumeRole"
    }]
  })
}

resource "aws_iam_role_policy_attachment" "api_ssm_policy" {
  role       = aws_iam_role.api_ec2_role.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonSSMReadOnlyAccess"
}

resource "aws_iam_instance_profile" "api_instance_profile" {
  name = "${var.project_name}-instance-profile"
  role = aws_iam_role.api_ec2_role.name
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
}

resource "aws_lb_target_group" "api_tg" {
  name     = "${var.project_name}-tg"
  port     = 3000
  protocol = "HTTP"
  vpc_id   = data.aws_vpc.default.id

  health_check {
    path = "/health"
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
    name = aws_iam_instance_profile.api_instance_profile.name
  }

  vpc_security_group_ids = [aws_security_group.api_sg.id]

  user_data = base64encode(<<EOF
#!/bin/bash
apt update -y
apt install -y awscli jq docker.io
systemctl enable docker
systemctl start docker

# Load SSM values
export DATABASE_URL=$(aws ssm get-parameter --name "/sigbang-api/production/DATABASE_URL" --with-decryption --region ${var.aws_region} | jq -r '.Parameter.Value')
export DIRECT_URL=$(aws ssm get-parameter --name "/sigbang-api/production/DIRECT_URL" --with-decryption --region ${var.aws_region} | jq -r '.Parameter.Value')
export SUPABASE_URL=$(aws ssm get-parameter --name "/sigbang-api/production/SUPABASE_URL" --region ${var.aws_region} | jq -r '.Parameter.Value')
export SUPABASE_ANON_KEY=$(aws ssm get-parameter --name "/sigbang-api/production/SUPABASE_ANON_KEY" --with-decryption --region ${var.aws_region} | jq -r '.Parameter.Value')
export SUPABASE_SERVICE_ROLE_KEY=$(aws ssm get-parameter --name "/sigbang-api/production/SUPABASE_SERVICE_ROLE_KEY" --with-decryption --region ${var.aws_region} | jq -r '.Parameter.Value')
export GOOGLE_CLIENT_ID=$(aws ssm get-parameter --name "/sigbang-api/production/GOOGLE_CLIENT_ID" --region ${var.aws_region} | jq -r '.Parameter.Value')
export JWT_SECRET=$(aws ssm get-parameter --name "/sigbang-api/production/JWT_SECRET" --with-decryption --region ${var.aws_region} | jq -r '.Parameter.Value')
export JWT_EXPIRES_IN=$(aws ssm get-parameter --name "/sigbang-api/production/JWT_EXPIRES_IN" --region ${var.aws_region} | jq -r '.Parameter.Value')
export SUPABASE_STORAGE_BUCKET=$(aws ssm get-parameter --name "/sigbang-api/production/SUPABASE_STORAGE_BUCKET" --region ${var.aws_region} | jq -r '.Parameter.Value')
export THROTTLE_TTL=$(aws ssm get-parameter --name "/sigbang-api/production/THROTTLE_TTL" --region ${var.aws_region} | jq -r '.Parameter.Value')
export THROTTLE_LIMIT=$(aws ssm get-parameter --name "/sigbang-api/production/THROTTLE_LIMIT" --region ${var.aws_region} | jq -r '.Parameter.Value')
export OPENAI_API_KEY=$(aws ssm get-parameter --name "/sigbang-api/production/OPENAI_API_KEY" --with-decryption --region ${var.aws_region} | jq -r '.Parameter.Value')
export OPENAI_RECIPE_MODEL=$(aws ssm.get-parameter --name "/sigbang-api/production/OPENAI_RECIPE_MODEL" --region ${var.aws_region} | jq -r '.Parameter.Value')
export ADMIN_JOB_SECRET=$(aws ssm get-parameter --name "/sigbang-api/production/ADMIN_JOB_SECRET" --with-decryption --region ${var.aws_region} | jq -r '.Parameter.Value')
export PUBLIC_BASE_URL=$(aws ssm get-parameter --name "/sigbang-api/production/PUBLIC_BASE_URL" --region ${var.aws_region} | jq -r '.Parameter.Value')
export SES_FROM_EMAIL=$(aws ssm get-parameter --name "/sigbang-api/production/SES_FROM_EMAIL" --region ${var.aws_region} | jq -r '.Parameter.Value')
export SES_TO_EMAIL=$(aws ssm get-parameter --name "/sigbang-api/production/SES_TO_EMAIL" --region ${var.aws_region} | jq -r '.Parameter.Value')
export AWS_ACCESS_KEY_ID=$(aws ssm get-parameter --name "/sigbang-api/production/AWS_ACCESS_KEY_ID" --region ${var.aws_region} | jq -r '.Parameter.Value')
export AWS_SECRET_ACCESS_KEY=$(aws ssm get-parameter --name "/sigbang-api/production/AWS_SECRET_ACCESS_KEY" --region ${var.aws_region} | jq -r '.Parameter.Value')
export SES_REGION=$(aws ssm get-parameter --name "/sigbang-api/production/SES_REGION" --region ${var.aws_region} | jq -r '.Parameter.Value')

# Create .env
cat > /home/ubuntu/.env <<EOT
DATABASE_URL=$DATABASE_URL
DIRECT_URL=$DIRECT_URL
SUPABASE_URL=$SUPABASE_URL
SUPABASE_ANON_KEY=$SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=$SUPABASE_SERVICE_ROLE_KEY
GOOGLE_CLIENT_ID=$GOOGLE_CLIENT_ID
JWT_SECRET=$JWT_SECRET
JWT_EXPIRES_IN=$JWT_EXPIRES_IN
SUPABASE_STORAGE_BUCKET=$SUPABASE_STORAGE_BUCKET
THROTTLE_TTL=$THROTTLE_TTL
THROTTLE_LIMIT=$THROTTLE_LIMIT
OPENAI_API_KEY=$OPENAI_API_KEY
OPENAI_RECIPE_MODEL=$OPENAI_RECIPE_MODEL
ADMIN_JOB_SECRET=$ADMIN_JOB_SECRET
PUBLIC_BASE_URL=$PUBLIC_BASE_URL
SES_FROM_EMAIL=$SES_FROM_EMAIL
SES_TO_EMAIL=$SES_TO_EMAIL
AWS_ACCESS_KEY_ID=$AWS_ACCESS_KEY_ID
AWS_SECRET_ACCESS_KEY=$AWS_SECRET_ACCESS_KEY
SES_REGION=$SES_REGION
PORT=3000
NODE_ENV=production
EOT

docker pull ${var.api_image}
docker run -d --env-file /home/ubuntu/.env -p 3000:3000 ${var.api_image}
EOF
  )
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
      min_healthy_percentage = 90
    }
    triggers = ["launch_template"]
  }
}

##########################################
# Output
##########################################

output "alb_dns_name" {
  value = aws_lb.api_alb.dns_name
}
