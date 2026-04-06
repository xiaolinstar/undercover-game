<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useGameStore } from '@/stores/game'
import { useWordPairsStore } from '@/stores/wordPairs'

const router = useRouter()
const game = useGameStore()
const wordPairs = useWordPairsStore()

const errorText = ref<string>('')

const numPlayers = computed({
  get: () => game.config.numPlayers,
  set: (v: number) => game.setNumPlayers(v),
})

const wordPairId = computed({
  get: () => game.config.wordPairId,
  set: (v: string) => game.setWordPairId(v),
})

const undercoverCount = computed(() => game.undercoverCount)

const selectedPairPreview = computed(() => {
  if (wordPairId.value === 'random') return null
  return wordPairs.getPairById(wordPairId.value)
})

function decPlayers() {
  numPlayers.value = Math.max(4, numPlayers.value - 1)
}

function incPlayers() {
  numPlayers.value = Math.min(20, numPlayers.value + 1)
}

function goPickWords() {
  router.push('/words')
}

function start() {
  errorText.value = ''
  const session = game.startNewSession()
  if (!session) {
    errorText.value = '词库为空或选择无效，请先选择/添加一个词对。'
    return
  }
  router.push('/reveal/1')
}
</script>

<template>
  <div class="page">
    <div class="stack">
      <div class="title">谁是卧底 · 发牌器</div>
      <div class="muted">快速开局，手机逐个传递查看。</div>
    </div>

    <div class="card heroCard stack center" style="padding: 18px">
      <div class="muted" style="opacity: 0.9">玩家人数</div>
      <div class="row" style="justify-content: center; gap: 16px; align-items: flex-end">
        <button class="stepperBtn minus" type="button" @click="decPlayers" aria-label="减少人数">-</button>
        <div class="heroNumber">
          <div class="big-number">{{ numPlayers }}</div>
        </div>
        <button class="stepperBtn plus" type="button" @click="incPlayers" aria-label="增加人数">+</button>
      </div>

      <div class="heroMeta">
        <span class="pill">卧底自动：{{ undercoverCount }} 人</span>
        <span class="pill" style="opacity: 0.65">白板：0 人</span>
      </div>
    </div>

    <div class="card stack">
      <div class="row">
        <div>
          <div style="font-weight: 650">词对</div>
          <div class="muted" v-if="wordPairId === 'random'">随机抽取（推荐）</div>
          <div v-else-if="selectedPairPreview" class="muted">
            {{ selectedPairPreview.label ? `【${selectedPairPreview.label}】` : '' }}{{ selectedPairPreview.civilian }} /
            {{ selectedPairPreview.undercover }}
          </div>
          <div v-else class="muted">未选择</div>
        </div>
        <button class="btn inline pickBtn" type="button" @click="goPickWords">
          选择
          <span class="chev">›</span>
        </button>
      </div>

      <div class="muted" style="font-size: 12px; opacity: 0.7">
        提示：发牌与查验阶段不会在列表里展示词语，避免被旁人看到。
      </div>

      <div v-if="errorText" class="muted" style="color: #e5484d; opacity: 1">{{ errorText }}</div>
    </div>

    <div style="margin-top: auto" class="stack">
      <button class="btn primary" type="button" @click="start">开始发牌</button>
      <div class="muted">开始后将进入逐个查看模式，不会在列表页直接显示词。</div>
    </div>
  </div>
</template>

<style scoped>
.stepperBtn {
  width: 54px;
  height: 54px;
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.18);
  font-size: 28px;
  font-weight: 900;
  line-height: 1;
  display: grid;
  place-items: center;
  user-select: none;
  box-shadow: 0 14px 28px rgba(0, 0, 0, 0.12);
}

.stepperBtn.minus {
  background: linear-gradient(180deg, #ff5a5f, #e5484d);
  color: white;
}

.stepperBtn.plus {
  background: linear-gradient(180deg, #1fd69b, #12b981);
  color: white;
}

.stepperBtn:active {
  transform: translateY(1px);
}

.heroCard {
  border-width: 0;
  background:
    radial-gradient(520px 220px at 50% 0%, rgba(255, 255, 255, 0.7), rgba(255, 255, 255, 0) 60%),
    linear-gradient(180deg, color-mix(in oklab, #2f7cf6 14%, var(--color-background-soft)), var(--color-background-soft));
}

@media (prefers-color-scheme: dark) {
  .heroCard {
    background:
      radial-gradient(520px 220px at 50% 0%, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0) 60%),
      linear-gradient(180deg, color-mix(in oklab, #2f7cf6 18%, var(--color-background-soft)), var(--color-background-soft));
  }
}

.heroNumber {
  display: grid;
  place-items: center;
}

.unit {
  margin-top: 6px;
  font-size: 14px;
  opacity: 0.8;
}

.heroMeta {
  display: flex;
  gap: 10px;
  justify-content: center;
  margin-top: 10px;
}

.pickBtn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.chev {
  font-size: 18px;
  line-height: 1;
  opacity: 0.8;
}
</style>
