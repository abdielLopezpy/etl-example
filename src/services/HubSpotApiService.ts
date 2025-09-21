import axios, { AxiosInstance } from 'axios';
import { 
  HubSpotContactsResponse, 
  HubSpotCompaniesResponse, 
  HubSpotContact, 
  HubSpotCompany,
  HubSpotConfig 
} from '../types/hubspot';
import { logger } from '../utils/logger';
import { sleep } from '../utils/helpers';

export class HubSpotApiService {
  private httpClient: AxiosInstance;
  private rateLimitDelay = 100; // ms entre requests para respetar límites de tasa

  constructor(private config: HubSpotConfig) {
    this.httpClient = axios.create({
      baseURL: config.baseUrl,
      headers: {
        'Authorization': `Bearer ${config.accessToken}`,
        'Content-Type': 'application/json',
      },
      timeout: 30000, // 30 segundos
    });

    // Interceptor para logging de requests
    this.httpClient.interceptors.request.use((config) => {
      logger.debug(`HubSpot API Request: ${config.method?.toUpperCase()} ${config.url}`);
      return config;
    });

    // Interceptor para logging de responses y manejo de errores
    this.httpClient.interceptors.response.use(
      (response) => {
        logger.debug(`HubSpot API Response: ${response.status} ${response.config.url}`);
        return response;
      },
      (error) => {
        if (error.response) {
          logger.error(`HubSpot API Error: ${error.response.status} ${error.response.config.url}`, {
            status: error.response.status,
            data: error.response.data,
          });
        } else if (error.request) {
          logger.error('HubSpot API Network Error:', error.message);
        } else {
          logger.error('HubSpot API Error:', error.message);
        }
        throw error;
      }
    );
  }

  async getAllContacts(): Promise<HubSpotContact[]> {
    logger.info('Starting to fetch all contacts from HubSpot');
    const allContacts: HubSpotContact[] = [];
    let after: string | undefined;
    let hasMore = true;
    let pageCount = 0;

    try {
      while (hasMore) {
        pageCount++;
        logger.debug(`Fetching contacts page ${pageCount}${after ? ` (after: ${after})` : ''}`);

        const params: Record<string, string> = {
          limit: '100', // Máximo permitido por HubSpot
          properties: 'firstname,lastname,email,associatedcompanyid',
        };

        if (after) {
          params.after = after;
        }

        const response = await this.httpClient.get<HubSpotContactsResponse>(
          '/crm/v3/objects/contacts',
          { params }
        );

        allContacts.push(...response.data.results);

        hasMore = !!response.data.paging?.next;
        after = response.data.paging?.next?.after;

        logger.debug(`Fetched ${response.data.results.length} contacts, total so far: ${allContacts.length}`);

        // Rate limiting: pausa entre requests
        if (hasMore) {
          await sleep(this.rateLimitDelay);
        }
      }

      logger.info(`Successfully fetched ${allContacts.length} contacts from HubSpot`);
      return allContacts;
    } catch (error) {
      logger.error('Failed to fetch contacts from HubSpot:', error);
      throw error;
    }
  }

  async getAllCompanies(): Promise<HubSpotCompany[]> {
    logger.info('Starting to fetch all companies from HubSpot');
    const allCompanies: HubSpotCompany[] = [];
    let after: string | undefined;
    let hasMore = true;
    let pageCount = 0;

    try {
      while (hasMore) {
        pageCount++;
        logger.debug(`Fetching companies page ${pageCount}${after ? ` (after: ${after})` : ''}`);

        const params: Record<string, string> = {
          limit: '100', // Máximo permitido por HubSpot
          properties: 'name,domain',
        };

        if (after) {
          params.after = after;
        }

        const response = await this.httpClient.get<HubSpotCompaniesResponse>(
          '/crm/v3/objects/companies',
          { params }
        );

        allCompanies.push(...response.data.results);

        hasMore = !!response.data.paging?.next;
        after = response.data.paging?.next?.after;

        logger.debug(`Fetched ${response.data.results.length} companies, total so far: ${allCompanies.length}`);

        // Rate limiting: pausa entre requests
        if (hasMore) {
          await sleep(this.rateLimitDelay);
        }
      }

      logger.info(`Successfully fetched ${allCompanies.length} companies from HubSpot`);
      return allCompanies;
    } catch (error) {
      logger.error('Failed to fetch companies from HubSpot:', error);
      throw error;
    }
  }

  async getContact(id: string): Promise<HubSpotContact | null> {
    try {
      logger.debug(`Fetching contact ${id} from HubSpot`);
      
      const response = await this.httpClient.get<HubSpotContact>(
        `/crm/v3/objects/contacts/${id}`,
        {
          params: {
            properties: 'firstname,lastname,email,associatedcompanyid',
          },
        }
      );

      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        logger.debug(`Contact ${id} not found in HubSpot`);
        return null;
      }
      logger.error(`Failed to fetch contact ${id} from HubSpot:`, error);
      throw error;
    }
  }

  async getCompany(id: string): Promise<HubSpotCompany | null> {
    try {
      logger.debug(`Fetching company ${id} from HubSpot`);
      
      const response = await this.httpClient.get<HubSpotCompany>(
        `/crm/v3/objects/companies/${id}`,
        {
          params: {
            properties: 'name,domain',
          },
        }
      );

      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        logger.debug(`Company ${id} not found in HubSpot`);
        return null;
      }
      logger.error(`Failed to fetch company ${id} from HubSpot:`, error);
      throw error;
    }
  }

  // Método para verificar la conectividad con HubSpot
  async healthCheck(): Promise<boolean> {
    try {
      logger.debug('Performing HubSpot API health check');
      
      // Intentar obtener una pequeña muestra de contactos
      await this.httpClient.get('/crm/v3/objects/contacts', {
        params: {
          limit: '1',
          properties: 'email',
        },
      });

      logger.debug('HubSpot API health check passed');
      return true;
    } catch (error) {
      logger.error('HubSpot API health check failed:', error);
      return false;
    }
  }
}
