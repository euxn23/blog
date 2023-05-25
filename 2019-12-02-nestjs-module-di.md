---
title: "NestJS の Module と DI を理解する"
date: 2019-12-02
---

この記事は [NestJS アドベントカレンダー 2019](https://qiita.com/advent-calendar/2019/nestjs) 2 日目の記事です。

## はじめに

[昨日の記事](https://qiita.com/potato4d/items/aabb78fd201592352d64)ではアプリケーションを作って一通り動かすところまで説明されました。
この中では Module については、デフォルトで生成される AppModule のまま使用しておりますが、大規模になるにつれて Module を分割することになると思います。
この記事では、 Module の概要と、 Module を分割することによる DI への影響を説明します。
[公式のドキュメント](https://docs.nestjs.com/modules)にも説明がありますので、合わせて読んでいただくことでより理解が深まると思います。

サンプルコードのリポジトリは以下になります。

https://github.com/nestjs-jp/advent-calendar-2019/tree/master/day02-understanting-module-and-di

なお、環境は執筆時点での Node.js の LTS である v12.13.1 を前提とします。

## NestJS における Module とは

NestJS では任意の controller, provider(service など)をまとめた単位を Module といいます。
TypeScript の class 定義に対して、 `@Module()` Decorator を使用して定義します。この時、 class 定義は空でも問題ありません。

昨日の例では全て AppModule 内に定義しましたが、 AppController と AppService の実装を ItemsModule に移してみます。この場合、以下のように定義されます。

```typescript:items/items.module.ts
@Module({
  controllers: [ItemsController],
  providers: [ItemsService],
})
export class ItemsModule {}

```

また、 AppModule では import に以下のように定義します。

```typescript:app.module.ts
@Module({
  imports: [ItemsModule],
  controllers: [AppController],
})
export class AppModule {}
```

上記の `controllers`, `providers`, `import` の他に、Module に定義した provider を他の Module でも使用するための `export` があります。 `export` については後述します。

基本的には Module の内部で DI のスコープも完結します。これを試すため、以下で Comments Module を実装します。

## cli を用いて CommentsModule を生成する

新たに Module を作成する場合、 `@nestjs/cli` を使用すると、 AppModule への反映も自動で行ってくれるため便利です。

```bash
$ yarn add -D @nestjs/cli
$ yarn nest g module comments
```

コマンドを実行すると、以下のようにファイル生成と更新が行われていることがわかります。

```
CREATE /src/comments/comments.module.ts (85 bytes)
UPDATE /src/app.module.ts (324 bytes)
```

AppModule の import に CommentsModule が追加されていますね。

```typescript:app.module.ts
@Module({
  imports: [ItemsModule, CommentsModule],
  controllers: [AppController],
})
export class AppModule {}
```

同様に controller と service も cli を使うことで生成すると共に該当する Module の `controllers` / `providers` に自動追記されます。

## CommentsModule を実装し、動作を確認する

以下のように CommentsController と CommentsService を実装していきます。

```typescript:comments/comments.controller.ts
@Controller('comments')
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Get()
  getCommentsByItemId(@Query() query: { itemId: string }): Comment[] {
    return this.commentsService.getCommentsByItemId(+query.itemId);
  }
}
```

```typescript:comments/comments.service.ts
export interface Comment {
  id: number;
  itemId: number;
  body: string;
}

const comments: Comment[] = [
  {
    id: 1,
    itemId: 1,
    body: 'Hello, I am Alice',
  },
  {
    id: 2,
    itemId: 1,
    body: 'Hello, I am Beth',
  },
  {
    id: 3,
    itemId: 2,
    body: 'That is also love.',
  },
];

@Injectable()
export class CommentsService {
  getCommentsByItemId(itemId: number): Comment[] {
    return comments.filter(comment => comment.itemId === itemId);
  }
}
```

curl コマンドで動作確認をします。

```bash
$ curl localhost:3000/comments\?itemId=1
[{"id":1,"itemId":1,"body":"Hello, I am Alice"},{"id":2,"itemId":1,"body":"Hello, I am Beth"}]
```

テストも追加していきます。

```typescript:comments/comments.controller.spec.ts
describe('Comments Controller', () => {
  let commentsController: CommentsController;
  let commentsService: CommentsService;

  beforeEach(async () => {
    commentsService = new CommentsService();
    commentsController = new CommentsController(commentsService);
  });

  describe('/comments', () => {
    it('should return comments', () => {
      const comments: Comment[] = [
        {
          id: 1,
          itemId: 1,
          body: 'Mock Comment',
        },
      ];
      jest
        .spyOn(commentsService, 'getCommentsByItemId')
        .mockImplementation(() => {
          return comments;
        });
      expect(
        commentsController.getCommentsByItemId({ itemId: '1' }),
      ).toHaveLength(1);
    });
  });
});
```

```typescript:comments/comments.service.spec.ts
describe('CommentsService', () => {
  let commentsService: CommentsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CommentsService],
    }).compile();

    commentsService = module.get<CommentsService>(CommentsService);
  });

  it('should be defined', () => {
    expect(commentsService).toBeDefined();
  });

  describe('getCommentsByItemId', () => {
    it('should return comments if exist', () => {
      const comments = commentsService.getCommentsByItemId(1);
      expect(comments.length).toBeTruthy();
    });

    it('should return empty array if not exist', () => {
      const comments = commentsService.getCommentsByItemId(0);
      expect(comments).toHaveLength(0);
    });
  });
});
```

なお、自明である内容をテストしている箇所があるため、今後はテストが必要であるところのみ、テストを記述します。


## Module 間で DI のスコープが別れていることを確認する

Module をまたいだ DI は行えないため、 ItemsController で CommentsService を使用することはできません。
ItemsConbtroller に以下を実装し、確認します。

```typescript:items/items.controller.ts
interface GetItemWithCommentsResponseType {
  item: PublicItem;
  comments: Comment[];
}

@Controller()
export class ItemsController {
  constructor(
    private readonly itemsService: ItemsService,
    private readonly commentsService: CommentsService,
  ) {}

  @Get()
  getItems(): PublicItem[] {
    return this.itemsService.getPublicItems();
  }

  @Get(':id/comments')
  getItemWithComments(@Param()
  param: {
    id: string;
  }): GetItemWithCommentsResponseType {
    const item = this.itemsService.getItemById(+param.id);
    const comments = this.commentsService.getCommentsByItemId(+param.id);

    return { item, comments };
  }
}
```

この状態で `$ yarn start:dev` で起動すると、 DI が解決できない旨のエラーが表示されます。

```
[ExceptionHandler] Nest can't resolve dependencies of the ItemsController (ItemsService, ?). Please make sure that the argument CommentsService at index [1] is available in the ItemsModule context.

Potential solutions:
- If CommentsService is a provider, is it part of the current ItemsModule?
- If CommentsService is exported from a separate @Module, is that module imported within ItemsModule?
  @Module({
    imports: [ /* the Module containing CommentsService */ ]
  })
```

## 別の Module の Service を使うために export する

CommentsService は別 Module にあるので、エラーメッセージに沿って以下のように修正します。

- CommentsModule で CommentsService を `export` する
- ItemsModule で CommentsModule を `import` する

```typescript:comments/comments.module.ts
@Module({
  controllers: [CommentsController],
  providers: [CommentsService],
  exports: [CommentsService],
})
export class CommentsModule {}
```

```typescript:items/items.module.ts
@Module({
  imports: [CommentsModule],
  controllers: [ItemsController],
  providers: [ItemsService],
})
export class ItemsModule {}
```


ここで重要なのは `export` が必要ということで、ただ CommentsModule を `import` するだけでは同様のエラーとなります。
export を使用してはじめて他の Module から参照可能になるということです。

同様にテストを追記し、 curl で動作確認を行います。

```typescript:items/items.controller.spec.ts
  describe('/items/1/comments', () => {
    it('should return public item and comments', () => {
      const item: PublicItem = {
        id: 1,
        title: 'Mock Title',
        body: 'Mock Body',
      };
      const comments: Comment[] = [
        {
          id: 1,
          itemId: 1,
          body: 'Mock Comment',
        },
      ];
      jest.spyOn(itemsService, 'getItemById').mockImplementation(() => {
        return item;
      });
      jest
        .spyOn(commentsService, 'getCommentsByItemId')
        .mockImplementation(() => {
          return comments;
        });
      expect(itemsController.getItemWithComments({ id: '1' })).toEqual({
        item,
        comments,
      });
    });
  });
```

```bash
$ curl localhost:3000/items/1/comments
{"item":{"id":1,"title":"Item title","body":"Hello, World"},"comments":[{"id":1,"itemId":1,"body":"Hello, I am Alice"},{"id":2,"itemId":1,"body":"Hello, I am Beth"}]}
```

無事動作しましたので完成です。

## おわりに

これで Module の概要と、 DI との関係性は伝えられたかと思います。
しかし今回は Module の基礎に留めたため、まだ紹介しきれていない機能もあるため、[公式ドキュメント](DTO と Request Validation)を読みながら試すのが早いかと思います。
また、今後アドベントカレンダーや Japan NestJS Users Group でテクニックを発信していく予定ですので、併せてご興味を持っていただけますと嬉しいです。

明日は @potato4d さんが DTO と Request Validation についてお話する予定です。
