# 项目架构

## 技术栈

- Vue 3 + TypeScript
- Vite
- Pinia（本地状态 + localStorage 持久化）
- Vue Router

## 页面与路由

- `/setup`：开局配置（人数、词对入口）
- `/words`：词对选择与自定义管理
- `/reveal/:pos`：第 pos 位玩家查看自己的词（长按揭晓）
- `/host`：房主模式（快捷查验、弹层查验/忘词、胜负提示）

## 核心状态（Pinia）

### `useWordPairsStore`

- 内置词库：`apps/web/src/data/wordPairs.ts`
- 自定义词库：localStorage 持久化
- 支持：随机抽取 / 新增 / 删除 / 根据 id 获取

### `useGameStore`

- `config`：玩家人数、词对选择（random 或指定 id）
- `session`：本局发牌结果与查验记录
  - `cards[pos]`：每位玩家的 role + word（**注意：玩家界面不展示 role**）
  - `verdicts[pos]`：房主查验结果（role），用于玩家面板打标与胜负提示

## 安全与隐私（一期设计目标）

- 全流程不依赖后端，避免把发牌信息上传到服务器
- 玩家查看与忘词回看均为“长按揭晓、松开隐藏”，降低旁观偷看风险
- 房主查验只显示“卧底/平民”，不显示词
