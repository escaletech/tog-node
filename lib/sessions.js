"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function parseSession(namespace, id, value) {
    return {
        namespace: namespace,
        id: id,
        flags: JSON.parse(value)
    };
}
exports.parseSession = parseSession;
function resolveState(rollouts) {
    if (!rollouts || rollouts.length === 0) {
        return false;
    }
    var rollout = rollouts.find(function (r) {
        return r.percentage !== undefined
            ? Math.floor(Math.random() * 99) + 1 <= r.percentage
            : r.value;
    });
    return (rollout && rollout.value) || false;
}
exports.resolveState = resolveState;
//# sourceMappingURL=sessions.js.map