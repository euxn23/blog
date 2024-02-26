---
title: "NestJS で循環参照を解決する"
date: 2019-12-17
---

この記事は [NestJS アドベントカレンダー 2019](https://qiita.com/advent-calendar/2019/nestjs) 10 日目の記事です。
寝込んでいたため遅くなり申し訳ありません。

## はじめに

この記事ではいつの間にか生まれがちな循環参照の原因と回避策について説明します。

サンプルコードのリポジトリは以下になります。

https://github.com/nestjs-jp/advent-calendar-2019/tree/master/day10-resolve-circular-reference

なお、環境は執筆時点での Node.js の LTS である v12.13.x を前提とします。

## 循環参照を観測する

循環参照が発生する例として、以下のようなサンプルコードを用意しました。
なお、循環参照を小さい規模で意図的に起こしているため、あまり良い設計ではないです。

```typescript:src/users/users.module.ts
import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { AuthService } from '../auth/auth.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  providers: [UsersService],
  exports: [AuthService],
})
export class UsersModule {}
```

```typescript:src/users/users.service.ts
import { Injectable } from '@nestjs/common';
import { AuthService } from '../auth/auth.service';
import { User } from '../types';

@Injectable()
export class UsersService {
  constructor(private readonly authService: AuthService) {}

  findUserById(_id: string): User {
    // ...
    return { id: 'foo', hashedPassword: 'bar' };
  }

  getUserConfig(sessionToken: string) {
    const user = this.authService.getUser(sessionToken);

    return this.getConfig(user);
  }

  private getConfig(_user: User) {
    // ...

    return { name: 'alice' };
  }
}

```

```typescript:src/auth/auth.module.ts
import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [UsersModule],
  providers: [AuthService],
  exports: [AuthService],
})
export class AuthModule {}
```

```typescript:src/auth/auth.service.ts
import { Injectable } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { User } from '../types';

@Injectable()
export class AuthService {
  constructor(private readonly usersService: UsersService) {}

  getUser(_sessionToken: string): User {
    // ...
    return { id: 'foo', hashedPassword: 'bar' };
  }

  login(userId, password) {
    const user = this.usersService.findUserById(userId);

    return this.authenticateUser(user, password);
  }

  private authenticateUser(_user: User, _password: string): string {
    // ...

   return 'hoge4js'
  }
}
```

さすがにここまで直接的ではなくとも、似たような依存関係になってしまうことはあるかと思います。

この状態でアプリケーションを起動すると、以下のようなエラーが出ます。

```bash
[Nest] 61340   - 12/16/2019, 5:56:10 PM   [NestFactory] Starting Nest application...
[Nest] 61340   - 12/16/2019, 5:56:10 PM   [ExceptionHandler] Nest cannot create the module instance. Often, this is because of a circular dependency between modules. Use forwardRef() to avoid it.

(Read more: https://docs.nestjs.com/fundamentals/circular-dependency)
Scope [AppModule -> UsersModule -> AuthModule]
 +5ms
Error: Nest cannot create the module instance. Often, this is because of a circular dependency between modules. Use forwardRef() to avoid it.

(Read more: https://docs.nestjs.com/fundamentals/circular-dependency)
Scope [AppModule -> UsersModule -> AuthModule]
```

NestJS の場合は循環参照が発生している場合、まず起動できません。

## なぜ起動できなくなるか

NestJS は bootstrap 時に Module の Provider であり `@Injectable()` なものをインスタンス生成し、 DI コンテナを生成します。

この時、 A には B が、 B には C が、と依存している場合、依存を解決し、 C -> B -> A という順で初期化しています。

このとき、循環参照があると依存が解決できず、 Provider のインスタンス生成が失敗します。例えば、 A には B の **インスタンス** が必要であり、 B には A の **インスタンス** が必要であるので、どちらかが先にインスタンス生成されていないといけないのです。

## forwardRef を使用し依存を解消する

NestJS ではこのような循環参照を回避する方法として、 `@Inject()` と `forwardRef(() => { ... })` が用意されています。

forwardRef では、依存先をまだインスタンス生成されていないものに対して未来に依存することを約束し、型のみ合わせて初期化を進めます。

まずは Module の循環参照を解決します。

```typescript:src/users/users.module.ts

@Module({
  imports: [forwardRef(() => AuthModule)],
  providers: [UsersService],
  exports: [AuthService],
})
export class UsersModule {}
```

```typescript:src/auth/auth.module.ts
@Module({
  imports: [forwardRef(() => UsersModule)],
  providers: [AuthService],
  exports: [AuthService],
})
export class AuthModule {}
```

理屈上は片方のみの循環参照の解決で良いのですが、後述する Service 間の依存に影響が出てしまうため、双方ともに forwardRef するのが良いでしょう。

次に、 Service の循環参照を解決します。

```typescript:src/users/users.service.ts
import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { AuthService } from '../auth/auth.service';
import { User } from '../types';

@Injectable()
export class UsersService {
  constructor(
    @Inject(forwardRef(() => AuthService))
    private readonly authService: AuthService,
  ) {}

  findUserById(_id: string): User {
    // ...
    return { id: 'foo', hashedPassword: 'bar' };
  }

  getUserConfig(sessionToken: string) {
    const user = this.authService.getUser(sessionToken);

    return this.getConfig(user);
  }

  private getConfig(_user: User) {
    // ...

    return { name: 'alice' };
  }
}
```

```typescript:src/auth/auth.service.ts
import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { User } from '../types';

@Injectable()
export class AuthService {
  constructor(
    @Inject(forwardRef(() => UsersService))
    private readonly usersService: UsersService,
  ) {}

  getUser(_sessionToken: string): User {
    // ...
    return { id: 'foo', hashedPassword: 'bar' };
  }

  login(userId, password) {
    const user = this.usersService.findUserById(userId);

    return this.authenticateUser(user, password);
  }

  private authenticateUser(_user: User, _password: string): string {
    // ...

   return 'hoge4js'
  }
}
```

修正を加えた状態でアプリケーションを起動するとうまく動きます。

正しく動くことを確認するために、 AppController に以下の変更を加えて動作させてみます。

```typescript:src/app.controller.ts
@Controller()
export class AppController {
  constructor(
    private readonly usersService: UsersService,
    private readonly authService: AuthService,
  ) {}

  @Get('config')
  getConfig() {
    return this.usersService.getUserConfig('hoge4js');
  }

  @Get('login')
  login() {
    return this.authService.login('foo', 'baz')
  }
}
```

```bash
$ curl localhost:3000/login
hoge4js

$ curl localhost:3000/config
{"name":"alice"}
```

無事アプリケーションも動いています。

## おわりに

この記事ではいつの間にか生まれがちな循環参照の原因と回避策について説明しました。
特に Service <-> Service では複雑な依存が生まれがちなので、気をつけるようにしてください。
forwardRef 自体に副作用や危険な要素があるわけではないようなので、起動時間をチューニングする必要がない環境では極力定義しておくと良いのではないでしょうか。

明日は @ci7lus さんの [NestJS Response ヘッダー 変え方](https://qiita.com/ci7lus/items/c50176d4d1a5b8ab021c) です(確定した未来)。
