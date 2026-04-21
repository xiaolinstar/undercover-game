# 词库反馈与本地闭环技术设计

本文定义 `0.0.x` 阶段词库反馈、难度运营与本地持久化的技术方案。

目标是同时满足两点：

- 当前版本坚持“本地闭环”，不引入服务端
- 代码结构兼容后续大版本接入服务端与运营后台

## 一、设计结论

### 1. 当前阶段定位

`0.0.x` 采用本地闭环方案：

- 用户反馈只影响当前设备
- 反馈结果写入本地存储
- 不影响其他用户
- 不修改代码中的内置默认词库常量

### 2. 架构结论

词库反馈相关实现拆分为两层：

- 规则层：
  - 放在 `packages/core`
  - 负责“用户反馈后应该怎么算”
  - 不关心数据最终存本地还是服务端
- 持久化层：
  - 放在当前各端 store，后续可抽到 `packages/storage`
  - 负责“算完之后存哪里、下次如何读回来”

### 3. 核心原则

- `difficultyScore` 是词条级元数据，不是系统级配置
- 系统级配置只定义规则边界与调参项
- 用户端只看到 `easy / medium / hard`
- 内部运营使用 `difficultyScore`
- 反馈规则必须抽象和集中配置，便于后续持续调参

## 二、要解决的问题

当前代码中已经存在：

- `qualityScore`
- `status`
- `flags`
- `applyWordPairFeedback()`

但现状仍有两个问题：

### 1. 难度与质量没有明确分层

现在的反馈逻辑主要直接修改 `qualityScore`，例如：

- `too_easy`
- `too_hard_to_describe`
- `just_right`

都直接作用于质量分。

这样会导致：

- “偏简单”和“质量差”混在一起
- “偏难描述”和“需要下线”混在一起
- 运营很难知道问题到底出在难度，还是出在词本身质量

### 2. 反馈规则缺少统一调参入口

如果将来要调整规则，例如：

- `too_easy` 从 `+3` 改成 `+2`
- `easy` 档位区间从 `1~33` 改成 `1~30`
- `just_right` 是否应该轻微提升难度分

不应该去改页面代码或多个 store，而应该集中调整规则配置。

## 三、目标能力

`0.0.x` 需要构建以下能力：

- 每条词对拥有自己的 `difficultyScore`
- 由 `difficultyScore` 自动映射出展示用的 `difficulty`
- 用户反馈先进入统一规则函数
- 规则函数返回“调整结果”
- store 将调整结果写入本地覆盖层
- 下次启动时继续生效
- 后续接服务端时，可复用同一套规则层

## 四、数据模型建议

## 4.1 词对主模型

建议 `WordPair` 逐步收敛为：

```ts
type WordPair = {
  id: string
  civilian: string
  undercover: string
  label?: string
  source?: 'builtin' | 'custom' | 'remote'
  status: 'active' | 'disabled'
  difficulty: 'easy' | 'medium' | 'hard'
  difficultyScore: number
  qualityScore: number
  tags: string[]
  lastUsedAt: number
  useCount: number
  cooldownRounds: number
  flags: string[]
}
```

### 4.2 字段职责

- `difficultyScore`
  - 描述这组词整体偏易还是偏难
  - 用于运营调档、排序和后续推荐
- `difficulty`
  - 给用户界面展示的三级标签
  - 不作为运营主字段
- `qualityScore`
  - 描述这组词是否适合继续推荐或保留
  - 用于排序、降权、人工复核
- `status`
  - 词条最终可用状态
  - `0.0.x` 不建议由单次反馈直接自动改为 `disabled`

## 五、规则层设计

### 5.1 规则层职责

规则层只负责：

- 接收词对当前状态
- 接收用户反馈
- 基于配置计算新的分数和标签
- 返回更新后的词对或结构化调整结果

规则层不负责：

- 读写 localStorage
- 调用 `uni.setStorageSync`
- 发送服务端请求
- 控制页面 UI

### 5.2 推荐拆分方式

建议将规则拆成三类函数：

```ts
function toDifficultyLevel(score: number, config: FeedbackTuningConfig): WordPairDifficulty

function evaluateFeedbackAdjustment(
  pair: WordPair,
  feedback: WordPairFeedback,
  config: FeedbackTuningConfig,
): FeedbackAdjustment

function applyWordPairFeedback(
  pair: WordPair,
  feedback: WordPairFeedback,
  config: FeedbackTuningConfig,
): WordPair
```

职责分别是：

- `toDifficultyLevel`
  - 负责分数到 `easy / medium / hard` 的映射
