---
title: "golangで設定記述にTOMLを使う"
date: 2016-07-28
---

golang での設定記述言語は YAML の他に TOML も人気があるようです。

- [go-yaml/yaml](https://github.com/go-yaml/yaml) Star: 861
- [BurntSushi/toml](https://github.com/BurntSushi/toml) Star: 965

(2016/7/28 時点)

TOML は[dein.vim](https://github.com/Shougo/dein.vim)のプラグイン記述でも使われていますし、
YAML に比べシンプルかつ、toml ライブラリの方が親切そうなので、TOML を使用しています。

# 使い方

[TOML の仕様](https://github.com/toml-lang/toml)に沿って記述しますが、簡単な設定であればシンプルに記述できます。

```toml
[API]
port     = 8000
version  = "v1"
endpoint = "api.example.com"
debug    = true

```

golang のコード側では、コンフィグファイルに対応した struct を定義します。

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

toml ファイルに`[]`で指定した名称と、代入する構造体のメンバの名称は揃えます。
golang が CamelCase なので toml も CamelCase になります。頭文字は問われないようです。

おおもと(ここでは Config)以下の構造体の名称は TOML 側では記述されません。

# Array になるケース

テストケースのリクエストを TOML で書く場合等に Array を使いたくなると思います。
TOML は`[[]]`で Array 要素を記述できます。
例として検索を行う API のテストケースを記述すると以下のようになります。

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

基本は上記と同様に、TOML に記載する Array になる要素の名称と、おおもとの構造体のメンバの名称を揃えます。
この際、該当のメンバの型を、各要素の値に対応した構造体の Array にします。

実態は普通の構造体なので、tag 等も普通に使えます。
構造体をクエリストリングに変換する[google/go-querystring](https://github.com/google/go-querystring)の`url`タグも正常に動作します。

# 参考

toml については以下で詳しく説明されています。

- [GO と TOML](https://speakerdeck.com/cubicdaiya/gototoml)
