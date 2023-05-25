---
title: "Nextjs と Differential Loading"
date: 2019-12-07
---

この記事は [Next.js アドベントカレンダー 2019](https://qiita.com/advent-calendar/2019/next-js) の 7 日目の記事です。

## はじめに

[Chrome Dev Summit 2019 に参加してきた](https://blog.euxn.me/entry/2019/11/16/000000)のですが、その中で Google が Next.js を手厚くサポートしているという話があり、特にビルドと配信について興味深かったのでかいつまんで紹介します。
なお該当の動画は以下にあります。13分あたりから Next.js についての話になります。

https://developer.chrome.com/devsummit/sessions/advancing-the-web-framework-ecosystem/

## 現在の JS のビルドと更なる最適化

現在の JavaScript のビルドでは、 Webpack + Babel を使用しているフレームワークが多くあるかと思います。
そして ES2015+ や TypeScript を用いて記述しつつも、多くのブラウザで動くような JavaScript にコンパイルする、いわゆる後方互換性のある形での開発をしていることが多いと思います。

しかしこの問題として、例えば IE11 で動くようにトランスパイルされた結果、モダンブラウザにとっては過剰に(という表現が適切でないかもしれませんが)トランスパイルされており、必要以上に容量の大きな JS ファイルになっていることがあります。

例えば、以下の RestSpread を用いたコードをトランスパイルしてみます。

```javascript
const restSpread = (arr) => [...arr]
```

これを `@babel/preset-env` の target を esmodules に指定してトランスパイルすると以下になります。

```javascript
"use strict";

function _toConsumableArray(arr) { return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _nonIterableSpread(); }

function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance"); }

function _iterableToArray(iter) { if (Symbol.iterator in Object(iter) || Object.prototype.toString.call(iter) === "[object Arguments]") return Array.from(iter); }

function _arrayWithoutHoles(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = new Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } }

var restSpread = function restSpread(arr) {
  return _toConsumableArray(arr);
};
```

しかし、例えば最近の Chrome にとっては、トランスパイルせずとも解釈できるコードであるため、無駄が生じています。

## type="module" と Differential Loading

上記の問題を解決するために、HTML の仕様になった `script` タグの `type="module"` および `nomodule` を活用する手法があります。

例えば、以下のような script タグ定義を html に記述します。

```html:mixed
<script type="module" src="main.mjs"></script>
<script nomodule src="main.legacy.js"></script>
```

この例では、モダンブラウザは `type="module"` と `nomodule` の両方を解釈できるため、 `main.mjs` のみを解釈し、 `main.legacy.js` は `nomodule` によってスキップします。
逆に `type="module"` が実装されていないブラウザの場合、 `type="module"` を解釈できないため `main.mjs` をスキップしますが、同様に nomodule も解釈できませんがこちらは `type` ではないため、そのまま `src` の解釈に進み、 `main.legacy.js` のみを解釈します。

詳しくは以下の記事にて紹介されています。

https://web.dev/codelab-serve-modern-code/

Angular は v8 からこの仕組みを活用した Differential Loading の機能を標準搭載しました。
Next.js では現在この仕組みは採用されていませんが、 [babel/preset-modules](https://github.com/babel/preset-modules) を活用して搭載しようとしていると Chrome Dev Summit 2019 で発表されました。

## babel/preset-modules の仕組み

上記の `type="module"` の仕組みによって、 `type="module"` 採用以前のブラウザと以後のブラウザの分類を、ブラウザエンジンのレイヤーで(ユーザによる JavaScript 無しに！)解決できることになりました。
そこで `type="module"` 対応以後のブラウザのみを対象とする preset である `babel/preset-modules` が登場しました。
上記のパターン(babel/preset-modules の github 内では nomodule pattern と呼ばれています)向けにビルドする場合、以下のように設定します。

```json:.babelrc
{
  "env": {
    "modern": {
      "presets": [
        "@babel/preset-modules"
      ]
    },
    "legacy": {
      "presets": [
        "@babel/preset-env"
      ]
    }
  }
}
```

このようなビルドの設定をすることで、フレームワーク非依存で Differential Loading が実現できるようになります。

## 終わりに

本記事では Next.js のみというより、フレームワークとビルドというテーマでしたが、 Differential Loading は JS の読み込みパフォーマンスを劇的に改善する可能性を見せてくれます。
Next.js では現在は `nomodule` フィールドを使用して polyfill を配信するのみですが、 index.html の生成まで含めて Differential Loading が対応される日も近いのではないでしょうか。
