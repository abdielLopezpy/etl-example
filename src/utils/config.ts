import { AppConfig } from '../types/common';

// Función para validar variables de entorno requeridas
function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Required environment variable ${name} is not set`);
  }
  return value;
}

// Función para obtener variable de entorno opcional con valor por defecto
function getEnv(name: string, defaultValue: string): string {
  return process.env[name] || defaultValue;
}

// Función para obtener variable de entorno numérica
function getEnvNumber(name: string, defaultValue: number): number {
  const value = process.env[name];
  if (!value) return defaultValue;
  
  const parsed = parseInt(value, 10);
  if (isNaN(parsed)) {
    throw new Error(`Environment variable ${name} must be a valid number, got: ${value}`);
  }
  return parsed;
}

// Cargar configuración desde variables de entorno
export function loadConfig(): AppConfig {
  // Cargar dotenv solo en desarrollo
  if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config();
  }

  return {
    port: getEnvNumber('PORT', 3000),
    dbPath: getEnv('DB_PATH', './data/crm_etl.db'),
    logLevel: getEnv('LOG_LEVEL', 'info'),
    nodeEnv: getEnv('NODE_ENV', 'development'),
    hubspot: {
      accessToken: requireEnv('HUBSPOT_ACCESS_TOKEN'),
      baseUrl: getEnv('HUBSPOT_API_BASE_URL', 'https://api.hubapi.com'),
    },
    rateLimit: {
      windowMs: getEnvNumber('RATE_LIMIT_WINDOW_MS', 15 * 60 * 1000), // 15 minutos
      maxRequests: getEnvNumber('RATE_LIMIT_MAX_REQUESTS', 100),
    },
  };
}

// Instancia global de configuración
let configInstance: AppConfig | null = null;

export function getConfig(): AppConfig {
  if (!configInstance) {
    configInstance = loadConfig();
  }
  return configInstance;
}

// Función para validar la configuración
export function validateConfig(config: AppConfig): void {
  if (config.port <= 0 || config.port > 65535) {
    throw new Error('PORT must be between 1 and 65535');
  }

  if (!config.hubspot.accessToken) {
    throw new Error('HUBSPOT_ACCESS_TOKEN is required');
  }

  if (!config.hubspot.baseUrl.startsWith('http')) {
    throw new Error('HUBSPOT_API_BASE_URL must be a valid URL');
  }

  if (config.rateLimit.maxRequests <= 0) {
    throw new Error('RATE_LIMIT_MAX_REQUESTS must be positive');
  }

  if (config.rateLimit.windowMs <= 0) {
    throw new Error('RATE_LIMIT_WINDOW_MS must be positive');
  }
}
