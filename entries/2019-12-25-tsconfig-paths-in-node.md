---
title: "tsconfig の path alias 解決に tsconfig-pathsregister を node で使う方法と TS 依存の分離方法"
date: 2019-12-25
---

この記事は [TypeScript アドベントカレンダー 2019](https://qiita.com/advent-calendar/2019/typescript) の 24 日目です。

## はじめに

Webpack 等でビルドせずに node で実行する際に tsconfig の path alias が解決されなくて困る方も多いと思います。
一方 ts-node じゃなくても tsconfig-paths/register で path alias が解決できることは意外と知られておらず、実は `$ node -r tsconfig-paths/register dist/main.js` で解決します。
しかし、 Production で動く node に TypeScript 由来の何かに依存しているのは怖いということもあるので、 tsconfig-paths の中身を読んだので何をしているかを説明します。

## サンプルプロジェクト構成

以下の構成で実行します。サンプルリポジトリは以下になります。

https://github.com/euxn23/how-tsconfig-paths-work-sample

```bash
$ tree .
.
├── package.json
├── src
│   ├── main.ts
│   └── path
│       └── to
│           └── nested
│               └── lib
│                   └── hello.ts
├── tsconfig.json
└── yarn.lock
```

```json:tsconfig.json
{
  "compilerOptions": {
    "target": "es2018",
    "module": "commonjs",
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "moduleResolution": "node",
    "baseUrl": "./",
    "typeRoots": ["./node_modules/@types"],
    "types": ["node"],
    "allowSyntheticDefaultImports": true,
    "esModuleInterop": true,
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true,
    "resolveJsonModule": true,
    "paths": {
      "@lib/*": ["src/path/to/nested/lib/*", "dist/path/to/nested/lib/*"]
    }
  },
  "include": [
    "src/**/*.ts*"
  ],
  "exclude": [
    "node_modules",
    "dist"
  ]
}
```

```typescript:main.ts
import { sayHello } from '@lib/hello'

sayHello();
```

```typescript:hello.ts
export function sayHello() {
  console.log('Hello tsconfig-paths demo')
}
```

## ts-node / node で実行する

ts-node で実行する場合でも tsconfig-paths が必要なので、以下のように実行します。

```bash
$ yarn ts-node -r tsconfig-paths/register src/main.ts
```

node で実行する場合も同様です。

```bash
$ yarn tsc
$ node -r tsconfig-paths/register dist/main.js
```

ここでポイントとなるのは、 tsconfig の baseUrl と paths の設定です。
tsconfig-paths/register の path 解決は baseUrl を元に解決されます。
そのため、 baseUrl が `./src` の場合、この config をそのまま使って上記のように node で実行すると、 src/path/to/nested/lib/hello.ts を見に行ってしまい、 `.js` でないので `Error: Cannot find module '@lib/hello'` となってしまいます。

そのために、 path の設定に `src` と `dist` の両方を設定しています。(なお、 bash の正規表現 `{src,dist}` は使えないようでした。)

## tsconfig-paths/register は ts に依存しないのか

簡単な動作確認として、typescript, ts-node 等を devDependencies に、 tsconfig-paths/register のみ dependencies に定義し、動作を確認します。
yarn install --production するため、事前にビルドをしておきます。

```json:package.json
  "devDependencies": {
    "@types/node": "^13.1.0",
    "ts-node": "^8.5.4",
    "typescript": "^3.7.4"
  },
  "dependencies": {
    "tsconfig-paths": "^3.9.0"
  }
```

```bash
$ rm -rf dist && yarn tsc
$ rm -rf node_modules
$ yarn install --production
```

依存ツリーを確認し、 typescript や ts-node が含まれていないことを確認します。

```bash
$ yarn list --production
yarn list v1.21.1
├─ @types/json5@0.0.29
├─ json5@1.0.1
│  └─ minimist@^1.2.0
├─ minimist@1.2.0
├─ strip-bom@3.0.0
└─ tsconfig-paths@3.9.0
   ├─ @types/json5@^0.0.29
   ├─ json5@^1.0.1
   ├─ minimist@^1.2.0
   └─ strip-bom@^3.0.0
```

この状態で node で実行します。

```bash
$ node -r tsconfig-paths/register dist/main.js
Hello tsconfig-paths demo
```

動作することから、実行時に typescript に依存していないだろうことが分かります。
念の為以下で確認します。

## tsconfig-paths/register が何をしているのか実装を確認する

該当関数は以下になります。

https://github.com/dividab/tsconfig-paths/blob/master/src/register.ts#L52

```typescript:src/register.ts
export function register(explicitParams: ExplicitParams): () => void {
  const configLoaderResult = configLoader({
    cwd: options.cwd,
    explicitParams
  });

  if (configLoaderResult.resultType === "failed") {
    console.warn(
      `${configLoaderResult.message}. tsconfig-paths will be skipped`
    );

    return noOp;
  }

  const matchPath = createMatchPath(
    configLoaderResult.absoluteBaseUrl,
    configLoaderResult.paths,
    configLoaderResult.mainFields,
    configLoaderResult.addMatchAll
  );

  // Patch node's module loading
  // tslint:disable-next-line:no-require-imports variable-name
  const Module = require("module");
  const originalResolveFilename = Module._resolveFilename;
  const coreModules = getCoreModules(Module.builtinModules);
  // tslint:disable-next-line:no-any
  Module._resolveFilename = function(request: string, _parent: any): string {
    const isCoreModule = coreModules.hasOwnProperty(request);
    if (!isCoreModule) {
      const found = matchPath(request);
      if (found) {
        const modifiedArguments = [found, ...[].slice.call(arguments, 1)]; // Passes all arguments. Even those that is not specified above.
        // tslint:disable-next-line:no-invalid-this
        return originalResolveFilename.apply(this, modifiedArguments);
      }
    }
    // tslint:disable-next-line:no-invalid-this
    return originalResolveFilename.apply(this, arguments);
  };

  return () => {
    // Return node's module loading to original state.
    Module._resolveFilename = originalResolveFilename;
  };
}
```

この実装を読んでわかる通り、 TypeScript 文脈のものは何も出てきておらず、 node の `module` を拡張しているのみのようです。

また、上記の通り typescript / ts-node は dependencies にも peerDependencies にも入っていません。

## 実行時コンテキストを tsconfig.json に依存させたくない

上記で実行時に typescript への依存がないことは分かりましたが、 tsconfig.json への依存さえも無くしたいケースもあるかと思います。
単純に node で実行するのに tsconfig.json の変更に影響されることを嫌う場合や、 Firebase Functions などで tsconfig.json へのファイル参照を行いたくない場合などです。
これの解決のため、2 つの方法を紹介します。

1. tsconfig-paths の register にオプション引数を渡す

README の [Bootstraping with explicit params](https://github.com/dividab/tsconfig-paths#bootstraping-with-explicit-params) にも紹介がありますが、
明示的にオプションを渡して以下のように実行できます。

```javascript:tsconfig-paths-bootstrap.js
const tsConfigPaths = require("tsconfig-paths");

const baseUrl = "./";
const paths = {
  "@lib/*": ["dist/path/to/nested/lib/*"]
}

tsConfigPaths.register({
  baseUrl,
  paths
});
```

```bash
$ node -r ./tsconfig-paths-bootstrap.js main.js
Hello tsconfig-paths demo
```

2. module-alias を使う

tsconfig-paths/register と似たことをしてくれる [module-alias](https://www.npmjs.com/package/module-alias) というライブラリがあります。
こちらはそもそもプロジェクトに TypeScript を導入していなくても使えるものです。

```json:package.json
  "_moduleAliases": {
    "@lib/hello":
      "dist/path/to/nested/lib/hello.js"
  }
```

```bash
$ node -r module-alias/register dist/main.js
```

ただしこちらは alias に Array / ワイルドカードが指定できないという制約があります。
どうしても tsconfig-paths を使いたくない、という場合は、必要に応じて検討してください。

## おわりに

Production で動く node に TypeScript 由来の何かに依存しているのは怖いという思いを解消するため、 tsconfig-paths/register の挙動や実装を確認し、回避策を紹介しました。
これで安心して node アプリケーションでも path alias を使用できると思います。
