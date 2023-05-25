---
title: "InstagramのURLからjpg画像を取得する(認証不要)"
date: 2015-08-16
---

# 画像取得
Instagramに対してどうこうするのではなく、ただ単に画像を表示したいという場面は多いと思います。
そのような場合に、認証不要で元画像を取得することができるようになったようです。(最近？)


まず、以下の形式のURLがInstagramの投稿ページとして公開されています。

```
https://instagram.com/p/XXXXXXXXXX/
```

ここから画像自体を取得するために、以下のように変更します。

```
https://instagram.com/p/XXXXXXXXXX/media?size=m
```

パラメータsizeにt(thumbnail)、m(medium)、l(large)を指定することでそれぞれ必要な大きさの画像を取得できます。(デフォルトはm)

# 古い情報だと
少し古い情報だと認証してembedからurlを取得……という手順が必要だと書いてあります。
私は[instagram-ruby-gem][link-2]を使用して認証して……という手順を踏みましたが、InstagramのAPIバージョンにgemが対応できていないため正常に取得することができませんでした。
上の手順の場合APIリミットもないので、自身のサービスで画像を取得する場合は認証しない方がいいでしょう。

## 参考
- [Instagram Developer Documentation][link-1]
- [instagram-ruby-gem][link-2]


[link-1]:https://instagram.com/developer/embedding/
[link-2]:https://github.com/Instagram/instagram-ruby-gem
