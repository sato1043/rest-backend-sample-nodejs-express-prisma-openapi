# .claude ディレクトリについて

このディレクトリは、AI アシスタント（Claude など）と連携するための設定・プロンプト・参考コンテキストを格納するための場所です。本リポジトリの動作やビルド／テストには影響しません。

使い方の例

- tasks ディレクトリに、よく使う指示やレビュー観点などのプロンプトを置きます。
- context には、AI に参照させたい補助資料のリンクや説明を置きます（機微情報は置かないでください）。

注意事項

- 機密情報や認証情報（API キー等）をこのディレクトリに置かないでください。

参考となる主なプロジェクト資料

- OpenAPI スキーマ: openapi/openapi.static.html（ソース: openapi/openapi-root.yaml）
- Prisma スキーマ: prisma/schema.prisma
- リポジトリ README: README.md
