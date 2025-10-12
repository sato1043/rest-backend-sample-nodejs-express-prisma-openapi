# 品質とテスト

## git の運用

- yarn prerequisites を行うと共通設定がローカルの .git/config に設定されます

  - (commit) 改行コード変換を行わない
  - (push) リモート・ローカルのブランチ名を一致させる
  - (fetch/pull) リモート削除済みブランチはローカルからも削除
  - (pull) Fast-Forward のみ（pull が必要ならエラー）
  - 大文字小文字を区別する
  - https: スキーマを使わない
  - http: スキーマを警告しない
  - 設定内容は `.gitconfig_example` に記載

- ssh に github.com を登録します

  ```~/.ssh/config
  ForwardAgent yes
  TCPKeepAlive yes
    :
    :
  Host github.com
    HostName github.com
    User git
    IdentityFile /Users/<your_name>/.ssh/id_ed25519@some_domain
  ```

- pull rebase を使います

- コミットログを書式統一します

  ```
               Issue#  type  scope(opt) verb title
                   \     \      |        |     |
                   #nnn feat(android): add template url parameter to events   (<- without period)
  (empty line) ->
          body ->  追加の情報あれば   (<- within 72 chars per line)
                   本文ではどのようにではなく何をとなぜを説明する
  (empty line) ->
   referenced  ->  Closes #8453
   issues          Closes #8454
  ```

  ```
  <type>:
  - feat (new feature for the user, not a new feature for build script)
  - fix (bug fix for the user, not a fix to a build script)
  - refact (refactoring production code, e.g. renaming a variable)
  - test (adding missing tests, refactoring tests; no production code change)
  - chore (updating grunt tasks etc; no production code change)
  - style (formatting, missing semicolons, etc.; no production code change)
  - build (script, settings, etc. chages to build)
  - docs (changes to the documentation)
  - revert (anything about revert commit)
  ```

  ```
  <scope>:
  scope is just a option, and will be empty in most case. if you want to define scope, then you can write.
  ```

  ```
  <verb>:
  - add A (to B)
  - remove A (from B)
  - move A (from B to C)
  - replace A with B
  - make A B
  - change A to B
  - update A to B
  - ensure that A
  - use A (instead of B for C)
  - fix A
  ```

- コミット前にコンテナビルド `yarn docker:build` が通ることも確認すると良いです
- E2E テストが整備できたら、リリースビルドのコンテナイメージの自動テストが通る確認をしたいところです。

## IDE

- JetBrains を使います
- IDE がコマンドラインでなにをやるか意識します
- .editorconfig を設定します
  - キャラセット UTF-8、改行コード LF
  - インデント ２スペース
  - 行末空白除去、ファイル末尾に改行付加
- コードフォルディングを使います。
  - デフォルトの全コードフォルディングを設定します
- 即時タイプチェック、保存時 lint fix を設定します

## ESLint（シンタクス/書式）

- IDE の eslint 拡張が .eslintrc を検出します。
- 検出できないエディタでは `yarn lint`。
- compose の中で `yarn dev-app:lint`

## ユニットテスト（Jest）

- compose の中で `yarn dev-app:test`
- データアクセス層の UT は compose 上の実 DB に接続します。

- 最大 4 つの jest ワーカーを設定
- 各ワーカー用に DB インスタンス #1 ~ #4 を起動
- テスト実行前にこれらへマイグレーション適用（スキーマ変更毎に手動）
- 運用フロー:
  - スキーマ変更時: `.docker-compose/dev-app/test-prepare`
  - 毎回のテスト: `.docker-compose/dev-app/test`
- テストをワードでフィルタ: `.docker-compose/dev-app/test -t TodoRoutes`
