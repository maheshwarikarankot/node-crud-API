// ── TypeScript interfaces ──────────────────────────────────────────
export interface Product {
  id         : string;
  name       : string;
  description: string;
  price      : number;
  category   : string;
  inStock    : boolean;
}

export interface CreateProductBody {
  name       : string;
  description: string;
  price      : number;
  category   : string;
  inStock    : boolean;
}

export interface UpdateProductBody {
  name?       : string;
  description?: string;
  price?      : number;
  category?   : string;
  inStock?    : boolean;
}

export interface ProductParams {
  productId: string;
}

// ── Fastify JSON Schema — POST /api/products ───────────────────────
// Fastify uses this to validate request body automatically
// If validation fails → Fastify returns 400 automatically
export const createProductSchema = {
  schema: {
    body: {
      type      : 'object',
      required  : ['name', 'description', 'price', 'category', 'inStock'],
      properties: {
        name       : { type: 'string',  minLength: 1                          },
        description: { type: 'string',  minLength: 1                          },
        price      : { type: 'number',  exclusiveMinimum: 0                   },
        category   : { type: 'string',  minLength: 1                          },
        inStock    : { type: 'boolean'                                         },
      },
      additionalProperties: false,
    },
    response: {
      201: {
        type      : 'object',
        properties: {
          id         : { type: 'string'  },
          name       : { type: 'string'  },
          description: { type: 'string'  },
          price      : { type: 'number'  },
          category   : { type: 'string'  },
          inStock    : { type: 'boolean' },
        },
      },
    },
  },
};

// ── Fastify JSON Schema — PUT /api/products/:productId ────────────
// All fields are optional for update
export const updateProductSchema = {
  schema: {
    params: {
      type      : 'object',
      required  : ['productId'],
      properties: {
        productId: { type: 'string' },
      },
    },
    body: {
      type      : 'object',
      properties: {
        name       : { type: 'string',  minLength: 1       },
        description: { type: 'string',  minLength: 1       },
        price      : { type: 'number',  exclusiveMinimum: 0 },
        category   : { type: 'string',  minLength: 1       },
        inStock    : { type: 'boolean'                      },
      },
      additionalProperties: false,
      minProperties       : 1,   // at least one field required for update
    },
    response: {
      200: {
        type      : 'object',
        properties: {
          id         : { type: 'string'  },
          name       : { type: 'string'  },
          description: { type: 'string'  },
          price      : { type: 'number'  },
          category   : { type: 'string'  },
          inStock    : { type: 'boolean' },
        },
      },
    },
  },
};

// ── Fastify JSON Schema — GET /api/products ───────────────────────
export const getAllProductsSchema = {
  schema: {
    response: {
      200: {
        type : 'array',
        items: {
          type      : 'object',
          properties: {
            id         : { type: 'string'  },
            name       : { type: 'string'  },
            description: { type: 'string'  },
            price      : { type: 'number'  },
            category   : { type: 'string'  },
            inStock    : { type: 'boolean' },
          },
        },
      },
    },
  },
};

// ── Fastify JSON Schema — GET /api/products/:productId ────────────
export const getProductByIdSchema = {
  schema: {
    params: {
      type      : 'object',
      required  : ['productId'],
      properties: {
        productId: { type: 'string' },
      },
    },
    response: {
      200: {
        type      : 'object',
        properties: {
          id         : { type: 'string'  },
          name       : { type: 'string'  },
          description: { type: 'string'  },
          price      : { type: 'number'  },
          category   : { type: 'string'  },
          inStock    : { type: 'boolean' },
        },
      },
    },
  },
};

// ── Fastify JSON Schema — DELETE /api/products/:productId ─────────
export const deleteProductSchema = {
  schema: {
    params: {
      type      : 'object',
      required  : ['productId'],
      properties: {
        productId: { type: 'string' },
      },
    },
    response: {
      204: {
        type      : 'null',
        description: 'Product deleted successfully',
      },
    },
  },
};

// ── IPC message types for cluster ─────────────────────────────────
export type IPCMessage =
  | { type: 'ADD_PRODUCT';    product: Product                    }
  | { type: 'UPDATE_PRODUCT'; productId: string; product: Product }
  | { type: 'DELETE_PRODUCT'; productId: string                   }
  | { type: 'SYNC_STATE';     products: Product[]                 };