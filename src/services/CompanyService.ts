import { Company, CreateCompany, UpdateCompany } from '../types/schemas';
import { CompanyRepository } from '../repositories/CompanyRepository';
import { AppError } from '../types/common';
import { logger } from '../utils/logger';
import { isValidUuid } from '../utils/helpers';

export class CompanyService {
  constructor(private companyRepository: CompanyRepository) {}

  async getAllCompanies(): Promise<Company[]> {
    try {
      logger.debug('Fetching all companies');
      return await this.companyRepository.findAll();
    } catch (error) {
      logger.error('Error getting all companies:', error);
      throw new AppError('Failed to retrieve companies', 500);
    }
  }

  async getCompanyById(id: string): Promise<Company> {
    if (!isValidUuid(id)) {
      throw new AppError('Invalid company ID format', 400);
    }

    try {
      logger.debug(`Fetching company with id: ${id}`);
      const company = await this.companyRepository.findById(id);
      
      if (!company) {
        throw new AppError(`Company with id ${id} not found`, 404);
      }

      return company;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error(`Error getting company by id ${id}:`, error);
      throw new AppError('Failed to retrieve company', 500);
    }
  }

  async getCompanyByHubspotId(hubspotId: string): Promise<Company | null> {
    try {
      logger.debug(`Fetching company with hubspot_id: ${hubspotId}`);
      return await this.companyRepository.findByHubspotId(hubspotId);
    } catch (error) {
      logger.error(`Error getting company by hubspot_id ${hubspotId}:`, error);
      throw new AppError('Failed to retrieve company', 500);
    }
  }

  async createCompany(companyData: CreateCompany): Promise<Company> {
    try {
      // Validar que no exista ya una empresa con el mismo hubspot_id
      const existingCompany = await this.companyRepository.findByHubspotId(companyData.hubspot_id);
      if (existingCompany) {
        throw new AppError(`Company with hubspot_id ${companyData.hubspot_id} already exists`, 409);
      }

      logger.info(`Creating new company with hubspot_id: ${companyData.hubspot_id}`);
      return await this.companyRepository.create(companyData);
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error('Error creating company:', error);
      throw new AppError('Failed to create company', 500);
    }
  }

  async updateCompany(id: string, updates: UpdateCompany): Promise<Company> {
    if (!isValidUuid(id)) {
      throw new AppError('Invalid company ID format', 400);
    }

    try {
      // Si se está actualizando el hubspot_id, verificar que no exista
      if (updates.hubspot_id) {
        const existingCompany = await this.companyRepository.findByHubspotId(updates.hubspot_id);
        if (existingCompany && existingCompany.id !== id) {
          throw new AppError(`Company with hubspot_id ${updates.hubspot_id} already exists`, 409);
        }
      }

      logger.info(`Updating company with id: ${id}`);
      const updatedCompany = await this.companyRepository.update(id, updates);
      
      if (!updatedCompany) {
        throw new AppError(`Company with id ${id} not found`, 404);
      }

      return updatedCompany;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error(`Error updating company ${id}:`, error);
      throw new AppError('Failed to update company', 500);
    }
  }

  async deleteCompany(id: string): Promise<void> {
    if (!isValidUuid(id)) {
      throw new AppError('Invalid company ID format', 400);
    }

    try {
      logger.info(`Deleting company with id: ${id}`);
      const deleted = await this.companyRepository.delete(id);
      
      if (!deleted) {
        throw new AppError(`Company with id ${id} not found`, 404);
      }
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error(`Error deleting company ${id}:`, error);
      throw new AppError('Failed to delete company', 500);
    }
  }

  async upsertCompanyByHubspotId(companyData: CreateCompany): Promise<Company> {
    try {
      logger.debug(`Upserting company with hubspot_id: ${companyData.hubspot_id}`);
      return await this.companyRepository.upsertByHubspotId(companyData);
    } catch (error) {
      logger.error(`Error upserting company with hubspot_id ${companyData.hubspot_id}:`, error);
      throw new AppError('Failed to upsert company', 500);
    }
  }

  async getCompanyCount(): Promise<number> {
    try {
      return await this.companyRepository.count();
    } catch (error) {
      logger.error('Error getting company count:', error);
      throw new AppError('Failed to get company count', 500);
    }
  }
}
