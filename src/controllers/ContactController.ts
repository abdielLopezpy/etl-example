import { Request, Response, NextFunction } from 'express';
import { ContactService } from '../services/ContactService';
import { CreateContactSchema, UpdateContactSchema } from '../types/schemas';
import { asyncHandler } from '../middleware/errorHandler';
import { logger } from '../utils/logger';

export class ContactController {
  constructor(private contactService: ContactService) {}

  // GET /api/contacts
  getAllContacts = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    logger.debug('GET /api/contacts');
    
    const contacts = await this.contactService.getAllContacts();
    
    res.status(200).json({
      success: true,
      message: 'Contacts retrieved successfully',
      data: contacts,
    });
  });

  // GET /api/contacts/:id
  getContactById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    if (!id) {
      throw new Error('Contact ID is required');
    }
    logger.debug(`GET /api/contacts/${id}`);
    
    const contact = await this.contactService.getContactById(id);
    
    res.status(200).json({
      success: true,
      message: 'Contact retrieved successfully',
      data: contact,
    });
  });

  // GET /api/contacts/company/:companyId
  getContactsByCompany = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { companyId } = req.params;
    if (!companyId) {
      throw new Error('Company ID is required');
    }
    logger.debug(`GET /api/contacts/company/${companyId}`);
    
    const contacts = await this.contactService.getContactsByCompanyId(companyId);
    
    res.status(200).json({
      success: true,
      message: 'Contacts retrieved successfully',
      data: contacts,
    });
  });

  // POST /api/contacts
  createContact = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    logger.debug('POST /api/contacts', { body: req.body });
    
    // El middleware de validación ya validó el body usando CreateContactSchema
    const contact = await this.contactService.createContact(req.body);
    
    res.status(201).json({
      success: true,
      message: 'Contact created successfully',
      data: contact,
    });
  });

  // PATCH /api/contacts/:id
  updateContact = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    if (!id) {
      throw new Error('Contact ID is required');
    }
    logger.debug(`PATCH /api/contacts/${id}`, { body: req.body });
    
    // El middleware de validación ya validó el body usando UpdateContactSchema
    const contact = await this.contactService.updateContact(id, req.body);
    
    res.status(200).json({
      success: true,
      message: 'Contact updated successfully',
      data: contact,
    });
  });

  // DELETE /api/contacts/:id
  deleteContact = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    if (!id) {
      throw new Error('Contact ID is required');
    }
    logger.debug(`DELETE /api/contacts/${id}`);
    
    await this.contactService.deleteContact(id);
    
    res.status(200).json({
      success: true,
      message: 'Contact deleted successfully',
    });
  });

  // GET /api/contacts/stats
  getContactStats = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    logger.debug('GET /api/contacts/stats');
    
    const count = await this.contactService.getContactCount();
    
    res.status(200).json({
      success: true,
      message: 'Contact statistics retrieved successfully',
      data: {
        totalContacts: count,
      },
    });
  });
}
