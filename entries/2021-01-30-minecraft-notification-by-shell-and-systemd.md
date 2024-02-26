---
title: "minecraft(spigot) のログイン/ログアウト通知を shell+systemd で実装する"
date: 2021-01-30
---

Spigot をはじめとする Java 版の minecraft サーバの場合、 logs/latest.log に各通知が記録されるため、そこを tail -f して grep して sed して curl で webhook に飛ばすスクリプトを書き、 systemd に登録する。
以下では例として discord の webhook を使うが、 curl 以降を書き換えることで任意の webhook に対応する。

```shell
#!/bin/bash
tail -f -n1 /srv/craftbukkit/logs/latest.log | grep --line-buffered 'of player' | sed -u -r 's/.*of\splayer\s(.*)\sis.*/\1/g' | xargs -INAME curl -XPOST -H 'Content-Type:application/json' -d '{ "content": "NAME logged in"}' https://discord.com/api/webhooks/XXXXXX/XXXXXX
```

ログアウトの場合はこう。

```shell
#!/bin/bash
tail -f -n1 /srv/craftbukkit/logs/latest.log | grep --line-buffered 'left the game' | sed -u -r 's/.*\s(.*)\sleft\sthe\sgame.*/\1/g' | xargs -INAME curl -XPOST -H 'Content-Type:application/json' -d '{ "content": "NAME left the game"}' https://discord.com/api/webhooks/XXXXXX/XXXXXX
```

これを実行権限を付け、 craftbukkit ユーザ(グループ)の所有物にして、 systemd に craftbukkit ユーザ(グループ)のプロセスとして登録する。(logout は省略)

```shell
$ sudo chmod +x /srv/craftbukkit/login-notify.sh
$ sudo chown craftbukkit:craftbukkit /srv/craftbukkit/login-notify.sh
```

systemd への登録は .service を記述する。

```shell
$ sudo vim /etc/systemd/system/craftbukkit-login-notify.service


[Unit]
Description = craftbukkit login notify daemon

[Service]
ExecStart = /srv/craftbukkit/login-notify.sh
Restart = always
Type = simple
User = craftbukkit
Group = craftbukkit

[Install]
WantedBy = multiuser.target
```

service を enable にし、 start する。

```shell
$ sudo systemctl enable craftbukkit-login-notify.service
$ sudo systemctl start craftbukkit-login-notify.service
```

## 参考

https://enakai00.hatenablog.com/entry/20130917/1379374797
