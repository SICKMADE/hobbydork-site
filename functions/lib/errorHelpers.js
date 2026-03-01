// Reusable error helper for backend functions
const functions = require('firebase-functions');

/**
 * Throws a detailed error listing all missing fields.
 * @param {object} data - The data object to check.
 * @param {string[]} requiredFields - Array of required field names.
 * @param {string} [code='invalid-argument'] - Firebase error code.
 */
function requireFields(data, requiredFields, code = 'invalid-argument') {
  const missing = requiredFields.filter(f => !data[f]);
  if (missing.length) {
    throw new functions.https.HttpsError(
      code,
      `Missing required fields: ${missing.join(', ')}`
    );
  }
}

module.exports = { requireFields };
