import { v4 as uuidv4 } from 'uuid';

// Generar UUID v4
export function generateId(): string {
  return uuidv4();
}

// Obtener timestamp ISO 8601
export function getCurrentTimestamp(): string {
  return new Date().toISOString();
}

// Función para pausar la ejecución (útil para rate limiting)
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Función para formatear errores de manera consistente
export function formatError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}

// Función para validar si una cadena es un UUID válido
export function isValidUuid(str: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
}

// Función para limpiar y normalizar strings
export function cleanString(str: string | null | undefined): string {
  return str?.trim() || '';
}

// Función para validar formato de email
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Función para convertir object a JSON de manera segura
export function safeJsonStringify(obj: unknown): string {
  try {
    return JSON.stringify(obj, null, 2);
  } catch (error) {
    return '[Unable to serialize object]';
  }
}

// Función para extraer propiedades específicas de un objeto
export function pick<T extends Record<string, unknown>, K extends keyof T>(
  obj: T,
  keys: K[]
): Pick<T, K> {
  const result: Partial<Pick<T, K>> = {};
  for (const key of keys) {
    if (key in obj) {
      result[key] = obj[key];
    }
  }
  return result as Pick<T, K>;
}

// Función para omitir propiedades específicas de un objeto
export function omit<T extends Record<string, unknown>, K extends keyof T>(
  obj: T,
  keys: K[]
): Omit<T, K> {
  const result = { ...obj };
  for (const key of keys) {
    delete result[key];
  }
  return result;
}

// Función para capitalizar la primera letra
export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

// Función para crear un delay con exponential backoff
export function exponentialBackoff(attempt: number, baseDelay: number = 1000): number {
  return Math.min(baseDelay * Math.pow(2, attempt), 30000); // máximo 30 segundos
}
