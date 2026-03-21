import { randomUUID }                          from 'node:crypto';
import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { db }                                  from '../db/inmemorydb.js';
import type {
  Product,
  ProductParams,
  CreateProductBody,
  UpdateProductBody,
  IPCMessage,
} from '../types/ProductType.js';
import {
  getAllProductsSchema,
  getProductByIdSchema,
  createProductSchema,
  updateProductSchema,
  deleteProductSchema,
} from '../types/ProductType.js';

// ── Validate uuid format ───────────────────────────────────────────
const isValidUUID = (id: string): boolean => {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
};

// ── Send IPC message to primary in cluster mode ────────────────────
const syncWithPrimary = (msg: IPCMessage): void => {
  if (process.send) process.send(msg);
};

export default async function productRoutes(fastify: FastifyInstance): Promise<void> {

  // ── GET /api/products ────────────────────────────────────────────
  // Fastify schema validates response shape automatically
  fastify.get(
    '/',
    getAllProductsSchema,
    async (_request: FastifyRequest, reply: FastifyReply) => {
      return reply.code(200).send(db.products);
    }
  );

  // ── GET /api/products/:productId ─────────────────────────────────
  // Fastify schema validates params and response shape
  fastify.get<{ Params: ProductParams }>(
    '/:productId',
    getProductByIdSchema,
    async (
      request: FastifyRequest<{ Params: ProductParams }>,
      reply  : FastifyReply
    ) => {
      const { productId } = request.params;

      // uuid check — Fastify schema only validates type, not uuid format
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
  // Fastify schema validates body automatically → returns 400 if invalid
  fastify.post<{ Body: CreateProductBody }>(
    '/',
    createProductSchema,
    async (
      request: FastifyRequest<{ Body: CreateProductBody }>,
      reply  : FastifyReply
    ) => {
      const { name, description, price, category, inStock } = request.body;

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
  // Fastify schema validates body fields automatically
  fastify.put<{ Params: ProductParams; Body: UpdateProductBody }>(
    '/:productId',
    updateProductSchema,
    async (
      request: FastifyRequest<{ Params: ProductParams; Body: UpdateProductBody }>,
      reply  : FastifyReply
    ) => {
      const { productId } = request.params;

      // uuid check
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

      const updatedProduct: Product = {
        ...db.products[productIndex],
        ...request.body,
      };

      // Cluster mode — notify primary
      if (process.send) {
        syncWithPrimary({
          type     : 'UPDATE_PRODUCT',
          productId,
          product  : updatedProduct,
        });
      } else {
        db.products[productIndex] = updatedProduct;
      }

      return reply.code(200).send(updatedProduct);
    }
  );

  // ── DELETE /api/products/:productId ──────────────────────────────
  // Fastify schema validates params automatically
  fastify.delete<{ Params: ProductParams }>(
    '/:productId',
    deleteProductSchema,
    async (
      request: FastifyRequest<{ Params: ProductParams }>,
      reply  : FastifyReply
    ) => {
      const { productId } = request.params;

      // uuid check
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