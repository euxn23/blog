---
title: "Bash on Windows + cmderでまともなターミナルを獲得する(tmuxに関する追記有り)"
date: 2016-08-11
---

## 2019/09/01 追記

現状では hyper や alacritty が十分安定しているのでそちらを使うのが良さそうです

## 2018/10/23 追記

現代では wsl-terminal などを使うか、X Server を立てて Linux 側のターミナルを使うのが良いです

## 2016/8/30 追記

この記事で紹介する cmder では tmux のマウスが動作しません。
tmux でマウスを使用する場合は、[wslbridge](https://github.com/rprichard/wslbridge)を使用した以下の記事のやり方で行うことを推奨します。tmux のマウスも動作します。

[Big Sky :: Bash on Ubuntu on Windows の最高の端末環境を教えてやるからちょっと来い。](http://mattn.kaoriya.net/software/bow/20160824234928.htm)

msys2 で wslbridge をビルドする際、gcc のバージョンによっては落ちるので、最新にしましょう。

tmux でマウスを使わない場合は、以下の cmder でのやり方がシンプルで簡単です。

## やること

- cmder を入れてまともなターミナルにする
- cmder のデフォルトシェルを bash にする
- bash でログイン時に zsh にする(オプション)

## cmder 導入

[cmder](http://cmder.net/)を入れます。
ssh クライアントではないので、Windows 内で動きます。
(Windows10 でなくても、これだけでだいぶまともになります。)
full サイズ版には git bash 等もついてくるのですが、今回は ubuntu に繋がる bash.exe を使用するため、mini 版をインストールします。

## cmder のデフォルトを bash にする。

cmder のタスクバー部分等の右クリックメニューから設定が開けます。

- `Startup > Tasks`で`+`ボタンをクリックして設定を追加します。
- 名前をつけ、Hotkey やチェックはすべて空白にします。
- 下の実行コマンドを指定する部分を以下のように指定してください。

```
"C:\Windows\System32\bash.exe ~"
```

- `Startup`画面でデフォルトを指定します。Specified named task にチェックを入れ、先ほど bash.exe を設定したものを指定します。

その他、表示系は好みに設定してください。自分はタブやタスクバーを消したり、半透明にしたりしています。
標準の consolas でも shell の powerline がちゃんと表示されるようです。

## zsh でログインするようにする(オプション)

bash on ubuntu では標準シェルを zsh にしていても、bash.exe からのログインでは`/bin/bash`が起動してしまうので、cmder 側で設定します。

設定の`Startup > tasks`で bash.exe を指定したタスクの実行コマンドを以下のように書き前ます。

```
C:\Windows\System32\bash.exe ~ -c "export SHELL=/bin/zsh && exec /bin/zsh -l"
```

環境変数 SHELL は tmux を起動する時などにも使用されるので、zsh にします。
`exec /bin/zsh -l`で zsh で再ログインします。

以前書いた:link: [Windows10 の bash を zsh で起動するように変更する](http://qiita.com/yutaszk/items/ca0425456b5027d2ee0e)みたいなことはしなくても良さそうです。
