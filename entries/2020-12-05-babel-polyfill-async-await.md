---
title: "babel 環境における Polyfill のビルド最適化と async-await の扱い"
date: 2020-12-05
---

## リポジトリ

[euxn23/babel-and-polyfill-sample](https:///github.com/euxn23/babel-and-polyfill-sample)

## 想定読者

- Babel を使っているが、 Polyfill がいまいちわからない方
- Polyfill は使えるが、より最適なビルドを生成したい方
- @babel/polyfill が非推奨になったことを受け現在の推奨実装を知りたい方

## Polyfill とは

例として、以下の Promise を使ったコードを、 @babel/preset-env を使用して IE11 向けにビルドします。

```javascript:input
const main = () => {
  Promise.resolve().then(() => console.log('then'));
}

main();
```

```javascript:output
"use strict";

var main = function main() {
  Promise.resolve().then(function () {
    return console.log('then');
  });
};

main();
```

このように、 babel は文法である `import` (esmodules は文法に含まれる)や`() => {}` を es5 に transpile するのみで、 Promise 等の機能については関与しません。
(ここでは JavaScript のパースに関わるものを文法、実行時に必要な global な Object や、組み込みクラスのメソッドの有無についてを機能、とします)
この不足している機能を補う代表的な手法として、 Polyfill が挙げられます。

## Polyfill を導入する代表的な手段

2020 年末現在、有用な手段としては以下が挙げられるかと思います。

- polyfill.io を html 側で読み込む
- core-js を必要箇所に import する
- @babel/plugin-transform-runtime
- @babel/preset-env の useBuildIns を使用する

polyfill.io については、 [Polyfill.io を使って JavaScript の Polyfill を適用する](https://qiita.com/hkano/items/dfd2c129f4d32fa3ece6) が非常にわかりやすく説明されているため、ここでは詳細を省略します。
※ `@babel/polyfill` は既に非推奨となっており、 `@babel/plugin-transform-runtime` もしくは `@babel/preset-env` と `core-js` の併用を推奨しています。

## core-js を使用する

polyfill 実装である core-js を必要に応じて import します。
たとえば、 Promise を使用する場合、以下のように記述します。

```javascript:input
import "core-js/modules/es.promise"

const main = () => {
  Promise.resolve().then(() => console.log('then'));
}

main();
```

```javascript:output
"use strict";

require("core-js/modules/es.promise");

var main = function main() {
  Promise.resolve().then(function () {
    return console.log('then');
  });
};

main();
```

必要な Polyfill のみを指定して挿入できるためバンドルサイズは小さくなりますが、必要箇所それぞれに挿入することになるため手間がかかるのが難点です。
また、必要な Polyfill を正しく把握している必要があり、 Polyfill の不足によるバグを引き起こす可能性もあるため、注意が必要です。
(下記の useBuildIns: 'usage' の場合では、同一のコードに対して `core-js/modules/es.object.to-string` が挿入されている)
アプリケーションのルートで適用する場合、ビルドバージョンが新しくなってもキャッシュが効き得ることを鑑みると polyfill.io を使う方が手間は少なくなるかと思います。

## @babel/plugin-transform-runtime

https://babeljs.io/docs/en/babel-plugin-transform-runtime
`@babel/runtime{,-corejs{2,3}}` というヘルパーランタイムをビルドファイルに挿入します。
https://babeljs.io/docs/en/babel-runtime
`@babel/polyfill` と違い、 core-js のバージョンを指定して Polyfill することができます。
以下の例では、 core-js@3 を Polyfill として使用しているため、 `core-js@3` に加え、 `@babel/runtime-corejs3` が依存に必要となります。

```javascript:input
const main = () => {
  Promise.resolve().then(() => console.log('then'));
}

main();
```

```json:.babelrc
{
  "presets": [
    [
      "@babel/preset-env",
      {
        "targets": {
          "ie": 11
        }
      }
    ]
  ],
  "plugins": [
    [
      "@babel/plugin-transform-runtime",
      {
        "corejs": 3
      }
    ]
  ]
}
```

```javascript:output
"use strict";

var _interopRequireDefault = require("@babel/runtime-corejs3/helpers/interopRequireDefault");

var _promise = _interopRequireDefault(require("@babel/runtime-corejs3/core-js-stable/promise"));

var main = function main() {
  _promise.default.resolve().then(function () {
    return console.log('then');
  });
};

main();
```

このように、上記の core-js の挿入なく、自動で Promise を `@babel/runtime` のものに置き換えてビルドされます。
(\_interopRequireDefault は、 commonjs と esmodules の default の仕様差異を吸収するヘルパーです)

### async-await と regeneratorRuntime について

さて、ここまで `機能` について触れてきましたが、 `async-await` は文法です。
babel は async-await を非対応ブラウザ向けにどのようにビルドしているか見てみましょう。

```javascript:input
const main = async () => {
  await Promise.resolve()
  console.log('after await')
}

main();
```

```javascript:output
"use strict";

var _interopRequireDefault = require("@babel/runtime-corejs3/helpers/interopRequireDefault");

var _regenerator = _interopRequireDefault(require("@babel/runtime-corejs3/regenerator"));

var _promise = _interopRequireDefault(require("@babel/runtime-corejs3/core-js-stable/promise"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime-corejs3/helpers/asyncToGenerator"));

var main = /*#__PURE__*/function () {
  var _ref = (0, _asyncToGenerator2.default)( /*#__PURE__*/_regenerator.default.mark(function _callee() {
    return _regenerator.default.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            _context.next = 2;
            return _promise.default.resolve();

          case 2:
            console.log('after await');

          case 3:
          case "end":
            return _context.stop();
        }
      }
    }, _callee);
  }));

  return function main() {
    return _ref.apply(this, arguments);
  };
}();

main();
```

async-await は Promise に置換されるのではなく、 regenerator というヘルパーに置換されます。
この `@babel/runtime-corejs3/regenerator` は内部で `regenerator-runtime` というパッケージに依存しています。
つまり、 babel で async-await を非対応ブラウザ向けにビルドし使用するためには、**他の Polyfill 手段を用いていようとも** `@babel/plugin-transform-runtime` により regenerator に変換する必要があります。
async-await が動かない、 regeneratorRuntime が見つからないというエラーが出る、という際のトラブルシューティングとして、ビルドターゲットを `node` にすることで解決する、という情報も見つかりますが、これは async-await 対応環境向けにビルドしているのみで IE11 で動かなくなるので、正しい解決方法ではありません。
参考までに Chrome 86 向けのビルドでは以下のようになります。

```json:.babelrc
{
  "presets": [
  [
    "@babel/preset-env",
    {
      "targets": {
        "chrome": 86
      }
    }
  ]
],
  "plugins": [
  [
    "@babel/plugin-transform-runtime",
    {
      "corejs": 3
    }
  ]
]
}
```

```javascript:output
"use strict";

var _interopRequireDefault = require("@babel/runtime-corejs3/helpers/interopRequireDefault");

var _promise = _interopRequireDefault(require("@babel/runtime-corejs3/core-js-stable/promise"));

const main = async () => {
  await _promise.default.resolve();
  console.log('after await');
};

main();
```

なお、デフォルトでは core-js の設定がオフになっているため一般的には core-js のバージョンを指定して使用しますが、別の方法で Polyfill を挿入している場合、 core-js をオフのままにすることで、 `regenerator` のみを挿入することができます。
この場合は `@babel/runtime` と `regenerator-runtime` が依存に必要になります。

```javascript:output
"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var main = /*#__PURE__*/function () {
  var _ref = (0, _asyncToGenerator2.default)( /*#__PURE__*/_regenerator.default.mark(function _callee() {
    return _regenerator.default.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            _context.next = 2;
            return Promise.resolve();

          case 2:
            console.log('after await');

          case 3:
          case "end":
            return _context.stop();
        }
      }
    }, _callee);
  }));

  return function main() {
    return _ref.apply(this, arguments);
  };
}();

main();
```

### 参考: TypeScript での async-await のコンパイル

`tsc` でコンパイルする場合、以下のようになります。

target が ES2015 以上の場合
-> Promise や Generator に依存したビルドファイルを生成する
target が ES5 以下の場合
-> lib に `ES2015.Promise` `ES2015.Generator` を指定し、同等の動作をするヘルパー関数が挿入される

target が ES5 以下の場合、 lib が不足しているとコンパイルエラーとなります。

## @babel/preset-env による polyfill

https://babeljs.io/docs/en/babel-preset-env

通常の用法の通りに @babel/preset-env を使用した場合、 targets を指定するのみでは polyfill は挿入されません。

```javascript:input
const main = () => {
  Promise.resolve().then(() => console.log('then'));
}

main();
```

```json:.babelrc
{
  "presets": [
    [
      "@babel/preset-env",
      {
        "targets": {
          "ie": 11
        }
      }
    ]
  ]
}
```

```javascript:output
"use strict";

var main = function main() {
  Promise.resolve().then(function () {
    return console.log('then');
  });
};

main();
```

polyfill を挿入するためには、 useBuiltIns というオプションを指定します。
https://babeljs.io/docs/en/babel-preset-env#usebuiltins
useBuiltIns は preset-env の targets(browserslist との integration あり) に合わせて、変換時にそれぞれの処理を行います。

### useBuiltIns: 'entry'

useBuiltIns に `entry` を指定する場合、 targets に合わせ、コード中の `import 'core-js'` を各機能ごとに展開し、 import します。
たとえば、以下のコードを IE11 向けと Chrome 86 向けにそれぞれビルドします。

```javascript:input
import "core-js"

const main = () => {
  Promise.resolve().then(() => console.log('then'));
}

main();
```

```javascript:output(IE11)
"use strict";

require("core-js/modules/es.symbol");

require("core-js/modules/es.symbol.description");

require("core-js/modules/es.symbol.async-iterator");

require("core-js/modules/es.symbol.has-instance");

require("core-js/modules/es.symbol.is-concat-spreadable");

require("core-js/modules/es.symbol.iterator");

require("core-js/modules/es.symbol.match");

require("core-js/modules/es.symbol.replace");

require("core-js/modules/es.symbol.search");

require("core-js/modules/es.symbol.species");

require("core-js/modules/es.symbol.split");

require("core-js/modules/es.symbol.to-primitive");

require("core-js/modules/es.symbol.to-string-tag");

require("core-js/modules/es.symbol.unscopables");

require("core-js/modules/es.array.concat");

require("core-js/modules/es.array.copy-within");

require("core-js/modules/es.array.every");

require("core-js/modules/es.array.fill");

require("core-js/modules/es.array.filter");

require("core-js/modules/es.array.find");

require("core-js/modules/es.array.find-index");

require("core-js/modules/es.array.flat");

require("core-js/modules/es.array.flat-map");

require("core-js/modules/es.array.for-each");

require("core-js/modules/es.array.from");

require("core-js/modules/es.array.includes");

require("core-js/modules/es.array.index-of");

require("core-js/modules/es.array.iterator");

require("core-js/modules/es.array.join");

require("core-js/modules/es.array.last-index-of");

require("core-js/modules/es.array.map");

require("core-js/modules/es.array.of");

require("core-js/modules/es.array.reduce");

require("core-js/modules/es.array.reduce-right");

require("core-js/modules/es.array.slice");

require("core-js/modules/es.array.some");

require("core-js/modules/es.array.species");

require("core-js/modules/es.array.splice");

require("core-js/modules/es.array.unscopables.flat");

require("core-js/modules/es.array.unscopables.flat-map");

require("core-js/modules/es.array-buffer.constructor");

require("core-js/modules/es.date.to-primitive");

require("core-js/modules/es.function.has-instance");

require("core-js/modules/es.function.name");

require("core-js/modules/es.json.to-string-tag");

require("core-js/modules/es.map");

require("core-js/modules/es.math.acosh");

require("core-js/modules/es.math.asinh");

require("core-js/modules/es.math.atanh");

require("core-js/modules/es.math.cbrt");

require("core-js/modules/es.math.clz32");

require("core-js/modules/es.math.cosh");

require("core-js/modules/es.math.expm1");

require("core-js/modules/es.math.fround");

require("core-js/modules/es.math.hypot");

require("core-js/modules/es.math.imul");

require("core-js/modules/es.math.log10");

require("core-js/modules/es.math.log1p");

require("core-js/modules/es.math.log2");

require("core-js/modules/es.math.sign");

require("core-js/modules/es.math.sinh");

require("core-js/modules/es.math.tanh");

require("core-js/modules/es.math.to-string-tag");

require("core-js/modules/es.math.trunc");

require("core-js/modules/es.number.constructor");

require("core-js/modules/es.number.epsilon");

require("core-js/modules/es.number.is-finite");

require("core-js/modules/es.number.is-integer");

require("core-js/modules/es.number.is-nan");

require("core-js/modules/es.number.is-safe-integer");

require("core-js/modules/es.number.max-safe-integer");

require("core-js/modules/es.number.min-safe-integer");

require("core-js/modules/es.number.parse-float");

require("core-js/modules/es.number.parse-int");

require("core-js/modules/es.number.to-fixed");

require("core-js/modules/es.object.assign");

require("core-js/modules/es.object.define-getter");

require("core-js/modules/es.object.define-setter");

require("core-js/modules/es.object.entries");

require("core-js/modules/es.object.freeze");

require("core-js/modules/es.object.from-entries");

require("core-js/modules/es.object.get-own-property-descriptor");

require("core-js/modules/es.object.get-own-property-descriptors");

require("core-js/modules/es.object.get-own-property-names");

require("core-js/modules/es.object.get-prototype-of");

require("core-js/modules/es.object.is");

require("core-js/modules/es.object.is-extensible");

require("core-js/modules/es.object.is-frozen");

require("core-js/modules/es.object.is-sealed");

require("core-js/modules/es.object.keys");

require("core-js/modules/es.object.lookup-getter");

require("core-js/modules/es.object.lookup-setter");

require("core-js/modules/es.object.prevent-extensions");

require("core-js/modules/es.object.seal");

require("core-js/modules/es.object.to-string");

require("core-js/modules/es.object.values");

require("core-js/modules/es.promise");

require("core-js/modules/es.promise.finally");

require("core-js/modules/es.reflect.apply");

require("core-js/modules/es.reflect.construct");

require("core-js/modules/es.reflect.define-property");

require("core-js/modules/es.reflect.delete-property");

require("core-js/modules/es.reflect.get");

require("core-js/modules/es.reflect.get-own-property-descriptor");

require("core-js/modules/es.reflect.get-prototype-of");

require("core-js/modules/es.reflect.has");

require("core-js/modules/es.reflect.is-extensible");

require("core-js/modules/es.reflect.own-keys");

require("core-js/modules/es.reflect.prevent-extensions");

require("core-js/modules/es.reflect.set");

require("core-js/modules/es.reflect.set-prototype-of");

require("core-js/modules/es.regexp.constructor");

require("core-js/modules/es.regexp.exec");

require("core-js/modules/es.regexp.flags");

require("core-js/modules/es.regexp.to-string");

require("core-js/modules/es.set");

require("core-js/modules/es.string.code-point-at");

require("core-js/modules/es.string.ends-with");

require("core-js/modules/es.string.from-code-point");

require("core-js/modules/es.string.includes");

require("core-js/modules/es.string.iterator");

require("core-js/modules/es.string.match");

require("core-js/modules/es.string.pad-end");

require("core-js/modules/es.string.pad-start");

require("core-js/modules/es.string.raw");

require("core-js/modules/es.string.repeat");

require("core-js/modules/es.string.replace");

require("core-js/modules/es.string.search");

require("core-js/modules/es.string.split");

require("core-js/modules/es.string.starts-with");

require("core-js/modules/es.string.trim");

require("core-js/modules/es.string.trim-end");

require("core-js/modules/es.string.trim-start");

require("core-js/modules/es.string.anchor");

require("core-js/modules/es.string.big");

require("core-js/modules/es.string.blink");

require("core-js/modules/es.string.bold");

require("core-js/modules/es.string.fixed");

require("core-js/modules/es.string.fontcolor");

require("core-js/modules/es.string.fontsize");

require("core-js/modules/es.string.italics");

require("core-js/modules/es.string.link");

require("core-js/modules/es.string.small");

require("core-js/modules/es.string.strike");

require("core-js/modules/es.string.sub");

require("core-js/modules/es.string.sup");

require("core-js/modules/es.typed-array.float32-array");

require("core-js/modules/es.typed-array.float64-array");

require("core-js/modules/es.typed-array.int8-array");

require("core-js/modules/es.typed-array.int16-array");

require("core-js/modules/es.typed-array.int32-array");

require("core-js/modules/es.typed-array.uint8-array");

require("core-js/modules/es.typed-array.uint8-clamped-array");

require("core-js/modules/es.typed-array.uint16-array");

require("core-js/modules/es.typed-array.uint32-array");

require("core-js/modules/es.typed-array.copy-within");

require("core-js/modules/es.typed-array.every");

require("core-js/modules/es.typed-array.fill");

require("core-js/modules/es.typed-array.filter");

require("core-js/modules/es.typed-array.find");

require("core-js/modules/es.typed-array.find-index");

require("core-js/modules/es.typed-array.for-each");

require("core-js/modules/es.typed-array.from");

require("core-js/modules/es.typed-array.includes");

require("core-js/modules/es.typed-array.index-of");

require("core-js/modules/es.typed-array.iterator");

require("core-js/modules/es.typed-array.join");

require("core-js/modules/es.typed-array.last-index-of");

require("core-js/modules/es.typed-array.map");

require("core-js/modules/es.typed-array.of");

require("core-js/modules/es.typed-array.reduce");

require("core-js/modules/es.typed-array.reduce-right");

require("core-js/modules/es.typed-array.reverse");

require("core-js/modules/es.typed-array.set");

require("core-js/modules/es.typed-array.slice");

require("core-js/modules/es.typed-array.some");

require("core-js/modules/es.typed-array.sort");

require("core-js/modules/es.typed-array.subarray");

require("core-js/modules/es.typed-array.to-locale-string");

require("core-js/modules/es.typed-array.to-string");

require("core-js/modules/es.weak-map");

require("core-js/modules/es.weak-set");

require("core-js/modules/esnext.aggregate-error");

require("core-js/modules/esnext.array.last-index");

require("core-js/modules/esnext.array.last-item");

require("core-js/modules/esnext.composite-key");

require("core-js/modules/esnext.composite-symbol");

require("core-js/modules/esnext.global-this");

require("core-js/modules/esnext.map.delete-all");

require("core-js/modules/esnext.map.every");

require("core-js/modules/esnext.map.filter");

require("core-js/modules/esnext.map.find");

require("core-js/modules/esnext.map.find-key");

require("core-js/modules/esnext.map.from");

require("core-js/modules/esnext.map.group-by");

require("core-js/modules/esnext.map.includes");

require("core-js/modules/esnext.map.key-by");

require("core-js/modules/esnext.map.key-of");

require("core-js/modules/esnext.map.map-keys");

require("core-js/modules/esnext.map.map-values");

require("core-js/modules/esnext.map.merge");

require("core-js/modules/esnext.map.of");

require("core-js/modules/esnext.map.reduce");

require("core-js/modules/esnext.map.some");

require("core-js/modules/esnext.map.update");

require("core-js/modules/esnext.math.clamp");

require("core-js/modules/esnext.math.deg-per-rad");

require("core-js/modules/esnext.math.degrees");

require("core-js/modules/esnext.math.fscale");

require("core-js/modules/esnext.math.iaddh");

require("core-js/modules/esnext.math.imulh");

require("core-js/modules/esnext.math.isubh");

require("core-js/modules/esnext.math.rad-per-deg");

require("core-js/modules/esnext.math.radians");

require("core-js/modules/esnext.math.scale");

require("core-js/modules/esnext.math.seeded-prng");

require("core-js/modules/esnext.math.signbit");

require("core-js/modules/esnext.math.umulh");

require("core-js/modules/esnext.number.from-string");

require("core-js/modules/esnext.observable");

require("core-js/modules/esnext.promise.all-settled");

require("core-js/modules/esnext.promise.any");

require("core-js/modules/esnext.promise.try");

require("core-js/modules/esnext.reflect.define-metadata");

require("core-js/modules/esnext.reflect.delete-metadata");

require("core-js/modules/esnext.reflect.get-metadata");

require("core-js/modules/esnext.reflect.get-metadata-keys");

require("core-js/modules/esnext.reflect.get-own-metadata");

require("core-js/modules/esnext.reflect.get-own-metadata-keys");

require("core-js/modules/esnext.reflect.has-metadata");

require("core-js/modules/esnext.reflect.has-own-metadata");

require("core-js/modules/esnext.reflect.metadata");

require("core-js/modules/esnext.set.add-all");

require("core-js/modules/esnext.set.delete-all");

require("core-js/modules/esnext.set.difference");

require("core-js/modules/esnext.set.every");

require("core-js/modules/esnext.set.filter");

require("core-js/modules/esnext.set.find");

require("core-js/modules/esnext.set.from");

require("core-js/modules/esnext.set.intersection");

require("core-js/modules/esnext.set.is-disjoint-from");

require("core-js/modules/esnext.set.is-subset-of");

require("core-js/modules/esnext.set.is-superset-of");

require("core-js/modules/esnext.set.join");

require("core-js/modules/esnext.set.map");

require("core-js/modules/esnext.set.of");

require("core-js/modules/esnext.set.reduce");

require("core-js/modules/esnext.set.some");

require("core-js/modules/esnext.set.symmetric-difference");

require("core-js/modules/esnext.set.union");

require("core-js/modules/esnext.string.at");

require("core-js/modules/esnext.string.code-points");

require("core-js/modules/esnext.string.match-all");

require("core-js/modules/esnext.string.replace-all");

require("core-js/modules/esnext.symbol.dispose");

require("core-js/modules/esnext.symbol.observable");

require("core-js/modules/esnext.symbol.pattern-match");

require("core-js/modules/esnext.weak-map.delete-all");

require("core-js/modules/esnext.weak-map.from");

require("core-js/modules/esnext.weak-map.of");

require("core-js/modules/esnext.weak-set.add-all");

require("core-js/modules/esnext.weak-set.delete-all");

require("core-js/modules/esnext.weak-set.from");

require("core-js/modules/esnext.weak-set.of");

require("core-js/modules/web.dom-collections.for-each");

require("core-js/modules/web.dom-collections.iterator");

require("core-js/modules/web.queue-microtask");

require("core-js/modules/web.url");

require("core-js/modules/web.url.to-json");

require("core-js/modules/web.url-search-params");

var main = function main() {
  Promise.resolve().then(function () {
return console.log('then');
  });
};

main();
```

```javascript:output(Chrome86)
"use strict";

require("core-js/modules/esnext.array.last-index");

require("core-js/modules/esnext.array.last-item");

require("core-js/modules/esnext.composite-key");

require("core-js/modules/esnext.composite-symbol");

require("core-js/modules/esnext.map.delete-all");

require("core-js/modules/esnext.map.every");

require("core-js/modules/esnext.map.filter");

require("core-js/modules/esnext.map.find");

require("core-js/modules/esnext.map.find-key");

require("core-js/modules/esnext.map.from");

require("core-js/modules/esnext.map.group-by");

require("core-js/modules/esnext.map.includes");

require("core-js/modules/esnext.map.key-by");

require("core-js/modules/esnext.map.key-of");

require("core-js/modules/esnext.map.map-keys");

require("core-js/modules/esnext.map.map-values");

require("core-js/modules/esnext.map.merge");

require("core-js/modules/esnext.map.of");

require("core-js/modules/esnext.map.reduce");

require("core-js/modules/esnext.map.some");

require("core-js/modules/esnext.map.update");

require("core-js/modules/esnext.math.clamp");

require("core-js/modules/esnext.math.deg-per-rad");

require("core-js/modules/esnext.math.degrees");

require("core-js/modules/esnext.math.fscale");

require("core-js/modules/esnext.math.iaddh");

require("core-js/modules/esnext.math.imulh");

require("core-js/modules/esnext.math.isubh");

require("core-js/modules/esnext.math.rad-per-deg");

require("core-js/modules/esnext.math.radians");

require("core-js/modules/esnext.math.scale");

require("core-js/modules/esnext.math.seeded-prng");

require("core-js/modules/esnext.math.signbit");

require("core-js/modules/esnext.math.umulh");

require("core-js/modules/esnext.number.from-string");

require("core-js/modules/esnext.observable");

require("core-js/modules/esnext.promise.try");

require("core-js/modules/esnext.reflect.define-metadata");

require("core-js/modules/esnext.reflect.delete-metadata");

require("core-js/modules/esnext.reflect.get-metadata");

require("core-js/modules/esnext.reflect.get-metadata-keys");

require("core-js/modules/esnext.reflect.get-own-metadata");

require("core-js/modules/esnext.reflect.get-own-metadata-keys");

require("core-js/modules/esnext.reflect.has-metadata");

require("core-js/modules/esnext.reflect.has-own-metadata");

require("core-js/modules/esnext.reflect.metadata");

require("core-js/modules/esnext.set.add-all");

require("core-js/modules/esnext.set.delete-all");

require("core-js/modules/esnext.set.difference");

require("core-js/modules/esnext.set.every");

require("core-js/modules/esnext.set.filter");

require("core-js/modules/esnext.set.find");

require("core-js/modules/esnext.set.from");

require("core-js/modules/esnext.set.intersection");

require("core-js/modules/esnext.set.is-disjoint-from");

require("core-js/modules/esnext.set.is-subset-of");

require("core-js/modules/esnext.set.is-superset-of");

require("core-js/modules/esnext.set.join");

require("core-js/modules/esnext.set.map");

require("core-js/modules/esnext.set.of");

require("core-js/modules/esnext.set.reduce");

require("core-js/modules/esnext.set.some");

require("core-js/modules/esnext.set.symmetric-difference");

require("core-js/modules/esnext.set.union");

require("core-js/modules/esnext.string.at");

require("core-js/modules/esnext.string.code-points");

require("core-js/modules/esnext.symbol.dispose");

require("core-js/modules/esnext.symbol.observable");

require("core-js/modules/esnext.symbol.pattern-match");

require("core-js/modules/esnext.weak-map.delete-all");

require("core-js/modules/esnext.weak-map.from");

require("core-js/modules/esnext.weak-map.of");

require("core-js/modules/esnext.weak-set.add-all");

require("core-js/modules/esnext.weak-set.delete-all");

require("core-js/modules/esnext.weak-set.from");

require("core-js/modules/esnext.weak-set.of");

require("core-js/modules/web.immediate");

const main = () => {
  Promise.resolve().then(() => console.log('then'));
};

main();
```

Chrome 86 をターゲットにしたビルドでは、 `core-js/modules/es.promise` が追加されていません。このように、ターゲットに合わせて自動で不要なものを削減する機能です。

### useBuiltIns: 'usage'

useBuildIns に `usage` を指定する場合、 targets に合わせ、不足しているものを自動で挿入します。

```javascript:input
const main = () => {
  Promise.resolve().then(() => console.log('then'));
}

main();
```

```json:.babelrc
{
  "presets": [
    [
      "@babel/preset-env",
      {
        "targets": {
          "ie": "11"
        },
        "useBuiltIns": "usage",
        "corejs": {
          "version": 3,
          "proposal": false
        }
      }
    ]
  ]
}
```

```javascript:output
"use strict";

require("core-js/modules/es.object.to-string");

require("core-js/modules/es.promise");

var main = function main() {
  Promise.resolve().then(function () {
    return console.log('then');
  });
};

main();
```

`core-js/modules/es.promise` と、 `core-js/modules/es.object.to-string` が挿入されました。
なお、 Chrome 向けの場合は Polyfill は挿入されません。

```javascript:output
"use strict";

const main = () => {
  Promise.resolve().then(() => console.log('then'));
};

main();
```

### 比較

useBuiltIns では、 usage を使用する方が使用されている機能に応じて Polyfill を挿入するため、 entry で一括で挿入するよりもビルドサイズは小さくなります。
ただし、 usage は現状 experimental であること、 `core-js@3` に依存すること、機能の利用状況を走査するためビルドが遅くなる可能性があること、がプロジェクトにおいて問題ないか検討した上で採用する必要があります。
**なお、** `**async-await**` **については、上記の** `**@babel/plugin-transform-runtime**` **を使用して** `**runtimeRegenerator**` **を挿入する必要があります。** `@babel/plugin-transform-runtime` の項の通り core-js をオフにする(デフォルトでオフなので、オプションを指定しない)ことで、 `regeneratorRuntime` のみ挿入することができます。

## 総括

`@babel/polyfill` を既に使用している場合、もしくは async-await が存在している場合は `@babel/plugin-transform-runtime` を使用するのが良いでしょう。
大掛かりな工事なく既存のコードが Polyfill を意識していないコードである場合、 polyfill.io の使用もしくは @babel/preset-env の useBuiltIns を usage で使うのがもっとも導入が簡単かと思います。
前述の通り polyfill.io はビルドバージョンを超えてキャッシュが効き得る / 他サイトでのキャッシュが生き得る(かつて UMD が見た夢ですね……)可能性があるため、一概にどちらが早いとは断定できません。
polyfill.io という外部サービスに依存することを勘案、計測し、必要に応じて判断するのが良いでしょう。

## TypeError: Class constructor App cannot be invoked without 'new'

`@babel/preset-env` でのビルドを行う場合、 es6 class の継承まわりで上記のバグが発生することがあります。
原因は、 es6 class を継承したものを es5 にトランスパイルすることにより発生しているようです。
多くのライブラリは es5 向けビルドで提供されているかと思いますが、ものによっては `main` として es6 が export されており、このようなバグに遭遇するようです。(筆者は flux-utils で遭遇しました)
詳細と対処方法はこちらの記事をご参考ください。

https://qiita.com/masato_makino/items/00953951bbecbb8e7c9b

上記の通り、解決には副作用が伴い、具体的には babel のビルドターゲットに制約が生まれます。そのため、 useBuiltIns による Polyfill が使えません。
根本解決できない場合は、 transform-runtime による Polyfill を使うことでお茶を濁すのが良いかと思われます。

## おわりに

この記事は[弁護士ドットコムアドベントカレンダー 2020](https://qiita.com/advent-calendar/2020/bengo4com) の 5 日目の記事でした。
(業務委託としてお手伝いさせていただいています！)
明日は [@matsuyoshi30](https://qiita.com/matsuyoshi30) さんの記事です！
