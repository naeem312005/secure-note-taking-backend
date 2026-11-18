/**
 * Helper to normalize and compute pagination parameters
 * @param {Object} query - Express request query object
 * @returns {Object} normalized { page, limit, skip }
 */
export const getPaginationParams = (query) => {
  let page = parseInt(query.page, 10);
  let limit = parseInt(query.limit, 10);

  // Normalize page: minimum 1, fallback to 1 if NaN or invalid
  if (isNaN(page) || page < 1) {
    page = 1;
  }

  // Normalize limit: minimum 1, max 100, fallback to 10
  if (isNaN(limit) || limit < 1) {
    limit = 10;
  } else if (limit > 100) {
    limit = 100;
  }

  const skip = (page - 1) * limit;

  return { page, limit, skip };
};

/**
 * Build standard pagination metadata
 * @param {number} total - Total document count
 * @param {number} page - Current page
 * @param {number} limit - Items per page
 * @returns {Object} pagination metadata object
 */
export const buildPaginationMetadata = (total, page, limit) => {
  const totalPages = Math.ceil(total / limit) || 1;
  return {
    currentPage: page,
    perPage: limit,
    total,
    totalPages
  };
};
