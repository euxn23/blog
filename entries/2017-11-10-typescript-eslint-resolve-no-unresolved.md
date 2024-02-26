---
title: "TypeScript + eslint で importno-unresolved が出る場合の2つの対処法"
date: 2017-11-10
---

eslint の `plugin:import/errors` を extend している場合に TypeScript を使用していると、拡張子 `.ts` `.tsx` が解釈されず、 resolve されないという問題が発生します。

README にある `import/parsers` に `eslint-typescript-parser` を指定することでは、拡張子解決には影響されないようです。

ぱっと思いつく方法では、 `eslint-import-resolver-typescript` のようなものを使えば良さそうですが、実際に存在するものは DL も star も少ないので不安なので、別の方法で解決します。

## 1. `eslint-import-resolver-node` を使用し、オプションとして拡張子を指定する

この resolver は `es6` や `coffee` 等も解決できるよう、オプションで拡張子が指定できるようになっています。

```yaml
settings:
  import/resolver:
    node:
      extensions:
        - .ts
        - .tsx
```

## 2. `eslint-import-resolver-webpack` を使用し、resolve の設定を流用する

プロジェクトがフロントエンドの場合など、 webpack を使用していてそちらに拡張子解決についての記載があれば、それを eslint での resolve に流用できます。

```yaml
settings:
  import/resolver: webpack
```

もしくは、

```yaml
settings:
  import/resolver:
    webpack:
      config: "webpack.dev.config.js"
```

というように config ファイルを指定することもできます。
Webpack プロジェクトの場合、後者の方が DRY になるので良さそうです。
