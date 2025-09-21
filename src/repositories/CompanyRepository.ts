import { Company, CreateCompany, UpdateCompany } from '../types/schemas';
import { Database } from '../database/connection';
import { generateId, getCurrentTimestamp } from '../utils/helpers';
import { logger } from '../utils/logger';

export class CompanyRepository {
  constructor(private db: Database) {}

  async findAll(): Promise<Company[]> {
    try {
      const companies = await this.db.all<Company>(
        'SELECT id, hubspot_id, name, domain, created_at FROM companies ORDER BY created_at DESC'
      );
      return companies;
    } catch (error) {
      logger.error('Error finding all companies:', error);
      throw error;
    }
  }

  async findById(id: string): Promise<Company | null> {
    try {
      const company = await this.db.get<Company>(
        'SELECT id, hubspot_id, name, domain, created_at FROM companies WHERE id = ?',
        [id]
      );
      return company || null;
    } catch (error) {
      logger.error(`Error finding company by id ${id}:`, error);
      throw error;
    }
  }

  async findByHubspotId(hubspotId: string): Promise<Company | null> {
    try {
      const company = await this.db.get<Company>(
        'SELECT id, hubspot_id, name, domain, created_at FROM companies WHERE hubspot_id = ?',
        [hubspotId]
      );
      return company || null;
    } catch (error) {
      logger.error(`Error finding company by hubspot_id ${hubspotId}:`, error);
      throw error;
    }
  }

  async create(companyData: CreateCompany): Promise<Company> {
    const id = generateId();
    const createdAt = getCurrentTimestamp();
    const company: Company = {
      id,
      ...companyData,
      created_at: createdAt,
    };

    try {
      await this.db.run(
        `INSERT INTO companies (id, hubspot_id, name, domain, created_at) 
         VALUES (?, ?, ?, ?, ?)`,
        [company.id, company.hubspot_id, company.name, company.domain, company.created_at]
      );

      logger.info(`Company created with id: ${id}`);
      return company;
    } catch (error) {
      logger.error('Error creating company:', error);
      throw error;
    }
  }

  async update(id: string, updates: UpdateCompany): Promise<Company | null> {
    try {
      const existingCompany = await this.findById(id);
      if (!existingCompany) {
        return null;
      }

      const updateFields: string[] = [];
      const updateValues: any[] = [];

      if (updates.hubspot_id !== undefined) {
        updateFields.push('hubspot_id = ?');
        updateValues.push(updates.hubspot_id);
      }
      if (updates.name !== undefined) {
        updateFields.push('name = ?');
        updateValues.push(updates.name);
      }
      if (updates.domain !== undefined) {
        updateFields.push('domain = ?');
        updateValues.push(updates.domain);
      }

      if (updateFields.length === 0) {
        return existingCompany; // No hay campos para actualizar
      }

      updateValues.push(id);
      
      await this.db.run(
        `UPDATE companies SET ${updateFields.join(', ')} WHERE id = ?`,
        updateValues
      );

      logger.info(`Company updated with id: ${id}`);
      return this.findById(id);
    } catch (error) {
      logger.error(`Error updating company ${id}:`, error);
      throw error;
    }
  }

  async delete(id: string): Promise<boolean> {
    try {
      const result = await this.db.run('DELETE FROM companies WHERE id = ?', [id]);
      const deleted = result.changes > 0;
      
      if (deleted) {
        logger.info(`Company deleted with id: ${id}`);
      }
      
      return deleted;
    } catch (error) {
      logger.error(`Error deleting company ${id}:`, error);
      throw error;
    }
  }

  async upsertByHubspotId(companyData: CreateCompany): Promise<Company> {
    try {
      const existingCompany = await this.findByHubspotId(companyData.hubspot_id);
      
      if (existingCompany) {
        // Actualizar empresa existente
        const updatedCompany = await this.update(existingCompany.id, companyData);
        return updatedCompany!; // Sabemos que existe porque lo acabamos de encontrar
      } else {
        // Crear nueva empresa
        return await this.create(companyData);
      }
    } catch (error) {
      logger.error(`Error upserting company with hubspot_id ${companyData.hubspot_id}:`, error);
      throw error;
    }
  }

  async count(): Promise<number> {
    try {
      const result = await this.db.get<{ count: number }>('SELECT COUNT(*) as count FROM companies');
      return result?.count || 0;
    } catch (error) {
      logger.error('Error counting companies:', error);
      throw error;
    }
  }
}
