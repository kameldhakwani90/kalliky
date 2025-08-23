import { z } from 'zod';

// Validation pour créer/modifier une option de service
export const serviceAdditionalOptionSchema = z.object({
  name: z.string()
    .min(1, 'Le nom est requis')
    .max(100, 'Le nom ne peut pas dépasser 100 caractères')
    .trim(),
  
  description: z.string()
    .max(500, 'La description ne peut pas dépasser 500 caractères')
    .optional()
    .nullable(),
  
  price: z.number()
    .min(0, 'Le prix doit être positif')
    .max(99999, 'Le prix ne peut pas dépasser 99999'),
  
  priceType: z.enum(['FIXED', 'PER_PERSON', 'PER_DAY', 'PER_HOUR'], {
    errorMap: () => ({ message: 'Type de prix invalide' })
  }),
  
  isActive: z.boolean().optional().default(true),
  
  orderIndex: z.number().int().min(0).optional(),
  
  metadata: z.record(z.any()).optional().nullable()
});

// Validation pour affecter une ressource à une option
export const serviceOptionResourceSchema = z.object({
  resourceId: z.string().uuid('ID de ressource invalide'),
  
  resourceType: z.enum(['EMPLOYEE', 'EQUIPMENT'], {
    errorMap: () => ({ message: 'Type de ressource invalide' })
  }),
  
  isRequired: z.boolean().optional().default(true),
  
  constraints: z.record(z.any()).optional().nullable()
});

// Validation pour modifier les paramètres d'une ressource
export const updateServiceOptionResourceSchema = z.object({
  isRequired: z.boolean().optional(),
  constraints: z.record(z.any()).optional().nullable()
});

// Validation pour réordonner les options
export const reorderServiceOptionsSchema = z.object({
  options: z.array(
    z.object({
      id: z.string().uuid(),
      orderIndex: z.number().int().min(0).optional()
    })
  ).min(1, 'Au moins une option requise')
});

// Types TypeScript générés depuis les schémas Zod
export type ServiceAdditionalOptionInput = z.infer<typeof serviceAdditionalOptionSchema>;
export type ServiceOptionResourceInput = z.infer<typeof serviceOptionResourceSchema>;
export type UpdateServiceOptionResourceInput = z.infer<typeof updateServiceOptionResourceSchema>;
export type ReorderServiceOptionsInput = z.infer<typeof reorderServiceOptionsSchema>;