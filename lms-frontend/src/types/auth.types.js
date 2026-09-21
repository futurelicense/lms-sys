/**
 * @typedef {Object} Credentials
 * @property {string} email
 * @property {string} password
 * @property {boolean} [rememberMe]
 */

/**
 * @typedef {Object} AuthTokens
 * @property {string} accessToken
 * @property {string} refreshToken
 * @property {number} expiresIn
 */

/**
 * @typedef {Object} NormalizedError
 * @property {number} status
 * @property {string} code
 * @property {string} message
 * @property {Record<string, string>} fieldErrors
 * @property {boolean} isNetworkError
 */

export {};
