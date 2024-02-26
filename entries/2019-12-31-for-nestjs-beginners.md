---
title: "これから NestJS をはじめようとしている方へ"
date: 2019-12-31
---

この記事は [NestJS アドベントカレンダー 2019](https://qiita.com/advent-calendar/2019/nestjs) の 25 日目の枠です。

## はじめに

NestJS の知名度は 2019 年を通して上昇したように感じられますが、まだまだ日本語情報が少ないという思いからこのアドベントカレンダーを開始しました。

まず、 NestJS とは何か、どういうユースケースにマッチするか、という紹介については以下のスライドにまとまっています。

What is NestJS? / @potato4d
[https://speakerdeck.com/potato4d/what-is-nestjs-number-nestjs-meetup](https://speakerdeck.com/potato4d/what-is-nestjs-number-nestjs-meetup)

次に 1 日目 〜 7 日目では、 NestJS を触ってみてアプリケーションを作るまでの具体的な作法を、コードを交えて紹介しています。
8 日目以降は NestJS を使っていて当たりがちなつまづきポイントなど、1 記事完結の tips をテーマとして構成しました。

以下では、 NestJS に対して思われがちと考えられる疑問について回答をします。私の主観も入っている箇所はありますが、 NestJS を選定する際の参考にしてみてください。

## NestJS って Angular っぽくない？ / Angular やってないと分からなくない？

NestJS が Angular の影響を受けている側面が大きいことは否定しません、 Angular 経験者の方が馴染み易いとは思います。
しかし、 Angular の経験者向け/経験者でないと難しい、ということは一切ありません。
特に Angular に似ている部分としては Module と DI 、 Decorator かと思いますが、このうち DI と Decorator に関しては TypeScript や Java 等のバックエンドフレームワークでの開発を行なった方であれば、経験している方も多いかと思います。
Module についても、 JavaScript の Module システムのスコープが広がりすぎてしまうものを厳密に定義し、 DI に役立てている程度のものだという理解をしておけば基本的には問題ありません。
Module と DI については [NestJS の Module と DI を理解する](https://qiita.com/euxn23/items/acce35485feed5badf4b) を読んでいただければ、理解の助けになるのではないかと思います。

## NestJS ってデカくない？

Express 比では相当に大きく感じますが、上記のスライドにある通り、 Express のみで効率的な開発を維持するには現実的には制約が多いです。
得に、 Express には定められたアーキテクチャが存在しないため、アーキテクトとなる開発者がチームを離脱した際に路頭に迷うという話も聞きます。
上記で Angular の経験が無くても良いという断りをした上での引用ですが、 [Angular での開発を快適に進めるために知っておきたいこと](https://qiita.com/okunokentaro/items/503ab7a4c7601b564de0) で [100 点か 50 点か、それより全員 80 点を](https://qiita.com/okunokentaro/items/503ab7a4c7601b564de0#100%E7%82%B9%E3%81%8B50%E7%82%B9%E3%81%8B%E3%81%9D%E3%82%8C%E3%82%88%E3%82%8A%E5%85%A8%E5%93%A180%E7%82%B9%E3%82%92) と仰っているのは NestJS にも当てはまる考え方であり、フレームワークのもたらす恩恵というものが自分たちにとって有益であるかどうか、ということを軸に採用を判断するのが良いと思います。

また、バックエンドフレームワークとしては現代の多様化するフロントエンドやデータベースに適する形であり、 UI 層と永続化層を内包していないため、任せられる責務は実は限定的であります。

## Swagger でのドキュメント生成って本当にいいの？

手でドキュメントをメンテナンスされるのが正しい情報が保たれるとは思いますが、メンテナンスされないドキュメントが残るよりは、自動生成で拙くてもコードに距離が近い場所でメンテナンスされるドキュメントがある方が健全なプロジェクトだとは思います。
Swagger については [NestJS の @nestjs/swagger でコントローラーから Open API(Swagger) の定義書を生成する](https://qiita.com/odanado/items/60456ab3388f834dc9ca) と、以下のスライドが参考になると思います。

NestJS アプリケーションから Swagger を自動生成する / @euxn23

[https://speakerdeck.com/euxn23/nestjs-meetup-tokyo-01](https://speakerdeck.com/euxn23/nestjs-meetup-tokyo-01)

## NestJS って遅くない？

まず、バックエンドアプリケーションの遅さの性質としては大きく分けて 2 つあります。

- アプリケーションの起動速度が遅い
- レスポンス速度が遅い

Express をベースとしたアプリケーションと比較した際に、アプリケーションの起動速度の遅さは目立つかもしれません。それゆえ、 firebase functions や lambda で使用するのには向いているとは言えませんが、そもそも FaaS を使用する場合は NestJS は選択肢に上がらないと思います。
レスポンス速度については、 Express 比でわずかに遅いところはありますが、そもそも Express がいわゆる LL としては十分に速すぎるので、実用上ほぼほぼ問題のない速度でレスポンスが返ります。
どちらかというと永続化層の方がネックになるかと思われますが、それでもアプリケーション層に不安が残る場合は想定されるリクエスト数に対してのパフォーマンステストを行なって判断するのが良いと思います。

## NestJS と ClassValidator / TypeORM って一緒に使わないといけないの？

TypeScript であり、 Decorator をベースとした記述が可能という点を除いて、特に関連性のあるものではありません。
必要に応じて採用したりしなかったりするのが良いと思います。

## Decorator が不安

まず Decorator が内部で何を行なっているかについては [TypeScript の Decorator と継承](https://qiita.com/euxn23/items/987f359eeb6a6bd45fad) で説明しています。
Decorator の仕様自体が不安定な中で先行実装があることについて不安はあるかと思いますが、 TypeScript のビルドが後方互換を保つ限りは動作しなくなるということはないでしょう。
Parameter Decorator で副作用を起こして動作する Class Validator 等のライブラリへの不安はあるかと思いますが、 NestJS を通常の範囲で使う上では、 Parameter Decorator は (Swagger 等の Production に不要なものを除いて) 不要なので、ここは懸念する必要はありません。
また、 Decorator を用いるライブラリを組み合わせる場合に Decorator Hell になることへの懸念については、 [TypeScript の Decorator Hell を解消する](https://qiita.com/euxn23/items/f018574e0594b0b6c943) で 1 つの解決へのアプローチを書いているので、ご参考にしてください。

## サーバサイド TypeScript に不安がある

フロントエンドでの webpack を使用したビルドとは異なり不安になる箇所もあるかと思いますが、 NestJS ではプロダクションのビルドまでサポートしています。
また、 tsconfig-paths がバックエンドで使えない、という経験があるかと思いますが [tsconfig の path alias 解決に tsconfig-paths/register を node で使う方法と TS 依存の分離方法](https://qiita.com/euxn23/items/bf462b2fb8e2ce1f203c) で解決方法を紹介していますのでご参考ください。

## まとめ

以上で NestJS の概要および疑問点のご説明をしました。他にも NestJS についても疑問点がある場合は、 [NestJS Japan Users Group の Discord](https://discord.gg/nB9MadZ) でお気軽にお聞きください。
また、現在 [日本語ドキュメントについても準備を進めている](https://gist.github.com/potato4d/1d12ca8aa9f1d51cee9aeb35b6be062d)段階です。
本家の公式ドキュメントの情報量が膨大で、基本的なことはそちらにも書いてあるため、日本語化することによってより多くの方に届けられればと思っています。

## 謝辞

この度 NestJS Japan Users Group としても活動を開始して、当初私と @potato4d の 2 名だけで書く予定だったこのアドベントカレンダーも、何件も書いて頂きました。ご協力頂いたみなさまありがとうございました。
今後も NestJS が必要な人に正しく届くよう、情報発信を継続して行なっていきたいと思いますので、是非ご協力頂ければと思います。
