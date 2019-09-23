const redis = require('redis')
const { promisify } = require('util')

const { getSession } = require('./lib/sessions')
const { listExperiments, saveExperiment, getExperiment } = require('./lib/experiments')
const { listFlags, setFlag } = require('./lib/flags')

/** @type {import('./types').default} */

class TogClient {
  /**
   * Creates a new TogClient for a Redis connection
   * @param {string} redisUrl - Redis server URL
   *
   * @example
   * const tog = new TogClient('redis://127.0.0.1:6379')
   */
  constructor (redisUrl) {
    /**
     * Underlying Redis client used for all requests.
     * Use it, for example, for logging connection errors.
     * @type {import('redis').RedisClient} redisClient
     * @see https://www.npmjs.com/package/redis#api
     */
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
   * Lists all flags that are set namespace-wide
   * @param {string} namespace
   * @returns {PromiseLike<Flag[]>}
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

  /**
   * Gets a session, or creates a new one if it doesn't exist
   * @param {String} namespace - Session namespace
   * @param {String} id - Session ID, which can be an arbitrary string
   * @param {Number} expiration - Session duration, in seconds
   * @returns {PromiseLike<Session>}
   *
   * @example
   * tog.session('default', 'abc123', 60*60*24) // expires in 1 day
   *   .then(session => {
   *     console.log('Experiment: ' + session.experiment)
   *     console.log('Flags: ' + JSON.stringify(session.flags))
   *   })
   */
  session (namespace, id, expiration) {
    return getSession(this.redis, namespace, id, expiration)
  }

  /**
   * Lists all available experiments
   * @param {String} namespace
   * @returns {PromiseLike<Experiment[]>}
   */
  listExperiments (namespace) {
    return listExperiments(this.redis, namespace)
  }

  /**
   * Gets an experiment
   * @param {String} namespace
   * @param {String} name
   * @returns {PromiseLike<Experiment>}
   */
  getExperiment (namespace, name) {
    return getExperiment(this.redis, namespace, name)
  }

  /**
   * Saves an new or existing experiment
   * @param {Experiment} experiment
   * @returns {PromiseLike<Experiment>}
   */
  saveExperiment ({ namespace, name, weight, flags }) {
    return saveExperiment(this.redis, { namespace, name, weight, flags })
  }
}

module.exports = TogClient
