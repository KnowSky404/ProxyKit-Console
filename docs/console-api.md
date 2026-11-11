# Console Public API（已实现）

这是 Console 自身的同源、只读 API。与未来 Gateway 发现/认证协议分开；没有新增 Gateway、登录、写入或任意图片代理能力。浏览器继续通过 `ResourceProvider` 访问。

## 端点和响应

| 请求                                            | 成功响应                                          | 约束                                                              |
| ----------------------------------------------- | ------------------------------------------------- | ----------------------------------------------------------------- |
| `GET /api/catalog`                              | `Catalog`                                         | 不接受任何 query；最多 2000 条、唯一 ID                           |
| `GET /api/resource?id=loon%2Frules%2Fwise.list` | `{ resource: Resource, content: string \| null }` | 仅一个 `id`；必须精确匹配目录，不接受 URL、repo、ref 或其他 query |

JSON 成功与错误响应使用 `Content-Type: application/json`、`Cache-Control: no-store`、`X-Content-Type-Options: nosniff` 和 `Referrer-Policy: no-referrer`。其他 HTTP 方法返回 405（空响应，`Allow: GET`）；未知 API 路径返回 404。

`Catalog`：`schemaVersion: 1`、40 位 commit `revision`、ISO `updatedAt` 和 `resources: Resource[]`。这是随部署发布的快照；没有服务端搜索、分页、实时 GitHub 同步或后台任务，搜索和筛选在浏览器内完成。

`Resource`：

| 字段                             | 含义                                                        |
| -------------------------------- | ----------------------------------------------------------- |
| `id`, `path`                     | 同一条已允许的 Public 仓库路径，也是详情查询 ID             |
| `name`, `description`            | 有界纯文本；不得当作 HTML 渲染                              |
| `platform`, `category`, `format` | 与路径分类一致，类型集合见 `src/types/resource.ts`          |
| `providerId`, `repository`       | 固定 Public 来源配置                                        |
| `url`                            | 固定仓库 main 的原始订阅 URL                                |
| `revision`, `updatedAt`, `size`  | 快照 commit、快照时间（不是单文件修改时间）、非负整数字节数 |
| `icon?`                          | 可选受限标识；不是 URL、SVG 内容或 HTML                     |

`icon` 当前只允许 `sidestore`、`youtube`、`binance`、`bitget-wallet`、`bybit`、`telegram`、`ur`、`wechat`、`wise`。浏览器将已验证的标识映射到同源 `/icons/{icon}.svg`；不下载远程插件声明的图片。未知 ID 和 URL 值使目录/详情校验失败。省略字段的旧 V1 目录仍有效；没有图标或本地图片加载失败时显示文件图标。新增标识需一起审查类型白名单、映射、资源文件和测试，不能仅在 API 返回新值。

元数据映射由 Console 的 `src/config/resource-icons.ts` 管理，`catalog:sync` 生成图标字段。图标是 Console 的展示标识，并不证明资源官方归属、兼容性或已审核；来源和许可见 [图标说明](icons.md)。

文本 `content` 是固定 catalog revision 的 UTF-8 文本（保留换行），上限 128 KiB；二进制 `.srs` 固定返回 `null`，不请求上游内容。不依赖 preview 获取复制 URL 所需数据。浏览器校验详情的 Resource、请求 ID、icon 和 content 类型/字节上限，内容只作为 React 文本节点。关闭详情会取消未完成请求。

## 固定错误

错误 JSON 为 `{ "error": "code" }`，不得回显上游正文或任意异常消息。

| HTTP | error                  | 含义                                |
| ---- | ---------------------- | ----------------------------------- |
| 400  | `invalid_query`        | 缺失、重复或不支持的 query          |
| 404  | `not_found`            | 未知 API 路径                       |
| 404  | `resource_not_found`   | 目录没有该 ID，或上游固定文件不存在 |
| 413  | `preview_too_large`    | 超出预览字节上限                    |
| 415  | `unsupported_text`     | 非法 UTF-8 或含 NUL 的二进制内容    |
| 502  | `upstream_unavailable` | 网络、超时、重定向或其他上游故障    |

浏览器按状态提供固定可读错误反馈。现有路径保持稳定；新增可选展示字段保留 V1，破坏字段语义、ID 或内容表示的修改必须先更新契约及版本。图片上传、任意 imageUrl、用户自定义 Provider 不属于此 API。
