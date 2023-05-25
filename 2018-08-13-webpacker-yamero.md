---
title: "Webpacker を辞めるべきとき、そうでないとき"
date: 2018-08-13
---

この記事は pixiv inside の [今日から簡単！Webpacker 完全脱出ガイド](https://inside.pixiv.blog/subal/4615) を受けての個人的な感想です。

上記の記事には概ね同意であるものの、脱出するべきときばかりでもないかと思ったので、自分の経験も踏まえて書きます。


## Webpacker を辞めるべきでない場合

**チームにフロントエンドをキャッチアップし続ける人がいない場合** です。

フロントエンドのビルドツール群をある程度理解し、ビルドの最適化等ができる場合、 webpack.config を書く場合は webpacker から抜ける方が良いと思われますが、

そこを対応するメンバーがいない場合や、そもそもフロントエンドの比重が重くない(ボタンにちょっと React 使いたいだけとか)場合には、 webpacker を使っても良いと思います。

ちょっとした React を使うだけの場合や、単に asset pipeline から脱却する程度であれば問題ないと考えられます。

(ただし css を脱却するメリットがあるかどうかは要検討)


## Webpacker を辞めるタイミングの指標

基本的に、いわゆる Rails 側の比重が高いプロジェクトでは webpacker を使った方が良いと考えます。

ただし、 **webpack の設定をカスタマイズして使う段階に来たら、素直に webpacker から脱却するべき** だと思います。

webpacker 状態でカスタマイズするリスクとしては、

- webpacker の独自 DSL で記述するのはメンテナンスコストが高く、情報が少ない
- webpack.config を使用すると一部設定が二重管理になってしまう
- webpack や plugin による新しい機能を試そうにも、 webpacker の依存バージョンにロックされてしまう

というところがあります。

DSL や ruby 側からの抽象化については、冒頭の記事に詳細に書いてあります。 @f_subal 氏の苦悩が伺えますね……


## Webpacker の中で Rails に必要なモノ

- 複数 entrypoint にハッシュ値を付与してビルドする設定(Manifest Plugin等)
- View Helper
- Assets Pipeline との統合

主に上記かと思います。


## Webpacker を辞めるために

### Rails に合わせた webpack.config

主に entry と plugin ですが、3つ方法があります。

- Webpacker の出力コードをコピペする
- `@rails/webpacker` の `environment.toWebpackConfig` から値を抜き取る
- `webpacker-pure-config` 等の必要な設定のみを抜き出したライブラリを使用する

継続的な webpack のバージョンアップに対応するには、 `@rails/webpacker` の beta チャンネルか、手前味噌ですが依存の極小な webpacker-pure-config 等を使うなどが良いかと思います。

(現場で webpacker-pure-config が動いているので、コントリビュートしてほしい)

使い方としては以下の感じで、 pure object を export しているだけなのでそれを参照するのみです。

```js
const { generate } = require('webpacker-pure-config')

const baseConfig = generate({
  extensions: ['.ts', '.tsx']
  rules: [
    {
      test: /.tsx?$/,
      exclude: /node_modules/,
      use: ['ts-loader']
    }
  ]
})

module.exports = {
  ...baseConfig,
  plugins: [
    ...baseConfig.plugins,
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV)
    })
  ]
}
```

### Helper の実装

冒頭の記事に詳しく書いてあります。Webpacker の実装も薄いので、Fork してライブラリ化してもいいと思います。

### Assets Pipeline との統合

Assets Pipeline 時に webpacker のビルドもしてくれていましたが、それがなくなるので、差し込む必要があります。

テスト前に自前ビルド、デプロイ前に自前ビルド、等でしょうか。


## まとめ

- フロントエンドとして独立できるほどの開発リソースがあれば脱却するもよし、なければ webpacker に乗っておいても良いのでは
- 細かな設定が必要になったタイミングで webpack 独立を検討しましょう
- Rails との境界面でライブラリや設定が必要になりますが、自前書きはなるべく避けたい気持ち

そもそも webpacker に移行していないプロジェクトではどうするのが良いんだ、とハードルが高くなりがちかもしれませんが、

ひとまずは webpacker に乗っておく方針で進める方が情報も多いし良いかと思います。脱 webpacker はそれほど重くなく後からでもできるので。

Assets Pipeline よりははるかにマトモに JS のエコシステムに乗ることができ、コードベースの整理・リファクタからのフロントエンドのパフォーマンス改善も行いやすくなります。

(たとえば、ESModules ベースにすることで、 global で生やしてる jQuery Plugin の存在を eslint / TypeScript で検知できるなど)

webpacker の導入に合わせてレガシー JS からの脱却でお困りの場合は、ぜひご意見・ご相談ください。
