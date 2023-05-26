---
title: "Stencil.js で CustomElements を実装する"
date: 2020-12-06
---

## Stencil.js とは

Stencil.js は、マルチプラットフォーム向け UI システムである Ionic の開発チームが主導して開発が進められています。

https://stenciljs.com/

執筆時点でのバージョンは v2.3.0 が提供されており、1 度のメジャーアップデートが実施されています。
また、 Ionic Framework の v4.x 以降は Stencil によって実装されています。
Stencil.js は、再利用可能なコンポーネントを、 CustomElements として定義するためのツールチェイン・コンパイラです。(公式でフレームワークではないと名言しています。)
TypeScript ファーストであり、 Decorator (TC39 proposal にあるものではなく、 TS 実装の legacy なものなので、将来的に変更になる可能性はあります)と React に依存しない JSX でコンポーネントを記述します。
最近のバージョンで SSG にも対応しましたが、ここでは CustomElements を作ることにフォーカスして紹介します。

## 始め方

公式の Getting Started をベースに、かいつまんで説明します。

https://stenciljs.com/docs/getting-started

任意のディレクトリで `$ npm init stencil` を実行することで、実行時プロンプトで聞かれるプロジェクト名のディレクトリが作成されます。
ionic-pwa / app / component から選択するプロンプトが表示されますが、ここでは component を選択します。
src ディレクトリ以下に stencil に必要なファイル軍とサンプルコードが生成されます。不要であれば `my-component` と `utils` は削除してしまいましょう。
`components.d.ts` はビルドのたびに自動生成されます。プロジェクトにもよりますが、複数のトピックブランチで別のコンポーネントを作成した際に順序のコンフリクトが発生するため、 gitignore に追加してもよいかもしれません。

既存プロジェクトに stencil を追加するコマンドは無いようですが、 `tsconfig.json` と `stencil.config.ts` があれば開始することができます。
なお tsconfig.json は stencil のために珍しい構成をしているため、既存プロジェクトとは別に管理し、自動生成されたものをベースに使用するのが好ましいと思います。
その後は `npx stencil g component-name` コマンドでコンポーネントの雛形を作成することができます。

## コンポーネントの実装

ためしに`$ npx stencil g first-component` を実行すると、以下のようなファイルが生成されます。(テストファイルについては省略します。)

```typescript:src/components/first-component/first-component.tsx
import { Component, Host, h } from '@stencil/core';

@Component({
  tag: 'first-component',
  styleUrl: 'first-component.css',
  shadow: true,
})
export class FirstComponent {

  render() {
    return (
      <Host>
        <slot></slot>
      </Host>
    );
  }

}
```

css の方はこのようになっています。

```css:src/components/first-component/first-component.css
:host {
  display: block;
}
```

`@Component()` デコレータでコンポーネントクラスのメタ情報を定義します。 Angular を触ったことのある方なら馴染みやすいかと思います。
デフォルトで `shadow: true` であり ShadowDOM が有効化されていますが、 stenicl は ShadowDOM をオフにすることもできます。
(が、非常に推奨しません。ライフサイクルは ShadowDOM ではなく stencil 独自の実装により実行されるため、他フレームワークとの組み合わせでは対象 DOM Node が見つからない、といったバグが容易に引き起こされます。)
`<Host />` は ShadowDOM のルート要素、 `<slot />` は子として渡された要素を表しています。

css は ShadowDOM により scoped になっています。(ShadowDOM を off にした場合は global になります。)
また、scss を使用することもできます。

ためしに以下のように MyButton コンポーネントを作ってみます。

```typescript jsx
import { Component, ComponentInterface, h, Prop } from "@stencil/core";

@Component({
  tag: "my-button",
  styleUrl: "button.scss",
  shadow: false,
})
export class Button implements ComponentInterface {
  @Prop() theme?: string;

  @Prop() disabled?: boolean;

  render(): h.JSX.IntrinsicElements {
    const theme = this.theme ?? "secondary";

    return (
      <button
        class={{
          [theme]: true,
          disabled: this.disabled,
        }}
        disabled={this.disabled}
      >
        <slot></slot>
      </button>
    );
  }
}
```

