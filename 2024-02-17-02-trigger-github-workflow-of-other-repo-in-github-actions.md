---
title: "GitHub Actions 内で他の repository の workflow を発火する"
date: 2024-02-17
---

## 安全な Token の取り回しのために GitHub Apps を作成する

今回のような処理自体は Personal Access Token を使用することでもできるが、 Personal Access Token を使用することは推奨されない。
その理由も含め、具体的な設定手順は以下の記事を参考にする。

[GitHub Apps トークン解体新書：GitHub Actions から PAT を駆逐する技術](https://zenn.dev/tmknom/articles/github-apps-token)

この際 App に付与する権限として、 `Actions: Read and write` を設定する。

これらの権限設定で `GitHub Apps のセットアップ > 4. SecretsにApp IDと秘密鍵を登録する` までの手順を実施する。 以降については、次項で説明する。
また、作成した App の repository スコープ(インストール先)は発火対象のみでよい。

## 別 repository の workflow を発火する workflow を定義する

まず先に、具体的な workflow 定義は以下の通りになる。

```yaml
name: trigger-mirror
on:
  push:
    branches:
      - main
  workflow_dispatch:

jobs:
  trigger-mirror:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/create-github-app-token@v1
        id: app-token
        with:
          app_id: ${{ secrets.APP_ID }}
          private_key: ${{ secrets.PRIVATE_KEY }}
          repositories: <target-repo>
      - uses: actions/github-script@v7
        with:
          github-token: ${{ steps.app-token.outputs.token }}
          script: |
            await github.rest.actions.createWorkflowDispatch({
              owner: '<owner>',
              repo: '<target-repo>',
              workflow_id: '<workflow>.yml',
              ref: 'main'
            })
```

前述の記事ではサードパーティの `tibdex/github-app-token` が紹介されているが、現在では GitHub 公式の [actions/create-github-app-token](https://github.com/marketplace/actions/create-github-app-token) が利用できるため、こちらを採用している。

最後の `actions/github-script` では 1 つ前の step の outputs から token を取得し `github-token` として指定する。
API コール箇所で対象の repository と ref を指定する。`workflow_id` には、発火先の workflow ファイル名をそのまま指定すればよい。

## 参考

[How to Trigger Subsequent GitHub Workflow in a Different Repository](https://www.kristhecodingunicorn.com/post/trigger-github-workflow-in-different-repo/)
