const R = require('ramda')

const internals = require('./sessions.internals')

/** @typedef {import('redis').RedisClient} RedisClient */

/**
 * @typedef {Object} Session
 * @property {string} namespace
 * @property {string} id
 * @property {string} experiment
 * @property {Object.<string, boolean>} flags
 */

/**
 * @param {RedisClient} redis
 * @param {string} namespace
 * @param {string} id
 * @param {Number} expiration
 * @returns {PromiseLike<Session>}
 */
function getSession (redis, namespace, id, expiration) {
  const key = `session:${namespace}:${id}`
  return redis.hgetall(key)
    .then(fields => fields && !R.isEmpty(fields)
      ? parseSession(namespace, id, fields)
      : internals.createSession(redis, namespace, id, expiration))
}

/**
 *
 * @param {string} namespace
 * @param {string} id
 * @param {Object.<string, string>} fields
 * @returns {Session}
 */
const parseSession = (namespace, id, fields) => {
  return {
    namespace,
    id,
    experiment: fields['@experiment'],
    flags: R.map(v => v === '1',
      R.fromPairs(
        R.toPairs(fields).filter(([key]) => !key.startsWith('@'))))
  }
}

module.exports = {
  getSession
}
