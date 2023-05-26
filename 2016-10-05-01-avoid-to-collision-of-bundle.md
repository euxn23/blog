---
title: "rubyのbundleがgoのbundleと衝突するのでgoの方を削除する"
date: 2016-10-05
---

ruby プロジェクトを開始しようと bundle init をした際に、bundle コマンドは存在するのにエラーが発生してしまった。

```bash
$ which bundle
/Users/username/.gvm/pkgsets/go1.7.1/global/bin/bundle
```

どうやら、go にも bundle というパッケージがあり、コマンドとして使えるようであるため、衝突してしまっているようである。

どうやらこの bundle、`golang.orgのx/tools`の中に含まれているようである。
適当に`$ go get golang.org/x/tools/...`とした際にインストールされるものである。

---

## 対応

global で bundle を叩く機会を考えると、(ruby も go も書くならば)ruby の bundle を優先したいので、グローバルから go の bundle を消すのが手っ取り早い。
go でインストールした bin ファイルは削除コマンドはないため、直接削除する。

```bash
$ rm $GOPATH/bin/bundle
```

プロジェクトで使用する際は vendoring するなり、gvm の pkg を活用するなりで、そのプロジェクトでのみパスが通るようにするのがよさそうである。
