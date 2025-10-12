#!/usr/bin/env bash
set -euo pipefail

# 1) ローカル git リポジトリに Husky フックをインストール
husky install

# 2) ローカル git リポジトリに プロジェクト共通 gitconfig を適用
node scripts/apply-gitconfig.js

# 3) docker のリソース・ファイル共有を設定
node scripts/docker-fileshare.js

# 4) .env ファイルを作成(.env.example -> .env, etc.)
node scripts/apply-env.js

# 5) .aws/config を元に .env の AWS_* を置換
node scripts/apply-aws-cred.js

# 6) localhost 用の自己署名証明書を作成（.ssl/localhost.{crt|key}）
bash scripts/generate-localhost-cert.sh
