import { z } from 'zod';

// ── Zod schemas ────────────────────────────────────────────────────
export const CreateProductSchema = z.object({
  name       : z.string().min(1,   { message: 'name is required' }),
  description: z.string().min(1,   { message: 'description is required' }),
  price      : z.number().positive({ message: 'price must be a positive number' }),
  category   : z.string().min(1,   { message: 'category is required' }),
  inStock    : z.boolean({ message: 'inStock is required' }),
});

export const UpdateProductSchema = z.object({
  name       : z.string().min(1).optional(),
  description: z.string().min(1).optional(),
  price      : z.number().positive({ message: 'price must be a positive number' }).optional(),
  category   : z.string().min(1).optional(),
  inStock    : z.boolean().optional(),
});

// ── Types inferred from Zod schemas ───────────────────────────────
export type CreateProductBody = z.infer<typeof CreateProductSchema>;
export type UpdateProductBody = z.infer<typeof UpdateProductSchema>;

// ── Full Product interface ─────────────────────────────────────────
export interface Product extends CreateProductBody {
  id: string;
}

// ── Route params ───────────────────────────────────────────────────
export interface ProductParams {
  productId: string;
}

// ── IPC message types for cluster ─────────────────────────────────
export type IPCMessage =
  | { type: 'ADD_PRODUCT';    product: Product                    }
  | { type: 'UPDATE_PRODUCT'; productId: string; product: Product }
  | { type: 'DELETE_PRODUCT'; productId: string                   }
  | { type: 'SYNC_STATE';     products: Product[]                 };