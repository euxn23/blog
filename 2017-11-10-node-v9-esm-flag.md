---
title: "Node v9 でフラグ付きで ES Modules の importexport 構文を使用する"
date: 2017-11-10
---

※ 03/22 追記
Node v10 での実装についてより詳細な内容が @about_hiroppy さんによって書かれていますので現在はそちらをご参考ください。
[Node.jsとECMAScript Modules](http://blog.hiroppy.me/entry/nodejs-esm)

---

Node v9 (実際にはv8系の後半から実装されていたようですが)では、フラグ付きで ES Modules の解釈ができるようになっています。
import/export 双方とも `.mjs` となっている必要があるようです。

```js:index.mjs
import Messanger from './messanger'

Messanger.esm()
```

```js:messanger.mjs
export default class Messanger {
    static esm() {
        console.log('Hello ES Modules!')
    }
}
```

```shell
$ node --experimental-modules index.mjs
(node:8348) ExperimentalWarning: The ESM module loader is experimental.
Hello ES Modules!
```

`.mjs` 拡張子で CommonJS を記述すると module が見つからずエラーとなるため、 CJS のファイルの拡張子は `.js` にする必要があります。
CommonJS 形式で記述されている( = 現行の node.js ライブラリ)の場合、 named import ができないため、以下のような記載はエラーになります。

```js:messanger.js
module.exports = class Messanger {
  static esm() {
    console.log('Hello ES Modules!')
  }
}
module.exports.cjs = function() {
  console.log('Hello CommonJS!')
}
```

```js:index.mjs
import Messanger, { cjs } from './messanger' //=> SyntaxError: The requested module does not provide an export named 'cjs'
```

なので、以下のように使います。

```js:index.mjs
import Messanger from './messanger'
const { cjs } = Messanger

cjs() //=> Hello CommonJS!
```

or

```js:index.mjs
import Messanger from './messanger'

Messanger.cjs() //=> Hello CommonJS!
Messanger.esm() //=> Hello ES Modules!
```

後者だと呼び出し上、 Messanger の static メソッドと見分けがつかなくなるため、前者の方が良さそうに感じます。
数年後、ES Modules が標準になればライブラリ群もES Modules でロード可能になるだろうと思うので、それまではライブラリ等の `.js` の named import 不可については意識していく必要がありそうです。

---

参考: [Node.jsのES Modulesサポートの現状確認と備え](http://teppeis.hatenablog.com/entry/2017/08/es-modules-in-nodejs)
