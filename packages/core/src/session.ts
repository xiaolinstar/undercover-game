import type { GameConfig, GameOutcome, GameSession, Role, WordPair } from './types'
import { shuffleInPlace } from './random'

export function autoUndercoverCount(numPlayers: number) {
  // A pragmatic default for party games:
  // - 4~6: 1
  // - >=7: ~25% (rounded), capped to numPlayers-1
  if (numPlayers <= 6) return 1
  const byRatio = Math.round(numPlayers / 4)
  return Math.max(1, Math.min(numPlayers - 1, byRatio))
}

export function makeSessionId() {
  return `s-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

export function createSession(config: GameConfig, picked: WordPair): GameSession {
  const now = Date.now()
  const numPlayers = config.numPlayers
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

  return {
    id: makeSessionId(),
    createdAt: now,
    config: { ...config, undercoverCount },
    wordPair: { id: picked.id, civilian: picked.civilian, undercover: picked.undercover, label: picked.label },
    cards,
    verdicts: {},
  }
}

export function computeOutcome(session: GameSession): GameOutcome {
  const eliminated = new Set(Object.keys(session.verdicts).map((k) => Number.parseInt(k, 10)))
  const alive = session.cards.filter((c) => !eliminated.has(c.pos))
  const aliveUndercover = alive.filter((c) => c.role === 'undercover').length
  const aliveCivilian = alive.length - aliveUndercover

  if (aliveUndercover <= 0) return { status: 'ended', winner: 'civilian' }
  if (aliveUndercover >= aliveCivilian) return { status: 'ended', winner: 'undercover' }
  return { status: 'ongoing' }
}

