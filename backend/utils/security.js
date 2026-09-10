/**
 * Escapes special characters in a string to safely use it in a RegExp.
 * Prevents Regular Expression Denial of Service (ReDoS) and regex injection.
 * @param {string} string
 * @returns {string}
 */
const escapeRegex = (string) => {
  if (typeof string !== 'string') return '';
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

/**
 * Validates that a string is a safe string for MongoDB query filters.
 * Prevents NoSQL object injection when req.query could contain nested objects.
 * @param {any} val
 * @returns {string}
 */
const sanitizeQueryParam = (val) => {
  if (typeof val !== 'string') return '';
  return val.trim();
};

module.exports = {
  escapeRegex,
  sanitizeQueryParam,
};
