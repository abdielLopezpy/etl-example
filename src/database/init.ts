#!/usr/bin/env node

/**
 * Script para inicializar la base de datos manualmente
 * Uso: npm run db:init
 */

import { initializeDatabase } from '../database/connection';
import { getConfig } from '../utils/config';
import { logger } from '../utils/logger';

async function initDb() {
  try {
    const config = getConfig();
    logger.info(`Initializing database at: ${config.dbPath}`);
    
    await initializeDatabase(config.dbPath);
    
    logger.info('✅ Database initialized successfully');
    process.exit(0);
  } catch (error) {
    logger.error('❌ Failed to initialize database:', error);
    process.exit(1);
  }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  initDb();
}
