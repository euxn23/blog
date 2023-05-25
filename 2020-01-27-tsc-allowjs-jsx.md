---
title: "tsc の allowJs で JSX をコンパイルするとどうなるのか試す"
date: 2020-01-27
---

## 結論

- arrowJs がある場合は .jsx? に JSX が含まれていてもコンパイルが通る
- jsx を有効にしていない場合、 JSX はそのまま出力される
- checkJs を有効にすると、 jsx オプションを有効にしていない場合は落ちる

https://github.com/euxn23/tsc-allowjs-jsx
