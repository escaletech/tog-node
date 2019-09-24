const R = require('ramda')

const experiments = require('./experiments')
const flags = require('./flags')

/** @typedef {import('redis').RedisClient} RedisClient */
/** @type {import('../types')} */

const listFlags = (redis, namespace) =>
  flags.listFlags(redis, namespace)
    .then(flags => flags.reduce((flags, f) => ({ ...flags, [f.name]: f.state }), {}))

function findExperiment (redis, namespace, preferredName) {
  return preferredName
    ? experiments.getExperiment(redis, namespace, preferredName)
      .then(experiment => experiment || findExperiment(redis, namespace, undefined))
    : experiments.listExperiments(redis, namespace)
      .then(experiments.pickExperiment)
}

/**
 * @param {RedisClient} redis
 * @param {string} namespace
 * @param {string} id
 * @param {Number} expiration
 * @param {SessionOptions} options
 * @returns {Session}
 */
function createSession (redis, namespace, id, expiration, options) {
  return findExperiment(redis, namespace, options.experiment)
    .then(experiment => listFlags(redis, namespace)
      .then(flags => experiment
        ? R.mergeAll([flags, experiment.flags, options.flags])
        : R.mergeAll([flags, options.flags]))
      .then(flags => ({ namespace, id, flags, experiment: experiment && experiment.name }))
    )
    .then(session => R.isEmpty(session.flags) ? session : saveSession(redis, session, expiration))
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
