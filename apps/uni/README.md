# 微信小程序（uni-app）版本

该目录是“谁是卧底发牌器”的 uni-app（Vue3）实现，目标是微信原生风格的一期可上架版本。

## 页面

- `pages/setup/index.vue`：开局配置（人数、卧底自动、词对入口）
- `pages/words/index.vue`：词对选择 / 搜索 / 自定义管理
- `pages/reveal/index.vue`：逐个玩家查看（长按揭晓、松开隐藏，不显示身份）
- `pages/host/index.vue`：房主模式（面板快捷长按查验一次性；弹层仅“忘词回看”）

## 说明

- 一期完全本地运行：使用 `uni.setStorageSync/getStorageSync` 存储词库与本局。
- 二/三期接入后端/AI 时，再在 `src/services/` 增加 API client 与 feature flag。

## 如何运行（建议）

uni-app 工程依赖与运行方式与当前根目录的 Vite H5 不同，推荐：

1. 使用 HBuilderX 打开 `apps/uni/` 并运行到“微信开发者工具”
2. 或自行补齐 uni-app CLI 依赖后用命令行运行（按你的团队规范）

## uni-app CLI（Vite）+ pnpm

在 `apps/uni/` 目录执行：

```bash
pnpm install

# H5
pnpm dev:h5
pnpm build:h5

# 微信小程序
pnpm dev:mp-weixin
pnpm build:mp-weixin
```

> 说明：`dev:mp-weixin` / `build:mp-weixin` 会生成微信小程序产物目录（通常在 `dist/dev/mp-weixin` 或 `dist/build/mp-weixin`），用“微信开发者工具”打开该目录进行预览/上传。
> 本项目已配置按平台分别输出到 `dist/mp-weixin/` 与 `dist/h5/`，避免相互覆盖。