```scss
:host {
  button {
    display: block;
    width: 100%;
    padding: 0.875rem;

    font-weight: 700;
    line-height: 1rem;

    border-radius: 8px;
    border: none;
    user-select: none;

    /* default is secondary */
    &.secondary {
      background: #d1d5db;
      color: #6ee7b7;

      &:hover {
        background: #9ca3af;
      }

      &:active {
        background: #6b7280;
        color: $#10B981;
      }

      &.disabled {
        background: #d1d5db;
        color: #d1d5db;
      }
    }

    &.primary {
      background: #10b981;
      color: white;

      &:hover {
        background: #059669;
      }

      &:active {
        background: #047857;
      }

      &.disabled {
        background: #d1fae5;
      }
    }
  }
}
```

class の表記には React でいう classnames や clsx のように Object 記法を使うことができます。
また、`<Host />` 要素は省略することができます。

## ライフサイクル

Stencil.js にも他のフレームワーク同様、コンポーネントのライフサイクルが存在します。

https://stenciljs.com/docs/component-lifecycle

公式ドキュメントより引用

![](https://static.blog.euxn.me/kbGWZcv.png)

これらのライフサイクルメソッドはコンポーネントの interface に定義されており、 class に実装して使用します。
(Angular の ngOnInit 等に近いです。)

表示時にはコンポーネントが DOM Node と接続された際に呼び出される `connectedCallback` および初回のみの `componentWillLoad` 、もしくはコンポーネントがレンダリングされる直前に呼び出される `componentWillRender` で表示に必要な計算処理を行います。
`connectedCallback` は主に 1 度のみの初期化(Props や関連要素のデフォルト値埋めなど)や関連しているコンポーネント(先祖/子孫要素)の探索などを行うのに適しています。

更新時には `@Watch` と `componentShouldUpdate` と `componentWillUpdate` と明確に順序づけて分かれている関数を使用します。

更新後に呼び出される `componentDidRender` や `componentDidLoad` 、 `componentDidUpdate` は、他の Component にレンダリング完了を通知するイベントを発火する用途で使うことが多いでしょう。

**別のフレームワークと組み合わせて使用する場合は、それぞれのライフサイクルのタイミングの違いに注意する必要があります。**

## 終わりに

本記事では Stencil.js による CustomElements の実装方法を紹介しました。
Stencil.js とは独立した CustomElements として出力されているため、 React や Angular のアプリケーションにもそのまま使用できます。
複数のフレームワーク間で共通して使用できるコンポーネントを実装するのに、 lit-element では表現力が物足りない場合には Stencil.js は選択肢に挙がるでしょう。

しかし、複数のフレームワークで共用するということは、それぞれのフレームワーク向けに都度実装するのが大変であったり、適切なライブラリが存在しない場合である可能性が高いです。つまり、**再利用性を目的に CustomElements を実装するということは、再利用する意義のある複雑なコンポーネントになりがち**ということです。
デザインシステムの実装とした場合でも、入力要素の制御等、複雑な制御を行う場合、各アプリケーションのフレームワーク側で実装するか、 CutsomElements として実装するか、は慎重に判断する必要があります。

また、 CustomElements の提供する独自のイベントに対するハンドラ(例: fillfulled イベントを定義した場合の onFilfulled ハンドラなど)は CustomElements の責務の範囲外でもあり、自動で実装はされません。
また、 JSX として使用する場合、型情報が JSX で無くなってしまいます。
Stencil.js では、メジャーなフレームワーク向けにハンドラや型定義等を提供する Proxy を提供しています(バージョン的に、 まだ experimental なようですが、安定して動作しています。)
Proxy の詳細についてはまた別の投稿で紹介するので、是非チェックしてください。

この記事は [Japan Digital Design Advent Calendar 2020](https://adventar.org/calendars/5160) の 6 日目の記事でした。
