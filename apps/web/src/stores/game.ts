import { defineStore } from 'pinia'
import { readJson, removeKey, writeJson } from '@/lib/storage'
import { useWordPairsStore } from '@/stores/wordPairs'
import { autoUndercoverCount, createSession } from '@undercover/core'
import type { GameConfig, GameSession, Role, WordPair } from '@/types/game'

const STORAGE_KEY = 'undercover.game.v1'

type GameState = {
  config: GameConfig
  session: GameSession | null
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
      const session: GameSession = createSession(this.config, picked)

      this.session = session
      this.persist()
      return session
    },
  },
})
