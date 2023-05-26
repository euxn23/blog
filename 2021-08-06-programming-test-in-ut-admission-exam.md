---
title: "東京大学 情報理工学系研究科 創造情報学専攻のプログラミング入試を受けてきた"
date: 2021-08-06
---

院試のプログラミング試験を受けてきました。
まだ筆記試験と面接が今月下旬にあり、結果は来月 6 日です。
試験の内容については過去問が出たころに詳細に書くので、本日は概要と感想を。

## 情報理工学系研究科 創造情報学専攻とは

- 情報理工学研究科とは情報理工学系の研究科で、学位は情報理工学
  - 計算機科学のみならず、情報を活用した幅広い専攻がある
  - 学際情報学府は社会学寄り？なように感じており、方向性は全然違うかと思われる。いわゆる CS っぽいのはこちら
- 創造情報学専攻はその中でもより幅広い分野を手掛ける専攻、らしい
  - 分野横断みたいなことが多い
  - 私が興味あるのは研究開発のための支援を目的とするソフトウェアに関してで、それもここ
  - 研究科の中では直接対応する学部が存在せず、修士課程で初めて研究室配属になる
    - ので、外部院試するには希望の研究室に入りやすいかも、と思っている
- 創造情報学専攻はプログラミング試験を選択できる(数学と排他)
  - (数学も勉強中だが)正直プログラミングのほうが自信があるのでこちらに
  - この専攻には以前から興味があったが、実際に受験する踏ん切りとしてはプログラミング試験があったというのが大きい
- 創造情報学専攻の筆記試験はコンピュータ科学全般に渡るような範囲が広めの試験問題が出る傾向にある
  - 論理回路やアルゴリズムなど基礎的なところから
  - セマフォ、 IPv6 など応用的なところまで

## 創造情報学専攻のプログラミング試験のレギュレーション

- パソコン持ち込み可能
  - インターネットには接続不可
  - PC に入っているものは使用可能
    - 事前にリファレンスを落としておくなどは可能
      - Kindle の本や pdf を見ていいかは不明
    - ライブラリも事前にインストールしておけば可能
      - コンパイラ/インタプリタあるいは開発補助ツール(linter 等)の都合だと思っていた
      - numpy とかを前提としたコードを書いて得点がもらえるかどうかは不明
    - 事前に実装したコード片を使用するのは可能
  - 任意の言語を使用可能
    - とはいえ自作言語とかはさすがにダメじゃないのかな
  - 回答を計算するためにプログラムを書き、結果のみを紙に記述する問題もある
    - 過去問でも年によってはプログラムだけの回もありそう
    - 上記の場合プログラムからの結果の出力形式は定められていないことになる
    - ファイル出力するプログラムを書くことも
  - USB フラッシュメモリで必要なデータを渡され、 USB にファイルを保存して提出する形式が多いよう
    - そうでない年もあるかもしれない
- プログラミング参考書 1 冊持込可能
- 試験問題数や時間は回によって異なってそう

## 問題の雰囲気、過去問

- 過去問はこちら https://www.i.u-tokyo.ac.jp/edu/course/ci/admission.shtml
- 競技プログラミングっぽすぎないがある程度アルゴリズムの知識が求められるような問題
- 部分的に数学の知識が必要な回もある
- オーダーがどうとか計算速度・メモリが制限される問題はなさそう
  - 言語不問にしている以上はそうかもしれない

## 準備したこと

- 開発環境の準備
  - インタプリタとして node.js v16.6.1
  - TypeScript で書いたので作業ディレクトリに package.json を作成し typescript を deps に
  - eslint を使いたかったのでガチガチにした eslintrc ファイルと依存ライブラリを devDeps に
  - テスト書くこともあるかと思い jest と ts-jest を devDeps に
  - **なんとここまでしておいて、 ts-node のインストールを忘れてしまう大失態**
- リファレンスの準備
  - MDN と node.js のドキュメントをローカルにダウンロード
    - 負荷にならないように取得しました
    - これらをローカルでホストするための http-server をグローバルインストール
- 予備機の準備
  - 万が一のことがあるので……
  - Windows10 + WSL2 + Ubuntu で https://github.com/euxn23/dotfiles を展開して make しただけの環境
    - 一応 make で zsh まわりや asdf 周りが入るので、最新の node.js や ripgrep なども入った
    - resilio sync で上記準備したコードの同期
