---
title: "rbenvのrubyでreadlineが使えなくなってしまった場合はrubyをビルドし直す"
date: 2016-10-05
---

ruby の pry でのデバッグ等で readline を内部で使用しているが、ある日突然使えなくなってしまうことがある。
pry の場合は以下のようなエラーが出る。

```
Sorry, you can't use Pry without Readline or a compatible library.
Possible solutions:
 * Rebuild Ruby with Readline support using `--with-readline`
 * Use the rb-readline gem, which is a pure-Ruby port of Readline
 * Use the pry-coolline gem, a pure-ruby alternative to Readline
```

ruby をビルドした後に readline の方のバージョンが上がってしまったことが原因のようなので、メッセージに従い ruby をビルドし直すのが良さそうである。
そもそも OS に readline が入っていない場合は、OS に応じて readline を事前に入れる必要がある。

```bash
$ rbenv uninstall ruby 2.x.x
$ rbenv install ruby2.x.x
```

以前にビルドした際にはフラグを付与せずとも readline が動作していたし、やり直した際も付与せずにビルドし、問題なく動作している。
一度動作していたバージョンならフラグ無しで通常のビルドでも問題なさそうだが、うまくいかない場合はフラグを付与すると良さそうである。
