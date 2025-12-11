#!/bin/bash
set -euo pipefail
set -x
exec > >(tee -a /var/log/userdata.log) 2>&1

# Vars injected by templatefile
SSM_PREFIX="${ssm_prefix}"
AWS_REGION="${region}"
DOCKER_IMAGE="${docker_image}"
# Optional registry credentials injected by TF (fallback if SSM not present)
GHCR_USERNAME_TF="${ghcr_username}"
GHCR_TOKEN_TF="${ghcr_token}"

# Fingerprint injected to ensure LT updates on tfvars changes (no-op usage)
# refresh_fingerprint=${refresh_fingerprint}

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

# Configure CloudWatch Agent to ship userdata logs
cat >/opt/aws/amazon-cloudwatch-agent/bin/sigbang-api-config.json <<'EOF'
{
  "logs": {
    "logs_collected": {
      "files": {
        "collect_list": [
          {
            "file_path": "/var/log/userdata.log",
            "log_group_name": "/sigbang/api/userdata",
            "log_stream_name": "{instance_id}"
          }
        ]
      }
    }
  }
}
EOF

/opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl \
  -a fetch-config -m ec2 \
  -c file:/opt/aws/amazon-cloudwatch-agent/bin/sigbang-api-config.json \
  -s

# Build .env from SSM path
ENV_FILE="/home/ubuntu/.env"
mkdir -p "$(dirname "$ENV_FILE")"
: > "$ENV_FILE"

params_json="$(aws ssm get-parameters-by-path \
  --path "/$${SSM_PREFIX}" \
  --with-decryption \
  --recursive \
  --region "$${AWS_REGION}" || echo '{}')"

echo "$params_json" \
  | jq -r '.Parameters // [] | .[] | [.Name, .Value] | @tsv' \
  | while IFS=$'\t' read -r name value; do
      key="$(basename "$name")"
      printf '%s=%s\n' "$key" "$value" >> "$ENV_FILE"
    done

chown ubuntu:ubuntu "$ENV_FILE" || true

# Export env vars from .env for this script (to use GHCR_* if present)
if [ -f "$ENV_FILE" ]; then
  set -a
  . "$ENV_FILE" || true
  set +a
fi

# Login to container registry when credentials are available
# Detect registry host from image (e.g., ghcr.io/owner/repo:tag)
REGISTRY_HOST="$(echo "$${DOCKER_IMAGE}" | awk -F/ '{print $1}')"

# Prefer SSM-provided creds; fallback to TF-injected
GHCR_USER="$${GHCR_USERNAME:-$GHCR_USERNAME_TF}"
GHCR_PASS="$${GHCR_TOKEN:-$GHCR_TOKEN_TF}"

case "$REGISTRY_HOST" in
  ghcr.io)
    if [ -n "$GHCR_USER" ] && [ -n "$GHCR_PASS" ]; then
      echo "$GHCR_PASS" | docker login ghcr.io -u "$GHCR_USER" --password-stdin
    fi
    ;;
  docker.io|index.docker.io)
    # Support optional Docker Hub creds if present in SSM (.env)
    if [ -n "$${DOCKERHUB_USERNAME:-}" ] && [ -n "$${DOCKERHUB_TOKEN:-}" ]; then
      echo "$DOCKERHUB_TOKEN" | docker login -u "$DOCKERHUB_USERNAME" --password-stdin
    fi
    ;;
  *)
    : # no-op for public registries
    ;;
esac

# Run container
retry docker pull "$${DOCKER_IMAGE}"
docker rm -f sigbang-api || true
docker run -d --name sigbang-api --restart=always --env-file "$ENV_FILE" -p 3000:3000 "$${DOCKER_IMAGE}"

