export type Role = 'civilian' | 'undercover'
export type WordPairStatus = 'active' | 'disabled'
export type WordPairDifficulty = 'easy' | 'medium' | 'hard'
export type WordPairFeedback = 'too_easy' | 'too_hard_to_describe' | 'just_right'

export type WordPair = {
  id: string
  civilian: string
  undercover: string
  label?: string
  source?: 'builtin' | 'custom' | 'remote'
  status: WordPairStatus
  difficulty: WordPairDifficulty
  qualityScore: number
  tags: string[]
  lastUsedAt: number
  useCount: number
  cooldownRounds: number
  flags: string[]
}

export type WordPairRandomPolicy = {
  recentLimit: number
  minPreferredCandidates: number
  qualityThreshold: number
  difficultyPriority: WordPairDifficulty[]
}

export type WordPairRepository = {
  listAvailablePairs(): WordPair[]
  pickRandomPair(): WordPair | null
  submitPairFeedback(pairId: string, feedback: WordPairFeedback): WordPair | null
  syncRemoteCatalog(): Promise<void>
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
  wordPair: Pick<WordPair, 'id' | 'civilian' | 'undercover' | 'label' | 'difficulty' | 'tags'>
  cards: PlayerCard[]
  verdicts: Record<string, Role>
}

export type GameOutcome = { status: 'ongoing' } | { status: 'ended'; winner: Role }
