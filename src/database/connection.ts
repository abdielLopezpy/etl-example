import sqlite3 from 'sqlite3';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs';
import { logger } from '../utils/logger';

export class Database {
  private db: sqlite3.Database;
  
  constructor(dbPath: string) {
    // Crear directorio si no existe
    const dir = path.dirname(dbPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    this.db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        logger.error('Error opening database:', err);
        throw err;
      }
      logger.info(`Connected to SQLite database at ${dbPath}`);
    });

    // Habilitar foreign keys
    this.db.run('PRAGMA foreign_keys = ON');
  }

  // Métodos promisificados para trabajar con async/await
  public run(sql: string, params: unknown[] = []): Promise<sqlite3.RunResult> {
    return new Promise((resolve, reject) => {
      this.db.run(sql, params, function(err) {
        if (err) {
          reject(err);
        } else {
          resolve(this);
        }
      });
    });
  }

  public get<T>(sql: string, params: unknown[] = []): Promise<T | undefined> {
    return new Promise((resolve, reject) => {
      this.db.get(sql, params, (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row as T);
        }
      });
    });
  }

  public all<T>(sql: string, params: unknown[] = []): Promise<T[]> {
    return new Promise((resolve, reject) => {
      this.db.all(sql, params, (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows as T[]);
        }
      });
    });
  }

  public close(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.close((err) => {
        if (err) {
          reject(err);
        } else {
          logger.info('Database connection closed');
          resolve();
        }
      });
    });
  }

  public async initializeTables(): Promise<void> {
    try {
      // Crear tabla Companies
      await this.run(`
        CREATE TABLE IF NOT EXISTS companies (
          id TEXT PRIMARY KEY,
          hubspot_id TEXT UNIQUE NOT NULL,
          name TEXT NOT NULL,
          domain TEXT NOT NULL,
          created_at TEXT NOT NULL
        )
      `);

      // Crear tabla Contacts
      await this.run(`
        CREATE TABLE IF NOT EXISTS contacts (
          id TEXT PRIMARY KEY,
          hubspot_id TEXT UNIQUE NOT NULL,
          firstname TEXT,
          lastname TEXT,
          email TEXT UNIQUE NOT NULL,
          company_id TEXT,
          created_at TEXT NOT NULL,
          FOREIGN KEY (company_id) REFERENCES companies (id)
        )
      `);

      // Crear índices para mejorar el rendimiento
      await this.run('CREATE INDEX IF NOT EXISTS idx_companies_hubspot_id ON companies(hubspot_id)');
      await this.run('CREATE INDEX IF NOT EXISTS idx_contacts_hubspot_id ON contacts(hubspot_id)');
      await this.run('CREATE INDEX IF NOT EXISTS idx_contacts_email ON contacts(email)');
      await this.run('CREATE INDEX IF NOT EXISTS idx_contacts_company_id ON contacts(company_id)');

      logger.info('Database tables initialized successfully');
    } catch (error) {
      logger.error('Error initializing database tables:', error);
      throw error;
    }
  }
}

// Singleton para la instancia de base de datos
let dbInstance: Database | null = null;

export function getDatabase(dbPath?: string): Database {
  if (!dbInstance) {
    if (!dbPath) {
      throw new Error('Database path is required for first initialization');
    }
    dbInstance = new Database(dbPath);
  }
  return dbInstance;
}

export async function initializeDatabase(dbPath: string): Promise<Database> {
  const db = getDatabase(dbPath);
  await db.initializeTables();
  return db;
}
