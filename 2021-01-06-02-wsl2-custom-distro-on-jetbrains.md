---
title: "WSL2 の Custom Distro を JetBrains IDE で開けるようにする"
date: 2021-01-06
---

WebStorm や IntelliJ をはじめとする JetBrains IDE では WSL2 のサポートが部分的に行われていますが、 [yuk7/ArchWSL](https://github.com/yuk7/ArchWSL) のように MicrosoftStore 以外からインストールした Custom Distro については標準では対応されていないため、以下の対応を行う必要があります。

- `%APPDATA%\JetBrains\<product><version>(\config?)\options\wsl.distributions.xml` を編集し、該当の Disrto を追加する。

%APPDATA% とは、一般的に各ユーザのホームディレクトリの AppData (隠しフォルダ) の中の Roaming を指します。
`<descriptors><set>` 以下に Distro の設定を追記します。
executable-path は絶対パスを指定する必要があります。

```xml
<descriptor>
    <id>ARCH</id>
    <microsoft-id>Arch</microsoft-id>
    <executable-path>C:\Arch\Arch.exe</executable-path>
    <presentable-name>Arch Linux</presentable-name>
</descriptor>
```

## 参考

最近ようやく一部の IDE の公式ドキュメントに対応策が掲載されるようになりました。(以前はフォーラムの情報をつなぎ合わせる必要がありました)
https://www.jetbrains.com/help/ruby/configuring-remote-interpreters-using-wsl.html#custom_wsl
