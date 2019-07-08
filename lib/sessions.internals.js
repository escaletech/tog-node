const R = require('ramda')

const experiments = require('./experiments')
const flags = require('./flags')

/** @typedef {import('redis').RedisClient} RedisClient */
/** @typedef {import('./sessions').Session} Session */

/**
 * @param {RedisClient} redis
 * @param {string} namespace
 * @param {string} id
 * @param {Number} expiration
 * @returns {Session}
 */
function createSession (redis, namespace, id, expiration) {
  return experiments.listExperiments(redis, namespace)
    .then(experiments.pickExperiment)
    .then(experiment => flags.listFlags(redis, namespace)
      .then(flags => experiment ? R.merge(flags, experiment.flags) : flags)
      .then(flags => ({ namespace, id, flags, experiment: experiment && experiment.name }))
    )
    .then(session => saveSession(redis, session, expiration))
}

function sessionArgs (flags, experiment) {
  const flagArgs = R.pipe(R.map(v => v ? '1' : '0'), R.toPairs, R.flatten)(flags)
  return experiment ? ['@experiment', experiment, ...flagArgs] : flagArgs
}

/**
 * @param {RedisClient} redis
 * @param {Session} session
 * @param {Number} expiration
 * @returns {Session}
 */
function saveSession (redis, { namespace, id, flags, experiment }, expiration) {
  const key = `session:${namespace}:${id}`
  return redis.hmset(key, sessionArgs(flags, experiment))
    .then(() => redis.expire(key, expiration))
    .then(() => experiment && experiments.bindSession(redis, namespace, experiment, id, expiration))
    .then(() => ({ namespace, id, flags, experiment }))
}

module.exports = {
  createSession
}
