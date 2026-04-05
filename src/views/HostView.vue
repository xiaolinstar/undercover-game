<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useGameStore } from '@/stores/game'
import type { Role } from '@/types/game'

const router = useRouter()
const game = useGameStore()
const session = computed(() => game.session)

onMounted(() => {
  if (!game.session) router.replace('/setup')
})

const positions = computed(() => {
  if (!session.value) return []
  return Array.from({ length: session.value.config.numPlayers }, (_, i) => i + 1)
})

function redeal() {
  game.startNewSession()
  router.push('/reveal/1')
}

function newGame() {
  game.resetSession()
  router.push('/setup')
}

function confirmRedeal() {
  const ok = window.confirm('确定要同设置再发一局吗？当前局的查验记录将丢失。')
  if (!ok) return
  redeal()
}

function confirmNewGame() {
  const ok = window.confirm('确定要开新局并修改设置吗？当前局将结束。')
  if (!ok) return
  newGame()
}

const activePos = ref<number | null>(null)
const mode = ref<'verify' | 'forget'>('verify')

const activeCard = computed(() => {
  if (!session.value || !activePos.value) return null
  return session.value.cards[activePos.value - 1] ?? null
})

const activeAccent = computed(() => {
  const palette = ['#2f7cf6', '#12b981', '#f97316', '#a855f7', '#ef4444', '#06b6d4', '#f59e0b', '#22c55e']
  const idx = Math.max(0, (activePos.value ?? 1) - 1) % palette.length
  return palette[idx]!
})

function openSheet(pos: number) {
  activePos.value = pos
  mode.value = 'verify'
  onPressUp()
}

const quickHoldPos = ref<number | null>(null)
const quickProgress = ref(0)
const quickRevealedPos = ref<number | null>(null)
const quickRevealedRole = ref<Role | null>(null)
let quickRaf: number | null = null
let quickStartAt = 0
const quickDurationMs = 700
let suppressClickUntil = 0
let revealHideTimer: number | null = null
let heldPointerId: number | null = null
let heldDownAt = 0
let armTimer: number | null = null
let longPressArmed = false

function stopQuickAnimation() {
  if (quickRaf !== null) {
    cancelAnimationFrame(quickRaf)
    quickRaf = null
  }
}

function clearRevealHideTimer() {
  if (revealHideTimer !== null) {
    window.clearTimeout(revealHideTimer)
    revealHideTimer = null
  }
}

function clearArmTimer() {
  if (armTimer !== null) {
    window.clearTimeout(armTimer)
    armTimer = null
  }
}

function hideQuickRevealSoon() {
  clearRevealHideTimer()
  revealHideTimer = window.setTimeout(() => {
    quickRevealedPos.value = null
    quickRevealedRole.value = null
  }, 900)
}

function cancelQuickVerify() {
  stopQuickAnimation()
  clearArmTimer()
  quickHoldPos.value = null
  quickProgress.value = 0
  heldPointerId = null
  longPressArmed = false
}

function completeQuickVerify(pos: number) {
  if (!session.value) return
  const card = session.value.cards[pos - 1]
  if (!card) return

  quickRevealedPos.value = pos
  quickRevealedRole.value = card.role
  game.setVerdict(pos, card.role)
  hideQuickRevealSoon()
  cancelQuickVerify()
}

function canQuickVerify(pos: number) {
  if (!session.value) return false
  if (pos < 1 || pos > session.value.config.numPlayers) return false
  if (activePos.value) return false
  if (session.value.verdicts[String(pos)]) return false // already verified: no second verify
  return true
}

function startQuickVerify(pos: number, e: PointerEvent) {
  if (!session.value) return

  heldDownAt = Date.now()
  longPressArmed = false
  quickHoldPos.value = pos
  quickProgress.value = 0
  heldPointerId = e.pointerId
  suppressClickUntil = 0

  try {
    ;(e.currentTarget as HTMLElement | null)?.setPointerCapture?.(e.pointerId)
  } catch {
    // ignore
  }

  if (!canQuickVerify(pos)) return

  clearArmTimer()
  armTimer = window.setTimeout(() => {
    if (quickHoldPos.value !== pos) return
    longPressArmed = true
    suppressClickUntil = Date.now() + 900
    quickStartAt = performance.now()
    stopQuickAnimation()
    const tick = () => {
      if (quickHoldPos.value !== pos) return
      const elapsed = performance.now() - quickStartAt
      quickProgress.value = Math.max(0, Math.min(1, elapsed / quickDurationMs))
      if (quickProgress.value >= 1) {
        completeQuickVerify(pos)
        return
      }
      quickRaf = requestAnimationFrame(tick)
    }
    quickRaf = requestAnimationFrame(tick)
  }, 140)
}

function endQuickVerify(e?: PointerEvent) {
  if (heldPointerId !== null && e && e.pointerId !== heldPointerId) return
  const pos = quickHoldPos.value
  const wasArmed = longPressArmed
  cancelQuickVerify()
  if (wasArmed) suppressClickUntil = Date.now() + 900
}

function closeSheet() {
  activePos.value = null
  mode.value = 'verify'
  onPressUp()
}

