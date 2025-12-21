##########################################
# AWS WAFv2 Web ACL (REGIONAL) for api_alb
##########################################

resource "aws_wafv2_web_acl" "api_waf" {
  name        = "${var.project_name}-web-acl"
  description = "WAF for ${var.project_name} ALB api+web"
  scope       = "REGIONAL" # For ALB, must be REGIONAL

  default_action {
    allow {}
  }

  visibility_config {
    cloudwatch_metrics_enabled = true
    metric_name                = "${var.project_name}-web-acl"
    sampled_requests_enabled   = true
  }

  ##############################
  # 1) AWS Managed Rule Groups
  ##############################

  # OWASP Top 10 전반 (초기 COUNT → 나중에 BLOCK 전환)
  rule {
    name     = "AWS-AWSManagedRulesCommonRuleSet"
    priority = 10

    override_action {
      count {}
    }

    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesCommonRuleSet"
        vendor_name = "AWS"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "AWSManagedRulesCommonRuleSet"
      sampled_requests_enabled   = true
    }
  }

  # 전형적인 exploit payload 차단 (초기 COUNT)
  rule {
    name     = "AWS-AWSManagedRulesKnownBadInputsRuleSet"
    priority = 20

    override_action {
      count {}
    }

    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesKnownBadInputsRuleSet"
        vendor_name = "AWS"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "AWSManagedRulesKnownBadInputsRuleSet"
      sampled_requests_enabled   = true
    }
  }

  # SQL Injection (초기 COUNT)
  rule {
    name     = "AWS-AWSManagedRulesSQLiRuleSet"
    priority = 30

    override_action {
      count {}
    }

    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesSQLiRuleSet"
        vendor_name = "AWS"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "AWSManagedRulesSQLiRuleSet"
      sampled_requests_enabled   = true
    }
  }

  ##############################
  # 2) Rate-based Rules
  ##############################

  # Global Rate Limit (IP당 5분 2,000 요청 이상 탐지)
  # 처음에는 COUNT 로 모니터링 후, 안정 확인되면 block 로 변경
  rule {
    name     = "RateLimit-Global-PerIP"
    priority = 40

    action {
      block {}
    }

    statement {
      rate_based_statement {
        limit              = 2000
        aggregate_key_type = "IP"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "RateLimit-Global-PerIP"
      sampled_requests_enabled   = true
    }
  }

  # 로그인/인증 경로 Rate Limit (IP당 5분 200 요청 이상 탐지)
  rule {
    name     = "RateLimit-AuthPaths-PerIP"
    priority = 50

    action {
      block {}
    }

    statement {
      rate_based_statement {
        limit              = 200
        aggregate_key_type = "IP"

        # /login, /api/auth/* 등 인증 관련 경로만 스코프 다운
        scope_down_statement {
          or_statement {
            # URI starts with /login
            statement {
              byte_match_statement {
                search_string = "/login"

                field_to_match {
                  uri_path {}
                }

                positional_constraint = "STARTS_WITH"

                text_transformation {
                  priority = 0
                  type     = "NONE"
                }
              }
            }

            # URI starts with /api/auth
            statement {
              byte_match_statement {
                search_string = "/api/auth"

                field_to_match {
                  uri_path {}
                }

                positional_constraint = "STARTS_WITH"

                text_transformation {
                  priority = 0
                  type     = "NONE"
                }
              }
            }
          }
        }
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "RateLimit-AuthPaths-PerIP"
      sampled_requests_enabled   = true
    }
  }

  ##############################
  # 3) Custom Rules (채굴/옛 앱 경로/위험 payload/UA)
  ##############################

  # 채굴 관련 키워드 (초기 COUNT, 나중에 BLOCK)
  rule {
    name     = "Custom-CryptoMining-Keywords"
    priority = 60

    action {
      block {}
    }

    statement {
      or_statement {
        # xmrig in URI/query/body
        statement {
          byte_match_statement {
            search_string = "xmrig"

            field_to_match {
              uri_path {}
            }

            positional_constraint = "CONTAINS"

            text_transformation {
              priority = 0
              type     = "NONE"
            }
          }
        }

        statement {
          byte_match_statement {
            search_string = "xmrig"

            field_to_match {
              query_string {}
            }

            positional_constraint = "CONTAINS"

            text_transformation {
              priority = 0
              type     = "NONE"
            }
          }
        }

        statement {
          byte_match_statement {
            search_string = "xmrig"

            field_to_match {
              body {}
            }

            positional_constraint = "CONTAINS"

            text_transformation {
              priority = 0
              type     = "NONE"
            }
          }
        }

        # supportxmr.com
        statement {
          byte_match_statement {
            search_string = "supportxmr.com"

            field_to_match {
              body {}
            }

            positional_constraint = "CONTAINS"

            text_transformation {
              priority = 0
              type     = "NONE"
            }
          }
        }

        # donate.ssl.xmrig.com
        statement {
          byte_match_statement {
            search_string = "donate.ssl.xmrig.com"

            field_to_match {
              body {}
            }

            positional_constraint = "CONTAINS"

            text_transformation {
              priority = 0
              type     = "NONE"
            }
          }
        }
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "Custom-CryptoMining-Keywords"
      sampled_requests_enabled   = true
    }
  }

  # 우리 서비스에 없는 옛 취약 앱 경로들 (바로 BLOCK 가능)
  rule {
    name     = "Custom-Legacy-App-Paths"
    priority = 70

    action {
      block {}
    }

    statement {
      or_statement {
        # /phpmyadmin
        statement {
          byte_match_statement {
            search_string = "/phpmyadmin"

            field_to_match {
              uri_path {}
            }

            positional_constraint = "STARTS_WITH"

            text_transformation {
              priority = 0
              type     = "NONE"
            }
          }
        }

        # /wp-admin
        statement {
          byte_match_statement {
            search_string = "/wp-admin"

            field_to_match {
              uri_path {}
            }

            positional_constraint = "STARTS_WITH"

            text_transformation {
              priority = 0
              type     = "NONE"
            }
          }
        }

        # /wp-login.php
        statement {
          byte_match_statement {
            search_string = "/wp-login.php"

            field_to_match {
              uri_path {}
            }

            positional_constraint = "STARTS_WITH"

            text_transformation {
              priority = 0
              type     = "NONE"
            }
          }
        }

        # /boaform/admin
        statement {
          byte_match_statement {
            search_string = "/boaform/admin"

            field_to_match {
              uri_path {}
            }

            positional_constraint = "STARTS_WITH"

            text_transformation {
              priority = 0
              type     = "NONE"
            }
          }
        }
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "Custom-Legacy-App-Paths"
      sampled_requests_enabled   = true
    }
  }

  # 위험한 쉘/다운로드 payload 문자열 (Block)
  rule {
    name     = "Custom-Dangerous-Payload-Strings"
    priority = 80

    action {
      block {}
    }

    statement {
      or_statement {
        # "; rm -rf"
        statement {
          byte_match_statement {
            search_string = "; rm -rf"

            field_to_match {
              body {}
            }

            positional_constraint = "CONTAINS"

            text_transformation {
              priority = 0
              type     = "NONE"
            }
          }
        }

        # "bash -c"
        statement {
          byte_match_statement {
            search_string = "bash -c"

            field_to_match {
              body {}
            }

            positional_constraint = "CONTAINS"

            text_transformation {
              priority = 0
              type     = "NONE"
            }
          }
        }

        # "curl http"
        statement {
          byte_match_statement {
            search_string = "curl http"

            field_to_match {
              body {}
            }

            positional_constraint = "CONTAINS"

            text_transformation {
              priority = 0
              type     = "NONE"
            }
          }
        }

        # "wget http"
        statement {
          byte_match_statement {
            search_string = "wget http"

            field_to_match {
              body {}
            }

            positional_constraint = "CONTAINS"

            text_transformation {
              priority = 0
              type     = "NONE"
            }
          }
        }

        # "/etc/passwd"
        statement {
          byte_match_statement {
            search_string = "/etc/passwd"

            field_to_match {
              body {}
            }

            positional_constraint = "CONTAINS"

            text_transformation {
              priority = 0
              type     = "NONE"
            }
          }
        }

        # "/etc/shadow"
        statement {
          byte_match_statement {
            search_string = "/etc/shadow"

            field_to_match {
              body {}
            }

            positional_constraint = "CONTAINS"

            text_transformation {
              priority = 0
              type     = "NONE"
            }
          }
        }
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "Custom-Dangerous-Payload-Strings"
      sampled_requests_enabled   = true
    }
  }

  # User-Agent 기반 제한 (초기 COUNT, 나중에 BLOCK 가능)
  rule {
    name     = "Custom-Suspicious-UserAgents"
    priority = 90

    action {
      count {}
    }

    statement {
      or_statement {
        # curl
        statement {
          byte_match_statement {
            search_string = "curl/"

            field_to_match {
              single_header {
                name = "user-agent"
              }
            }

            positional_constraint = "CONTAINS"

            text_transformation {
              priority = 0
              type     = "LOWERCASE"
            }
          }
        }

        # Wget
        statement {
          byte_match_statement {
            search_string = "wget"

            field_to_match {
              single_header {
                name = "user-agent"
              }
            }

            positional_constraint = "CONTAINS"

            text_transformation {
              priority = 0
              type     = "LOWERCASE"
            }
          }
        }

        # python-requests
        statement {
          byte_match_statement {
            search_string = "python-requests"

            field_to_match {
              single_header {
                name = "user-agent"
              }
            }

            positional_constraint = "CONTAINS"

            text_transformation {
              priority = 0
              type     = "LOWERCASE"
            }
          }
        }

        # masscan
        statement {
          byte_match_statement {
            search_string = "masscan"

            field_to_match {
              single_header {
                name = "user-agent"
              }
            }

            positional_constraint = "CONTAINS"

            text_transformation {
              priority = 0
              type     = "LOWERCASE"
            }
          }
        }

        # nmap
        statement {
          byte_match_statement {
            search_string = "nmap"

            field_to_match {
              single_header {
                name = "user-agent"
              }
            }

            positional_constraint = "CONTAINS"

            text_transformation {
              priority = 0
              type     = "LOWERCASE"
            }
          }
        }
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "Custom-Suspicious-UserAgents"
      sampled_requests_enabled   = true
    }
  }
}

##########################################
# Associate Web ACL with existing ALB
##########################################

resource "aws_wafv2_web_acl_association" "api_alb_association" {
  resource_arn = aws_lb.api_alb.arn
  web_acl_arn  = aws_wafv2_web_acl.api_waf.arn
}
