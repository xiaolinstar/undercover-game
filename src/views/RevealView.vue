<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch, watchEffect } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useGameStore } from '@/stores/game'

const route = useRoute()
const router = useRouter()
const game = useGameStore()

const pos = computed(() => {
  const raw = Array.isArray(route.params.pos) ? route.params.pos[0] : route.params.pos
  const n = Number.parseInt(String(raw ?? ''), 10)
  return Number.isFinite(n) ? n : 0
})

const session = computed(() => game.session)
const card = computed(() => session.value?.cards[pos.value - 1] ?? null)

watchEffect(() => {
  if (!session.value) router.replace('/setup')
  if (session.value && (pos.value < 1 || pos.value > session.value.config.numPlayers)) router.replace('/reveal/1')
})

const palette = [
  '#2f7cf6',
  '#12b981',
  '#f97316',
  '#a855f7',
  '#ef4444',
  '#06b6d4',
  '#f59e0b',
  '#22c55e',
  '#3b82f6',
  '#ec4899',
  '#10b981',
  '#8b5cf6',
]

const accent = computed(() => {
  if (!session.value) return palette[0]
  const idx = Math.max(0, pos.value - 1) % palette.length
  return palette[idx]!
})

watch(
  () => pos.value,
  () => {
    onPressUp()
  },
)

const holdMs = 600
const isVisible = ref(false)
const isHolding = ref(false)
let holdTimer: number | null = null

function clearHoldTimer() {
  if (holdTimer !== null) {
    window.clearTimeout(holdTimer)
    holdTimer = null
  }
}

function onPressDown() {
  isHolding.value = true
  isVisible.value = false
  clearHoldTimer()
  holdTimer = window.setTimeout(() => {
    if (isHolding.value) isVisible.value = true
  }, holdMs)
}

function onPressUp() {
  isHolding.value = false
  isVisible.value = false
  clearHoldTimer()
}

function next() {
  isVisible.value = false
  onPressUp()
  if (!session.value) return
  const nextPos = pos.value + 1
  if (nextPos > session.value.config.numPlayers) router.push('/host')
  else router.push(`/reveal/${nextPos}`)
}

function exitAndRestart() {
  const ok = window.confirm('确定要退出并重开吗？当前发牌将作废。')
  if (!ok) return
  router.push('/setup')
}

onBeforeUnmount(() => onPressUp())
</script>

<template>
  <div class="page" v-if="session && card">
    <div class="stack">
      <div class="title">第 {{ card.pos }} 位玩家</div>
      <div class="muted">长按约 0.6 秒揭晓，松开自动隐藏。不会显示身份（卧底/平民）。</div>
    </div>

    <div class="flipStage" :style="{ '--accent': accent }">
      <div class="flipCard" :class="{ revealed: isVisible }">
        <div class="face front card stack center">
          <div class="muted">轮到你了</div>
          <div class="big-number" style="margin: 6px 0 2px">{{ card.pos }}</div>
          <div class="pill">按住下方按钮揭晓</div>
        </div>
        <div class="face back card stack center">
          <div class="muted">你的词</div>
          <div class="word">{{ card.word }}</div>
          <div class="pill">松开立即隐藏</div>
        </div>
      </div>
    </div>

    <button
      class="btn primary holdBtn"
      type="button"
      @pointerdown.prevent="onPressDown"
      @pointerup.prevent="onPressUp"
      @pointercancel.prevent="onPressUp"
      @pointerleave.prevent="onPressUp"
      @touchstart.prevent="onPressDown"
      @touchend.prevent="onPressUp"
      @touchcancel.prevent="onPressUp"
      @contextmenu.prevent
    >
      按住揭晓（松开隐藏）
    </button>

    <div style="margin-top: auto" class="stack">
      <button class="btn" type="button" @click="next">我已记住，交给下一位</button>
      <details class="card" style="padding: 10px">
        <summary class="muted" style="cursor: pointer">更多</summary>
        <div class="stack" style="margin-top: 10px">
          <button class="btn inline danger" type="button" @click="exitAndRestart">退出并重开</button>
        </div>
      </details>
    </div>
  </div>
</template>

<style scoped>
.holdBtn {
  -webkit-touch-callout: none;
  -webkit-user-select: none;
  user-select: none;
  -webkit-tap-highlight-color: transparent;
  touch-action: none;
}

.flipStage {
  perspective: 1200px;
}

.flipCard {
  position: relative;
  transform-style: preserve-3d;
  transition: transform 240ms ease;
}

.flipCard,
.face {
  min-height: 220px;
}

.flipCard.revealed {
  transform: rotateY(180deg);
}

.face {
  backface-visibility: hidden;
  border-color: color-mix(in oklab, var(--accent) 30%, var(--color-border));
}

.front {
  border-width: 2px;
  background: color-mix(in oklab, var(--accent) 8%, var(--color-background-soft));
}

.back {
  position: absolute;
  inset: 0;
  transform: rotateY(180deg);
  border-width: 2px;
  background: color-mix(in oklab, var(--accent) 10%, var(--color-background-soft));
}

.word {
  font-size: 36px;
  font-weight: 900;
  letter-spacing: 1px;
  padding: 10px 0;
  user-select: none;
}
</style>
