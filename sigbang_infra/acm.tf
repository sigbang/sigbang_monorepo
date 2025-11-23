##########################################
# Managed ACM certificate (optional)
##########################################

# Single, unified certificate for:
# - sigbang.com
# - www.sigbang.com
# - api.sigbang.com
#
# Enabled only when var.manage_acm = true AND caller leaves ARN variables empty.

locals {
  use_managed_acm = var.manage_acm && length(var.acm_certificate_arn) == 0

  # Will be used by ALB listener as the effective certificate ARN
  effective_acm_arn = length(var.acm_certificate_arn) > 0 ? var.acm_certificate_arn : (local.use_managed_acm ? aws_acm_certificate_validation.managed[0].certificate_arn : "")
}

resource "aws_acm_certificate" "managed" {
  count = local.use_managed_acm ? 1 : 0

  domain_name               = var.ses_domain
  subject_alternative_names = ["www.${var.ses_domain}", "api.${var.ses_domain}"]
  validation_method         = "DNS"

  lifecycle {
    create_before_destroy = true
  }
}

# Create DNS validation records for all requested names
resource "aws_route53_record" "managed_validation" {
  for_each = local.use_managed_acm ? { for dvo in aws_acm_certificate.managed[0].domain_validation_options : dvo.domain_name => {
    name   = dvo.resource_record_name
    type   = dvo.resource_record_type
    record = dvo.resource_record_value
  } } : {}

  zone_id         = var.route53_zone_id
  allow_overwrite = true
  name            = each.value.name
  type            = each.value.type
  ttl             = 60
  records         = [each.value.record]
}

resource "aws_acm_certificate_validation" "managed" {
  count                   = local.use_managed_acm ? 1 : 0
  certificate_arn         = aws_acm_certificate.managed[0].arn
  validation_record_fqdns = [for r in aws_route53_record.managed_validation : r.fqdn]
}

output "managed_acm_certificate_arn" {
  value       = local.use_managed_acm ? aws_acm_certificate_validation.managed[0].certificate_arn : null
  description = "ARN of the managed ACM certificate (when manage_acm = true)"
}


