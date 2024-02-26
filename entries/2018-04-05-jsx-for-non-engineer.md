---
title: "非 JS エンジニア向けの React (JSX) の簡単な説明"
date: 2018-04-05
---

## はじめに

いわゆる JS エンジニアではない方に、React で実装した箇所のデザインとかを触っていただくときに、最低限知ってれば良さそうな知識をまとめます。

### 説明すること

- JSX 記法について
- JS の埋め込みについて
- Component について
- StyledComponents について

### 説明しないこと

- Redux

## JSX 記法

- XML を JS の中に書くことで、JS 内に DOM を表現する記法
- XML であって HTML ではない
  - class ではなく className
  - 各種プロパティは `-` 区切りではなく `lowerCamelCase` を用いる
  - XML なのでタグは必ず閉じられる。`<br />` など
  - style の中は css ではなく JS の { key: value } を用いる
    - 数値系のものは基本的に px であり、単位を省略し number 型で書く
    - 例: `<div style={{ marginRight: 10 }}>`
      - 変数展開については以下でも説明する

## JS を展開する `{}` 記法

- `<button className={this.props.status}>` など
- ある変数が true の場合のみ、等は `&&` 演算子を用いる
  - `{isAuthenticated && <p>ようこそ</p>}`
- 条件分岐を書く場合は三項演算子を用いる場合が多い
  - `{isAuthenticated ? <p>ようこそ、{userName}さん</p> : <p>ようこそ、ゲストさん<p/>}`
  - JSX タグで囲わずに文字のみを表示したい場合は、 `''` で囲み、 JS の文字列として扱う
- `{}` 記法が使えるのはあくまで JSX 内のみ、単なる文字列内で変数展開したい場合は [template literal](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals) (`` `Hello ${name}` ``)を使用する
  - `` {isAuthenticated ? `ようこそ、${userName}さん` : 'ようこそ、ゲストさん'} ``
- 配列のループ処理なども、返り値が展開されるように書く
  - `{rooms.map(room => <Room key={room.id} name={room.name} />)}`
- Style 等、 Object を渡す箇所では `{{}}` と二重になる

## JSX を返す Component

- 状態を持つ Class か、状態を持たない(引数のみによって表示内容が決定する) Function で表す
- ClassComponent は `render()` の返り値を表示する

```jsx
class CounterButton extends.React.Component {
    constructor(props) {
        super(props)
        this.state = {
            clickCount = 0
        }
    }

    increment = () => this.setState({clickCount: this.state.clickCount + 1})

    render() {
        <div>
          <button onClick={this.increment}>{this.state.clickCount}</button>
        </div>
    }
}
```

- FunctionalComponent は関数の返り値を表示する

```jsx
const Room = (room) => (
  <tr>
    <td>{room.name}</td>
    <td>{room.floor}</td>
    <td>{room.price}</td>
    <td>{room.layout}</td>
    <td>{room.exposure}</td>
  </tr>
);
```

- FunctionalComponent は ClassComponent の中のループから呼び出されるよくある例

```jsx
class RoomList extends.React.Component {
    constructor(props) {
        super(props)
        this.state = {
            rooms: []
        }
    }

    componentWillMount() {
        fetch('api.example.com')
          .then(res => res.json())
          .then(json => this.setState(rooms: json.rooms))
    }

    render() {
        <table>
          <thead>
            <tr>
              <th>部屋名</th>
              <th>階</th>
              <th>価格</th>
              <th>間取り</th>
              <th>向き</th>
            </tr>
          </thead>
          <tbody>
            {this.state.rooms.map(room => <Room key={room.id} room={room} />)}
          </tbody>
        </table>
    }
}
```

- Component は基本的に 1 つの DOM node を返す必要がある
  - React v16 移行は JSX のみで使用できる `<> any dom nodes... </>` で囲うことができる
    - `<>` 以下の DOM node が並列して HTML に展開される
  - React v15 まででは div で囲うなどしていた

## StyledComponents を使用した CSS in JS

- CSS を JS の中に記載するというアプローチがある
  - CSS のスコープを JS 内に閉じることができる
  - 動的にプロパティが変化するアニメーション等では、 JS で Style を操作するよりも直感的
- React において代表的なものとして [StyledComponents](https://github.com/styled-components/styled-components)がある

  - JS の template literal を使用するため、素の css の記法が使用できる
    - 一部 scss 的な記法も使用できる
    - 変数は JS 側で保持し、 template literal 内で展開する形になる
  - スタイル適用済みの Component を生成できる

  ```
  styled.div`
      margin-right: 10px;
  `
  ```

  - 独自の Component にスタイルを適用する場合は以下のようにする

  ```
  styled(MyButton)`
      margin-right: 10px;
  `
  ```

  - 状態によって変わる場合は関数を使用する

  ```
  styled.button`
      color: ${status => status === 'danger' ? 'red' : 'white'}
  `
  ```

  - 細かいことは[公式ドキュメント](https://www.styled-components.com/docs/basics)を参照
