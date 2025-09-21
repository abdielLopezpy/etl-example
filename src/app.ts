import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import pinoHttp from 'pino-http';

// Importar configuración y utilidades
import { getConfig, validateConfig } from './utils/config';
import { logger } from './utils/logger';

// Importar middleware
import { errorHandler, notFoundHandler } from './middleware/errorHandler';

// Importar rutas
import { createApiRoutes } from './routes';

// Importar base de datos
import { initializeDatabase, getDatabase } from './database/connection';

// Importar repositorios
import { CompanyRepository } from './repositories/CompanyRepository';
import { ContactRepository } from './repositories/ContactRepository';

// Importar servicios
import { HubSpotApiService } from './services/HubSpotApiService';
import { CompanyService } from './services/CompanyService';
import { ContactService } from './services/ContactService';
import { EtlService } from './services/EtlService';

// Función para crear la aplicación Express
export async function createApp() {
  // Cargar y validar configuración
  const config = getConfig();
  validateConfig(config);

  // Inicializar base de datos
  await initializeDatabase(config.dbPath);
  const database = getDatabase();

  // Inicializar repositorios
  const companyRepository = new CompanyRepository(database);
  const contactRepository = new ContactRepository(database);

  // Inicializar servicios
  const hubspotApiService = new HubSpotApiService({
    accessToken: config.hubspot.accessToken,
    baseUrl: config.hubspot.baseUrl,
    rateLimitPerSecond: 10, // 10 requests per second para respetar límites de HubSpot
  });

  const companyService = new CompanyService(companyRepository);
  const contactService = new ContactService(contactRepository, companyRepository);
  const etlService = new EtlService(hubspotApiService, companyService, contactService);

  // Crear aplicación Express
  const app = express();

  // Middleware de seguridad
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
      },
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
  }));

  // CORS
  app.use(cors({
    origin: config.nodeEnv === 'production' ? false : true, // En producción, configurar orígenes específicos
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: false,
  }));

  // Rate limiting
  const limiter = rateLimit({
    windowMs: config.rateLimit.windowMs,
    max: config.rateLimit.maxRequests,
    message: {
      error: 'Too Many Requests',
      message: 'Rate limit exceeded, please try again later',
      statusCode: 429,
      timestamp: new Date().toISOString(),
    },
    standardHeaders: true,
    legacyHeaders: false,
  });
  app.use('/api', limiter);

  // Logging HTTP
  app.use(pinoHttp({
    logger,
    customLogLevel: function (req, res, err) {
      if (res.statusCode >= 400 && res.statusCode < 500) {
        return 'warn';
      } else if (res.statusCode >= 500 || err) {
        return 'error';
      } else if (res.statusCode >= 300 && res.statusCode < 400) {
        return 'silent';
      }
      return 'info';
    },
    customSuccessMessage: function (req, res) {
      if (res.statusCode === 404) {
        return 'resource not found';
      }
      return `${req.method} ${req.url} completed`;
    },
    customErrorMessage: function (req, res, err) {
      return `${req.method} ${req.url} errored with status ${res.statusCode}`;
    },
  }));

  // Parsing de JSON y URL-encoded
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Health check endpoint
  app.get('/health', (req, res) => {
    res.status(200).json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version || '1.0.0',
      environment: config.nodeEnv,
    });
  });

  // API routes
  const apiRoutes = createApiRoutes({
    companyService,
    contactService,
    etlService,
  });
  app.use('/api', apiRoutes);

  // 404 handler
  app.use(notFoundHandler);

  // Error handler global
  app.use(errorHandler);

  return {
    app,
    config,
    database,
    services: {
      companyService,
      contactService,
      etlService,
    },
  };
}

// Función para cerrar la aplicación de forma elegante
export async function gracefulShutdown(database: any, server?: any) {
  logger.info('Starting graceful shutdown');

  if (server) {
    server.close(() => {
      logger.info('HTTP server closed');
    });
  }

  try {
    await database.close();
    logger.info('Database connection closed');
  } catch (error) {
    logger.error('Error closing database:', error);
  }

  logger.info('Graceful shutdown completed');
  process.exit(0);
}
