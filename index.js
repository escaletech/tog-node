const redis = require('redis')
const { promisify } = require('util')

const { getSession } = require('./lib/sessions')
const { listExperiments, saveExperiment, getExperiment } = require('./lib/experiments')
const { listFlags, setFlag } = require('./lib/flags')

/**
 * @typedef {import('./lib/flags').Flag} Flag
 */

class TogClient {
  constructor (redisUrl) {
    this.redisClient = redis.createClient(redisUrl)
    this.redisClient.on('error', err => console.log('error') || console.error(err))
    this.redis = {
      keys: promisify(this.redisClient.keys).bind(this.redisClient),
      get: promisify(this.redisClient.get).bind(this.redisClient),
      hgetall: promisify(this.redisClient.hgetall).bind(this.redisClient),
      hmset: promisify(this.redisClient.hmset).bind(this.redisClient),
      hdel: promisify(this.redisClient.hdel).bind(this.redisClient),
      set: promisify(this.redisClient.set).bind(this.redisClient),
      expire: promisify(this.redisClient.expire).bind(this.redisClient)
    }
  }

  /**
   * @param {string} namespace
   * @returns {Object.<string, boolean>}
   */
  listFlags (namespace) {
    return listFlags(this.redis, namespace)
  }

  /**
   * Sets a new or existing flag
   * @param {string} namespace
   * @param {string} name
   * @param {boolean} state
   * @param {string} [description]
   * @returns {PromiseLike<Flag>}
   */
  setFlag (namespace, name, state, description) {
    return setFlag(this.redis, namespace, name, state, description)
  }

  getSession (namespace, id, expiration) {
    return getSession(this.redis, namespace, id, expiration)
  }

  listExperiments (namespace) {
    return listExperiments(this.redis, namespace)
  }

  getExperiment (namespace, name) {
    return getExperiment(this.redis, namespace, name)
  }

  saveExperiment ({ namespace, name, weight, flags }) {
    return saveExperiment(this.redis, { namespace, name, weight, flags })
  }
}

module.exports = TogClient
