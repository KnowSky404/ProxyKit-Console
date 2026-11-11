# ProxyKit Console

A unified web console for browsing, previewing, and managing subscription access across ProxyKit resources and multiple gateways.

V1 是独立部署的 **Public 资源浏览与复制控制台**，不是规则编辑器、生成器或节点订阅转换器。Private 登录、设备凭据管理及多 Gateway 接入属于后续版本，当前界面明确显示未连接。

当前真实目录来自 [KnowSky404/ProxyKit](https://github.com/KnowSky404/ProxyKit)：34 个资源，覆盖 Loon `.list` / `.plugin` / `.js`、Quantumult X `.list`、sing-box `.json` / `.srs`。QX rewrite/script 目录目前仅含占位文件，界面不会虚构资源。

已实现响应式资源卡片画廊、资源图标、全局搜索、平台/分类过滤、按需详情抽屉、文本预览、内容/URL/配置复制、SRS 下载链接、浅深色主题及移动端布局。桌面卡片 hover 或键盘聚焦时显示复制操作，触屏直接显示；点击详情才读取预览，Esc/关闭按钮可返回卡片。Loon Remote Rule、QX filter_remote（用户输入 force-policy）、sing-box source/binary route.rule_set 均提供片段；脚本和插件仅提供 URL 与使用限制。策略必须来自用户输入，不默认绑定 DIRECT/PROXY。

sing-box 同一路径主干的 JSON 与二进制 SRS 在画廊合并为一张卡片，通过卡片的 Format 选择后复制对应 URL 或打开对应文件详情。当前 34 个文件展示为 27 张卡片，其中 sing-box 为 7 张卡片／14 个文件；API 仍逐文件返回，缺少配对文件时不会虚构另一格式。分类和路径搜索先按文件筛选，再合并展示。

React + TypeScript + Vite + Tailwind CSS；同一个 Cloudflare Worker 提供静态资源与 Console API。Bun 管理精确锁定的依赖；Vitest、Testing Library、Playwright、ESLint、Prettier 和 GitHub Actions 提供质量检查。没有数据库、后台进程或外部缓存服务。

## 快速开始

需要 Bun **1.4.4**、Node **24+**（cf 在 Node 下运行）。

```sh
bun install --frozen-lockfile
bun run dev
# http://127.0.0.1:5173
```

Public V1 不需要账号、Token 或环境变量，直接使用提交的 catalog；只有同步目录需要已登录的 GitHub CLI。环境变量说明见 [.env.example](.env.example)。受限云环境如不能写用户配置目录，可在单次命令中设置 `XDG_CONFIG_HOME` 和 `TMPDIR` 到本地忽略的 `.cache` 目录。

## 开发命令

| 命令                              | 用途                                              |
| --------------------------------- | ------------------------------------------------- |
| `bun run dev`                     | cf 委托 Vite 启动，包含本地 Worker API            |
| `bun run catalog:sync`            | 通过 gh 更新 Public 目录，固定一次上游 SHA        |
| `bun run catalog:validate`        | 校验目录 schema、路径、URL、元数据和唯一性        |
| `bun run typecheck`               | TypeScript 严格检查                               |
| `bun run lint`                    | ESLint / React Hooks 检查                         |
| `bun run format` / `format:check` | 格式化 / 检查                                     |
| `bun run test`                    | 单元与关键 React 用户交互测试                     |
| `bun run test:e2e`                | Chromium 桌面/移动端集成测试                      |
| `bun run build`                   | 构建 Worker 和静态资源至 `.cloudflare/output/v0/` |
| `bun run check`                   | 类型、lint、格式、测试、目录校验、生产构建        |

首次运行浏览器测试：`bunx playwright install --with-deps chromium`。CI 在 PR 和 main push 运行所有质量门及浏览器测试，仅有 contents:read，不使用部署 Secrets。

TypeScript 固定 6.0.3，因为当前 typescript-eslint 尚不支持 TS 7。按本项目 cf CLI 要求使用 `cloudflare.config.ts`；cf 和官方 Vite 2 集成目前为 beta，版本已锁定并验证构建/本地运行，其余主框架采用稳定版。不要混用 Wrangler 配置。升级时一起验证工具链兼容性。

## 开发工作流

所有功能迭代、问题修复、文档及配置维护都必须在独立任务分支的 **worktree** 中完成。每次推送（包括修复推送）及创建 PR 前，先本地 `/review`（CLI：`codex review --base <target-ref>`），修复发现的问题并完成检查；后续修改或 rebase 后须重新 review。随后推送分支并提交 PR。

等待 CI 及自动触发的 Codex review，解决问题后使用 **rebase merge** 合并，并删除本任务的远端/本地分支及干净的 worktree。禁止手动触发 Codex 机器人；CI 完成并检查 PR 审查活动后仍未自动触发时，直接按其余合并条件处理。此流程已授权任务分支推送、PR、合并及合并后清理；详细门禁与异常处理见 [开发约束](AGENTS.md#git-prs-and-documentation)。

## 部署

本次没有部署、创建 Cloudflare 资源或修改域名。完成账号授权后，维护者可执行：

```sh
bun run check
bunx cf deploy --dry-run
bunx cf auth login
bun run deploy
```

部署前请阅读 [部署说明](docs/deployment.md)，核对账户、Worker 名称和权限。没有自动部署工作流。

## 文档

- [架构与现有生态能力](docs/architecture.md)
- [目录同步](docs/catalog.md)
- [Console API 契约](docs/console-api.md)
- [图标来源与回退](docs/icons.md)
- [客户端语法依据与限制](docs/client-configs.md)
- [未来 Gateway 协议草案](docs/gateway-protocol.md)
- [安全与三类身份边界](docs/security.md)
- [阶段路线图](docs/roadmap.md)
- [验证记录](docs/verification.md)
- [Codex 开发约束](AGENTS.md)

本仓库保留原有 [LICENSE](LICENSE)。远程插件/脚本的许可和兼容性说明属于上游；Console 不复制分发其内容、不执行远程代码。客户端真机导入与业务连通性尚待人工验证。
