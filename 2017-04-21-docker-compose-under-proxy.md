---
title: "PROXY 環境下でdocker-compose を実行する"
date: 2017-04-21
---

社内PROXY の環境下でdocker-compose を実行する場合、コンテナの中にPROXY 情報が渡されず、コンテナ内部からインターネットに出れなくなってしまいます。
(たとえば、`go get` や`npm install` ができない。)
対処方法は主に以下の3つかと思われます。

1. `docker-compose.yml` 内に `environment` として環境変数を渡す。
2. `docker-compose run` 時に `-e` として環境変数を渡す。
3. `env_file` として環境変数の書かれたファイルを指定する。

## 1. `docker-compose.yml` 内に `environment` として環境変数を渡す。

```yaml:docker-compose.yml
golang:
  image: golang:1.8
  environment:
    HTTP_PROXY: http://proxy.example.com
    HTTPS_PROXY: http://proxy.example.com
```

## 2. `docker-compose run` 時に `-e` として環境変数を渡す。

`$ docker-compose run -e HTTP_PROXY=$HTTP_PROXY -e HTTPS_PROXY=$HTTPS_PROXY golang bash`

## 3. `env_file` として環境変数の書かれたファイルを指定する。

```yaml:docker-compose.yml
golang:
  image: golang:1.8
  env_file: .env
```

```bash:.env
HTTP_PROXY=$HTTP_PROXY
HTTPS_PROXY=$HTTPS_PROXY
```


## 比較

1 の方法だと、コマンド実行時にPROXY 情報を入力する必要がありませんが、コード上にPROXY 情報が含まれてしまいます。
例えばOSS のdocker-compose を実行する場合や、複数社で共有するリポジトリの場合、また単純にリポジトリに環境情報を含めたくない場合は使えません。

2 の方法だと、内部で必要とされる環境変数が増えるほどコマンドが長くなります。(ALL_PROXY やNO_PROXY が必要とされる場面など)
しかし、Makefile 等にコマンドを設定することで対処はできます。(利用者が環境変数に設定している前提にはなりますが)

3 の方法だと、リポジトリに含めず.env のみ配布すれば設定できます。

## 結論

3 が便利

## 参考
- [Docker(compose)使い始めてから.env系のライブラリを使わなくなってた | WEB EGG](http://leko.jp/archives/882)
