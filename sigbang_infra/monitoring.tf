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
# CloudWatch Alarms
##########################################

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


