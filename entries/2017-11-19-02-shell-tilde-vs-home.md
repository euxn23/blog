---
title: "shell のチルダと$HOMEのどちらが解決が早いか雑に試したら$HOMEの方が早かった"
date: 2017-11-19
---

以下検証結果。文字列に変更が加わっているので参照渡しではないはず……。

```bash:tilda.sh
for i in $(seq 1 1000000); do
  str=~/tmp
done
echo $str
```

```bash
~/s/g/e/s/shell ❯❯❯ time sh tilda.sh
/Users/yuta/tmp
sh tilda.sh  4.28s user 0.06s system 100% cpu 4.305 total
~/s/g/e/s/shell ❯❯❯ time sh tilda.sh
/Users/yuta/tmp
sh tilda.sh  4.29s user 0.06s system 100% cpu 4.318 total
~/s/g/e/s/shell ❯❯❯ time sh tilda.sh
/Users/yuta/tmp
sh tilda.sh  4.37s user 0.06s system 100% cpu 4.397 total
~/s/g/e/s/shell ❯❯❯ time sh tilda.sh
/Users/yuta/tmp
sh tilda.sh  4.30s user 0.06s system 100% cpu 4.322 total
~/s/g/e/s/shell ❯❯❯ time sh tilda.sh
/Users/yuta/tmp
sh tilda.sh  4.68s user 0.10s system 99% cpu 4.812 total
```

```bash:home.sh
for i in $(seq 1 1000000); do
  str=$HOME/tmp
done
echo $str
```

```bash
~/s/g/e/s/shell ❯❯❯ time sh home.sh
/Users/yuta/tmp
sh home.sh  4.23s user 0.06s system 100% cpu 4.252 total
~/s/g/e/s/shell ❯❯❯ time sh home.sh
/Users/yuta/tmp
sh home.sh  4.19s user 0.06s system 100% cpu 4.207 total
~/s/g/e/s/shell ❯❯❯ time sh home.sh
/Users/yuta/tmp
sh home.sh  4.14s user 0.06s system 101% cpu 4.157 total
~/s/g/e/s/shell ❯❯❯ time sh home.sh
/Users/yuta/tmp
sh home.sh  4.28s user 0.06s system 101% cpu 4.303 total
~/s/g/e/s/shell ❯❯❯ time sh home.sh
/Users/yuta/tmp
sh home.sh  4.27s user 0.06s system 100% cpu 4.299 total
```
