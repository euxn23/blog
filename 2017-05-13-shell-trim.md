---
title: "shell の出力の末尾の改行を取り除く"
date: 2017-05-13
---

設定にpath を渡す時とかにwhich の結果を渡すを改行が入って困るなどがあります。
echo も標準では改行されますが、 `-n` オプションを渡すことで末尾の改行を取り除くことができます。(trim、chomp 等の挙動)

```bash
echo -n $(which python)
```
