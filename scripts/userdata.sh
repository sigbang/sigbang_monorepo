#!/bin/bash
set -euo pipefail
set -x
exec > >(tee -a /var/log/userdata.log) 2>&1

# Vars injected by templatefile
SSM_PREFIX="${ssm_prefix}"
AWS_REGION="${region}"
DOCKER_IMAGE="${docker_image}"

# Fingerprint injected to ensure LT updates on tfvars changes (no-op usage)
# refresh_fingerprint=${refresh_fingerprint}

retry() { local n=0; until "$@"; do n=$((n+1)); [ $n -ge 5 ] && return 1; sleep 5; done; }

# Install deps
if command -v apt >/dev/null 2>&1; then
  retry apt update -y
  retry apt install -y awscli jq docker.io ec2-instance-connect
  systemctl enable docker
  systemctl start docker
  systemctl restart ssh || true
elif command -v yum >/dev/null 2>&1; then
  retry yum install -y awscli jq docker ec2-instance-connect
  systemctl enable docker
  systemctl start docker
  systemctl restart sshd || true
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

# Optional: GHCR login if private image credentials are provided
if [ -n "$${GHCR_USERNAME:-}" ] && [ -n "$${GHCR_TOKEN:-}" ]; then
  echo "$GHCR_TOKEN" | docker login ghcr.io -u "$GHCR_USERNAME" --password-stdin
fi

# Run container
retry docker pull "$${DOCKER_IMAGE}"
docker rm -f sigbang-api || true
docker run -d --name sigbang-api --restart=always --env-file "$ENV_FILE" -p 3000:3000 "$${DOCKER_IMAGE}"

