---
title: "Axios より fetch の方が良いと思う"
date: 2024-03-18
---

Axios は status code が 4xx 、 5xx 系の際に勝手に throw するのがあまり好きではなかったが、 そもそも [throw を極力使わないようにする neverthrow との相性が悪い](https://zenn.dev/euxn23/articles/505fd9297eb2dc#%E4%BE%8B%E5%A4%96%E3%82%92-throw-%E3%81%99%E3%82%8B-axios-%E3%81%A8%E7%9B%B8%E6%80%A7%E3%81%8C%E6%82%AA%E3%81%84)のは決定的な違いではあると思う。

Axios でも [validateStatus](https://axios-http.com/docs/handling_errors) 等で throw しないようにできるが、そもそも特別な理由がなければ Axios を採用しなくても良いのでは……。

とはいえ、 Node.js (undici) では response.body を使用しないとメモリリークするなど不安定な挙動があったり、 [](https://twitter.com/azu_re/status/1769339338985533935)型の問題や内部的に同値でも class が違うなどにより特定のライブラリでうまく動作しない(AWS SDK で踏んだ)などがあるので、一概に Node.js でも fetch を使うべきかというとそこはケースバイケースであると思う。
S3 に stream で pipe したい場合は Axios の方が変なものを踏まないということもある。
