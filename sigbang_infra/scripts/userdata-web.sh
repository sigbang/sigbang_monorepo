#!/bin/bash
set -euo pipefail
set -x
exec > >(tee -a /var/log/userdata-web.log) 2>&1

# Injected by templatefile
WEB_SITE_URL="${web_site_url}"
WEB_API_BASE_URL="${web_api_base_url}"
WEB_SUPABASE_URL="${web_supabase_url}"
WEB_SUPABASE_ANON_KEY="${web_supabase_anon_key}"
WEB_GOOGLE_CLIENT_ID="${web_google_client_id}"
AWS_REGION="${region}"
DOCKER_IMAGE="${docker_image}"

retry() { local n=0; until "$@"; do n=$((n+1)); [ $n -ge 5 ] && return 1; sleep 5; done; }

# Install deps
if command -v apt >/dev/null 2>&1; then
  retry apt update -y
  retry apt install -y awscli jq docker.io ec2-instance-connect curl
  systemctl enable docker
  systemctl start docker
  systemctl restart ssh || true
elif command -v yum >/dev/null 2>&1; then
  retry yum install -y awscli jq docker ec2-instance-connect curl
  systemctl enable docker
  systemctl start docker
  systemctl restart sshd || true
fi

# Install CloudWatch Agent for minimal log shipping
if command -v apt >/dev/null 2>&1; then
  retry bash -c 'curl -fsSL -o /tmp/amazon-cloudwatch-agent.deb https://amazoncloudwatch-agent.s3.amazonaws.com/ubuntu/amd64/latest/amazon-cloudwatch-agent.deb'
  dpkg -i -E /tmp/amazon-cloudwatch-agent.deb
elif command -v yum >/dev/null 2>&1; then
  retry bash -c 'curl -fsSL -o /tmp/amazon-cloudwatch-agent.rpm https://amazoncloudwatch-agent.s3.amazonaws.com/amazon_linux/amd64/latest/amazon-cloudwatch-agent.rpm'
  rpm -Uvh /tmp/amazon-cloudwatch-agent.rpm
fi

# Configure CloudWatch Agent to ship userdata logs and Docker container logs
cat >/opt/aws/amazon-cloudwatch-agent/bin/sigbang-web-config.json <<'EOF'
{
  "logs": {
    "logs_collected": {
      "files": {
        "collect_list": [
          {
            "file_path": "/var/log/userdata-web.log",
            "log_group_name": "/sigbang/web/userdata",
            "log_stream_name": "{instance_id}"
          },
          {
            "file_path": "/var/lib/docker/containers/*/*.log",
            "log_group_name": "/sigbang/web/app",
            "log_stream_name": "{instance_id}/docker"
          }
        ]
      }
    }
  }
}
EOF

/opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl \
  -a fetch-config -m ec2 \
  -c file:/opt/aws/amazon-cloudwatch-agent/bin/sigbang-web-config.json \
  -s

# Create .env for container
ENV_FILE="/home/ubuntu/web.env"
mkdir -p "$(dirname "$ENV_FILE")"
cat > "$ENV_FILE" <<EOF
NEXT_PUBLIC_SITE_URL=$WEB_SITE_URL
NEXT_PUBLIC_API_BASE_URL=$WEB_API_BASE_URL
NEXT_PUBLIC_SUPABASE_URL=$WEB_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=$WEB_SUPABASE_ANON_KEY
NEXT_PUBLIC_GOOGLE_CLIENT_ID=$WEB_GOOGLE_CLIENT_ID
EOF
chown ubuntu:ubuntu "$ENV_FILE" || true

# Pull & run container
retry docker pull "$DOCKER_IMAGE"
docker rm -f sigbang-web || true
docker run -d --name sigbang-web --restart=always --env-file "$ENV_FILE" -p 3000:3000 "$DOCKER_IMAGE"


