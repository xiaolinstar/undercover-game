# 谁是卧底发牌器 - UI风格设计文档

## 1. 文档概述

### 1.1 项目简介

"谁是卧底发牌器"是一款微信小程序应用，用于线下聚会时快速发牌和房主查验身份。本文档旨在记录和规范该项目的UI设计风格，确保后续开发和其他项目的设计一致性。

### 1.2 设计理念

- **简洁明了**：界面简洁，操作直观，减少用户学习成本
- **微信原生风格**：遵循微信小程序设计规范，提供熟悉的用户体验
- **响应式设计**：适配不同尺寸的移动设备
- **视觉层次**：通过颜色、间距和排版建立清晰的视觉层次

## 2. 颜色系统

### 2.1 主色调

| 颜色名称 | 十六进制 | RGB           | 用途                       |
| -------- | -------- | ------------- | -------------------------- |
| 主色调   | #07c160  | 7, 193, 96    | 主要按钮、强调色、积极状态 |
| 红色     | #fa5151  | 250, 81, 81   | 减号按钮、消极状态         |
| 白色     | #ffffff  | 255, 255, 255 | 卡片背景、页面背景         |

### 2.2 文本颜色

| 颜色名称   | 十六进制 | RGB           | 用途               |
| ---------- | -------- | ------------- | ------------------ |
| 文本主色   | #111111  | 17, 17, 17    | 标题、重要文本     |
| 文本次要色 | #666666  | 102, 102, 102 | 副标题、说明文本   |
| 文本辅助色 | #888888  | 136, 136, 136 | 次要标签、提示文本 |
| 文本最弱色 | #999999  | 153, 153, 153 | 提示信息、辅助说明 |

### 2.3 背景与辅助色

| 颜色名称 | 十六进制            | RGB           | 用途               |
| -------- | ------------------- | ------------- | ------------------ |
| 浅灰色   | #f2f3f5             | 242, 243, 245 | 标签背景、分割区域 |
| 悬停色   | #f7f8fa             | 247, 248, 250 | 可点击元素悬停效果 |
| 阴影色   | rgba(0, 0, 0, 0.04) | -             | 卡片阴影           |

## 3. 排版系统

### 3.1 字体

- **字体家族**：系统默认字体
- **字体大小单位**：rpx（微信小程序响应式单位）

### 3.2 字体层级

| 元素     | 字体大小 | 字重 | 颜色        | 行高 | 适用场景     |
| -------- | -------- | ---- | ----------- | ---- | ------------ |
| 主标题   | 40rpx    | 700  | #111        | 1.2  | 页面标题     |
| 副标题   | 26rpx    | 400  | #666        | 1.3  | 页面副标题   |
| 数字显示 | 92rpx    | 800  | #111        | 1    | 玩家人数显示 |
| 按钮文本 | 32rpx    | 700  | #fff        | 1.2  | 主要按钮     |
| 行标题   | 30rpx    | 700  | #111        | 1.2  | 选项卡标题   |
| 行副标题 | 24rpx    | 400  | #666        | 1.3  | 选项卡描述   |
| 提示文本 | 22rpx    | 400  | #999        | 1.4  | 辅助提示     |
| 标签文本 | 24rpx    | 400  | #333 / #888 | 1.3  | 标签、状态   |

## 4. 布局系统

### 4.1 间距规范

| 间距类型   | 尺寸    | 适用场景           |
| ---------- | ------- | ------------------ |
| 页面边距   | 24rpx   | 页面四周           |
| 组件间距   | 20rpx   | 卡片之间           |
| 卡片内边距 | 24rpx   | 卡片内部           |
| 元素间距   | 8-14rpx | 卡片内元素之间     |
| 步进器间距 | 28rpx   | 加减按钮与数字之间 |

### 4.2 圆角规范

| 元素类型 | 圆角大小 | 适用场景         |
| -------- | -------- | ---------------- |
| 卡片     | 24rpx    | 内容卡片         |
| 主要按钮 | 20rpx    | 底部操作按钮     |
| 加减按钮 | 24rpx    | 数量调整按钮     |
| 标签     | 999rpx   | 状态标签（圆形） |
| 可点击行 | 18rpx    | 词对选择行       |

### 4.3 阴影规范

| 元素类型 | 阴影样式                         | 适用场景 |
| -------- | -------------------------------- | -------- |
| 卡片     | 0 8rpx 20rpx rgba(0, 0, 0, 0.04) | 内容卡片 |

## 5. 组件设计

### 5.1 卡片组件

```vue
<view class="card">
  <!-- 卡片内容 -->
</view>

<style>
.card {
  background: #fff;
  border-radius: 24rpx;
  padding: 24rpx;
  box-shadow: 0 8rpx 20rpx rgba(0, 0, 0, 0.04);
}
</style>
```

### 5.2 按钮组件

```vue
<!-- 主要按钮 -->
<button class="primary" hover-class="primaryHover">开始发牌</button>

<!-- 加减按钮 -->
<button class="step minus">-</button>
<button class="step plus">+</button>

<style>
.primary {
  background: #07c160;
  color: #fff;
  border-radius: 20rpx;
  font-size: 32rpx;
  font-weight: 700;
}
.primaryHover {
  opacity: 0.92;
}
.step {
  width: 96rpx;
  height: 96rpx;
  border-radius: 24rpx;
  color: #fff;
  font-size: 56rpx;
  font-weight: 800;
  line-height: 96rpx;
  padding: 0;
}
.minus {
  background: #fa5151;
}
.plus {
  background: #07c160;
}
</style>
```

### 5.3 标签组件

