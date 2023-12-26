---
title: "[SOLVED] pnpm is not working well on WebStorm with WSL"
date: 2023-12-25
---

### 更新 (2023-12-26)

この問題についてワークアラウンドを発見しました
[Use pnpm on WebStorm with WSL using node-linker config](2023-12-26-use-pnpm-on-webstorm-with-wsl-using-node-linker-config)の投稿をご確認ください。

---

pnpm で npm package をインストールしていても、WebStorm 上でインストールされたと認識されず `install dependencies` のポップアップが出続けたり、prettier などを使用する際に `package is not installed` と表示されるなどの症状が発生します。

![](https://static.blog.euxn.me/4bbhz4cm.png)

調べているといくつかの issue が。
[webstorm can't find any package with pnpm in wsl2](https://youtrack.jetbrains.com/issue/WEB-54790)

この issue によると、 WSL2 の Windows FileSystem Interop では symlink が正常に動作しないことが言及されています。[[IDEA-253253] Have Symlinks work on WSL](https://github.com/JetBrains/intellij-community/pull/2364)

これが symlink ベースである pnpm と相性が悪く問題となっていると推測されます。WSL2 側の問題であるため、そちらの解消を待つしかなさそうです。

---

## English translation

### UPDATE (2023-12-26)

I found a workaround of this problem.
See [Use pnpm on WebStorm with WSL using node-linker config](2023-12-26-use-pnpm-on-webstorm-with-wsl-using-node-linker-config) post.

---

Even when I install npm packages with pnpm, `install dependencies` pop up would still be shown. on WebStorm, and when using prettier `package is not installed` pop up would be shown.
![](https://static.blog.euxn.me/4bbhz4cm.png)

I found similar issues on GitHub.
[webstorm can't find any package with pnpm in wsl2](https://youtrack.jetbrains.com/issue/WEB-54790)

According to this issue, it is mentioned that symlink does not work properly in WSL2's Windows FileSystem Interop. [[IDEA-253253] Have Symlinks work on WSL](https://github.com/JetBrains/intellij-community/pull/2364)

It is inferred that this is incompatible with pnpm, which is symlink based, causing issues. As this is a problem on the WSL2 side, it seems that we have no choice but to wait for it to be resolved.
