<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue'
import { useGameStore } from '@/stores/game'
import type { Role } from '@/types/game'

const game = useGameStore()
const session = computed(() => game.session)

const positions = computed(() => {
  if (!session.value) return []
  return Array.from({ length: session.value.config.numPlayers }, (_, i) => i + 1)
})

function roleText(role: Role) {
  return role === 'undercover' ? '卧底' : '平民'
}

function verdictFor(pos: number) {
  const role = session.value?.verdicts[String(pos)]
  return role ? roleText(role) : null
}

type Outcome = { status: 'ongoing' } | { status: 'ended'; winner: 'civilian' | 'undercover' }

const outcome = computed<Outcome>(() => {
  if (!session.value) return { status: 'ongoing' }
  const eliminated = new Set(Object.keys(session.value.verdicts).map((k) => Number.parseInt(k, 10)))
  const alive = session.value.cards.filter((c) => !eliminated.has(c.pos))
  const aliveUndercover = alive.filter((c) => c.role === 'undercover').length
  const aliveCivilian = alive.length - aliveUndercover

  if (aliveUndercover <= 0) return { status: 'ended', winner: 'civilian' }
  if (aliveUndercover >= aliveCivilian) return { status: 'ended', winner: 'undercover' }
  return { status: 'ongoing' }
})

function winnerText(w: 'civilian' | 'undercover') {
  return w === 'civilian' ? '平民胜利' : '卧底胜利'
}

const winnerReason = computed(() => {
  if (outcome.value.status !== 'ended') return ''
  return outcome.value.winner === 'civilian' ? '所有卧底已出局' : '卧底人数已不小于平民人数'
})

// Quick verify: touchstart -> progress overlay, touchend -> cancel, finish -> reveal + mark
const quickHoldPos = ref<number | null>(null)
const quickProgress = ref(0)
const quickRevealedPos = ref<number | null>(null)
const quickRevealedRole = ref<Role | null>(null)
let timer: number | null = null
let startAt = 0
const durationMs = 700
let armTimer: number | null = null
let longPressArmed = false
let suppressTapUntil = 0

function canVerify(pos: number) {
  if (!session.value) return false
  if (session.value.verdicts[String(pos)]) return false
  return true
}

function clearTimer() {
  if (timer !== null) {
    clearInterval(timer)
    timer = null
  }
}

function clearArmTimer() {
  if (armTimer !== null) {
    clearTimeout(armTimer)
    armTimer = null
  }
}

function cancel() {
  clearTimer()
  clearArmTimer()
  quickHoldPos.value = null
  quickProgress.value = 0
  longPressArmed = false
}

function reveal(pos: number) {
  if (!session.value) return
  const card = session.value.cards[pos - 1]
  if (!card) return
  quickRevealedPos.value = pos
  quickRevealedRole.value = card.role
  game.setVerdict(pos, card.role)
  setTimeout(() => {
    if (quickRevealedPos.value === pos) {
      quickRevealedPos.value = null
      quickRevealedRole.value = null
    }
  }, 900)
}

function startHold(pos: number) {
  // Always start tracking touch; if already verified, treat as tap to open forget sheet on release.
  if (Date.now() < suppressTapUntil) return
  quickHoldPos.value = pos
  quickProgress.value = 0
  longPressArmed = false
  cancel()
  quickHoldPos.value = pos

  clearArmTimer()
  armTimer = setTimeout(() => {
    if (quickHoldPos.value !== pos) return
    if (!canVerify(pos)) return
    longPressArmed = true
    startAt = Date.now()
    clearTimer()
    timer = setInterval(() => {
      if (quickHoldPos.value !== pos) return
      const p = (Date.now() - startAt) / durationMs
      quickProgress.value = Math.max(0, Math.min(1, p))
      if (quickProgress.value >= 1) {
        clearTimer()
        suppressTapUntil = Date.now() + 800
        cancel()
        reveal(pos)
      }
    }, 16) as unknown as number
  }, 140) as unknown as number
}

function endHold(pos: number) {
  const wasArmed = longPressArmed
  const can = canVerify(pos)
  cancel()
  // Not armed => treat as tap for forgot-word sheet (低频)
  if (!wasArmed && Date.now() >= suppressTapUntil) {
    openSheet(pos)
  }
  // Armed but cannot verify => also open forget sheet (already verified)
  if (wasArmed && !can && Date.now() >= suppressTapUntil) {
    openSheet(pos)
  }
}

