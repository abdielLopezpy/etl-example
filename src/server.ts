import { createApp, gracefulShutdown } from './app';
import { logger } from './utils/logger';

async function startServer() {
  try {
    // Crear aplicación
    const { app, config, database } = await createApp();
    
    // Iniciar servidor
    const server = app.listen(config.port, () => {
      logger.info(`🚀 CrmETL Server is running on port ${config.port}`);
      logger.info(`📊 Environment: ${config.nodeEnv}`);
      logger.info(`🗄️  Database: ${config.dbPath}`);
      logger.info(`🌐 Health check: http://localhost:${config.port}/health`);
      logger.info(`📋 API documentation: http://localhost:${config.port}/api`);
    });

    // Manejo de cierre elegante
    const shutdown = () => gracefulShutdown(database, server);
    
    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
    
    // Manejo de errores no capturados
    process.on('uncaughtException', (error) => {
      logger.error('Uncaught Exception:', error);
      gracefulShutdown(database, server);
    });
    
    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
      gracefulShutdown(database, server);
    });

  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Iniciar el servidor
if (require.main === module) {
  startServer().catch((error) => {
    logger.error('Server startup failed:', error);
    process.exit(1);
  });
}

export { startServer };
