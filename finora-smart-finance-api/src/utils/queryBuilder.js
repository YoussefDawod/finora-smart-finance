function buildUserQuery(search = '', isVerifiedParam) {
  const query = {};

  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
    ];
  }

  if (isVerifiedParam !== undefined) {
    query.isVerified = String(isVerifiedParam) === 'true';
  }

  return query;
}

function buildUserSort(sortBy = 'createdAt', order = 'desc') {
  const allowed = new Set(['createdAt', 'name', 'email', 'lastLogin', 'isVerified']);
  const field = allowed.has(sortBy) ? sortBy : 'createdAt';
  const direction = order === 'asc' ? 1 : -1;
  return { [field]: direction };
}

module.exports = {
  buildUserQuery,
  buildUserSort,
};
