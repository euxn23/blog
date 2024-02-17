---
title: "GitHub Actions 内で他の repository に push する"
date: 2024-02-17
---

追記: よく考えると簡単にできたので大幅に書き換え。元の趣旨である別 repository の workflow の発火は [GitHub Actions 内で他の repository の workflow を発火する](2024-02-17-02-trigger-github-workflow-of-other-repo-in-github-actions) に移植。

---

GitHub Actions 内で他の repository に push しようとした際、素朴に行うと以下のようなエラーが発生する。

```shell
remote: Permission to <owner>/<repo>.git denied to github-actions[bot].
fatal: unable to access 'https://github.com/<owner>/<repo>/': The requested URL returned error: 403
```

これは `Settings > Actions > General > Workflow permissions` を `Read and write permissions` に変更することでは解消しない。
おそらくこの設定は同一 repository 内での write についてのことだからであろう。

これを解決するために、push 先 repository に対する write 権限を持つ一時的な token を発行し push するために、以下を行う。

## 安全な Token の取り回しのために GitHub Apps を作成する

今回のような処理自体は Personal Access Token を使用することでもできるが、 Personal Access Token を使用することは推奨されない。
その理由も含め、具体的な設定手順は以下の記事を参考にする。

[GitHub Apps トークン解体新書：GitHub Actions から PAT を駆逐する技術](https://zenn.dev/tmknom/articles/github-apps-token)

この際 App に付与する権限と理由は以下の通りである。

- Contents: Read and write ... workflow を発火された repository で自身に push するため
- Workflows: Read and write ... workflow を発火された repository の自身への push で workflow ファイルへの変更を許可するため

これらの権限設定で `GitHub Apps のセットアップ > 4. SecretsにApp IDと秘密鍵を登録する` までの手順を実施する。 以降については、次項で説明する。
また、作成した App の repository スコープ(インストール先)は push 対象のみでよい。

## 別 repository に push する workflow を定義する

workflow 定義は以下の通りになる。

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
      - uses: actions/create-github-app-token@v1
        id: app-token
        with:
          app_id: ${{ vars.APP_ID }}
          private_key: ${{ secrets.PRIVATE_KEY }}
          repositories: <target-repo>
      - uses: actions/checkout@v4
        with:
          token: ${{ steps.app-token.outputs.token }}
      - run: |
          git remote add mirror https://github.com/<owner>/<target-repo>.git
          git push mirror -f
```

今回のような mirroring のケースでは、双方が同じソースコードとなる。つまり双方に同一の workflow が存在することとなる。
そのため、push 先で再度 workflow が発火し無限ループとなることを防ぐため、 `if: github.repository == '<owner>/<repo>'` のガード処理を行う。

前述の記事ではサードパーティの `tibdex/github-app-token` が紹介されているが、現在では GitHub 公式の [actions/create-github-app-token](https://github.com/marketplace/actions/create-github-app-token) が利用できるため、こちらを採用している。

上記の手順で App から発行された token を使用するが、 `- uses: actions/checkout` の段階で指定することに注意してほしい。`.git/config` を覗いてみると、 checkout の時点で credentials が設定されていることが確認できる。

## 最後に

なぜこんなことをしたかったかというと、 Cloudflare Pages では 1 repository 1 環境だからである。本件についても別途記事を書く。