- `evaluateFeedbackAdjustment`
  - 负责算出“本次反馈建议如何调整”
- `applyWordPairFeedback`
  - 负责把调整结果真正应用到词对对象上

### 5.3 为什么要保留 `evaluateFeedbackAdjustment`

建议不要让 `applyWordPairFeedback()` 直接把所有逻辑都写死在内部。

多一层 `evaluateFeedbackAdjustment()` 有几个好处：

- 便于调试和打印日志
- 便于以后给运营后台展示“为什么这条词被调档”
- 便于未来把“计算”和“落库”分成两步
- 便于 A/B 测试不同的规则版本

## 六、规则配置设计

### 6.1 配置目标

把所有“拍脑袋的数值规则”抽成统一配置，而不是散落在代码各处。

建议引入：

```ts
type FeedbackTuningConfig = {
  difficultyMin: number
  difficultyMax: number
  qualityMin: number
  qualityMax: number
  difficultyStepTooEasy: number
  difficultyStepTooHardToDescribe: number
  qualityStepJustRight: number
  qualityPenaltyOnNegative: number
  negativeFeedbackThresholdForQualityPenalty: number
  levelRanges: {
    easyMax: number
    mediumMax: number
  }
}
```

### 6.2 推荐默认值

建议在 `packages/core` 内提供默认配置：

```ts
const DEFAULT_FEEDBACK_TUNING_CONFIG: FeedbackTuningConfig = {
  difficultyMin: 1,
  difficultyMax: 100,
  qualityMin: 0,
  qualityMax: 100,
  difficultyStepTooEasy: 3,
  difficultyStepTooHardToDescribe: 3,
  qualityStepJustRight: 1,
  qualityPenaltyOnNegative: 1,
  negativeFeedbackThresholdForQualityPenalty: 3,
  levelRanges: {
    easyMax: 33,
    mediumMax: 66,
  },
}
```

这里的含义是：

- “太容易猜”：
  - 难度分上调 `3`
- “太难描述”：
  - 难度分下调 `3`
- “刚刚好”：
  - 质量分上调 `1`
- 同一负向倾向累计达到阈值后：
  - 再对 `qualityScore` 做轻微惩罚

### 6.3 为什么要区分难度分和质量分

因为它们回答的是两种不同问题：

- `difficultyScore`
  - 这组词难不难
- `qualityScore`
  - 这组词值不值得继续优先推荐

所以：

- 一组词很简单，不一定质量差
- 一组词很难，也不一定要下线
- 只有当负向反馈反复出现，才说明词对本身可能有问题

## 七、反馈计算策略

### 7.1 单次反馈建议

推荐初始策略如下：

- `too_easy`
  - `difficultyScore += difficultyStepTooEasy`
  - 增加 `too-easy` 标记
- `too_hard_to_describe`
  - `difficultyScore -= difficultyStepTooHardToDescribe`
  - 增加 `too-hard-to-describe` 标记
- `just_right`
  - `qualityScore += qualityStepJustRight`
  - 清理与当前词相反的负向标记

### 7.2 边界保护

必须统一做分数边界裁剪：

- `difficultyScore` 限制在 `difficultyMin ~ difficultyMax`
- `qualityScore` 限制在 `qualityMin ~ qualityMax`

### 7.3 档位重算

每次 `difficultyScore` 变化后，重新映射：

- `1 ~ easyMax` => `easy`
- `easyMax + 1 ~ mediumMax` => `medium`
- `mediumMax + 1 ~ difficultyMax` => `hard`

### 7.4 质量分何时受影响

建议 `0.0.x` 版本中，`qualityScore` 的修改保持克制：

- `just_right`
  - 直接小幅提升 `qualityScore`
- 负向反馈
  - 先只改 `difficultyScore`
  - 如果某词多次持续收到同类负向反馈，再轻微降低 `qualityScore`

原因是：

- 当前没有全局统计
- 单次本地反馈噪声较大
- 过早大幅修改 `qualityScore` 会让词库波动过大

## 八、结构化调整结果

建议引入中间结构，避免规则函数过于黑盒：

```ts
type FeedbackAdjustment = {
  nextDifficultyScore: number
  nextDifficulty: 'easy' | 'medium' | 'hard'
  nextQualityScore: number
  nextFlags: string[]
  reasons: string[]
}
```

这样做的价值：

- 方便测试
- 方便 debug
- 方便未来接日志或后台审查
- 方便解释“为什么系统调成这样”

## 九、持久化层设计

### 9.1 当前阶段的存储原则

