---
title: "Next.js のインフラ要件と選択肢"
date: 2020-12-24
---

この記事は [Next.js アドベンドカレンダー 2020](https://qiita.com/advent-calendar/2020/nextjs)の 24 日目かつ [Japan Digital Design アドベントカレンダー](https://adventar.org/calendars/5160)の 24 日目です。
Next.js をデプロイする上で、 Vercel 以外のインフラを選択する際、どのような要件が必要かを以下に整理します。
SSG/SSR/ISR のどれを選択するべきかというのはアプリケーション性質に大きく依存しますが、インフラ要件も大きな要素であるため、慎重に選択するのが良いかと思います。

## SSG の場合

### 要件

Static Site の配信ができれば十分です。
デプロイ時のビルド環境として CI を使う他、 GitHub の push を hook してビルドが走るサービスを使用するのも良いでしょう。
SSG に比べ、 そこそこ大きな静的リソースを配信するため、 CDN を経由するのがベターです。CDN の選定の場合は対象とする地域のエッジロケーションが存在するか、に注意する必要があります。

### 具体的なプラットフォーム

- AWS
  - Amazon S3
  - AWS Amplify Console
- Google Cloud
  - Google Cloud Storage
  - firebase hosting
- その他
  - Netlify
  - GitHub Pages

## SSR の場合

### 要件

Node.js を実行する必要があるため、コンピューティングリソースが必要です。
具体的には IaaS やコンテナ、 Google App Engine 等が十分に Node.js が動く環境であると言えるでしょう。
(lambda や cloud functions 等の FaaS では、 Node.js のプロセスがポートを listen し、インバウンドのリクエストに応答できるという要件を満たせないため、基本的には十分に動作しないと思ってください。)
また、上記同様、 静的リソースの配信には CDN を使用するのがベターであるため、可能であれば、 CDN と組み合わせての管理をできるプラットフォームを選定するのが良いでしょう。

### 具体的なプラットフォーム

- AWS
  - AWS Amplify
- Google Cloud
  - Google App Engine
  - Cloud Run

## ISR の場合

### 要件

本題です。 Vercel で動作させる場合は必ずしも理解しなくて良いのですが、現状別プラットフォームで ISR を正しく行うためには ISR の挙動を理解する必要があります。
ISR の本体は、 SSG された HTML をキャッシュし、ユーザのアクセス応じて適切に生成・配信・破棄を行う機能です。
単に IaaS やコンテナにデプロイしただけでは、CDN の設定をすればキャッシュはされるものの、パージが ISR の想定通りには動きません。
コンピューティングリソース内部にキャッシュする(ステートフルにする)場合はその限りではありませんが、 CDN を通さない分のパフォーマンス影響が発生しますし、これは ISR とは異なるものとなります。
lambda や cloud functions ではもはやまともに動かないでしょう。
Vercel の場合はデプロイ時に edge でのワーカーが用意されているかのように見えますが、他のプラットフォームで実現する場合、同等の機能が必要があります。
たとえば AWS の場合、 現状の CloudFront(Amplify Console 含む) では相当する機能がないため、 lambda@edge で動作するコードを用意しなくてはなりません。
つまり、 IaaS / コンテナ + 静的ホスティング + CDN に加え、 edge でのコンピューティングリソースの準備が必要となります。
(これを Out of the Box で使えるのが Vercel の競合に対する優位性かと思います。)
参考までに、 Next.js 本体ではありませんが、 Cloudflare edge worker での動作を前提とすることによりキャッシュコントロールの自由度を高めた flareact というフレームワークが存在します。しかし edge コンピューティングについての十分な知識がないと十分に動かすことは難しいでしょう。

https://github.com/flareact/flareact

https://blog.cloudflare.com/rendering-react-on-the-edge-with-flareact-and-cloudflare-workers/

### 具体的なプラットフォーム

- AWS Amplify + lambda@edge

## 総括

### SSR / ISR するなら Vercel を使いましょう

ISR 以外であれば様々なプラットフォームで動作するため、各社・プロジェクトの利用しているクラウドベンダに沿ったプラットフォームを選定することでも問題なく動作します。
しかし ISR を前提とするのであれば、 edge コンピューティングを前提とする必要があります。運用を見据えると現実的でないため、 Vercel を利用しましょう。
