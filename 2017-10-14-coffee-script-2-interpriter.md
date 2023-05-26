---
title: "coffeescript2 インタプリタのtranspile オプションでrequire されたmodule に対して適用されない問題が既にmaster にマージされていた"
date: 2017-10-14
---

CoffeeScript2 では、初代と同様にインタプリタとしても機能する。

CoffeeScript の仕様として ES Modules (import/export) や JSX をサポートしているものの、それはコンパイルを通すだけであり、実行時には環境に解釈される(=現状では動かない)というものとなっている。

(ので、サポートというか、シンタックスエラーとして扱わずそのまま JS にしてくれている、くらいの感覚。)

そこで CoffeeScript は Babel の使用をサポートしており、 `.babelrc` を配置して `--transpile` オプションを付与して実行するだけで、

Babel でのトランスパイルまで一度に行える。

サーバサイドのプログラムを `babel-node` や `ts-node` のように、coffee のインタプリタで動作させるにあたり、上記を使用して `import/export` を使用できないかと試みた。

※[teppeis さんのブログ](http://teppeis.hatenablog.com/entry/2017/08/es-modules-in-nodejs)でも触れられていますが、ES Modules は今になっても安定していない(named import が使えなくなったり)ので、使っているのはカッコイイという理由だけです。長く使うコードでもないし。

しかし、実際には実行時にコマンドに渡したルートファイルのみ Babel でトランスパイルされるため、import されているファイルはトランスパイルされず、import/export の部分で Syntax Error が発生するという状態になっていました。

とりあえず[issue に書いた](https://github.com/jashkenas/coffeescript/issues/4745)ところ、なんと既に master には merge されていたとのことで、手元で master で試して動作確認できました。

次のリリースには乗りそうなので安心ですね。めでたしめでたし。

CoffeeScript2、もともと Coffee 好きなので書いていた楽しい感じなのだけど、Flow の Type Annotation だけはどうにかならなかったのかなあ……。