```vue
<text class="tag">卧底自动：{{ undercoverCount }}</text>
<text class="tag muted">白板：0</text>

<style>
.tag {
  padding: 8rpx 16rpx;
  border-radius: 999rpx;
  background: #f2f3f5;
  font-size: 24rpx;
  color: #333;
}
.tag.muted {
  color: #888;
}
</style>
```

### 5.4 步进器组件

```vue
<view class="stepper">
  <button class="step minus" @tap="dec">-</button>
  <text class="num">{{ numPlayers }}</text>
  <button class="step plus" @tap="inc">+</button>
</view>

<style>
.stepper {
  margin-top: 10rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 28rpx;
}
.num {
  font-size: 92rpx;
  font-weight: 800;
  color: #111;
  line-height: 1;
}
</style>
```

### 5.5 可点击行

```vue
<view class="wordRow" @tap="goWords" hover-class="wordRowHover">
  <view>
    <text class="rowTitle">词对</text>
    <text class="rowSub">{{ wordSummary }}</text>
  </view>
  <view class="right">
    <text class="pill" :class="{ random: wordPairId === 'random' }">{{ wordPairId === 'random' ? '随机' : '已选' }}</text>
    <text class="chev">›</text>
  </view>
</view>

<style>
.wordRow {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 18rpx;
  border-radius: 18rpx;
  padding: 8rpx 6rpx;
}
.wordRowHover {
  background: #f7f8fa;
}
.rowTitle {
  font-size: 30rpx;
  font-weight: 700;
  color: #111;
}
.rowSub {
  display: block;
  margin-top: 6rpx;
  font-size: 24rpx;
  color: #666;
  max-width: 500rpx;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.right {
  display: inline-flex;
  align-items: center;
  gap: 10rpx;
  flex-shrink: 0;
}
.pill {
  padding: 6rpx 14rpx;
  border-radius: 999rpx;
  background: #f2f3f5;
  font-size: 24rpx;
  color: #111;
}
.pill.random {
  color: #07c160;
}
.chev {
  font-size: 38rpx;
  line-height: 1;
  opacity: 0.65;
}
</style>
```

## 6. 页面布局模板

### 6.1 标准页面结构

```vue
<template>
  <view class="page">
    <view class="header">
      <text class="title">页面标题</text>
      <text class="sub">页面副标题</text>
    </view>

    <view class="card">
      <!-- 卡片内容 -->
    </view>

    <view class="footer">
      <button class="primary" hover-class="primaryHover">主要操作</button>
    </view>
  </view>
</template>

<style scoped>
.page {
  padding: 24rpx;
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}
.header {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}
.title {
  font-size: 40rpx;
  font-weight: 700;
  color: #111;
}
.sub {
  font-size: 26rpx;
  color: #666;
}
.footer {
  margin-top: auto;
}
</style>
```

### 6.2 页面示例 - 开局配置页

- **头部**：应用标题和副标题
- **内容区**：
  - 玩家人数设置卡片（包含步进器）
  - 词对选择卡片（包含可点击行）
- **底部**：开始发牌按钮

## 7. 交互设计

### 7.1 反馈机制

- **悬停效果**：可点击元素添加 `hover-class` 实现浅色背景
- **点击反馈**：按钮点击时透明度变化
- **操作提示**：使用 `uni.showToast` 显示操作结果
- **页面跳转**：使用 `uni.navigateTo` 和 `uni.reLaunch` 进行页面导航

### 7.2 动画效果

- **页面切换**：微信小程序默认页面切换动画
- **元素过渡**：保持简洁，避免过度动画

## 8. 适配与响应式设计

### 8.1 适配原则

- 使用 rpx 单位确保多设备适配
- 保持布局灵活性，避免固定宽度
- 关键内容居中显示
- 确保文本可读性

### 8.2 响应式策略

- 优先考虑移动设备体验
- 卡片式布局自动适应不同屏幕宽度
- 字体大小使用 rpx 单位自动缩放

## 9. 技术实现要点

### 9.1 技术栈

- **框架**：Vue 3 + Composition API
- **状态管理**：Pinia
- **样式**：Scss（通过 uni.scss 全局变量）
- **构建工具**：Vite + uni-app

### 9.2 代码规范

- 组件化开发
- 样式使用 scoped 特性避免冲突
- 响应式布局
- 遵循微信小程序开发规范

## 10. 设计资源

### 10.1 颜色变量

```scss
// uni.scss
$uni-color-primary: #07c160;
$uni-color-danger: #fa5151;
$uni-color-text-primary: #111111;
$uni-color-text-secondary: #666666;
$uni-color-text-tertiary: #888888;
$uni-color-text-quaternary: #999999;
$uni-color-bg-light: #f2f3f5;
$uni-color-bg-hover: #f7f8fa;
```

### 10.2 常用类名

| 类名       | 用途       |
| ---------- | ---------- |
| `.page`    | 页面容器   |
| `.header`  | 页面头部   |
| `.card`    | 卡片容器   |
| `.footer`  | 页面底部   |
| `.primary` | 主要按钮   |
| `.step`    | 步进器按钮 |
| `.tag`     | 标签       |
| `.wordRow` | 可点击行   |

## 11. 设计规范检查清单

- [x] 颜色使用符合规范
- [x] 字体大小和字重符合规范
- [x] 间距和圆角符合规范
- [x] 组件样式符合规范
- [x] 页面布局符合模板
- [x] 交互反馈符合规范
- [x] 响应式设计符合要求

## 12. 版本历史

| 版本 | 日期       | 更新内容 |
| ---- | ---------- | -------- |
| 1.0  | 2026-04-06 | 初始版本 |
