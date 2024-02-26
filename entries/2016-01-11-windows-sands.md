---
title: "Windowsで実用的なSandS環境を構築(AutoHotKey)"
date: 2016-01-11
---

# 結論

## ahk ファイル

[yutaszk/win-sands-ahk](https://github.com/YutaSZK/win-sands-ahk)に置いてあります。
スクリプトまたはバイナリをダウンロードしてお使いください。

## 手順

1. レジストリをいじって Space と LShift を入れ替える(以下では KeySwap を使用)
2. [yutaszk/win-sands-ahk](https://github.com/YutaSZK/win-sands-ahk)から ahk スクリプト/バイナリファイルをダウンロードし実行する

---

# 背景

## SandS とは

Space and Shift: Space キーに Shift を割り当て、ワンショット(=他のキーを操作せずにキーを話す)の場合は Space を入力することの総称。

## Windows における SandS の問題

Mac OS X では Karabiner 等で簡単に SandS(とキーリマップ)を設定することができるが、Windows ではそのようなもののベストプラクティスがないように見える。
(DvorakJ 等のソフトでもできるが、入力受付時間の都合などで誤入力が増えてしまいつらい)
自分で実装するためにキーリマップソフトの[yamy](https://osdn.jp/projects/yamy/)や[AutoHotKey](http://ahkscript.org/)、[keyhac](https://sites.google.com/site/craftware/keyhac-ja)がありますが、これらで実装した公開コードをそのまま実行しても受付時間による誤入力が発生してしまうものが多いのが問題です。
気をつければ使えるんですが、気を使うのが疲れるし、そもそも Mac では気にしなくても問題ないので、つらいなーという状態でした。

## 行っている処理

[Windows で HHKB Professional2 を Mac 風に使うための設定](http://www.karakaram.com/hhkb-pro2-windows-customize)を参考にスクリプトを記述しました。
こちらは SandS についてではないのですが、ここに書いてあるワンショットの処理を参考にしています。

今まで試した公開スクリプトは**スペースキーを押してから待ち受けし、入力がなかった場合はスペースを入力**といった処理のため誤入力の原因となっていました。
今回は、**Space キーと Shift キーをそもそも入れ替えて**しまい、スペースキーを話したタイミングで入力判定を行い、入力がない(=直前の入力キーが Shift 自身である)場合はスペースを入力するという処理を行っています。

## 注意点

**一部 Space を含むショートカットが動作しなくなる可能性があるためご注意ください**
こちらでは「Win+Space の挙動がおかしい」点を現在確認しています。
また、複数キーでのショートカットに Shift を含む場合、**Shift を先に押さないと正常に動作しない仕様**になっています。
Shift としてのショートカットと Space としてのショートカットの兼ね合いになっているため、難しいところですがご了承お願いします。

# 実行手順

## 1. キー入れ替え

Space と Shift を入れ替えるために、レジストリを書き換えます。
直接触りたくないので今回は[KeySwap](http://www.gigafree.net/utility/keyboard/keyswap.html)を使用しました。
変更後はログオフが必要になります。

## 2. ダウンロード

[yutaszk/win-sands-ahk](https://github.com/YutaSZK/win-sands-ahk)に script ファイルを配置しています。
コンパイル済の実行ファイルは[release v1.0](https://github.com/yutaszk/win-sands-ahk/releases/tag/v1.0)より入手できます。

## 3. AutoHotKey の実行

AutoHotKey スクリプト、もしくはコンパイル済 exe ファイルを実行します。
AutoHotKey をインストールしていない場合は exe ファイルをお使いください。

コンパイル済ファイルをスタートアップに配置すると、PC 起動時に毎回実行されます。

---

以上で SandS は動作するようになりましたが、Space を含むショートカットで誤動作が発生する場合がありますので、ご了承ください。
不具合等ありましたらご連絡頂けますと幸いです。
