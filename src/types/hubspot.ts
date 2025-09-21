// Tipos para la API de HubSpot

// Respuesta base de HubSpot
export interface HubSpotBaseResponse<T> {
  results: T[];
  paging?: {
    next?: {
      after: string;
      link: string;
    };
  };
}

// Propiedades de HubSpot para Contactos
export interface HubSpotContactProperties {
  firstname?: string;
  lastname?: string;
  email?: string;
  associatedcompanyid?: string;
  [key: string]: string | undefined;
}

// Propiedades de HubSpot para Empresas
export interface HubSpotCompanyProperties {
  name?: string;
  domain?: string;
  [key: string]: string | undefined;
}

// Objeto de HubSpot genérico
export interface HubSpotObject<T> {
  id: string;
  properties: T;
  createdAt: string;
  updatedAt: string;
  archived: boolean;
}

// Tipos específicos para Contactos y Empresas de HubSpot
export type HubSpotContact = HubSpotObject<HubSpotContactProperties>;
export type HubSpotCompany = HubSpotObject<HubSpotCompanyProperties>;

// Respuestas específicas de la API de HubSpot
export type HubSpotContactsResponse = HubSpotBaseResponse<HubSpotContact>;
export type HubSpotCompaniesResponse = HubSpotBaseResponse<HubSpotCompany>;

// Configuración de la API de HubSpot
export interface HubSpotConfig {
  accessToken: string;
  baseUrl: string;
  rateLimitPerSecond: number;
}

// Estado del proceso ETL
export interface EtlSyncStatus {
  isRunning: boolean;
  startedAt?: string;
  completedAt?: string;
  contactsProcessed: number;
  companiesProcessed: number;
  errors: string[];
}
