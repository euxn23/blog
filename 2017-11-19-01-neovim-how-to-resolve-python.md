---
title: "neovim はどのように python を解決するか ~ pyenv と python2 ~"
date: 2017-11-19
---

## 結論

- neovim は pyenv がある場合に shims ではなく実態を参照しに行くため遅くない(以前は shims を参照してから実態を解釈していたためか、初期ロードが遅かった)
  - pyenv local を使用している場合、local で指定している python を参照する
- global の python3 を常に指定したい場合は `g:python3_host_prog` に実態を指定する
  - `g:python3_host_prog` が指定されている場合、pyenv による解決よりも優先される
  - pyenv 環境と互換を取る場合、次のように指定することで動作し、遅延もほとんどない
  - `let g:python3_host_prog = system('type pyenv &>/dev/null && echo -n "$(pyenv root)/versions/$(cat $(pyenv root)/version | head -n 1)/bin/python" || echo -n $(which python)')`
- python2 の解決を防ぐことで初期ロードを早くする
  - `let g:python_host_prog = ''` と明示的に指定することで python2 を明示的に無効化できる
  - pyenv で python2 が設定されていると python2 を解決してしまうため、上記を指定する必要がある
  - global に python2 がない場合でも確認を行うためかロードに 0.2ms ほど遅くなるため、上記を指定する方が高速になる
  - `:CheckHealth` コマンドで python2 の情報を確認できる。

## 背景

以前 neovim は pyenv を経由して python を解決すると起動に時間がかかっていました。

また、pyenv に python2 があるとそちらも使用し、pip で `neovim` ライブラリを入れることを求められました。

今回その環境を見直す課程で neovim のソースコードを確認し、上記のような挙動であることを検証しました。

`runtime/autoload/health/provider.vim` に `let python_bin = s:trim(s:system([pyenv, 'which', pyname], '', 1))` という記述があることからも実態を参照していることがわかります。

本稿の速度検証は `$ nvim --startuptime /tmp/nvim-startuptime main.py` コマンドにて、python に依存するプラグインのロードを含めた時間で検証しました。
