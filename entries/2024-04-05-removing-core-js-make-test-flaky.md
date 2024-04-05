---
title: "core-js を抜いたらテストが flaky になった"
date: 2024-04-05
---

core-js を抜いたらいくつかのテストが確率で落ちるようになったので調査した。 テスト環境は jest + jsdom である。

core-js のどれが影響しているのか二部探索して特定していくと、 `core-js/stable/set-immediate` と `core-js/stable/clear-immediate` が影響していることがわかった。

`setImmediate` と `clearImmediate` は Node.js にあるが、ブラウザにはない関数である。 そのため、本来 jest or jsdom で補われて欲しいのだが、過去に削除されているようである。

[When running in Jest, code assumes setImmediate and clearImmediate](https://github.com/testing-library/dom-testing-library/issues/914)

実際に `window.setImmediate` を確認してみても `undefined` である。

一方 `setImmediate` や `clearImmediate` が存在しない環境で使うとエラーになる……かと思いきや、react (v18.2.0) の中の scheduler では setImmediate が存在しない環境では迂回するように実装されている。

[https://github.com/facebook/react/blob/76bbad3e34bc3403ddbe59e12845e8643dbb8d9f/packages/scheduler/src/forks/Scheduler.js#L94](https://github.com/facebook/react/blob/76bbad3e34bc3403ddbe59e12845e8643dbb8d9f/packages/scheduler/src/forks/Scheduler.js#L94)

[https://github.com/facebook/react/blob/76bbad3e34bc3403ddbe59e12845e8643dbb8d9f/packages/scheduler/src/forks/Scheduler.js#L551](https://github.com/facebook/react/blob/76bbad3e34bc3403ddbe59e12845e8643dbb8d9f/packages/scheduler/src/forks/Scheduler.js#L551)

とはいえ実装を見ると実行していることはだいぶ異なるので、ここが原因で時間がかかっている可能性がある。今回はその仮定のもと対処法を考える。

## 対処法 1. core-js の setImmediate だけを入れる

```js
import "core-js/stable/set-immediate";
```

無いならば補う対応。 core-js 全体で 1 つのパッケージのため node_modules から大きなものを削減することはできないが、実行上はこれで問題なくなる。

## 対処法 2. node:timers の setImmediate を使う

```js
import { setImmediate, clearImmediate } from "node:timers";

Object.defineProperty(window, "setImmediate", { value: setImmediate });
```

無いならば補う対応 2。この方法でもうまくいく、と思いきや、 CI では同様のタイムアウトが確率で発生してしまう。ローカルでも timeout 時間を短く設定すると失敗が再現するため、パフォーマンス観点の差だろうか？

また timer 全体の mock の影響を受けるという懸念もあり、今回は不採用。

## 対処法 3. happy-dom を使う

`@happy-dom/jest-environment` では setImmediate が設定されてる。

[https://github.com/capricorn86/happy-dom/blob/master/packages/jest-environment/src/index.ts#L74](https://github.com/capricorn86/happy-dom/blob/master/packages/jest-environment/src/index.ts#L74)

そのため happy-dom を使うことで解決が見込める。のだが、実際に使用してみると上記と同様に CI でのみ確率でタイムアウトが発生する。
内部実装を呼んでみるとここで挿入している setImmediate は node の global にある setImmediate 即ち timers のものと同様であるため、パフォーマンス問題と考える。

## 結論

テスト環境の高速化のために `@happy-dom` を入れたいというのはあるが今回とは別で対応するとして、 CI での実行時間ではタイムアウトする可能性があるのは特定のテストのみであるため、タイムアウト時間を長くする対応をする。
vitest に置き換えた際にまとめてまとめて不要なタイムアウトを消す作業を入れることで対応したい。
