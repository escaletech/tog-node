"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var redis_1 = require("redis");
var util_1 = require("util");
var RedisClient = /** @class */ (function () {
    function RedisClient(redisUrl) {
        var redis = redis_1.createClient(redisUrl);
        this.redis = redis;
        this.keys = util_1.promisify(redis.keys).bind(redis);
        this.get = util_1.promisify(redis.get).bind(redis);
        this.set = util_1.promisify(redis.set).bind(redis);
        this.expire = util_1.promisify(redis.expire).bind(redis);
        this.ttl = util_1.promisify(redis.ttl).bind(redis);
        this.del = util_1.promisify(redis.del).bind(redis);
        this.on = redis.on;
        this.quit = redis.quit;
    }
    return RedisClient;
}());
exports.default = RedisClient;
//# sourceMappingURL=redis.js.map