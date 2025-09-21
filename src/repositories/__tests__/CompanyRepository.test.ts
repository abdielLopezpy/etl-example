import { Database } from '../../database/connection';
import { CompanyRepository } from '../../repositories/CompanyRepository';
import { CreateCompany } from '../../types/schemas';

describe('CompanyRepository', () => {
  let database: Database;
  let companyRepository: CompanyRepository;

  beforeEach(async () => {
    // Crear base de datos en memoria para cada prueba
    database = new Database(':memory:');
    await database.initializeTables();
    companyRepository = new CompanyRepository(database);
  });

  afterEach(async () => {
    await database.close();
  });

  describe('create', () => {
    it('should create a company successfully', async () => {
      const companyData: CreateCompany = {
        hubspot_id: 'hubspot-123',
        name: 'Test Company',
        domain: 'test.com',
      };

      const createdCompany = await companyRepository.create(companyData);

      expect(createdCompany).toEqual({
        id: expect.any(String),
        hubspot_id: 'hubspot-123',
        name: 'Test Company',
        domain: 'test.com',
        created_at: expect.any(String),
      });

      // Verificar que se puede recuperar
      const foundCompany = await companyRepository.findById(createdCompany.id);
      expect(foundCompany).toEqual(createdCompany);
    });

    it('should throw error when creating duplicate hubspot_id', async () => {
      const companyData: CreateCompany = {
        hubspot_id: 'hubspot-123',
        name: 'Test Company',
        domain: 'test.com',
      };

      await companyRepository.create(companyData);

      // Intentar crear otra empresa con el mismo hubspot_id
      await expect(companyRepository.create(companyData)).rejects.toThrow();
    });
  });

  describe('findAll', () => {
    it('should return empty array when no companies exist', async () => {
      const companies = await companyRepository.findAll();
      expect(companies).toEqual([]);
    });

    it('should return all companies ordered by created_at desc', async () => {
      const company1Data: CreateCompany = {
        hubspot_id: 'hubspot-1',
        name: 'Company 1',
        domain: 'company1.com',
      };
      const company2Data: CreateCompany = {
        hubspot_id: 'hubspot-2',
        name: 'Company 2',
        domain: 'company2.com',
      };

      const company1 = await companyRepository.create(company1Data);
      // Pequeña pausa para asegurar diferentes timestamps
      await new Promise(resolve => setTimeout(resolve, 10));
      const company2 = await companyRepository.create(company2Data);

      const companies = await companyRepository.findAll();
      expect(companies).toHaveLength(2);
      
      // Verificar que ambas empresas estén presentes
      const companyIds = companies.map(c => c.id);
      expect(companyIds).toContain(company1.id);
      expect(companyIds).toContain(company2.id);
      
      // Verificar orden por created_at desc (más reciente primero)
      const company1Time = new Date(companies.find(c => c.id === company1.id)!.created_at).getTime();
      const company2Time = new Date(companies.find(c => c.id === company2.id)!.created_at).getTime();
      expect(company2Time).toBeGreaterThanOrEqual(company1Time);
    });
  });

  describe('findByHubspotId', () => {
    it('should find company by hubspot_id', async () => {
      const companyData: CreateCompany = {
        hubspot_id: 'hubspot-123',
        name: 'Test Company',
        domain: 'test.com',
      };

      const createdCompany = await companyRepository.create(companyData);
      const foundCompany = await companyRepository.findByHubspotId('hubspot-123');

      expect(foundCompany).toEqual(createdCompany);
    });

    it('should return null when company not found', async () => {
      const foundCompany = await companyRepository.findByHubspotId('nonexistent');
      expect(foundCompany).toBeNull();
    });
  });

  describe('update', () => {
    it('should update company successfully', async () => {
      const companyData: CreateCompany = {
        hubspot_id: 'hubspot-123',
        name: 'Test Company',
        domain: 'test.com',
      };

      const createdCompany = await companyRepository.create(companyData);
      const updates = {
        name: 'Updated Company Name',
        domain: 'updated.com',
      };

      const updatedCompany = await companyRepository.update(createdCompany.id, updates);

      expect(updatedCompany).toEqual({
        ...createdCompany,
        name: 'Updated Company Name',
        domain: 'updated.com',
      });
    });

    it('should return null when updating non-existent company', async () => {
      const updatedCompany = await companyRepository.update('non-existent-id', {
        name: 'Updated Name',
      });

      expect(updatedCompany).toBeNull();
    });
  });

  describe('upsertByHubspotId', () => {
    it('should create new company when hubspot_id does not exist', async () => {
      const companyData: CreateCompany = {
        hubspot_id: 'hubspot-123',
        name: 'Test Company',
        domain: 'test.com',
      };

      const company = await companyRepository.upsertByHubspotId(companyData);

      expect(company.hubspot_id).toBe('hubspot-123');
      expect(company.name).toBe('Test Company');
      expect(company.domain).toBe('test.com');
    });

    it('should update existing company when hubspot_id exists', async () => {
      const companyData: CreateCompany = {
        hubspot_id: 'hubspot-123',
        name: 'Original Company',
        domain: 'original.com',
      };

      // Crear empresa original
      await companyRepository.create(companyData);

      // Upsert con datos actualizados
      const updatedData: CreateCompany = {
        hubspot_id: 'hubspot-123',
        name: 'Updated Company',
        domain: 'updated.com',
      };

      const upsertedCompany = await companyRepository.upsertByHubspotId(updatedData);

      expect(upsertedCompany.hubspot_id).toBe('hubspot-123');
      expect(upsertedCompany.name).toBe('Updated Company');
      expect(upsertedCompany.domain).toBe('updated.com');

      // Verificar que solo hay una empresa
      const count = await companyRepository.count();
      expect(count).toBe(1);
    });
  });
});
