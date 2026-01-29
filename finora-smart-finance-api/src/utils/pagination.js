function parsePaginationParams(query = {}, options = {}) {
  const defaultLimit = options.defaultLimit || 50;
  const maxLimit = options.maxLimit || 100;

  const page = Math.max(parseInt(query.page, 10) || 1, 1);
  const limitRaw = parseInt(query.limit, 10) || defaultLimit;
  const limit = Math.min(Math.max(limitRaw, 1), maxLimit);
  const skip = (page - 1) * limit;

  return { page, limit, skip };
}

module.exports = {
  parsePaginationParams,
};
