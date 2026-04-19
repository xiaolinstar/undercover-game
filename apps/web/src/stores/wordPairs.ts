import { defineStore } from 'pinia'
import { builtinWordPairs } from '@/data/wordPairs'
import { readJson, writeJson } from '@/lib/storage'
import {
  applyWordPairFeedback,
  DEFAULT_RECENT_PAIR_LIMIT,
  markWordPairUsed,
  pickOperationalWordPair,
  withWordPairDefaults,
} from '@undercover/core'
import type { WordPair, WordPairFeedback } from '@/types/game'

const STORAGE_KEY = 'undercover.wordPairs.v1'

type WordPairsState = {
  customPairs: WordPair[]
  builtinMetaById: Record<string, Partial<WordPair>>
  recentPairIds: string[]
}

const HOME_PREVIEW_LIMIT = 6

function normalize(text: string) {
  return text.trim().replace(/\s+/g, ' ')
}

function makeCustomId() {
  const ts = Date.now().toString(36)
  const r = Math.floor(Math.random() * 1_000_000).toString(36)
  return `c-${ts}-${r}`
}

function normalizeCustomPair(pair: Pick<WordPair, 'id' | 'civilian' | 'undercover'> & Partial<WordPair>) {
  return withWordPairDefaults({
    ...pair,
    source: 'custom',
    tags: pair.tags?.length ? pair.tags : pair.label ? [pair.label] : [],
  })
}

function normalizeState(stored?: Partial<WordPairsState> | null): WordPairsState {
  return {
    customPairs: (stored?.customPairs ?? []).map((pair) => normalizeCustomPair(pair)),
    builtinMetaById: stored?.builtinMetaById ?? {},
    recentPairIds: (stored?.recentPairIds ?? []).filter(Boolean).slice(0, DEFAULT_RECENT_PAIR_LIMIT),
  }
}

function mergeBuiltinMeta(pair: WordPair, meta: Partial<WordPair> | undefined) {
  if (!meta) return pair
  return withWordPairDefaults({
    ...pair,
    ...meta,
    source: 'builtin',
  })
}

function pickHomePreviewPairs(pairs: WordPair[]) {
  const activePairs = pairs.filter((pair) => pair.status === 'active')
  const buckets = {
    easy: activePairs.filter((pair) => pair.difficulty === 'easy'),
    medium: activePairs.filter((pair) => pair.difficulty === 'medium'),
    hard: activePairs.filter((pair) => pair.difficulty === 'hard'),
  }

  const picked: WordPair[] = []
  const seenIds = new Set<string>()

  for (const difficulty of ['medium', 'hard', 'easy'] as const) {
    for (const pair of buckets[difficulty].slice(0, 2)) {
      if (seenIds.has(pair.id)) continue
      picked.push(pair)
      seenIds.add(pair.id)
    }
  }

  if (picked.length >= HOME_PREVIEW_LIMIT) return picked.slice(0, HOME_PREVIEW_LIMIT)

  for (const pair of activePairs) {
    if (seenIds.has(pair.id)) continue
    picked.push(pair)
    seenIds.add(pair.id)
    if (picked.length >= HOME_PREVIEW_LIMIT) break
  }

  return picked
}

export const useWordPairsStore = defineStore('wordPairs', {
  state: (): WordPairsState => {
    return normalizeState(readJson<WordPairsState>(STORAGE_KEY))
  },
  getters: {
    allPairs(state): WordPair[] {
      const builtinPairs = builtinWordPairs.map((pair) => mergeBuiltinMeta(pair, state.builtinMetaById[pair.id]))
      return [...builtinPairs, ...state.customPairs]
    },
    availablePairs(): WordPair[] {
      return this.allPairs
        .filter((pair) => pair.status === 'active')
        .sort((a, b) => b.qualityScore - a.qualityScore || a.civilian.localeCompare(b.civilian))
    },
    homePreviewPairs(): WordPair[] {
      return pickHomePreviewPairs(this.availablePairs)
    },
  },
  actions: {
    persist() {
      writeJson(STORAGE_KEY, {
        customPairs: this.customPairs,
        builtinMetaById: this.builtinMetaById,
        recentPairIds: this.recentPairIds,
      })
    },
    listAvailablePairs() {
      return this.availablePairs
    },
    addCustomPair(civilianRaw: string, undercoverRaw: string, labelRaw?: string) {
      const civilian = normalize(civilianRaw)
      const undercover = normalize(undercoverRaw)
      const label = labelRaw ? normalize(labelRaw) : undefined
      if (!civilian || !undercover) return null

      const pair = normalizeCustomPair({
        id: makeCustomId(),
        civilian,
        undercover,
        label,
      })
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
      return pickOperationalWordPair(this.allPairs, this.recentPairIds)
    },
    markPairUsed(id: string) {
      const usedAt = Date.now()
      const existing = this.getPairById(id)
      if (!existing) return null
      const updated = markWordPairUsed(existing, usedAt)

      if (updated.source === 'custom') {
        this.customPairs = this.customPairs.map((pair) => (pair.id === id ? updated : pair))
      } else {
        this.builtinMetaById = {
          ...this.builtinMetaById,
          [id]: {
            ...this.builtinMetaById[id],
            lastUsedAt: updated.lastUsedAt,
            useCount: updated.useCount,
            status: updated.status,
            qualityScore: updated.qualityScore,
            difficulty: updated.difficulty,
            tags: updated.tags,
            cooldownRounds: updated.cooldownRounds,
            flags: updated.flags,
          },
        }
      }

      this.recentPairIds = [id, ...this.recentPairIds.filter((pairId) => pairId !== id)].slice(0, DEFAULT_RECENT_PAIR_LIMIT)
      this.persist()
      return updated
    },
    submitPairFeedback(id: string, feedback: WordPairFeedback) {
      const existing = this.getPairById(id)
      if (!existing) return null
      const updated = applyWordPairFeedback(existing, feedback)

      if (updated.source === 'custom') {
        this.customPairs = this.customPairs.map((pair) => (pair.id === id ? updated : pair))
      } else {
        this.builtinMetaById = {
          ...this.builtinMetaById,
          [id]: {
            ...this.builtinMetaById[id],
            status: updated.status,
            qualityScore: updated.qualityScore,
            flags: updated.flags,
          },
        }
      }

      this.persist()
      return updated
    },
    async syncRemoteCatalog() {
      return Promise.resolve()
    },
  },
})
