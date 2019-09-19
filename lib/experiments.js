const R = require('ramda')

/** @typedef {import('redis').RedisClient} RedisClient */
/** @type {import('../types')} */

/**
 * @param {RedisClient} redis
 * @param {string} namespace
 * @returns {PromiseLike<Experiment>[]}
 */
function listExperiments (redis, namespace) {
  const getExperiment = key => redis.hgetall(key).then(parseExperiment(key))

  return redis.keys(`exp:${namespace}:*`)
    .then(keys => Promise.all(keys.map(getExperiment)))
}

/**
 * @param {RedisClient} redis
 * @param {string} namespace
 * @param {string} name
 * @returns {PromiseLike<Experiment>}
 */
function getExperiment (redis, namespace, name) {
  const key = `exp:${namespace}:${name}`
  return redis.hgetall(key)
    .then(fields => R.isEmpty(fields) ? undefined : parseExperiment(key)(fields))
}

/**
 * @param {RedisClient} redis
 * @param {Experiment} param1
 * @returns {PromiseLike<Experiment>}
 */
function saveExperiment (redis, { namespace, name, weight, flags }) {
  const key = `exp:${namespace}:${name}`
  const flagArgs = R.pipe(
    R.map(v => v ? '1' : '0'),
    R.toPairs,
    R.flatten)(flags)
  return redis.hmset(key, ...['@weight', weight.toString(), ...flagArgs])
    .then(() => ({
      namespace,
      name,
      weight,
      flags
    }))
}

/**
 * @param {RedisClient} redis
 * @param {string} namespace
 * @param {string} experimentName
 * @param {string} sessionId
 * @param {Number} expiration
 * @returns {PromiseLike<any>}
 */
function bindSession (redis, namespace, experimentName, sessionId, expiration) {
  const key = `exp_sess:${namespace}:${experimentName}:${sessionId}`
  return redis.set(key, '')
    .then(() => redis.expire(key, expiration))
}

/**
 * @param {Experiment[]} experiments
 * @returns {Experiment}
 */
function pickExperiment (experiments) {
  const rand = Math.floor(Math.random() * 99) + 1
  const index = R.pipe(
    R.map(R.prop('weight')),
    R.reduce((acc, weight) => R.append((R.last(acc) || 0) + weight, acc), []),
    R.findIndex(R.lte(rand))
  )(experiments)
  return index < 0 ? undefined : experiments[index]
}

/**
 * @returns {Experiment}
 */
const parseExperiment = key => fields => ({
  name: key.split(':')[2],
  flags: R.map(v => v === '1', R.fromPairs(R.toPairs(fields).filter(([key]) => !key.startsWith('@')))),
  weight: fields['@weight'] && parseFloat(fields['@weight'])
})

module.exports = {
  listExperiments,
  getExperiment,
  saveExperiment,
  bindSession,
  pickExperiment
}
