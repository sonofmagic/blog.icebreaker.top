# icebreaker.top

> icebreaker 的博客源代码

已经过了很多很多年了

这个博客最早应该是 `2017` 写的，那时候我刚刚大学本科毕业

第一版本部署在 github pages 上

后面接触了很多 `serverless` 后来部署在腾讯云上

在 `2024` 年下半年，化繁为简，删了很多很多东西，当时迁移到了 `Netlify`，现在使用 `Cloudflare Workers` 托管静态站点。

## 开发与验证

使用 Node.js 24 LTS（最低 24.11.0；`.node-version` / `.nvmrc` 固定为 24.21.0）和 `package.json` 指定的 pnpm 版本。

```sh
corepack enable
git submodule update --init --recursive
pnpm install --frozen-lockfile
pnpm --filter @icebreakers/blog sync
pnpm dev
```

文章子模块需要仓库读取权限。`sync` 在首次 clone 后执行一次，将 `blog/content` 链接到 `article/content`。

```sh
pnpm lint
pnpm test
pnpm typecheck
pnpm build
pnpm --filter @icebreakers/blog generate
```

当前部署工作流将静态产物 `blog/.output/public` 上传到 Cloudflare Workers。
`blog.icebreaker.top/*` 的 Worker 路由由 `wrangler.jsonc` 管理，使正式域名使用同一份部署产物。
Cloudflare 的站点名称、兼容日期和静态资源目录统一配置在 `wrangler.jsonc`。使用 `pnpm exec wrangler deploy --dry-run` 验证部署打包；手动运行 Deploy 工作流默认开启 `dry_run`，只构建验证，不发布。推送到主分支和原有文章 webhook 仍执行正式部署。
TypeScript 暂留 6.0.3：当前 Vue 类型检查工具和 monorepo 工具尚不能完整兼容 TypeScript 7。
依赖的构建脚本许可统一在 `pnpm-workspace.yaml` 的 `allowBuilds` 中管理。

工作区工具已迁移到 `repoctl`，配置文件为 `repoctl.config.ts`。`script:init`、`script:clean`、`script:mirror` 已映射到新版子命令；旧版用于 npm 镜像同步的 `script:sync` 已移除（本仓库的包均为 private），文章同步仍使用上面的博客 `sync` 命令。
