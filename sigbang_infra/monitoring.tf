##########################################
# Monitoring & Alerts
##########################################

# SNS topic for operational alerts
resource "aws_sns_topic" "ops_alerts" {
  name = "${var.project_name}-ops-alerts"
}

# Email subscription for ops alerts
resource "aws_sns_topic_subscription" "ops_alerts_email" {
  topic_arn = aws_sns_topic.ops_alerts.arn
  protocol  = "email"
  endpoint  = var.ops_alert_email
}

##########################################
# CloudWatch Log Groups (minimal)
##########################################

# API EC2 userdata / bootstrap logs
resource "aws_cloudwatch_log_group" "api_userdata" {
  name              = "/sigbang/api/userdata"
  retention_in_days = 14
}

# Web EC2 userdata / bootstrap logs
resource "aws_cloudwatch_log_group" "web_userdata" {
  name              = "/sigbang/web/userdata"
  retention_in_days = 14
}

##########################################
# CloudWatch Alarms & Auto-recovery
##########################################

# Target tracking scaling policy for API ASG (CPU based)
resource "aws_autoscaling_policy" "api_cpu_target_scaling" {
  name                   = "${var.project_name}-cpu-target-scaling"
  autoscaling_group_name = aws_autoscaling_group.api_asg.name
  policy_type            = "TargetTrackingScaling"

  target_tracking_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ASGAverageCPUUtilization"
    }
    target_value     = 50
    disable_scale_in = false
  }
}

##########################################
# High CPU auto-recovery (Alarm -> EventBridge -> Lambda)
##########################################

# Additional alarm for prolonged high CPU on API ASG (used to trigger Lambda)
resource "aws_cloudwatch_metric_alarm" "api_cpu_hot" {
  alarm_name          = "${var.project_name}-api-cpu-hot"
  namespace           = "AWS/EC2"
  metric_name         = "CPUUtilization"
  statistic           = "Average"
  period              = 60
  evaluation_periods  = 10
  threshold           = 80
  comparison_operator = "GreaterThanThreshold"

  alarm_description = "API Auto Scaling Group average CPU > 80% for 10 minutes (potential saturation)"

  dimensions = {
    AutoScalingGroupName = aws_autoscaling_group.api_asg.name
  }

  alarm_actions = [aws_sns_topic.ops_alerts.arn]
}

data "archive_file" "terminate_hot_instance" {
  type        = "zip"
  source_file = "${path.module}/lambda/terminate_hot_instance.py"
  output_path = "${path.module}/lambda/terminate_hot_instance.zip"
}

resource "aws_iam_role" "lambda_terminate_hot_instance_role" {
  name = "${var.project_name}-lambda-terminate-hot-instance"

  assume_role_policy = jsonencode({
    Version = "2012-10-17",
    Statement = [{
      Effect = "Allow",
      Principal = {
        Service = "lambda.amazonaws.com"
      },
      Action = "sts:AssumeRole"
    }]
  })
}

resource "aws_iam_role_policy" "lambda_terminate_hot_instance_policy" {
  name = "${var.project_name}-lambda-terminate-hot-instance-policy"
  role = aws_iam_role.lambda_terminate_hot_instance_role.id

  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Effect = "Allow",
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ],
        Resource = "arn:aws:logs:${var.aws_region}:${var.aws_account_id}:*"
      },
      {
        Effect = "Allow",
        Action = [
          "autoscaling:DescribeAutoScalingGroups",
          "autoscaling:TerminateInstanceInAutoScalingGroup",
          "ec2:DescribeInstances",
          "cloudwatch:GetMetricStatistics"
        ],
        Resource = "*"
      }
    ]
  })
}

resource "aws_lambda_function" "terminate_hot_instance" {
  function_name = "${var.project_name}-terminate-hot-instance"
  role          = aws_iam_role.lambda_terminate_hot_instance_role.arn
  filename      = data.archive_file.terminate_hot_instance.output_path
  handler       = "terminate_hot_instance.handler"
  runtime       = "python3.11"
  timeout       = 60
  memory_size   = 128

  environment {
    variables = {
      ASG_NAME       = aws_autoscaling_group.api_asg.name
      CPU_THRESHOLD  = "95"   # per-instance CPU threshold for termination
      LOOKBACK_MIN   = "10"   # minutes to look back for CPU stats
      MIN_IN_SERVICE = "2"    # require at least this many healthy instances before terminating one
    }
  }

  depends_on = [aws_iam_role_policy.lambda_terminate_hot_instance_policy]
}

resource "aws_cloudwatch_event_rule" "cpu_hot_instance_rule" {
  name        = "${var.project_name}-cpu-hot-instance-rule"
  description = "Trigger Lambda to terminate hottest instance when API ASG CPU is hot for a prolonged period"

  event_pattern = jsonencode({
    "source" : ["aws.cloudwatch"],
    "detail-type" : ["CloudWatch Alarm State Change"],
    "detail" : {
      "alarmName" : [aws_cloudwatch_metric_alarm.api_cpu_hot.alarm_name],
      "state" : {
        "value" : ["ALARM"]
      }
    }
  })
}

resource "aws_cloudwatch_event_target" "cpu_hot_instance_target" {
  rule      = aws_cloudwatch_event_rule.cpu_hot_instance_rule.name
  target_id = "lambda-terminate-hot-instance"
  arn       = aws_lambda_function.terminate_hot_instance.arn
}

resource "aws_lambda_permission" "terminate_hot_instance_eventbridge" {
  statement_id  = "AllowExecutionFromEventBridgeTerminateHotInstance"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.terminate_hot_instance.arn
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.cpu_hot_instance_rule.arn
}

# API ASG average CPU > 70% for 3 minutes
resource "aws_cloudwatch_metric_alarm" "api_cpu_high" {
  alarm_name          = "${var.project_name}-api-cpu-high"
  namespace           = "AWS/EC2"
  metric_name         = "CPUUtilization"
  statistic           = "Average"
  period              = 60
  evaluation_periods  = 3
  threshold           = 70
  comparison_operator = "GreaterThanThreshold"

  alarm_description = "API Auto Scaling Group average CPU > 70% for 3 minutes"

  dimensions = {
    AutoScalingGroupName = aws_autoscaling_group.api_asg.name
  }

  alarm_actions = [aws_sns_topic.ops_alerts.arn]
}

# ALB Target 5xx count > 20 over 5 minutes
resource "aws_cloudwatch_metric_alarm" "api_alb_5xx_high" {
  alarm_name          = "${var.project_name}-alb-5xx-high"
  namespace           = "AWS/ApplicationELB"
  metric_name         = "HTTPCode_Target_5XX_Count"
  statistic           = "Sum"
  period              = 300
  evaluation_periods  = 1
  threshold           = 20
  comparison_operator = "GreaterThanThreshold"

  alarm_description = "ALB Target 5xx count > 20 over 5 minutes"

  dimensions = {
    LoadBalancer = aws_lb.api_alb.arn_suffix
  }

  alarm_actions = [aws_sns_topic.ops_alerts.arn]
}


