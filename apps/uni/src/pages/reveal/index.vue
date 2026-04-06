<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { useGameStore } from '@/stores/game'

const game = useGameStore()
const session = computed(() => game.session)

const pos = ref(1)
onLoad((query) => {
  const raw = (query?.pos as string) ?? '1'
  const n = Number.parseInt(raw, 10)
  pos.value = Number.isFinite(n) ? n : 1
})

const card = computed(() => session.value?.cards[pos.value - 1] ?? null)

watch(
  () => session.value,
  (v) => {
    if (!v) uni.redirectTo({ url: '/pages/setup/index' })
  },
  { immediate: true },
)

watch(
  () => pos.value,
  () => onPressUp(),
)

const holdMs = 600
const isVisible = ref(false)
const isHolding = ref(false)
const handoff = ref<{ visible: boolean; nextPos: number; isLast: boolean }>({
  visible: false,
  nextPos: 1,
  isLast: false,
})
let holdTimer: number | null = null

function clearHoldTimer() {
  if (holdTimer !== null) {
    clearTimeout(holdTimer)
    holdTimer = null
  }
}

function onPressDown() {
  if (handoff.value.visible) return
  isHolding.value = true
  isVisible.value = false
  clearHoldTimer()
  holdTimer = setTimeout(() => {
    if (isHolding.value) isVisible.value = true
  }, holdMs) as unknown as number
}

function onPressUp() {
  isHolding.value = false
  isVisible.value = false
  clearHoldTimer()
}

function next() {
  if (!session.value) return
  const nextPos = pos.value + 1
  const isLast = nextPos > session.value.config.numPlayers
  handoff.value = { visible: true, nextPos: isLast ? pos.value : nextPos, isLast }
  onPressUp()
  setTimeout(() => {
    if (isLast) uni.redirectTo({ url: '/pages/host/index' })
    else uni.redirectTo({ url: `/pages/reveal/index?pos=${nextPos}` })
  }, 650)
}

onBeforeUnmount(() => onPressUp())
</script>

<template>
  <view class="page" v-if="session && card">
    <view class="card">
      <text class="title">第 {{ card.pos }} 位玩家</text>
      <text class="sub">长按揭晓，松开隐藏（不显示身份）。</text>
    </view>

    <view class="card center">
      <text class="label">你的词</text>
      <view class="revealBox" :class="{ shown: isVisible }">
        <text class="word" v-if="isVisible">{{ card.word }}</text>
        <text class="mask" v-else>••••••</text>
      </view>
    </view>

    <button
      class="primary hold"
      :disabled="handoff.visible"
      hover-class="primaryHover"
      @touchstart.prevent="onPressDown"
      @touchend.prevent="onPressUp"
      @touchcancel.prevent="onPressUp"
    >
      按住揭晓（松开隐藏）
    </button>

    <view class="footer">
      <button class="btn" :disabled="handoff.visible" hover-class="btnHover" @click="next">我已记住，交给下一位</button>
    </view>

    <view v-if="handoff.visible" class="handoff">
      <view class="handoffCard">
        <text class="handoffTitle">{{ handoff.isLast ? '发牌完成' : '请交给下一位' }}</text>
        <text class="handoffSub" v-if="handoff.isLast">即将进入房主模式</text>
        <text class="handoffSub" v-else>第 {{ handoff.nextPos }} 位玩家</text>
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
.center {
  text-align: center;
}
.title {
  font-size: 34rpx;
  font-weight: 800;
  color: #111;
}
.sub {
  display: block;
  margin-top: 8rpx;
  font-size: 24rpx;
  color: #666;
}
.label {
  font-size: 26rpx;
  color: #666;
}
.revealBox {
  margin-top: 12rpx;
  padding: 12rpx 0;
  transition: transform 160ms ease, opacity 160ms ease;
}
.revealBox.shown {
  transform: scale(1.03);
}
.word,
.mask {
  display: block;
  font-size: 64rpx;
  font-weight: 900;
}
.word {
  color: #111;
}
.mask {
  color: #bbb;
}
.primary {
  background: #07c160;
  color: #fff;
  border-radius: 20rpx;
  font-size: 32rpx;
  font-weight: 700;
  width: 100%;
}
.hold {
  user-select: none;
}
.primaryHover {
  opacity: 0.92;
}
.footer {
  margin-top: auto;
}
.btn {
  background: #f2f3f5;
  border-radius: 20rpx;
  font-size: 30rpx;
  font-weight: 700;
  color: #111;
  width: 100%;
}
.btnHover {
  opacity: 0.92;
}

.handoff {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  display: grid;
  place-items: center;
  z-index: 50;
}
.handoffCard {
  width: 640rpx;
  background: #fff;
  border-radius: 28rpx;
  padding: 28rpx;
  text-align: center;
}
.handoffTitle {
  font-size: 36rpx;
  font-weight: 900;
  color: #111;
}
.handoffSub {
  display: block;
  margin-top: 10rpx;
  font-size: 26rpx;
  color: #666;
}
</style>

