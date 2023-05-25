---
title: "NestJS でダミーの Service を注入し、外部依存のないテストを実行する"
date: 2019-12-04
---

この記事は [NestJS アドベントカレンダー 2019](https://qiita.com/advent-calendar/2019/nestjs) 4 日目の記事です。

## はじめに

[先日は Module と DI について説明しました](https://qiita.com/euxn23/items/acce35485feed5badf4b)が、本日はもう一歩進んだ DI を活用したテストを実施してみます。
なお、サンプルでは MySQL に接続したり Docker を使用したりしていますが、怖がらないでください。
この記事では MySQL や Docker に依存せずにテストできるようにするテクニックを説明します。


サンプルコードのリポジトリは以下になります。

https://github.com/nestjs-jp/advent-calendar-2019/tree/master/day04-inject-dummy-service-to-avoid-external-dependency

なお、環境は執筆時点での Node.js の LTS である v12.13.1 を前提とします。


## サンプルアプリの雛形を作る

今回のサンプルとなるアプリケーションの雛形を cli を用いて作ってゆきます。

```bash
$ nest new day4-inject-dummy-service
$ nest g module items
$ nest g controller items
$ nest g service items
```

ItemsController には以下のように Post と Get を実装していきます。

```typescript:items/items.controller.ts
@Controller('items')
export class ItemsController {
  constructor(private readonly itemsService: ItemsService) {}

  @Post()
  async createItem(@Body() { title, body, deletePassword }: CreateItemDTO) {
    const item = await this.itemsService.createItem(
      title,
      body,
      deletePassword,
    );

    return item;
  }

  @Get()
  async getItems() {
    const items = await this.itemsService.getItems();

    return items;
  }
}
```

ItemsService も雛形を作成します。

```typescript:items/items.service.ts
@Injectable()
export class ItemsService {
  async createItem(title: string, body: string, deletePassword: string) {
    return;
  }

  async getItems() {
    return [];
  }
}
```

## MySQL にデータを書き込む箇所を実装する

今回は Service の外部依存先として、 MySQL を例にあげます。
MySQL に接続するため、以下のライブラリをインストールします。

```bash
$ yarn add typeorm mysql
```

なお、今回は TypeORM の複雑な機能は極力使用せずにサンプルを記述します。
TypeORM についての説明や NestJS との組み合わせ方については別の記事で説明します。
また、本来は constructor で非同期の初期化を行うべきではないのですが、回避策は複雑なので、こちらも別途説明します。

```typescript:items/items.service.ts
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

  async getItems() {
    if (!this.connection) {
      await this.waitToConnect();
    }
    const rawItems = await this.connection.query('SELECT * FROM items');
    const items = rawItems.map(rawItem => {
      const item = { ...rawItem };
      delete item.deletePassword;

      return item;
    });

    return items;
  }
}
```

また、 MySQL を Docker で立ち上げます。

```bash
$ docker-compose up
```

Docker ではない MySQL で実行する場合、 MySQL に `test` データベースを作り、 `create-table.sql` を流してください。

この状態でアプリケーションを起動してみましょう。MySQL が起動していれば、無事起動するはずです。

```bash
$ yarn start:dev
```

続いて curl でアプリケーションの動作確認をしてみます。

```bash
$ curl -XPOST -H 'Content-Type:Application/json' -d '{"title": "hoge", "body": "fuga", "deletePassword": "piyo"}' localhost:3000/items
```

```bash
$ curl locaohost:3000/items
[{"title":"hoge","body":"fuga"}]
```

無事保存できるアプリケーションができました。


## MySQL がない状態でもテストできるようにする

アプリケーションができたので、Mock を使ってテストを記述します。

前回までのサンプルでは特に DI を意識する必要がなかったため `new ItemsService()` としてテストを記述していましたが、
今回は DI に関連するため、 cli で自動生成される雛形にも用いられている `Test` モジュールを使用します。

```typescript
describe('ItemsController', () => {
  let itemsController: ItemsController;
  let itemsService: ItemsService;

  beforeEach(async () => {
    const testingModule: TestingModule = await Test.createTestingModule({
      imports: [ItemsModule],
    }).compile();

    itemsService = testingModule.get<ItemsService>(ItemsService);
    itemsController = new ItemsController(itemsService);
  });

  describe('/items', () => {
    it('should return items', async () => {
      expect(await itemsController.getItems()).toHaveLength(1);
    });
  });
});
```

さて、この状態でテストを実行するとどうなるでしょうか。
MySQL を起動している場合はそのままテストが通りますが、 MySQL を停止すると以下のようにテストが落ちてしまいます。

```
$ jest
 PASS  src/app.controller.spec.ts
 FAIL  src/items/items.controller.spec.ts
  ● ItemsController › /items › should return items

    connect ECONNREFUSED 0.0.0.0:3306

          --------------------
      at Protocol.Object.<anonymous>.Protocol._enqueue (../node_modules/mysql/lib/protocol/Protocol.js:144:48)
      at Protocol.handshake (../node_modules/mysql/lib/protocol/Protocol.js:51:23)
      at PoolConnection.connect (../node_modules/mysql/lib/Connection.js:119:18)
      at Pool.Object.<anonymous>.Pool.getConnection (../node_modules/mysql/lib/Pool.js:48:16)
      at driver/mysql/MysqlDriver.ts:869:18
      at MysqlDriver.Object.<anonymous>.MysqlDriver.createPool (driver/mysql/MysqlDriver.ts:866:16)
      at MysqlDriver.<anonymous> (driver/mysql/MysqlDriver.ts:337:36)
      at step (../node_modules/tslib/tslib.js:136:27)
      at Object.next (../node_modules/tslib/tslib.js:117:57)

Test Suites: 1 failed, 1 passed, 2 total
Tests:       1 failed, 1 passed, 2 total
Snapshots:   0 total
Time:        1.204s, estimated 3s
```

ItemsService を Mock していますが、 ItemsService の初期化自体はされており、初期化処理の中で MySQL への接続しようとしているのが原因です。
このような、 **外部へ依存する Provider の初期化** をテストから除外するために、 ItemsService を上書きした状態で `testingModule` を生成する機能が NestJS には備わっています。

以下のように `DummyItemsService` class を定義し、 `overrideProvider` を使って上書きします。

```typescript
class DummyItemsService {
  async createItem(title: string, body: string, deletePassword: string) {
    return;
  }
  async getItems() {
    const item = {
      id: 1,
      title: 'Dummy Title',
      body: 'Dummy Body',
    };
    return [item];
  }
}

describe('ItemsController', () => {
  let itemsController: ItemsController;
  let itemsService: ItemsService;

  beforeEach(async () => {
    const testingModule: TestingModule = await Test.createTestingModule({
      imports: [ItemsModule],
    })
      .overrideProvider(ItemsService)
      .useClass(DummyItemsService)
      .compile();

    itemsService = testingModule.get<ItemsService>(ItemsService);
    itemsController = new ItemsController(itemsService);
  });

  describe('/items', () => {
    it('should return items', async () => {
      expect(await itemsController.getItems()).toHaveLength(1);
    });
  });
});
```

`useClass()` の代わりに `useValue()` を使うことで、 class ではなく変数で上書きすることもできます。

この状態でテストを実行すると、 MySQL が起動していなくても問題なく通過します。

```
yarn run v1.19.0
$ jest
 PASS  src/items/items.controller.spec.ts
 PASS  src/app.controller.spec.ts

Test Suites: 2 passed, 2 total
Tests:       2 passed, 2 total
Snapshots:   0 total
Time:        2.406s
Ran all test suites.
✨  Done in 2.94s.
```

## おわりに

この記事で NestJS の持つ強力な DI の機能をお伝えできたかと思います。
より詳細な内容は公式のドキュメントの E2E テストの項にあるので、合わせてご確認ください。
[https://docs.nestjs.com/fundamentals/testing#end-to-end-testing](https://docs.nestjs.com/fundamentals/testing#end-to-end-testing )

また、今回説明できなかった TypeORM との合わせ方や、非同期の初期化を必要とする Service の扱い方については、後日別の記事で説明します。

明日は @potato4d さんが ExceptionFilter についてお話する予定です。


