import type {
  FeedbackAdjustment,
  FeedbackTuningConfig,
  WordPair,
  WordPairDifficulty,
  WordPairFeedback,
  WordPairFeedbackCounts,
  WordPairRandomPolicy,
  WordPairStatus,
} from './types'
import { randomInt } from './random'

export const DEFAULT_RECENT_PAIR_LIMIT = 10
export const DEFAULT_MIN_PREFERRED_CANDIDATES = 3
export const DEFAULT_QUALITY_THRESHOLD = 72
export const DEFAULT_DIFFICULTY_PRIORITY: WordPairDifficulty[] = ['medium', 'hard', 'easy']
export const DEFAULT_WORD_PAIR_POLICY: WordPairRandomPolicy = {
  recentLimit: DEFAULT_RECENT_PAIR_LIMIT,
  minPreferredCandidates: DEFAULT_MIN_PREFERRED_CANDIDATES,
  qualityThreshold: DEFAULT_QUALITY_THRESHOLD,
  difficultyPriority: DEFAULT_DIFFICULTY_PRIORITY,
}

export const DEFAULT_FEEDBACK_TUNING_CONFIG: FeedbackTuningConfig = {
  difficultyMin: 1,
  difficultyMax: 100,
  qualityMin: 0,
  qualityMax: 100,
  difficultyStepTooEasy: 3,
  difficultyStepTooHardToDescribe: 3,
  qualityStepJustRight: 1,
  qualityPenaltyOnNegative: 1,
  negativeFeedbackThresholdForQualityPenalty: 3,
  levelRanges: {
    easyMax: 33,
    mediumMax: 66,
  },
}

const DEFAULT_DIFFICULTY_SCORE_BY_LEVEL: Record<WordPairDifficulty, number> = {
  easy: 20,
  medium: 50,
  hard: 80,
}

function clampNumber(score: number, min: number, max: number) {
  return Math.max(min, Math.min(max, Math.round(score)))
}

function normalizeFeedbackCounts(counts?: WordPairFeedbackCounts): WordPairFeedbackCounts {
  return {
    too_easy: Math.max(0, Math.floor(counts?.too_easy ?? 0)),
    too_hard_to_describe: Math.max(0, Math.floor(counts?.too_hard_to_describe ?? 0)),
    just_right: Math.max(0, Math.floor(counts?.just_right ?? 0)),
  }
}

export function clampDifficultyScore(score: number, config: FeedbackTuningConfig = DEFAULT_FEEDBACK_TUNING_CONFIG) {
  return clampNumber(score, config.difficultyMin, config.difficultyMax)
}

export function clampQualityScore(score: number, config: FeedbackTuningConfig = DEFAULT_FEEDBACK_TUNING_CONFIG) {
  return clampNumber(score, config.qualityMin, config.qualityMax)
}

export function toDifficultyLevel(
  score: number,
  config: FeedbackTuningConfig = DEFAULT_FEEDBACK_TUNING_CONFIG,
): WordPairDifficulty {
  const clampedScore = clampDifficultyScore(score, config)
  if (clampedScore <= config.levelRanges.easyMax) return 'easy'
  if (clampedScore <= config.levelRanges.mediumMax) return 'medium'
  return 'hard'
}

export function withWordPairDefaults(
  pair: Pick<WordPair, 'id' | 'civilian' | 'undercover'> &
    Partial<Omit<WordPair, 'id' | 'civilian' | 'undercover'>>,
) {
  const label = pair.label?.trim() || undefined
  const tags = pair.tags?.length ? [...new Set(pair.tags.map((tag) => tag.trim()).filter(Boolean))] : label ? [label] : []
  const difficultyScore = clampDifficultyScore(
    pair.difficultyScore ?? DEFAULT_DIFFICULTY_SCORE_BY_LEVEL[pair.difficulty ?? 'medium'],
  )
  const difficulty = toDifficultyLevel(difficultyScore)

  return {
    id: pair.id,
    civilian: pair.civilian,
    undercover: pair.undercover,
    label,
    source: pair.source ?? 'builtin',
    status: (pair.status ?? 'active') as WordPairStatus,
    difficulty,
    difficultyScore,
    qualityScore: clampQualityScore(pair.qualityScore ?? 80),
    tags,
    lastUsedAt: pair.lastUsedAt ?? 0,
    useCount: pair.useCount ?? 0,
    cooldownRounds: Math.max(1, Math.floor(pair.cooldownRounds ?? 5)),
    flags: pair.flags?.filter(Boolean) ?? [],
    feedbackCounts: normalizeFeedbackCounts(pair.feedbackCounts),
  } satisfies WordPair
}

function isRecentPair(pair: WordPair, recentPairIds: string[]) {
  return recentPairIds.slice(0, pair.cooldownRounds).includes(pair.id)
}

function pickRandom<T>(items: T[]) {
  if (items.length <= 0) return null
  return items[randomInt(items.length)] ?? null
}

