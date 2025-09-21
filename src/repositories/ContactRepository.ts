import { Contact, CreateContact, UpdateContact } from '../types/schemas';
import { Database } from '../database/connection';
import { generateId, getCurrentTimestamp } from '../utils/helpers';
import { logger } from '../utils/logger';

export class ContactRepository {
  constructor(private db: Database) {}

  async findAll(): Promise<Contact[]> {
    try {
      const contacts = await this.db.all<Contact>(
        `SELECT id, hubspot_id, firstname, lastname, email, company_id, created_at 
         FROM contacts ORDER BY created_at DESC`
      );
      return contacts;
    } catch (error) {
      logger.error('Error finding all contacts:', error);
      throw error;
    }
  }

  async findById(id: string): Promise<Contact | null> {
    try {
      const contact = await this.db.get<Contact>(
        `SELECT id, hubspot_id, firstname, lastname, email, company_id, created_at 
         FROM contacts WHERE id = ?`,
        [id]
      );
      return contact || null;
    } catch (error) {
      logger.error(`Error finding contact by id ${id}:`, error);
      throw error;
    }
  }

  async findByHubspotId(hubspotId: string): Promise<Contact | null> {
    try {
      const contact = await this.db.get<Contact>(
        `SELECT id, hubspot_id, firstname, lastname, email, company_id, created_at 
         FROM contacts WHERE hubspot_id = ?`,
        [hubspotId]
      );
      return contact || null;
    } catch (error) {
      logger.error(`Error finding contact by hubspot_id ${hubspotId}:`, error);
      throw error;
    }
  }

  async findByEmail(email: string): Promise<Contact | null> {
    try {
      const contact = await this.db.get<Contact>(
        `SELECT id, hubspot_id, firstname, lastname, email, company_id, created_at 
         FROM contacts WHERE email = ?`,
        [email]
      );
      return contact || null;
    } catch (error) {
      logger.error(`Error finding contact by email ${email}:`, error);
      throw error;
    }
  }

  async findByCompanyId(companyId: string): Promise<Contact[]> {
    try {
      const contacts = await this.db.all<Contact>(
        `SELECT id, hubspot_id, firstname, lastname, email, company_id, created_at 
         FROM contacts WHERE company_id = ? ORDER BY created_at DESC`,
        [companyId]
      );
      return contacts;
    } catch (error) {
      logger.error(`Error finding contacts by company_id ${companyId}:`, error);
      throw error;
    }
  }

  async create(contactData: CreateContact): Promise<Contact> {
    const id = generateId();
    const createdAt = getCurrentTimestamp();
    const contact: Contact = {
      id,
      ...contactData,
      created_at: createdAt,
    };

    try {
      await this.db.run(
        `INSERT INTO contacts (id, hubspot_id, firstname, lastname, email, company_id, created_at) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          contact.id,
          contact.hubspot_id,
          contact.firstname || null,
          contact.lastname || null,
          contact.email,
          contact.company_id || null,
          contact.created_at,
        ]
      );

      logger.info(`Contact created with id: ${id}`);
      return contact;
    } catch (error) {
      logger.error('Error creating contact:', error);
      throw error;
    }
  }

  async update(id: string, updates: UpdateContact): Promise<Contact | null> {
    try {
      const existingContact = await this.findById(id);
      if (!existingContact) {
        return null;
      }

      const updateFields: string[] = [];
      const updateValues: any[] = [];

      if (updates.hubspot_id !== undefined) {
        updateFields.push('hubspot_id = ?');
        updateValues.push(updates.hubspot_id);
      }
      if (updates.firstname !== undefined) {
        updateFields.push('firstname = ?');
        updateValues.push(updates.firstname);
      }
      if (updates.lastname !== undefined) {
        updateFields.push('lastname = ?');
        updateValues.push(updates.lastname);
      }
      if (updates.email !== undefined) {
        updateFields.push('email = ?');
        updateValues.push(updates.email);
      }
      if (updates.company_id !== undefined) {
        updateFields.push('company_id = ?');
        updateValues.push(updates.company_id);
      }

      if (updateFields.length === 0) {
        return existingContact; // No hay campos para actualizar
      }

      updateValues.push(id);
      
      await this.db.run(
        `UPDATE contacts SET ${updateFields.join(', ')} WHERE id = ?`,
        updateValues
      );

      logger.info(`Contact updated with id: ${id}`);
      return this.findById(id);
    } catch (error) {
      logger.error(`Error updating contact ${id}:`, error);
      throw error;
    }
  }

  async delete(id: string): Promise<boolean> {
    try {
      const result = await this.db.run('DELETE FROM contacts WHERE id = ?', [id]);
      const deleted = result.changes > 0;
      
      if (deleted) {
        logger.info(`Contact deleted with id: ${id}`);
      }
      
      return deleted;
    } catch (error) {
      logger.error(`Error deleting contact ${id}:`, error);
      throw error;
    }
  }

  async upsertByHubspotId(contactData: CreateContact): Promise<Contact> {
    try {
      const existingContact = await this.findByHubspotId(contactData.hubspot_id);
      
      if (existingContact) {
        // Actualizar contacto existente
        const updatedContact = await this.update(existingContact.id, contactData);
        return updatedContact!; // Sabemos que existe porque lo acabamos de encontrar
      } else {
        // Crear nuevo contacto
        return await this.create(contactData);
      }
    } catch (error) {
      logger.error(`Error upserting contact with hubspot_id ${contactData.hubspot_id}:`, error);
      throw error;
    }
  }

  async count(): Promise<number> {
    try {
      const result = await this.db.get<{ count: number }>('SELECT COUNT(*) as count FROM contacts');
      return result?.count || 0;
    } catch (error) {
      logger.error('Error counting contacts:', error);
      throw error;
    }
  }
}
