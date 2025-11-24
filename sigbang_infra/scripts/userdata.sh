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
  retry apt install -y awscli jq docker.io ec2-instance-connect amazon-ssm-agent || true
  systemctl enable docker
  systemctl start docker
  systemctl restart ssh || true
  # Ensure SSM Agent is installed, enabled and running (Ubuntu)
  if ! systemctl is-active --quiet amazon-ssm-agent && ! systemctl is-active --quiet snap.amazon-ssm-agent.amazon-ssm-agent.service; then
    if command -v snap >/dev/null 2>&1; then
      snap install amazon-ssm-agent --classic || true
      systemctl enable --now snap.amazon-ssm-agent.amazon-ssm-agent.service || snap start amazon-ssm-agent || true
    fi
    if ! systemctl is-active --quiet amazon-ssm-agent && ! systemctl is-active --quiet snap.amazon-ssm-agent.amazon-ssm-agent.service; then
      AGENT_DEB_URL="https://s3.${AWS_REGION}.amazonaws.com/amazon-ssm-${AWS_REGION}/latest/debian_amd64/amazon-ssm-agent.deb"
      retry curl -fsSL -o /tmp/amazon-ssm-agent.deb "$AGENT_DEB_URL" || true
      if [ -s /tmp/amazon-ssm-agent.deb ]; then
        dpkg -i /tmp/amazon-ssm-agent.deb || true
        systemctl enable --now amazon-ssm-agent || true
      fi
    fi
  fi
elif command -v yum >/dev/null 2>&1; then
  retry yum install -y awscli jq docker ec2-instance-connect amazon-ssm-agent || true
  systemctl enable docker
  systemctl start docker
  systemctl restart sshd || true
  systemctl enable --now amazon-ssm-agent || true
fi

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

