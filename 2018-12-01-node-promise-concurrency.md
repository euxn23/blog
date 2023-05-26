---
title: "Nodejs で Promise の直列実行と並列実行、同時実行数の制御"
date: 2018-12-01
---

この記事は Node.js アドベントカレンダー 2018 の 1 日目です。

---

Node.js の最大の特徴とも言える Promise ですが、最近では async/await によりわかりやすく書けるようになってきました。

しかし完全に同期処理という感覚で書いてしまうとハマってしまうのが直列実行、並列実行まわりだと思います。

## 複数の async function の扱い

たとえば、以下のコードを見てみましょう。

```js
const users = [
  { name: "kirito", weapon: "elucidator" },
  { name: "sinon", weapon: "hecate" },
];

users.forEach(async (user) => await saveUser(user));

const users = await fetchUsers(); // []
```

async function はそれ自体が非同期であるため、forEach のイテレーションでは `await saveUser(user)` の結果を待たずに次のイテレーションに移ります。

結果として、どの非同期関数(saveUser) の実行も完了を待たれず、 `fetchUsers()` を実行した時点で完了を保証することができなくなってしまいます。

この問題を解決するには、大きく 2 つの記法があるかと思います。

### 1. Promise.all を使う(並列実行)

```js
await Promise.all(users.map(async (user) => await saveUser(user)));

const users = await fetchUsers(); // [ { name: 'kirito', weapon: 'elucidator', { name: 'sinon', ...
```

users.map は `Array<Promise<void>>` を返します。map の結果が返る時点では async function の実行が保証されないのは同様です。

しかし、Promise の Array を受け取る `Promise.all` がその完了を待つため、次の `fetchUsers()` は確実に完了後に実行されます。

Promise.all は全て並列で実行されるため順序が保証されません。そのためこの記法は **全並列実行** になります。

### 2. for ループを使う(直列実行)

js に慣れてくると「 for ループとかダッサｗ」となることもあるかもしれませんが、非同期を直列で扱うには for ループは非常に重要な存在です。

```js
for (const user of users) {
  await saveUser(user);
}

const users = await fetchUsers(); // [ { name: 'kirito', weapon: 'elucidator', { name: 'sinon', ...
```

Promise 独自の複雑な記法を用いずに、同期的な処理のように記述できます。

Promise.all は上記の通り全並列実行で順序保障が無いのに対し、こちらは for ループに渡される要素の順序に実行されます。

## 並列と直列の使い分けと注意点

直列実行は全 async function の実行時間の累積になるのに対し、並列実行は実行 1 回分で済む、と思いがちですが、

実際にはネットワークや CPU の詰まり具合によってはエラーが発生したり固まったりします。

特に開発機で CPU 負荷の高い async function を並列で実行すると GUI が固まり何も作業ができなくなる、ということがあります。

たとえば、 `child_process.exec()` で 400 リポジトリを同時に clone すると Disk Write が張り付いて固まりますし、ネットワークのエラーが出ることもあります。

秒間のリクエスト数を制限しているサービスでは、その認証エラーも発生しますし、失敗した場合の再度実行を行おうにも、順序保障がされていないため、 **どこまで** ではなく **何を** を処理完了したか、を記録しなくてはいけません。

## 同時実行数の制御に `bluebird` の `Promise.map()` を使う

全並列だとネットワークや CPU に問題がある、でも直列は時間がかかるので少しでも早くしたい、という場合は、同時実行数制限付きでの並列実行が役に立ちます。

また、現状では `child_process.exec()` に `worker` のような同時実行数制限を付けるオプションはないため、このようなやり方で制御するのが比較的楽です。

今回は `bluebird` という Promise の独自実装ライブラリの独自関数 `map` を使用したいと思います。

(`訳アリだった時代` に Node.js を使っていた人には馴染み(と憎しみ)が深いと思いますが、最近の Node.js から入った人にはあまり馴染みがないライブラリかもしれません。)

**内部の Promise は bluebird ではなくそのスコープでの `Promise` を使用します**(変数 `Promise` を上書きしていなければ標準の `Promise`)が、 **`Promise.map()` 自身は bluebird の `Promise` を使用**しています。

よほど(標準の `Promise` にフックするとかオーバーライドするとか)のことがなければ問題にならないとは思いますが、念のため気に留めておくと良さそうです。

```js
const promiseMap = require("bluebird").map;

const main = async () => {
  const numArr = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
  await promiseMap(
    numArr,
    (num) =>
      new Promise((resolve) =>
        setTimeout(() => {
          console.log(num);
          resolve();
        }, 1000)
      ),
    { concurrency: 2 }
  );

  console.log("end");
};

main();
```

1 秒ごとに 2 要素ずつ出力されますが、順序はバラバラになります。

## 終わりに

Node の非同期を前提としたイベントループの仕組みは、ファイル操作や shell 実行等を行うスクリプトを作る上でも効率よく動作します。

非同期のファイル操作や `child_process.exec()` を複数行う際に、上記のような点に気を付けるとスムーズに進むかと思います。
