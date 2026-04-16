export const openApiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'Prueba Técnica · Humath API',
    version: '1.0.0',
    description:
      'REST API construida en Node.js + Express + TypeScript que consume Alpha Vantage y expone endpoints propios con datos transformados, auth JWT, cache en memoria y persistencia con TypeORM.',
    contact: { name: 'Paula Saavedra', email: 'paulasaavedra1101@gmail.com' },
  },
  servers: [
    { url: 'http://localhost:3000', description: 'Local' },
    { url: 'https://prueba-tecnica.azurewebsites.net', description: 'Azure (producción)' },
  ],
  tags: [
    { name: 'Health', description: 'Liveness / readiness' },
    { name: 'External', description: 'Endpoint del enunciado' },
    { name: 'Auth', description: 'Registro, login y perfil' },
    { name: 'Market', description: 'Cotizaciones y series diarias' },
  ],
  components: {
    securitySchemes: {
      bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
    },
    schemas: {
      Credentials: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email', example: 'paula@humath.co' },
          password: { type: 'string', minLength: 8, example: 'paula123!' },
        },
      },
      TokenResponse: {
        type: 'object',
        properties: {
          token: { type: 'string' },
          user: { type: 'object', properties: { id: { type: 'string' }, email: { type: 'string' } } },
        },
      },
      ExternalItem: {
        type: 'object',
        properties: {
          id: { type: 'number', example: 1 },
          name: { type: 'string', example: 'AAPL' },
          priceChange: { type: 'number', example: 1.25 },
          changePercent: { type: 'string', example: '0.84%' },
        },
      },
      Quote: {
        type: 'object',
        properties: {
          symbol: { type: 'string' },
          price: { type: 'number' },
          change: { type: 'number' },
          changePercent: { type: 'string' },
          volume: { type: 'number' },
          latestTradingDay: { type: 'string' },
        },
      },
      Error: {
        type: 'object',
        properties: {
          error: { type: 'string' },
          code: { type: 'string' },
          reqId: { type: 'string' },
        },
      },
    },
  },
  paths: {
    '/health': {
      get: {
        tags: ['Health'],
        summary: 'Liveness',
        responses: { '200': { description: 'OK' } },
      },
    },
    '/ready': {
      get: {
        tags: ['Health'],
        summary: 'Readiness (chequea conexión DB)',
        responses: { '200': { description: 'Ready' }, '503': { description: 'Degraded' } },
      },
    },
    '/external-data': {
      get: {
        tags: ['External'],
        summary: 'Endpoint del enunciado · top-movers transformado',
        description: 'Consume Alpha Vantage (TOP_GAINERS_LOSERS) y retorna datos transformados.',
        responses: {
          '200': {
            description: 'Lista transformada',
            content: {
              'application/json': {
                schema: { type: 'array', items: { $ref: '#/components/schemas/ExternalItem' } },
              },
            },
          },
          '429': { description: 'Rate limited' },
        },
      },
    },
    '/api/auth/register': {
      post: {
        tags: ['Auth'],
        summary: 'Registro de usuario',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/Credentials' } } },
        },
        responses: {
          '201': { description: 'Creado' },
          '400': { description: 'Validación fallida', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
    '/api/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'Login · retorna JWT',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/Credentials' } } },
        },
        responses: {
          '200': { description: 'JWT emitido', content: { 'application/json': { schema: { $ref: '#/components/schemas/TokenResponse' } } } },
          '401': { description: 'Credenciales inválidas' },
        },
      },
    },
    '/api/auth/me': {
      get: {
        tags: ['Auth'],
        summary: 'Perfil del usuario autenticado',
        security: [{ bearerAuth: [] }],
        responses: { '200': { description: 'OK' }, '401': { description: 'Unauthorized' } },
      },
    },
    '/api/market/quote/{symbol}': {
      get: {
        tags: ['Market'],
        summary: 'Cotización actual (GLOBAL_QUOTE)',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'symbol', in: 'path', required: true, schema: { type: 'string', example: 'IBM' } }],
        responses: {
          '200': { description: 'OK', content: { 'application/json': { schema: { $ref: '#/components/schemas/Quote' } } } },
          '404': { description: 'Símbolo no encontrado' },
        },
      },
    },
    '/api/market/daily/{symbol}': {
      get: {
        tags: ['Market'],
        summary: 'Serie diaria (TIME_SERIES_DAILY)',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'symbol', in: 'path', required: true, schema: { type: 'string' } },
          { name: 'outputsize', in: 'query', required: false, schema: { type: 'string', enum: ['compact', 'full'] } },
        ],
        responses: { '200': { description: 'OK' } },
      },
    },
  },
};
