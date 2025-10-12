# システム設計と実装

## 方針

- **本プロジェクトはスキーマファーストで構築します**

- **スキーマ**は以下の HTML から参照できます
  - [データベーススキーマ: prisma/docs/index.html](../prisma/docs/index.html)
  - [API スキーマ: openapi/openapi.static.html](../openapi/openapi.static.html)

## 開発フロー

## スキーマファースト開発構成

- 開発を始めるときスキーマ定義から始めます

  - `prisma/schema.prisma` がデータベーススキーマ定義です。
  - まず、コードとして在るスキーマ定義を、データベースに適用し、最新に揃えます `migrate-reset`
  - 次にスキーマ定義へ、必要な追加削除を行います
  - スキーマ定義と DB の差分をとって マイグレートファイル（SQL）を生成します `migrate-create`
  - 新規マイグレートとして SQL 適用します `migrate-apply`

- データベーススキーマからエンティティの OpenAPI 用の定義ファイルが得られるので、それを再利用して API スキーマを定義します。

  - `openapi/`下が REST API スキーマ定義を納めたディレクトリです。

### API と ER のどちらの定義を先行するか

API と ER どちらのスキーマからはじめるかは、ビジネス要件から考えること、先行してチーム連携できることを考えると手順は以下の通りです。

1. UI 上必要な情報をまとめて API I/F を考え、
2. 必要になったアプリケーションロジックからテーブル定義へと進める
3. テーブル定義をコードに実装し、データベースをマイグレーション
4. アプリケーションロジックを実装し、API I/F を実装

- UI 要件から API I/F を先に設計 → アプリケーションロジック → テーブル定義、が有益
- 実際には本質的なので同時進行になりがちだが、なるべく API スキーマ更新を先行
- データスキーマの更新が追いつかない場合、アプリケーションロジック内で変換インターフェースを設ける

## Prisma スキーマ更新

1. `prisma/schema.prisma` にスキーマ定義

2. スキーマ定義を DB に適用（`migrate-reset`）

3. エディットする

4. 変更差分から SQL（マイグレーション）を生成（`migrate-create`）

5. 自動生成 SQL を調整し、意図通りに DB を変更可能にする

6. 新規マイグレーションを適用（`migrate-apply`）

7. クライアントコードを生成

- ローカルなら `prisma generate`
- docker-compose 内なら `./.docker-compose/dev-app/generate`

## OpenAPI スキーマ更新

- API スキーマ定義は リポジトリ直下 [openapi/](../openapi) です
- 記述は担当に応じてファイル分割します

- **以下手順**

1. スキーマファイルを更新

   - [openapi-root.yaml](../openapi/openapi-root.yaml) が起点です
   - openapi-root.yaml から参照される yaml ファイルをコマンドでバンドルします

2. スキーマファイルをバンドル

   - ローカルなら `yarn openapi:budle`
   - compose 内なら `./.docker-compose/openapi-budle`
   - バンドルで以下を得られます。これらはコミットします（主として参照のため）

     1. [openapi.bundled.yaml](../openapi/openapi.bundled.yaml)
     2. [openapi.static.html](../openapi/openapi.static.html)

### API のエンドポイント実装について

- API サーバーのエンドポイントは ミドルウェアが スキーマ定義から自動生成します

  - ミドルウェアは express-openapi です
  - app.ts のサーバー初期化処理中に行います
  - したがって生成タイミングは API サーバーの起動時です

- エンドポイントの実装は エンティティの粒度で分割します

- `エンティティ名サブディレクトリ` に関連ファイルをまとめます

  - 例えば `user` エンティティの実装は `user` サブディレクトリにまとめます

- エンティティは３つのレイヤーで分割します
  - 外部プレゼンテーション層（API ルーター）: `*.routes.ts`
  - アプリケーションロジック層: `*.app-logic.ts`
  - ドメインモデル層: `{エンティ名}.ts`

**END**
