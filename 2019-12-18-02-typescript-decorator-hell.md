---
title: "TypeScript の Decorator Hell を解消する"
date: 2019-12-18
---

これを解決します。

```typescript:src/models/user.ts
import { IsNotEmpty, MaxLength } from 'class-validator';
import { Column, PrimaryGeneratedColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

export class User {
  @PrimaryGeneratedColumn()
  @ApiProperty({ example: 1 })
  id!: number;

  @IsNotEmpty()
  @MaxLength(16)
  @Column()
  @ApiProperty({ example: 'alice07' })
  displayId!: string;

  @IsNotEmpty()
  @MaxLength(16)
  @Column()
  @ApiProperty({ example: 'alice' })
  name!: string;

  @MaxLength(140)
  @Column('text')
  @ApiProperty({ example: `Hello, I'm NestJS Programmer!` })
  profileText?: string;

  @Column()
  createdAt!: number;

  @Column()
  updatedAt!: number;
}
```

この記事は [NestJS アドベントカレンダー 2019](https://qiita.com/advent-calendar/2019/nestjs) 18 日目の記事です。

## はじめに

NestJS + ClassValidator + TypeORM 、という構成などのときに、上記のような Decorator Hell を想像してしまうことはあると思います。
動くものとしては十分ですが、メンテナンス性を高めるために、 Abstract Class と Interface を活用して分離し、依存関係を整理する一例を紹介します。

https://github.com/nestjs-jp/advent-calendar-2019/tree/master/day18-avoid-decorator-hell

なお、環境は執筆時点での Node.js の LTS である v12.13.x を前提とします。
また、この Decorator の挙動は ECMA Script 仕様として定義されていない Decorator に対して、TypeScript 3.7.x 時点での実装による挙動であるため、将来的に仕様の作成・変更に伴い TypeScript コンパイラの挙動が変更になる可能性があります。

現実装の Decorator の挙動については [Decorator と継承](https://qiita.com/euxn23/items/987f359eeb6a6bd45fad) にも書いていますので併せてお読み下さい。


## Validator を分離する

```typescript
export class ValidatableUser {
  id!: number;

  @IsNotEmpty()
  @MaxLength(16)
  displayId!: string;

  @IsNotEmpty()
  @MaxLength(16)
  name!: string;

  @MaxLength(140)
  profileText?: string;

  createdAt!: number;
  updatedAt!: number;
}

export class User extends ValidatableUser {
  @PrimaryGeneratedColumn()
  @ApiProperty({ example: 1 })
  id!: number;

  @Column()
  @ApiProperty({ example: 'alice07' })
  displayId!: string;

  @Column()
  @ApiProperty({ example: 'alice' })
  name!: string;

  @Column('text')
  @ApiProperty({ example: `Hello, I'm NestJS Programmer!` })
  profileText?: string;

  @Column()
  createdAt!: number;

  @Column()
  updatedAt!: number;
}
```

class-validator が継承した Class でも validation ができることを利用し、 validation の定義を親クラスに移譲します。
以下のコードを実行すると、バリデーションエラーが発生します。

```typescript
import { User } from './src/models/user';
import { validate } from 'class-validator';

async function main() {
  const user = new User();
  user.id = 1;
  user.displayId = 'alice1234567890123456';
  user.name = 'alice';

  const err = await validate(user, { skipMissingProperties: true });
  console.log(err);
}

