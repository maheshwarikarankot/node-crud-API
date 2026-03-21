import test, { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import type { FastifyInstance } from 'fastify';
import { buildApp } from '../server.js';
import { db }       from '../db/inmemorydb.js';

let app: FastifyInstance;

before(async () => {
  app = await buildApp();
  db.products = []; // reset before tests
});

after(async () => {
  await app.close();
});

// ── Shared test product ────────────────────────────────────────────
const validProduct = {
  name       : 'Test Laptop',
  description: 'A powerful test laptop',
  price      : 999,
  category   : 'electronics',
  inStock    : true,
};

let createdId = '';

// ── Scenario 1: GET all — empty array ─────────────────────────────
describe('GET /api/products', () => {

  test('returns 200 and empty array initially', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/products' });
    assert.equal(res.statusCode, 200);
    assert.deepEqual(JSON.parse(res.body), []);
  });
});

// ── Scenario 2: POST — create product ─────────────────────────────
describe('POST /api/products', () => {

  test('returns 201 and newly created product', async () => {
    const res = await app.inject({
      method : 'POST',
      url    : '/api/products',
      payload: validProduct,
    });
    assert.equal(res.statusCode, 201);
    const body = JSON.parse(res.body);
    assert.ok(body.id,                        'id should exist');
    assert.equal(body.name,        validProduct.name);
    assert.equal(body.description, validProduct.description);
    assert.equal(body.price,       validProduct.price);
    assert.equal(body.category,    validProduct.category);
    assert.equal(body.inStock,     validProduct.inStock);
    createdId = body.id;
  });

  test('returns 400 for missing required fields', async () => {
    const res = await app.inject({
      method : 'POST',
      url    : '/api/products',
      payload: { name: 'Incomplete' },
    });
    assert.equal(res.statusCode, 400);
  });

  test('returns 400 for negative price', async () => {
    const res = await app.inject({
      method : 'POST',
      url    : '/api/products',
      payload: { ...validProduct, price: -10 },
    });
    assert.equal(res.statusCode, 400);
  });

  test('returns 400 for zero price', async () => {
    const res = await app.inject({
      method : 'POST',
      url    : '/api/products',
      payload: { ...validProduct, price: 0 },
    });
    assert.equal(res.statusCode, 400);
  });

  test('returns 400 when inStock is not boolean', async () => {
    const res = await app.inject({
      method : 'POST',
      url    : '/api/products',
      payload: { ...validProduct, inStock: 'yes' },
    });
    assert.equal(res.statusCode, 400);
  });
});

// ── Scenario 3: GET by id ─────────────────────────────────────────
describe('GET /api/products/:productId', () => {

  test('returns 200 and the created product', async () => {
    const res = await app.inject({
      method: 'GET',
      url   : `/api/products/${createdId}`,
    });
    assert.equal(res.statusCode, 200);
    const body = JSON.parse(res.body);
    assert.equal(body.id,   createdId);
    assert.equal(body.name, validProduct.name);
  });

  test('returns 400 for invalid uuid', async () => {
    const res = await app.inject({
      method: 'GET',
      url   : '/api/products/not-a-valid-uuid',
    });
    assert.equal(res.statusCode, 400);
  });

  test('returns 404 for non-existing product', async () => {
    const res = await app.inject({
      method: 'GET',
      url   : '/api/products/00000000-0000-4000-8000-000000000000',
    });
    assert.equal(res.statusCode, 404);
  });
});

// ── Scenario 4: PUT — update product ─────────────────────────────
describe('PUT /api/products/:productId', () => {

  test('returns 200 and updated product with same id', async () => {
    const res = await app.inject({
      method : 'PUT',
      url    : `/api/products/${createdId}`,
      payload: { price: 1299, inStock: false },
    });
    assert.equal(res.statusCode, 200);
    const body = JSON.parse(res.body);
    assert.equal(body.id,      createdId);
    assert.equal(body.price,   1299);
    assert.equal(body.inStock, false);
    assert.equal(body.name,    validProduct.name);
  });

  test('returns 400 for invalid uuid', async () => {
    const res = await app.inject({
      method : 'PUT',
      url    : '/api/products/invalid-uuid',
      payload: { price: 500 },
    });
    assert.equal(res.statusCode, 400);
  });

  test('returns 404 for non-existing product', async () => {
    const res = await app.inject({
      method : 'PUT',
      url    : '/api/products/00000000-0000-4000-8000-000000000000',
      payload: { price: 500 },
    });
    assert.equal(res.statusCode, 404);
  });
});

// ── Scenario 5: DELETE — delete product ──────────────────────────
describe('DELETE the product by Id: ', () => {

  test('returns 204 when product is deleted', async () => {
    const res = await app.inject({
      method: 'DELETE',
      url   : `/api/products/${createdId}`,
    });
    assert.equal(res.statusCode, 204);
  });

  test('returns 400 for invalid uuid', async () => {
    const res = await app.inject({
      method: 'DELETE',
      url   : '/api/products/invalid-uuid',
    });
    assert.equal(res.statusCode, 400);
  });

  test('returns 404 for non-existing product', async () => {
    const res = await app.inject({
      method: 'DELETE',
      url   : '/api/products/00000000-0000-4000-8000-000000000000',
    });
    assert.equal(res.statusCode, 404);
  });
});

// ── Scenario 6: GET deleted product — 404 ────────────────────────
describe('GET the deleted product by Id:', () => {

  test('returns 404 for the deleted product', async () => {
    const res = await app.inject({
      method: 'GET',
      url   : `/api/products/${createdId}`,
    });
    assert.equal(res.statusCode, 404);
  });
});

// ── Scenario 7: Non-existing routes ──────────────────────────────
describe('Non-existing endpoints: ', () => {

  test('returns 404 for non existing endpoint', async () => {
    const res = await app.inject({
      method: 'GET',
      url   : '/some-non/existing/resource',
    });
    assert.equal(res.statusCode, 404);
    const body = JSON.parse(res.body);
    assert.ok(body.message, 'should have a message');
  });
});

// ── Scenario 8: GET all after operations ─────────────────────────
describe('GET result after all operations', () => {

  test('returns 200 and empty array after all deletes', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/products' });
    assert.equal(res.statusCode, 200);
    assert.deepEqual(JSON.parse(res.body), []);
  });
});