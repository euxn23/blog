---
title: "wsl.exe をユーザと開始位置を指定して起動する"
date: 2020-09-05
---

`$ wsl.exe $LOCATION -u $USERNAME`

これを応用すると任意のターミナルアプリで開始位置を指定できる(通常 ~ だと思うが)
Windows Terminal の場合、プロファイルに以下のように指定している。

```json
{
  "guid": "{xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx}",
  "hidden": false,
  "commandline": "wsl.exe ~"
}
```

Alacritty の場合、 alacritty.yml 以外にも .exe の起動時引数として `wsl.exe ~` 等渡すことで、 alacritty.yml の設定記述を上書きして指定できます。
