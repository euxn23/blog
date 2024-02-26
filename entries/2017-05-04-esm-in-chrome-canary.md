---
title: "Chrome Canary でビルドせずにES Moduels を使う方法と現状"
date: 2017-05-04
---

@addyosmani 氏が日本時間 5/2 に Twitter で「ES6 Modules が Chrome Canary で動くようになりました」という旨のツイートをしていたので試しました。

[https://twitter.com/addyosmani/status/859296190323597313](https://twitter.com/addyosmani/status/859296190323597313)

## Chrome 側の設定

Chrome Canary とは Chrome の Beta より先のビルドです。別途インストールが必要な独立したソフトウェアです。
Chrome の URL から `chrome://flags` と入力し、隠し機能の有効化の画面へ。
`Experimental Web Platform` を有効にすることで、ES Modules が使えます。

## 使ってみる

```html:index.html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>MyModuleHTML</title>
</head>
<body>
<script type="module" src="main.js"></script>
</body>
</html>
```

```js:main.js
import MyDefaultModule, { MyNamedModule } from './my-module.js';

MyDefaultModule.sayHello();
MyNamedModule.sayHello();
```

```js:my-module.js
export default class MyDefaultModule {
  static sayHello() {
    console.log('Hello, here is my default module!');
  }
}

export class MyNamedModule {
  static sayHello() {
    console.log('Hello, here is my named module!');
  }
}
```

import するモジュールは相対パスで拡張子まで含める必要があります。

これらのファイルがあるディレクトリで、 `http-server` 等でサーバを立て index.html を開くと、各モジュールの出力がコンソールに確認でき、動作していることがわかります 🙆

## ライブラリの使用を試みる

```js
import React from "react";
```

=> ブラウザが壊れる

```js
import React from "./react";
```

=> `(x) GET http://localhost:8000/src/react `

```js
import React from "../node_modules/react/react.js";
```

=> `(x) Uncaught SyntaxError: The requested module does not provide an export named 'default'`

`default` がないようです。

```js
import { React } from "../node_modules/react/react.js";
```

=> `(x) Uncaught SyntaxError: The requested module does not provide an export named 'React'`

```js
import { Component } from "../node_modules/react/react.js";
```

=> `(x) Uncaught SyntaxError: The requested module does not provide an export named 'Component'`

`React` も `Component` もないようです。

```js
import * as React from "../node_modules/react/react.js";
```

=> `(x) react.js:3 Uncaught ReferenceError: module is not defined at react.js:3`

`*` で読み込むことはできましたが、ライブラリの側で `module` がないとエラーになっています。

## 結果

これらのことから、AMD 形式の `module.exports` や `export.ModuleName` をいい感じに解釈するところまではやってくれないようであることが分かりました。
なので、既存の node_modules のライブラリをそのまま使用することは現状ではできないように見えます。
(私の知識が浅く検証が足りない場合はご意見いただけますと幸いです。)
node.js 側でも ES Modules が正式に採用され、多くのライブラリが ES Modules に対応するまで待つことになるのかもしれません。
一応、html 側に script タグでライブラリを追加すれば使えなくはないですが……
もしくは、node_modules 以下の module をいい感じに ES Modules にするツールとか……？
何れにしても ChromeCanary なので、しばらくは使えたとしても開発時にビルド時間を短縮する目的でしか使用できないと思われます。

## 参考

- [ECMAScript modules in browsers](https://jakearchibald.com/2017/es-modules-in-browsers/)
