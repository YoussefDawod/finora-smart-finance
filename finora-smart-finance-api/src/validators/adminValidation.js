const { validateEmail } = require('./authValidation');
const { parsePaginationParams } = require('../utils/pagination');
const { buildUserQuery, buildUserSort } = require('../utils/queryBuilder');

function validateUserQuery(query = {}) {
  const errors = [];

  const pagination = parsePaginationParams(query, { defaultLimit: 50, maxLimit: 200 });
  const mongoQuery = buildUserQuery(query.search, query.isVerified);
  const sort = buildUserSort(query.sortBy, query.order);
  const showSensitive = query.showSensitive === 'true';

  return { errors, query: mongoQuery, pagination, sort, showSensitive };
}

function validateCreateUser(body = {}) {
  const errors = [];
  const data = {};

  if (!body.name || typeof body.name !== 'string') {
    errors.push('Feld name ist erforderlich');
  } else {
    data.name = body.name.trim();
  }

  if (!body.password || typeof body.password !== 'string') {
    errors.push('Feld password ist erforderlich');
  } else if (body.password.length < 6) {
    errors.push('Passwort muss mindestens 6 Zeichen lang sein');
  } else {
    data.password = body.password;
  }

  if (body.email !== undefined && body.email !== null && body.email !== '') {
    const emailValidation = validateEmail(body.email);
    if (!emailValidation.valid) {
      errors.push(emailValidation.error || 'E-Mail ist ungültig');
    } else {
      data.email = emailValidation.email;
    }
  }

  if (body.isVerified !== undefined) {
    if (typeof body.isVerified !== 'boolean') {
      errors.push('isVerified muss ein Boolean sein');
    } else {
      data.isVerified = body.isVerified;
    }
  }

  if (body.lastName !== undefined) {
    if (typeof body.lastName !== 'string') {
      errors.push('lastName muss ein String sein');
    } else {
      data.lastName = body.lastName;
    }
  }

  if (body.phone !== undefined) {
    if (typeof body.phone !== 'string') {
      errors.push('phone muss ein String sein');
    } else {
      data.phone = body.phone;
    }
  }

  return { errors, data };
}

function validateUpdateUser(body = {}) {
  const errors = [];
  const updates = {};

  if (body.name !== undefined) {
    if (typeof body.name !== 'string') {
      errors.push('name muss ein String sein');
    } else {
      updates.name = body.name;
    }
  }

  if (body.email !== undefined) {
    if (body.email === null || body.email === '') {
      updates.email = null;
    } else {
      const emailValidation = validateEmail(body.email);
      if (!emailValidation.valid) {
        errors.push(emailValidation.error || 'E-Mail ist ungültig');
      } else {
        updates.email = emailValidation.email;
      }
    }
  }

  if (body.isVerified !== undefined) {
    if (typeof body.isVerified !== 'boolean') {
      errors.push('isVerified muss ein Boolean sein');
    } else {
      updates.isVerified = body.isVerified;
    }
  }

  if (body.lastName !== undefined) {
    if (typeof body.lastName !== 'string') {
      errors.push('lastName muss ein String sein');
    } else {
      updates.lastName = body.lastName;
    }
  }

  if (body.phone !== undefined) {
    if (typeof body.phone !== 'string') {
      errors.push('phone muss ein String sein');
    } else {
      updates.phone = body.phone;
    }
  }

  return { errors, updates };
}

module.exports = {
  validateUserQuery,
  validateCreateUser,
  validateUpdateUser,
};
