---
title: "vim の set に変数や関数を使いたいときは let &varname とする"
date: 2021-04-24
---

```vim
set var_name=s:my_var "<- error
let &var_name=s:my_var "<- valid
let &var_name=s:my_var . cool "<- これも valid
let &var_name=expand('~/.config') "<- これも valid
```
