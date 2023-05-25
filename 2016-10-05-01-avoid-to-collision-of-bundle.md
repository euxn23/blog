---
title: "rubyのbundleがgoのbundleと衝突するのでgoの方を削除する"
date: 2016-10-05
---

rubyプロジェクトを開始しようとbundle initをした際に、bundleコマンドは存在するのにエラーが発生してしまった。

```bash
$ which bundle
/Users/username/.gvm/pkgsets/go1.7.1/global/bin/bundle
```

どうやら、goにもbundleというパッケージがあり、コマンドとして使えるようであるため、衝突してしまっているようである。

どうやらこのbundle、`golang.orgのx/tools`の中に含まれているようである。
適当に`$ go get golang.org/x/tools/...`とした際にインストールされるものである。

----

## 対応
globalでbundleを叩く機会を考えると、(rubyもgoも書くならば)rubyのbundleを優先したいので、グローバルからgoのbundleを消すのが手っ取り早い。
goでインストールしたbinファイルは削除コマンドはないため、直接削除する。

```bash
$ rm $GOPATH/bin/bundle
```

プロジェクトで使用する際はvendoringするなり、gvmのpkgを活用するなりで、そのプロジェクトでのみパスが通るようにするのがよさそうである。
