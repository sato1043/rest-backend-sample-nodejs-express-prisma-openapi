#!/usr/bin/env bash
set -euo pipefail

# Generate a self-signed certificate for localhost
# - Outputs to .ssl/localhost.crt and .ssl/localhost.key by default
# - If both files already exist, it skips generation

OUT_DIR=".ssl"
CERT_FILE="$OUT_DIR/localhost.crt"
KEY_FILE="$OUT_DIR/localhost.key"

mkdir -p "$OUT_DIR"

if command -v openssl >/dev/null 2>&1; then
  :
else
  echo "[generate-localhost-cert] ERROR: openssl not found. Please install OpenSSL and re-run." >&2
  exit 1
fi

if [[ -f "$CERT_FILE" && -f "$KEY_FILE" ]]; then
  echo "[generate-localhost-cert] Found existing cert and key at $OUT_DIR. Skipping generation."
  exit 0
fi

openssl req -x509 -out "$CERT_FILE" -keyout "$KEY_FILE" \
  -newkey rsa:2048 -nodes -sha256 \
  -subj '/CN=localhost' -extensions EXT -config <( \
  printf "[dn]\nCN=localhost\n[req]\ndistinguished_name = dn\n[EXT]\nsubjectAltName=DNS:localhost\nkeyUsage=digitalSignature\nextendedKeyUsage=serverAuth")

chmod 600 "$KEY_FILE" || true

echo "[generate-localhost-cert] Done. To use insecure client connections temporarily, consider:"
echo "  - export NODE_TLS_REJECT_UNAUTHORIZED=0 (not recommended for production)"
echo "  - curl --insecure"
