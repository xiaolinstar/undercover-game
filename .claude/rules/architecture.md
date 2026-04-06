# 多项目统一架构规范 (Architecture Rule)

在创建或维护跨平台（特别是包含 Web 与微信小程序）的前端项目时，必须遵循本架构规范，以确保项目之间的一致性、可维护性和高复用度。

## 1. 核心架构模式

所有的跨端项目均统一采用 **`pnpm workspace` 的 Monorepo（多包应用）仓库架构**，严格贯彻“表现层与底层业务逻辑分离”的原则。

```text
├── apps/               # 具体的端级应用 (UI 和端特有逻辑)
│   ├── web/            # H5/PC Web端 (Vue 3 + Vite + Pinia)
│   ├── weapp/          # 原生微信小程序端 (纯原生 WXML/WXSS/TS，禁用 uni-app)
│   └── ...             # 其他端应用
├── packages/           # 跨端共享代码包
│   ├── core/           # 核心业务逻辑、数据模型定义、规则引擎
│   ├── storage/        # 统一的持久化存储接口适配
│   ├── utils/          # 无副作用的通用纯函数工具库
│   └── ui/             # (可选) 可复用的 CSS 或独立UI组件
├── package.json        # 根目录依赖管理
└── pnpm-workspace.yaml # workspace 配置
```

## 2. 技术栈及工具链标准

- **包管理**：强制使用 `pnpm`。
- **类型系统**：全系使用 TypeScript，并在各自的 `tsconfig.json` 中保持 `strict: true` 的严格模式。
- **H5/Web端**：推荐采用 **Vue 3 + TypeScript + Vite + Pinia**；或者根据项目需求选择 React，但底层核心业务无缝兼容。
- **小程序端**：**严禁使用 uni-app 等转换框架。** 必须采用 **原生微信小程序架构**（WXML + WXSS + TS编译 +微信原生API），确保在小程序端的极致性能。
- **代码质量与格式化**：
  - 格式化：建议使用 `oxfmt`（或备用的 `Prettier`）进行统一。
  - Lint检查：使用 `oxlint` 处理性能密集的静态检查，用 `eslint` 进行生态补充检查。
- **测试**：基础核心逻辑库（如 `packages/core` 等）应当使用 `Vitest` 作基础覆盖；保障业务核心逻辑不碎裂。

## 3. 分层与跨端解耦设计规则

### 3.1 核心逻辑下沉 (`packages/core`)

- **原则**：任何可能在不同端复用的**业务状态树、计算规则、核心算法、数据校验逻辑**，都必须强制下沉至 `packages/core` 包内。
- **约束**：`packages/core` 必须是一个高度“纯净”的 TypeScript 包（Vanilla JS），**禁止跨端依赖（如浏览器 `window`/`document` 或 微信小程序 `wx` 对象）。**
- **应用层接入**：在 Web 端由 Pinia 接入，而在原生小程序初始化时直接从 Core 中引入相应的业务实例或类使用。

### 3.2 环境透明存储 (`packages/storage`)

- **原则**：应用层或核心层进行持久化存储时不应显式关心当前底层设施是何平台。全部通过统一标准 API 调用（如 `getItem`, `setItem`）。
- **适配方式**：借助依赖反转（Dependency Injection）。在 `apps/web` 注入 `localStorage`。而在 `apps/weapp` 注入 `wx.getStorageSync` 等引擎接驳入挂载点即可。

### 3.3 表现层完全割裂

弃用 `uni-app` 等大一统编译框架，各端的表现层完全断交解耦：

- **Web (`apps/web`)**：专心处理 HTML DOM、Vue 响应式与浏览器相关 API交互。
- **微信小程序 (`apps/weapp`)**：专心依据微信原生 `Page()`、`Component()`、`WXML/WXSS` API 实现业务视图。
- 在 UI 层面不强求“代码复用”，把高价值的业务模型复用在 JS/TS层面。

## 4. AI 编码约定建议

如果你让大模型或 AI Agent 工具参与此类项目的开发，请使用以下规则约束：

1. **优先抽取**：涉及跨平台复用逻辑请首先设计在 `packages/core` 或 `packages/storage` 中，并保持无框架依赖。
2. **纯真原生**：新增微信小程序页面直接按照微信原生小程序写法（WXML/WXSS）编写，绝对不要用 Vue/uni-app 规范。
3. **接口存取**：新增本地持久化逻辑不要直接使用 `wx.setStorageSync` 或 `localStorage`，需通过 `packages/storage` 的接口。
