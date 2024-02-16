---
title: "GitHub Actions 内で他の repository に push するための workaround"
date: 2024-02-17
---

GitHub Actions 内で他の repository に push しようとした際、素朴に行うと以下のようなエラーが発生する。

```shell
remote: Permission to <owner>/<repo>.git denied to github-actions[bot].
fatal: unable to access 'https://github.com/<owner>/<repo>/': The requested URL returned error: 403
```

これは `Settings > Actions > General > Workflow permissions` を `Read and write permissions` に変更することでは解消しない。
おそらくこの設定は同一 repository 内での write についてのことだからであろう。

これを解決するために、他 repository の workflow を発火し、その workflow 内で upstream を pull し自身に push する、という手段を取る。

## 安全な Token の取り回しのために GitHub Apps を作成する

今回の workaround 自体は Personal Access Token を使用することでもできるが、 Personal Access Token を使用することは推奨されない。
その理由も含め、具体的な設定手順は以下の記事を参考にする。

[GitHub Apps トークン解体新書：GitHub Actions から PAT を駆逐する技術](https://zenn.dev/tmknom/articles/github-apps-token)

この際 App に付与する権限と理由は以下の通りである。単に他の repository の workflow を発火することのみしたい場合は、1 つ目のみの付与で良い。

- Actions: Read and write ... 元 repository から他の repository の workflow を発火するため
- Contents: Read and write ... workflow を発火された repository で自身に push するため
- Workflows: Read and write ... workflow を発火された repository の自身への push で workflow ファイルへの変更を許可するため

これらの権限設定で `GitHub Apps のセットアップ > 4. SecretsにApp IDと秘密鍵を登録する` までの手順を実施する。 以降については、次項で説明する。
また、作成した App の repository スコープやインストール先は発火対象のみでよい。

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
    if: github.repository == '<owner>/<repo>'
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
              workflow_id: 'run-mirror.yml',
              ref: 'main'
            })
```

今回のような mirroring のケースでは、双方が同じソースコードとなる。つまり双方に同一の workflow が存在することとなる。
そのため、 mirroring 先で再度 workflow が発火し無限ループとなることを防ぐため、 `if: github.repository == '<owner>/<repo>'` のガード処理を行う。

前述の記事ではサードパーティの `tibdex/github-app-token` が紹介されているが、現在では GitHub 公式の [actions/create-github-app-token](https://github.com/marketplace/actions/create-github-app-token) が利用できるため、こちらを採用している。

最後の `actions/github-script` では 1 つ前の step の outputs から token を取得し `github-token` として指定する。
API コール箇所で対象の repository と ref を指定する。`workflow_id` には、発火先の workflow ファイル名をそのまま指定すればよい。

## push 先で発火する workflow を設定する

以下のような workflow を考える。

```yaml
name: run-mirror
on:
  workflow_dispatch:

jobs:
  run-mirror:
    if: github.repository == '<owner>/<target-repo>'
    permissions:
      contents: write
    runs-on: ubuntu-latest
    steps:
      - uses: actions/create-github-app-token@v1
        id: app-token
        with:
          app_id: ${{ secrets.APP_ID }}
          private_key: ${{ secrets.PRIVATE_KEY }}
          repositories: <target-repo>
      - uses: actions/checkout@v4
        with:
          repository: <owner>/<repo>
          token: ${{ steps.app-token.outputs.token }}
      - run: |
          git remote add mirror https://github.com/<owner>/<target-repo>.git
          git push mirror
```

workflow を発火された側の repository のみで実施する目的で `if: github.repository == '<owner>/<repo>'` のガード処理を行う。前述と異なり、こちらでは workflow を実行された方の repository を指定する。

こちらも同様に App から発行された token を使用するが、 `actions/checkout` の段階で指定することに注意してほしい。`.git/config` を覗いてみると、 checkout の時点で credentials が設定されているようであったため、そのためであろう。

## 最後に

なぜこんなことをしたかったかというと、 Cloudflare Pages では 1 repository 1 環境だからである。本件についても別途記事を書く。

## 参考

[How to Trigger Subsequent GitHub Workflow in a Different Repository](https://www.kristhecodingunicorn.com/post/trigger-github-workflow-in-different-repo/)
