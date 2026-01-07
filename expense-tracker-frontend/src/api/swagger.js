export const swaggerConfig = {
  openapi: '3.0.0',
  info: {
    title: 'Expense Tracker API',
    version: '1.0.0',
    description: 'REST API for managing personal expenses',
  },
  servers: [
    {
      url: 'http://localhost:5000/api',
      description: 'Development server',
    },
    {
      url: 'https://api.expensetracker.com/api',
      description: 'Production server',
    },
  ],
  paths: {
    '/expenses': {
      get: {
        summary: 'List expenses',
        parameters: [
          {
            name: 'page',
            in: 'query',
            schema: { type: 'integer', default: 1 },
          },
          {
            name: 'limit',
            in: 'query',
            schema: { type: 'integer', default: 20 },
          },
          {
            name: 'category',
            in: 'query',
            schema: { type: 'string' },
          },
        ],
        responses: {
          200: {
            description: 'List of expenses',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ExpenseListResponse' },
              },
            },
          },
        },
      },
      post: {
        summary: 'Create expense',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CreateExpenseRequest' },
            },
          },
        },
        responses: {
          201: {
            description: 'Expense created',
          },
        },
      },
    },
    '/expenses/{id}': {
      get: {
        summary: 'Get expense by ID',
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
          },
        ],
        responses: {
          200: {
            description: 'Expense details',
          },
        },
      },
      put: {
        summary: 'Update expense',
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/UpdateExpenseRequest' },
            },
          },
        },
        responses: {
          200: {
            description: 'Expense updated',
          },
        },
      },
      delete: {
        summary: 'Delete expense',
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
          },
        ],
        responses: {
          204: {
            description: 'Expense deleted',
          },
        },
      },
    },
  },
  components: {
    schemas: {
      Expense: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          description: { type: 'string' },
          amount: { type: 'number', minimum: 0.01 },
          category: { type: 'string' },
          date: { type: 'string', format: 'date' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
    },
  },
};
