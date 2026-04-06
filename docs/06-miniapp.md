# 微信小程序规划（uni-app）

## 一期目标（可上架）

- 微信原生风格 UI
- 核心流程可玩：开局 → 逐个查看 → 房主查验/忘词回看
- 本地存储：词库、自定义词对、本局 session、verdicts

## 当前实现位置

- uni-app 工程：`apps/uni/`
  - 开局：`apps/uni/src/pages/setup/index.vue`
  - 词对：`apps/uni/src/pages/words/index.vue`
  - 发牌：`apps/uni/src/pages/reveal/index.vue`
  - 房主：`apps/uni/src/pages/host/index.vue`

## CLI 构建（Vite + pnpm）

在 `apps/uni/` 目录：

- 微信小程序开发：`pnpm dev:mp-weixin`
- 微信小程序构建：`pnpm build:mp-weixin`
- H5 开发：`pnpm dev:h5`
- H5 构建：`pnpm build:h5`

## 二/三期扩展点（预留）

- 后端同步（用户状态、战绩等）
  - 建议新增 `apps/uni/src/services/api.ts`（或独立 `packages/api`）
  - 小程序侧配置 request 合法域名（HTTPS）
- AI 词库
  - 一期先保持“内置 + 自定义”
  - 二期可做：主题选择 → 生成候选 → 人工一键入库（避免直接生成上桌）

## 建议的下一步重构（可选）

当前 `apps/uni/` 内为独立实现（便于快速一期上架）。当你准备长期维护时建议：

1. 抽出纯 TS 核心逻辑（发牌/胜负/词库结构）到 `packages/core`
2. 抽存储适配到 `packages/storage`
3. H5（当前 Vite）与小程序共用 core/storage，只保留各自 UI 与路由
