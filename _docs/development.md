# 開発環境

- **リポジトリ**

  - https://github.com/sato1043/rest-be-sample-nodejs-express-prisma-openapi

- **AWS**

  - 組織設定済み（AWS Organizations と IAM Identity Center）
  - [シングルサインオン](https://docs.aws.amazon.com/ja_jp/cli/latest/userguide/cli-chap-authentication.html)を構成します
  - コンテナビルドと CI/CD 向けに ECR を使います
  - 想定リージョン: ap-northeast-1

- **ローカル PC 事前インストール**

  - node.js 16.x (≒ es2021) TODO 22 以降
  - yarn 1.x
  - docker 20.10.x / compose v3

- **ローカル PC サービスポート**

  - https://localhost:3000 ... API サーバー
  - http://localhost:3002 ... API スキーマビューワ
  - これらのポートの未使用を確認してください（環境変数で変更可能）

- **docker compose の中で開発します**

  - ビルド・lint・テストはコンテナ内でおこないます
  - ホスト側ソースコードを開発コンテナへマウントします
  - ホスト側でエディットし、開発コンテナ内からファイル監視します
  - ランタイムをコンテナ化し、個々人の環境差異を無くします
  - `.docker-compose`以下のスクリプトで docker compose の中を操作します
    - 例えば `yarn debug` でローカル開発用の docker compose 環境が起動します

- **コンテナ構成**

  - rdb ... `mysql`
  - openapi-ui ... API ドキュメントビューワ
  - dev-app ... 開発コンテナ
    - 常時監視: TypeScript トランスパイル / Prisma スキーマコード生成 / OpenAPI バンドル
    - 例えば TS ファイル変更に応じて `dist` に再変換、可能なら自動起動

- **環境変数は [env-vars.md](./env-vars.md) を参照**

- **マウントするローカルディレクトリ**
  - **./prisma** ... ORM スキーマ定義
  - **./openapi** ... OpenAPI スキーマ定義
  - **./src** ... TypeScript ソースコード

### 初回手順

#### a. AWS 準備

- ECR

  - 想定リージョン: ap-northeast-1
  - プライベートリポジトリに node リポジトリを作成します
  - この作業はコンソールで行います

- [Docker イメージを使った AWS CLI](https://docs.aws.amazon.com/ja_jp/cli/latest/userguide/getting-started-docker.html) を利用します
- AWS CLI の認証情報を転記しておきます（`.aws/config` このファイルはコミットしません）
- `yarn ecr:login` で認証できます

  - コマンドが Docker イメージを pull して認証を始めます
  - Docker イメージにリポジトリルート下 `.aws` をマウントます
  - Docker イメージは `.aws/config` を参照して認証を進めます
  - コンソールに `URL (sso_start_url)` と`デバイスコード`が表示されます（`AAAA-BBBB`のような）

    ```
    Attempting to automatically open the SSO authorization page in your default browser.
    If the browser does not open or you wish to use a different device to authorize this request, open the following URL:

    https://d-0000000000.awsapps.com/start/#/device

    Then enter the code:

    AAAA-BBBB
    ```

  - ブラウザが開くので（もしくは手動で開いて）デバイスコードを入力します
    - `https://d-0000000000.awsapps.com/start/#/device` に遷移します
    - ただし SSO 未ログインなら 先に認証を促されます
    - SSO ログイン済みだと認証画面に遷移しません
    - 次いでデバイスコード入力を促されます

#### b. コンテナ準備

1. `git clone <REPOSITORY_URL>`

   - 適当なディレクトリでコードをクローンし、 name/email を設定します
     ```shell
     $ cd <REPOSITORY_ROOT_DIR>
     $ git config --local user.name <YOUR_NAME>
     $ git config --local user.email <YOUR_NAME@YOUR_DOMAIN>
     ```

2. `yarn prerequisites`

   - ツールスクリプトが事前設定をいくつか行います
   - AWS CLI 認証情報が見つからないと失敗します
   - .env ファイルが example からコピーされます。内容を確認してください
   - この環境用の API キーを生成します。**表示された apiKey 文字列を安全な方法で記録してください**
     ```
     [apply-env] GENKEY OUTPUT
     {
       passphrase: <SOME_PASSPHRASE>,
       salt: <SOME_SALT>,
       code: <SOME_CODE>,
       apiKey: <SOME_API_KEY>  <-- これを記録（控え漏れても新規発行・設定上書きで大丈夫）
     }
     ```
   - HTTPS で開発するための自己署名証明書を生成します `.ssl/localhost.{crt|key}`
   - Docker のファイル共有が有効になっているか確認してください
     - 設定が増えてなさそうなら一度 Docker.app または dockerd を終了->起動します

3. `yarn ecr:login && yarn ecr:getbase`

   - ECR に docker ログインします
   - ECR に node.js 公式イメージをインポートします
     - [v16 公式イメージ](https://hub.docker.com/layers/library/node/16-alpine3.15/images/sha256-a61476fa72e41be53e49a3f4522c675495ea6bf6b379c740f9371279c949fd73)
     - [v22 公式イメージ](https://hub.docker.com/layers/library/node/22-alpine/images/sha256-aa83e8f13963f17f7f6bd497085112bf12ea6f20b4b826d9b33f2d99594325b6)

4. `yarn debug`

   - docker compose をビルド・起動します

5. `yarn postrequisites`

   - ツールスクリプトが事後設定をいくつか行います
   - 初回データベース構築を行います

##### NOTE: API キー発行について

- API サーバーはアクセス制限のために API キー発行をサポートしています
- 今のところパス・ソルト固定かつ .api-keys.json は平文で保存しており、簡易です
- API キーはホストで生成し、コンテナで利用します

- **API キー発行** `yarn openapi:genkey`
  - ひと組の code/apiKey を発行します
  - 同じ code/apiKey をもう一度作ることはできません
  - パスフレーズとソルト、API キーがあると、コードを複合できます
  - code は `src/.api-keys.json` に追記します
  - apiKey を利用者に提示します

##### NOTE: 自己署名証明書について

- HTTPS 上で cookie や jwt を確認したい時のために https サーバーを起動できます
- ホスト名 localhost です
- 環境変数 LISTEN_ON_HTTPS=true で API サーバーが HTTPS をリスンします
- クライアントの自己署名警告は以下で潰せます
  - 環境変数に NODE_TLS_REJECT_UNAUTHORIZED=0 を設定する
  - ブラウザで証明書を常に信頼すると警告を発さなくなります
  - `curl --insecure`

##### NOTE: Docker Desktop のファイル共有設定について

- ホスト側ソースコードをマウントするためファイル共有を設定します
- npm スクリプト `yarn docker:fileshare` が自動設定します
  - Docker Desktop の設定ファイルにリポジトリルートを追加
  - Docker Desktop の再起動を試みる
  - 失敗する場合は申し訳ありませんが、手動で再起動をお願いします
- 以下ファイルを変更します
  - macOS: ~/Library/Group Containers/group.com.docker/settings-store.json
  - Windows: %APPDATA%/Docker/settings.json または %LOCALAPPDATA%/Docker/settings.json
  - Linux (Docker Desktop): ~/.docker/desktop/settings.json （dockerd なら不要かも）
  - 書き込み権限がなければ失敗します
  - 失敗する場合は申し訳ありませんが、お手元のバージョンの方法で設定変更してください

### 基本手順

- **開発環境の起動** `yarn debug`
- **リリースビルド** `yarn docker:build`
- **リリースビルドの実行** `yarn docker:run` # 別途データベースが必要
- **リリースビルドの ECR コンテナプッシュ** `yarn docker:push`

- **パッケージ追加**
  1. ローカルで `yarn add` / `yarn add -D`
  2. エディタで認識されるか確認
  3. compose 環境を停止（Ctrl+C）
  4. compose 環境を起動（`yarn debug`）
  5. うまくいかない場合はローカルキャッシュの削除を検討

### compose スクリプト構成

- npm スクリプトは主に .docker-compose 以下のスクリプトを呼び出します
- シェルスクリプトは手動で呼び出して構いません

```
<root> ... リポジトリルート
  |- .docker-compose
    |- start-debug ... 開発環境の起動 (= yarn debug)
    |- purge ... 開発環境の破棄（ボリューム含むすべて）
    |- prune ... ローカル Docker 環境の破棄
    |
    |- rdb
    |  |- mysql-root ... mysql root console
    |
    |- dev-app
       |- migrate-reset ... マイグレーション・消去再適用
       |- migrate-diff ... マイグレーション・スキーマ定義と実態DBの差分確認
       |- migrate-create ... マイグレーション・差分生成
       |- migrate-apply ... マイグレーション・未適用の差分適用
       |- mysql ... mysql user console
       |- lint ... 構文検証
       |- test-prepare ... UT前準備
       |- test ... 動作検証
       |- test-coverage ... UTカバレッジ取得
```

実行例:

```
$ .docker-compose/purge   # 開発環境の破棄（ボリューム含むすべて）
```

初回起動時の DB 初期構築（空 DB へマイグレーション適用）

```
$ .docker-compose/dev-app/migrate-apply  # アプリ用 DB
$ .docker-compose/dev-app/test-prepare   # テストランナー用 DB
```

rdb へ ORM アクセスできる REPL（seed 追加に利用）

```
$ .docker-compose/dev-app/repl
```

rdb でコンテナ実行中の mysql へ root ログイン

```
$ .docker-compose/dev-app/mysql
```

- **NOTE:**

  - 開発環境は、一度起動したらしばらく起動したまま利用することになります

  - start-debug で環境開始するとき、コンテナイメージの再作成も指定しています。
    いまところローカルの compose up がキャッシュを保つ際には待たないし、再起動も時折かと思います。

  - コード変換はツールの自動処理に任せ、手動では行いません。
  - コンパイルが素直に行かない場合、compose の再起動またはキャッシュ削除を検討します。
    Ctrl-C は compose 全体を止めます。再度 up するとクリーンに立ち上がります。
    あるいはキャッシュ削除をすると綺麗に起動できます。

  - Dockerfile を編集する前に compose を止めてください（設定変更でコンテナを止められなくなったりします）

  - Dockerfile を編集したら Docker をキャッシュクリアすると綺麗にコンテナを作れます（トラブル回避）
    - purge は compose にあるコンテナイメージとデータベース含むすべてのボリュームを削除します
    - prune は(より強力に)過去のコンテナビルドやダウンロードしたイメージも含め、一通り削除します

**END**
