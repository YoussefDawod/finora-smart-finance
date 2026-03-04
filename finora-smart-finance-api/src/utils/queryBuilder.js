const escapeRegex = require('./escapeRegex');

function buildUserQuery(search = '', isVerifiedParam, roleParam, isActiveParam) {
  const query = {};

  if (search) {
    const escaped = escapeRegex(search).slice(0, 100);
    query.$or = [
      { name: { $regex: escaped, $options: 'i' } },
      { email: { $regex: escaped, $options: 'i' } },
    ];
  }

  if (isVerifiedParam !== undefined) {
    query.isVerified = String(isVerifiedParam) === 'true';
  }

  if (roleParam !== undefined && ['user', 'admin'].includes(roleParam)) {
    query.role = roleParam;
  }

  if (isActiveParam !== undefined) {
    query.isActive = String(isActiveParam) === 'true';
  }

  return query;
}

function buildUserSort(sortBy = 'createdAt', order = 'desc') {
  const allowed = new Set([
    'createdAt',
    'name',
    'email',
    'lastLogin',
    'isVerified',
    'role',
    'isActive',
  ]);
  const field = allowed.has(sortBy) ? sortBy : 'createdAt';
  const direction = order === 'asc' ? 1 : -1;
  return { [field]: direction };
}

module.exports = {
  buildUserQuery,
  buildUserSort,
};
