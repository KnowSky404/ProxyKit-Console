# V1 验证记录

2026-11-05，Bun 1.4.4、Node 26.13.0、Linux。依赖及工具链版本见 package.json/bun.lock，CI 使用 Node 24。lockfile 使用公开 npm registry，保留完整性摘要，不依赖开发环境内部镜像。

| 验收               | 证据                                                                                                                                                      |
| ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 干净安装           | 独立临时副本无 node_modules，bun install --frozen-lockfile 成功（285 packages）                                                                           |
| 本地启动           | cf dev 在 127.0.0.1:5173 启动 Vite 与 workerd；真实 Public catalog 和 Raw 预览响应 200                                                                    |
| 类型 / lint / 格式 | bun run typecheck、lint、format:check 全通过                                                                                                              |
| 自动化测试         | Vitest 5 文件，52 tests 通过；含关键 React 用户交互与 catalog 同步子进程测试                                                                              |
| 浏览器             | Playwright Chromium 桌面及 iPhone 13 尺寸，共 4 tests 通过；真实 catalog/插件预览、筛选、SRS、用户 outbound、深色、Private 未连接、文本惰性显示和复制反馈 |
| Catalog            | schema 验证 34 resources，固定 Public revision；34 个实际 main 订阅 URL HEAD 全部 200                                                                     |
| 生产构建           | cf build 成功，包含 Worker bundle 和静态 assets；干净安装副本亦构建成功                                                                                   |
| 部署校验           | cf deploy --dry-run 成功，未上传/部署，无资源绑定                                                                                                         |
| LICENSE            | SHA-256 与初始 HEAD 一致，未修改                                                                                                                          |

## 测试范围

路径遍历、编码/隐藏路径、目录/扩展名白名单、错误 URL、元数据篡改、唯一 ID、空目录/筛选、固定订阅 URL、QX/Loon 片段、source/binary 区分、用户策略及 INI 注入拒绝、UTF-8/换行、128 KiB 声明及流字节上限、二进制拒绝文本预览、404/网络失败、重定向拒绝、API 方法/query 限制、Worker 原生参数与 fetcher 分离、目录加载/预览重试。

同步脚本测试使用明确 gh Fixture，验证可重复输出、排除 symlink/占位文件以及截断树失败不覆盖旧目录；Fixture 不进入真实 catalog。浏览器第二条流程明确替换预览正文，证明脚本样文本不执行和复制真实 URL，第一条流程使用真实 Public 插件内容。截图/测试产物只存临时目录或忽略的 .cache，不提交仓库。

视觉 QA：桌面 1440px、移动 390px、浅色/深色，对照生成概念检查双栏/堆叠、字体、白底、绿色选中态和操作控件；实际数据、元数据及安全提示使用真实内容，未采用概念中的示例 URL/错误客户端片段。Browser plugin 不可用，因此使用 Playwright。页面标题/内容正确，无框架错误遮罩、相关 console/page errors 或页面横向溢出。生产预览另验证静态 CSP/nosniff 和真实文本 API。

## Review 与剩余人工验收

提交前 review 了 Worker HTTP 入口、Provider 来源约束、路径/大小校验、异步取消、配置语法、静态安全头、CI 权限和公开产物。已修复真实运行发现的 Worker 参数误用、workerd 不支持 redirect:error、TS7/lint 不兼容以及 Tailwind 自动扫描范围过大；有回归测试或运行校验。

未执行生产部署、Loon/QX 真机导入、sing-box 实际运行/远程更新、Safari/Firefox 或屏幕阅读器人工验收。配置语法有官方资料依据与字符串/结构测试，不能据此宣称设备验证。Private 认证和多 Gateway 为文档设计，当前未实现。cf/Vite 2 beta 工具链已锁定，仍需关注上游升级兼容性。CI 和已配置自动 review 的最终状态以 PR 为准，不把本地通过等同于远端通过。

## 2026-11-11 资源卡片与图标 API

- Bun 1.4.4、Node 26.13.0；`bun install --frozen-lockfile` 成功，无依赖更新。`bun run check` 通过（56 项 Vitest、类型、lint、格式、目录校验及 cf 生产构建）。
- Playwright Chromium desktop / iPhone 13 模拟：6 项通过。真实目录/真实预览、二进制无预览、配置生成、惰性预览、卡片复制反馈、hover/键盘/触屏操作、Esc/关闭按钮/焦点返回、筛选、空状态、主题和 Private 边界均检查。
- 单元回归包括图片加载失败/无图标回退、旧 V1 目录兼容、图标 URL/未知标识拒绝、素材完整性、详情响应身份/来源/内容类型/字节上限，以及关闭时请求取消。
- Browser 插件不可用，使用项目 Playwright；在本地 cf/Vite 页面 `http://127.0.0.1:5173/` 检查页面标题、非空内容、无框架错误覆盖层、无应用 console/pageerror、图片正常加载和操作结果。设计稿与截图通过 `view_image` 对照，截图/设计稿未提交到仓库。
- 设计核对：1487×1058 原尺寸检查白底/绿色强调色、三列卡片、标题层级、图标尺寸、24px 间距及 hover 操作栏；手机单列与全宽详情抽屉、浅深色可读性均检查。修复了初版密度/字号差异，以及原生 dialog 与 React StrictMode 清理和焦点恢复的交互问题。
- 有意差异：全部 34 条真实资源自然滚动，页脚位于完整目录底部；保留真实平台/路径/名称/快照 revision，移除概念稿虚构的 OKX；图标使用受审查本地扁平 SVG，无远程图片或渐变；保留已有单按钮主题切换和来源选择控件。首屏文案与设计方向一致，变化仅为真实目录元数据和上述控件差异。
- 未部署；未验证 Safari/Firefox、真实手机或代理客户端真机导入。此记录不代表规则业务连通性或品牌官方授权。
