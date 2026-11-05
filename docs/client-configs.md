# 客户端片段依据与限制

片段是合并到已有配置的引用，不是完整客户端配置。输入用户已有策略/outbound，不修改源规则。所有片段 URL 由固定 Public 来源和已审查路径生成。输入拒绝控制字符和有歧义的 INI 分隔符；对复杂策略名请在客户端中手动配置。插件/脚本/独立 rewrite 只复制原始 URL，避免猜测调用上下文。

## Loon

依据 [Loon 官方 example.conf 的 Remote Rule](https://github.com/Loon0x00/LoonExampleConfig/blob/master/example.conf)（2026-11-05 核对）与[订阅规则文档](https://nsloon.app/docs/Rule/sub_rule)：

```ini
[Remote Rule]
https://raw.githubusercontent.com/KnowSky404/ProxyKit/main/loon/rules/wise.list, policy=用户策略, enabled=true
```

插件 URL 通过客户端插件界面导入；脚本只预览和复制 URL，不能单独推导 Script 配置。上游 YouTube 插件需 Loon 3.5.1(983)+，SideStore 需 3.5.3(1007)+；功能限制和互斥安装请阅读各目录 README。Console 不声明插件已完成真机验证。

## Quantumult X

依据 [官方 sample.conf](https://github.com/crossutility/Quantumult-X/blob/master/sample.conf) 的 filter_remote 语法及 [ProxyKit QX 说明](https://github.com/KnowSky404/ProxyKit/blob/main/quantumultx/README.md)：

```ini
[filter_remote]
https://raw.githubusercontent.com/KnowSky404/ProxyKit/main/quantumultx/filters/wise.list, tag=proxykit-wise, force-policy=用户策略, enabled=true
```

force-policy 必须显式输入；部分上游列表的第三字段 no-resolve 在 QX 中不是 Loon DNS 开关，由 force-policy 覆盖。不要对两个客户端承诺相同 DNS 语义。当前没有独立 rewrite/script 资源，过滤为空是正常状态。

## sing-box

依据 [官方 Rule Set](https://sing-box.sagernet.org/configuration/rule-set/)、[Route Rule Action](https://sing-box.sagernet.org/configuration/route/rule_action/) 和 [ProxyKit sing-box README](https://github.com/KnowSky404/ProxyKit/blob/main/sing-box/README.md)。生成 `route.rule_set` remote 对象，JSON 为 `source`，SRS 为 `binary`；`route.rules` 通过 tag 绑定用户已有 outbound，显式 `action: route` 需 **1.11+**。规则集格式 version 2 的消费者最低 1.10，但 1.10 用户须手动省略 action 字段。JSON/SRS 两种表示同一规则，选择其中一个，不重复添加同名 tag。

Binance/WeChat/Telegram 的 IP 规则涉及 no-resolve 差异：不要在此前预先 resolve 域名，不要把含 IP 条件的集合视作等价 DNS 规则。WeChat 有共享服务/网段范围，订阅前检查上游说明。代码仅生成引用片段，不编译或转换 SRS。

Vitest 验证精确字符串、用户策略、注入拒绝、source/binary 区分和 JSON 结构。官方语法核对不能替代 Loon/QX 真机导入或 sing-box 运行验证；真实设备、特定主配置与业务连通性仍是人工验收项。
