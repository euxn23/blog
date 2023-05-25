---
title: "Angular v9 で Angular Elements(WebComponents 出力)を使う"
date: 2019-12-16
---

この記事は [Angular アドベントカレンダー 2019](https://qiita.com/advent-calendar/2019/angular) の11 日目の記事です。体調不良につき遅くなり申し訳ありません……。

## はじめに

Angular の WebComponents 出力である Angular Elements が搭載されたのが Angular v6 でのことなので、1年半になります。

今年は Setncil 1.0 がリリースされ、 lit-html での実装に比べ抽象度を高く保ちつつも、 pure WebComponents としての出力することができることから注目を浴びているように感じます。
Stencil での実装としても、 Angular の良い点である ShadowDOM + Sass を継承しており、 Component 単位で見ると Angular に通じる開発体験がある箇所もあります。
しかし Angular の出番が奪われたわけでは全くなく、やはりフレームワークとしての堅さ、簡潔な Template、高度なビルドシステムを持ちつつ、部分的に WebComponents として出力できることは他にない特徴かと思います。

この記事では Angular Elements と Stencil で同様の簡単なサンプルを実装し、 Angular を触ったことがない人でも、意外ととっつきやすく、意外とバンドルサイズが大きくなく、 WebComponents としても十分実用的である、という点を紹介することを主な目的としています。
ですので、 Angular と Stencil のどちらが優れている、という点について言及するものではありません。

なお、開発環境は執筆時点での LTS である node.js 12.13.x と、最新の rc である Angular CLI v9.0.0-rc.5 を前提とします。
(正式リリース後に可能な限り本記事を対応しますが、 rc であるため変更が入った場合はご容赦ください)

本文中の実装のサンプルリポジトリは以下です。

https://github.com/euxn23/angular-elements-counter

## Angular でのカウンターコンポーネントの実装

Angular のプロジェクトを作るところからはじめていきます。

```bash
$ ng new angular-elements-counter
$ cd angular-elements-counter
```

デフォルトで AppComponent が生成されているのでこちらを編集しても良いのですが、今回はわかりやすく MyCounterComponent を生成します。

```bash
$ ng generate component my-counter
```

以下のように編集します。

```typescript:src/app/my-counter/my-counter.components.ts
import { Component, EventEmitter, Output } from '@angular/core';

@Component({
  selector: 'app-my-counter',
  templateUrl: './my-counter.component.html',
  styleUrls: ['./my-counter.component.scss']
})
export class MyCounterComponent {
  count = 0;

  @Output()
  valueChanged = new EventEmitter();

  increment() {
    this.count++;
    this.event.emit(this.count);
  }
}
```

```html:src/app/my-counter/my-counter.components.html
<button (click)="increment()">{{ count }}</button>
```

次に、ビルドのルートから辿れるよう、 AppModule を書き換えます。
AppComponent は使用しないため削除し、 MyContainerComponent を追加します。
AppComponent 内で Bootstrap を行う参考情報もいくつかありますが、 AppComponent が使われているのか使われていないのか混乱の元となるかと思い、今回は Module 内でブートストラップを行います。

なお、 `@Module()` 内での `entryComponents` の定義は Ivy 以降不要になったとのことです。

```typescript:src/app/app.module.ts
import { BrowserModule } from '@angular/platform-browser';
import { Injector, NgModule } from '@angular/core';
import { createCustomElement } from '@angular/elements';
import { MyCounterComponent } from './my-counter/my-counter.component';

@NgModule({
  declarations: [MyCounterComponent],
  imports: [BrowserModule]
})
export class AppModule {
  constructor(injector: Injector) {
    const MyCounterElement = createCustomElement(MyCounterComponent, {
      injector
    });
    customElements.define('app-my-counter', MyCounterElement);
  }
  ngDoBootstrap() {}
}
```

通常の Angular アプリケーションの一部として使用する場合、 Angular Elements 用に別のビルド設定を用意し、 Module を分けるのが良いかと思います。

## ビルドと html からの読み込み

production ビルドを行い、生成物を html から読み込みます。

```bash
$ yarn build --prod --output-hashing none
```

ビルドすると、 dist ディレクトリに以下のファイルが生成されます。

```
chunk {0} runtime-es2015.js (runtime) 1.45 kB [entry] [rendered]
chunk {0} runtime-es5.js (runtime) 1.45 kB [entry] [rendered]
chunk {2} polyfills-es2015.js (polyfills) 36 kB [initial] [rendered]
chunk {3} polyfills-es5.js (polyfills-es5) 125 kB [initial] [rendered]
chunk {1} main-es2015.js (main) 109 kB [initial] [rendered]
chunk {1} main-es5.js (main) 131 kB [initial] [rendered]
chunk {4} styles.css (styles) 0 bytes [initial] [rendered]
chunk {scripts} scripts.js (scripts) 27 kB [entry] [rendered]
```

runtime、 polyfills、 main は Differential Loading 用に分けて吐き出されています。 scripts は angular.json の scripts に定義したものを共通です。
今回は Chrome で動かすことを想定し es2015 のもので html ファイルを生成します。

```html:static/index.html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>Hello Angular Elements</title>
  </head>
  <body>
    <app-my-counter></app-my-counter>
    <script src="/dist/angular-elements-counter/main-es2015.js"></script>
    <script src="/dist/angular-elements-counter/polyfills-es2015.js"></script>
    <script src="/dist/angular-elements-counter/runtime-es2015.js"></script>
    <script src="/dist/angular-elements-counter/scripts.js"></script>
    <script>
      const counterElement = document.querySelector('app-my-counter');
      counterElement.addEventListener('valueChanged', ev => {
        console.log(`count: ${ev.detail}`);
      });
    </script>
  </body>
</html>
```

実際に動かすために、 http-server を起動します。

```bash
$ yarn add -D http-server
$ yarn http-server .
```

http://localhost:8080/static にアクセスすると、ボタンが存在し、クリックするとカウントが取得できます。
また、 console を見ると、イベントをキャプチャできていることが分かります。


## 参考: Stencil での実装とバンドルサイズの比較

同様の WebComponent を Stencil で以下のように実装し、バンドルサイズを計測します。

```typescript:src/components/my-component.tsx
import { Component, Event, EventEmitter, State, h } from '@stencil/core';

@Component({
  tag: 'app-my-counter',
  styleUrl: 'my-component.css',
  shadow: true
})
export class MyComponent {
  @State() count = 0;

  @Event() valueChanged: EventEmitter;

  private increment() {
    this.count++;
    this.valueChanged.emit(this.count);
  }

  render() {
    return <button onClick={() => this.increment()}>{this.count}</button>;
  }
}
```

```typescript:stencil.config.ts
import { Config } from '@stencil/core';

export const config: Config = {
  namespace: 'app-my-counter',
  outputTargets: [
    {
      type: 'dist'
    }
  ]
};
```

実装が1つにまとめられているファイルは `dist/app-my-counter/app-my-counter.js` になるのでこちらを読み込みます。

```html:src/index.html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>Hello Stencil</title>
  </head>
  <body>
    <app-my-counter></app-my-counter>
    <script src="/dist/app-my-counter/app-my-counter.js"></script>
    <script>
      const counterElement = document.querySelector('app-my-counter');
      counterElement.addEventListener('valueChanged', ev => {
        console.log(`count: ${ev.detail}`);
      });
    </script>
  </body>
</html>
```

同様に http-server を起動し、 localhost:8080/src にアクセスすると、 Component が動作していることが分かります。

この時、 `app-my-counter.js` のバンドルサイズは 135KB でした。
上記 Angular Elements での実装は、合計 173KB です。

Angular で WebComponents 作ったら重そう、という感覚がある方もいるかと思いますが、結果としては 2 割ほど Angular の方が大きいものの、致命的なまでに大きいわけではないことが分かります。

今回は 1 Component での例でしたが、 Component が増えていった場合にはまた差が出るか、もしくは逆に最適化や bootstrap のサイズの影響で縮まるか、どちらもあり得ると思います。
(今回はそこまで検証しきれず申し訳ないのですが、もし試した方がいましたら教えてください。)

## 終わりに

この記事では Angular Elements が意外とバンドルサイズが大きくなく、 WebComponents としても十分実用的である、という点を紹介しました。
フレームワークとして機能しつつ、一部は WebComponent として再利用可能なパーツとして吐き出せるのは他にはない Angular の特徴かと思います。

Angular Elements に関しては情報が少なかったり、 Angular から切り離す部分の知見が少ないなどあるため、みなさんも触って知見を増やしていけるといいなと思っています。
