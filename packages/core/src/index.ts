export type {
  FeedbackAdjustment,
  FeedbackTuningConfig,
  GameConfig,
  GameOutcome,
  GameSession,
  PlayerCard,
  Role,
  WordPair,
  WordPairDifficulty,
  WordPairFeedback,
  WordPairFeedbackCounts,
  WordPairRandomPolicy,
  WordPairRepository,
  WordPairStatus,
} from './types'
export { builtinWordPairs } from './builtinWordPairs'
export { randomInt, shuffleInPlace } from './random'
export { autoUndercoverCount, computeOutcome, createSession, makeSessionId } from './session'
export {
  applyWordPairFeedback,
  clampDifficultyScore,
  clampQualityScore,
  DEFAULT_DIFFICULTY_PRIORITY,
  DEFAULT_FEEDBACK_TUNING_CONFIG,
  DEFAULT_MIN_PREFERRED_CANDIDATES,
  DEFAULT_QUALITY_THRESHOLD,
  DEFAULT_RECENT_PAIR_LIMIT,
  DEFAULT_WORD_PAIR_POLICY,
  evaluateFeedbackAdjustment,
  markWordPairUsed,
  pickOperationalWordPair,
  toDifficultyLevel,
  withWordPairDefaults,
} from './wordPairOps'
