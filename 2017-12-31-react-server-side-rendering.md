---
title: "React での ServerSideRendering 入門"
date: 2017-12-25
---

## まえおき

この記事は[React Advent Calendar 2017](https://qiita.com/advent-calendar/2017/react)の 2 日目になるはずでしたが 25 日目が空いていたので代わりに 25 日目です。~~いずれにせよ遅刻なのですが……~~

本文中のサンプルコードは[github.com/euxn23/react-ssr-sample](https://github.com/euxn23/react-ssr-sample) にあります。ビルド済みなので `npm install` してそのまま動きます

## ServerSideRendering とは

言葉の通りに読めばサーバ側でレンダリングすることであるが、フロントエンドの文脈では、本来ブラウザ上で構築される DOM をサーバ側で生成してから返すことで、

- イニシャルビューが早くなる
- パフォーマンスが向上する
- SEO 対策になる(クローラが JS を解釈するか定かではないため)

というメリットを得るための手法のことを指す

React での SSR をやってみるにあたって、サーバサイドの経験がないと、どのように動くのかイメージが湧かないという話を聞いたので、まず通常のサーバサイドでのテンプレートエンジンでのレンダリングの話をし、それから React での SSR の話をする

## 1. テンプレートエンジンによるサーバサイドレンダリング

※ サーバサイドの話がわかる人はこの章は読み飛ばして問題なさそうです

古くから(要出典)ある方式であり、わかりやすい言語でいうと PHP がまさにそれである

他にも erb や ejs、複雑なものだと haml や jade(pug) 等もある

比較対象が React による SSR のため、ベース部分を共通して Express.js にするため、ejs を使う

使用する node.js のバージョンは 8 以降を推奨する

### Express.js + ejs で HTML を動的生成する

まず非常にシンプルに、 HTML をテキストで返すコードを、 Express.js を用いてサーバサイドの技術で実装する

```js:sample01.js
'use strict'

const express = require('express')
const app = express()

app.get('/', (req, res) => {
  res.send('<html><h1>Hello World</h1></html>')
})

app.listen(3000)
```

このサーバを起動しブラウザから `localhost:3000` にアクセスすると、 h1 で `Hello World` が表示される

これだけではつまらないので、ejs テンプレートエンジンを使用して、別途用意してある view ファイルを render する

```js:sample01-2.js
'use strict'

const express = require('express')
const app = express()

app.set('views', __dirname + '/views')
app.set('view engine', 'ejs')

app.get('/', (req, res) => {
  res.render('sample01-2')
})

app.listen(3000)
```

```erb:views/sample01-2.ejs
<html>
  <h1>Hello World</h1>
</html>
```

テンプレートエンジンを使う手始めとして、Hello World の文字列を渡して render する

```js:sample02.js
'use strict'

const express = require('express')
const app = express()

app.set('views', __dirname + '/views')
app.set('view engine', 'ejs')

app.get('/', (req, res) => {
  res.render('sample02', {message: 'Hello World'})
})

app.listen(3000)
```

```erb:views/sample02.ejs
<html>
  <h1><%= message %></h1>
</html>
```

`localhost:3000?name=euxn23` のようにクエリを付けるとそれがサーバ側で処理される

```js:sample03.js
'use strict'

const express = require('express')
const app = express()

app.set('views', __dirname + '/views')
app.set('view engine', 'ejs')

app.get('/', (req, res) => {
  res.render('sample03', {name: req.query.name})
})

app.listen(3000)
```

```erb:views/sample03.ejs
<html>
  <h1>Hello, <%= name %></h1>
</html>
```

外部 API コールをサーバ側で行う場合、その API が重い場合はそれの解決を待ってから render されるため、レスポンスが遅くなる

今回は、2 秒ほど待ってレスポンスを返す API を用意したのでそちらを叩く

```js:sample04.js
'use strict'

const express = require('express')
const fetch = require('isomorphic-fetch')
const app = express()


app.set('views', __dirname + '/views')
app.set('view engine', 'ejs')

app.get('/', async (req, res) => {
  // ちゃんとやる場合はサニタイズしてから渡す
  const response = await fetch('https://euxn-lazy-api.herokuapp.com/')
  const json = await response.json()
  res.render('sample04', {spentMs: json.spentMs})
})

app.listen(3000)
```

```erb:views/sample04.ejs
<html>
  <h1>Lazy api! <%= spentMs %> ms had spent.</h1>
</html>
```

このような観点からみると、ブラウザでレンダリングする場合のメリットとして、遅延を伴う API コールを待たずともイニシャルビューが返ることがあげられる

とはいえ、HTML を汲みあげる速度は大抵の場合サーバの方が早い(ようにチューニングすべきっぽい)ことが、サーバ側でレンダリングするメリットとなる

最初にあげた通り、React で SSR をするメリットはこの辺りだろう

## 2. React.js の Component を使い HTML を動的生成する

まずは、上記のように、React の Component を単なるテンプレートとして使用する例から実装する

```js:sample01.js
'use strict'

const express = require('express')
const React = require('react')
const { renderToString } = require('react-dom/server')
const MyComponent = require('./views/sample01')

const app = express()

const htmlify = rootComponent => (
  `
  <html>
    <div id="app">${rootComponent}</div>
  </html>
  `
)

app.get('/', (req, res) => {
  const prerenderedContent = renderToString(React.createElement(MyComponent))
  const prerenderedHtml = htmlify(prerenderedContent)
  res.send(prerenderedHtml)
})

app.listen(3000)
```

node では JSX の解釈ができないため、 `<MyComponent />` という記述はせず、 `React.createElement(MyComponent)` を使う

```js:sample01.jsx
'use strict'

const React = require('react')
const { Component } = React

module.exports = class MyComponent extends Component {
  render() {
    return (
      <div>
        <h1>Hello World</h1>
      </div>
    )
  }
}
```

同様に Component は Babel を通して以下のように JSX のない形式にする。もしくははじめからこちらのように書く

(node-jsx は古いし、babel-node はプロダクションで使えるものではないので、基本的には事前にビルドするか、JSX 無しの記述を行う)

```js:views/sample01.js
'use strict';

const React = require('react');
const { Component } = React;

module.exports = class MyComponent extends Component {
  render() {
    return React.createElement(
      'div',
      null,
      React.createElement(
        'h1',
        null,
        'Hello World'
      )
    );
  }
};
```

上記サーバ側のコードの、 `react-dom/server#renderToString` により、Component を DOM 構造の文字列へと変換する

この際、この後ブラウザ上の React が仮想 DOM を認識して動作するよう、DOM には React 用の key が振られている

まず Express で HTML として返すために HTML タグでくくり、React の影響範囲であることを示す DOM 以下に renderToString した Component を埋め込む

今回はレンダリング後の挙動はないため、レンダリング後のブラウザ側の React との連携は後述する

上記 Express で行った実装を React で行うと以下のようになる

```js:sample02.js
'use strict'

const express = require('express')
const React = require('react')
const { renderToString } = require('react-dom/server')
const MyComponent = require('./views/sample02')

const app = express()

const htmlify = rootComponent => (
  `
  <html>
    <div id="app">${rootComponent}</div>
  </html>
  `
)

app.get('/', (req, res) => {
  const prerenderedContent = renderToString(React.createElement(MyComponent, {message: 'Hello World'}))
  const prerenderedHtml = htmlify(prerenderedContent)
  res.send(prerenderedHtml)
})

app.listen(3000)
```

```js:views/sample02.jsx
'use strict'

const React = require('react')
const { Component } = React

module.exports = class MyComponent extends Component {
  render() {
    return (
      <div>
        <h1>{this.props.message}</h1>
      </div>
    )
  }
}
```

変数は props として渡す

```js:sample03.js
'use strict'

const express = require('express')
const React = require('react')
const { renderToString } = require('react-dom/server')
const MyComponent = require('./views/sample03')

const app = express()

const htmlify = rootComponent => (
  `
  <html>
    <div id="app">${rootComponent}</div>
  </html>
  `
)

app.get('/', (req, res) => {
  const prerenderedContent = renderToString(React.createElement(MyComponent, {name: req.query.name || 'World'}))
  const prerenderedHtml = htmlify(prerenderedContent)
  res.send(prerenderedHtml)
})

app.listen(3000)
```

```js:views/sample03.jsx
'use strict'

const React = require('react')
const { Component } = React

module.exports = class MyComponent extends Component {
  render() {
    return (
      <div>
        <h1>Hello, {this.props.name}</h1>
      </div>
    )
  }
}
```

クエリパラメータも同様にサーバ側で処理し props にして渡す

## 3. React SSR と非同期処理

外部 API コールによるデータ処理をサーバ側で行いレンダリングしたいというケースも SSR ではあると考えられる

そのようなケースは以下のように、サーバ側でデータを取得し、グローバル変数 `DEFAULT_PROPS` に格納されるように HTML をレンダリングし、ブラウザ側のコードではこのグローバル変数を取得して Component に Props として渡す、という処理をする

ブラウザでロード時に同一データでレンダリングが走りますが、DOM ツリーに変更はないので実際の DOM 再描画は発生しない

具体的な実装は以下の通り

app04.jsx はフロントエンドのエントリーポイントとなる。Webpack や Parcel 等で依存ファイルを含んで `views/dist/entry04.js` にビルドする

```js:sample04.js
'use strict'

const express = require('express')
const fetch = require('isomorphic-fetch')
const React = require('react')
const { renderToString } = require('react-dom/server')
const path = require('path')
const MyComponent = require('./views/sample04')

const app = express()
app.use(express.static(path.join(__dirname, './views/dist')))

const htmlify = (rootComponent, defaultProps) => (
  `
  <html>
    <div id="app">${rootComponent}</div>
    <script>window.DEFAULT_PROPS = ${JSON.stringify(defaultProps)}</script>
    <script src="entry04.js"></script>
  </html>
  `
)

app.get('/', async (req, res) => {
  const response = await fetch('http://euxn-lazy-api.herokuapp.com')
  const json = await response.json()
  const defaultProps = { spentMs: json.spentMs }
  const prerenderedContent = renderToString(React.createElement(MyComponent, defaultProps))
  res.send(htmlify(prerenderedContent, defaultProps))
})

app.listen(3000)
```

```js:views/sample04.jsx
'use strict'

const React = require('react')
const { Component } = React

module.exports = class MyComponent extends Component {
  constructor(props) {
    super(props)
    this.state = { count: 1 }
  }

  render() {
    return (
      <div>
        <h1>Lazy api{'!'.repeat(this.state.count)} {this.props.spentMs} ms has spent.</h1>
        <button onClick={() => this.setState({count: this.state.count+1})}>💢</button>
      </div>
    )
  }
}
```

```js:views/entry04.jsx
'use strict'

import React from 'react'
import ReactDOM from 'react-dom'
import MyComponent from './sample04'

const defaultProps = window.DEFAULT_PROPS

ReactDOM.render(React.createElement(MyComponent, defaultProps), document.querySelector('#app'))
```

レスポンスに時間のかかる API コールを行うと、上の Express の例と同様にレンダリングの完了を待ってからレスポンスが返るため遅くなる

その間はイニシャルビューが返らないため、ここで実装されている React のカウンターも操作することができない

このような重い API のみフロントエンドでリクエストしようと以下のようにすると問題が発生する

```js:sample05.js
'use strict'

const express = require('express')
const React = require('react')
const { renderToString } = require('react-dom/server')
const path = require('path')
const MyComponent = require('./views/sample05')
const { initialState } = MyComponent

const app = express()
app.use(express.static(path.join(__dirname, './views/dist')))

const htmlify = rootComponent => (
  `
  <html>
    <div id="app">${rootComponent}</div>
    <script src="entry05.js"></script>
  </html>
  `
)

app.get('/', (req, res) => {
  const prerenderedContent = renderToString(React.createElement(MyComponent, { spentMs: 0 }))
  res.send(htmlify(prerenderedContent))
})

app.listen(3000)
```

```js:views/sample05.js
'use strict'

const React = require('react')
const { Component } = React

module.exports = class MyComponent extends Component {
  constructor(props) {
    super(props)
    this.state = { count: 1 }
  }

  render() {
    return (
      <div>
      <h1>Lazy API, but async{'♥️'.repeat(this.state.count)} {this.props.spentMs ? `${this.props.spentMs} ms has spent.` : 'Now loading...'}</h1>
      <button onClick={() => this.setState({count: this.state.count+1})}>♥️</button>
      </div>
    )
  }
}
```

```js:views/entry05.jsx
'use strict'

import React from 'react'
import ReactDOM from 'react-dom'
import MyComponent from './sample05'

const main = async () => {
  const response = await fetch('https://euxn-lazy-api.herokuapp.com')
  const json = await response.json()
  ReactDOM.render(React.createElement(MyComponent, json), document.querySelector('#app'))
}

main()
```

[実際に触ってみて](https://euxn-ssr-sample05.herokuapp.com/)欲しいのだが、最初の API の取得が完了し `ReactDOM#render` が走るまで React は有効になっていないので、ボタン操作が反応しない

これを解決するために、一旦ブラウザ側でサーバ側と同じデータ = 空の State でレンダリングし、非同期通信が完了した後に再度 `ReactDOM#render` を走らせる

```js:sample06.js
'use strict'

const express = require('express')
const React = require('react')
const { renderToString } = require('react-dom/server')
const path = require('path')
const MyComponent = require('./views/sample06')

const app = express()
app.use(express.static(path.join(__dirname, './views/dist')))

const htmlify = (rootComponent, defaultProps) => (
  `
  <html>
    <div id="app">${rootComponent}</div>
    <script>window.DEFAULT_PROPS = ${JSON.stringify(defaultProps)}</script>
    <script src="entry06.js"></script>
  </html>
  `
)

app.get('/', (req, res) => {
  const defaultProps = { spentMs: 0 }
  const prerenderedContent = renderToString(React.createElement(MyComponent, defaultProps))
  res.send(htmlify(prerenderedContent, defaultProps))
})

app.listen(3000)
```

```js:views/sample06.jsx
'use strict'

const React = require('react')
const { Component } = React

module.exports = class MyComponent extends Component {
  constructor(props) {
    super(props)
    this.state = { count: 1 }
  }

  render() {
    return (
      <div>
      <h1>Lazy API, but async{'♥️'.repeat(this.state.count)} {this.props.spentMs ? `${this.props.spentMs} ms has spent.` : 'Now loading...'}</h1>
      <button onClick={() => this.setState({count: this.state.count+1})}>♥️</button>
      </div>
    )
  }
}
```

```js:views/entry06.jsx
'use strict'

import React from 'react'
import ReactDOM from 'react-dom'
import MyComponent from './sample06'

const lazyApiCallAndRerender = async () => {
  const response = await fetch('https://euxn-lazy-api.herokuapp.com')
  const json = await response.json()
  ReactDOM.render(React.createElement(MyComponent, json), document.querySelector('#app'))
}

const defaultProps = window.DEFAULT_PROPS
ReactDOM.render(React.createElement(MyComponent, defaultProps), document.querySelector('#app'))
lazyApiCallAndRerender()
```

## 4. 簡単な SSR アプリを作る

例として Twitter の検索結果を表示するアプリを SSR で作る

イニシャルビューで直近 200 件のデータをレンダリングするため、このようなケースでは SSR によってパフォーマンス向上が期待できる

実装は以下の通り。主に sample04 と sapmle06 で紹介した方法を用いた

動作するものは[こちら](https://euxn-ssr-twitter.herokuapp.com/)

実際にコードを動かす際には、各自 [Twitter Developer Platform](https://developer.twitter.com/) から認証キーを取得し、環境変数にセットしてから実行する必要がある

(余談だが、 [direnv が便利](https://qiita.com/kompiro/items/5fc46089247a56243a62))

```js:sample-twitter.js
'use strict'

const express = require('express')
const fetch = require('isomorphic-fetch')
const React = require('react')
const { renderToString } = require('react-dom/server')
const path = require('path')
const Twit = require('twit')
const MyComponent = require('./views/sample-twitter')
const { initialState } = MyComponent

const app = express()
app.use(express.static(path.join(__dirname, './views/dist')))

const { consumer_key, consumer_secret, access_token, access_token_secret } = process.env
const client = new Twit({ consumer_key, consumer_secret, access_token, access_token_secret })

const htmlify = (rootComponent, defaultProps) => (
  `
  <html>
    <div id="app">${rootComponent}</div>
    <script>window.DEFAULT_PROPS = ${JSON.stringify(defaultProps)}</script>
    <script src="entry-twitter.js"></script>
  </html>
  `
)

app.get('/', async (req, res) => {
  const response = await fetch('http://localhost:3000/tweets')
  const tweets = await response.json()
  const prerenderedContent = renderToString(React.createElement(MyComponent, { tweets }))
  res.send(htmlify(prerenderedContent, { tweets }))
})

app.get('/tweets', async (req, res) => {
  const data = await client.get('search/tweets', {q: 'react', count: 200, since_id: req.query.since_id})
  const tweets = data.data.statuses.filter(s => `${s.id}` !== req.query.since_id)
  res.json(tweets)
})

app.listen(3000)
```

```js:views/sample-twitter.jsx
'use strict'

const React = require('react')
const { Component } = React

const Tweet = ({ user, text}, idx) => (
  <tr key={idx}>
    <th>@{user.screen_name}</th>
    <th>{text}</th>
  </tr>
)

module.exports = class MyComponent extends Component {
  constructor(props) {
    super(props)
  }

  render() {
    console.log('render')
    return (
      <table border="1">
        <tr>
          <th>Screen Name</th>
          <th>Tweet</th>
        </tr>
        { this.props.tweets.map(Tweet) }
      </table>
    )
  }
}
```

```js:views/entry-twitter.jsx
'use strict'

import React from 'react'
import ReactDOM from 'react-dom'
import fetch from 'isomorphic-fetch'
import MyComponent from './sample-twitter'

let tweets = window.DEFAULT_PROPS.tweets

const appendLatestTweet = async () => {
  const response = await fetch(`http://localhost:3000/tweets?since_id=${tweets[0].id}`)
  const nextTweets = await response.json()
  tweets = [...nextTweets, ...tweets]
  ReactDOM.render(React.createElement(MyComponent, { tweets }), document.querySelector('#app'))
}

setInterval(appendLatestTweet, 20000)

ReactDOM.render(React.createElement(MyComponent, { tweets }), document.querySelector('#app'))
```

## 5. より高度な SSR アプリを作るために

上記では Express から始まり React 単体での SSR を簡単に説明した

Redux を使う場合は、 Store をグローバル変数に配置しサーバからクライアントに渡す、という手法で実装できる

ReactRouter を使う場合はルーティングまわりが複雑になるが、ある程度は ReactRouter が提供する機能で実装できる(が、むずい)

Redux/ReactRouter での SSR については以下が参考になる

- [ReactJS : Server side rendering with router v4 & redux](https://crypt.codemancers.com/posts/2017-06-03-reactjs-server-side-rendering-with-router-v4-and-redux/)
- [jgliner/react-router-v4-redux-ssr](https://github.com/jgliner/react-router-v4-redux-ssr)
