---
title: "Use pnpm on WebStorm with WSL using node-linker config"
date: 2023-12-26
---

[pnpm is not working well on WebStorm with WSL](https://blog.euxn.me/2023-12-25-pnpm-is-not-working-well-on-webstorm-with-wsl) で pnpm が symlink を使っていることに起因して WSL との相性が悪い問題を指摘しましたが、
pnpm の `node-linker` の設定を変更することで解消できることが分かりました。

```ini:.npmrc
node-linker = hoisted
```

WebStorm で prettier や eslint の自動検出がうまくいかない可能性があるようで、その場合は手動で設定する必要があります。

この対応で完全に解決するかは経過観察します。

---

## English translation

In the [pnpm is not working well on WebStorm with WSL](https://blog.euxn.me/2023-12-25-pnpm-is-not-working-well-on-webstorm-with-wsl) post, I pointed out that pnpm is not compatible with WSL due to it using symlinks, but it has been found that this can be resolved by changing the `node-linker` settings in pnpm.

```ini:.npmrc
node-linker = hoisted
```

Automatic detection of prettier or eslint may not work well in WebStorm. In this case, you will have to configure it manually.
I will continue to monitor whether this solution completely resolves the issue.