---
title: "nodejs v8/v7 のPromise とBluebird Promise を雑にベンチ比較した"
date: 2017-06-08
---

既存の Bluebird Promise を利用しているコードから Bluebird を消すべきなのか悩むことがあって調べたところ、
[ES6 の Promise は Bluebird の４倍遅いらしい](http://qiita.com/kuniken/items/d0583b31941f15a0ecb9)と言う情報を見つけたのですが、
node.js v8.0 も出たことなので、ベンチを取りました。

## ベンチマーク環境

マシンは Macbook Pro Retina 15 inch Late 2013 (2.3 GHz Intel Core i7) です。

雑ですが以下のコードでベンチマークを実施します。

```js:promise-benchmark.js
// const Promise = require('bluebird');

let cntr = 0;
const myPromise = () => {
  return new Promise((resolve, reject) => {
    cntr++;
    if (cntr === 1000000) reject();
    resolve();
  }).then(myPromise)
};

const startedAt = Date.now();
myPromise().catch(() => console.log(Date.now() - startedAt));
```

各種 10 回ずつ実行し、最大と最小を除いた値で比較します。単位は ms。
以下のワンライナーでベンチを実行しました。(ワンライナーとは……)

```bash
for i in `seq 1 10`;do;node promise-benchmark.js;done | sort | head -n 9 | tail -n 8 \
| tee >(awk '{if(max<$1) max=$1} END {print "max: " max}') \
| tee >(awk '{if(min == 0 || min>$1) min=$1} END {print "min: " min}') \
| tee >(awk '{m+=$1} END {print "average: " m/NR}') \
| tee >(ruby -e 'elms = STDIN.map{|i|i.to_i}; puts "median: #{elms.size % 2 == 0 ? elms[elms.size/2-1, 2].inject(:+) / 2.0 : elms[emls.size/2]}"')
```

## 結果

| 項目                 | 最大値 | 最小値 | 平均値  | 中央値 |
| -------------------- | ------ | ------ | ------- | ------ |
| ES6 Promise(v7.10.0) | 5481   | 5354   | 5399.75 | 5394.5 |
| ES6 Promise(v8.0.0)  | 1619   | 1568   | 1591.12 | 1588.0 |
| Bluebird(v7.10.0)    | 898    | 836    | 862     | 353.5  |
| Bluebird(v8.0.0)     | 448    | 417    | 433.875 | 435.5  |

node v7 では v8 や bluebird と比べても極端に遅いことが分かります。それと比べると v8 ではだいぶ性能向上したと言えるでしょう。
とはいえ、どちらの場合においても Bluebird の方が性能が出ています。現状でも約 3.7 倍程度の性能差があるようです。

## 結論

node v8 の Promise よりも Bluebird Promise の方が速い

### 余談

tee って順序保障されないんですね
