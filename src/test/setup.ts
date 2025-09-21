// Configuración global para las pruebas de Jest

// Mock de variables de entorno para pruebas
process.env.NODE_ENV = 'test';
process.env.LOG_LEVEL = 'silent';
process.env.DB_PATH = ':memory:'; // Base de datos SQLite en memoria para pruebas
process.env.HUBSPOT_ACCESS_TOKEN = 'test-token';
process.env.HUBSPOT_API_BASE_URL = 'https://api.hubapi.com';
process.env.PORT = '0'; // Puerto dinámico para pruebas
process.env.RATE_LIMIT_WINDOW_MS = '900000';
process.env.RATE_LIMIT_MAX_REQUESTS = '1000'; // Más permisivo en pruebas

// Configurar timeout global para pruebas
jest.setTimeout(30000);

// Mock de console.log para pruebas más limpias (opcional)
// global.console = {
//   ...console,
//   log: jest.fn(),
//   debug: jest.fn(),
//   info: jest.fn(),
//   warn: jest.fn(),
//   error: jest.fn(),
// };

export {};
