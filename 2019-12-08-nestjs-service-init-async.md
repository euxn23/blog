---
title: "NestJS Service 初期化 非同期"
date: 2019-12-08
---

この記事は [NestJS アドベントカレンダー 2019](https://qiita.com/advent-calendar/2019/nestjs) 8 日目の記事です。

## はじめに

この記事では DB のコネクションやクラウドサービスの認証など、 Service として切り出したいが初期化が非同期になるものの扱い方を説明します。

サンプルコードのリポジトリは以下になります。

https://github.com/nestjs-jp/advent-calendar-2019/tree/master/day08-initialize-async-provider

なお、環境は執筆時点での Node.js の LTS である v12.13.1 を前提とします。

## おさらい: NestJS における Provider の初期化タイミング

NestJS の Module において定義された Provider (Service など) は、 NestJS のエントリーポイントで `NestFactory.create()` された際にインスタンスの生成がされます。
`@Injectable()` を追記することにより、 NestJS 内部に隠蔽された DI コンテナでシングルトンとして管理されます。
class の new は同期的に処理されるため constructor も同期的に実行されます。
この記事では、 Provider の非同期な初期化を NestJS の Module の仕組みに乗せて解決する方法を説明します。

## 非同期な初期化処理であるデータベースのコネクション生成を解決する

先日の例では以下のように Domain の Service で DB を初期化しました。

```typescript
import { Injectable } from '@nestjs/common';
import { createConnection, Connection } from 'typeorm';

@Injectable()
export class ItemsService {
  connection: Connection;

  constructor() {
    createConnection({
      type: 'mysql',
      host: '0.0.0.0',
      port: 3306,
      username: 'root',
      database: 'test',
    })
      .then(connection => {
        this.connection = connection;
      })
      .catch(e => {
        throw e;
      });
  }

  // connection が確立していないタイミングがあるため待ち受ける
  private async waitToConnect() {
    if (this.connection) {
      return;
    }
    await new Promise(resolve => setTimeout(resolve, 1000));
    await this.waitToConnect();
  }

  async createItem(title: string, body: string, deletePassword: string) {
    if (!this.connection) {
      await this.waitToConnect();
    }
    await this.connection.query(
      `INSERT INTO items (title, body, deletePassword) VALUE (?, ?, ?)`,
      [title, body, deletePassword],
    );
  }
}
```

しかしこれには設計上の問題が、わかりやすく 2 つは存在します。

1. 他の Domain でも DB 接続を行うことを前提に、 DB 接続管理を別のサービスに委譲するべき
2. constructor で非同期な初期化処理を行なっているので、メソッドの実行タイミングによっては初期化が完了していない


1 の問題を解決するために ItemsModule から切り離し、 DatabaseModule としてそのまま定義すると以下のようになります。

```typescript:database.service.ts
import { Injectable } from '@nestjs/common';
import { createConnection, Connection } from 'typeorm';

@Injectable()
export class DatabaseService {
  connection: Connection;

  constructor() {
    createConnection({
      type: 'mysql',
      host: '0.0.0.0',
      port: 3306,
      username: 'root',
      database: 'test',
    })
      .then(connection => {
        this.connection = connection;
      })
      .catch(e => {
        throw e;
      });
  }
}
```

しかしこれでは上で説明した通り、 connection 確立が非同期なので、完了するまでの間に DB アクセスが呼ばれてしまう恐れがあります。

以下では上記 2 の解決を例に挙げながら、初期化と非同期について説明します。

## Async Providers

NestJS 公式では Module の Custom Provider として `@Module()` に渡すオプションによって様々な Provider の宣言を行える機能が備わっています。

https://docs.nestjs.com/fundamentals/custom-providers

その中でも今回のように特に必要と思われる Async Provider を取り上げます。

https://docs.nestjs.com/fundamentals/async-providers

```typescript
{
  provide: 'ASYNC_CONNECTION',
  useFactory: async () => {
    const connection = await createConnection(options);
    return connection;
  },
}
```

サンプルコードでは connection を直接 provider に指定していますが、上記の Service に当てはめて書き換えてみます。

```typescript:database.service.ts
import { Injectable } from '@nestjs/common';
import { createConnection, Connection } from 'typeorm';


@Injectable()
export class DatabaseService {
  connection: Connection;
  
  async initialize() {
    this.connection = await createConnection({
      type: 'mysql',
      host: '0.0.0.0',
      port: 3306,
      username: 'root',
      database: 'test',
    })
  }
}
```

```typescript:database.module.ts
import { Module } from '@nestjs/common';
import { DatabaseService } from './database.service';


@Module({
  providers: [
    {
      provide: 'DatabaseService',
      useFactory: async () => {
        const databaseService = new DatabaseService();
        await databaseService.initialize();
      },
    },
  ],
})
export class DatabaseModule {}
```

## Async な要素を Service の初期化時に引数として渡す

上記の例でも動作しますが、 initialize された後かどうかの管理が必要になるとともに、状態を持ってしまうため TypeScript とは相性が悪くなってしまいます。
そこで、非同期な要素のみを Service の外で(`@Module() の useFactory 関数内で`)処理し、結果のみを Service に渡して同期的に初期化することで、シンプルな形になります。

```typescript:database.service.ts
import { Injectable } from '@nestjs/common';
import { Connection } from 'typeorm';

@Injectable()
export class DatabaseService {
  constructor(public readonly connection: Connection) {}
}
```

```typescript:database.module.ts
import { Module } from '@nestjs/common';
import { DatabaseService } from './database.service';
import { createConnection } from 'typeorm';

@Module({
  providers: [
    {
      provide: 'DatabaseService',
      useFactory: async () => {
        const connection = await createConnection({
          type: 'mysql',
          host: '0.0.0.0',
          port: 3306,
          username: 'root',
          database: 'test',
        });
        return new DatabaseService(connection);
      },
    },
  ],
})
export class DatabaseModule {}
```

動作を確認するために MySQL を用意します。
以下の 3 ファイルを定義し `docker-compose up` することでこのプロジェクト用に初期化済みの MySQL を起動できます。
Docker を使用しない方は、 `root@0.0.0.0` 向けに `test` データベースを作成し、 `create-table.sql` を流し込んでください。

```yaml:docker-compose.yml
version: '3'

services:
  db:
    build:
      context: .
      dockerfile: Dockerfile
    environment:
      MYSQL_ALLOW_EMPTY_PASSWORD: 'yes'
      MYSQL_DATABASE: test
      TZ: 'Asia/Tokyo'
    ports:
    - 3306:3306
```

```Dockerfile:Dockerfile
FROM mysql:5.7

COPY create-table.sql /docker-entrypoint-initdb.d/create-table.sql
```

```sql:create-table.sql
CREATE TABLE helloworld (message VARCHAR(32));
INSERT INTO helloworld (message) VALUES ("Hello World");
```

次に、database.controller を追加して、動くことを確認します。

```typescript:database.controller.ts
import { Controller, Get } from '@nestjs/common';
import { DatabaseService } from './database.service';

@Controller('database')
export class DatabaseController {
  constructor(private readonly databaseService: DatabaseService) {}

  @Get()
  async selectAll(): Promise<string> {
    const res = await this.databaseService.connection.query(
      `SELECT message FROM helloworld`,
    );
    return res[0].message;
  }
}
```

```bash
$ curl localhost:3000/database
Hello World% 
```

## おわりに

この記事では DB のコネクションやクラウドサービスの認証など、 Service として切り出したいが初期化が非同期になるものの扱い方を説明しました。
明日は @potato4d さんによる TypeORM についての回です。
