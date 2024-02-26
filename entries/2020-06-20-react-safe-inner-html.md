---
title: "ReactのdangerouslySetInnerHTMLを安全に使うために"
date: 2020-06-20
---

## 後日追記

rehype-react 等の rehype エコシステムを使うことでより詳細に安全に制御可能です。

---

React に素の HTML (string)を挿入する場合は dangerouslySetInnerHTML を使用する必要があるのですが、 dangerouslySetInnerHTML はその名の通り危険な操作であるため、注意が必要です。

特にユーザ入力に基づき DOM を生成するテンプレートを自作している場合は、想定外の DOM 生成にも気をつける必要があります。(これは通常のテンプレートエンジンと同様)
なお、 innerHTML と同様の仕様に基づき、 script タグは無効化されます。が、 style タグは有効であるため、注意が必要です。

以下のサンプルコードではボタンのイベントハンドラに任意の JavaScript を仕込むことができます。
(ファイル構成はサンプルの完成系である https://github.com/euxn23/dangerously-set-inner-html-demo を参照のこと)

```javascript
const App = () => {
  const htmltext = `
    <html>
    <script>
      // innerHTML の仕様により起動しない
      alert('attack from script tag');
    </script>
    <body>
      <div>
        <button onClick="alert('attack from event handler')">Click Me</button>
      </div>
    </body>
    
    </html>`;

  return <div dangerouslySetInnerHTML={{ __html: htmltext }}></div>;
};
```

これらを機械的に行うために、 sanitize-html と jsdom を試します。

## 1. sanitize-html によるサニタイズ

sanitize-html の場合、デフォルトで多くの tag が disallow になっており、タグそのものが削除されるため、事前に判明している場合は allow を指定、そうでない場合は `allowTags = false` を指定し、 attribute の制限を行うことで sanitize します。
なお `disallowedTagsMode:` ` '``escape``' ` を指定すると `<>`がエスケープされ、 HTML のテキストがそのまま出力されます。デフォルトの挙動は `disallowedTagsMode:` ` '``discard``' ` です。

冒頭の通り、 style タグは innerHTML でも有効であり、 React アプリ外にも、グローバルで有効となるため、特に注意が必要です。フォーム等、一部を隠されたりスタイルを変更されると問題となるケース(フォームとユーザ入力 HTML のレンダリングが同居するケースはないとは思いますが)等もあるため、有効化する場合は慎重に行ってください。[css injection](https://speakerdeck.com/lmt_swallow/css-injection-plus-plus-ji-cun-shou-fa-falsegai-guan-todui-ce) という攻撃手法もあります。

style を当てる必要がない等、 class を含め全ての attributes が必要ない plain な HTML で良い場合は上記の方法が最適です。必要な場合は(tag ごとにですが) allowedAttributes に指定することで解決できます。
その他、 class 名での制限や inline style の制限もできます。監視されている class 名の指定を防ぐことにより GA への誤情報の送信を防いだり、 submit 誘導等を防ぐこともできます。
また、style attributes を有効にする場合は、 style によるクリック誘導による攻撃等を防ぐためにも、慎重に制限しないといけません。

以下がサンプルコードです。index.html に ` class=``"``red``" ` を指定すると、そちらに波及していることが確認できます。

```javascript
const App = () => {
  const htmltext = `
    <html>
    <style>
      .red {
        background: red;
      }
    </style>
    <body>
      <div>
        <button class="red" onClick="alert('attack from event handler')">Click Me</button>
      </div>
    </body>
    
    </html>`;

  const __html = sanitize(htmltext, {
    allowedTags: false,
    allowedAttributes: { button: ["class"] },
  });

  return <div dangerouslySetInnerHTML={{ __html }}></div>;
};
```

## 2. jsdom によるサニタイズ

jsdom では text をメモリ上で HTML として解釈し、 DOM 操作を行うことができます。
この **HTML をして解釈** される時点で `<script>` タグは本来解釈されるのですが、 JSDOM のデフォルトでは実行されないようになっています。実行する必要がある場合は、 `runSctipts:` ` '``dangeriously``' ` のオプションを有効化することで実行できます。
以下は攻撃の例です。

```javascript
const App = () => {
  const htmltext = `
    <html>
    <script>
      console.log('attack from jsdom')
    </script>
    <style>
      .red {
        background: red;
      }
    </style>
    <body>
      <div>
        <button class="red" onClick="alert('attack from event handler')">Click Me</button>
      </div>
    </body>
    </html>`;

  const { window } = new JSDOM(htmltext, { runScripts: 'dangeriously' });
  const __html = `
    // <html> is possibly null
    ${window.document.querySelector('html')!.innerHTML}
    `
  return <div dangerouslySetInnerHTML={{ __html }}></div>;
};
```

上記の例では `<html>` 全部を取得していますが、`<body>` だけにする、 `<style>` も含む、など様々な工夫が容易に行えます。
しかしこのままでは `runScripts` の指定がない場合でも DOM 内に定義されたイベントハンドラ関数は実行されてしまうため、イベントハンドラを持つ DOM から attributes を削除する必要があります。

```javascript
const App = () => {
  const htmltext = `
    <html>
    <script>
      console.log('attack from jsdom')
    </script>
    <style>
      .red {
        background: red;
      }
    </style>
    <body>
      <div>
        <button class="red" onClick="alert('attack from event handler')">Click Me</button>
      </div>
    </body>
    </html>`;

  const { window } = new JSDOM(htmltext);
  window.document.body
    .querySelectorAll('[onClick]:not([onClick=""])')
    .forEach((el) => el.removeAttribute("onClick"));
  const __html = `
    <body>
    <style>
    ${Array.from(window.document.querySelectorAll("style")).map(
      (styleTag) => styleTag.innerHTML
    )}
    </style>
    ${window.document.body.innerHTML}
    </body>
    `;

  return <div dangerouslySetInnerHTML={{ __html }}></div>;
};
```

## 比較

sanitize-html はデフォルトで全禁止側に倒しており、必要なものだけ通す allow list 方式を取っています。
対して jdsom は script タグを除き DOM をそのまま通すようになっています。
jsdom は deny list のような機構は持っていませんが、 querySelector 等を使用して deny 対象の DOM のみをサニタイズすることができます。

ほとんどの attribute を deny する場合、 sanitize-html を使用するのがシンプル、かつ安全になります。
一方 allow と deny のルールが複雑な場合は、 jsdom が向いているように見えます。

一概にどちらが優れている、というのはないため、必要に応じて検討する必要がありそうです。

## 補足

ShadowDOM でも JS の無効化をできるように思うかもしれませんが、 script タグの実行を防ぐのみで、ハンドラーは実行されてしまうため、このケースでは使用できません。
