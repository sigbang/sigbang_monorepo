#!/bin/bash
set -euo pipefail

# Vars injected by templatefile
SSM_PREFIX="${ssm_prefix}"
AWS_REGION="${region}"
DOCKER_IMAGE="${docker_image}"

# Install deps
if command -v apt >/dev/null 2>&1; then
  apt update -y
  apt install -y awscli jq docker.io
  systemctl enable docker
  systemctl start docker
elif command -v yum >/dev/null 2>&1; then
  yum install -y awscli jq docker
  systemctl enable docker
  systemctl start docker
fi

# Build .env from SSM path
ENV_FILE="/home/ubuntu/.env"
mkdir -p "$(dirname "$ENV_FILE")"
: > "$ENV_FILE"

params_json="$(aws ssm get-parameters-by-path \
  --path "/$${SSM_PREFIX}" \
  --with-decryption \
  --recursive \
  --region "$${AWS_REGION}")"

echo "$params_json" \
  | jq -r '.Parameters[] | [.Name, .Value] | @tsv' \
  | while IFS=$'\t' read -r name value; do
      key="$(basename "$name")"
      printf '%s=%s\n' "$key" "$value" >> "$ENV_FILE"
    done

# Run container
docker pull "$${DOCKER_IMAGE}"
docker run -d --restart=always --env-file "$ENV_FILE" -p 3000:3000 "$${DOCKER_IMAGE}"


