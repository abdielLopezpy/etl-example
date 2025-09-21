// Configuración de la aplicación
export interface AppConfig {
  port: number;
  dbPath: string;
  logLevel: string;
  nodeEnv: string;
  hubspot: {
    accessToken: string;
    baseUrl: string;
  };
  rateLimit: {
    windowMs: number;
    maxRequests: number;
  };
}

// Tipos para manejo de errores
export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;

  constructor(message: string, statusCode: number, isOperational: boolean = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.name = this.constructor.name;

    // Capturar stack trace si está disponible (Node.js)
    const errorConstructor = Error as unknown as { captureStackTrace?: (targetObject: object, constructorOpt?: Function) => void };
    if (errorConstructor.captureStackTrace) {
      errorConstructor.captureStackTrace(this, this.constructor);
    }
  }
}

// Tipos para respuestas HTTP
export interface ApiError {
  error: string;
  message: string;
  statusCode: number;
  timestamp: string;
}

// Interfaz para el logger
export interface Logger {
  info(message: string, ...args: unknown[]): void;
  error(message: string, ...args: unknown[]): void;
  warn(message: string, ...args: unknown[]): void;
  debug(message: string, ...args: unknown[]): void;
}

// Tipos para paginación
export interface PaginationOptions {
  limit?: number;
  offset?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}
