const { listFlags, setFlag } = require('./flags')

describe('list flags', () => {
  test('returns flags and their states', () => {
    const objects = {
      'flag:foo:empty': '',
      'flag:foo:invalid': 'abc',
      'flag:foo:enabled-flag': '1',
      'flag:foo:disabled-flag': '0',
      'flag:foo:flag-with-meta': '1;some other stuff'
    }
    const redis = {
      keys: jest.fn().mockResolvedValue(Object.keys(objects)),
      get: jest.fn(key => Promise.resolve(objects[key]))
    }
    return listFlags(redis, 'foo')
      .then(flags => {
        expect(flags).toMatchObject([
          { name: 'empty', state: false },
          { name: 'invalid', state: false },
          { name: 'enabled-flag', state: true, description: undefined },
          { name: 'disabled-flag', state: false, description: undefined },
          { name: 'flag-with-meta', state: true, description: 'some other stuff' }
        ])

        expect(redis.keys).toHaveBeenCalledWith('flag:foo:*')
      })
  })

  test('returns empty when no flags are found', () => {
    const redis = {
      keys: jest.fn().mockResolvedValue([])
    }
    return listFlags(redis, 'foo')
      .then(flags => {
        expect(flags).toEqual([])
      })
  })
})

describe('set flag', () => {
  test('saves a flag as enabled', () => {
    const redis = { set: jest.fn().mockResolvedValue() }
    return setFlag(redis, 'foo', 'bar', true)
      .then(result => {
        expect(result).toEqual({ name: 'bar', state: true })
        expect(redis.set).toHaveBeenCalledWith('flag:foo:bar', '1')
      })
  })

  test('saves a flag as disabled', () => {
    const redis = { set: jest.fn().mockResolvedValue('success') }
    return setFlag(redis, 'foo', 'bar', false)
      .then(result => {
        expect(result).toEqual({ name: 'bar', state: false })
        expect(redis.set).toHaveBeenCalledWith('flag:foo:bar', '0')
      })
  })

  test('adds an optional description to a flag', () => {
    const redis = { set: jest.fn().mockResolvedValue() }
    return setFlag(redis, 'foo', 'bar', true, 'The optional description')
      .then(() => {
        expect(redis.set).toHaveBeenCalledWith('flag:foo:bar', '1;The optional description')
      })
  })
})
