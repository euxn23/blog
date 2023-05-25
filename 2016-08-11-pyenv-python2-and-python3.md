---
title: "pyenvでpython2とpython3を同時に使えるようにする"
date: 2016-08-11
---

以下のコマンドでpython、python2、python3が同時に指定できます。

```bash
$ pyenv global 3.5.2 2.7.12


$ python -V
Python 3.5.2

$ python2 -V
Python 2.7.12

$ python3 -V
Python 3.5.2
```

pipも同様にpip2には指定した2系のpythonに付随するpipが当たります。
この状態では3系と2系の両方の実行可能なライブラリにPATHが通っているので、
python3をメインのpythonとして指定しつつ、そのままの状態で2系のライブラリを実行することができます。

これにより、ansible等のpython3未対応のライブラリもそのまま使うことができます。
(特定ディレクトリ下では.python-versionを置いてpython2を指定する、とすると、python3を必要とするプラグイン(deoplete等)が正しく動かなくなってしまいます。)

```bash
$ pip2 install ansible

$ python -V
Python 3.5.2

$ ansible --version
ansible 2.1.1.0
# PATHが通っている
```

あまりやらないと思いますが、pythonコマンドにpython2系を当てたい場合は以下のコマンドでできます。

```bash
$ pyenv global 2.7.12 3.5.2 2.7.12
```