watch(activePos, () => onPressUp())
watch(mode, () => onPressUp())
watch(activePos, (v) => {
  if (v) cancelQuickVerify()
})

const holdMs = computed(() => (mode.value === 'verify' ? 500 : 600))
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
  }, holdMs.value)
}

function onPressUp() {
  isHolding.value = false
  isVisible.value = false
  clearHoldTimer()
}

function roleText(role: Role) {
  return role === 'undercover' ? '卧底' : '平民'
}

watch(isVisible, (v) => {
  if (!v) return
  if (mode.value !== 'verify') return
  if (!activeCard.value) return
  // v1: no undo; once revealed, persist the verdict onto the grid.
  game.setVerdict(activeCard.value.pos, activeCard.value.role)
})

function verdictFor(pos: number) {
  const role = session.value?.verdicts[String(pos)]
  return role ? roleText(role) : null
}

const activeVerdict = computed(() => {
  if (!session.value || !activePos.value) return null
  return session.value.verdicts[String(activePos.value)] ?? null
})

function onTileClick(pos: number) {
  if (Date.now() < suppressClickUntil) return
  openSheet(pos)
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

onBeforeUnmount(() => onPressUp())
</script>

<template>
  <div class="page" v-if="session">
    <div class="stack">
      <div class="title">发牌完成（房主模式）</div>
      <div class="muted">线下描述与投票阶段。手机建议由房主持有。</div>
    </div>

    <div v-if="outcome.status === 'ended'" class="card stack outcome ended">
      <div style="font-weight: 900; font-size: 18px">{{ winnerText(outcome.winner) }}</div>
      <div class="muted">游戏结束：可以宣布胜利。下一局操作在页面底部「更多操作」里。</div>
    </div>
    <div v-else class="card stack outcome">
      <div style="font-weight: 800">游戏继续</div>
      <div class="muted">完成一次查验后，进入下一轮描述与投票。</div>
    </div>

    <div class="card stack">
      <div class="row">
        <div style="font-weight: 650">玩家人数</div>
        <div class="pill">{{ session.config.numPlayers }} 人</div>
      </div>
      <div class="row">
        <div style="font-weight: 650">卧底人数</div>
        <div class="pill">{{ session.config.undercoverCount }} 人</div>
      </div>
      <div class="muted">提示：查验身份只显示「平民/卧底」，不会显示词。</div>
    </div>

    <div class="card stack">
      <div style="font-weight: 650">玩家面板（查验 / 忘词）</div>
      <div class="muted">长按格子快捷查验（进度条完成才揭晓）；单击打开弹层（查验/忘词）。</div>
      <div class="grid">
        <button
          v-for="p in positions"
          :key="p"
          class="posBtn"
          type="button"
          @pointerdown.prevent="startQuickVerify(p, $event)"
          @pointerup.prevent="endQuickVerify($event)"
          @pointercancel.prevent="endQuickVerify($event)"
          @pointerleave.prevent="endQuickVerify($event)"
          @contextmenu.prevent
          @click="onTileClick(p)"
        >
          <span>第 {{ p }} 位</span>
          <span v-if="verdictFor(p)" class="badge" :class="verdictFor(p) === '卧底' ? 'u' : 'c'">
            {{ verdictFor(p) }}
          </span>
          <span v-else class="badge">未查验</span>

          <div
            v-if="quickHoldPos === p && !verdictFor(p) && canQuickVerify(p)"
            class="holdCanvas"
            aria-hidden="true"
          >
            <div class="holdFill" :style="{ transform: `scaleY(${quickProgress})` }" />
            <div class="holdText">
              <div style="font-weight: 900">正在查验…</div>
              <div class="muted" style="opacity: 0.9">松手取消</div>
            </div>
          </div>

          <div v-if="quickRevealedPos === p && quickRevealedRole" class="quickResult" aria-hidden="true">
            <div class="quickResultInner" :class="quickRevealedRole === 'undercover' ? 'u' : 'c'">
              {{ quickRevealedRole === 'undercover' ? '卧底' : '平民' }}
            </div>
          </div>
        </button>
      </div>
    </div>

    <details class="card" style="margin-top: auto; padding: 10px">
      <summary class="muted" style="cursor: pointer">更多操作</summary>
      <div class="stack" style="margin-top: 10px">
        <button class="btn danger" type="button" @click="confirmRedeal">同设置再发一局</button>
        <button class="btn" type="button" @click="confirmNewGame">开新局（修改设置）</button>
      </div>
    </details>

    <div v-if="activePos && activeCard" class="sheetRoot" @keydown.esc="closeSheet">
      <div class="backdrop" @click="closeSheet" />
      <div class="sheet" role="dialog" aria-modal="true">
        <div class="sheetHeader">
          <div style="font-weight: 800">第 {{ activePos }} 位</div>
          <button class="xBtn" type="button" @click="closeSheet">关闭</button>
        </div>

        <div class="sheetTabs">
          <button class="tab" :class="{ active: mode === 'verify' }" type="button" @click="mode = 'verify'">
            身份查验
          </button>
          <button class="tab" :class="{ active: mode === 'forget' }" type="button" @click="mode = 'forget'">
            忘词回看
          </button>
        </div>

        <div v-if="mode === 'verify'" class="muted" style="margin-top: 6px">
          <template v-if="activeVerdict">
            已查验：{{ roleText(activeVerdict) }}（一期不支持撤销/改位）。
          </template>
          <template v-else>长按揭晓身份（只显示平民/卧底，不显示词）。揭晓后会自动在格子上标记结果。</template>
        </div>
        <div v-else class="muted" style="margin-top: 6px">
          把手机交给本人：长按揭晓词语，松开隐藏。不会显示身份。
        </div>

        <div class="flipStage" :style="{ '--accent': activeAccent }">
          <div class="flipCard" :class="{ revealed: isVisible }">
            <div class="face front card stack center">
              <div class="muted">{{ mode === 'verify' ? '查验对象' : '轮到你了' }}</div>
              <div class="big-number" style="margin: 6px 0 2px">{{ activePos }}</div>
              <div class="pill">按住下方按钮揭晓</div>
            </div>
            <div class="face back card stack center">
              <div class="muted">{{ mode === 'verify' ? '结果' : '你的词' }}</div>
              <div class="word">
                <template v-if="mode === 'verify'">{{ roleText(activeCard.role) }}</template>
                <template v-else>{{ activeCard.word }}</template>
              </div>
              <div class="pill">{{ mode === 'verify' ? '不显示词语' : '松开立即隐藏' }}</div>
            </div>
          </div>
        </div>

        <button
          class="btn primary"
          type="button"
          :disabled="mode === 'verify' && !!activeVerdict"
          @pointerdown.prevent="mode === 'verify' && activeVerdict ? undefined : onPressDown"
          @pointerup.prevent="onPressUp"
          @pointercancel.prevent="onPressUp"
          @pointerleave.prevent="onPressUp"
          @contextmenu.prevent
        >
          {{
            mode === 'verify'
              ? activeVerdict
                ? '已查验（无需重复）'
                : '按住查验（松开隐藏）'
              : '按住揭晓（松开隐藏）'
          }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.posBtn {
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  border: 1px solid var(--color-border);
  background: var(--color-background);
  color: var(--color-text);
  border-radius: 14px;
  padding: 12px 12px;
  font-weight: 650;
}

.posBtn:active {
  transform: translateY(1px);
}

.badge {
  font-size: 12px;
  opacity: 0.85;
  border: 1px solid var(--color-border);
  border-radius: 999px;
  padding: 2px 8px;
  background: color-mix(in oklab, var(--color-background-mute) 92%, transparent);
}

.badge.u {
  border-color: color-mix(in oklab, #ef4444 40%, var(--color-border));
  background: color-mix(in oklab, #ef4444 14%, var(--color-background-mute));
}

.badge.c {
  border-color: color-mix(in oklab, #2f7cf6 40%, var(--color-border));
  background: color-mix(in oklab, #2f7cf6 14%, var(--color-background-mute));
}

.holdCanvas {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  background: rgba(0, 0, 0, 0.18);
  backdrop-filter: blur(2px);
}

.holdFill {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  top: 0;
  transform-origin: bottom;
  background: linear-gradient(180deg, color-mix(in oklab, #12b981 70%, transparent), color-mix(in oklab, #2f7cf6 80%, transparent));
}

.holdText {
  position: relative;
  z-index: 1;
  color: white;
  text-align: center;
  padding: 10px 12px;
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.18);
  background: rgba(0, 0, 0, 0.25);
}

.quickResult {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  background: rgba(0, 0, 0, 0.25);
  backdrop-filter: blur(6px);
  animation: fadeIn 120ms ease;
}

.quickResultInner {
  border-radius: 999px;
  padding: 10px 18px;
  font-size: 18px;
  font-weight: 900;
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.22);
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.25);
}

.quickResultInner.u {
  background: #ef4444;
}

.quickResultInner.c {
  background: #2f7cf6;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.outcome {
  border-width: 2px;
  border-color: color-mix(in oklab, #2f7cf6 18%, var(--color-border));
}

.outcome.ended {
  border-color: color-mix(in oklab, #ef4444 22%, var(--color-border));
  background: color-mix(in oklab, #ef4444 6%, var(--color-background-soft));
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
  padding: 14px;
  border-top-left-radius: 18px;
  border-top-right-radius: 18px;
  background: var(--color-background);
  border-top: 1px solid var(--color-border);
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.sheetHeader {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.xBtn {
  border: 1px solid var(--color-border);
  background: var(--color-background);
  color: var(--color-text);
  border-radius: 12px;
  padding: 6px 10px;
  font-size: 13px;
}

.sheetTabs {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.tab {
  border: 1px solid var(--color-border);
  background: var(--color-background);
  color: var(--color-text);
  border-radius: 12px;
  padding: 10px 12px;
  font-weight: 650;
}

.tab.active {
  border-color: color-mix(in oklab, #2f7cf6 35%, var(--color-border));
  background: color-mix(in oklab, #2f7cf6 10%, var(--color-background));
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
