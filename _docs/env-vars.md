# 環境変数（開発環境で使用）

※「\*」印は本番環境でも利用

| 変数                             | 目的                                             |
| -------------------------------- | ------------------------------------------------ |
| PROJECT                          | プロジェクト名                                   |
| APP1_HOST                        | app ホスト名                                     |
| APP1_PORT \*                     | app ポート番号                                   |
| APP1_API_KEY_PASSPHRASE \*       | app API キー 暗号化パスフレーズ                  |
| APP1_API_KEY_SALT \*             | app API キー ソルト                              |
| RDB1_HOST \*                     | rdb ホスト名                                     |
| RDB1_PORT \*                     | rdb ポート番号                                   |
| RDB1_TZ                          | rdb タイムゾーン                                 |
| RDB1_ROOT_PASS                   | rdb ルートパスワード                             |
| RDB1_USER                        | rdb 一般ユーザ名                                 |
| RDB1_PASS                        | rdb 一般ユーザパスワード                         |
| RDB1_DB_NAME                     | rdb データベース名                               |
| RDB1_PRISMA_SHADOW_DB_NAME       | rdb ORM パラメータ シャドウ DB 名                |
| RDB1_PRISMA_SHADOW_DB_URL        | rdb ORM パラメータ シャドウ DB URL               |
| HEALTHCHECK_ENDPOINT_PATH \*     | app ヘルスチェックエンドポイントパス             |
| GRACEFUL_SHUTDOWN_TIMEOUT_SEC \* | app 強制停止待ち秒数                             |
| RDB1_URL \*                      | rdb 接続文字列                                   |
| AWS_REGION                       | デプロイ先コンテナリポジトリの AWS リージョン    |
| AWS_ACCOUNT_ID                   | デプロイ先コンテナリポジトリの AWS アカウント ID |
| REPOS_NAME                       | デプロイ先コンテナリポジトリ名                   |
| SAAS_DOMAIN \*                   | SaaS 提供ドメイン名                              |
| FAKE_SEED                        | テストコードダミー値の乱数シード                 |
| FAKE_X_API_KEY                   | テストコード・結合テスト認証キー                 |
| PRISMA_QUERY_LOG                 | 開発用クエリオプジェクトログ出力                 |
