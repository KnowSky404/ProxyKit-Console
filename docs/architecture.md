# 架构

V1 实现数据流：Public GitHub tree → 本地同步脚本 → 已验证静态 Catalog → Worker `/api/catalog` → 浏览器 Provider → 搜索/卡片画廊/按需详情抽屉。文本预览：浏览器选中 catalog ID → `/api/resource?id=...` → Worker 精确匹配目录 → 固定 Public 仓库与 catalog commit 的 Raw 文件 → 有界 UTF-8 解码 → JSON → React 文本节点。浏览器复制的订阅 URL 跟随 main，预览固定 catalog SHA，详情明确提示两者区别。

## 已检查的上游状态（2026-11-05）

使用已认证 GitHub CLI 读取三个仓库的 README、架构文档及目录；Gateway 另外读取 API/security 契约。没有读取私人规则或构建产物，没有修改其他仓库。

- Public `KnowSky404/ProxyKit`，观察提交 `10f07b382c201ec4776c420510c3031e68492194`：7 Loon rules、3 plugins、3 scripts、7 QX filters、7 JSON、7 SRS。QX rewrites/scripts 无实际资源。规则生成器及源 YAML 均不属于 Console。
- Gateway `KnowSky404/ProxyKit-Gateway`，观察提交 `c9c5691f374a6e201aaf4ce97746d3b7dd7ff0d8`：已有 GET/HEAD `/v1/health`、精确授权的 `/v1/private/...`、设备摘要认证和完整快照 SHA-256 校验；没有目录发现、capabilities 或 Console 用户登录接口。
- Private：仅核对 README、architecture、顶层目录。私有源与 dist 发布责任留在该仓库；不把私人名称、规则或产物复制到 Console。

上游能力依据：[Public 架构](https://github.com/KnowSky404/ProxyKit/blob/10f07b382c201ec4776c420510c3031e68492194/docs/architecture.md)、[Gateway API](https://github.com/KnowSky404/ProxyKit-Gateway/blob/c9c5691f374a6e201aaf4ce97746d3b7dd7ff0d8/docs/api.md)。这是观察快照，未来集成前需重新核对。

## 模块职责

| 模块             | 实现                                                                |
| ---------------- | ------------------------------------------------------------------- |
| App              | 导航、主题、筛选/选中状态，取消已过期目录请求                       |
| Components       | 可访问的 CopyButton，处理剪贴板失败                                 |
| Features         | catalog 列表、preview 详情、subscriptions 片段、gateways 未连接状态 |
| Browser Provider | 统一 ResourceProvider 接口，经同源 API 读取；不请求 Gateway 凭据    |
| Worker Provider  | 目录精确匹配，固定 Public 来源，无任意 URL 代理                     |
| Configuration    | 固定 Public 仓库/ref，生成的 catalog，128 KiB 预览上限              |
| Shared lib       | 路径/目录验证、过滤、URL 生成、有界文本读取                         |

Resource 类型包含 ID、名称、描述、平台、类别、Provider、repository、path、URL、format、revision、snapshot 时间、size。当前 updatedAt 是上游提交的快照时间，**不是每个文件最后修改时间**。Catalog 是发布快照，页面刷新不调用 GitHub tree API，构建也不自动同步上游；不引入持续后台同步服务。

`ResourceProvider` 的 `listResources(signal?)` / `getResource(id, signal?)` 隔离 UI 与来源。未来 Gateway Provider 必须在服务端使用已审查的 Gateway registry，以固定 ID 对应 HTTPS 来源、服务身份 secret 引用、协议版本和能力。UI 只选择获授权的 ID；不能输入 URL 让 Worker 代理，也不能直接持有服务凭据。发现协议见 gateway-protocol.md。当前只有 Public Provider，来源选择中的 Gateway 选项禁用。

Worker 路由只接受 GET `/api/catalog` 和 `/api/resource`；其余 `/api/*` 404，写操作 405，未知/重复查询拒绝。资源 404、超限 413、非法 UTF-8 415、上游/网络/超时 502；不回显上游诊断。资源取消/超时信号传入 fetch，重定向拒绝。静态资源由 Cloudflare Assets 提供，前端 SPA fallback，API 路由 Worker 优先。

## 关键取舍

不为静态 Public 目录引入数据库或缓存绑定；不生成规则、不转换 SRS。目录提交到 Git，保证 PR 可审查和离线构建。字体使用系统字体，不引入远程 CDN。主题仅保存非敏感偏好。工具链选用 React/Vite/Tailwind；cf 的 cloudflare.config.ts 集成当前需要官方 Vite 2 beta，锁定版本并以构建和本地 workerd 验证兼容性。若未来 beta 升级破坏兼容，先在分支验证而非线上升级。

## 卡片与图标

资源卡片从目录元数据直接复制 URL；详情抽屉仅在点击后挂载并读取预览，关闭后取消请求。原生 dialog 提供焦点隔离和 Esc 关闭，键盘聚焦卡片会显示快捷操作，触屏操作常显；减少动态效果偏好会关闭位移动画。App 管理筛选和选中 ID，详情继续拥有预览状态。

Resource 增加可选 icon 标识，保持 schemaVersion=1；类型白名单与同步脚本映射由 Console 维护，图片在同源静态资源目录，缺失时使用文件图标。目录和详情响应均校验，禁止远程 image URL 或 SVG 内容。API 字段、错误、版本兼容及边界详见 [Console API](console-api.md)，素材来源见 [图标说明](icons.md)。
