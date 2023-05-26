---
title: "node_modules 以下のライブラリにPATH を通す"
date: 2017-05-04
---

## 追記(2018/05/07)

現在では `yarn` も使えます。

---

## 追記(2017/08/04)

現在では `npx` を使う方が良いかと思います。

---

古いバージョンの cli を使っているプロジェクト等だと、グローバルインストールするのも管理が面倒、npm 経由でなくても実行したい、等の理由があり、
`$(npm bin)` や `node_modules/.bin` 以下の実行可能ファイルを叩くことがあるかと思います。
そこに PATH を通して少し幸せになります。

## 方法 1. グローバルの `$PATH` に `node_modules/.bin` を追加する

.bashrc や.profile で `export PATH=$PATH:node_modules/.bin` を宣言します。
相対パスも使えますが、グローバルでどこでも相対の `node_modules/.bin` が PATH に入って気持ち悪い場合は方法 2 を使ってください。

## 方法 2. `direnv` を使い `node_modules/.bin` を追加する

[direnv](https://github.com/direnv/direnv) を使い、プロジェクトの `.envrc` ファイルに `` export PATH=$PATH:`pwd`/node_modules/.bin `` を宣言します。
この方法では node_modules 以下に PATH を通したいプロジェクトでだけ使用することができます。
(direnv はそのディレクトリに入った時に `.envrc` を読み込んで環境変数を設定してくれるものです。詳しくはこちら => [direnv を使おう](http://qiita.com/kompiro/items/5fc46089247a56243a62))

## まとめ

- 気にならなければ `export PATH=$PATH:node_modules/.bin`
- 気になるなら direnv
