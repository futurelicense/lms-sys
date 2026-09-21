/**
 * @typedef {Object} Course
 * @property {string} id
 * @property {string} title
 * @property {string} [summary]
 * @property {string} description
 * @property {'DRAFT'|'IN_REVIEW'|'PUBLISHED'|'ARCHIVED'} status
 * @property {'BEGINNER'|'INTERMEDIATE'|'ADVANCED'} level
 * @property {string} categoryId
 * @property {number} durationMinutes
 * @property {string[]} tags
 * @property {string} [thumbnailUrl]
 * @property {number} [enrolledCount]
 * @property {number} [lessonCount]
 * @property {string} updatedAt
 */

/**
 * @typedef {Object} Lesson
 * @property {string} id
 * @property {string} title
 * @property {string} [body]
 * @property {string} [videoUrl]
 * @property {number} [resumeAtSeconds]
 * @property {boolean} [completed]
 */

export {};
