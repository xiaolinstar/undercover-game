import { defineStore } from 'pinia'
import { readJson, writeJson } from '@/lib/storage'
import { useWordPairsStore } from '@/stores/wordPairs'
import { autoUndercoverCount, createSession } from '@undercover/core'
import type { GameConfig, GameSession, Role, WordPair } from '@/types/game'

const STORAGE_KEY = 'undercover.mp.game.v1'

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
    const storedSession = stored?.session
    return {
      config: stored?.config ?? { numPlayers: 6, wordPairId: 'random' },
      session: storedSession
        ? {
            ...storedSession,
            verdicts: (storedSession as any).verdicts ?? {},
            wordPair: {
              ...storedSession.wordPair,
              difficulty: storedSession.wordPair?.difficulty ?? 'medium',
              tags: storedSession.wordPair?.tags ?? [],
            },
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
    startNewSession() {
      const wordPairs = useWordPairsStore()
      const picked = pickWordPair(wordPairs, this.config)
      if (!picked) return null
      const session: GameSession = createSession(this.config, picked)

      this.session = session
      wordPairs.markPairUsed(picked.id)
      this.persist()
      return session
    },
  },
})
