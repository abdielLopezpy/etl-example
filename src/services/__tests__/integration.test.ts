import { Database } from '../../database/connection';
import { CompanyRepository } from '../../repositories/CompanyRepository';
import { ContactRepository } from '../../repositories/ContactRepository';
import { CompanyService } from '../../services/CompanyService';
import { ContactService } from '../../services/ContactService';
import { CreateCompany, CreateContact } from '../../types/schemas';

describe('Service Integration Tests', () => {
  let database: Database;
  let companyRepository: CompanyRepository;
  let contactRepository: ContactRepository;
  let companyService: CompanyService;
  let contactService: ContactService;

  beforeEach(async () => {
    // Crear base de datos en memoria para cada prueba
    database = new Database(':memory:');
    await database.initializeTables();
    
    companyRepository = new CompanyRepository(database);
    contactRepository = new ContactRepository(database);
    companyService = new CompanyService(companyRepository);
    contactService = new ContactService(contactRepository, companyRepository);
  });

  afterEach(async () => {
    await database.close();
  });

  describe('CompanyService Integration', () => {
    it('should create and retrieve companies', async () => {
      const companyData: CreateCompany = {
        hubspot_id: 'hubspot-123',
        name: 'Test Company',
        domain: 'test.com',
      };

      // Crear empresa
      const createdCompany = await companyService.createCompany(companyData);
      expect(createdCompany).toEqual({
        id: expect.any(String),
        hubspot_id: 'hubspot-123',
        name: 'Test Company',
        domain: 'test.com',
        created_at: expect.any(String),
      });

      // Obtener empresa
      const retrievedCompany = await companyService.getCompanyById(createdCompany.id);
      expect(retrievedCompany).toEqual(createdCompany);

      // Listar empresas
      const companies = await companyService.getAllCompanies();
      expect(companies).toHaveLength(1);
      expect(companies[0]).toEqual(createdCompany);
    });

    it('should handle non-existent company', async () => {
      const fakeId = '123e4567-e89b-12d3-a456-426614174000';
      
      await expect(companyService.getCompanyById(fakeId)).rejects.toThrow(`Company with id ${fakeId} not found`);
    });

    it('should upsert companies by hubspot_id', async () => {
      const companyData: CreateCompany = {
        hubspot_id: 'hubspot-123',
        name: 'Original Company',
        domain: 'original.com',
      };

      // Crear empresa original
      const originalCompany = await companyService.createCompany(companyData);

      // Intentar crear empresa con mismo hubspot_id pero datos diferentes
      const updatedData: CreateCompany = {
        hubspot_id: 'hubspot-123',
        name: 'Updated Company',
        domain: 'updated.com',
      };

      const upsertedCompany = await companyService.upsertCompanyByHubspotId(updatedData);
      
      // Debe actualizar la empresa existente
      expect(upsertedCompany.id).toBe(originalCompany.id);
      expect(upsertedCompany.name).toBe('Updated Company');
      expect(upsertedCompany.domain).toBe('updated.com');

      // Verificar que solo hay una empresa
      const companies = await companyService.getAllCompanies();
      expect(companies).toHaveLength(1);
    });
  });

  describe('ContactService Integration', () => {
    it('should create and retrieve contacts', async () => {
      const contactData: CreateContact = {
        hubspot_id: 'contact-123',
        email: 'test@example.com',
        firstname: 'John',
        lastname: 'Doe',
      };

      // Crear contacto
      const createdContact = await contactService.createContact(contactData);
      expect(createdContact).toEqual(expect.objectContaining({
        id: expect.any(String),
        hubspot_id: 'contact-123',
        email: 'test@example.com',
        firstname: 'John',
        lastname: 'Doe',
        created_at: expect.any(String),
      }));

      // Obtener contacto
      const retrievedContact = await contactService.getContactById(createdContact.id);
      expect(retrievedContact).toEqual(expect.objectContaining({
        id: createdContact.id,
        hubspot_id: 'contact-123',
        email: 'test@example.com',
        firstname: 'John',
        lastname: 'Doe',
        created_at: expect.any(String),
      }));

      // Listar contactos
      const contacts = await contactService.getAllContacts();
      expect(contacts).toHaveLength(1);
      expect(contacts[0]).toEqual(expect.objectContaining({
        id: createdContact.id,
        hubspot_id: 'contact-123',
        email: 'test@example.com',
        firstname: 'John',
        lastname: 'Doe',
        created_at: expect.any(String),
      }));
    });

    it('should associate contact with company', async () => {
      // Crear empresa primero
      const companyData: CreateCompany = {
        hubspot_id: 'hubspot-company',
        name: 'Test Company',
        domain: 'test.com',
      };
      const company = await companyService.createCompany(companyData);

      // Crear contacto con company_id
      const contactData: CreateContact = {
        hubspot_id: 'contact-123',
        email: 'test@example.com',
        firstname: 'John',
        lastname: 'Doe',
        company_id: company.id,
      };

      const contact = await contactService.createContact(contactData);
      expect(contact.company_id).toBe(company.id);

      // Verificar que se puede obtener
      const retrievedContact = await contactService.getContactById(contact.id);
      expect(retrievedContact?.company_id).toBe(company.id);
    });

    it('should handle non-existent contact', async () => {
      const fakeId = '123e4567-e89b-12d3-a456-426614174000';
      
      await expect(contactService.getContactById(fakeId)).rejects.toThrow(`Contact with id ${fakeId} not found`);
    });

    it('should upsert contacts by hubspot_id', async () => {
      const contactData: CreateContact = {
        hubspot_id: 'contact-123',
        email: 'original@example.com',
        firstname: 'John',
        lastname: 'Doe',
      };

      // Crear contacto original
      const originalContact = await contactService.createContact(contactData);

      // Intentar crear contacto con mismo hubspot_id pero datos diferentes
      const updatedData: CreateContact = {
        hubspot_id: 'contact-123',
        email: 'updated@example.com',
        firstname: 'Jane',
        lastname: 'Smith',
      };

      const upsertedContact = await contactService.upsertContactByHubspotId(updatedData);
      
      // Debe actualizar el contacto existente
      expect(upsertedContact.id).toBe(originalContact.id);
      expect(upsertedContact.email).toBe('updated@example.com');
      expect(upsertedContact.firstname).toBe('Jane');
      expect(upsertedContact.lastname).toBe('Smith');

      // Verificar que solo hay un contacto
      const contacts = await contactService.getAllContacts();
      expect(contacts).toHaveLength(1);
    });
  });

  describe('Database Integration', () => {
    it('should handle database transactions correctly', async () => {
      const companyData: CreateCompany = {
        hubspot_id: 'hubspot-123',
        name: 'Test Company',
        domain: 'test.com',
      };

      // Crear empresa
      const company = await companyService.createCompany(companyData);

      // Crear múltiples contactos asociados
      const contactsData: CreateContact[] = [
        {
          hubspot_id: 'contact-1',
          email: 'contact1@example.com',
          firstname: 'John',
          lastname: 'Doe',
          company_id: company.id,
        },
        {
          hubspot_id: 'contact-2',
          email: 'contact2@example.com',
          firstname: 'Jane',
          lastname: 'Smith',
          company_id: company.id,
        },
      ];

      // Crear contactos
      const contacts = await Promise.all(
        contactsData.map(data => contactService.createContact(data))
      );

      expect(contacts).toHaveLength(2);
      contacts.forEach(contact => {
        expect(contact.company_id).toBe(company.id);
      });

      // Verificar que se pueden recuperar
      const allContacts = await contactService.getAllContacts();
      expect(allContacts).toHaveLength(2);

      const allCompanies = await companyService.getAllCompanies();
      expect(allCompanies).toHaveLength(1);
    });
  });
});
