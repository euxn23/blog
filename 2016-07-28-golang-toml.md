---
title: "golangで設定記述にTOMLを使う"
date: 2016-07-28
---

golangでの設定記述言語はYAMLの他にTOMLも人気があるようです。

- [go-yaml/yaml](https://github.com/go-yaml/yaml) Star: 861
- [BurntSushi/toml](https://github.com/BurntSushi/toml) Star: 965

(2016/7/28時点)

TOMLは[dein.vim](https://github.com/Shougo/dein.vim)のプラグイン記述でも使われていますし、
YAMLに比べシンプルかつ、tomlライブラリの方が親切そうなので、TOMLを使用しています。

# 使い方
[TOMLの仕様](https://github.com/toml-lang/toml)に沿って記述しますが、簡単な設定であればシンプルに記述できます。

```toml
[API]
port     = 8000
version  = "v1"
endpoint = "api.example.com"
debug    = true

```

golangのコード側では、コンフィグファイルに対応したstructを定義します。

```go
package main

import (
    "fmt"
    "github.com/BurntSushi/toml"
)

type Config struct {
    API APIConfig
}

type APIConfig struct {
    Port     uint
    Version  string
    Endpoint string
    Debug    bool
}

var config Config
_, err := toml.DecodeFile("config.toml", &config)
if err != nil {
    // Error Handling
}

fmt.Println("port:", config.API.port) //=> 8000

```

tomlファイルに`[]`で指定した名称と、代入する構造体のメンバの名称は揃えます。
golangがCamelCaseなのでtomlもCamelCaseになります。頭文字は問われないようです。

おおもと(ここではConfig)以下の構造体の名称はTOML側では記述されません。

# Arrayになるケース
テストケースのリクエストをTOMLで書く場合等にArrayを使いたくなると思います。
TOMLは`[[]]`でArray要素を記述できます。
例として検索を行うAPIのテストケースを記述すると以下のようになります。

```go
package test

import (
    "github.com/BurntSushi/toml"
)

type TestCases struct {
    InvalidUserNameCases   []RequestParameter
    InvalidSearchWordCases []RequestParameter
}

type RequestParameter struct {
    UserName   string `url:"user_name"`
    SearchWord string `url:"search_word"`
}

var testCases TestCases
_, err := toml.DecodeFile("test_cases.toml", &testCases)
if err != nil {
    // Error Handling
}

```

```toml
[[InvalidUserNameCases]]
userName   = "$dollar"
searchWord = "searchWord"

[[InvalidUserNameCases]]
userName   = "%percent"
searchWord = "searchWord"


[[InvalidSearchWordCases]]
userName   = "user"
searchWord = ""

[[InvalidSearchWordCases]]
userName   = "user"
searchWord = "forbiddenWord"

```

基本は上記と同様に、TOMLに記載するArrayになる要素の名称と、おおもとの構造体のメンバの名称を揃えます。
この際、該当のメンバの型を、各要素の値に対応した構造体のArrayにします。

実態は普通の構造体なので、tag等も普通に使えます。
構造体をクエリストリングに変換する[google/go-querystring](https://github.com/google/go-querystring)の`url`タグも正常に動作します。


# 参考
tomlについては以下で詳しく説明されています。

- [GOとTOML](https://speakerdeck.com/cubicdaiya/gototoml)
