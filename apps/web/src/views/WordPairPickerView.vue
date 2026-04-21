<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useGameStore } from '@/stores/game'
import { useWordPairsStore } from '@/stores/wordPairs'

const router = useRouter()
const game = useGameStore()
const wordPairs = useWordPairsStore()

const q = ref('')

const currentId = computed(() => game.config.wordPairId)
const difficultyText: Record<string, string> = {
  easy: '简单',
  medium: '中等',
  hard: '困难',
}

const filteredPairs = computed(() => {
  const query = q.value.trim()
  const pairs = wordPairs.availablePairs
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
const errorText = ref('')

function select(id: string) {
  game.setWordPairId(id)
  router.back()
}

function addCustomPair() {
  const created = wordPairs.addCustomPair(civilianInput.value, undercoverInput.value, labelInput.value)
  if (!created) {
    errorText.value = '自定义词对不能为空。'
    return
  }
  civilianInput.value = ''
  undercoverInput.value = ''
  labelInput.value = ''
  errorText.value = ''
  select(created.id)
}

function removeCustomPair(id: string) {
  if (currentId.value === id) game.setWordPairId('random')
  wordPairs.removeCustomPair(id)
}
</script>

<template>
  <div class="page">
    <div class="stack">
      <div class="title">选择词对</div>
      <div class="muted">建议用「随机抽取」，每局更有新鲜感。</div>
    </div>

    <div class="card stack">
      <input v-model="q" class="input" inputmode="search" placeholder="搜索：火锅 / 麻辣烫 / 吃的…" />
    </div>

    <div class="card stack">
      <button class="pickBtn" type="button" :class="{ active: currentId === 'random' }" @click="select('random')">
        <div style="font-weight: 800">随机抽取（推荐）</div>
        <div class="muted">优先中等难度词对，并尽量避开最近几局已出现的词</div>
      </button>

      <div class="divider" />

      <button
        v-for="p in filteredPairs"
        :key="p.id"
        class="pickBtn"
        type="button"
        :class="{ active: currentId === p.id }"
        @click="select(p.id)"
      >
        <div class="titleRow">
          <div style="font-weight: 800">
            {{ p.label ? `【${p.label}】` : '' }}{{ p.civilian }} / {{ p.undercover }}
          </div>
          <span class="difficultyBadge">{{ difficultyText[p.difficulty] ?? '中等' }}</span>
        </div>
        <div class="muted" v-if="p.source === 'custom'">我的自定义</div>
      </button>
    </div>

    <details class="card" style="padding: 12px">
      <summary style="font-weight: 650; cursor: pointer">添加自定义词对</summary>
      <div class="stack" style="margin-top: 10px">
        <input v-model="civilianInput" class="input" inputmode="text" placeholder="平民词（例如：火锅）" />
        <input v-model="undercoverInput" class="input" inputmode="text" placeholder="卧底词（例如：麻辣烫）" />
        <input v-model="labelInput" class="input" inputmode="text" placeholder="可选标签（例如：吃的）" />
        <button class="btn" type="button" @click="addCustomPair">添加并选中</button>
        <div v-if="errorText" class="muted" style="color: #e5484d; opacity: 1">{{ errorText }}</div>
      </div>
    </details>

    <details v-if="wordPairs.customPairs.length" class="card" style="padding: 12px">
      <summary style="font-weight: 650; cursor: pointer">管理自定义词对</summary>
      <div class="stack" style="margin-top: 10px">
        <div v-for="p in wordPairs.customPairs" :key="p.id" class="row" style="align-items: flex-start">
          <div style="flex: 1; font-size: 14px">
            {{ p.label ? `【${p.label}】` : '' }}{{ p.civilian }} / {{ p.undercover }}
          </div>
          <button class="btn inline danger" type="button" @click="removeCustomPair(p.id)">删除</button>
        </div>
      </div>
    </details>

    <div style="margin-top: auto" class="stack">
      <button class="btn" type="button" @click="router.back()">返回</button>
    </div>
  </div>
</template>

<style scoped>
.pickBtn {
  width: 100%;
  text-align: left;
  border: 1px solid var(--color-border);
  background: var(--color-background);
  color: var(--color-text);
  border-radius: 14px;
  padding: 12px 12px;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.pickBtn.active {
  border-color: color-mix(in oklab, #2f7cf6 40%, var(--color-border));
  background: color-mix(in oklab, #2f7cf6 10%, var(--color-background));
}

.divider {
  height: 1px;
  background: var(--color-border);
  margin: 6px 0;
}

.titleRow {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.difficultyBadge {
  flex-shrink: 0;
  font-size: 11px;
  line-height: 1;
  padding: 5px 8px;
  border-radius: 999px;
  color: color-mix(in oklab, var(--color-text) 48%, transparent);
  background: color-mix(in oklab, var(--color-background-mute) 72%, transparent);
  border: 1px solid color-mix(in oklab, var(--color-border) 70%, transparent);
}
</style>
