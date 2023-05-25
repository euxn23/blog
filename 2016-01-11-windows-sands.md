---
title: "Windowsで実用的なSandS環境を構築(AutoHotKey)"
date: 2016-01-11
---

# 結論
## ahkファイル
[yutaszk/win-sands-ahk](https://github.com/YutaSZK/win-sands-ahk)に置いてあります。
スクリプトまたはバイナリをダウンロードしてお使いください。

## 手順
1. レジストリをいじってSpaceとLShiftを入れ替える(以下ではKeySwapを使用)
2. [yutaszk/win-sands-ahk](https://github.com/YutaSZK/win-sands-ahk)からahkスクリプト/バイナリファイルをダウンロードし実行する

****
# 背景
## SandSとは
Space and Shift: SpaceキーにShiftを割り当て、ワンショット(=他のキーを操作せずにキーを話す)の場合はSpaceを入力することの総称。

## WindowsにおけるSandSの問題
Mac OS XではKarabiner等で簡単にSandS(とキーリマップ)を設定することができるが、Windowsではそのようなもののベストプラクティスがないように見える。
(DvorakJ等のソフトでもできるが、入力受付時間の都合などで誤入力が増えてしまいつらい)
自分で実装するためにキーリマップソフトの[yamy](https://osdn.jp/projects/yamy/)や[AutoHotKey](http://ahkscript.org/)、[keyhac](https://sites.google.com/site/craftware/keyhac-ja)がありますが、これらで実装した公開コードをそのまま実行しても受付時間による誤入力が発生してしまうものが多いのが問題です。
気をつければ使えるんですが、気を使うのが疲れるし、そもそもMacでは気にしなくても問題ないので、つらいなーという状態でした。

## 行っている処理
[WindowsでHHKB Professional2をMac風に使うための設定](http://www.karakaram.com/hhkb-pro2-windows-customize)を参考にスクリプトを記述しました。
こちらはSandSについてではないのですが、ここに書いてあるワンショットの処理を参考にしています。

今まで試した公開スクリプトは**スペースキーを押してから待ち受けし、入力がなかった場合はスペースを入力**といった処理のため誤入力の原因となっていました。
今回は、**SpaceキーとShiftキーをそもそも入れ替えて**しまい、スペースキーを話したタイミングで入力判定を行い、入力がない(=直前の入力キーがShift自身である)場合はスペースを入力するという処理を行っています。

## 注意点
**一部Spaceを含むショートカットが動作しなくなる可能性があるためご注意ください**
こちらでは「Win+Spaceの挙動がおかしい」点を現在確認しています。
また、複数キーでのショートカットにShiftを含む場合、**Shiftを先に押さないと正常に動作しない仕様**になっています。
ShiftとしてのショートカットとSpaceとしてのショートカットの兼ね合いになっているため、難しいところですがご了承お願いします。


# 実行手順
## 1. キー入れ替え
SpaceとShiftを入れ替えるために、レジストリを書き換えます。
直接触りたくないので今回は[KeySwap](http://www.gigafree.net/utility/keyboard/keyswap.html)を使用しました。
変更後はログオフが必要になります。

## 2. ダウンロード
[yutaszk/win-sands-ahk](https://github.com/YutaSZK/win-sands-ahk)にscriptファイルを配置しています。
コンパイル済の実行ファイルは[release v1.0](https://github.com/yutaszk/win-sands-ahk/releases/tag/v1.0)より入手できます。

## 3. AutoHotKeyの実行
AutoHotKeyスクリプト、もしくはコンパイル済exeファイルを実行します。
AutoHotKeyをインストールしていない場合はexeファイルをお使いください。

コンパイル済ファイルをスタートアップに配置すると、PC起動時に毎回実行されます。

****

以上でSandSは動作するようになりましたが、Spaceを含むショートカットで誤動作が発生する場合がありますので、ご了承ください。
不具合等ありましたらご連絡頂けますと幸いです。
