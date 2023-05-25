---
title: "Windows 上でのUnix 開発環境 2017年版"
date: 2017-12-01
---

## まえおき

この記事は FUJITSU Advent Calendar 2017 の1日目です。FUJITSU グループ会社勤務の @euxn23 です。

PC メーカー系勤務だと支給マシンがWindows ということがあるかと思います。

こういうときに一般的なのはVM を作成して SSH クライアントから接続すると思いますが、それではクリップボードや日本語文字列周りの不具合に遭遇することがあります。

それらを解決するために Windows 上でUnix 環境を快適に使う方法をいくつか試したので、それを書き記します。


## 求める条件
- クリップボードがUnix 内と共通化されている
- GUI でファイルが操作できる
- まともなターミナルが使える
- 日本語表示の問題が発生しない


## 現状の問題点
- rlogin 等の ssh クライアントから ssh した場合、tmux 等で日本語の挙動がおかしくなる問題
- VM との共有フォルダの場合、Windows のファイル path 長制限に引っかかりライブラリのインストール等が落ちたり、シンボリックリンクが貼れなかったりする問題


## 方法
### 1. Bash on Windows からX11 サーバに転送する

Windows 10 の場合はこれで解決です。

VcXsrv 等のX11 サーバをWindows に入れ、Bash 側で `export DISPLAY=localhost:0.0` を指定すれば使えます。

簡単に試す場合は `$ xeyes` 等でできます。

VcXsrv で起動したターミナルの場合、vim や tmux を含め、クリップボードもWindows 側と共有されるため非常に便利です。

また、日本語の問題も発生していないように見えます。

### 2. SSH のX11 Forwarding 機能を使用してホストのX11 サーバに転送する

Windows 10 以外の場合は、多分これが良いです。

X11 サーバと busybox ベースの Unix シェルを内臓した MobaXTerm が良いです。

SSH コマンドも入っているため、 `$ ssh -X` オプションを使用して手元にX11 Forwarding できます。

ファイラーやエディタもWindows 側の X サーバで操作すれことで、まるでローカルにあるファイルのように操作することができます。

こちらも上記同様、Windows 由来の日本語の問題は発生しないように見えます。(Linux 側の日本語設定はしなければなりませんが)


## まとめ

Windows 側に X11 サーバを立てるのが良さそうです。

---
- 参考: [WindowsでリモートのLinuxのGUIアプリを表示させる－Xサーバ VcXsrv](http://vogel.at.webry.info/201612/article_3.html)
- 参考: [X11 forwarding — 京大マイコンクラブ (KMC)]
(https://www.kmc.gr.jp/advent-calendar/ssh/2013/12/10/X11forwarding.html)
