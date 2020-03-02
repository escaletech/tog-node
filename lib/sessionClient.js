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
var sessions_1 = require("./sessions");
var keys_1 = require("./keys");
var flagClient_1 = require("./flagClient");
/**
 * A client consuming sessions
 *
 * ```js
 * const { SessionClient } = require('tog-node')
 *
 * const tog = new SessionClient('redis://127.0.0.1:6379')
 * ```
 */
var SessionClient = /** @class */ (function () {
    /**
     * @param redisUrl The Redis connection string
     */
    function SessionClient(redisUrl) {
        this.flags = new flagClient_1.FlagClient(redisUrl);
        this.redis = this.flags.redis;
    }
    /**
     * Resolves a session, either by retrieving it or by computing a new one
     * @param namespace Flags namespace
     * @param id Unique session ID
     * @param options Options used when creating the flag, which are ignored if it already exists
     */
    SessionClient.prototype.session = function (namespace, id, options) {
        return __awaiter(this, void 0, void 0, function () {
            var key, value;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        key = keys_1.sessionKey(namespace, id);
                        return [4 /*yield*/, this.redis.get(key)];
                    case 1:
                        value = _a.sent();
                        return [2 /*return*/, value
                                ? sessions_1.parseSession(namespace, id, value)
                                : this.createSession(namespace, id, options)];
                }
            });
        });
    };
    /**
     * @hidden
     */
    SessionClient.prototype.createSession = function (namespace, id, options) {
        return __awaiter(this, void 0, void 0, function () {
            var flagOverrides, flags, session;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        flagOverrides = options && options.flags || {};
                        return [4 /*yield*/, this.flags.listFlags(namespace)];
                    case 1:
                        flags = (_a.sent())
                            .reduce(function (all, flag) {
                            var _a;
                            return (__assign(__assign({}, all), (_a = {}, _a[flag.name] = sessions_1.resolveState(flag.rollout), _a)));
                        }, {});
                        session = {
                            namespace: namespace,
                            id: id,
                            flags: __assign(__assign({}, flags), flagOverrides)
                        };
                        if (!(Object.keys(session.flags).length > 0)) return [3 /*break*/, 3];
                        return [4 /*yield*/, this.saveSession(session, options.duration || 86400)];
                    case 2:
                        _a.sent();
                        _a.label = 3;
                    case 3: return [2 /*return*/, session];
                }
            });
        });
    };
    /**
     * @hidden
     */
    SessionClient.prototype.saveSession = function (session, duration) {
        return __awaiter(this, void 0, void 0, function () {
            var key;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        key = keys_1.sessionKey(session.namespace, session.id);
                        return [4 /*yield*/, this.redis.set(key, JSON.stringify(session.flags), 'EX', duration)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    return SessionClient;
}());
exports.SessionClient = SessionClient;
//# sourceMappingURL=sessionClient.js.map