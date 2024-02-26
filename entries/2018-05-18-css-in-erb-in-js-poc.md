---
title: "CSS in ERB in JS という実証実験"
date: 2018-05-18
---

## はじめに

この内容は [meguro.css#1](https://megurocss.connpass.com/event/82743/) での発表を元に内容を整理したものです。

リポジトリ: [euxn23/css-in-erb-in-js-poc](https://github.com/euxn23/css-in-erb-in-js-poc)

スライド: [slideshare](https://www.slideshare.net/euxn/20180518-css-in-erb-in-js-poc)

## 動機

### 大規模な CSS つらい

- BEM/SMACCS/OOCSS は命名規則で管理しようと言っているけど……
  - 大規模になってきたときに保守できなくなってくる
  - 名前がかぶったり、typo があったり
- 命名規則ベースでがんばっても結局はグローバルに展開されている
  - 読み込む css ファイルがどれかとかを命名規則だけで運用していくのは厳しい
- View 側との依存関係が非明示的になる
  - 命名規則に属せられないスタイルが発生して、common とかになっていき……
- JS で動的にスタイルをいじる時に実装との依存が非明示になる
  - JS で変更することをコメントで残すようになる
  - JS の負債化が進んでいるとそこに巻き込まれる

### CSS in JS という成功事例

- CSS in JS のメリット
  - JS と CSS での変数共有とか動的な処理の見通しがよくなる
  - CSS のスコープ制御を JS の module ベースでできる
  - 使用するスタイルは import するので依存関係が明示化される
- 実質的に Single Page Application じゃないと使えない
  - 既存の Rails や Laravel で使おうとすると設計レベルで作り直しになる

## 実証実験

### CSS in Ruby の検討

- テンプレートで css を注入できる？
  - これはできる
- Ruby 側で依存関係を明示できる？
  - Rails は自動で require される
  - = 明示化できない
  - => スコープ管理が崩壊
- CSS in Ruby の補完が効かない
- 動的に CSS 操作できない

### CSS in ERB in JS の検討

- JS で css を注入
- JS で module 化
  - 両方とも CSS in JS と同様のアプローチで実現できそう

### CSS in ERB in JS の実証実験

erb build script

```js
const fs = require("fs");
const { resolve, relative, dirname, basename, extname } = require("path");
const { readdirRecursivelySync } = require("readdir-recursively-sync");

const baseDir = resolve(__dirname, "app/views");
const erbJsPaths = readdirRecursivelySync(baseDir).filter(
  (p) => extname(p) === ".js"
);

erbJsPaths.forEach((erbJsPath) => {
  const requirePath = `./${relative(__dirname, erbJsPath)}`;
  const erbJs = require(requirePath);
  const erb = erbJs();
  const outputPath = `${dirname(erbJsPath)}/${basename(erbJsPath, ".js")}`;
  console.log(outputPath);
  fs.writeFileSync(outputPath, erb);
});
```

index.html.erb.js

```js
const commonBorder = require("../../styles/todos/common-border");

module.exports = () => `
<style>
th, td {
  ${commonBorder}
}
</style>

<p id="notice"><%= notice %></p>

<h1>Todos</h1>

<table style="${commonBorder}">
  <thead>
    <tr>
      <th>Name</th>
      <th colspan="3"></th>
    </tr>
  </thead>

  <tbody>
    <% @todos.each do |todo| %>
      <tr>
        <td><%= todo.name %></td>
        <td><%= link_to 'Show', todo %></td>
        <td><%= link_to 'Edit', edit_todo_path(todo) %></td>
        <td><%= link_to 'Destroy', todo, method: :delete, data: { confirm: 'Are you sure?' } %></td>
      </tr>
    <% end %>
  </tbody>
</table>

<br>

<%= link_to 'New Todo', new_todo_path %>
`;
```

common-border.js

```js
module.exports = `
border: 1px solid black;
`;
```

index.html.erb (生成後ファイル)

```erb

<style>
th, td {

border: 1px solid black;

}
</style>

<p id="notice"><%= notice %></p>

<h1>Todos</h1>

<table style="
border: 1px solid black;
">
  <thead>
    <tr>
      <th>Name</th>
      <th colspan="3"></th>
    </tr>
  </thead>

  <tbody>
    <% @todos.each do |todo| %>
      <tr>
        <td><%= todo.name %></td>
        <td><%= link_to 'Show', todo %></td>
        <td><%= link_to 'Edit', edit_todo_path(todo) %></td>
        <td><%= link_to 'Destroy', todo, method: :delete, data: { confirm: 'Are you sure?' } %></td>
      </tr>
    <% end %>
  </tbody>
</table>

<br>

<%= link_to 'New Todo', new_todo_path %>
```

## 考察

### 功績

- 概ね CSS in JS と同様の手法で実装できる
- Template Literal 内で html / css(js) の補完が動作する
- css の依存を module で管理できる
- 動的な処理と css 宣言を集約できうる
  - CSS in JS で行うような変数共有はできない
  - グローバル変数を使えばできなくはないが悪手か

### 懸念点

- ERB / Rails 変数の補完が効かない
  - IDE 向けプラグインを書けば解決すると思われる
- ビルドフローの検討
  - Webpacker があることもあり、 Webpack で実行するのが自然か
  - 変わり種だと [akameco/s2s](https://github.com/akameco/s2s) の検討も
- 出力前/後のどちらのインデントに合わせるか
  - そもそも Rails の出力ソースのインデントは大概崩れているが
  - ビルドフローで webpack loader をうまいこと作ればどうにかなりそうではある
  - prettier での整形も検討

### Slim => ERB 事前コンパイルのニーズ

- 新しい Ruby で ERB の実行速度が数倍に速くなったこともあり、事前に slim を erb にコンパイルしたいという考え
- このビルドフローを予め in JS 可能な形で作ってしまえば、今後普及させられる可能性
- slm.js 等、slim template を JS で使用するライブラリをうまく使えば、 slim 限定とはなるが簡略化できる可能性

### はしがき

- 本実験の PHP での使用
  - JS の Template Literal は `$` を使うが、 PHP も `$` を使うため問題は生じないか
  - PHP の方が Template Literal 内での補完が期待できるのでは
  - PHP 界隈での CSS 事情に詳しくないため、詳しい方の情報があればご意見ください
