---
title: "TypeScript の Decorator と継承"
date: 2019-12-18
---

この記事は [NestJS アドベントカレンダー 2019](https://qiita.com/advent-calendar/2019/nestjs) 14 日目の記事です。
寝込んでいたため遅くなり申し訳ありません。

## はじめに

この記事では NestJS で多用される Decorator を継承した場合の挙動について説明します。
サンプルコードのリポジトリは以下になります。

https://github.com/nestjs-jp/advent-calendar-2019/tree/master/day14-decorator-and-inheritance

なお、環境は執筆時点での Node.js の LTS である v12.13.x を前提とします。
また、この Decorator の挙動は ECMA Script 仕様として定義されていない Decorator に対して、TypeScript 3.7.x 時点での実装による挙動であるため、将来的に仕様の策定・変更に伴い TypeScript コンパイラの挙動が変更になる可能性があります。

## 結論

メソッドの Decorator 情報は継承されます。オーバーライドで切ることができます。

プロパティの Decorator は Class の定義時にしか評価されません。
しかし評価時にクラス名をキーにして container に副作用を与え、 `instanceof` で比較を行うようなライブラリでは、 **instanceof は子 Class に対して親 Class と比較しても true となる**(後述します)ため、継承しているような挙動に見えることがあります。

詳しくは以下で、 Method Decorator と Property Decorator に分けて説明します。

## Method Decorator の挙動を追う

Decorator を定義した Class を継承した、 Decorator を直接定義していない Class のインスタンスを生成し、 Validator を定義した `sayHello()` を呼びます。
以下で定義する `@LogProxy()` は、関数の実行前後にログを出力する簡単な Decorator 関数です。

```typescript:src/main.ts
function LogProxy(when: 'before' | 'after' | 'all') {
  return function(_target: any, key: string, desc: PropertyDescriptor) {
    const prev = desc.value;
    const next = function() {
      if (when === 'before' || when === 'all') {
        console.log(`${this.name}.${key} will start.`);
      }
      const result = prev.apply(this);
      if (when === 'after' || when === 'all') {
        console.log(`${this.name}.${key} has finished.`);
      }
      return result;
    };
    desc.value = next;
  };
}

class User {
  name: string;

  constructor(name: string) {
    this.name = name;
  }

  @LogProxy('all')
  sayHello() {
    console.log(`Hello, I am ${this.name}.`);
  }
}

class JapaneseUser extends User {
  name: string;

  constructor(name: string) {
    super(name);
    this.name = name;
  }
}

const alice = new User('alice');
alice.sayHello();
const arisu = new JapaneseUser('有栖');
arisu.sayHello();
```

```bash
$ yarn ts-node src/main.ts

alice.sayHello will start.
Hello, I am alice.
alice.sayHello has finished.
有栖.sayHello will start.
Hello, I am 有栖.
有栖.sayHello has finished.
```

コンパイルされた Decorator がどのような挙動をしているのか確認するため、コンパイルされたファイルを読みます。なお、 target は es2019 ですが、 2015 以降であれば Decorator 周りはほぼ変わらないようです。

```javascript:dist/main.js
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
function LogProxy(when) {
    return function (_target, key, desc) {
        const prev = desc.value;
        const next = function () {
            if (when === 'before' || when === 'all') {
                console.log(`${this.name}.${key} will start.`);
            }
            const result = prev.apply(this);
            if (when === 'after' || when === 'all') {
                console.log(`${this.name}.${key} has finished.`);
            }
            return result;
        };
        desc.value = next;
    };
}

class User {
    constructor(name) {
        this.name = name;
    }
    sayHello() {
        console.log(`Hello, I am ${this.name}.`);
    }
}
__decorate([
    LogProxy('all')
], User.prototype, "sayHello", null);
class JapaneseUser extends User {
    constructor(name) {
        super(name);
        this.name = name;
    }
}
const alice = new User('alice');
alice.sayHello();
const arisu = new JapaneseUser('有栖');
arisu.sayHello();
//# sourceMappingURL=main.js.map
```

全てを読まずとも、 `__decorate` が User.prototype の name に、 decorator 関数を食わせた値を再代入していることが分かります。
下の継承している側の Class では特に defineProperty をしているわけではないので、 Decorator の影響を受け続けています。

そのため、継承した Class でオーバーライドした場合には Decorator の影響は受けません。

```typescript:src/main.ts
function LogProxy(when: 'before' | 'after' | 'all') {
  return function(_target: any, key: string, desc: PropertyDescriptor) {
    const prev = desc.value;
    const next = function() {
      if (when === 'before' || when === 'all') {
        console.log(`${this.name}.${key} will start.`);
      }
      const result = prev.apply(this);
      if (when === 'after' || when === 'all') {
        console.log(`${this.name}.${key} has finished.`);
      }
      return result;
    };
    desc.value = next;
  };
}

class User {
  name: string;

  constructor(name: string) {
    this.name = name;
  }

  @LogProxy('all')
  sayHello() {
    console.log(`Hello, I am ${this.name}.`);
  }
}

class JapaneseUser extends User {
  name: string;

  constructor(name: string) {
    super(name);
    this.name = name;
  }

  sayHello() {
    console.log(`こんにちは、私は${this.name}です。`);
  }

}

const alice = new User('alice');
alice.sayHello();
const arisu = new JapaneseUser('有栖');
arisu.sayHello();
```

```bash
$ yarn ts-node src/main.ts

alice.sayHello will start.
Hello, I am alice.
alice.sayHello has finished.
こんにちは、私は有栖です。
```

## Property Decorator の挙動を追う

同様に、 Decorator を定義した Class とその子 Class を定義します。
以下で定義する `@Effect()` は、呼び出し時に呼び出し元とプロパティ名、引数を Container に記録する副作用を持つ Decorator 関数です。

```typescript:src/main.ts
let effectContainer = {};
let effectCounter = 0;

function Effect(str: string) {
  return function(target: any, key: string) {
    const className = target.constructor.name;
    const prev = effectContainer[className];
    effectContainer[className] = { ...prev, [key]: str };
    effectCounter++;
  };
}

class User {
  @Effect('decorating User.name property')
  name: string;

  constructor(name: string) {
    this.name = name;
  }
}

class JapaneseUser extends User {
  name: string;

  constructor(name: string) {
    super(name);
    this.name = name;
  }
}

const alice = new User('alice');
console.log(alice.name)
const beth = new User('beth');
console.log(beth.name)
const arisu = new JapaneseUser('有栖');
console.log(arisu.name)

console.log(effectContainer);
console.log(effectCounter);
```

```bash
$ yarn ts-node src/main.ts
alice
beth
有栖
{ User: { name: 'decorating User.name property' } }
1
```

User Class のインスタンスは子 Class 含め複数回生成していますが、 Decorator 関数は 1 度しか呼ばれていません。
コンパイル済みの以下のコードを見ると、 Class 宣言の後に 1 度評価されているのみであることが分かります。

```javascript:dist/main.js
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
let effectContainer = {};
function Effect(str) {
    return function (target, key) {
        const className = target.constructor.name;
        const prev = effectContainer[className];
        effectContainer[className] = { ...prev, [key]: str };
    };
}
class User {
    constructor(name) {
        this.name = name;
    }
}
__decorate([
    Effect('decorating name property')
], User.prototype, "name", void 0);
class JapaneseUser extends User {
    constructor(name) {
        super(name);
        this.name = name;
    }
    sayHello() {
        console.log(`こんにちは、私は${this.name}です。`);
    }
}
const alice = new User('alice');
const beth = new User('beth');
const arisu = new JapaneseUser('有栖');
console.log(effectContainer);
//# sourceMappingURL=main.js.map
```

この例で上げたのが副作用であるのは、 Decorator 関数の返す関数が取れる引数が 2 つのみであり、 PropertyDescripter が存在しないため、呼び出し元の Class に対して何も操作することが現状できないためです。
子 Class に対して定義した場合は、新規の定義として実行されます。

```typescript
class JapaneseUser extends User {
  @Effect("decorating JapaneseUser.name property")
  name: string;

  constructor(name: string) {
    super(name);
    this.name = name;
  }
}
```

```bash
$ yarn ts-node src/main.ts
alice
beth
有栖
{
  User: { name: 'decorating User.name property' },
  JapaneseUser: { name: 'decorating JapaneseUser.name property' }
}
2
```

## class-validator の Decorator の挙動

class-validator では上記の Property Decorator を使用して定義しますが、その際に [Class 名とプロパティ名を Container に記録しています](https://github.com/typestack/class-validator/blob/master/src/decorator/decorators.ts#L120)。
内部では instanceof による比較をしているようであるため、 Decorator の定義を継承したような挙動に見えます。

## 備考: instanceof と子クラスについて

該当する Class のインスタンスであるかの比較に instanceof を使用すると、その子孫クラスと比較した場合も true となります。

```javascript
class User {}
const user = new User();
user instanceof User; //=> true
class ExUser extends User {}
const exUser = new ExUser();
exUser instanceof User; //=>true
```

子孫クラスであることを明確に区別したい場合は、 Class 名を取得して比較するのが良いです。

```javascript
user.constructor.name === exUser.constructor.name; //=> false
```

## おわりに

この記事では NestJS で多様される Decorator を継承した場合の挙動について説明しました。
Decorator の仕様はまだ安定していないため、今後挙動が変わる可能性がある点はくれぐれもご留意ください。

明日は @potato4d の [GitHub Actions を利用した NestJS アプリケーションの Google AppEngine への自動デプロイ](https://qiita.com/potato4d/items/cb54785821bbcac2b994) です。
