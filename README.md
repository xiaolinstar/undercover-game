# 谁是卧底 · 发牌器（H5）

一个离线可用的 H5 发牌器：配置人数与词对后，手机按顺序传递给玩家长按揭晓自己的词；发牌完成后进入房主模式，支持快捷长按查验身份并判定胜负。

## 功能概览

- 发牌：`/setup` 配置 → `/reveal/1` 逐个查看（长按揭晓，松开隐藏；不展示身份）
- 房主模式：`/host` 玩家面板
  - **快捷查验**：长按玩家格子出现进度，完成后揭晓“卧底/平民”并标记（不展示词）
  - **忘词回看**：单击格子进入弹层，切换到“忘词回看”，长按翻牌仅展示该玩家的词
  - **胜负提示**：根据“已查验=淘汰”规则展示“游戏继续/游戏结束 + 胜利方”

> 玩法与交互说明见 [玩法与交互说明](docs/03-user-flow.md)。

## 快速开始

### 环境要求

- Node.js：`^20.19.0 || >=22.12.0`
- pnpm：建议使用最新稳定版

### 安装与运行

```bash
pnpm install
pnpm dev
```

### 构建与预览

```bash
pnpm build
pnpm preview
```

## 代码结构

- `apps/web/src/views/SetupView.vue`：开局配置
- `apps/web/src/views/WordPairPickerView.vue`：词对选择/自定义管理
- `apps/web/src/views/RevealView.vue`：玩家查看（翻牌 + 长按）
- `apps/web/src/views/HostView.vue`：房主模式（快捷查验、忘词回看、胜负提示）
- `apps/web/src/stores/game.ts`：发牌逻辑、查验记录（verdicts）与本地持久化
- `apps/web/src/stores/wordPairs.ts` / `apps/web/src/data/wordPairs.ts`：词库（内置 + 自定义）

## 开发与质量保障（依赖/脚本）

项目采用 Vue3 + Vite + TypeScript，质量保障主要来自类型检查、静态检查与测试：

- 类型检查：`pnpm type-check`（`vue-tsc --build`）
- 构建：`pnpm build`（会先 type-check 再 build）
- Lint：`pnpm lint`（`oxlint --fix` + `eslint --fix`）
- 格式化：`pnpm format`（`oxfmt`，仅对 `src/`）
- 单元测试：`pnpm test:unit`（Vitest）
- E2E：`pnpm test:e2e`（Playwright）

更详细说明见 [开发与依赖说明](docs/04-dev.md)。

## 部署（到云服务器）

你可以用两种方式部署：

1. **静态文件部署**：GitHub Actions 构建 `dist/`，通过 SSH 同步到服务器目录，由 Nginx 直接服务
2. **Docker 部署（推荐）**：GitHub Actions 构建镜像并推送到 GHCR；服务器 `docker compose pull && up -d`，由现有 Nginx 反代到容器

详细方案、Nginx 示例与 Actions 模板见 [部署设计（云服务器）](docs/05-deployment.md)。
