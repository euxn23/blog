---
title: "pyenv と pipenv による python 環境"
date: 2017-11-20
---

## 概要
python の環境構築では pyenv を代表として、virtualenv、pyenv-virtualenv、venv... 等が存在します。

そんな中、比較的最近登場した pipenv というライブラリが virtualenv を pip と連携してうまく使えるようにしてくれており、これらの紛らわしいライブラリの選定に終止符を打ってくれそうです。

## 解説
- pyenv を使用します
    - これは python のビルドを行うためだけに使用し、今回はバージョン管理には使用はしません
    - pyenv で任意の python をインストールし、global に設定します
    - pyenv のshims 経由でも問題ありませんが、今回 pyenv によるバージョン切り替えは行わないため、ビルドしたバイナリに直接 PATH を通しても問題ありません
- pipenv をインストールします
    - global に設定した python の pip でインストールします
- pipenv で環境を作成します
    - 任意のディレクトリで `$ pipenv install` することでvirtualenv が `~/.local/share/virtualenvs` 以下に作成されます
    - 指定しない場合は元と同じ python バージョンで virtualenv が作成されます
    - `--python 3.x.x` のように指定した場合、そのバージョンが pyenv でインストールされた上で virtualenv が作成されます
    - 指定できるバージョンは pyenv でインストール可能なものなら対応しているので、 miniconda の環境も作れます

```
Warning: Python 3.5.3 was not found on your system…
Would you like us to install CPython 3.5.3 with pyenv? [Y/n]:
```

- pipenv 経由でプロジェクトを実行します
    - `$ pipenv run <commands>` で該当の virtualenv の python を PATH に追加した状態で以降のコマンドを実行します。Ruby の bundle exec に近い動作をします
    - `$ pipenv shell` で現在の shell で virtualenv の python に切り替えます
    - `$ pyenv local` に相当するコマンドは現在はないようです

---

- 参考: [Pipenv: 人間のためのPython開発ワークフロー](http://pipenv-ja.readthedocs.io/ja/translate-ja/)
