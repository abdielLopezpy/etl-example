import pino from 'pino';

// Configuración del logger basada en el entorno
const logLevel = process.env.LOG_LEVEL || 'info';
const isDevelopment = process.env.NODE_ENV !== 'production';
const isTest = process.env.NODE_ENV === 'test';

// Crear instancia de Pino
export const logger = pino({
  level: isTest ? 'silent' : logLevel,
  // En desarrollo, usar pretty print para mejor legibilidad (solo si no es test)
  transport: (isDevelopment && !isTest) ? {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'yyyy-mm-dd HH:MM:ss',
      ignore: 'pid,hostname',
    }
  } : undefined,
  // En producción, usar formato JSON estructurado
  formatters: {
    level(label) {
      return { level: label };
    },
    log(object) {
      const { req, res, ...rest } = object;
      return rest;
    }
  },
  // Serializar automáticamente objetos de error
  serializers: {
    err: pino.stdSerializers.err,
    req: pino.stdSerializers.req,
    res: pino.stdSerializers.res,
  },
  // Información adicional en los logs
  base: {
    service: 'crm-etl',
    version: process.env.npm_package_version || '1.0.0',
  }
});

// Función para crear un logger hijo con contexto adicional
export function createChildLogger(bindings: Record<string, unknown>) {
  return logger.child(bindings);
}

// Middleware de logging para Express
export function createHttpLogger() {
  return require('pino-http')({
    logger,
    serializers: {
      req: pino.stdSerializers.req,
      res: pino.stdSerializers.res,
    },
    // Personalizar el mensaje de log
    customLogLevel: function (req: any, res: any, err: any) {
      if (res.statusCode >= 400 && res.statusCode < 500) {
        return 'warn';
      } else if (res.statusCode >= 500 || err) {
        return 'error';
      } else if (res.statusCode >= 300 && res.statusCode < 400) {
        return 'silent';
      }
      return 'info';
    },
    // Personalizar el mensaje
    customSuccessMessage: function (req: any, res: any) {
      if (res.statusCode === 404) {
        return 'resource not found';
      }
      return `${req.method} completed`;
    },
    // Personalizar mensaje de error
    customErrorMessage: function (req: any, res: any, err: any) {
      return `${req.method} errored with status ${res.statusCode}`;
    },
    // Incluir tiempo de respuesta
    customAttributeKeys: {
      responseTime: 'responseTime',
      req: 'request',
      res: 'response',
    }
  });
}

export default logger;
