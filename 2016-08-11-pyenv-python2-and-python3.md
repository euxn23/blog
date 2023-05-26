---
title: "pyenvでpython2とpython3を同時に使えるようにする"
date: 2016-08-11
---

以下のコマンドで python、python2、python3 が同時に指定できます。

```bash
$ pyenv global 3.5.2 2.7.12


$ python -V
Python 3.5.2

$ python2 -V
Python 2.7.12

$ python3 -V
Python 3.5.2
```

pip も同様に pip2 には指定した 2 系の python に付随する pip が当たります。
この状態では 3 系と 2 系の両方の実行可能なライブラリに PATH が通っているので、
python3 をメインの python として指定しつつ、そのままの状態で 2 系のライブラリを実行することができます。

これにより、ansible 等の python3 未対応のライブラリもそのまま使うことができます。
(特定ディレクトリ下では.python-version を置いて python2 を指定する、とすると、python3 を必要とするプラグイン(deoplete 等)が正しく動かなくなってしまいます。)

```bash
$ pip2 install ansible

$ python -V
Python 3.5.2

$ ansible --version
ansible 2.1.1.0
# PATHが通っている
```

あまりやらないと思いますが、python コマンドに python2 系を当てたい場合は以下のコマンドでできます。

```bash
$ pyenv global 2.7.12 3.5.2 2.7.12
```
