import 'dotenv/config';
import Fastify,{ type FastifyInstance } from 'fastify';
import productRoutes                from './routes/Products.js';
import { db }                       from './db/inmemorydb.js';
import type { IPCMessage }               from './types/Product.js';

// ── Build and configure Fastify app ───────────────────────────────
export const buildApp = async (): Promise<FastifyInstance> => {


  const fastify = Fastify({ logger: true });

  // Register Swagger for API documentation (BEFORE routes)
  await fastify.register(await import('@fastify/swagger'), {
    swagger: {
      info: {
        title: 'Product Catalog API',
        description: 'A simple CRUD API for managing products',
        version: '1.0.0',
      },
      host: `localhost:${process.env.PORT ?? '4000'}`,
      schemes: ['http'],
      consumes: ['application/json'],
      produces: ['application/json'],
      basePath: '/api',
    },
  });

  // Register Swagger UI
  await fastify.register(await import('@fastify/swagger-ui'), {
    routePrefix: '/docs',
  });

  // Register product routes under /api/products (AFTER Swagger)
  fastify.register(productRoutes, { prefix: '/api/products' });  


  // ── Handle 404 — non-existing endpoints ─────────────────────────
  fastify.setNotFoundHandler((request, reply) => {
    reply.code(404).send({
      message: `The requested route ${request.method} ${request.url} does not exist`,
    });
  });

  // ── Handle 500 — server side errors ─────────────────────────────
  fastify.setErrorHandler((error, _request, reply) => {
    fastify.log.error(error);
    reply.code(500).send({
      message: 'Internal server error — something went wrong on the server',
    });
  });

  return fastify;
};

// ── Start server (only when run directly, not imported) ────────────
const isMain =
  process.argv[1]?.endsWith('server.ts') ||
  process.argv[1]?.endsWith('server.js');

if (isMain) {
  const PORT = parseInt(process.env.PORT ?? '4000');
  const app = await buildApp();

  // Receive state sync from primary process in cluster mode
  process.on('message', (msg: IPCMessage) => {
    if (msg.type === 'SYNC_STATE') {
      db.products = msg.products;
    }
  });

  try {
    await app.listen({ port: PORT, host: '0.0.0.0' });
    console.log(`\nServer running → http://localhost:${PORT}`);
  } catch (error) {
    app.log.error(error);
    process.exit(1);
  }
}