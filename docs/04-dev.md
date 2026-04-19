# 开发与依赖说明

## 依赖与工具

- 运行时依赖：`vue`、`vue-router`、`pinia`
- 构建：`vite`
- 类型检查：`vue-tsc`
- 语法/代码质量：
  - `oxlint`（快、覆盖广，支持 `--fix`）
  - `eslint`（补充规则与生态插件，支持 `--fix`）
- 格式化：`oxfmt`（对 `src/`）
- 单测：`vitest`（本项目当前未强制要求必须有覆盖）
- E2E：`playwright`

## 常用脚本（package.json）

- `pnpm dev`：本地开发
- `pnpm type-check`：类型检查
- `pnpm build`：类型检查 + 打包
- `pnpm preview`：本地预览打包结果
- `pnpm lint`：`oxlint --fix` + `eslint --fix`
- `pnpm format`：格式化 `src/`
- `pnpm test:unit`：Vitest
- `pnpm test:e2e`：Playwright

## 本地存储

- 词库：`undercover.wordPairs.v1`
- 游戏局：`undercover.game.v1`

> 隐身模式或禁用存储时，可能无法持久化。
