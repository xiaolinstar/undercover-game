# 微信小程序迭代记录

本文记录微信小程序在大版本阶段内的小版本优化与迭代。

大版本规划见 `06-miniapp.md`：

- 一期：已上架基线能力
- 二期：扩展能力
- 三期：长期形态

## 一期迭代

### 版本 0.0.2：分享、难度反馈与词库扩充

#### 背景

- 微信小程序此前只有开局页具备分享能力，传播入口不完整
- 默认词库数量偏少，且整体偏简单，难以支撑更丰富的线下局体验
- 词对虽然已有基础难度逻辑，但玩家侧缺少更直接的反馈闭环
- 首页与词对列表的信息组织还可以继续优化，减少对用户的干扰

#### 本次目标

- 支持微信小程序全页面右上角分享
- 所有分享统一落到小程序首页，用于推广，不传递当前游戏状态
- 增加词库数量，并拉开 easy / medium / hard 的难度层级
- 支持房主对词对进行“太容易猜 / 太难描述 / 刚刚好”的轻量反馈
- 优化首页与词对页展示，隐藏评分等运营侧内部信息

#### 本次范围

- 小程序页面分享能力：
  - `pages/setup/index`
  - `pages/words/index`
  - `pages/reveal/index`
  - `pages/host/index`
- 词对运营能力：
  - 内置词库扩充
  - 难度分层
  - 房主反馈
- 首页与词对列表展示优化
- 不新增页面内主动分享按钮
- 不引入服务端或云端词库

#### 技术实现

1. 小程序统一分享能力

- 文件：
  - `apps/uni/src/pages.json`
  - `apps/uni/src/lib/share.ts`
  - `apps/uni/src/pages/setup/index.vue`
  - `apps/uni/src/pages/words/index.vue`
  - `apps/uni/src/pages/reveal/index.vue`
  - `apps/uni/src/pages/host/index.vue`
- 做法：
  - 为 4 个页面统一开启分享开关
  - 页面统一复用默认分享 payload
  - 分享标题强调聚会开局工具属性
  - 分享路径固定到首页
  - 不携带玩家人数、词对、发牌位置、查验结果等状态
  - 页面进入时统一显示分享菜单

2. 词库扩充与难度分层

- 文件：
  - `packages/core/src/builtinWordPairs.ts`
- 做法：
  - 将内置词对扩充到 100+
  - 补充更多中高难度主题：
    - 科技
    - 历史
    - 商业
    - 艺术
    - 校园
  - 调整部分词对默认难度，使词库分层更均衡

3. 用户难度反馈

- 文件：
  - `apps/uni/src/pages/host/index.vue`
  - `apps/web/src/views/HostView.vue`
- 做法：
  - 房主页支持对当前词对进行体感反馈
  - 反馈项仅保留：
    - 太容易猜
    - 太难描述
    - 刚刚好
  - 房主页不展示当前词语、评分、使用次数等内部信息

4. 首页与词对列表优化

- 文件：`apps/uni/src/lib/share.ts`
- 文件：
  - `apps/uni/src/pages/setup/index.vue`
  - `apps/web/src/views/SetupView.vue`
  - `apps/uni/src/pages/words/index.vue`
  - `apps/web/src/views/WordPairPickerView.vue`
  - `apps/uni/src/stores/wordPairs.ts`
  - `apps/web/src/stores/wordPairs.ts`
- 做法：
  - 首页只展示适量词对预览，不展示全部词库
  - 词对页隐藏评分
  - 难度展示弱化处理，避免干扰主信息

#### 验收标准

- 4 个小程序核心页面均可从右上角发起分享
- 好友通过分享卡片进入后，统一打开小程序首页
- 分享不恢复当前页面状态，不带入当前局信息
- 房主页可以提交词对难度反馈
- 房主页不展示词语、评分、使用次数
- 默认内置词对数量不少于 100
- 首页仅展示少量词对预览，完整词库进入选择页查看

#### 开发与验证建议

- 词库、分享或首页展示调整后，至少验证：
  - `pnpm -C apps/web test:unit -- --run`
  - `pnpm build:web`
  - `pnpm build:uni:mp-weixin`
- 微信开发者工具建议直接打开最新产物目录：
  - `apps/uni/dist/mp-weixin`
- 如果开发者工具仍显示旧页面行为：
  - 重新编译
  - 重新打开项目目录
  - 确认实际加载的是最新 `dist/mp-weixin`

#### 下一步优化建议

- 将难度从 `easy / medium / hard` 升级为数值体系，便于更细粒度地运营和排序
- 基于玩家反馈做词对推荐、降权、停用和回收机制
- 继续打磨首页词对预览与选择页的信息层次，降低用户认知负担
- 增加更多专题词包，例如校园、职场、影视、科技、节日场景
- 增加版本发布说明模板，便于后续 0.0.x 迭代持续沉淀

### 版本 0.0.3：难度分数化与轻运营（规划中）

#### 目标

- 在不增加页面复杂度的前提下，升级词库难度运营能力
- 内部使用 `1 ~ 100` 的 `difficultyScore`，用户侧仍只展示 `easy / medium / hard`
- 让房主反馈不再只是本地提示，而是能稳定影响词对排序与难度微调
- 为后续服务端词库与运营后台提前收敛数据结构

#### 规划要点

- 新增 `difficultyScore` 作为词对运营主字段
- 通过区间映射生成用户可见的三级难度标签
- `too_easy` / `too_hard_to_describe` 优先作用于难度分
- `just_right` 优先作为质量分正向信号
- 不新增复杂页面，仅做标签、文案、排序和数据逻辑调整

#### 详细文档

- 见 `09-miniapp-v0.0.3-prd.md`
