export type Role = 'civilian' | 'undercover'

export type WordPair = {
  id: string
  civilian: string
  undercover: string
  label?: string
  source?: 'builtin' | 'custom'
}

export type PlayerCard = {
  pos: number
  role: Role
  word: string
}

export type GameConfig = {
  numPlayers: number
  wordPairId: string // 'random' allowed
}

export type GameSession = {
  id: string
  createdAt: number
  config: GameConfig & { undercoverCount: number }
  wordPair: Pick<WordPair, 'id' | 'civilian' | 'undercover' | 'label'>
  cards: PlayerCard[]
  verdicts: Record<string, Role>
}
