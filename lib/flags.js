const R = require('ramda')

/** @typedef {import('redis').RedisClient} RedisClient */

/**
 * @typedef {Object} Flag
 * @property {string} name
 * @property {boolean} state
 * @property {string} [description]
 */

const nameFromKey = key => key.split(':')[2]
const stateFromValue = value => value && value[0] === '1'

/**
 * @param {RedisClient} redis
 * @param {string} namespace
 * @returns {Object.<string, boolean>}
 */
function listFlags (redis, namespace) {
  return redis.keys(`flag:${namespace}:*`)
    .then(keys => Promise.all(keys.map(k => redis.get(k)))
      .then(values => R.zipObj(keys.map(nameFromKey), values.map(stateFromValue))))
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
