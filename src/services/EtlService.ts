import { HubSpotApiService } from './HubSpotApiService';
import { CompanyService } from './CompanyService';
import { ContactService } from './ContactService';
import { CreateCompany, CreateContact } from '../types/schemas';
import { EtlSyncStatus } from '../types/hubspot';
import { EtlSyncResponse } from '../types/schemas';
import { HubSpotContact, HubSpotCompany } from '../types/hubspot';
import { AppError } from '../types/common';
import { logger } from '../utils/logger';
import { getCurrentTimestamp, cleanString, formatError } from '../utils/helpers';

export class EtlService {
  private syncStatus: EtlSyncStatus = {
    isRunning: false,
    contactsProcessed: 0,
    companiesProcessed: 0,
    errors: [],
  };

  constructor(
    private hubspotApiService: HubSpotApiService,
    private companyService: CompanyService,
    private contactService: ContactService
  ) {}

  async syncCrmData(): Promise<EtlSyncResponse> {
    if (this.syncStatus.isRunning) {
      throw new AppError('ETL sync is already running', 409);
    }

    // Resetear estado
    this.syncStatus = {
      isRunning: true,
      startedAt: getCurrentTimestamp(),
      contactsProcessed: 0,
      companiesProcessed: 0,
      errors: [],
    };

    logger.info('Starting CRM data synchronization');

    try {
      // Verificar conectividad con HubSpot
      const isHealthy = await this.hubspotApiService.healthCheck();
      if (!isHealthy) {
        throw new AppError('HubSpot API is not accessible', 502);
      }

      // Paso 1: Sincronizar empresas primero (para las relaciones)
      await this.syncCompanies();

      // Paso 2: Sincronizar contactos
      await this.syncContacts();

      // Completar sincronización
      this.syncStatus.completedAt = getCurrentTimestamp();
      this.syncStatus.isRunning = false;

      const response: EtlSyncResponse = {
        message: 'Sync completed successfully',
        contactsSynced: this.syncStatus.contactsProcessed,
        companiesSynced: this.syncStatus.companiesProcessed,
        syncedAt: this.syncStatus.completedAt,
      };

      logger.info('CRM data synchronization completed successfully', response);
      return response;

    } catch (error) {
      this.syncStatus.isRunning = false;
      this.syncStatus.completedAt = getCurrentTimestamp();
      
      const errorMessage = formatError(error);
      this.syncStatus.errors.push(errorMessage);

      logger.error('CRM data synchronization failed:', error);

      if (error instanceof AppError) {
        throw error;
      }

      throw new AppError('ETL sync failed due to an unexpected error', 500);
    }
  }

  private async syncCompanies(): Promise<void> {
    logger.info('Starting companies synchronization');

    try {
      const hubspotCompanies = await this.hubspotApiService.getAllCompanies();
      logger.info(`Retrieved ${hubspotCompanies.length} companies from HubSpot`);

      for (const hubspotCompany of hubspotCompanies) {
        try {
          const companyData = this.transformHubspotCompany(hubspotCompany);
          
          // Solo procesar si tenemos los datos mínimos requeridos
          if (companyData.name && companyData.domain) {
            await this.companyService.upsertCompanyByHubspotId(companyData);
            this.syncStatus.companiesProcessed++;

            if (this.syncStatus.companiesProcessed % 10 === 0) {
              logger.debug(`Processed ${this.syncStatus.companiesProcessed} companies`);
            }
          } else {
            logger.warn(`Skipping company ${hubspotCompany.id} - missing required data`);
          }
        } catch (error) {
          const errorMessage = `Failed to sync company ${hubspotCompany.id}: ${formatError(error)}`;
          this.syncStatus.errors.push(errorMessage);
          logger.error(errorMessage);
        }
      }

      logger.info(`Companies synchronization completed. Processed: ${this.syncStatus.companiesProcessed}`);
    } catch (error) {
      logger.error('Failed to sync companies:', error);
      throw error;
    }
  }

  private async syncContacts(): Promise<void> {
    logger.info('Starting contacts synchronization');

    try {
      const hubspotContacts = await this.hubspotApiService.getAllContacts();
      logger.info(`Retrieved ${hubspotContacts.length} contacts from HubSpot`);

      for (const hubspotContact of hubspotContacts) {
        try {
          const contactData = await this.transformHubspotContact(hubspotContact);
          
          // Solo procesar si tenemos email (campo requerido)
          if (contactData.email) {
            await this.contactService.upsertContactByHubspotId(contactData);
            this.syncStatus.contactsProcessed++;

            if (this.syncStatus.contactsProcessed % 50 === 0) {
              logger.debug(`Processed ${this.syncStatus.contactsProcessed} contacts`);
            }
          } else {
            logger.warn(`Skipping contact ${hubspotContact.id} - missing email`);
          }
        } catch (error) {
          const errorMessage = `Failed to sync contact ${hubspotContact.id}: ${formatError(error)}`;
          this.syncStatus.errors.push(errorMessage);
          logger.error(errorMessage);
        }
      }

      logger.info(`Contacts synchronization completed. Processed: ${this.syncStatus.contactsProcessed}`);
    } catch (error) {
      logger.error('Failed to sync contacts:', error);
      throw error;
    }
  }

  private transformHubspotCompany(hubspotCompany: HubSpotCompany): CreateCompany {
    const name = cleanString(hubspotCompany.properties.name);
    const domain = cleanString(hubspotCompany.properties.domain);

    return {
      hubspot_id: hubspotCompany.id,
      name: name || 'Unknown Company',
      domain: domain || 'unknown.com',
    };
  }

  private async transformHubspotContact(hubspotContact: HubSpotContact): Promise<CreateContact> {
    const firstname = cleanString(hubspotContact.properties.firstname);
    const lastname = cleanString(hubspotContact.properties.lastname);
    const email = cleanString(hubspotContact.properties.email);

    let companyId: string | undefined;

    // Buscar empresa asociada si existe
    const associatedCompanyId = hubspotContact.properties.associatedcompanyid;
    if (associatedCompanyId) {
      try {
        const company = await this.companyService.getCompanyByHubspotId(associatedCompanyId);
        companyId = company?.id;
      } catch (error) {
        logger.debug(`Could not find associated company ${associatedCompanyId} for contact ${hubspotContact.id}`);
      }
    }

    return {
      hubspot_id: hubspotContact.id,
      firstname: firstname || undefined,
      lastname: lastname || undefined,
      email,
      company_id: companyId,
    };
  }

  getSyncStatus(): EtlSyncStatus {
    return { ...this.syncStatus };
  }

  isSyncRunning(): boolean {
    return this.syncStatus.isRunning;
  }

  async getLastSyncInfo(): Promise<{ contactCount: number; companyCount: number } | null> {
    try {
      const contactCount = await this.contactService.getContactCount();
      const companyCount = await this.companyService.getCompanyCount();
      
      return { contactCount, companyCount };
    } catch (error) {
      logger.error('Error getting sync info:', error);
      return null;
    }
  }
}
