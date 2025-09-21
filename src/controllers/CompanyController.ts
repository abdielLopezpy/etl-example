import { Request, Response, NextFunction } from 'express';
import { CompanyService } from '../services/CompanyService';
import { CreateCompanySchema, UpdateCompanySchema } from '../types/schemas';
import { asyncHandler } from '../middleware/errorHandler';
import { logger } from '../utils/logger';

export class CompanyController {
  constructor(private companyService: CompanyService) {}

  // GET /api/companies
  getAllCompanies = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    logger.debug('GET /api/companies');
    
    const companies = await this.companyService.getAllCompanies();
    
    res.status(200).json({
      success: true,
      message: 'Companies retrieved successfully',
      data: companies,
    });
  });

  // GET /api/companies/:id
  getCompanyById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    if (!id) {
      throw new Error('Company ID is required');
    }
    logger.debug(`GET /api/companies/${id}`);
    
    const company = await this.companyService.getCompanyById(id);
    
    res.status(200).json({
      success: true,
      message: 'Company retrieved successfully',
      data: company,
    });
  });

  // POST /api/companies
  createCompany = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    logger.debug('POST /api/companies', { body: req.body });
    
    // El middleware de validación ya validó el body usando CreateCompanySchema
    const company = await this.companyService.createCompany(req.body);
    
    res.status(201).json({
      success: true,
      message: 'Company created successfully',
      data: company,
    });
  });

  // PATCH /api/companies/:id
  updateCompany = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    if (!id) {
      throw new Error('Company ID is required');
    }
    logger.debug(`PATCH /api/companies/${id}`, { body: req.body });
    
    // El middleware de validación ya validó el body usando UpdateCompanySchema
    const company = await this.companyService.updateCompany(id, req.body);
    
    res.status(200).json({
      success: true,
      message: 'Company updated successfully',
      data: company,
    });
  });

  // DELETE /api/companies/:id
  deleteCompany = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    if (!id) {
      throw new Error('Company ID is required');
    }
    logger.debug(`DELETE /api/companies/${id}`);
    
    await this.companyService.deleteCompany(id);
    
    res.status(200).json({
      success: true,
      message: 'Company deleted successfully',
    });
  });

  // GET /api/companies/stats
  getCompanyStats = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    logger.debug('GET /api/companies/stats');
    
    const count = await this.companyService.getCompanyCount();
    
    res.status(200).json({
      success: true,
      message: 'Company statistics retrieved successfully',
      data: {
        totalCompanies: count,
      },
    });
  });
}
