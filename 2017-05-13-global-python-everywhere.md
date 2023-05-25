---
title: "どこにいてもpyenv のglobal のpython を呼び出すshellscript"
date: 2017-05-13
---

特定のプロジェクトのディレクトリ以下でpyenv local されていてもglobal のpython を実行したい(と言うよりglobal のpython の設定を使用して欲しい)場合に使えます。


global　のpython はこれで実行できます。

```bash
"$(pyenv root)/versions/$(pyenv global | grep python3)/bin/python"
```

ただし、pyenv が入っていない環境も想定される場合は、以下のようにすると良いでしょう。

```bash
(type pyenv &>/dev/null && "$(pyenv root)/versions/$(pyenv global | grep python3)/bin/python") || python3
```

単にpath のみを取得する場合は以下の通りです。

```bash
(type pyenv &>/dev/null && echo -n "$(pyenv root)/versions/$(pyenv global | grep python3)/bin/python") || echo -n $(which python3)
```

どういう時に困っていたかというと、miniconda のプロジェクトで独自のenv を使用している状態でneovim を起動すると、その時のpython で実行されてしまうので、プラグインが入っていないという問題が発生した時でした。
neovim 以外でも、global のpython にプラグインをインストールして使用する各種の場合は、config で上記のようにglobal のpath を指定するとどこでも問題なく動きます。
