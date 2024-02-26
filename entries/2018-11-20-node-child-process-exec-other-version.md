---
title: "node の child_processexec() を別のバージョンで動かす"
date: 2018-11-20
---

プログラムを実行するプログラムを新しいバージョンの node で書いたものの、実行対象のコードは最新のバージョンでは動かない、などよくあると思います(ない)

```js
const { exec } = require('child_process')
const { promisify } = require('util')

const execAsync = promisify(exec)

const cwd = 'path/to/code'

async function main() {
  await execAsync('PATH=~/.nvm/versions/node/v6.14.4/bin:$PATH npm test', { cwd })
   .catch(() => execAsync('PATH=~/.nvm/versions/node/v8.12.0/bin:$PATH npm test', { cwd })
}

main().catch(console.error)
```

`$ nvm use` でもできますが、上記の方が早いです。

他に良い方法があったら教えてください。
