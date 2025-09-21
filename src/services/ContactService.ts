import { Contact, CreateContact, UpdateContact } from '../types/schemas';
import { ContactRepository } from '../repositories/ContactRepository';
import { CompanyRepository } from '../repositories/CompanyRepository';
import { AppError } from '../types/common';
import { logger } from '../utils/logger';
import { isValidUuid, isValidEmail } from '../utils/helpers';

export class ContactService {
  constructor(
    private contactRepository: ContactRepository,
    private companyRepository: CompanyRepository
  ) {}

  async getAllContacts(): Promise<Contact[]> {
    try {
      logger.debug('Fetching all contacts');
      return await this.contactRepository.findAll();
    } catch (error) {
      logger.error('Error getting all contacts:', error);
      throw new AppError('Failed to retrieve contacts', 500);
    }
  }

  async getContactById(id: string): Promise<Contact> {
    if (!isValidUuid(id)) {
      throw new AppError('Invalid contact ID format', 400);
    }

    try {
      logger.debug(`Fetching contact with id: ${id}`);
      const contact = await this.contactRepository.findById(id);
      
      if (!contact) {
        throw new AppError(`Contact with id ${id} not found`, 404);
      }

      return contact;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error(`Error getting contact by id ${id}:`, error);
      throw new AppError('Failed to retrieve contact', 500);
    }
  }

  async getContactByHubspotId(hubspotId: string): Promise<Contact | null> {
    try {
      logger.debug(`Fetching contact with hubspot_id: ${hubspotId}`);
      return await this.contactRepository.findByHubspotId(hubspotId);
    } catch (error) {
      logger.error(`Error getting contact by hubspot_id ${hubspotId}:`, error);
      throw new AppError('Failed to retrieve contact', 500);
    }
  }

  async getContactsByCompanyId(companyId: string): Promise<Contact[]> {
    if (!isValidUuid(companyId)) {
      throw new AppError('Invalid company ID format', 400);
    }

    try {
      // Verificar que la empresa existe
      const company = await this.companyRepository.findById(companyId);
      if (!company) {
        throw new AppError(`Company with id ${companyId} not found`, 404);
      }

      logger.debug(`Fetching contacts for company: ${companyId}`);
      return await this.contactRepository.findByCompanyId(companyId);
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error(`Error getting contacts by company_id ${companyId}:`, error);
      throw new AppError('Failed to retrieve contacts', 500);
    }
  }

  async createContact(contactData: CreateContact): Promise<Contact> {
    // Validaciones
    if (!isValidEmail(contactData.email)) {
      throw new AppError('Invalid email format', 400);
    }

    if (contactData.company_id && !isValidUuid(contactData.company_id)) {
      throw new AppError('Invalid company ID format', 400);
    }

    try {
      // Validar que no exista ya un contacto con el mismo hubspot_id
      const existingContact = await this.contactRepository.findByHubspotId(contactData.hubspot_id);
      if (existingContact) {
        throw new AppError(`Contact with hubspot_id ${contactData.hubspot_id} already exists`, 409);
      }

      // Validar que no exista ya un contacto con el mismo email
      const existingEmailContact = await this.contactRepository.findByEmail(contactData.email);
      if (existingEmailContact) {
        throw new AppError(`Contact with email ${contactData.email} already exists`, 409);
      }

      // Si se especifica company_id, validar que la empresa existe
      if (contactData.company_id) {
        const company = await this.companyRepository.findById(contactData.company_id);
        if (!company) {
          throw new AppError(`Company with id ${contactData.company_id} not found`, 404);
        }
      }

      logger.info(`Creating new contact with hubspot_id: ${contactData.hubspot_id}`);
      return await this.contactRepository.create(contactData);
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error('Error creating contact:', error);
      throw new AppError('Failed to create contact', 500);
    }
  }

  async updateContact(id: string, updates: UpdateContact): Promise<Contact> {
    if (!isValidUuid(id)) {
      throw new AppError('Invalid contact ID format', 400);
    }

    // Validaciones
    if (updates.email && !isValidEmail(updates.email)) {
      throw new AppError('Invalid email format', 400);
    }

    if (updates.company_id && !isValidUuid(updates.company_id)) {
      throw new AppError('Invalid company ID format', 400);
    }

    try {
      // Si se está actualizando el hubspot_id, verificar que no exista
      if (updates.hubspot_id) {
        const existingContact = await this.contactRepository.findByHubspotId(updates.hubspot_id);
        if (existingContact && existingContact.id !== id) {
          throw new AppError(`Contact with hubspot_id ${updates.hubspot_id} already exists`, 409);
        }
      }

      // Si se está actualizando el email, verificar que no exista
      if (updates.email) {
        const existingEmailContact = await this.contactRepository.findByEmail(updates.email);
        if (existingEmailContact && existingEmailContact.id !== id) {
          throw new AppError(`Contact with email ${updates.email} already exists`, 409);
        }
      }

      // Si se especifica company_id, validar que la empresa existe
      if (updates.company_id) {
        const company = await this.companyRepository.findById(updates.company_id);
        if (!company) {
          throw new AppError(`Company with id ${updates.company_id} not found`, 404);
        }
      }

      logger.info(`Updating contact with id: ${id}`);
      const updatedContact = await this.contactRepository.update(id, updates);
      
      if (!updatedContact) {
        throw new AppError(`Contact with id ${id} not found`, 404);
      }

      return updatedContact;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error(`Error updating contact ${id}:`, error);
      throw new AppError('Failed to update contact', 500);
    }
  }

  async deleteContact(id: string): Promise<void> {
    if (!isValidUuid(id)) {
      throw new AppError('Invalid contact ID format', 400);
    }

    try {
      logger.info(`Deleting contact with id: ${id}`);
      const deleted = await this.contactRepository.delete(id);
      
      if (!deleted) {
        throw new AppError(`Contact with id ${id} not found`, 404);
      }
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error(`Error deleting contact ${id}:`, error);
      throw new AppError('Failed to delete contact', 500);
    }
  }

  async upsertContactByHubspotId(contactData: CreateContact): Promise<Contact> {
    try {
      logger.debug(`Upserting contact with hubspot_id: ${contactData.hubspot_id}`);
      return await this.contactRepository.upsertByHubspotId(contactData);
    } catch (error) {
      logger.error(`Error upserting contact with hubspot_id ${contactData.hubspot_id}:`, error);
      throw new AppError('Failed to upsert contact', 500);
    }
  }

  async getContactCount(): Promise<number> {
    try {
      return await this.contactRepository.count();
    } catch (error) {
      logger.error('Error getting contact count:', error);
      throw new AppError('Failed to get contact count', 500);
    }
  }
}
