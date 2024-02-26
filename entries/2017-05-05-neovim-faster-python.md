---
title: "init.nvim にpython のpath を指定してneovim の起動速度を早くする"
date: 2017-05-05
---

2017/5/13 編集
neovim のみの挙動であるとご指摘頂いたため修正しました。
global の python を指定するよう修正しました。

---

neovim で python を開いたり、editorconfig 等 python に依存する特定のライブラリを使用する場合、起動速度が遅くなることがあります。
`nvim --startuptime vim.log` とオプションを指定し vim を起動すると、実際にどこが遅いのか確認をすると、python の部分で大きく速度が遅いことがあります。
この部分ですが、python の path の解決に時間がかかっているようなので、python の path 情報を vimrc に記述することで早くなります。

```vim:init.nvim
let g:python_host_prog = expand('~/.pyenv/shims/python2')
let g:python3_host_prog = expand('~/.pyenv/shims/python3')
```

しかしこれでは早くなりませんでした。 `~/.pyenv/shims/python` を確認すると、これは python バイナリではないことが分かりました。
pyenv の場合、python バイナリは `~/.pyenv/versions` 以下にあります。

```vim:init.nvim
let g:python_host_prog = expand('~/.pyenv/versions/miniconda2-latest/bin/python2')
let g:python3_host_prog = expand('~/.pyenv/versions/miniconda3-latest/bin/python3')
```

しかし、バージョンをハードコーディングするのはイケていないため、どうにかします。

> ~~`$ pyenv which python3` とすることで、python バイナリの path が出てくるので、このコマンドを vimrc 内で実行します。~~ > ~~`let g:python_host_prog = systemlist('pyenv which python2 2>/dev/null || which python2')[0]`~~ > ~~`let g:python3_host_prog = systemlist('pyenv which python3 2>/dev/null || which python3')[0]~~

↑ これではグローバルの python が呼ばれないため修正します。
=> [どこにいても pyenv の global の python を呼び出す shellscript](http://qiita.com/yutaszk/items/550582fcd054904c588a)

> ~~vim の `system` では、末尾の改行も含まれてしまうため、 `systemlist` の先頭要素を取得します。~~

systemlist の使用もこちらの方法で避けられます。
=> [shell の出力の末尾の改行を取り除く](http://qiita.com/yutaszk/items/f7c60999a121f906ccdb)

```vim:init.nvim
let g:python_host_prog = system('(type pyenv &>/dev/null && echo -n "$(pyenv root)/versions/$(pyenv global | grep python2)/bin/python") || echo -n $(which python2)')
let g:python3_host_prog = system('(type pyenv &>/dev/null && echo -n "$(pyenv root)/versions/$(pyenv global | grep python3)/bin/python") || echo -n $(which python3)')
```

pyenv でない場合は `which python` の結果で良いため、pyenv を使用していない場合のフォールバックとして指定しておきます。

これによって起動が 0.2 秒ほど早くなりました。
