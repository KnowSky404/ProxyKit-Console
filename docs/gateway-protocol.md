# Gateway Console 协议草案（未实现）

这是 V2/V3 设计提案，不是当前 Gateway API。当前仅有 health 与设备授权的 private 分发；不得调用下列草案路径并将错误伪装成已连接。实施需要单独评审和修改 Gateway 仓库的明确任务。

## 信任与连接

Gateway registry 由 Console 服务端部署配置维护：稳定 id/name、固定 HTTPS origin、协议版本范围、允许资源类别、服务 Secret 引用及经过审查的来源路径。浏览器只能提交已登记 id，不能提交 URL、GitHub repository/ref 或认证 header。登记时拒绝用户信息段、query、fragment、HTTP、localhost/私网/metadata IP；服务端固定来源，拒绝重定向，不能因 DNS 重绑定扩大信任范围。新来源必须部署者明确审查；未来若支持动态注册，需额外设计受控解析与 egress 策略，不能只靠一次 DNS 检查。

Web session 确认用户身份和可见 Gateway；服务身份仅允许读取服务所需资源，Gateway 和 Console 都对用户权限进行交集过滤。服务权限不能自动等于所有用户权限。不能向浏览器返回 service token、DEVICE_AUTH 摘要或原始 dist/GitHub 凭据。

## 能力发现（建议）

`GET /v1/capabilities`，经服务认证返回：

```json
{
  "protocolVersion": "1",
  "capabilities": {
    "catalog": true,
    "textPreview": true,
    "deviceSubscriptions": false
  }
}
```

建议使用 `Accept: application/vnd.proxykit.console+json;version=1`。主版本不兼容则拒绝连接，不自动回退到未授权 private 路由。兼容的小版本只允许新增可选字段；未知 capability 按禁用处理。未实现 catalog 时 UI 显示不支持，不能从 private 路径猜目录。

## 目录（建议）

`GET /v1/console/catalog`：服务认证 + 明确用户授权上下文。后者必须是可验证的短期签名断言或经过双方审查的 token exchange；不得信任浏览器直接填写的 user id。返回 `protocolVersion`、`revision`、`resources`，只含当前用户可见内容。

每项：稳定 `id`、`name`、`description`、`platform`、`category`、`format`、`size`、`updatedAt`、`revision`，以及服务器可验证的 `contentPath`。只允许同一登记 origin 下的相对允许路径，不接受绝对 URL 或跨来源地址。Console 按注册 Gateway ID 补充 providerId/source。私人订阅地址必须另经设备授权流程产生；不要把服务授权 URL 作为订阅链接。

建议另设 `GET /v1/console/resources/<opaque-id>/content`：服务认证与用户授权逐请求校验，限制大小、格式、超时，禁止开放代理。Binary 返回原始字节且 Console 不转换；文本作为 UTF-8 惰性显示。当前 ResourceProvider 接口已可适配，实际 wire schema、分页/上限、主体断言、签名算法和重放保护须在 V2 接入前共同锁定。

## 错误、版本与缓存

错误建议固定 `{ "error": "unauthorized|forbidden|not_found|unsupported_version|unavailable", "requestId": "..." }`，不回显上游信息。401 服务身份无效、403 用户无权限、404 无可见资源、409 不兼容版本、413 超限、429 限流、503 不可用。UI 不把 401 重试成匿名访问或设备凭据访问。任何查询/内容都要重新授权；私人响应 `private, no-store`，禁止共享公共缓存，授权过滤先于条件响应。连接失败只影响该 Gateway，不影响匿名 Public 浏览。

## 身份边界

Web 用户：Console 登录/session；设备：客户端自动拉取及路径授权；服务：Console Worker 到 Gateway。三者不能互换。当前 DEVICE_AUTH 是 token SHA-256 摘要，无法恢复原 token。未来设备配置可以由用户临时手输已有 token，或单独设计新 token 创建/撤销/仅一次显示流程；不能从服务身份派生/泄露设备权限。详见 security.md。
