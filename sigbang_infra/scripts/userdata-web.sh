#!/bin/bash
set -euo pipefail
set -x
exec > >(tee -a /var/log/userdata-web.log) 2>&1

# Injected by templatefile
WEB_SITE_URL="${web_site_url}"
WEB_API_BASE_URL="${web_api_base_url}"
WEB_SUPABASE_URL="${web_supabase_url}"
WEB_SUPABASE_ANON_KEY="${web_supabase_anon_key}"
AWS_REGION="${region}"
DOCKER_IMAGE="${docker_image}"

retry() { local n=0; until "$@"; do n=$((n+1)); [ $n -ge 5 ] && return 1; sleep 5; done; }

# Install deps
if command -v apt >/dev/null 2>&1; then
  retry apt update -y
  retry apt install -y awscli jq docker.io ec2-instance-connect amazon-ssm-agent || true
  systemctl enable docker
  systemctl start docker
  systemctl restart ssh || true
  # Ensure SSM Agent is enabled and running (Ubuntu)
  systemctl enable --now amazon-ssm-agent || snap start amazon-ssm-agent || true
elif command -v yum >/dev/null 2>&1; then
  retry yum install -y awscli jq docker ec2-instance-connect amazon-ssm-agent || true
  systemctl enable docker
  systemctl start docker
  systemctl restart sshd || true
  systemctl enable --now amazon-ssm-agent || true
fi

# Create .env for container
ENV_FILE="/home/ubuntu/web.env"
mkdir -p "$(dirname "$ENV_FILE")"
cat > "$ENV_FILE" <<EOF
NEXT_PUBLIC_SITE_URL=$WEB_SITE_URL
NEXT_PUBLIC_API_BASE_URL=$WEB_API_BASE_URL
NEXT_PUBLIC_SUPABASE_URL=$WEB_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=$WEB_SUPABASE_ANON_KEY
EOF
chown ubuntu:ubuntu "$ENV_FILE" || true

# Pull & run container
retry docker pull "$DOCKER_IMAGE"
docker rm -f sigbang-web || true
docker run -d --name sigbang-web --restart=always --env-file "$ENV_FILE" -p 3000:3000 "$DOCKER_IMAGE"


