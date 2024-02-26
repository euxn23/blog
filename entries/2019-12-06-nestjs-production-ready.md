---
title: "NestJS アプリケーションをプロダクションレディにする"
date: 2019-12-06
---

この記事は [NestJS アドベントカレンダー 2019](https://qiita.com/advent-calendar/2019/nestjs) 6 日目の記事です。

## はじめに

この記事では、アプリケーションをプロダクションとして動かす上で必要な手順のうち、いくつかを紹介します。

サンプルコードのリポジトリは以下になります。

https://github.com/nestjs-jp/advent-calendar-2019/tree/master/day06-prepare-for-production-usage

なお、環境は執筆時点での Node.js の LTS である v12.13.1 を前提とします。

## cli で雛形アプリケーションを作成

この記事では `@nestjs/cli` で生成される雛形に対して、プロダクションで実行するための設定を加えてゆきます。

```bash
$ nest new day6-prepare-for-production-usage
```

## config を作る

公式ドキュメントの [Configuration](https://docs.nestjs.com/techniques/configuration) の項では、環境変数を活用するのが良いと説明されています。
重厚にやる場合はドキュメントのように `dotenv` 等を使うのが良いですが、このサンプルでは小さいので、 NODE_ENV での分岐をベースにした config ファイルを作成します。

```config.ts
import { LogLevel } from '@nestjs/common';

interface Config {
  logLevel: LogLevel[];
}

const develop: Config = {
  logLevel: ['debug', 'log', 'verbose', 'warn', 'error'],
};
const production: Config = {
  logLevel: ['log', 'verbose', 'warn', 'error'],
};

export const config =
  process.env.NODE_ENV === 'produiction' ? production : develop;
```

## アプリケーションの logger を設定する

`NestFactory.create()` の引数にオプションを渡すことで、 logger のログレベルを設定できます。先ほどの config を用いて設定してみます。
また、 `app.useLogger` を指定することで、 logger を指定することができます。
デフォルトで NestJS の提供する logger を使っているのですが、次で使用するので明示的に宣言しておきます。

```typescript:main.ts
async function bootstrap() {
  const app = await NestFactory.create(AppModule, { logger: config.logLevel });
  const logger = new Logger();
  app.useLogger(logger);

  await app.listen(3000);
}
```

## middleware にリクエストロガーを設定する

NestJS はデフォルトの場合は express のエンジンを使用するため、 express の作法で middleware を記述することができます。

```typescript:request-logger.middleware.ts
import {
  Request as ExpressRequest,
  Response as ExpressResponse,
} from 'express';

export function requestLogger(
  logger: any,
): (req: ExpressRequest, res: ExpressResponse, next: () => void) => void {
  return (req, res, next): void => {
    res.on('finish', (): void => {
      logger.info(`${req.method} ${req.url} -> ${res.statusCode}`);
    });
    next();
  };
}
```

middleware の設定も express と同じように `app.use()` で設定することができます。

```typescript:main.ts
async function bootstrap() {
  const app = await NestFactory.create(AppModule, { logger: config.logLevel });
  const logger = new Logger();
  app.useLogger(logger);
  app.use(requestLogger(logger));

  await app.listen(3000);
}
```

## CORS の設定

NestJS の標準設定では [CORS](https://developer.mozilla.org/ja/docs/Web/HTTP/CORS) は不許可なので、別のドメインからのアクセスを弾きます。
別ドメインにホスティングしたフロントエンドから NestJS アプリケーションの API を叩けるようにするためには、 CORS を有効にする設定が必要です。

試しに、 fetch を行うだけの html を作り、そこから Nest アプリケーションの API を叩いてみます。

```html:public/index.html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>CORS sample</title>
    <script>
      fetch('http://localhost:3000')
        .then(res => res.text())
        .then(text => console.log(text));
    </script>
  </head>
  <body></body>
</html>
```

NestApplication での CORS を許可する設定は 2 種類あります。両方紹介します。

1. `NestFactory.create()` に `{ cors: true }` のオプションを渡す。

```typescript:main.ts
async function bootstrap() {
  const app = await NestFactory.create(AppModule, { cors: true });
  const logger = new Logger();
  app.useLogger(logger);
  app.use(requestLogger(logger));

  await app.listen(3000);
}
```

2. `app.enableCors()` する。

```typescript:main.ts
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const logger = new Logger();
  app.useLogger(logger);
  app.use(requestLogger(logger));
  app.enableCors()

  await app.listen(3000);
}
```

それぞれ、オプションとして CORS の設定が渡せます。デフォルトでは全許可なので、必要に応じて絞り込んでください。

```typescript:cors-oprions.interface.d.ts
export interface CorsOptions {
    /**
     * Configures the `Access-Control-Allow-Origins` CORS header.  See [here for more detail.](https://github.com/expressjs/cors#configuration-options)
     */
    origin?: boolean | string | RegExp | (string | RegExp)[] | CustomOrigin;
    /**
     * Configures the Access-Control-Allow-Methods CORS header.
     */
    methods?: string | string[];
    /**
     * Configures the Access-Control-Allow-Headers CORS header.
     */
    allowedHeaders?: string | string[];
    /**
     * Configures the Access-Control-Expose-Headers CORS header.
     */
    exposedHeaders?: string | string[];
    /**
     * Configures the Access-Control-Allow-Credentials CORS header.
     */
    credentials?: boolean;
    /**
     * Configures the Access-Control-Max-Age CORS header.
     */
    maxAge?: number;
    /**
     * Whether to pass the CORS preflight response to the next handler.
     */
    preflightContinue?: boolean;
    /**
     * Provides a status code to use for successful OPTIONS requests.
     */
    optionsSuccessStatus?: number;
}
```

## ビルドとプロダクション実行

`@nestjs/cli` の `nest start` コマンドは、内部で [TypeScript をコンパイルしてから実行している](https://github.com/nestjs/nest-cli/blob/master/actions/start.action.ts#L50)ため、起動が遅くなっています。
開発時は `nest start --watch` を使用することで自動でビルド 〜 再起動までしてくれるため回避できますが、プロダクションでは、特にクラウドネイティブな環境では起動が遅いことがパフォーマンスのネックとなることが往々にしてあります。

本来の TypeScript のアプリケーションと同様にビルドして実行するために、 `@nestjs/cli` では、 `nest build` コマンドが用意されています。
標準では dist ディレクトリにファイルが吐き出されるため、その中にある `main.js` を実行します。

```bash
$ yarn build
$ node dist/main.js
```

## 終わりに

この記事では、アプリケーションをプロダクションとして動かす上で必要な手順のうち、いくつかを紹介しました。全てではありませんが、 express をベースとした手法は上記の方法でほとんど実現できると思われます。

明日は @potato4d さんによる、サンプルアプリケーションの実装です。
