---
title: "Mac の Touchbar の ESC をリマップする"
date: 2018-03-16
---

Mac の Touchbar 搭載モデルの ESC キーが打ちにくい等の理由で ESC を他のキーに当てている方は多いかと思います。
しかしその割り当て元になったキーが完全に不要なキーでない限り、 TouchBar の ESC に割り当てないとキーが足りなくなります。
普通に Karabiner-Element で `ESC <=> バッククォート` を設定したのですが、動かなかったため、対処法を調査しました。

## 結論

- Mac の通常キーボードと TouchBar は別キーボード扱い
- Devices タブの `No product name` が TouchBar 本体だが、デフォルトで(？)無効になっているのでチェックを入れる
- 対象デバイスを `No product name` に指定して　`ESC <=> バッククォート` を設定する

## 懸念事項

調べると TouchBar と conflict するので `No product name` を無効化しろという情報が出てきます。
現状、特に conflict は起きていないように見える(キーボードごとに適切にリマップ設定しているからだろうか)が、問題が発生する可能性があるのは懸念点です。
