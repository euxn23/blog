---
title: "Mac OS の git で https で keychain を使わないようにする"
date: 2019-02-06
---

Mac OS 標準の git を使用していなくても、Xcode 以下に存在する gitconfig が読まれています

```bash
$ git config credential.helper
osxkeychain

$ git config --show-origin --get credential.helper
file:/Applications/Xcode.app/Contents/Developer/usr/share/git-core/gitconfig    osxkeychain

```

こちらがすでにない場合は、  `/usr/local/etc/gitconfig` や `/usr/local/git/etc/gitconfig` 等に記述があるかもしれません

これを消すと osxkeychain がなくなります
