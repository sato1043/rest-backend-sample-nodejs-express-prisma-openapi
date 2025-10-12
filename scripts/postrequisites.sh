#!/usr/bin/env bash
set -euo pipefail

# 1) 空のDBに最初のマイグレーションを適用します
.docker-compose/dev-app/migrate-apply

# 2) ユニットテスト用のDBも準備します
.docker-compose/dev-app/test-prepare
