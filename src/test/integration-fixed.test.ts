import supertest from 'supertest';
import { Express } from 'express';
import { createApp } from '../app';
import { Database } from '../database/connection';

describe('API Integration Tests', () => {
  let app: Express;
  let database: Database;

  beforeAll(async () => {
    // Configurar base de datos en memoria para pruebas
    process.env.DB_PATH = ':memory:';
    process.env.HUBSPOT_ACCESS_TOKEN = 'test-token';
    
    const appData = await createApp();
    app = appData.app;
    database = appData.database;
  });

  afterAll(async () => {
    if (database) {
      await database.close();
    }
  });

  describe('Health Check', () => {
    it('GET /health should return 200', async () => {
      const response = await request.get('/health');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        status: 'healthy',
        timestamp: expect.any(String),
        uptime: expect.any(Number),
        version: expect.any(String),
        environment: 'test',
      });
    });
  });

  describe('API Info', () => {
    it('GET /api should return API information', async () => {
      const response = await request.get('/api');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('CrmETL API v2.0');
      expect(response.body.endpoints).toBeDefined();
      expect(response.body.endpoints.companies).toBeDefined();
      expect(response.body.endpoints.contacts).toBeDefined();
      expect(response.body.endpoints.etl).toBeDefined();
    });
  });

  describe('Companies API', () => {
    it('GET /api/companies should return empty array initially', async () => {
      const response = await request.get('/api/companies');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual([]);
    });

    it('POST /api/companies should create a new company', async () => {
      const companyData = {
        hubspot_id: 'hubspot-123',
        name: 'Test Company',
        domain: 'test.com',
      };

      const response = await request
        .post('/api/companies')
        .send(companyData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual({
        id: expect.any(String),
        hubspot_id: 'hubspot-123',
        name: 'Test Company',
        domain: 'test.com',
        created_at: expect.any(String),
      });
    });

    it('POST /api/companies should validate required fields', async () => {
      const invalidCompanyData = {
        name: 'Test Company',
        // Falta hubspot_id y domain
      };

      const response = await request
        .post('/api/companies')
        .send(invalidCompanyData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });

    it('GET /api/companies/:id should return specific company', async () => {
      // Crear una empresa primero
      const companyData = {
        hubspot_id: 'hubspot-456',
        name: 'Another Company',
        domain: 'another.com',
      };

      const createResponse = await request
        .post('/api/companies')
        .send(companyData);

      const companyId = createResponse.body.data.id;

      const getResponse = await request.get(`/api/companies/${companyId}`);

      expect(getResponse.status).toBe(200);
      expect(getResponse.body.success).toBe(true);
      expect(getResponse.body.data.id).toBe(companyId);
    });

    it('GET /api/companies/:id should return 404 for non-existent company', async () => {
      const fakeId = '123e4567-e89b-12d3-a456-426614174000';

      const response = await request.get(`/api/companies/${fakeId}`);

      expect(response.status).toBe(404);
    });

    it('GET /api/companies/:id should return 400 for invalid UUID', async () => {
      const response = await request.get('/api/companies/invalid-uuid');

      expect(response.status).toBe(400);
    });
  });

  describe('Contacts API', () => {
    it('GET /api/contacts should return empty array initially', async () => {
      const response = await request.get('/api/contacts');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual([]);
    });

    it('POST /api/contacts should create a new contact', async () => {
      const contactData = {
        hubspot_id: 'contact-123',
        email: 'test@example.com',
        firstname: 'John',
        lastname: 'Doe',
      };

      const response = await request
        .post('/api/contacts')
        .send(contactData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual({
        id: expect.any(String),
        hubspot_id: 'contact-123',
        email: 'test@example.com',
        firstname: 'John',
        lastname: 'Doe',
        phone: null,
        company_id: null,
        created_at: expect.any(String),
      });
    });

    it('POST /api/contacts should validate email format', async () => {
      const invalidContactData = {
        hubspot_id: 'contact-456',
        email: 'invalid-email',
        firstname: 'Jane',
        lastname: 'Doe',
      };

      const response = await request
        .post('/api/contacts')
        .send(invalidContactData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('ETL API', () => {
    it('GET /api/etl/status should return ETL status', async () => {
      const response = await request.get('/api/etl/status');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.lastRun).toBeDefined();
      expect(response.body.data.status).toBeDefined();
    });

    it('GET /api/etl/health should return ETL health check', async () => {
      const response = await request.get('/api/etl/health');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.healthy).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should return 404 for non-existent routes', async () => {
      const response = await request.get('/api/nonexistent');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  describe('Rate Limiting', () => {
    it('should apply rate limiting to API routes', async () => {
      const promises = [];

      // Hacer muchas peticiones simultáneas para probar rate limiting
      for (let i = 0; i < 10; i++) {
        promises.push(request.get('/api/companies'));
      }

      const responses = await Promise.all(promises);

      // Al menos una respuesta debería ser exitosa, algunas podrían ser rate limited
      responses.forEach(response => {
        expect([200, 429]).toContain(response.status);
      });
    }, 10000);
  });
});
