---
title: "WSL2 の vscode-server に PATH を通す"
date: 2021-04-29
---

Widnows の Remote Server として vscode-server をインストールした場合、コミット番号を含む場所にインストールされ、
`~/.vscode-server/bin/${commit-id}/bin/code`に code コマンドが存在します。
更新のたびに代わる commit-id を glob で表現したいところですが、 PATH に、というか環境変数に glob を書いても展開されないため、以下の手法で展開します。

https://blog.euxn.me/entry/2021-04-29-01-way-to-use-glob-path-pattern-in-path/

以下のように設定すると PATH が通ります。

```shell
resolve_glob () {
  local IFS=":"
  echo "$*"
}
export PATH=$PATH:`resolve_glob ~/.vscode-server/bin/*/bin`
```

zsh の場合は匿名関数が使えるので

```shell
IFS=":" export PATH=$PATH:`() { echo "$*"; } ~/.vscode-server/bin/*/bin`
```

とできます。
