---
title: "[考古学] coffeescript の元ネタと後世に与えたと思われる影響"
date: 2019-12-20
---

この記事は [JavaScript アドベントカレンダー 2019](https://qiita.com/advent-calendar/2019/javascript) の 20 日目の記事です。

## はじめに

CoffeeScript という AltJS が存在します。2017 年には ES2015+ にも対応した CoffeeScript2 も出ました。
現在では使われていないものの、 CoffeeScript が与えた(と思われる)影響は大きく、 JavaScript の複雑な歴史事情を学ぶ必要のない現代においても、考古学として価値のあるものかと思います。

そんな私が大好きだった CoffeeScript ですが、この記事ではその特徴を紹介します。
プロダクションでは使わない方が良いですが、趣味プロダクトでは全然使えるかと思います。

なお、元ネタとして Ruby や Python、 Haskell がよく登場します。

## Arrow Function

言わずと知れた `() => { ... }` 記法です。厳密に言及されていないはずですが、おそらく CoffeeScript の与えた影響は大きいでしょう。
おそらく元ネタは Ruby の lambda の糖衣構文である `add = (int, int) -> ...` か、 Haskell の関数定義 `add :: Int -> Int -> Int` かと思います。

今でこそ有名な `=>` 記法ですが、当時の CoffeeScript ではどちらかというと `->` が使われており、現在の ES2015+ における `=>` と同義であるのも後者です。
CoffeeScript における `=>` は `function() { ... }` の置き換えであり、 this のスコープが実行時決定になります。対して、 `->` は ES2015+ の Arrow Function と同じ、 this を bind した挙動になります。

なお、 CoffeeScript では `function` キーワードが存在しないため、関数定義は全て変数への Arrow Function の代入で行う必要があります。
ここで JavaScript の関数とはどういうものかを学んだ人も多いと思います。

## Template Literal

今ではおなじみの記法ですね。

```javascript
const message = `count: ${count}`;
```

Ruby が元ネタなのか、 coffeescript では Ruby と同じ記法で `""` で囲い、 `#{}` を使って展開しています。

```coffee
message = "count: #{count}"
```

## Object 記法ベースの Class

以下のように Class を定義しています。

```coffee
class Animal
  constructor: (@name) ->

  move: (meters) ->
    alert @name + " moved #{meters}m."
```

Python や YAML のようなインデントベースで Object を表す記法を利用した Class 定義で、 ES5 に変換すると以下になります。

```javascript
(function () {
  var Animal;

  Animal = (function () {
    function Animal(name) {
      this.name = name;
    }

    Animal.prototype.move = function (meters) {
      return alert(this.name + (" moved " + meters + "m."));
    };

    return Animal;
  })();
}).call(this);
```

大変でしたね…… なお Decaffeinate および CoffeeScript2 では ES2015+ の class 構文に変換されます。

ちなみにこの Object 記法を Class と呼ぶのは、かつての `React.createClass` にも使用されていました。影響の有無は不明です。

```javascript
var Hello = React.createClass({
  getInitialState: function() {
    return {message: 'Hello!'};
  },

  render: function() {
    return (<div>{{hello}}<div/>);
  }
});
```

考古学的に興味のある方向けに以下のリンクを置いておきます。ここにある `create-react-class` は `React.createClass` が独立されたパッケージです。

[React without ES6](https://reactjs.org/docs/react-without-es6.html)

## Class Fields

[decaffeinate](https://github.com/decaffeinate/decaffeinate) で脱 CoffeeScript をがんばった人にはこれが一番つらかったのではないでしょうか。

JavaScript 仕様として Class Fields が定義されるより以前にトランスパイラなし + ES2015+ Classes で static な Class Fields 相当を使用するには以下のようなコードでした。

```javascript
class Cat {}
Cat.type = "Siamese";
```

この使用上、 `name` という static field は使えません。

さらに悪いことに、 decaffeinate ではこの Class 定義の後付けを隠蔽するような以下のようなコードが出力されました。

```javascript
var Cat = (function () {
  let type = undefined;
  Cat = class Cat {
    static initClass() {
      type = "Siamese";
    }
  };
  Cat.initClass();
  return Cat;
})();
```

## Optional Chaining

```javascript
const obj = {
  user: {
    name:
      'euxn'
    }
  }
}

console.log(obj?.user)
```

これも、 CoffeeScript にはいち早く入っていました。
Ruby でも 2.3(2015 年 12 月)で safe navigation operator が入ったので、元ネタはどこでしょう……？

## おわりに

CoffeeScript の影響であると直接語られることは少ないですが、多くの影響を言語に、そしてコミュニティに与えたことでしょう。
新規プロダクトで見かけることはないでしょうが、この偉大な言語のことを覚えておいてもらえると、ふとしたときに感謝を感じられるかと思います。

なお、既存プロダクトに CoffeeScript がある場合は、[ご相談ください](https://twitter.com/euxn23)。