export function markWordPairUsed(pair: WordPair, usedAt = Date.now()) {
  return withWordPairDefaults({
    ...pair,
    lastUsedAt: usedAt,
    useCount: pair.useCount + 1,
  })
}

export function evaluateFeedbackAdjustment(
  pair: WordPair,
  feedback: WordPairFeedback,
  config: FeedbackTuningConfig = DEFAULT_FEEDBACK_TUNING_CONFIG,
): FeedbackAdjustment {
  const nextFlags = new Set(pair.flags)
  const nextFeedbackCounts = normalizeFeedbackCounts(pair.feedbackCounts)
  nextFeedbackCounts[feedback] = (nextFeedbackCounts[feedback] ?? 0) + 1

  let nextDifficultyScore = pair.difficultyScore
  let nextQualityScore = pair.qualityScore
  const reasons: string[] = []

  if (feedback === 'too_easy') {
    nextDifficultyScore = clampDifficultyScore(pair.difficultyScore + config.difficultyStepTooEasy, config)
    nextFlags.add('too-easy')
    reasons.push(`difficultyScore +${config.difficultyStepTooEasy}`)
  }

  if (feedback === 'too_hard_to_describe') {
    nextDifficultyScore = clampDifficultyScore(pair.difficultyScore - config.difficultyStepTooHardToDescribe, config)
    nextFlags.add('too-hard-to-describe')
    reasons.push(`difficultyScore -${config.difficultyStepTooHardToDescribe}`)
  }

  if (feedback === 'just_right') {
    nextQualityScore = clampQualityScore(pair.qualityScore + config.qualityStepJustRight, config)
    nextFlags.delete('too-easy')
    nextFlags.delete('too-hard-to-describe')
    reasons.push(`qualityScore +${config.qualityStepJustRight}`)
  }

  const repeatedNegativeThreshold = config.negativeFeedbackThresholdForQualityPenalty
  const currentFeedbackCount = nextFeedbackCounts[feedback] ?? 0
  const isNegative = feedback === 'too_easy' || feedback === 'too_hard_to_describe'
  if (
    isNegative &&
    repeatedNegativeThreshold > 0 &&
    currentFeedbackCount > 0 &&
    currentFeedbackCount % repeatedNegativeThreshold === 0
  ) {
    nextQualityScore = clampQualityScore(pair.qualityScore - config.qualityPenaltyOnNegative, config)
    reasons.push(`qualityScore -${config.qualityPenaltyOnNegative} after repeated negative feedback`)
  }

  return {
    nextDifficultyScore,
    nextDifficulty: toDifficultyLevel(nextDifficultyScore, config),
    nextQualityScore,
    nextFlags: [...nextFlags],
    nextFeedbackCounts,
    reasons,
  }
}

export function applyWordPairFeedback(
  pair: WordPair,
  feedback: WordPairFeedback,
  config: FeedbackTuningConfig = DEFAULT_FEEDBACK_TUNING_CONFIG,
) {
  const adjustment = evaluateFeedbackAdjustment(pair, feedback, config)

  return withWordPairDefaults({
    ...pair,
    difficultyScore: adjustment.nextDifficultyScore,
    difficulty: adjustment.nextDifficulty,
    qualityScore: adjustment.nextQualityScore,
    status: pair.status,
    flags: adjustment.nextFlags,
    feedbackCounts: adjustment.nextFeedbackCounts,
  })
}

export function pickOperationalWordPair(
  pairs: WordPair[],
  recentPairIds: string[],
  policy: WordPairRandomPolicy = DEFAULT_WORD_PAIR_POLICY,
) {
  const activePairs = pairs.filter((pair) => pair.status === 'active')
  if (activePairs.length <= 0) return null

  const recentIds = recentPairIds.slice(0, policy.recentLimit)
  const meetsQuality = (pair: WordPair) => pair.qualityScore >= policy.qualityThreshold
  const notRecent = (pair: WordPair) => !isRecentPair(pair, recentIds)
  const preferredDifficulties = new Set(policy.difficultyPriority.slice(0, 2))

  const stages: Array<(pair: WordPair) => boolean> = [
    (pair) => notRecent(pair) && meetsQuality(pair) && pair.difficulty === policy.difficultyPriority[0],
    (pair) => notRecent(pair) && meetsQuality(pair) && preferredDifficulties.has(pair.difficulty),
    (pair) => notRecent(pair) && meetsQuality(pair),
    (pair) => notRecent(pair),
    (pair) => meetsQuality(pair),
    () => true,
  ]

  let bestFallback: WordPair[] | null = null

  for (let i = 0; i < stages.length; i++) {
    const candidates = activePairs.filter(stages[i]!)
    if (candidates.length <= 0) continue
    if (!bestFallback) bestFallback = candidates
    if (candidates.length >= policy.minPreferredCandidates) {
      return pickRandom(candidates)
    }
  }

  return pickRandom(bestFallback ?? activePairs)
}
