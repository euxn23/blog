---
title: "6 年愛用し続けたWebStorm から VSCode に以降した感想"
date: 2020-07-16
---

移行のモチベーション

- WebStorm で補完され切らない箇所がある
  - React.ExoticForwardRef が JSX として補完されない
  - 型パラメータによる string 制約付きの関数呼び出し時に候補補完が出ない
- キーボードショートカットが多すぎるため、 Windows / Mac / Linux 全対応をしていたら設定が崩壊した
- TS Server が壊れがち
  - 都度 reload する必要があったがこれも長い
- 起動が遅い
  - 特に小さいプロジェクトをちょちょっと開くときにロードが長いのが気になる
- WSL2 Integration → 現在は WebStorm も対応したため、要因としては小さくなった
  現在は解消されている懸念点

WebStorm

- WSL2 Integration
  - Node interpriter に WSL2 のものが指定できる
  - ファイルの変更検知のたびにフォルダごと全部 sync するのでタブが閉じられる、みたいなことがなくなった

VSCode

- 設定の sync が公式サポートされた
  - Extension は微妙だった
    WebStorm の優れている点
- 1 ショートカットから複数アクションに分岐できる
  - Cmd + B から Definition に飛ぶか TypeDefinition に飛ぶか選べるなど
- コードをペーストしたとき自動で import 文を生成してくれる
- ファイルのリネーム時にファイル名ベースで変更を伝播してくれる
- localhistory の信頼性が非常に高い
  - 何か間違えた操作をしても(.idea を飛ばさない限り)ほぼ必ず復旧できる
- VimKeybind Extendion の完成度が高い(VSCode Vim は history が別だし Visual Mode がよく壊れる)

VSCode の優れている点

- reload が早い
  - 何かあったときとりあえず reload できる
  - 画面表示が早いだけで Extension の読み込みやエラーハイライトは遅延しているので、着手できるようになるまではそこそこかかる、が WebStorm よりは早い

VSCode の微妙な点

- QuickFix での import 補完が遅い
- エラーハイライトが全体的に微妙
  - missing import も unused vars (eslint) も type error も同じ色
  - コードを書き換えたあとのハイライト反映が遅い
  - たまにエラーハイライトがバグって消えなくなることがある(reload するとなおる)
- 閉じタグの自動追従 Extension がたまにバカなことがあり、想定外の箇所のタグが書き換わることがある
- loading の表示がない(目立たないだけ？)ため、補完がいつ効くようになるのかわからない
