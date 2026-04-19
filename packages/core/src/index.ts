export type {
  GameConfig,
  GameOutcome,
  GameSession,
  PlayerCard,
  Role,
  WordPair,
  WordPairDifficulty,
  WordPairFeedback,
  WordPairRandomPolicy,
  WordPairRepository,
  WordPairStatus,
} from './types'
export { builtinWordPairs } from './builtinWordPairs'
export { randomInt, shuffleInPlace } from './random'
export { autoUndercoverCount, computeOutcome, createSession, makeSessionId } from './session'
export {
  applyWordPairFeedback,
  DEFAULT_DIFFICULTY_PRIORITY,
  DEFAULT_MIN_PREFERRED_CANDIDATES,
  DEFAULT_QUALITY_THRESHOLD,
  DEFAULT_RECENT_PAIR_LIMIT,
  DEFAULT_WORD_PAIR_POLICY,
  markWordPairUsed,
  pickOperationalWordPair,
  withWordPairDefaults,
} from './wordPairOps'
