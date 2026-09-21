/**
 * JSDoc typedefs give editor autocomplete and `checkJs` support without
 * committing to TypeScript. Migrate these to .ts interfaces if the project moves.
 */

/**
 * @typedef {Object} User
 * @property {string} id
 * @property {string} email
 * @property {string} fullName
 * @property {string} [jobTitle]
 * @property {string} [avatarUrl]
 * @property {string[]} roles
 * @property {string[]} permissions
 * @property {'ACTIVE'|'INVITED'|'SUSPENDED'|'DEACTIVATED'} status
 * @property {string} createdAt
 * @property {string} [lastLoginAt]
 */

/**
 * @typedef {Object} Paginated
 * @property {Array<*>} items
 * @property {number} total
 * @property {number} page
 * @property {number} size
 */

export {};
