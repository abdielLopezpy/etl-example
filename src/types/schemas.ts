import { z } from 'zod';

// Esquemas de validación para entidades principales

// Esquema para Company
export const CompanySchema = z.object({
  id: z.string().uuid(),
  hubspot_id: z.string(),
  name: z.string().min(1, 'Company name is required'),
  domain: z.string().min(1, 'Company domain is required'),
  created_at: z.string().datetime(),
});

// Esquema para Contact
export const ContactSchema = z.object({
  id: z.string().uuid(),
  hubspot_id: z.string(),
  firstname: z.string().optional(),
  lastname: z.string().optional(),
  email: z.string().email('Invalid email format'),
  company_id: z.string().uuid().optional(),
  created_at: z.string().datetime(),
});

// Esquemas para creación (sin id y created_at)
export const CreateCompanySchema = z.object({
  hubspot_id: z.string(),
  name: z.string().min(1, 'Company name is required'),
  domain: z.string().min(1, 'Company domain is required'),
});

export const CreateContactSchema = z.object({
  hubspot_id: z.string(),
  firstname: z.string().optional(),
  lastname: z.string().optional(),
  email: z.string().email('Invalid email format'),
  company_id: z.string().uuid().optional(),
});

// Esquemas para actualización (todos los campos opcionales)
export const UpdateCompanySchema = CreateCompanySchema.partial();
export const UpdateContactSchema = CreateContactSchema.partial();

// Esquemas para respuestas de API
export const ApiResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: z.unknown().optional(),
});

export const EtlSyncResponseSchema = z.object({
  message: z.string(),
  contactsSynced: z.number(),
  companiesSynced: z.number(),
  syncedAt: z.string().datetime(),
});

// Tipos TypeScript derivados de los esquemas
export type Company = z.infer<typeof CompanySchema>;
export type Contact = z.infer<typeof ContactSchema>;
export type CreateCompany = z.infer<typeof CreateCompanySchema>;
export type CreateContact = z.infer<typeof CreateContactSchema>;
export type UpdateCompany = z.infer<typeof UpdateCompanySchema>;
export type UpdateContact = z.infer<typeof UpdateContactSchema>;
export type ApiResponse = z.infer<typeof ApiResponseSchema>;
export type EtlSyncResponse = z.infer<typeof EtlSyncResponseSchema>;
