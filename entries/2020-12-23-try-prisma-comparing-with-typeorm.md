---
title: "TypeORM と比べながら Prisma を触る"
date: 2020-12-23
---

私は以前 TypeORM という node.js の ORM を推していましたが、 Decorator の仕様が未だ安定しないこと、 TypeScript の legacy な実装に依存している点が難点でした。
そんな中、 Next.js ベースのフルスタックフレームワークである blitz が Prisma2 を採用したこともあり注目を集めているため、 TypeORM と比較して紹介します。

## TypeORM

まず TypeORM について見ていきます。
公式ドキュメントの Getting Started は以下です。
https://typeorm.io/#/
以下ではコード片の紹介に留めているため、実際に動かす際は上記に沿って環境を構築してください。

### スキーマ定義

```typescript
import { Entity, Column, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class User {

  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  @Index({ unique: true })
  email: string;

  @Column()
  name: string;

  @OneToMany(type => Post, post => post.user)
  posts Post[];
}

@Entity()
export class Post {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  content: string;

  @Column()
  user: User;

  @Column()
  userId: number;
}
```

TypeScript の class ベースに Decorator で様々な情報や制約を付与していく形式です。
スキーマの定義とエンティティが同一の class で扱えるので、型的にも安全に使えます。

### 接続情報定義

```json
{
  "type": "sqlite",
  "database": "db.sqlite3",
  "autoSchemaSync": true,
  "entities": ["dist/models/*.js"],
  "migrations": ["dist/migrations/*.js"],
  "cli": {
    "entitiesDir": "dist/models",
    "migrationsDir": "dist/migrations"
  }
}
```

### マイグレーション

```shell
$ typeorm migration:run
```

npm パッケージの cli からマイグレーションするには一度 TypeScript から JavaScript にビルドしなくてはなりません。
TS のまま扱う場合は、 ts-node 経由で typeorm/cli.js を実行する等が必要です。

### 読み書き

```typescript
const user = await User.find({ id });

const post = new Post();
post.content = "hello world";
post.user = user;
post.userId = user.id;

await post.save();
```

上記はアクティブレコードパターンですが、リポジトリパターンでのアクセスもできます。

```typescript
const userRepository = connection.getRepository(User);
const user = await userRepository.find({ id });

const postRepository = connection.getRwpository(Post);
const post = new Post();
post.content = "hello world";
post.user = user;
post.userId = user.id;
await postRepository.save(post);
```

状況や開発のフェーズに応じてアクティブレコードパターンとリポジトリパターンを使い分けできるのも魅力の 1 つです。
TypeORM については、以下に過去のサンプルリポジトリがあります。

https://github.com/euxn23/typeorm-demo

また、こちらの potato4d さんの資料でユースケースについて紹介されています。

[https://speakerdeck.com/potato4d/introduce-typeorm](https://speakerdeck.com/potato4d/introduce-typeorm)

## Prisma

次に、 Prisma について見ていきます。
公式ドキュメントの QuickStart は以下です。

https://www.prisma.io/docs/getting-started/quickstart-typescript

以下ではコード片の紹介に留めているため、実際に動かす際は上記に沿って環境を構築してください。
また、 migration については experimental な機能のため、執筆時点(2020/12/23)の情報となります。

### スキーマ・接続情報定義

```prisma
datasource db {
  provider = "sqlite"
  url      = "file:./dev.db"
}

generator client {
  provider = "prisma-client-js"
}

model Post {
  id        Int     @id @default(autoincrement())
  content   String?
  user      User    @relation(fields: [userId], references: [id])
  userId    Int
}

model User {
  id    Int     @id @default(autoincrement())
  email String  @unique
  name  String?
  posts Post[]
}
```

GraphQL に似た DSL での定義となりますが、 Prisma 独自の Language Server が存在し、各種 IDE の extention ではこちらが使用されているようです。

https://github.com/prisma/language-tools

Language Server が動作しているため、エラー詳細まで表示されます。

### 型定義生成・マイグレーション

```shell
$ prisma generate
$ prisma migrate dev --preview-feature --name init
```

`node_modules/.prisma` 以下に Schema の DSL をもとに TypeScript 向けの型定義ファイルを生成します。

### 読み書き

```typescript
const user = await prisma.user.findUnique({ where: { id: 1 } });

prisma.post.create({
  data: { content: "hello world", user: { connect: user! } },
});
```

上記の型定義生成により、 prisma にも prisma.user にも型が付いています。
Post を create する際の user の関連付けは、 `connect` というキーで渡すと、 User 型から `UserCreateOneWithoutPostsInput` という書き込み用の型として解釈・変換します。

## 総括

TypeORM はスキーマ定義とエンティティを同一のクラスで使い回すため、 Decorator による定義をしていますが、こちらは定義が複雑になった場合に煩雑になってしまう可能性がある、また DB の型は Decorator に依存しているため、 class 定義の型と異なる可能性がある、という点で、完全に安全とは言えませんでした。
一方、 Prisma は DSL により 1 つの定義で DB とエンティティのインタフェースの両方を定義できるため、型の齟齬が起こりにくくなっています。
DSL も Language Server によるサポートがあることも強みです。
なお、 Prisma 公式ドキュメントには TypeORM からのマイグレーションガイドが存在します。Prisma としても TypeORM の課題点を克服しようとしているように見えます。

https://www.prisma.io/docs/guides/migrate-to-prisma/migrate-from-typeorm

また、両ライブラリとも、生の SQL を安全に実行するインタフェースは存在していますが、そちらの型はユーザが宣言したとおりにしかならない、というのは仕方のないところです。
TypeORM では ORM でうまく表現できないケースは存在しましたが、 Prisma にもおそらくあるでしょう。
そういった点については確実に安全な方法がないのはもどかしいところです。
(とはいえ、通常の CRUD であれば双方とも十分に賄えているように見えます。)

## 終わりに

以上、 [Node.js アドベントカレンダー 2020](https://qiita.com/advent-calendar/2020/nodejs) 23 日目、かつ [Japan Digital Design アドベントカレンダー 2020](https://adventar.org/calendars/5160) の 23 日目でした。
明日の Node.js アドベントカレンダーは watilde さんの [Node.js v14.5.0 に入った BroadcastChannel について](https://blog.watilde.com/2020/12/23/node-js-v14-5-0%e3%81%ab%e5%85%a5%e3%81%a3%e3%81%9fbroadcastchannel%e3%81%ab%e3%81%a4%e3%81%84%e3%81%a6/) です。(なんと本記事執筆時点で公開されている速さ！！！)
