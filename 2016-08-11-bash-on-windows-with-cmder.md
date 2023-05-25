---
title: "Bash on Windows + cmderでまともなターミナルを獲得する(tmuxに関する追記有り)"
date: 2016-08-11
---

## 2019/09/01追記
現状では hyper や alacritty が十分安定しているのでそちらを使うのが良さそうです

## 2018/10/23追記
現代では wsl-terminal などを使うか、X Server を立てて Linux 側のターミナルを使うのが良いです

## 2016/8/30追記
この記事で紹介するcmderではtmuxのマウスが動作しません。
tmuxでマウスを使用する場合は、[wslbridge](https://github.com/rprichard/wslbridge)を使用した以下の記事のやり方で行うことを推奨します。tmuxのマウスも動作します。

[Big Sky :: Bash on Ubuntu on Windows の最高の端末環境を教えてやるからちょっと来い。](http://mattn.kaoriya.net/software/bow/20160824234928.htm)

msys2でwslbridgeをビルドする際、gccのバージョンによっては落ちるので、最新にしましょう。

tmuxでマウスを使わない場合は、以下のcmderでのやり方がシンプルで簡単です。


## やること
- cmderを入れてまともなターミナルにする
- cmderのデフォルトシェルをbashにする
- bashでログイン時にzshにする(オプション)

## cmder導入
[cmder](http://cmder.net/)を入れます。
sshクライアントではないので、Windows内で動きます。
(Windows10でなくても、これだけでだいぶまともになります。)
fullサイズ版にはgit bash等もついてくるのですが、今回はubuntuに繋がるbash.exeを使用するため、mini版をインストールします。

## cmderのデフォルトをbashにする。
cmderのタスクバー部分等の右クリックメニューから設定が開けます。

- `Startup > Tasks`で`+`ボタンをクリックして設定を追加します。
- 名前をつけ、Hotkeyやチェックはすべて空白にします。
- 下の実行コマンドを指定する部分を以下のように指定してください。

```
"C:\Windows\System32\bash.exe ~"
```

- `Startup`画面でデフォルトを指定します。Specified named taskにチェックを入れ、先ほどbash.exeを設定したものを指定します。


その他、表示系は好みに設定してください。自分はタブやタスクバーを消したり、半透明にしたりしています。
標準のconsolasでもshellのpowerlineがちゃんと表示されるようです。

## zshでログインするようにする(オプション)
bash on ubuntuでは標準シェルをzshにしていても、bash.exeからのログインでは`/bin/bash`が起動してしまうので、cmder側で設定します。

設定の`Startup > tasks`でbash.exeを指定したタスクの実行コマンドを以下のように書き前ます。

```
C:\Windows\System32\bash.exe ~ -c "export SHELL=/bin/zsh && exec /bin/zsh -l"
```

環境変数SHELLはtmuxを起動する時などにも使用されるので、zshにします。
`exec /bin/zsh -l`でzshで再ログインします。

以前書いた:link: [Windows10のbashをzshで起動するように変更する](http://qiita.com/yutaszk/items/ca0425456b5027d2ee0e)みたいなことはしなくても良さそうです。
