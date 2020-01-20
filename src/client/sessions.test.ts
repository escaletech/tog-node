import { resolveState } from './sessions'

describe('pick variant', () => {
  const getDistribution = (reps: number, pick: () => boolean) =>
    Array(reps).fill(0)
      .map(() => pick())
      .map(r => r && r.toString())
      .reduce((acc, r) => ({ ...acc, [r]: (acc[r] || 0) + 1 }), {})

  test('returns undefined for no variants', () =>
    expect(resolveState([])).toBe(false))

  test('always returns the same variant with percentage 100', () => {
    const n = 1000
    const distribution = getDistribution(n, () => resolveState([
      { value: true, percentage: 100 }
    ]))

    expect(distribution).toEqual({ true: n })
  })

  test('correct distribution with complementing weights', () => {
    const n = 10000
    const distribution = getDistribution(n, () => resolveState([
      { value: true, percentage: 70 },
      { value: false, percentage: 30 }
    ]))

    expect(distribution['true'] + distribution['false']).toEqual(n)
    expect(distribution['true'] / n).toBeCloseTo(0.7, 1)
    expect(distribution['false'] / n).toBeCloseTo(0.3, 1)
  })

  test('correct distribution with incomplete variants', () => {
    const n = 10000
    const distribution = getDistribution(n, () => resolveState([
      { value: true, percentage: 20 },
      { value: false, percentage: 50 }
    ]))

    expect(distribution['true'] + distribution['false']).toEqual(n)
    expect(distribution['true'] / n).toBeCloseTo(0.2, 1)
    expect(distribution['false'] / n).toBeCloseTo(0.8, 1)
  })
})