main().catch(console.error);
```

## API 層を分離する

API レスポンスとして使用される / Swagger のドキュメント生成に使用される Class を別に定義します。

```typescript
import { IsNotEmpty, MaxLength } from 'class-validator';
import { Column, PrimaryGeneratedColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

export class ValidatableUser {
  id!: number;

  @IsNotEmpty()
  @MaxLength(16)
  displayId!: string;

  @IsNotEmpty()
  @MaxLength(16)
  name!: string;

  @MaxLength(140)
  profileText?: string;

  createdAt!: number;
  updatedAt!: number;
}

export class User extends ValidatableUser {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  displayId!: string;

  @Column()
  name!: string;

  @Column('text')
  profileText?: string;

  @Column()
  createdAt!: number;

  @Column()
  updatedAt!: number;
}

type TransferUserType = Omit<User, 'createdAt' | 'updatedAt'>;

export class TransferUser extends User implements TransferUserType {
  @ApiProperty({ example: 1 })
  id!: number;

  @ApiProperty({ example: 'alice07' })
  displayId!: string;

  @ApiProperty({ example: 'alice' })
  name!: string;

  @ApiProperty({ example: `Hello, I'm NestJS Programmer!` })
  profileText?: string;
}
```

```typescript:src/app.controller.ts
import { Controller, Get, HttpException, Query } from '@nestjs/common';
import { TransferUser } from './models/user';
import { ApiResponse } from '@nestjs/swagger';
import { validate } from 'class-validator';

@Controller()
export class AppController {
  @Get()
  @ApiResponse({ status: 200, type: TransferUser })
  @ApiResponse({ status: 400 })
  async getUser(
    @Query() { displayId, name }: { displayId: string; name: string },
  ): Promise<TransferUser> {
    if (!displayId || !name) {
      throw new HttpException('displayId and name are required', 400);
    }

    const user = new TransferUser();
    user.id = 123;
    user.displayId = displayId;
    user.name = name;

    const errs = await validate(user, { skipMissingProperties: true });

    if (errs.length) {
      console.error(errs);
      throw new HttpException(errs, 400);
    }

    console.log(user);

    return user;
  }
}
```

```bash
$ curl localhost:3000\?displayId=alice07\&name=alice
{"id":123,"displayId":"alice07","name":"alice"}

$ curl localhost:3000\?displayId=alice1234567890123456\&name=alice
[{"target":{"id":123,"displayId":"alice1234567890123456","name":"alice"},"value":"alice1234567890123456","property":"displayId","children":[],"constraints":{"maxLength":"displayId must be shorter than or equal to 16 characters"}}]
```

## TypeORM 層を分離する

次に、 User Class から TypeORM の Decorator を分離します。

```typescript
import { IsNotEmpty, MaxLength } from 'class-validator';
import { Column, PrimaryGeneratedColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

export class ValidatableUser {
  id!: number;

  @IsNotEmpty()
  @MaxLength(16)
  displayId!: string;

  @IsNotEmpty()
  @MaxLength(16)
  name!: string;

  @MaxLength(140)
  profileText?: string;

  createdAt!: number;
  updatedAt!: number;
}

export class User extends ValidatableUser {
  id!: number;
  displayId!: string;
  name!: string;
  profileText?: string;
  createdAt!: number;
  updatedAt!: number;
}

type SerializableUserType = Omit<User, 'createdAt' | 'updatedAt'>;

export class SerializableUser extends User implements SerializableUserType {
  @ApiProperty({ example: 1 })
  id!: number;

  @ApiProperty({ example: 'alice07' })
  displayId!: string;

  @ApiProperty({ example: 'alice' })
  name!: string;

  @ApiProperty({ example: `Hello, I'm NestJS Programmer!` })
  profileText?: string;
}

export class UserEntity extends User {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  displayId!: string;

  @Column()
  name!: string;

  @Column('text')
  profileText?: string;

  @Column()
  createdAt!: number;

  @Column()
  updatedAt!: number;
}
```

## ロジックを持ち基底となる Pure な User を用意し、整理する

上記の手順で `User` Class は class-validator を継承しているため、基底とは言えません。
なので、基底となる、 Decorator のない Pure TypeScript な User Class として定義するよう、継承関係を整理します。
また、ここで実装される toObject メソッドは User を継承した全ての Class で使用できるメソッドになります。

```typescript
export class User {
  id: number;
  displayId: string;
  name: string;
  profileText?: string;
  createdAt?: number;
  updatedAt?: number;

  constructor({
    id,
    displayId,
    name,
    profileText,
    createdAt,
    updatedAt,
  }: User) {
    this.id = id;
    this.displayId = displayId;
    this.name = name;
    this.profileText = profileText;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  toObject() {
    return {
      id: this.id,
      displayId: this.displayId,
      name: this.name,
      profileText: this.profileText,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}

export class ValidatableUser extends User {
  id!: number;

  @IsNotEmpty()
  @MaxLength(16)
  displayId!: string;

  @IsNotEmpty()
  @MaxLength(16)
  name!: string;

  @MaxLength(140)
  profileText?: string;

  createdAt!: number;
  updatedAt!: number;
}

type TransferUserType = Omit<User, 'createdAt' | 'updatedAt'>;

export class TransferUser extends ValidatableUser
  implements TransferUserType {
  @ApiProperty({ example: 1 })
  id!: number;

  @ApiProperty({ example: 'alice07' })
  displayId!: string;

  @ApiProperty({ example: 'alice' })
  name!: string;

  @ApiProperty({ example: `Hello, I'm NestJS Programmer!` })
  profileText?: string;
  
  toObject() {
    return {
      id: this.id,
      displayId: this.displayId,
      name: this.name,
      profileText: this.profileText,
    };
  }
}

export class UserEntity extends ValidatableUser {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  displayId!: string;

  @Column()
  name!: string;

  @Column('text')
  profileText?: string;

  @Column()
  createdAt!: number;

  @Column()
  updatedAt!: number;
}
```

## Abstract Class 、 Interface を活用し整理する

最後に、 インスタンス化しないものを Abstract Class 化します。
この Abstract Class も、 toObject された値も、ともに満たす Interface を定義し実装します。

```typescript
export interface UserInterface {
  id: number;
  displayId: string;
  name: string;
  profileText?: string;
  createdAt?: number;
  updatedAt?: number;
}

export abstract class AbstractUser implements UserInterface {
  id: number;
  displayId: string;
  name: string;
  profileText?: string;
  createdAt?: number;
  updatedAt?: number;

  constructor({
    id,
    displayId,
    name,
    profileText,
    createdAt,
    updatedAt,
  }: UserInterface) {
    this.id = id;
    this.displayId = displayId;
    this.name = name;
    this.profileText = profileText;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  toObject(): UserInterface {
    return {
      id: this.id,
      displayId: this.displayId,
      name: this.name,
      profileText: this.profileText,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}

export abstract class ValidatableUser extends AbstractUser {
  id!: number;

  @IsNotEmpty()
  @MaxLength(16)
  displayId!: string;

  @IsNotEmpty()
  @MaxLength(16)
  name!: string;

  @MaxLength(140)
  profileText?: string;

  createdAt?: number;
  updatedAt?: number;
}

export type TransferUserType = Omit<UserInterface, 'createdAt' | 'updatedAt'>;

export class User extends ValidatableUser {
  @ApiProperty({ example: 1 })
  id!: number;

  @ApiProperty({ example: 'alice07' })
  displayId!: string;

  @ApiProperty({ example: 'alice' })
  name!: string;

  @ApiProperty({ example: `Hello, I'm NestJS Programmer!` })
  profileText?: string;

  toObject() {
    return {
      id: this.id,
      displayId: this.displayId,
      name: this.name,
      profileText: this.profileText,
    };
  }
}

export class UserEntity extends ValidatableUser {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  displayId!: string;

  @Column()
  name!: string;

  @Column('text')
  profileText?: string;

  @Column()
  createdAt?: number;

  @Column()
  updatedAt?: number;
}
```

この状態でも、ロジック(Controller にロジックを書くべきではないとは思いますが例なので)側からは自然に見えるように思います。

```typescript:src/app.controller.ts
@Controller()
export class AppController {
  @Get()
  @ApiResponse({ status: 200, type: User })
  @ApiResponse({ status: 400 })
  async getUser(
    @Query() { displayId, name }: { displayId: string; name: string },
  ): Promise<UserInterface> {
    if (!displayId || !name) {
      throw new HttpException('displayId and name are required', 400);
    }

    const user = new User({ id: 123, displayId, name });

    const errs = await validate(user, { skipMissingProperties: true });

    if (errs.length) {
      console.error(errs);
      throw new HttpException(errs, 400);
    }

    console.log(user);

    return user.toObject();
  }
}
```

ここまで分離する必要があるかどうかはケースバイケースかと思いますが、 Decorator を提供する複数のライブラリに同時に依存してしまうリスクをある程度排除し、同時にメンテナンス性もある程度担保できるかと思います。

## おわりに

NestJS + ClassValidator + TypeORM 、という構成などのときに、 Abstract Class と Interface を活用して Decorator Hell を解消する方法の一例を紹介しました。
この方法が全てのプロジェクトに当てはまるわけではありませんが、参考にしていただければ幸いです。
