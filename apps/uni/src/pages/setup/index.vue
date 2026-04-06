<script setup lang="ts">
import { computed } from 'vue'
import { useGameStore } from '@/stores/game'
import { useWordPairsStore } from '@/stores/wordPairs'

const game = useGameStore()
const wordPairs = useWordPairsStore() // init

const numPlayers = computed(() => game.config.numPlayers)
const undercoverCount = computed(() => game.undercoverCount)
const wordPairId = computed(() => game.config.wordPairId)
const selectedPair = computed(() => {
  if (wordPairId.value === 'random') return null
  return wordPairs.getPairById(wordPairId.value)
})

const wordSummary = computed(() => {
  if (wordPairId.value === 'random') return '随机抽取（推荐）'
  if (selectedPair.value) {
    const label = selectedPair.value.label ? `【${selectedPair.value.label}】` : ''
    return `${label}${selectedPair.value.civilian} / ${selectedPair.value.undercover}`
  }
  return '未选择'
})

function dec() {
  game.setNumPlayers(numPlayers.value - 1)
}

function inc() {
  game.setNumPlayers(numPlayers.value + 1)
}

function goWords() {
  uni.navigateTo({ url: '/pages/words/index' })
}

function start() {
  try {
    const session = game.startNewSession()
    if (!session) {
      uni.showToast({ title: '请先选择或添加词对', icon: 'none' })
      return
    }
    // Use reLaunch to avoid any route-stack edge cases on first entry
    uni.reLaunch({ url: '/pages/reveal/index?pos=1' })
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error(e)
    uni.showToast({ title: '启动失败，请重试', icon: 'none' })
  }
}
</script>

<template>
  <view class="page">
    <view class="header">
      <text class="title">谁是卧底 · 发牌器</text>
      <text class="sub">微信原生风格 · 一键开局</text>
    </view>

    <view class="card hero">
      <text class="label">玩家人数</text>
      <view class="stepper">
      <button class="step minus" @tap="dec">-</button>
      <text class="num">{{ numPlayers }}</text>
      <button class="step plus" @tap="inc">+</button>
    </view>
      <view class="meta">
        <text class="tag">卧底自动：{{ undercoverCount }}</text>
        <text class="tag muted">白板：0</text>
      </view>
    </view>

    <view class="card">
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
      <text class="hint">提示：发牌与查验阶段不会在列表里展示词语，避免被旁人看到。</text>
    </view>

    <view class="footer">
      <button class="primary" hover-class="primaryHover" @tap="start">开始发牌</button>
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
.card {
  background: #fff;
  border-radius: 24rpx;
  padding: 24rpx;
  box-shadow: 0 8rpx 20rpx rgba(0, 0, 0, 0.04);
}
.hero {
  align-items: center;
}
.label {
  font-size: 26rpx;
  color: #666;
}
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
.meta {
  margin-top: 14rpx;
  display: flex;
  justify-content: center;
  gap: 16rpx;
}
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
.row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
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
.hint {
  display: block;
  margin-top: 14rpx;
  font-size: 22rpx;
  color: #999;
}
.footer {
  margin-top: auto;
}
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
</style>
