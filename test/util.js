const redis = require('redis')
const { promisify } = require('util')

const TogClient = require('../index')

const redisUrl = 'redis://127.0.0.1:6379/1'

const clients = []

const newClients = (n = 1) => {
  const tog = new TogClient(redisUrl)
  tog.redisClient.on('error', err => fail(err))
  clients.push(tog.redisClient)
  return { tog, redis: tog.redis }
}

const cleanUp = n => {
  const redisClient = redis.createClient(redisUrl)
  const flushdb = promisify(redisClient.flushdb).bind(redisClient)
  return flushdb().then(() => redisClient.quit())
}

afterAll(() => clients.forEach(c => c.quit()))

module.exports = {
  newClients,
  cleanUp
}
