---
title: "Windows 上でのUnix 開発環境 2017年版"
date: 2017-12-01
---

## まえおき

この記事は FUJITSU Advent Calendar 2017 の 1 日目です。FUJITSU グループ会社勤務の @euxn23 です。

PC メーカー系勤務だと支給マシンが Windows ということがあるかと思います。

こういうときに一般的なのは VM を作成して SSH クライアントから接続すると思いますが、それではクリップボードや日本語文字列周りの不具合に遭遇することがあります。

それらを解決するために Windows 上で Unix 環境を快適に使う方法をいくつか試したので、それを書き記します。

## 求める条件

- クリップボードが Unix 内と共通化されている
- GUI でファイルが操作できる
- まともなターミナルが使える
- 日本語表示の問題が発生しない

## 現状の問題点

- rlogin 等の ssh クライアントから ssh した場合、tmux 等で日本語の挙動がおかしくなる問題
- VM との共有フォルダの場合、Windows のファイル path 長制限に引っかかりライブラリのインストール等が落ちたり、シンボリックリンクが貼れなかったりする問題

## 方法

### 1. Bash on Windows から X11 サーバに転送する

Windows 10 の場合はこれで解決です。

VcXsrv 等の X11 サーバを Windows に入れ、Bash 側で `export DISPLAY=localhost:0.0` を指定すれば使えます。

簡単に試す場合は `$ xeyes` 等でできます。

VcXsrv で起動したターミナルの場合、vim や tmux を含め、クリップボードも Windows 側と共有されるため非常に便利です。

また、日本語の問題も発生していないように見えます。

### 2. SSH の X11 Forwarding 機能を使用してホストの X11 サーバに転送する

Windows 10 以外の場合は、多分これが良いです。

X11 サーバと busybox ベースの Unix シェルを内臓した MobaXTerm が良いです。

SSH コマンドも入っているため、 `$ ssh -X` オプションを使用して手元に X11 Forwarding できます。

ファイラーやエディタも Windows 側の X サーバで操作すれことで、まるでローカルにあるファイルのように操作することができます。

こちらも上記同様、Windows 由来の日本語の問題は発生しないように見えます。(Linux 側の日本語設定はしなければなりませんが)

## まとめ

Windows 側に X11 サーバを立てるのが良さそうです。

---

- 参考: [Windows でリモートの Linux の GUI アプリを表示させる－X サーバ VcXsrv](http://vogel.at.webry.info/201612/article_3.html)
- 参考: [X11 forwarding — 京大マイコンクラブ (KMC)]
  (https://www.kmc.gr.jp/advent-calendar/ssh/2013/12/10/X11forwarding.html)
