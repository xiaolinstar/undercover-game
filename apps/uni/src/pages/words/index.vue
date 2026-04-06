<script setup lang="ts">
import { computed, ref } from 'vue'
import { useGameStore } from '@/stores/game'
import { useWordPairsStore } from '@/stores/wordPairs'

const game = useGameStore()
const wordPairs = useWordPairsStore()

const q = ref('')
const currentId = computed(() => game.config.wordPairId)

const filteredPairs = computed(() => {
  const query = q.value.trim()
  const pairs = wordPairs.allPairs
  if (!query) return pairs
  const lower = query.toLowerCase()
  return pairs.filter((p) => {
    const label = p.label ?? ''
    return (
      p.civilian.toLowerCase().includes(lower) ||
      p.undercover.toLowerCase().includes(lower) ||
      label.toLowerCase().includes(lower)
    )
  })
})

const civilianInput = ref('')
const undercoverInput = ref('')
const labelInput = ref('')

function select(id: string) {
  game.setWordPairId(id)
  uni.navigateBack()
}

function addCustomPair() {
  const created = wordPairs.addCustomPair(civilianInput.value, undercoverInput.value, labelInput.value)
  if (!created) {
    uni.showToast({ title: '词对不能为空', icon: 'none' })
    return
  }
  civilianInput.value = ''
  undercoverInput.value = ''
  labelInput.value = ''
  select(created.id)
}

function removeCustomPair(id: string) {
  if (currentId.value === id) game.setWordPairId('random')
  wordPairs.removeCustomPair(id)
}
</script>

<template>
  <view class="page">
    <view class="card">
      <input class="search" v-model="q" placeholder="搜索：火锅 / 麻辣烫 / 吃的…" />
    </view>

    <view class="card">
      <view class="item" :class="{ active: currentId === 'random' }" @click="select('random')">
        <view class="left">
          <text class="name">随机抽取（推荐）</text>
          <text class="desc">每局从内置 + 自定义里随机抽一个</text>
        </view>
        <text class="mark" v-if="currentId === 'random'">已选</text>
      </view>

      <view class="divider" />

      <view v-for="p in filteredPairs" :key="p.id" class="item" :class="{ active: currentId === p.id }" @click="select(p.id)">
        <view class="left">
          <text class="name">{{ p.label ? `【${p.label}】` : '' }}{{ p.civilian }} / {{ p.undercover }}</text>
          <text class="desc" v-if="p.source === 'custom'">我的自定义</text>
        </view>
        <text class="mark" v-if="currentId === p.id">已选</text>
      </view>
    </view>

    <view class="card">
      <text class="section">添加自定义词对</text>
      <view class="form">
        <input class="field" v-model="civilianInput" placeholder="平民词（例如：火锅）" />
        <input class="field" v-model="undercoverInput" placeholder="卧底词（例如：麻辣烫）" />
        <input class="field" v-model="labelInput" placeholder="可选标签（例如：吃的）" />
        <button class="btn" @click="addCustomPair">添加并选中</button>
      </view>
    </view>

    <view class="card" v-if="wordPairs.customPairs.length">
      <text class="section">管理自定义词对</text>
      <view class="item" v-for="p in wordPairs.customPairs" :key="p.id">
        <view class="left">
          <text class="name">{{ p.label ? `【${p.label}】` : '' }}{{ p.civilian }} / {{ p.undercover }}</text>
        </view>
        <button class="danger" @click.stop="removeCustomPair(p.id)">删除</button>
      </view>
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
.card {
  background: #fff;
  border-radius: 24rpx;
  padding: 24rpx;
  box-shadow: 0 8rpx 20rpx rgba(0, 0, 0, 0.04);
}
.search {
  background: #f2f3f5;
  border-radius: 18rpx;
  padding: 18rpx 18rpx;
  font-size: 28rpx;
}
.item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 18rpx 0;
}
.item.active .name {
  color: #07c160;
}
.left {
  display: flex;
  flex-direction: column;
  gap: 6rpx;
}
.name {
  font-size: 28rpx;
  font-weight: 700;
  color: #111;
}
.desc {
  font-size: 24rpx;
  color: #666;
}
.mark {
  font-size: 24rpx;
  color: #07c160;
}
.divider {
  height: 1px;
  background: #eee;
}
.section {
  display: block;
  font-size: 28rpx;
  font-weight: 700;
  color: #111;
  margin-bottom: 12rpx;
}
.form {
  display: flex;
  flex-direction: column;
  gap: 14rpx;
}
.field {
  background: #f2f3f5;
  border-radius: 18rpx;
  padding: 18rpx 18rpx;
  font-size: 28rpx;
}
.btn {
  margin-top: 6rpx;
  background: #07c160;
  color: #fff;
  border-radius: 20rpx;
  font-size: 30rpx;
  font-weight: 700;
}
.danger {
  background: #fa5151;
  color: #fff;
  border-radius: 16rpx;
  font-size: 24rpx;
  padding: 10rpx 14rpx;
  line-height: 1;
}
</style>

