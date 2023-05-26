---
title: "Slack の絵文字をexportimport する"
date: 2017-08-13
---

# export

slack の emoji 情報は API で取得できますが、一括でやろうとすると大変なので、emoji 取得くんを作りました。

**[yutaszk/slack-emoji-export](https://github.com/yutaszk/slack-emoji-export)**

0. https://api.slack.com/apps から emoji 取得用のアプリを作成
1. Permissions から Scope を `emoji:read` に設定
2. API Token を環境変数 `$SLACK_API_TOKEN` に宣言
3. 環境に対応したバイナリファイルを実行

emoji ディレクトリ以下に絵文字が生成されます。

# import

ドラッグ&ドロップで絵文字を複数 import できる Chrome Extension の[Slack Emoji Tool](https://chrome.google.com/webstore/detail/slack-emoji-tools/anchoacphlfbdomdlomnbbfhcmcdmjej) で簡単にできます。
