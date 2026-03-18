import { randomUUID }      from 'node:crypto';
import type { FastifyInstance } from 'fastify';
import { db }              from '../db/inmemorydb.js';
import type {
  Product,
  ProductParams,
  CreateProductBody,
  UpdateProductBody,
  IPCMessage,
} from '../types/Product.js';
import {
  CreateProductSchema,
  UpdateProductSchema,
} from '../types/Product.js';

// ── Validate uuid format ───────────────────────────────────────────
const isValidUUID = (id: string): boolean => {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
};

// ── Send IPC message to primary in cluster mode ───────────────────
const syncWithPrimary = (msg: IPCMessage): void => {
  if (process.send) process.send(msg);
};

export default async function productRoutes(fastify: FastifyInstance): Promise<void> {

  // ── GET /api/products ────────────────────────────────────────────
  // Returns all products — empty array if none exist
  fastify.get('/', async (_request, reply) => {
    return reply.code(200).send(db.products);
  });

  // ── GET /api/products/:productId ─────────────────────────────────
  fastify.get<{ Params: ProductParams }>(
    '/:productId',
    async (request, reply) => {
      const { productId } = request.params;

      if (!isValidUUID(productId)) {
        return reply.code(400).send({
          message: 'Invalid productId — must be a valid uuid',
        });
      }

      const product = db.products.find((p: Product) => p.id === productId);
      if (!product) {
        return reply.code(404).send({
          message: `Product with id ${productId} not found`,
        });
      }

      return reply.code(200).send(product);
    }
  );

  // ── POST /api/products ───────────────────────────────────────────
  // Creates a new product — validates with Zod
  fastify.post<{ Body: CreateProductBody }>(
    '/',
    async (request, reply) => {
      // Zod validation
      const result = CreateProductSchema.safeParse(request.body);

      if (!result.success) {
        return reply.code(400).send({
          message: result.error.issues.map((e) => e.message).join(', '),
        });
      }

      const { name, description, price, category, inStock } = result.data;

      const newProduct: Product = {
        id: randomUUID(),
        name,
        description,
        price,
        category,
        inStock,
      };

      // Cluster mode — notify primary to broadcast state to all workers
      if (process.send) {
        syncWithPrimary({ type: 'ADD_PRODUCT', product: newProduct });
      } else {
        db.products.push(newProduct);
      }

      return reply.code(201).send(newProduct);
    }
  );

  // ── PUT /api/products/:productId ─────────────────────────────────
  // Updates an existing product — validates with Zod
  fastify.put<{ Params: ProductParams; Body: UpdateProductBody }>(
    '/:productId',
    async (request, reply) => {
      const { productId } = request.params;

      if (!isValidUUID(productId)) {
        return reply.code(400).send({
          message: 'Invalid productId — must be a valid uuid',
        });
      }

      const productIndex = db.products.findIndex(
        (p: Product) => p.id === productId
      );
      if (productIndex === -1) {
        return reply.code(404).send({
          message: `Product with id ${productId} not found`,
        });
      }

      // Zod validation on update body
      const result = UpdateProductSchema.safeParse(request.body);
      if (!result.success) {
        return reply.code(400).send({
          message: result.error.issues.map((e) => e.message).join(', '),
        });
      }

      const updatedProduct: Product = {
        ...db.products[productIndex],
        ...result.data,
      };

      // Cluster mode — notify primary
      if (process.send) {
        syncWithPrimary({
          type: 'UPDATE_PRODUCT',
          productId,
          product: updatedProduct,
        });
      } else {
        db.products[productIndex] = updatedProduct;
      }

      return reply.code(200).send(updatedProduct);
    }
  );

  // ── DELETE /api/products/:productId ──────────────────────────────
  // Deletes a product by id
  fastify.delete<{ Params: ProductParams }>(
    '/:productId',
    async (request, reply) => {
      const { productId } = request.params;

      if (!isValidUUID(productId)) {
        return reply.code(400).send({
          message: 'Invalid productId — must be a valid uuid',
        });
      }

      const productIndex = db.products.findIndex(
        (p: Product) => p.id === productId
      );
      if (productIndex === -1) {
        return reply.code(404).send({
          message: `Product with id ${productId} not found`,
        });
      }

      // Cluster mode — notify primary
      if (process.send) {
        syncWithPrimary({ type: 'DELETE_PRODUCT', productId });
      } else {
        db.products.splice(productIndex, 1);
      }

      return reply.code(204).send();
    }
  );
}