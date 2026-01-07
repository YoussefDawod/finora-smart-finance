/**
 * API Request/Response Types & Schemas
 * Dokumentation der Datenstrukturen
 */

/**
 * Transaction API Types
 */
export const TransactionSchema = {
  // GET /api/transactions
  LIST_REQUEST: {
    query: {
      page: 'number (default: 1)',
      limit: 'number (default: 10)',
      type: 'income | expense (optional)',
      category: 'string (optional)',
      startDate: 'ISO 8601 date (optional)',
      endDate: 'ISO 8601 date (optional)',
      sortBy: 'date | amount | category (default: date)',
      sortOrder: 'asc | desc (default: desc)',
    },
  },

  LIST_RESPONSE: {
    success: 'boolean',
    data: [
      {
        id: 'uuid',
        type: 'income | expense',
        description: 'string',
        amount: 'number (> 0)',
        category: 'string',
        date: 'ISO 8601 date',
        createdAt: 'ISO 8601 datetime',
        updatedAt: 'ISO 8601 datetime',
      },
    ],
    pagination: {
      page: 'number',
      limit: 'number',
      total: 'number',
      pages: 'number',
    },
    message: 'string (optional)',
  },

  // POST /api/transactions
  CREATE_REQUEST: {
    type: 'income | expense (required)',
    description: 'string (required, 1-255 chars)',
    amount: 'number (required, > 0)',
    category: 'string (required)',
    date: 'ISO 8601 date (optional, default: today)',
  },

  CREATE_RESPONSE: {
    success: 'boolean',
    data: {
      id: 'uuid',
      type: 'income | expense',
      description: 'string',
      amount: 'number',
      category: 'string',
      date: 'ISO 8601 date',
      createdAt: 'ISO 8601 datetime',
    },
    message: 'string',
  },

  // PUT /api/transactions/:id
  UPDATE_REQUEST: {
    type: 'income | expense (optional)',
    description: 'string (optional)',
    amount: 'number (optional, > 0)',
    category: 'string (optional)',
    date: 'ISO 8601 date (optional)',
  },

  UPDATE_RESPONSE: {
    success: 'boolean',
    data: {
      id: 'uuid',
      type: 'income | expense',
      description: 'string',
      amount: 'number',
      category: 'string',
      date: 'ISO 8601 date',
      updatedAt: 'ISO 8601 datetime',
    },
    message: 'string',
  },

  // DELETE /api/transactions/:id
  DELETE_RESPONSE: {
    success: 'boolean',
    message: 'string',
  },

  // GET /api/stats/summary
  STATS_RESPONSE: {
    success: 'boolean',
    data: {
      totalIncome: 'number',
      totalExpense: 'number',
      balance: 'number',
      transactionCount: 'number',
      averageExpense: 'number',
      largestExpense: 'object',
      byCategory: {
        categoryName: 'number (amount)',
      },
    },
    message: 'string',
  },
};

/**
 * Error Response Schema
 */
export const ErrorSchema = {
  BAD_REQUEST: {
    success: false,
    error: {
      code: 'VALIDATION_ERROR',
      message: 'Validation failed',
      details: {
        fieldName: 'Error message',
      },
    },
  },

  UNAUTHORIZED: {
    success: false,
    error: {
      code: 'UNAUTHORIZED',
      message: 'Authentication required',
    },
  },

  NOT_FOUND: {
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: 'Resource not found',
    },
  },

  CONFLICT: {
    success: false,
    error: {
      code: 'CONFLICT',
      message: 'Resource already exists',
    },
  },

  INTERNAL_SERVER_ERROR: {
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Something went wrong',
    },
  },
};
