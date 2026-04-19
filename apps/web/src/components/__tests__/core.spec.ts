import { describe, expect, it } from 'vitest'

import {
  applyWordPairFeedback,
  builtinWordPairs,
  createSession,
  DEFAULT_WORD_PAIR_POLICY,
  pickOperationalWordPair,
  withWordPairDefaults,
} from '@undercover/core'

describe('word pair operations', () => {
  it('prefers a high-quality non-recent pair from the top difficulty priority', () => {
    const recentHard = withWordPairDefaults({
      id: 'recent-hard',
      civilian: '火锅',
      undercover: '麻辣烫',
      difficulty: 'hard',
      qualityScore: 95,
    })
    const preferredMedium = withWordPairDefaults({
      id: 'preferred-medium',
      civilian: '奶茶',
      undercover: '咖啡',
      difficulty: 'medium',
      qualityScore: 90,
    })
    const lowQualityHard = withWordPairDefaults({
      id: 'low-quality-hard',
      civilian: '老师',
      undercover: '教练',
      difficulty: 'hard',
      qualityScore: 40,
    })

    const picked = pickOperationalWordPair(
      [recentHard, preferredMedium, lowQualityHard],
      ['recent-hard'],
      {
        ...DEFAULT_WORD_PAIR_POLICY,
        minPreferredCandidates: 1,
      },
    )

    expect(picked?.id).toBe('preferred-medium')
  })

  it('falls back to a recent pair when every active candidate is recent', () => {
    const onlyRecent = withWordPairDefaults({
      id: 'only-recent',
      civilian: '苹果',
      undercover: '梨',
      difficulty: 'medium',
    })

    const picked = pickOperationalWordPair([onlyRecent], ['only-recent'])

    expect(picked?.id).toBe('only-recent')
  })

  it('disables a pair after repeated negative feedback drops its quality too low', () => {
    const pair = withWordPairDefaults({
      id: 'feedback-target',
      civilian: '地图',
      undercover: '导航',
      qualityScore: 50,
      flags: [],
    })

    const updated = applyWordPairFeedback(pair, 'too_easy')

    expect(updated.qualityScore).toBe(35)
    expect(updated.status).toBe('disabled')
    expect(updated.flags).toContain('too-easy')
  })
})

describe('session creation', () => {
  it('creates a session with the expected undercover count and word distribution', () => {
    const pair = withWordPairDefaults({
      id: 'pair-1',
      civilian: '猫',
      undercover: '狗',
      difficulty: 'easy',
    })

    const session = createSession({ numPlayers: 8, wordPairId: pair.id }, pair)
    const undercoverCards = session.cards.filter((card) => card.role === 'undercover')
    const civilianCards = session.cards.filter((card) => card.role === 'civilian')

    expect(session.config.undercoverCount).toBe(2)
    expect(undercoverCards).toHaveLength(2)
    expect(civilianCards).toHaveLength(6)
    expect(new Set(undercoverCards.map((card) => card.word))).toEqual(new Set([pair.undercover]))
    expect(new Set(civilianCards.map((card) => card.word))).toEqual(new Set([pair.civilian]))
    expect(session.wordPair).toMatchObject({
      id: pair.id,
      civilian: pair.civilian,
      undercover: pair.undercover,
      difficulty: pair.difficulty,
      tags: pair.tags,
    })
  })
})

describe('builtin word pairs', () => {
  it('ships at least 100 pairs across multiple difficulty levels', () => {
    expect(builtinWordPairs.length).toBeGreaterThanOrEqual(100)
    expect(builtinWordPairs.some((pair) => pair.difficulty === 'easy')).toBe(true)
    expect(builtinWordPairs.some((pair) => pair.difficulty === 'medium')).toBe(true)
    expect(builtinWordPairs.some((pair) => pair.difficulty === 'hard')).toBe(true)
  })
})
