# 安全边界

## 当前实现

Public V1 没有登录、不持有任何 GitHub 私人凭据或 Gateway 凭据，不访问私人数据。Public 订阅本身公开，浏览不依赖 Gateway 认证。同步脚本使用本机 gh 身份只读取固定 Public 元数据；Token 不写入 catalog、日志或浏览器。Public 页面、构建和 CI 无需 PAT/部署 Secret。

`/api/resource` 只接受目录中精确 ID；来源/仓库/commit/路径由服务端 catalog 决定。拒绝任意 URL、未知/重复 query 和目录外路径，不提供 CORS 放行或通用 fetch 接口。上游 fetch 不转发浏览器 Cookie/Authorization，拒绝重定向，10 秒超时。固定 path 白名单与普通 blob mode 排除目录遍历、隐藏段、symlink/submodule。没有可被用户重定向的 Gateway 代理。

文本按流读取，声明大小与实际字节双重限制 **128 KiB**；超过拒绝整个预览，不复制截断内容。仅已允许文本格式被解码；UTF-8 fatal 解码、NUL 拒绝。SRS 不请求文本预览，不解码/转换/编译。脚本、插件和 HTML 样内容只作为 React 文本节点，不使用 innerHTML、eval 或远程 import。剪贴板失败明确提示手动复制；只有非敏感主题偏好保存在 localStorage。

静态资源设置 CSP（脚本/连接仅 self）、nosniff、拒绝 frame、referrer-policy、权限策略；API 返回 no-store、nosniff 和固定错误码，不回显上游正文、URL 或异常。Worker 日志/trace 开启并移除查询字符串；不添加含内容/凭据日志。API 响应使用 JSON 内容类型。没有服务端公共缓存存储。

客户端配置输入不能包含换行、控制字符或 INI 字段分隔符；输出规则仍引用原资源，不改变源策略内容。所有客户端能力声明须有官方依据；当前未验证真机导入。

## 未来三类身份（尚未实现）

| 身份                              | 作用                          | 应用边界                                       |
| --------------------------------- | ----------------------------- | ---------------------------------------------- |
| Web User Authentication           | Console 登录和私人目录可见性  | 安全 session、CSRF、防固定会话、逐资源用户权限 |
| Gateway Device Authentication     | 代理客户端定期拉取私人规则    | 设备 token、明确路径权限、撤销/轮换            |
| Service-to-Service Authentication | Console Worker 到登记 Gateway | 最小权限服务凭据、用户授权交集、固定来源       |

当前 Gateway DEVICE_AUTH 仅存 SHA-256 摘要，不存原 token。Console 不能恢复原 token。未来可设计用户临时手动输入已有设备 token 或凭据创建流程；不得保存到浏览器持久化存储，不把服务 token 当设备 URL token，不在公共 URL/日志泄露凭据。

服务凭据只可进入 Worker Secrets，不可进入 VITE_*、前端包、公开仓库、Fixture 或构建日志。私人响应必须逐请求鉴权授权，private,no-store；不要复用 Public 缓存策略。信任注册及 SSRF 边界见 gateway-protocol.md，未来动态 Gateway 注册需要单独设计，不能直接启用文本 URL 输入框。

## 维护与风险

依赖更新要 review lockfile，保留精确版本。PR CI contents:read、checkout 不持久化凭据、不接收生产 Secret、不自动部署，不使用 pull_request_target 执行外部代码。部署者负责 Cloudflare 账号权限和生产域名/HTTPS。

Public 上游不受 Console 控制；main 订阅可能变化、失效或包含恶意内容，Console 不替用户安装执行。预览固定 SHA 帮助复查，但不是对上游可信性的保证。发布前检查产物不含私人数据/凭据，未来新增认证必须更新威胁模型和测试。

资源图标仅使用受版本控制的同源 SVG，API 的可选 icon 字段受固定 ID 白名单校验；不接受远程 URL、SVG 文本或 HTML。缺失文件回退，不建立图片代理。浏览器详情响应校验复用 catalog 来源/路径/URL 规则，并校验请求 ID、文本类型与 128 KiB 字节上限。卡片复制不加载远程预览。
