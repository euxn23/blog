---
title: "Nodejs で stream を使って gzip ファイル全体をメモリに乗せずに先頭一行だけを取得する"
date: 2019-12-23
---

この記事は [Node.js アドベントカレンダー 2019](https://qiita.com/advent-calendar/2019/nodejs) の 23 日目です。

## はじめに

gzip ファイルなどの圧縮されたファイルを読み込む際、たとえば csv など圧縮率の高いファイル形式かつ大きなファイルの場合、全てをメモリに乗せ切れないことが稀にあります。
そもそも csv のカラムだけ欲しいなどの場合にデータ全体を取得するのは時間もかかるし無駄です。
そこで、 Node.js は stream を扱いやすい言語なので、これを使って簡単に解決できるため紹介します。

なお、 S3 からのデータ取得であっても `createReadStream()` すれば `stream.Readable` 型になるため、同様の手法が可能です。そもそも、この話自体がローカルよりはクラウド絡みの方が多いケースになると思いますが……。

## おさらい: Node.js での stream でのファイル読み書き

例えば、ファイルを読み込んで標準出力に表示します。

```typescript
import fs from 'fs';

const input = fs.createReadStream('tsconfig.json', 'utf-8');

input.pipe(process.stdout)
```

書き込みの例として、大きなサイズの csv を生成するスクリプトをファイルに書き込みます。

```typescript:src/create-big-csv.ts
import fs from 'fs';

const out = fs.createWriteStream('bigdata.csv', 'utf-8');
const arr = [...Array(100000)].map((_, idx) => idx);

out.write("id,pow\n");
arr.forEach(idx => {
  out.write(`${idx}, ${idx * idx}\n`);
})
```

大きなデータなので複数に別れて buffer で流れます。データが来るたびに区切り文字を表示して標準出力に表示する場合はこうです。

```typescript
import fs from 'fs';

const input = fs.createReadStream('bigdata.csv', 'utf-8');

input.on('data', (buf) => {
  console.log(buf.toString())
  console.log('---')
});
```

## gzip の展開を stream に適用する

標準ライブラリの zlib から pipe を作成し適用します。

```typescript
import zlib from 'zlib';
import fs from "fs";

const gzip = zlib.createGunzip()

async function main() {
  const readStream = fs.createReadStream('bigdata.csv.gzip')
  readStream
    .pipe(gzip)
    .on('data', (buf) => {
      console.log(buf.toString())
      console.log('---')
    })
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
```

## 先頭一行を取得する

普通に `buf.toString()` した値を `"\n"` で split できます。
なお、 `stream.destroy()` が間に合わず次のデータが流れてくることは普通にあるので、一度限りの処理に限定できるよう関数に切り出すのが良さそうです。

```typescript
import zlib from 'zlib';
import fs from "fs";

const gzip = zlib.createGunzip()

async function main() {
  const readStream = fs.createReadStream('bigdata.csv.gzip')
  const firstLine = await getFirstLineFromStream(readStream.pipe(gzip))
  console.log(firstLine)
}

async function getFirstLineFromStream(stream: Readable) {
  return new Promise((resolve, reject) => {
    stream.on('data', (buf) => {
      stream.destroy();
      const string = buf.toString();
      const [firstLine] = string.split("\n");

      resolve(firstLine);
    })
    stream.on('error', reject);
  })
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
```

## おまけ: S3 から取得した gzip の先頭一行を取得する

`s3.getObject().createReadStream()` するだけです。 await は要りません。

```typescript
import zlib from 'zlib';
import fs from "fs";

import { S3 } from 'aws-sdk';

const gzip = zlib.createGunzip()

async function main() {
  const s3 = new S3()
  const readStream = s3.getObject({Bucket: 'your-awesome-bucket', Key: 'bigdata.csv.gzip'}).createReadStream();

  const firstLine = await getFirstLineFromStream(readStream.pipe(gzip))
  console.log(firstLine)
}

async function getFirstLineFromStream(stream: Readable) {
  return new Promise((resolve, reject) => {
    stream.on('data', (buf) => {
      stream.destroy();
      const string = buf.toString();
      const [firstLine] = string.split("\n");

      resolve(firstLine);
    })
    stream.on('error', reject);
  })
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
```

## おわりに

大きなデータを扱うときは、メモリに乗り切らないこともあるので stream を使いましょう。
