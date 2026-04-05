import { defineStore } from 'pinia'
import { shuffleInPlace } from '@/lib/random'
import { readJson, removeKey, writeJson } from '@/lib/storage'
import { useWordPairsStore } from '@/stores/wordPairs'
import type { GameConfig, GameSession, Role, WordPair } from '@/types/game'

const STORAGE_KEY = 'undercover.game.v1'

type GameState = {
  config: GameConfig
  session: GameSession | null
}

export function autoUndercoverCount(numPlayers: number) {
  // A pragmatic default for party games:
  // - 4~6: 1
  // - >=7: ~25% (rounded), capped to numPlayers-1
  if (numPlayers <= 6) return 1
  const byRatio = Math.round(numPlayers / 4)
  return Math.max(1, Math.min(numPlayers - 1, byRatio))
}

function makeSessionId() {
  return `s-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

function pickWordPair(wordPairs: ReturnType<typeof useWordPairsStore>, config: GameConfig): WordPair | null {
  if (config.wordPairId === 'random') return wordPairs.getRandomPair()
  return wordPairs.getPairById(config.wordPairId)
}

export const useGameStore = defineStore('game', {
  state: (): GameState => {
    const stored = readJson<GameState>(STORAGE_KEY)
    return {
      config: stored?.config ?? { numPlayers: 6, wordPairId: 'random' },
      session: stored?.session
        ? {
            ...stored.session,
            verdicts: (stored.session as any).verdicts ?? {},
          }
        : null,
    }
  },
  getters: {
    undercoverCount(state) {
      return autoUndercoverCount(state.config.numPlayers)
    },
  },
  actions: {
    persist() {
      writeJson(STORAGE_KEY, { config: this.config, session: this.session })
    },
    setNumPlayers(n: number) {
      const numPlayers = Math.max(4, Math.min(20, Math.floor(n)))
      this.config.numPlayers = numPlayers
      this.persist()
    },
    setWordPairId(id: string) {
      this.config.wordPairId = id
      this.persist()
    },
    resetSession() {
      this.session = null
      this.persist()
    },
    setVerdict(pos: number, role: Role) {
      if (!this.session) return
      if (pos < 1 || pos > this.session.config.numPlayers) return
      this.session.verdicts = { ...this.session.verdicts, [String(pos)]: role }
      this.persist()
    },
    hardResetAll() {
      this.config = { numPlayers: 6, wordPairId: 'random' }
      this.session = null
      removeKey(STORAGE_KEY)
    },
    startNewSession() {
      const wordPairs = useWordPairsStore()
      const picked = pickWordPair(wordPairs, this.config)
      if (!picked) return null

      const numPlayers = this.config.numPlayers
      const undercoverCount = autoUndercoverCount(numPlayers)

      const roles: Role[] = []
      for (let i = 0; i < undercoverCount; i++) roles.push('undercover')
      for (let i = undercoverCount; i < numPlayers; i++) roles.push('civilian')
      shuffleInPlace(roles)

      const cards = roles.map((role, idx) => ({
        pos: idx + 1,
        role,
        word: role === 'undercover' ? picked.undercover : picked.civilian,
      }))

      const session: GameSession = {
        id: makeSessionId(),
        createdAt: Date.now(),
        config: { ...this.config, undercoverCount },
        wordPair: { id: picked.id, civilian: picked.civilian, undercover: picked.undercover, label: picked.label },
        cards,
        verdicts: {},
      }

      this.session = session
      this.persist()
      return session
    },
  },
})
