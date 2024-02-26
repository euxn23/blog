---
title: "複数言語ユーザはどの JetBrains IDE を選ぶべきか ~ライセンスの比較と選定~"
date: 2017-12-21
---

※ 2018/07/31 追記
[現在国際フレンドシップデーにちなんで全製品 50% オフのセールを開催中です。](https://www.jetbrains.com/jp/promo/friends/)(日本時間 2018/08/02 01:00)
既にご利用の製品がある場合、追加でもう 1 年、50% オフで使用できるようです。
この機会にお試しください。私は ALL Productions Pack を契約しました。

## まえおき

この記事は[JetBrains Advent Calendar 2017](https://qiita.com/advent-calendar/2017/jetbrains)の 21 日目です

## 背景

私は業務で Ruby/Python/Go/JS(TS) を書いていま~~す~~した([退職しました](https://blog.euxn.me/entry/2017-12-22_leaving-fjct/))

~~もともと Ruby/Rails が主なエンジニアだったので RubyMine を使っていたのですが~~ 業務で Rails/TS を、趣味で Go を書くため、諸々面倒なことになってきているので、ライセンスまわりを整理するために一度まとめようと思います

## 現在のライセンスと使える言語

全ライセンスの価格は[こちら](https://www.jetbrains.com/store/?fromMenu#edition=personal)

- **学生ライセンスの場合はすべてのプロダクトが無料で使えます。**とにかく急いで使うのだ
- .NET/iOS 等はそれしか選択肢がないので、基本は Web 系の比較をします
- All Product Pack($249) には以下を含め、.NET/iOS 系も含んだすべてのソフトウェアが含まれるそうです
- 表記価格は 1 年目のもので、2 年目、3 年目以降……と少しずつ安くなっていきます。また、本記事執筆当時の価格であるため、変更となる可能性があります
- 過去に学生ライセンスを契約していた等、特定の条件で割引があります。詳しくは[公式の案内](https://www.jetbrains.com/store/?fromMenu#edition=discounts)をご確認ください

|                        | $/Year | JVM Lang | JavaScript | Python | PHP | Ruby | Go  | SQL |                    Other                     |
| :--------------------- | :----: | :------: | :--------: | :----: | :-: | :--: | :-: | :-: | :------------------------------------------: |
| IntelliJ IDEA CE       |   $0   |    o     |     o      |   x    |  x  |  x   | \*  |  x  |                                              |
| IntelliJ IDEA Ultimate |  $149  |    o     |     o      |   o    |  o  |  o   |  o  |  o  |  Python/PHP/Ruby/Go はプラグインとして提供   |
| PyCharm CE             |   $0   |    x     |     x      |   o    |  x  |  x   | \*  |  x  | Python は Web Framework(Django) サポート無し |
| PyCharm                |  $89   |    x     |     o      |   o    |  x  |  x   | \*  |  o  |                                              |
| WebStorm               |  $59   |    x     |     o      |   x    |  x  |  x   | \*  |  o  |                                              |
| PhpStorm               |  $89   |    x     |     o      |   x    |  o  |  x   | \*  |  o  |                                              |
| RubyMine               |  $89   |    x     |     o      |   x    |  x  |  o   | \*  |  o  |                                              |
| GoLand                 |  $89   |    x     |     o      |   x    |  x  |  x   |  o  |  o  |                                              |

\* OpenSource の GoPlugin を使用することで各 IDE で Go を使うことができるが、新機能の開発は停止している模様

## 言語と IDE 選定

### JVM 系/Python のみ

CE を使うのみで済みます。ただし SQL は効きません。

### Python|PHP|Ruby|Go のいずれか 1 つと JS

それぞれ PyCharm/PhpStorm/RubyMine/GoLand を買えば JS が書けるので解決します

### JVM 系|Python と PHP|Ruby|Go のいずれか 1 つ(と JS)

PhpStorm/RubyMine/GoLand と IDEA CE/PyCharm CE を使いましょう

ただし同一プロジェクトを 2 つの IDE で同時に開けないので、JVM/Python プロジェクトの JS という場合にはディレクトリを分けて開くようにする必要があります

scala.js は IDEA Ultimale を買ったほうがよいかもしれない

### PHP|Ruby|Go から 2 つ以上

PhpStorm/RubyMine/GoLand を 2 つ以上買うよりは IntelliJ IDEA Ultimate の方が安く、IDE も 1 つで済みます

重複しているのが Go の場合、バージョンが古いですが、OpenSource のプラグインで代替することも可能ではあります

### iOS と .Net と Ruby と Go みたいなカオスな場合

All Product Pack が $249 です。必要なものと照らし合わせてみてください

## おわりに

業務と個人で使う言語が異なるとか、複数プロジェクトにまたがっているとかいう場合に参考にしてください

また、2 年目以降の割引もあるため、複数言語を今後やるつもりがあって迷っている、という場合には IDEA Ultimate にしてしまうのも 1 つかもしれません

**中の人から[お恵み](https://www.amazon.co.jp/hz/wishlist/ls/3MJDA7W8W7EE8)があると嬉しいです**
