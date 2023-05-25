---
title: "react-router v4 でFlux アプリケーションをHot Module Replacement する"
date: 2016-12-06
---

この記事は [React Advent Calendar 2016](http://qiita.com/advent-calendar/2016/react) の6日目の記事です。
(アドベントカレンダーに紐づけるの忘れたまま日付超えてしまいました……ごめんなさい！)

`react-router v4` が良さそうという話を聞き、`flux/utils` で作られたアプリケーションを書き換えたので、特徴を簡単に説明します。


# TL;DR
- `react-router v4` はだいぶわかりやすい感じにはなっているものの、資料はまだ少ない
- `react-router` で `Hot Module Replacement` する場合は構成を意識する必要あり
- 実装したサンプルはこちら [yutaszk/flux-react-router-v4-hmr-example](https://github.com/yutaszk/flux-react-router-v4-hmr-example)


# 1. はじめに
- `react` をある程度知っている人向けになります。ごめんなさい！
  - `react-router` / `flux` については少し知っていれば大丈夫な気もします。
- `react-router v4` 自体については以下から学ばせて頂きました
  - [大幅変更されそうな react-router @ next (v4) 覗き見メモ](http://qiita.com/inuscript/items/f28ea779b82adfb133a3)
  - API 大幅に変わるけどだいぶ小さくなった感じとのこと
- `Hot Module Replacement` については以下が詳しいです
  - [webpackのHot Module ReplacementでWebフロントエンドを爆速開発](http://qiita.com/sergeant-wizard/items/60b557fc1c763f0a1531)
  - ざっくり言うとコード書き換えて差分だけ画面が変わるので早い！って感じ(ざっくり)
  - `webpack` の拡張？の `webpack-dev-server` を使って実現している


# 2. React Router v4 での色々な書き方
上で紹介した投稿にもありますが、React Router はかなり大きく、その書き方に縛られる部分が結構あるように感じられました。
v4 では `props.children` を使って子Component のレンダリング場所を指定したり、画面の遷移に`history` を渡す必要があったり、というのがなくなり、素直に書けるようになっているように感じられます。
ただし、現状ではドキュメントやサンプルとなる資料が少なかったので、いくつかの実装例をコードを交えて説明します。


### 共通部分(ナビゲーションバー/サイドバー)
`react-router v4` では以下のように素直に書けます。

```html
<BrowserRouter>
  <div>
    <nav className="navbar navbar-inverse">
      <div className="container">
      <Link className="navbar-brand" to="/">SampleApp</Link>
      <ul className="nav navbar-nav">
        <li><Link to="/menu1">Menu1</Link></li>
        <li><Link to="/menu2">Menu2</Link></li>
        <li><Link to="/menu3">Menu3</Link></li>
      </ul>
      </div>
    </nav>
    <div className="container">
      <Match exactly pattern="/" component={Top} />
      <Match exactly pattern="/menu1" component={Menu1} />
      <Match exactly pattern="/menu2" component={Menu2} />
      <Match exactly pattern="/menu3" component={Menu3} />
    </div>
  </div>
</BrowserRouter>
```

これでナビゲーションバーはそのままに、内部(ここでは `.container` の `div` の内側)だけが差し変わる形式になります。
親子関係を `Route` に記述して `props.children` として渡していたv3 に比べると、より宣言的、直観的に書けるようになっていると思います。


### flux の `Container` を作る
`BrowserRouter` の中は `Stateless Functional Component` でなければならないため、`BrowserRouter` の外で定義します。

```xml
class Root extends React.Component {
  constructor(props) {
    super(props);
  }
  static getStores() {
    return [
      BookStore,
    ];
  }
  static calculateState() {
    return {
      appState: {
        books: BookStore.getState()
      },
    };
  }

  render() {
    return (
      <BrowserRouter>
        <div className="container">
          <Match exactly pattern="/menu1" component={Menu1} />
          <Match exactly pattern="/menu2" component={Menu2} />
          <Match exactly pattern="/menu3" component={Menu3} />
        </div>
      </BrowserRouter>
    );
  }
}

const App = Container.create(Root);
export default App;
```



### props を渡す
`flux` を使っていると、アプリケーション全体の `state` を子要素に渡す実装になると思います。
公式のドキュメントには `props` を渡す方法についてのわかりやすい記述がありませんが、以下のように `render` を使うことで実装できます。

```xml
<Match
  exactly pattern="/books"
  render={() => <BookList appState={this.state.appState} />}
/>
```

### path パラメータを取得する
URL からpathパラメータを取得するには、 `Match` の `pattern` に `/:id` といった形で指定します。
`params` を `props` として渡すため上記の通り `render` を使用します。
`render` に渡す匿名関数に渡される値の中の `params` を渡すことで実装できます。
匿名関数に渡される値は `params` の他に、 `isExact` `location` `pathname` `pattern`が取得できます。

```xml
<Match
  pattern="/books/detail/:id"
  render={({params}) => <BookDetail appState={this.state.appState} params={params} />}
/>
```

以下の用に渡した先の `Component` から取得できます。

```js
const book = this.props.appState.books.find(b => b.id === +this.props.params.id) || {};
```


### js の処理内で画面を遷移させる
`BrowserRouter` 直下にある `router` を遷移処理を行いたい `Component` まで渡します。

```xml
<BrowserRouter>
  {({ router }) => (
    <div className="container">
      <Match
        pattern="/books/new"
        render={() => <BookCreate appState={this.state.appState} router={router} />}
      />
    </div>
  )}
</BrowserRouter>
```

`props` として渡した `router` の`transitionTo()` を使用することで画面遷移ができます。

```js
handleForm(ev) {
  ev.preventDefault();
  BookAction.create(this.state);
  this.props.router.transitionTo("/books");
}
```

BrowserRouter 直下では `router` の他に、 `action` `location` (後述) が取得できます。


### 現在のURL を取得する
現在のURL に応じてナビゲーションバーのアクティブを変更することも、以下のように `location` から `pathname` を取得することで実装できます。

```xml
<BrowserRouter>
  {({ location }) => (
    <div>
      <nav className="navbar navbar-inverse">
        <div className="container">
          <ul className="nav navbar-nav">
            <li className={location.pathname === '/menu1' ? 'active' : ''}>
              <Link to="/menu">Menu1</Link>
            </li>
            <li className={location.pathname === '/menu2' ? 'active' : ''}>
              <Link to="/menu2">Menu2</Link>
            </li>
            <li className={location.pathname === '/menu3' ? 'active' : ''}>
              <Link to="/menu3">Menu3</Link>
            </li>
          </ul>
        </div>
      </nav>
      <div className="container">
        <Match exactly pattern="/menu1" component={Menu1} />
        <Match exactly pattern="/menu2" component={Menu2} />
        <Match exactly pattern="/menu3" component={Menu3} />
      </div>
    </div>
  )}
</BrowserRouter>
```


# 3. Hot Module Replacement への対応
`react-router v4` を使って動かすだけなら上までで動きますが、 `HMR` に対応させるのにも手間が掛かったので、別項目として書きます。

`webpack` のにplugin を使うように指定したり、 `babel` のplugin を指定したりが必要になります。
[本番ビルド向けのwebpack.config](https://github.com/yutaszk/flux-react-router-v4-hmr-example/blob/master/webpack.config.js) に加えて、[こんな感じ](https://github.com/yutaszk/flux-react-router-v4-hmr-example/blob/master/webpack.config.dev.js)に設定を追加してあります。

以下でそれぞれ必要な手順を簡単に説明します。

### webpack.config.dev.js の設定
`HRM` 用のplugin 等を追記した開発用の `webpack` のconfig は以下の通りです。

```js
const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  entry: [
    'react-hot-loader/patch',
    `webpack-dev-server/client?http://${devServerHost}:${devServerPort}`,
    'webpack/hot/only-dev-server',
    './src/index',
  ],

  plugins: [
    new webpack.HotModuleReplacementPlugin(),
    new webpack.NamedModulesPlugin(),
    new HtmlWebpackPlugin({
      hash: false,
      template: './src/index.html',
    }),
    new webpack.ContextReplacementPlugin(/moment[\/\\]locale$/, /nb/),
  ],

  devtool: 'inline-source-map',

  output: {
    path: path.resolve(__dirname, 'public'),
    publicPath: '/',
    filename: 'bundle.js',
  },

  module: {
    loaders: [
      {
        test: /\.jsx?$/,
        exclude: /node_modules/,
        loader: 'babel',
      },
    ],
  },

  resolve: {
    extensions: ['', '.js', '.jsx'],
  },
};
```


### .babelrc へのplugin 指定
`react-hot-loader/babel` plugin が必要なので、 `.babelrc` で指定します。

```json
{
  "presets": ["es2015", "react"],
  "plugins": ["react-hot-loader/babel"]
}
```


### webpack-dev-server の起動
webpack-dev-server を起動させる際は、オプションが記述されている `devserver.js` ファイルを用意し、これを起動します。

```js
const webpack = require('webpack');
const WebpackDevServer = require('webpack-dev-server');

const config = require('./webpack.config.dev.js');

new WebpackDevServer(webpack(config), {
  publicPath: config.output.publicPath,
  contentBase: 'src',
  inline: true,
  hot: true,
}).listen(8080, 'localhost', err => {
  if (err) return console.log(err);
});
```

`contentBase` に指定した `/src` を起点として開発サーバが起動します。


### React Component への設定

これだけだと自動で更新されないので、アプリ全体を `AppContainer` 以下に置く必要があります。
ここでは `entry` である `index.js` を以下のようにしています。

```js

'use strict';

import React from 'react';
import ReactDOM from 'react-dom';
import { AppContainer } from 'react-hot-loader';

import App from './components/app';


ReactDOM.render(
  <App />,
  document.querySelector('#app')
);

// For Development
if (module.hot) {
  module.hot.accept('./components/app', () => {
    const NextApp = require('./components/app').default;
    ReactDOM.render(
      <AppContainer>
        <NextApp />
      </AppContainer>,
      document.querySelector('#app')
    );
  });
}
```

プロダクションビルドでは自動リロードの機能が動かないようになっていますが、ちゃんとファイルから除きたかったらいろいろ工夫する必要がありそうです。
(イケてる解決方法があれば教えてください……)

これで `react-router` でも画面が差分更新されて開発が効率化できます。


# 4. 最後に
本文中で説明に出したコードを用いた実装は以下にあります。
`npm start` を実行すると `Hot Module Replacement` が動く開発サーバが起動するので、是非試してみてください。

[yutaszk/flux-react-router-v4-hmr-example](https://github.com/yutaszk/flux-react-router-v4-hmr-example)



明日の[React Advent Calendar 2016](http://qiita.com/advent-calendar/2016/react) 7日目は @amagitakayosi さんによる **React本体のコード解説** です。


# 5. 参考
- [大幅変更されそうな react-router @ next (v4) 覗き見メモ](http://qiita.com/inuscript/items/f28ea779b82adfb133a3)
- [mhaagens/react-mobx-react-router4-boilerplate](https://github.com/mhaagens/react-mobx-react-router4-boilerplate)
