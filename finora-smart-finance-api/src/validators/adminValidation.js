const { validateEmail, validatePassword } = require('./authValidation');
const { parsePaginationParams } = require('../utils/pagination');
const { buildUserQuery, buildUserSort } = require('../utils/queryBuilder');

function validateUserQuery(query = {}) {
  const errors = [];

  const pagination = parsePaginationParams(query, { defaultLimit: 50, maxLimit: 200 });
  const mongoQuery = buildUserQuery(query.search, query.isVerified, query.role, query.isActive);
  const sort = buildUserSort(query.sortBy, query.order);

  // showSensitive in Production deaktivieren — Sicherheitsrisiko
  let showSensitive = query.showSensitive === 'true';
  if (showSensitive && process.env.NODE_ENV === 'production') {
    const logger = require('../utils/logger');
    logger.warn('showSensitive=true wurde in Production ignoriert');
    showSensitive = false;
  }

  return { errors, query: mongoQuery, pagination, sort, showSensitive };
}

function validateCreateUser(body = {}) {
  const errors = [];
  const data = {};

  if (!body.name || typeof body.name !== 'string') {
    errors.push('Feld name ist erforderlich');
  } else {
    const trimmed = body.name.trim();
    if (trimmed.length < 3 || trimmed.length > 50) {
      errors.push('name muss zwischen 3 und 50 Zeichen lang sein');
    } else {
      data.name = trimmed;
    }
  }

  const pwResult = validatePassword(body.password);
  if (!pwResult.valid) {
    errors.push(pwResult.error);
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

  if (body.role !== undefined) {
    if (!['user', 'admin'].includes(body.role)) {
      errors.push('role muss "user" oder "admin" sein');
    } else {
      data.role = body.role;
    }
  }

  if (body.lastName !== undefined) {
    if (typeof body.lastName !== 'string') {
      errors.push('lastName muss ein String sein');
    } else if (body.lastName.length > 50) {
      errors.push('lastName darf maximal 50 Zeichen lang sein');
    } else {
      data.lastName = body.lastName;
    }
  }

  if (body.phone !== undefined) {
    if (typeof body.phone !== 'string') {
      errors.push('phone muss ein String sein');
    } else if (body.phone.length > 20) {
      errors.push('phone darf maximal 20 Zeichen lang sein');
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
    } else if (body.name.trim().length < 3 || body.name.trim().length > 50) {
      errors.push('name muss zwischen 3 und 50 Zeichen lang sein');
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
    } else if (body.lastName.length > 50) {
      errors.push('lastName darf maximal 50 Zeichen lang sein');
    } else {
      updates.lastName = body.lastName;
    }
  }

  if (body.phone !== undefined) {
    if (typeof body.phone !== 'string') {
      errors.push('phone muss ein String sein');
    } else if (body.phone.length > 20) {
      errors.push('phone darf maximal 20 Zeichen lang sein');
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
