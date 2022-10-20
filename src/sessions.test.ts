import { resolveState } from './sessions'

describe('pick variant', () => {
  const getDistribution = (reps: number, pick: (i: number) => boolean) =>
    Array(reps).fill(0)
      .map((n, i) => pick(i))
      .map(r => r && r.toString())
      .reduce((acc, r) => ({ ...acc, [r.toString()]: (acc[r.toString()] || 0) + 1 }), {})

  /// test new resolve with traits
  test('No rollout defined, return false', () =>
    expect(resolveState([], 0, 'abc')).toBe(false))

  test('Rollout without traits defined, session with traits return true', () =>
    expect(resolveState([{ value: true }], 0, 'abc', ["blue"])).toBe(true))

  test('Rollout traits match exact session traits, return true', () =>
    expect(resolveState([{ value: true,  traits: ["blue"]}], 0, 'abc', ["blue"])).toBe(true))

  test('Rollout traits defined but session traits empty, return false', () =>
    expect(resolveState([{ value: true,  traits: ["blue"]}], 0, 'abc')).toBe(false))

  test('Rollout traits defined but not match session traits, return false', () =>
    expect(resolveState([{ value: true,  traits: ["blue"]}], 0, 'abc', ["red"])).toBe(false))

  test('Rollout traits defined with more elements than session traits, return false', () =>
    expect(resolveState([{ value: true,  traits: ["blue", "circle"]}], 0, 'abc', ["blue"])).toBe(false))

  test('Multiple Rollout defined more traits matching session traits triumph', () =>
    expect(resolveState([{ value: true,  traits: ["blue", "circle"]},{ value: false,  traits: ["blue"]}], 0, 'abc', ["blue","circle"])).toBe(true))

  test('Multiple Rollout defined matching session same number of traits false triumph', () =>
    expect(resolveState([{ value: true,  traits: ["blue"]},{ value: false,  traits: ["circle"]}], 0, 'abc', ["blue","circle"])).toBe(false))

  test('Rollout with percentage 100 matches exact session traits always return true', () => {
    const n = 1000
    const distribution = getDistribution(n, i => resolveState(
    [{ value: true, percentage: 100 , traits:["blue","circle"]}],
    i, 
    'def',
    ["blue","circle"]))
    expect(distribution).toEqual({ true: n })
  })

  test('Multiple Rollouts both true, higher percentage triumph', () => {
    const n = 1000
    const distribution = getDistribution(n, i => resolveState(
    [{ value: true, percentage: 20 , traits:["blue","circle"]}, { value: true, percentage: 70 , traits:["big","circle"]}],
    i, 
    'def',
    ["blue","circle","big"]))
    expect(distribution['true'] / n).toBeCloseTo(0.7, 1)
  })

})
