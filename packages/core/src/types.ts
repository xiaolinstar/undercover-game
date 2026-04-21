export type Role = 'civilian' | 'undercover'
export type WordPairStatus = 'active' | 'disabled'
export type WordPairDifficulty = 'easy' | 'medium' | 'hard'
export type WordPairFeedback = 'too_easy' | 'too_hard_to_describe' | 'just_right'
export type WordPairFeedbackCounts = Partial<Record<WordPairFeedback, number>>

export type FeedbackTuningConfig = {
  difficultyMin: number
  difficultyMax: number
  qualityMin: number
  qualityMax: number
  difficultyStepTooEasy: number
  difficultyStepTooHardToDescribe: number
  qualityStepJustRight: number
  qualityPenaltyOnNegative: number
  negativeFeedbackThresholdForQualityPenalty: number
  levelRanges: {
    easyMax: number
    mediumMax: number
  }
}

export type FeedbackAdjustment = {
  nextDifficultyScore: number
  nextDifficulty: WordPairDifficulty
  nextQualityScore: number
  nextFlags: string[]
  nextFeedbackCounts: WordPairFeedbackCounts
  reasons: string[]
}

export type WordPair = {
  id: string
  civilian: string
  undercover: string
  label?: string
  source?: 'builtin' | 'custom' | 'remote'
  status: WordPairStatus
  difficulty: WordPairDifficulty
  difficultyScore: number
  qualityScore: number
  tags: string[]
  lastUsedAt: number
  useCount: number
  cooldownRounds: number
  flags: string[]
  feedbackCounts: WordPairFeedbackCounts
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
  wordPair: Pick<WordPair, 'id' | 'civilian' | 'undercover' | 'label' | 'difficulty' | 'difficultyScore' | 'tags'>
  cards: PlayerCard[]
  verdicts: Record<string, Role>
}

export type GameOutcome = { status: 'ongoing' } | { status: 'ended'; winner: Role }