- 入出力周りのコード
  - 標準入力取るコードとか
  - child_process.spawn を Promise 返すようにしたコードとか
  - 具体的なコードは以下の通り。 [gist にも上げてます](https://gist.github.com/euxn23/2d276ff01711fbecb5f52a330205fa67)

```typescript
import { exec, spawn, SpawnOptionsWithoutStdio } from "child_process";
import { createInterface } from "readline";
import { promisify } from "util";

process.stdin.setEncoding("utf8");

export const execAsync = promisify(exec);

export const spawnAsync = async (
  command: string,
  option?: SpawnOptionsWithoutStdio
) =>
  new Promise((resolve, reject) => {
    const _process = spawn(command, option);

    if (_process.stdout === null) {
      return reject(new Error("stdout is not defined"));
    }
    if (_process.stderr === null) {
      return reject(new Error("stderr is not defined"));
    }
    _process.stderr.pipe(process.stderr);
    _process.stdout.pipe(process.stdout);
    _process.on("error", (err) => {
      return reject(err);
    });
    _process.on("disconnect", () => {
      return reject(new Error("disconnected"));
    });
    _process.on("message", (message) => {
      console.log(message);
    });
    _process.on("exit", (code) => {
      return resolve(code);
    });
    _process.on("close", (code) => {
      return resolve(code);
    });
  });

export const scan = async (): Promise<string> => {
  const _buffers = [];

  for await (const chunk of process.stdin) {
    _buffers.push(chunk);
  }
  const buffer = Buffer.concat(_buffers);

  return buffer.toString();
};

export const scan_ = async (): Promise<string[]> =>
  new Promise((resolve) => {
    const lines: string[] = [];
    const reader = createInterface({
      input: process.stdin,
    });

    reader.on("line", (line) => {
      lines.push(line);
    });
    reader.on("close", () => {
      resolve(lines);
    });
  });
```

- アルゴリズムの学習
  - 以下の本を読んだ
    - [プログラミングコンテスト攻略のためのアルゴリズムとデータ構造](https://www.amazon.co.jp/%E3%83%97%E3%83%AD%E3%82%B0%E3%83%A9%E3%83%9F%E3%83%B3%E3%82%B0%E3%82%B3%E3%83%B3%E3%83%86%E3%82%B9%E3%83%88%E6%94%BB%E7%95%A5%E3%81%AE%E3%81%9F%E3%82%81%E3%81%AE%E3%82%A2%E3%83%AB%E3%82%B4%E3%83%AA%E3%82%BA%E3%83%A0%E3%81%A8%E3%83%87%E3%83%BC%E3%82%BF%E6%A7%8B%E9%80%A0-%E6%B8%A1%E9%83%A8-%E6%9C%89%E9%9A%86-ebook/dp/B00U5MVXZO/)
      - 主にデータ構造やソート、探索など
      - 図解がありわかりやすい
      - 初心者向け、らしい(ほんとか？)
      - C++
    - [プログラミングコンテストチャレンジブック [第 2 版]　～問題解決のアルゴリズム活用力とコーディングテクニックを鍛える～](https://www.amazon.co.jp/dp/B00CY9256C)
      - グラフと範囲とかなんとか
      - 結構難し目の問題まで
      - 読んだけど理解しきれなかった
      - C++
    - [問題解決力を鍛える！アルゴリズムとデータ構造](https://www.amazon.co.jp/dp/B08PV83L3N)
      - 上記 2 冊の間かなーという感じの難易度
      - 図解がありわかりやすい
      - サンプルコードが github で公開されている
      - C++
- 過去問
  - さらっと全部に目は通した
  - 真面目に解いたのは 1 年分だけ……
    - 毎回傾向が違いすぎて、過去問解くよりもアルゴリズム勉強したほうがいいかな？って思ってた
    - その蟻本も理解し切れてませんが……

## 準備しておけばよかったこと

- README
  - 実行環境、インタプリタのバージョンや実行しているマシンの OS バージョン、 CPU 等
  - typescript を使ったので、コンパイルの前提条件については先に文章を書いておけばよかった
- logger
  - デバッグ用に出力するのと本実行用に出力するログレベルを分けたいので、ロガーをある程度自作しておくべきだった
    - 落としてきたライブラリを前提として良いかわからないため、あくまで自作
    - DEBUG=true とかでデバッグログ出るとかかなあ
- **ts-node**
  - それはそう
- 動く時計
  - 太陽光電池なのですが、電池切れていて試験中にも回復しなかった、ただの置物だった
- 作業用ディレクトリ
  - 上記開発環境だけでなく、提出物を用意するディレクトリや、 USB から受け取ったデータを保存しておくディレクトリを事前に定義しておくとよかった
  - USB に保存するのをすぐできるようにコマンドを用意しておくともっと便利そう
- バックアップ用ディレクトリ
  - USB から取得したデータを紛失しないようにバックアップ用のディレクトリを(作業領域とは別に)用意しておくべきだった

## 感想

- 時間足りねえーーーーーー
  - 問題はそこまで難しくなかったのでは？って感じなので、純粋な実装速度で差がついてそう
  - プロダクト開発でゴリゴリ書いてたのが生きたかも
    - リファレンスも参考書も型定義も一回も見ないで済んだのは長年 JS/TS やってた実りを感じる
  - とはいえ全部解けず終い。解けたところは合ってる自信はあるが……
    - 回答記述できたのが 75% といったところなので、最大でも 75% はじまりなのはつらい……
    - が、みんな全部解けたのだろうか……？時間足りなくね……？
- ねっむ
  - 前日はちゃんと寝ましょう
