import type { WordPair, WordPairDifficulty, WordPairFeedback, WordPairRandomPolicy, WordPairStatus } from './types'
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

function clampScore(score: number) {
  return Math.max(0, Math.min(100, Math.round(score)))
}

export function withWordPairDefaults(
  pair: Pick<WordPair, 'id' | 'civilian' | 'undercover'> &
    Partial<Omit<WordPair, 'id' | 'civilian' | 'undercover'>>,
) {
  const label = pair.label?.trim() || undefined
  const tags = pair.tags?.length ? [...new Set(pair.tags.map((tag) => tag.trim()).filter(Boolean))] : label ? [label] : []

  return {
    id: pair.id,
    civilian: pair.civilian,
    undercover: pair.undercover,
    label,
    source: pair.source ?? 'builtin',
    status: (pair.status ?? 'active') as WordPairStatus,
    difficulty: pair.difficulty ?? 'medium',
    qualityScore: clampScore(pair.qualityScore ?? 80),
    tags,
    lastUsedAt: pair.lastUsedAt ?? 0,
    useCount: pair.useCount ?? 0,
    cooldownRounds: Math.max(1, Math.floor(pair.cooldownRounds ?? 5)),
    flags: pair.flags?.filter(Boolean) ?? [],
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

export function applyWordPairFeedback(pair: WordPair, feedback: WordPairFeedback) {
  const deltaByFeedback: Record<WordPairFeedback, number> = {
    too_easy: -15,
    too_hard_to_describe: -12,
    just_right: 8,
  }
  const nextFlags = new Set(pair.flags)
  if (feedback === 'too_easy') nextFlags.add('too-easy')
  if (feedback === 'too_hard_to_describe') nextFlags.add('too-hard-to-describe')
  if (feedback === 'just_right') {
    nextFlags.delete('too-easy')
    nextFlags.delete('too-hard-to-describe')
  }

  const nextScore = clampScore(pair.qualityScore + deltaByFeedback[feedback])
  const nextStatus: WordPairStatus = nextScore < 40 ? 'disabled' : 'active'

  return withWordPairDefaults({
    ...pair,
    qualityScore: nextScore,
    status: nextStatus,
    flags: [...nextFlags],
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
