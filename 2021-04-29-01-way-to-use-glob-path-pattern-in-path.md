---
title: "Way to use glob path pattern (asterisk) in $PATH"
date: 2021-04-29
---

Definition of Environment Variable in Linux doesn’t expand glob pattern by default.
But you might need expand glob pattern in your $PATH, in such case using IFS is one of way to resolve this problem.

```shell
resolve_glob () {
  local IFS=":"
  echo "$*"
}
export PATH=$PATH:`resolve_glob /path/to/glob/*.sh`
```

This will work.

If you are using zsh, anonymous function is useful. Script will be one-liner and not affect global namescope.

```shell
IFS=":" export PATH=$PATH:`() { echo "$*"; } /path/to/glob/*.sh`
```

This works for `/path/to/glob/*.sh` glob pattern as above, and `/glob/inside/*/path`
glob pattern also works.
