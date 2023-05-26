---
title: "WSL2中心のWindowsでの開発環境構築"
date: 2021-03-17
---

## WSL2 とは？

- Windows Subsystem for Linux の 2
- NT カーネルの上で動かしていた 1 と違い、 2 は Hyper-V による完全な VM
- もはや Subsystem じゃないじゃんという声も

## WSL2 は普通の Linux VM とはどこが違うのか

- CPU/MEM を事前割当せず動的に Windows と共有
  - ビルドのときだけちゃんと CPU 持っていくとか
- (PATH が通っていれば) Windows の exe が動く
  - WSL2 側から Powershell.exe を叩ける
  - explorer.exe で Mac の open 相当ができる
  - `$ webstorm.exe .` でディレクトリを渡しながら開くなども(これは WebStorm が頭いい)
- Systemd がない
  - Docker は Docker for Windows が使える(こちらも同様 Hyper-V ベース)

## WSL2 の課題点

- fs と IO
  - Linux 領域は ext4 なので高速
  - Linux 領域を Windows から / Windows 領域(/mnt/c) を Linux からを触る場合は NFS 越しなので遅い
- Linux であり、 Windows ではない
  - 自 OS 向けビルドをそのまま行うと当然 Linux 向けビルドが出てくる
  - Windows 向けビルドをするには一工夫が必要
- クリップボードが別
  - それぞれの OS のコマンドを叩いて行き来させるしかない
- ネットワークが分離されている
  - localhost でのアクセスはブリッジされるがそれ以外は……
  - ローカル IP が動的に生成されるのでポートフォワードは都度行わないといけない
- Systemd が動かない
  - みんな大好き resilio sync が動かせない

## そんな WSL2 をうまく使うための Workaround たち

### Genie で systemd を動かす

- PID1 で systemd を動かすためのソフトウェア
- WSL2 の VM 起動時に genie を起動する必要がある
- 後述する Windows 起動時スクリプトを使用する

### Windows 起動時スクリプト

- ローカルグループポリシーエディターの奥深くで任意のタイミングにコマンドを実行できるスクリプトという機能がある
- ログイン時に wsl.exe から genie を起動するなど
- ログイン時に powershell.exe からファイアウォールのポートフォワードの設定をするなど

### win32yank と xsel でクリップボード共有をがんばる

- win32yank.exe という xsel のようなものを叩き Windows のクリップボードに送る
- Windows からの貼り付けは Ctrl(+Shift)+V を使う
- Vim 対応も
  ![](https://static.blog.euxn.me/kpYYmA5g.png)

### .exe を呼べばなんでもできる

- Windows から PATH を通してある .exe は WSL2 のシェル上から実行可能
  - PATH を全部通すと補完が遅くなるので絞ったほうが良いです
- Windows に入れた node.exe を WSL から実行して Windows 向け Electron ビルドを作ったり
  - 開発時に開かれる GUI も Windows 側で開かれる
  - puppeteer も node.exe なら Windows で動く
- Powershell.exe を実行すればだいぶ色々できる
  - 上記の起動時スクリプトでやっているようなことを WSL2 のライフサイクルにすることも
  - ![](https://static.blog.euxn.me/fCpeqRtA.png)

![](https://static.blog.euxn.me/klKzK0Rg.png)

## Windows まともなターミナルない問題も Windows Terminal が解決

- 当初のがっかり感はかなり解消し、現在は Windows で最も良さそう
- GPU レンダリングなので速い(Hyper が遅い……)
- 日本語入力もマウス操作も tmux も問題ない(Alacritty は日本語とマウスが……)

### Powershell でさえいい感じにできる

- busybox を入れて PATH を通すだけでもかなり快適に
- 見た目を良するには starship がシュッと入って綺麗になって便利
  - https://starship.rs/ja-jp/
- シェル言語としてはかなり高機能なので、使ってみると嬉しさがわかる

https://www.dropbox.com/s/hyyul82t93r120q/starship-demo.webm?dl=0

## ArchWSL のすすめ

https://github.com/yuk7/ArchWSL

- 普段使いは最新のパッケージが降ってきてほしいしパッケージビルドもいい感じにしたい
- メジャーバージョンアップのたびにぶっこわれの修理も環境構築しなおしたくない
- 最近の Arch はなかなか壊れないので良いです
  - Ubuntu の方が何が原因で壊れたのか分からなくて困ることありませんか
