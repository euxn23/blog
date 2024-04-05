---
title: "babelで環境変数を使うときはenvifyではなくbabel pluginを使う"
date: 2016-03-27
---

2016/12/20 追記
環境変数を使ってビルドする場合は、Webpack の Define Plugin を使うのが良さそうです。
http://qiita.com/mikakane/items/5ab96c4c7e187ab6c9f1

---

開発環境と本番環境で endpoint 等を振り分けたいとき、node であれば以下のように書ける。

```js
const config = {
  development: {
    endpoint: "dev.api.example.com",
  },
  production: {
    endpoint: "api.example.com",
  },
};
const endpoint = config[process.env.NODE_ENV].endpoint;
```

しかし、babel を使用したフロントエンドでは、`process`の指す先が異なり、環境変数を参照できないため、動作しない。
browserify でビルドする際に環境変数で振り分けを行うには[envify](https://github.com/hughsk/envify)を用いていたが、babel の場合は transform-inline-environment-variables というプラグインが存在する。

http://babeljs.io/docs/plugins/transform-inline-environment-variables/

envify でも同様のことができるのだが、browserify コマンドが複雑になってしまうため、このプラグインに代替した。

```shell
$ npm install babel-plugin-transform-inline-environment-variables
```

browsefiry を実行する際には、以下のように plugin として指定する。

```shell
$ browserify src/web.js -o public/js/app.js -t [ babelify --presets [ es2015 ] --plugins [ transform-inline-environment-variables ] ]
```

これにより、上記のような node と同様のコードが動作する。
実際には、トランスパイルする際に`process.env.NODE_ENV`の部分が該当する環境変数に置き換えられるため、`config["development"]`と書かれたことになる。
そのため、ビルドされたファイルには指定された環境以外の変数も含まれるので、その点は注意が必要。

export を分岐したり require で指定したり試したができなかったため、別環境の変数を隠蔽する場合の知見を頂ければ幸いです。
