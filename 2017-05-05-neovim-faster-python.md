---
title: "init.nvim にpython のpath を指定してneovim の起動速度を早くする"
date: 2017-05-05
---

2017/5/13 編集
neovim のみの挙動であるとご指摘頂いたため修正しました。
global のpython を指定するよう修正しました。

---

neovim でpython を開いたり、editorconfig 等python に依存する特定のライブラリを使用する場合、起動速度が遅くなることがあります。
`nvim --startuptime vim.log` とオプションを指定しvim を起動すると、実際にどこが遅いのか確認をすると、python の部分で大きく速度が遅いことがあります。
この部分ですが、python のpath の解決に時間がかかっているようなので、python のpath 情報をvimrc に記述することで早くなります。

```vim:init.nvim
let g:python_host_prog = expand('~/.pyenv/shims/python2')
let g:python3_host_prog = expand('~/.pyenv/shims/python3')
```

しかしこれでは早くなりませんでした。 `~/.pyenv/shims/python` を確認すると、これはpython バイナリではないことが分かりました。
pyenv の場合、python バイナリは `~/.pyenv/versions` 以下にあります。

```vim:init.nvim
let g:python_host_prog = expand('~/.pyenv/versions/miniconda2-latest/bin/python2')
let g:python3_host_prog = expand('~/.pyenv/versions/miniconda3-latest/bin/python3')
```

しかし、バージョンをハードコーディングするのはイケていないため、どうにかします。
> ~~`$ pyenv which python3` とすることで、python バイナリのpath が出てくるので、このコマンドをvimrc 内で実行します。~~
> ~~`let g:python_host_prog = systemlist('pyenv which python2 2>/dev/null || which python2')[0]`~~
> ~~`let g:python3_host_prog = systemlist('pyenv which python3 2>/dev/null || which python3')[0]~~

↑これではグローバルのpython が呼ばれないため修正します。
=> [どこにいてもpyenv のglobal のpython を呼び出すshellscript](http://qiita.com/yutaszk/items/550582fcd054904c588a)

> ~~vim の `system` では、末尾の改行も含まれてしまうため、 `systemlist` の先頭要素を取得します。~~

systemlist の使用もこちらの方法で避けられます。
=> [shell の出力の末尾の改行を取り除く](http://qiita.com/yutaszk/items/f7c60999a121f906ccdb)

```vim:init.nvim
let g:python_host_prog = system('(type pyenv &>/dev/null && echo -n "$(pyenv root)/versions/$(pyenv global | grep python2)/bin/python") || echo -n $(which python2)')
let g:python3_host_prog = system('(type pyenv &>/dev/null && echo -n "$(pyenv root)/versions/$(pyenv global | grep python3)/bin/python") || echo -n $(which python3)')
```

pyenv でない場合は `which python` の結果で良いため、pyenv を使用していない場合のフォールバックとして指定しておきます。

これによって起動が0.2秒ほど早くなりました。
