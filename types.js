/**
 * @typedef {Object} Flag
 * @property {string} name
 * @property {boolean} state
 * @property {string} [description]
 */

/**
 * @typedef {Object} Experiment
 * @property {string} namespace
 * @property {string} name
 * @property {Number} weight
 * @property {Object.<string, boolean>} flags
 */

/**
 * @typedef {Object} Session
 * @property {string} namespace
 * @property {string} id
 * @property {string} experiment
 * @property {Object.<string, boolean>} flags
 */