// Forgot-word sheet (tap)
const sheetPos = ref<number | null>(null)
const wordVisible = ref(false)
let wordTimer: number | null = null
const wordHoldMs = 600

const sheetCard = computed(() => {
  if (!session.value || !sheetPos.value) return null
  return session.value.cards[sheetPos.value - 1] ?? null
})

function openSheet(pos: number) {
  sheetPos.value = pos
  wordVisible.value = false
}

function closeSheet() {
  sheetPos.value = null
  wordVisible.value = false
  if (wordTimer !== null) {
    clearTimeout(wordTimer)
    wordTimer = null
  }
}

function wordDown() {
  wordVisible.value = false
  if (wordTimer !== null) clearTimeout(wordTimer)
  wordTimer = setTimeout(() => {
    wordVisible.value = true
  }, wordHoldMs) as unknown as number
}

function wordUp() {
  wordVisible.value = false
  if (wordTimer !== null) {
    clearTimeout(wordTimer)
    wordTimer = null
  }
}

function newRound() {
  game.startNewSession()
  uni.redirectTo({ url: '/pages/reveal/index?pos=1' })
}

onBeforeUnmount(() => {
  cancel()
  closeSheet()
})
</script>

<template>
  <view class="page" v-if="session">
    <view class="card" v-if="outcome.status === 'ended'">
      <view class="win" :class="outcome.winner === 'undercover' ? 'u' : 'c'">
        <text class="winTitle">{{ winnerText(outcome.winner) }}</text>
        <text class="winSub">游戏结束：{{ winnerReason }}</text>
        <text class="winHint">你可以直接宣布胜利，并开始下一局。</text>
      </view>
    </view>
    <view class="card" v-else>
      <text class="title">房主模式</text>
      <text class="sub">长按玩家格子快捷查验（一次性）；轻点格子可进入忘词回看。</text>
    </view>

    <view class="card">
      <view class="meta">
        <text class="tag">玩家：{{ session.config.numPlayers }}</text>
        <text class="tag">卧底：{{ session.config.undercoverCount }}</text>
      </view>
    </view>

    <view class="card">
      <text class="section">投票查验</text>
      <view class="grid">
        <view
          v-for="p in positions"
          :key="p"
          class="tile"
          @touchstart.prevent="startHold(p)"
          @touchend.prevent="endHold(p)"
          @touchcancel.prevent="endHold(p)"
        >
          <text class="tileText">第 {{ p }} 位</text>
          <text class="badge" v-if="verdictFor(p)" :class="verdictFor(p) === '卧底' ? 'u' : 'c'">{{ verdictFor(p) }}</text>
          <text class="badge muted" v-else>未查验</text>

          <view v-if="quickHoldPos === p && canVerify(p)" class="holdCanvas">
            <view class="holdFill" :style="{ transform: `scaleY(${quickProgress})` }" />
            <view class="holdText">
              <text class="holdMain">正在查验…</text>
              <text class="holdSub">松手取消</text>
            </view>
          </view>

          <view v-if="quickRevealedPos === p && quickRevealedRole" class="result">
            <text class="resultTag" :class="quickRevealedRole === 'undercover' ? 'u' : 'c'">
              {{ quickRevealedRole === 'undercover' ? '卧底' : '平民' }}
            </text>
          </view>
        </view>
      </view>
      <text class="hint">轻点格子：忘词回看（把手机交给本人）。</text>
    </view>

    <view class="more">
      <button class="moreBtn" hover-class="btnHover" @click="newRound">同设置再发一局</button>
    </view>

    <view v-if="sheetPos && sheetCard" class="sheetRoot">
      <view class="backdrop" @click="closeSheet" />
      <view class="sheet">
        <view class="sheetHeader">
          <text class="sheetTitle">忘词回看：第 {{ sheetPos }} 位</text>
          <text class="sheetClose" @click="closeSheet">关闭</text>
        </view>
        <text class="sub">把手机交给本人：长按揭晓，松开隐藏。</text>
        <view class="wordCard">
          <text class="label">你的词</text>
          <text class="word" v-if="wordVisible">{{ sheetCard.word }}</text>
          <text class="mask" v-else>••••••</text>
        </view>
        <button class="primary" @touchstart.prevent="wordDown" @touchend.prevent="wordUp" @touchcancel.prevent="wordUp">
          按住揭晓（松开隐藏）
        </button>
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
.win {
  border-radius: 20rpx;
  padding: 18rpx;
}
.win.c {
  background: rgba(7, 193, 96, 0.1);
}
.win.u {
  background: rgba(250, 81, 81, 0.1);
}
.winTitle {
  font-size: 40rpx;
  font-weight: 900;
  color: #111;
}
.winSub {
  display: block;
  margin-top: 10rpx;
  font-size: 26rpx;
  color: #333;
}
.winHint {
  display: block;
  margin-top: 6rpx;
  font-size: 22rpx;
  color: #666;
}
.meta {
  display: flex;
  gap: 14rpx;
}
.tag {
  padding: 8rpx 16rpx;
  border-radius: 999rpx;
  background: #f2f3f5;
  font-size: 24rpx;
  color: #333;
}
.section {
  font-size: 28rpx;
  font-weight: 700;
  color: #111;
  margin-bottom: 12rpx;
  display: block;
}
.grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 18rpx;
}
.tile {
  position: relative;
  overflow: hidden;
  border-radius: 20rpx;
  padding: 20rpx;
  background: #f7f8fa;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.tileText {
  font-size: 28rpx;
  font-weight: 700;
  color: #111;
}
.badge {
  font-size: 24rpx;
  padding: 6rpx 14rpx;
  border-radius: 999rpx;
  background: #fff;
}
.badge.muted {
  color: #888;
}
.badge.u {
  color: #fa5151;
}
.badge.c {
  color: #07c160;
}
.holdCanvas {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.18);
  display: grid;
  place-items: center;
}
.holdFill {
  position: absolute;
  inset: 0;
  transform-origin: bottom;
  background: linear-gradient(180deg, rgba(7, 193, 96, 0.65), rgba(0, 0, 0, 0));
}
.holdText {
  position: relative;
  z-index: 1;
  background: rgba(0, 0, 0, 0.25);
  padding: 12rpx 18rpx;
  border-radius: 18rpx;
  color: #fff;
  text-align: center;
}
.holdMain {
  font-size: 28rpx;
  font-weight: 800;
}
.holdSub {
  display: block;
  margin-top: 4rpx;
  font-size: 22rpx;
  opacity: 0.9;
}
.result {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.25);
  display: grid;
  place-items: center;
}
.resultTag {
  padding: 12rpx 20rpx;
  border-radius: 999rpx;
  color: #fff;
  font-size: 32rpx;
  font-weight: 900;
}
.resultTag.u {
  background: #fa5151;
}
.resultTag.c {
  background: #07c160;
}
.hint {
  display: block;
  margin-top: 12rpx;
  font-size: 22rpx;
  color: #999;
}
.more {
  margin-top: auto;
  opacity: 0.5;
}
.moreBtn {
  background: #f2f3f5;
  border-radius: 20rpx;
  font-size: 28rpx;
  font-weight: 700;
  color: #111;
}
.btnHover {
  opacity: 0.92;
}
.sheetRoot {
  position: fixed;
  inset: 0;
  z-index: 50;
}
.backdrop {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
}
.sheet {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  background: #fff;
  border-top-left-radius: 24rpx;
  border-top-right-radius: 24rpx;
  padding: 24rpx;
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}
.sheetHeader {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.sheetTitle {
  font-size: 30rpx;
  font-weight: 800;
  color: #111;
}
.sheetClose {
  font-size: 26rpx;
  color: #666;
}
.wordCard {
  border-radius: 24rpx;
  padding: 24rpx;
  background: #f7f8fa;
  text-align: center;
}
.label {
  font-size: 24rpx;
  color: #666;
}
.word {
  display: block;
  margin-top: 12rpx;
  font-size: 64rpx;
  font-weight: 900;
  color: #111;
}
.mask {
  display: block;
  margin-top: 12rpx;
  font-size: 64rpx;
  font-weight: 900;
  color: #bbb;
}
.primary {
  background: #07c160;
  color: #fff;
  border-radius: 20rpx;
  font-size: 32rpx;
  font-weight: 700;
}
</style>
