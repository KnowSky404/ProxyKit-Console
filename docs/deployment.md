# 本地开发与部署

需要 Bun 1.4.4 与 Node 24+。依赖 exact pin 和 bun.lock 已提交；本地及 CI 使用 `bun install --frozen-lockfile`。cf CLI 是项目依赖，通过 Bun script 调用时 CLI 本身在 Node 下运行，不使用 `bun --bun`。

```sh
bun install --frozen-lockfile
bun run dev
```

默认 `http://127.0.0.1:5173`，Vite + 本地 workerd 共同处理前端和 `/api/*`，无需另外启动 API 服务。首次预览需要网络访问固定 Raw Public 地址；catalog 本身随 Worker 构建，不请求 GitHub 目录 API。

受限云工作区可能禁止 cf/miniflare 写入用户配置目录或系统 tmp，可为单次命令指定可写目录，不修改用户 HOME：

```sh
mkdir -p .cache/config .cache/tmp .cache/bun
XDG_CONFIG_HOME="$PWD/.cache/config" TMPDIR="$PWD/.cache/tmp" bun run dev
# Bun 安装缓存受限时：
BUN_TMPDIR="$PWD/.cache/bun" BUN_INSTALL_CACHE_DIR="$PWD/.cache/bun/cache" bun install --frozen-lockfile
```

这些是本地沙盒适配，不是生产配置。浏览器剪贴板要求 localhost 或 HTTPS；不安全远程 HTTP 环境会提示复制失败。

## 生产构建与离线部署校验

```sh
bun run check
bunx cf deploy --dry-run
```

cf 将构建委托给已锁定的官方 Cloudflare Vite plugin。`cloudflare.config.ts` 声明 Worker 名称、入口、兼容日期、assets SPA fallback 和 API 优先；Vite 输出 Worker bundle 与静态资源到 `.cloudflare/output/v0/`。`public/_headers` 随资产进入构建。Production build/dry-run 不需要 Cloudflare 凭据、不上传。

cf CLI / Vite 2 当前为 beta；为了遵守项目 cf CLI 选择要求，已固定 `cf@1.0.0-beta.27` 和 `@cloudflare/vite-plugin@2.0.0-beta.v.11`。应用主框架使用稳定版本。升级 cf 集成须一起重跑 build、typecheck、preview 与浏览器测试。

## 维护者手动部署（本次未执行）

1. 确认 `.cloudflare` 忽略、没有 VITE_* Secret、Worker 名称 `proxykit-console` 与账户正确。
2. 使用 `bunx cf auth login`，或在部署 shell 注入最小权限 `CLOUDFLARE_API_TOKEN` / `CLOUDFLARE_ACCOUNT_ID`。不要把它们写入仓库，V1 无 runtime secrets。
3. 执行 `bun run deploy`；只在维护者完成账号授权和部署决策后执行。cf 可能创建 Worker，因此本次没有执行。
4. 手动验证首页/API、CSP、预览/复制、客户端 URL、错误状态及移动端；按团队流程配置域名。不要在未授权时更改生产 DNS。

没有数据库或资源绑定，CI 不部署、不提供生产 Secrets。未来私人集成仅使用 Worker Secrets，并需先完成身份/权限设计。回滚由部署者在 Cloudflare 版本管理中选择已验证版本；同步 catalog 后也应作为新的代码发布 review。
