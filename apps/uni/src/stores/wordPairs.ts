import { defineStore } from 'pinia'
import { builtinWordPairs } from '@/data/wordPairs'
import { randomInt } from '@/lib/random'
import { readJson, writeJson } from '@/lib/storage'
import type { WordPair } from '@/types/game'

const STORAGE_KEY = 'undercover.mp.wordPairs.v1'

type WordPairsState = {
  customPairs: WordPair[]
}

function normalize(text: string) {
  return text.trim().replace(/\s+/g, ' ')
}

function makeCustomId() {
  const ts = Date.now().toString(36)
  const r = randomInt(1_000_000).toString(36)
  return `c-${ts}-${r}`
}

export const useWordPairsStore = defineStore('wordPairs', {
  state: (): WordPairsState => {
    const stored = readJson<WordPairsState>(STORAGE_KEY)
    return {
      customPairs: stored?.customPairs ?? [],
    }
  },
  getters: {
    allPairs(state): WordPair[] {
      return [...builtinWordPairs, ...state.customPairs]
    },
  },
  actions: {
    persist() {
      writeJson(STORAGE_KEY, { customPairs: this.customPairs })
    },
    addCustomPair(civilianRaw: string, undercoverRaw: string, labelRaw?: string) {
      const civilian = normalize(civilianRaw)
      const undercover = normalize(undercoverRaw)
      const label = labelRaw ? normalize(labelRaw) : undefined
      if (!civilian || !undercover) return null

      const pair: WordPair = {
        id: makeCustomId(),
        civilian,
        undercover,
        label,
        source: 'custom',
      }
      this.customPairs = [pair, ...this.customPairs]
      this.persist()
      return pair
    },
    removeCustomPair(id: string) {
      this.customPairs = this.customPairs.filter((p) => p.id !== id)
      this.persist()
    },
    getPairById(id: string) {
      return this.allPairs.find((p) => p.id === id) ?? null
    },
    getRandomPair() {
      const pairs = this.allPairs
      if (pairs.length === 0) return null
      return pairs[randomInt(pairs.length)] ?? null
    },
  },
})

