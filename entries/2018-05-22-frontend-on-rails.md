---
title: "Webpacker でやっていけるか！？ Frontend on Rails"
date: 2018-05-22
---

## 2018/05/23 追記

entry 作る箇所だけ小さく別ライブラリにしました。
[euxn23/webpacker-entry](https://github.com/euxn23/webpacker-entry)

## はじめに

この内容は [meguro.es#15](https://megurocss.connpass.com/event/85649/) での発表を元に内容を整理したものです。

リポジトリ: [euxn23/webpacker-pure-config](https://github.com/euxn23/webpacker-pure-config)

スライド: [slideshare](https://www.slideshare.net/euxn/20180522-can-i-go-along-with-webpacker-frontendonrails)

## Rails で JS つらかった問題

- 標準設定で ES6 が使えない
- JS ライブラリの gem 移植 hoge-rails の本体追従が遅い
- gem 経由でインストールされる JS / CSS ライブラリ
- Sprockets という独自のモジュールバンドラ

## Webpacker の誕生

- Rails 5.1 で標準搭載
- Webpacker を Rails に合わせて使えるように作られた Ruby / JS ライブラリ
- 隠蔽されたゼロコンフィグの Webpack
- npm エコシステムベースのビルドフローが使える
- Rails 向けの View Helper

**普通の JS 開発ができる！！**

## 本当に？

- 環境変数で分岐するモジュール(Undocumented)

```javascript
const createEnvironment = () => {
  const path = resolve(__dirname, "environments", `${nodeEnv}.js`);
  const constructor = existsSync(path) ? require(path) : Environment;
  return new constructor();
};
```

- 独自の config 記法

```javascript
// Set nested object prop using path notation
environment.config.set("resolve.extensions", [".foo", ".bar"]);
environment.config.set("output.filename", "[name].js");

// Merge custom config
environment.config.merge(customConfig);

// Delete a property
environment.config.delete("output.chunkFilename");
```

- webpack v4 への未追従

> Webpacker makes it easy to use the JavaScript pre-processor and bundler webpack 3.x.x+ to manage application-like JavaScript in Rails.
> ![webpack-entry.png](https://qiita-image-store.s3.amazonaws.com/0/85885/eff0a6aa-d228-24ae-06e8-60830502e698.png)

![](/static/images/webpacker-npm.png)![webpacker-npm.png](https://qiita-image-store.s3.amazonaws.com/0/85885/3176b2a4-4b84-1524-93b2-46103aaa0e44.png)

## 何がつらいか

- 独自の設定構文を覚える必要がある
- 既存の webpack.config をそのまま使えない
- Undocumented な挙動
- Webpack 本体への追従の遅さ

**webpacker.js 危険なのでは？**

## 脱 webpacker.js

### config の要件

- ruby 側の webpacker のデフォルト設定で動くようにする
  - JS の配置ディレクトリ(public/packs or public/packs-test)
  - キャッシュ回避のためのハッシュ(Rails の作法)
    ![webpack-manifest.png](https://qiita-image-store.s3.amazonaws.com/0/85885/ba869e98-2e03-3165-f632-d46328d51290.png)
  - ManifestPlugin ベースの key-value の entry 設定
    ![webpack-entry.png](https://qiita-image-store.s3.amazonaws.com/0/85885/09fa8148-aa4f-4041-d2c3-f22869865fb6.png)

{ [relativePath]: absolutePath }

### 実装

```javascript
const readdirRecursivelySync = (baseDir, options = {}) =>
  fs
    .readdirSync(baseDir, options)
    .map(
      path =>
        fs.statSync(`${baseDir}/${path}`).isDirectory()
          ? readdirRecursivelySync(`${baseDir}/${path}`, options)
          : `${baseDir}/${path}`
    )

const flatten = paths => {
  const flattened = paths.reduce(
    (prev, next) =>
      Array.isArray(next) ? [...prev, ...next] : [...prev, next],
    []
  )
  return flattened.filter(Array.isArray).length > 0
    ? flatten(flattened)
    : flattened
}

{
    mode: 'development',
    devtool: 'cheap-module-source-map',
    entry: flatten(readdirRecursivelySync(baseDir))
      .filter(p => extensions.includes(extname(p)))
      .reduce(
        (prev, next) => ({
          ...prev,
          [relative(
            '.',
            `${dirname(relative(baseDir, next))}/${basename(next, extname(next))}`
          )]: next
        }),
        {}
      ),

...
```

**煩雑**

## ライブラリ化

[euxn23/webpacker-pure-config](https://github.com/euxn23/webpacker-pure-config)

### 特徴

- webpack 準拠の config で実装
  - 公式 Docs 準拠に読み書き可能

```javascript
return {
  mode: 'development',
  devtool: 'cheap-module-source-map',
  entry: mapPathArrayToEntryHash(
    readdirRecursivelySyncFlatten(baseDir),
    baseDir,
    extensions
  ),
  output: {
    filename: '[name]-[chunkhash].js',
    chunkFilename: '[name]-[chunkhash].chunk.js',
    hotUpdateChunkFilename: '[id]-[hash].hot-update.js',
    path: resolve('./public/packs'),
    publicPath: '/packs/'
  },
  module: {
    strictExportPresence: true,
    rules
  },
  plugins: [
    new ManifestPlugin({ publicPath: '/packs/', writeToFileEmit: true })
  ],
...
```

- 暗黙的な NODE_ENV 依存無し(環境別に提供)

```javascript
const { dev } = require("webpacker-pure-config");
module.exports = dev();
```

- Config Object が export されるだけなので Rest Spread で拡張可能

```javascript
module.exports = {
  ...baseConfig,
  plugins: [
    ...baseConfig.plugins,
    new webpack.DefinePlugin({
      "process.env.NODE_ENV": JSON.stringify(process.env.NODE_ENV),
    }),
  ],
};
```

- Rails / webpacker.yml 依存無し(ゼロコンフィグ)

## Q. Webpack に追従できるの？

A. 独自機能とかないのでまあ、がんばります(がんばりましょう)(一緒にメンテしてください)
