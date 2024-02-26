---
title: "どこにいてもpyenv のglobal のpython を呼び出すshellscript"
date: 2017-05-13
---

特定のプロジェクトのディレクトリ以下で pyenv local されていても global の python を実行したい(と言うより global の python の設定を使用して欲しい)場合に使えます。

global 　の python はこれで実行できます。

```bash
"$(pyenv root)/versions/$(pyenv global | grep python3)/bin/python"
```

ただし、pyenv が入っていない環境も想定される場合は、以下のようにすると良いでしょう。

```bash
(type pyenv &>/dev/null && "$(pyenv root)/versions/$(pyenv global | grep python3)/bin/python") || python3
```

単に path のみを取得する場合は以下の通りです。

```bash
(type pyenv &>/dev/null && echo -n "$(pyenv root)/versions/$(pyenv global | grep python3)/bin/python") || echo -n $(which python3)
```

どういう時に困っていたかというと、miniconda のプロジェクトで独自の env を使用している状態で neovim を起動すると、その時の python で実行されてしまうので、プラグインが入っていないという問題が発生した時でした。
neovim 以外でも、global の python にプラグインをインストールして使用する各種の場合は、config で上記のように global の path を指定するとどこでも問題なく動きます。
