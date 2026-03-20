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
    tags: ['Products'],
    summary: 'Create a new product',
    description: 'Create a new product with the provided details',
    body: {
      type      : 'object',
      required  : ['name', 'description', 'price', 'category', 'inStock'],
      properties: {
        name       : { type: 'string',  minLength: 1, description: 'Product name'                },
        description: { type: 'string',  minLength: 1, description: 'Product description'         },
        price      : { type: 'number',  exclusiveMinimum: 0, description: 'Product price'        },
        category   : { type: 'string',  minLength: 1, description: 'Product category'            },
        inStock    : { type: 'boolean', description: 'Product availability status'              },
      },
      additionalProperties: false,
    },
    response: {
      201: {
        type      : 'object',
        description: 'Product created successfully',
        properties: {
          id         : { type: 'string', description: 'Unique product ID' },
          name       : { type: 'string', description: 'Product name' },
          description: { type: 'string', description: 'Product description' },
          price      : { type: 'number', description: 'Product price' },
          category   : { type: 'string', description: 'Product category' },
          inStock    : { type: 'boolean', description: 'Product availability' },
        },
      },
    },
  },
};

// ── Fastify JSON Schema — PUT /api/products/:productId ────────────
// All fields are optional for update
export const updateProductSchema = {
  schema: {
    tags: ['Products'],
    summary: 'Update a product',
    description: 'Update an existing product with the provided details',
    params: {
      type      : 'object',
      required  : ['productId'],
      properties: {
        productId: { type: 'string', description: 'The product ID (UUID)' },
      },
    },
    body: {
      type      : 'object',
      properties: {
        name       : { type: 'string',  minLength: 1, description: 'Product name'                },
        description: { type: 'string',  minLength: 1, description: 'Product description'         },
        price      : { type: 'number',  exclusiveMinimum: 0, description: 'Product price'        },
        category   : { type: 'string',  minLength: 1, description: 'Product category'            },
        inStock    : { type: 'boolean', description: 'Product availability status'              },
      },
      additionalProperties: false,
      minProperties       : 1,   // at least one field required for update
    },
    response: {
      200: {
        type      : 'object',
        description: 'Product updated successfully',
        properties: {
          id         : { type: 'string', description: 'Unique product ID' },
          name       : { type: 'string', description: 'Product name' },
          description: { type: 'string', description: 'Product description' },
          price      : { type: 'number', description: 'Product price' },
          category   : { type: 'string', description: 'Product category' },
          inStock    : { type: 'boolean', description: 'Product availability' },
        },
      },
    },
  },
};

// ── Fastify JSON Schema — GET /api/products ───────────────────────
export const getAllProductsSchema = {
  schema: {
    tags: ['Products'],
    summary: 'Get all products',
    description: 'Retrieve a list of all products in the catalog',
    response: {
      200: {
        type : 'array',
        description: 'List of products',
        items: {
          type      : 'object',
          properties: {
            id         : { type: 'string', description: 'Unique product ID' },
            name       : { type: 'string', description: 'Product name' },
            description: { type: 'string', description: 'Product description' },
            price      : { type: 'number', description: 'Product price' },
            category   : { type: 'string', description: 'Product category' },
            inStock    : { type: 'boolean', description: 'Product availability' },
          },
        },
      },
    },
  },
};

// ── Fastify JSON Schema — GET /api/products/:productId ────────────
export const getProductByIdSchema = {
  schema: {
    tags: ['Products'],
    summary: 'Get a product by ID',
    description: 'Retrieve a specific product using its UUID',
    params: {
      type      : 'object',
      required  : ['productId'],
      properties: {
        productId: { type: 'string', description: 'The product ID (UUID)' },
      },
    },
    response: {
      200: {
        type      : 'object',
        description: 'Product found',
        properties: {
          id         : { type: 'string', description: 'Unique product ID' },
          name       : { type: 'string', description: 'Product name' },
          description: { type: 'string', description: 'Product description' },
          price      : { type: 'number', description: 'Product price' },
          category   : { type: 'string', description: 'Product category' },
          inStock    : { type: 'boolean', description: 'Product availability' },
        },
      },
    },
  },
};

// ── Fastify JSON Schema — DELETE /api/products/:productId ─────────
export const deleteProductSchema = {
  schema: {
    tags: ['Products'],
    summary: 'Delete a product',
    description: 'Delete a specific product by its UUID',
    params: {
      type      : 'object',
      required  : ['productId'],
      properties: {
        productId: { type: 'string', description: 'The product ID (UUID)' },
      },
    },
    response: {
      200: {
        type      : 'object',
        description: 'Product deleted successfully',
        properties: {
          message: { type: 'string', description: 'Success message' },
        },
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