# Public Catalog 同步

唯一来源在 `src/config/sources.ts`：`KnowSky404/ProxyKit` 的 main。脚本只读取公开元数据，不读取 Private，也不下载资源内容到本仓库。

```sh
gh auth status --hostname github.com
bun run catalog:sync
bun run catalog:validate
bun run check
git diff -- src/config/catalog.json
```

先获取 main 的一次 commit SHA，再以该 SHA 读取完整 recursive Git tree。拒绝截断树；只接收普通 blob 的 100644/100755 mode，拒绝 symlink/submodule。路径与扩展名同时受白名单限制：

- `loon/rules/*.list`、`loon/plugins/*.plugin`、`loon/scripts/**/*.js`
- `quantumultx/filters/*.list`、`quantumultx/rewrites/*.{conf,rewrite}`、`quantumultx/scripts/**/*.js`
- `sing-box/rules/*.{json,srs}`

隐藏段、路径遍历、编码路径、query、占位文件、README、YAML、测试 fixtures 不进入 catalog。按 path 排序，updatedAt 固定为同一提交时间，重复同步同一个提交得到相同文件。名称由真实文件名生成；描述使用来源、平台与类别，不猜测脚本能力。校验通过才以临时文件重命名替换目录，失败保留旧版本。

Catalog schemaVersion=1；校验唯一 ID、来源、路径、URL、格式、平台/类型映射、40 位 revision、合法快照时间和非负整数 size。空目录合法，UI 提供空状态。同步后必须 review 新增/删除和分类，开 PR，由 CI 验证，不要求修改 Public 仓库。上游重命名/删除直到同步发布后才反映在目录，旧预览仍固定到 SHA，而 main 订阅链接可能 404；这不是实时目录服务。

测试覆盖真实 catalog、自造的不可信路径/URL、篡改元数据、重复资源、空目录、分类及过滤；Fixture 只在 tests 中使用。构建/页面加载不执行 gh，不使用 GitHub Token。

同步脚本还通过 `src/config/resource-icons.ts` 的受审查映射，为已识别资源生成可选 `icon` 标识。仅允许共享类型中的本地图标 ID；新资源未映射时不写入该字段，UI 使用默认文件图标。不会抓取插件中的远程图片地址；更改映射后重新同步并校验。2026-11-11 本次同步到 `82453da88cd30e8c5ec23995b115cdd4ec581106`，仍为 34 条，资源路径与 URL 未变；上游 WeChat 的 Loon/QX 文件大小分别从 1657/1597 更新为 2603/2639 字节。
