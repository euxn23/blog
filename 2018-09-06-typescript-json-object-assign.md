---
title: "TypeScript で JSON を class property に代入するのに Object.assign を使う手法"
date: 2018-09-06
---

※ 09/13 追記
この方法だと strict な型検査ができないようです。

---

手法の1つとして発見したのですが、これが正しいかわからないのでご意見ください。(というか、ご意見が欲しくて書いた)
TypeScript と書いたが、 babel でも動くかもしれない。

前提として以下の interface / class を定義する。

```typescript

interface UserType {
  name: string
  age: number
}

class User implements UserType {
  name: string
  age: number
  constructor(user: UserType) {
    Object.assign(this, hoge)
  }
}
```

class 生成時に値をそのまま入れたい場合は、constructor に以下のように書くことで実現できる。

```typescript

class User implements UserType {
  constructor(
    public name: string,
    public age: number
  ) {}
}
```

しかしこの方法の場合、 decorator を付与すると複雑になり、かつバグる。(バグらない場合もあるかもしれないが、自分が試したものはバグった)

これを回避するために、 constructor に引数で渡し、本文中で this に代入する一般的な方法もあるが、これでは constructor が膨大になってしまう。

```typescript
class User implements UserType {
  constructor(
    name: string,
    age: number
  ) {
    this.name = name
    this.age = age
  }
}
```

そこで完結に書きたく、 Object.assign を使用した

```typescript
interface UserType {
  name: string
  age: number
}

class User implements UserType {
  name: string
  age: number
  constructor(user: UserType) {
    Object.assign(this, user)
  }
}
```

プロパティが過剰でないことは interface を実装していることから保証できる、はずである。

現状問題なさそうだが、この手法の是非について自分だけでは判断できないため、ご意見頂ければと思います。
