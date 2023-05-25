---
title: "Slack の絵文字をexportimport する"
date: 2017-08-13
---

# export

slack のemoji 情報はAPI で取得できますが、一括でやろうとすると大変なので、emoji 取得くんを作りました。

__[yutaszk/slack-emoji-export](https://github.com/yutaszk/slack-emoji-export)__

0. https://api.slack.com/apps からemoji 取得用のアプリを作成
0. Permissions からScope を `emoji:read` に設定
0. API Token を環境変数 `$SLACK_API_TOKEN` に宣言
0. 環境に対応したバイナリファイルを実行

emoji ディレクトリ以下に絵文字が生成されます。

# import

ドラッグ&ドロップで絵文字を複数import できるChrome Extension の[Slack Emoji Tool](https://chrome.google.com/webstore/detail/slack-emoji-tools/anchoacphlfbdomdlomnbbfhcmcdmjej) で簡単にできます。
