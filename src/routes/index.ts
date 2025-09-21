import { Router } from 'express';

// Importar controladores
import { CompanyController } from '../controllers/CompanyController';
import { ContactController } from '../controllers/ContactController';
import { EtlController } from '../controllers/EtlController';

// Importar servicios (tipos)
import { CompanyService } from '../services/CompanyService';
import { ContactService } from '../services/ContactService';
import { EtlService } from '../services/EtlService';

// Importar middleware de validación
import { validateSchema, validateUuidParams } from '../middleware/validation';
import { CreateCompanySchema, UpdateCompanySchema, CreateContactSchema, UpdateContactSchema } from '../types/schemas';

interface ApiServices {
  companyService: CompanyService;
  contactService: ContactService;
  etlService: EtlService;
}

export function createApiRoutes(services: ApiServices): Router {
  const router = Router();

  // Inicializar controladores
  const companyController = new CompanyController(services.companyService);
  const contactController = new ContactController(services.contactService);
  const etlController = new EtlController(services.etlService);

  // ============================================================
  // ETL ROUTES
  // ============================================================
  const etlRouter = Router();
  
  // POST /api/etl/sync-crm - Iniciar sincronización
  etlRouter.post('/sync-crm', etlController.syncCrm);
  
  // GET /api/etl/status - Obtener estado de sincronización
  etlRouter.get('/status', etlController.getSyncStatus);
  
  // GET /api/etl/info - Obtener información de la última sincronización
  etlRouter.get('/info', etlController.getSyncInfo);
  
  // GET /api/etl/health - Health check del servicio ETL
  etlRouter.get('/health', etlController.getHealth);

  router.use('/etl', etlRouter);

  // ============================================================
  // COMPANY ROUTES
  // ============================================================
  const companyRouter = Router();
  
  // GET /api/companies/stats - Debe ir antes de /:id para evitar conflictos
  companyRouter.get('/stats', companyController.getCompanyStats);
  
  // GET /api/companies - Obtener todas las empresas
  companyRouter.get('/', companyController.getAllCompanies);
  
  // GET /api/companies/:id - Obtener empresa por ID
  companyRouter.get('/:id', validateUuidParams, companyController.getCompanyById);
  
  // POST /api/companies - Crear nueva empresa
  companyRouter.post('/', validateSchema(CreateCompanySchema), companyController.createCompany);
  
  // PATCH /api/companies/:id - Actualizar empresa
  companyRouter.patch('/:id', validateUuidParams, validateSchema(UpdateCompanySchema), companyController.updateCompany);
  
  // DELETE /api/companies/:id - Eliminar empresa
  companyRouter.delete('/:id', validateUuidParams, companyController.deleteCompany);

  router.use('/companies', companyRouter);

  // ============================================================
  // CONTACT ROUTES
  // ============================================================
  const contactRouter = Router();
  
  // GET /api/contacts/stats - Debe ir antes de /:id para evitar conflictos
  contactRouter.get('/stats', contactController.getContactStats);
  
  // GET /api/contacts/company/:companyId - Obtener contactos por empresa
  contactRouter.get('/company/:companyId', validateUuidParams, contactController.getContactsByCompany);
  
  // GET /api/contacts - Obtener todos los contactos
  contactRouter.get('/', contactController.getAllContacts);
  
  // GET /api/contacts/:id - Obtener contacto por ID
  contactRouter.get('/:id', validateUuidParams, contactController.getContactById);
  
  // POST /api/contacts - Crear nuevo contacto
  contactRouter.post('/', validateSchema(CreateContactSchema), contactController.createContact);
  
  // PATCH /api/contacts/:id - Actualizar contacto
  contactRouter.patch('/:id', validateUuidParams, validateSchema(UpdateContactSchema), contactController.updateContact);
  
  // DELETE /api/contacts/:id - Eliminar contacto
  contactRouter.delete('/:id', validateUuidParams, contactController.deleteContact);

  router.use('/contacts', contactRouter);

  // ============================================================
  // API INFO ROUTE
  // ============================================================
  router.get('/', (req, res) => {
    res.status(200).json({
      success: true,
      message: 'CrmETL API v2.0',
      description: 'Sistema de ETL para sincronización de datos de CRM con API CRUD',
      version: '2.0.0',
      endpoints: {
        etl: {
          'POST /api/etl/sync-crm': 'Iniciar proceso de sincronización CRM',
          'GET /api/etl/status': 'Obtener estado de sincronización',
          'GET /api/etl/info': 'Información de última sincronización',
          'GET /api/etl/health': 'Health check del servicio ETL',
        },
        companies: {
          'GET /api/companies': 'Obtener todas las empresas',
          'GET /api/companies/:id': 'Obtener empresa por ID',
          'POST /api/companies': 'Crear nueva empresa',
          'PATCH /api/companies/:id': 'Actualizar empresa',
          'DELETE /api/companies/:id': 'Eliminar empresa',
          'GET /api/companies/stats': 'Estadísticas de empresas',
        },
        contacts: {
          'GET /api/contacts': 'Obtener todos los contactos',
          'GET /api/contacts/:id': 'Obtener contacto por ID',
          'GET /api/contacts/company/:companyId': 'Obtener contactos por empresa',
          'POST /api/contacts': 'Crear nuevo contacto',
          'PATCH /api/contacts/:id': 'Actualizar contacto',
          'DELETE /api/contacts/:id': 'Eliminar contacto',
          'GET /api/contacts/stats': 'Estadísticas de contactos',
        },
      },
      documentation: 'https://github.com/tu-repo/crm-etl/blob/main/README.md',
      timestamp: new Date().toISOString(),
    });
  });

  return router;
}
