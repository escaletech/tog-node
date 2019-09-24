const { pickExperiment } = require('./experiments')

describe('pick experiment', () => {
  const getDistribution = (reps, pick) =>
    Array(reps).fill(0)
      .map(() => pick())
      .map(exp => exp && exp.name)
      .reduce((acc, exp) => ({ ...acc, [exp]: (acc[exp] || 0) + 1 }), {})

  test('returns undefined for no experiments', () =>
    expect(pickExperiment([])).toBe(undefined))

  test('always returns the same experiment with weight 100', () => {
    const n = 1000
    const distribution = getDistribution(n, () => pickExperiment([
      { name: 'e1', weight: 100 }
    ]))

    expect(distribution).toEqual({ e1: n })
  })

  test('correct distribution with complementing weights', () => {
    const n = 10000
    const distribution = getDistribution(n, () => pickExperiment([
      { name: 'e1', weight: 70 },
      { name: 'e2', weight: 30 }
    ]))

    expect(distribution.e1 + distribution.e2).toEqual(n)
    expect(distribution.e1 / n).toBeCloseTo(0.7, 1)
    expect(distribution.e2 / n).toBeCloseTo(0.3, 1)
  })

  test('correct distribution with incomplete experiments', () => {
    const n = 10000
    const distribution = getDistribution(n, () => pickExperiment([
      { name: 'e1', weight: 20 },
      { name: 'e2', weight: 50 }
    ]))

    expect(distribution.e1 + distribution.e2 + distribution[undefined]).toEqual(n)
    expect(distribution.e1 / n).toBeCloseTo(0.2, 1)
    expect(distribution.e2 / n).toBeCloseTo(0.5, 1)
    expect(distribution[undefined] / n).toBeCloseTo(0.3, 1)
  })
})
