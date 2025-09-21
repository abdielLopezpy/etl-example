import { Request, Response } from 'express';
import { EtlService } from '../services/EtlService';
import { asyncHandler } from '../middleware/errorHandler';
import { logger } from '../utils/logger';

export class EtlController {
  constructor(private etlService: EtlService) {}

  // POST /api/etl/sync-crm
  syncCrm = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    logger.info('POST /api/etl/sync-crm - Starting CRM sync');
    
    const result = await this.etlService.syncCrmData();
    
    res.status(200).json({
      success: true,
      ...result,
    });
  });

  // GET /api/etl/status
  getSyncStatus = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    logger.debug('GET /api/etl/status');
    
    const status = this.etlService.getSyncStatus();
    
    res.status(200).json({
      success: true,
      message: 'Sync status retrieved successfully',
      data: status,
    });
  });

  // GET /api/etl/info
  getSyncInfo = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    logger.debug('GET /api/etl/info');
    
    const info = await this.etlService.getLastSyncInfo();
    
    if (!info) {
      res.status(200).json({
        success: true,
        message: 'No sync information available',
        data: null,
      });
      return;
    }
    
    res.status(200).json({
      success: true,
      message: 'Sync information retrieved successfully',
      data: info,
    });
  });

  // GET /api/etl/health
  getHealth = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    logger.debug('GET /api/etl/health');
    
    const isRunning = this.etlService.isSyncRunning();
    const info = await this.etlService.getLastSyncInfo();
    
    res.status(200).json({
      success: true,
      message: 'ETL service health check',
      data: {
        isRunning,
        lastSyncInfo: info,
        timestamp: new Date().toISOString(),
      },
    });
  });
}
