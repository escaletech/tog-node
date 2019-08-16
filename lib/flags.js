/** @typedef {import('redis').RedisClient} RedisClient */

/**
 * @typedef {Object} Flag
 * @property {string} name
 * @property {boolean} state
 * @property {string} [description]
 */

/**
 * @param {string} key
 * @param {string} value
 * @returns {Flag}
 */
function parseFlag (key, value) {
  const name = key.split(':')[2]
  const [stateStr, description] = (value || '').split(';')
  return {
    name,
    state: stateStr === '1',
    description
  }
}

/**
 * @param {RedisClient} redis
 * @param {string} namespace
 * @returns {Flag[]}
 */
function listFlags (redis, namespace) {
  return redis.keys(`flag:${namespace}:*`)
    .then(keys => Promise.all(keys.map(key =>
      redis.get(key).then(value => parseFlag(key, value))
    )))
}

/**
 * @param {RedisClient} redis
 * @param {string} namespace
 * @param {string} name
 * @param {boolean} state
 * @param {string} [description]
 * @returns {PromiseLike<Flag>}
 */
function setFlag (redis, namespace, name, state, description) {
  const val = state ? '1' : '0'
  const desc = description ? ';' + description : ''
  return redis.set(`flag:${namespace}:${name}`, val + desc)
    .then(() => ({ name, state, description }))
}

module.exports = {
  listFlags,
  setFlag
}