当前版本不修改内置默认词库文件，而是采用：

- 默认词库：来自 `packages/core/src/builtinWordPairs.ts`
- 本地覆盖层：来自各端本地 store 的持久化数据

启动时，将“默认词库 + 本地覆盖层”合并成最终词库。

### 9.2 为什么不能直接改内置词库

因为内置词库是代码里的静态默认值。

如果用户反馈直接修改内置常量，会带来几个问题：

- 会污染默认数据定义
- 无法区分“官方默认值”和“设备本地调优值”
- 无法为未来服务端同步保留清晰边界

### 9.3 当前推荐持久化结构

现有 store 已经有 `builtinMetaById` 的思路，建议继续沿用。

对内置词条的本地覆盖可以存为：

```ts
type BuiltinWordPairMeta = {
  difficultyScore?: number
  difficulty?: 'easy' | 'medium' | 'hard'
  qualityScore?: number
  status?: 'active' | 'disabled'
  flags?: string[]
  useCount?: number
  lastUsedAt?: number
  cooldownRounds?: number
  tags?: string[]
}
```

示例：

```json
{
  "builtinMetaById": {
    "b-01": {
      "difficultyScore": 27,
      "difficulty": "easy",
      "qualityScore": 81,
      "flags": ["too-easy"]
    }
  }
}
```

### 9.4 自定义词条的持久化

对 `customPairs`，直接保存更新后的完整词对象即可。

原因是：

- 自定义词本来就是本地创建
- 不存在“默认值 + 覆盖层”的合并问题

## 十、store 层职责

store 只负责：

1. 找到当前词条
2. 调用 `applyWordPairFeedback()`
3. 将返回结果写回：
   - `customPairs`
   - 或 `builtinMetaById`
4. 调用 `persist()`

store 不应该负责：

- 写难度算法
- 写阈值、步长、分档规则
- 直接在页面里拼反馈运营逻辑

## 十一、未来服务端兼容方案

### 11.1 当前版本影响范围

在 `0.0.x`，一个用户的反馈：

- 会影响这台设备后续使用
- 不会影响其他用户
- 不会立刻变成全局词库调整

### 11.2 后续服务端演进方向

未来接入服务端后，建议演进为三层模型：

1. 内置默认词库
2. 远端运营元数据
3. 本地未同步增量

此时：

- 规则层仍然可以保留在 `packages/core`
- 持久化层从“纯本地”扩展为“本地 + 远端”
- 页面层几乎不用改

### 11.3 为什么当前就要抽象规则

因为未来如果不抽规则，会出现两个问题：

- 接服务端时，反馈逻辑散落在页面和 store 中，难以迁移
- 后续想调参时，需要到处找硬编码数值

所以现在就抽规则，不是为了过度设计，而是为了避免以后推翻重做。

## 十二、建议文件落位

推荐后续代码调整方向如下：

- `packages/core/src/types.ts`
  - 增加 `difficultyScore`
  - 增加 `FeedbackTuningConfig`
  - 增加 `FeedbackAdjustment`
- `packages/core/src/wordPairOps.ts`
  - 增加分数裁剪
  - 增加档位映射
  - 增加 `evaluateFeedbackAdjustment`
  - 重写 `applyWordPairFeedback`
- `packages/core/src/index.ts`
  - 导出配置与规则函数
- `apps/uni/src/stores/wordPairs.ts`
  - 使用新规则函数
  - 将 `difficultyScore` 写入 `builtinMetaById`
- `apps/web/src/stores/wordPairs.ts`
  - 与小程序保持同样逻辑

## 十三、实施顺序建议

建议按以下顺序落地：

1. 扩展 `WordPair` 类型，加入 `difficultyScore`
2. 增加 `DEFAULT_FEEDBACK_TUNING_CONFIG`
3. 实现 `toDifficultyLevel()`
4. 实现 `evaluateFeedbackAdjustment()`
5. 重写 `applyWordPairFeedback()`
6. 调整默认词库初始化逻辑
7. 调整 store 的持久化结构
8. 增加单测，覆盖分数映射和反馈调参

## 十四、总结

`0.0.x` 阶段最稳妥的方案是：

- 保持本地闭环
- 把反馈规则抽到 `core`
- 把本地持久化留在 store
- 用 `difficultyScore` 做运营主字段
- 用 `difficulty` 做用户展示字段
- 用统一配置承接未来不断调整的“拍脑袋规则”

这样既不会过早引入服务端复杂度，也能保证后续大版本演进时不需要推翻现有实现。
