const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
  definition: {
    openapi: '3.0.3',
    info: {
      title: 'Finora – Smart Finance API',
      version: '1.0.0',
      description:
        'RESTful API für die Finora Smart Finance App. Verwaltet Benutzer, Transaktionen, Budgets, Newsletter und Admin-Funktionen.',
      contact: {
        name: 'Finora Team',
      },
      license: {
        name: 'MIT',
      },
    },
    servers: [
      {
        url: '/api/v1',
        description: 'API v1',
      },
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT Access Token – erhalten via /auth/login oder /auth/register',
        },
        AdminKey: {
          type: 'apiKey',
          in: 'header',
          name: 'x-admin-key',
          description: 'Admin-API-Key (nur Production)',
        },
      },
      schemas: {
        // ── Error ──────────────────────────────────────────────
        Error: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            error: { type: 'string', example: 'Fehlermeldung' },
            code: { type: 'string', example: 'ERROR_CODE' },
            requestId: { type: 'string', example: 'req-abc123' },
            details: {
              type: 'array',
              items: { type: 'string' },
              description: 'Optionale Validierungs-Details',
            },
          },
        },

        // ── User ───────────────────────────────────────────────
        User: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '507f1f77bcf86cd799439011' },
            name: { type: 'string', example: 'MaxMuster' },
            email: { type: 'string', format: 'email', example: 'max@example.com' },
            lastName: { type: 'string', example: 'Mustermann' },
            avatar: { type: 'string', nullable: true },
            phone: { type: 'string', example: '+491701234567' },
            isVerified: { type: 'boolean', example: true },
            preferences: { $ref: '#/components/schemas/Preferences' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },

        Preferences: {
          type: 'object',
          properties: {
            theme: { type: 'string', enum: ['light', 'dark', 'system'], default: 'system' },
            currency: { type: 'string', enum: ['USD', 'EUR', 'GBP', 'CHF', 'JPY'], default: 'EUR' },
            timezone: { type: 'string', example: 'Europe/Berlin' },
            language: { type: 'string', enum: ['en', 'de', 'fr', 'ar', 'ka'], default: 'de' },
            dateFormat: { type: 'string', enum: ['iso', 'dmy'], default: 'iso' },
            emailNotifications: { type: 'boolean', default: true },
            notificationCategories: {
              type: 'object',
              properties: {
                security: { type: 'boolean', default: true },
                transactions: { type: 'boolean', default: true },
                reports: { type: 'boolean', default: true },
                alerts: { type: 'boolean', default: true },
              },
            },
            budget: { $ref: '#/components/schemas/Budget' },
          },
        },

        Budget: {
          type: 'object',
          properties: {
            monthlyLimit: { type: 'number', example: 2000 },
            alertThreshold: { type: 'number', minimum: 0, maximum: 100, example: 80 },
            categoryLimits: {
              type: 'object',
              additionalProperties: { type: 'number' },
              example: { Lebensmittel: 400, Transport: 150 },
            },
          },
        },

        // ── Transaction ────────────────────────────────────────
        Transaction: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '507f1f77bcf86cd799439012' },
            amount: { type: 'number', example: 49.99 },
            category: {
              type: 'string',
              enum: [
                'Lebensmittel',
                'Transport',
                'Unterhaltung',
                'Miete',
                'Versicherung',
                'Gesundheit',
                'Bildung',
                'Kleidung',
                'Reisen',
                'Elektronik',
                'Restaurant',
                'Sport',
                'Haushalt',
                'Sonstiges',
                'Gehalt',
                'Freelance',
                'Investitionen',
                'Geschenk',
                'Bonus',
                'Nebenjob',
                'Cashback',
                'Vermietung',
              ],
            },
            description: { type: 'string', example: 'Wocheneinkauf' },
            type: { type: 'string', enum: ['income', 'expense'], example: 'expense' },
            date: { type: 'string', format: 'date-time' },
            tags: { type: 'array', items: { type: 'string' }, example: ['lebensmittel'] },
            notes: { type: 'string', example: 'Bio-Laden' },
            userId: { type: 'string' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },

        TransactionInput: {
          type: 'object',
          required: ['amount', 'category', 'description', 'type', 'date'],
          properties: {
            amount: { type: 'number', minimum: 0.01, maximum: 1000000, example: 49.99 },
            category: { type: 'string', example: 'Lebensmittel' },
            description: { type: 'string', minLength: 3, maxLength: 255, example: 'Wocheneinkauf' },
            type: { type: 'string', enum: ['income', 'expense'], example: 'expense' },
            date: { type: 'string', format: 'date-time' },
            tags: { type: 'array', items: { type: 'string' } },
            notes: { type: 'string', maxLength: 500 },
          },
        },

        Pagination: {
          type: 'object',
          properties: {
            page: { type: 'integer', example: 1 },
            limit: { type: 'integer', example: 15 },
            total: { type: 'integer', example: 42 },
            pages: { type: 'integer', example: 3 },
          },
        },

        // ── Subscriber ────────────────────────────────────────
        Subscriber: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            email: { type: 'string', format: 'email' },
            isConfirmed: { type: 'boolean' },
            language: { type: 'string', enum: ['de', 'en', 'ar', 'ka'] },
            subscribedAt: { type: 'string', format: 'date-time' },
          },
        },

        // ── Auth Tokens ────────────────────────────────────────
        AuthTokens: {
          type: 'object',
          properties: {
            accessToken: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIs...' },
            refreshToken: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIs...' },
            user: { $ref: '#/components/schemas/User' },
          },
        },
      },
    },
    tags: [
      { name: 'Auth', description: 'Registrierung, Login, Token-Verwaltung, Passwort-Reset' },
      {
        name: 'Transactions',
        description: 'Transaktionen erstellen, lesen, aktualisieren, löschen',
      },
      { name: 'Users', description: 'Profil, Passwort, Email, Einstellungen, Datenexport' },
      { name: 'Admin', description: 'Admin-Endpunkte (API-Key geschützt)' },
      { name: 'Newsletter', description: 'Newsletter-Abonnement (Double Opt-In)' },
      { name: 'Contact', description: 'Kontaktformular' },
    ],
  },
  apis: ['./src/routes/**/*.js'],
};

const swaggerSpec = swaggerJsdoc(options);

/**
 * Registriert Swagger UI unter /api/docs
 * @param {import('express').Express} app
 */
function setupSwagger(app) {
  app.use(
    '/api/docs',
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec, {
      customCss: '.swagger-ui .topbar { display: none }',
      customSiteTitle: 'Finora API Docs',
    })
  );

  // Roher JSON-Spec-Endpunkt
  app.get('/api/docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });
}

module.exports = { setupSwagger, swaggerSpec };
