"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var types_1 = require("./types");
var redis_1 = require("./redis");
var keys_1 = require("./keys");
/**
 * A client for managing flags
 *
 * ```js
 * const { FlagClient } = require('tog-node')
 *
 * const tog = new FlagClient('redis://127.0.0.1:6379')
 * ```
 */
var FlagClient = /** @class */ (function () {
    /**
     * @param redisUrl The Redis connection string
     */
    function FlagClient(redisUrl) {
        this.redis = new redis_1.default(redisUrl);
    }
    /**
     * Lists flags in a namespace
     * @param namespace Flags namespace
     */
    FlagClient.prototype.listFlags = function (namespace) {
        return __awaiter(this, void 0, void 0, function () {
            var keys;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.redis.keys(keys_1.flagKey(namespace, '*'))];
                    case 1:
                        keys = _a.sent();
                        return [4 /*yield*/, Promise.all(keys.sort().map(function (key) { return _this.getFlagByKey(key); }))];
                    case 2: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    /**
     * Gets a single flag from a namespace
     * @param namespace Flag namespace
     * @param name Flag name
     */
    FlagClient.prototype.getFlag = function (namespace, name) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.getFlagByKey(keys_1.flagKey(namespace, name))];
            });
        });
    };
    /**
     * Creates or updates a flag
     * @param flag The flag to be saved
     */
    FlagClient.prototype.saveFlag = function (flag) {
        return __awaiter(this, void 0, void 0, function () {
            var sanitized;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        sanitized = {
                            description: flag.description,
                            rollout: flag.rollout
                        };
                        return [4 /*yield*/, this.redis.set(keys_1.flagKey(flag.namespace, flag.name), JSON.stringify(sanitized))];
                    case 1:
                        _a.sent();
                        return [2 /*return*/, flag];
                }
            });
        });
    };
    /**
     * Deletes a flag from a namespace
     * @param namespace Flag namespace
     * @param name Flag name
     * @returns Whether a flag existed and was deleted (`true`), or not (`false`)
     */
    FlagClient.prototype.deleteFlag = function (namespace, name) {
        return __awaiter(this, void 0, void 0, function () {
            var res;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.redis.del(keys_1.flagKey(namespace, name))];
                    case 1:
                        res = _a.sent();
                        return [2 /*return*/, res > 0];
                }
            });
        });
    };
    /**
     * @hidden
     */
    FlagClient.prototype.getFlagByKey = function (key) {
        return __awaiter(this, void 0, void 0, function () {
            var value;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.redis.get(key)];
                    case 1:
                        value = _a.sent();
                        return [2 /*return*/, value
                                ? parseFlag(key, value)
                                : Promise.reject(new types_1.FlagNotFoundError('flag not found'))];
                }
            });
        });
    };
    return FlagClient;
}());
exports.FlagClient = FlagClient;
function parseFlag(key, value) {
    var _a = key.split(':'), namespace = _a[1], name = _a[2];
    return __assign({ namespace: namespace, name: name }, JSON.parse(value));
}
//# sourceMappingURL=flagClient.js.map