import 'dotenv/config';
import cluster       from 'node:cluster';
import os            from 'node:os';
import http          from 'node:http';
import type { IPCMessage, Product } from '../types/Product.js';
import { buildApp }  from '../server.js';
import { db }        from '../db/inmemorydb.js'; 

const PORT        = parseInt(process.env.PORT ?? '4000');
const NUM_WORKERS = Math.max(os.availableParallelism() - 1, 1);

// ── Shared in-memory state — lives only in primary process ─────────              
const sharedDB: { products: Product[] } = { products: [] };

if (cluster.isPrimary) {

  console.log(`\nPrimary ${process.pid} started`);
  console.log(`Spawning ${NUM_WORKERS} worker(s)...\n`);

  const workerPorts: number[] = [];
  const workerPortMap: Map<number, number> = new Map();

  // ── Spawn N workers ───────────────────────────────────────────────
  for (let i = 0; i < NUM_WORKERS; i++) {
    const workerPort = PORT + 1 + i;
    workerPorts.push(workerPort);

    const worker = cluster.fork({ PORT: String(workerPort) });
    workerPortMap.set(worker.id, workerPort);
    console.log(`Worker ${i + 1} → http://localhost:${workerPort}`);

    // ── Handle IPC messages from each worker ──────────────────────
    worker.on('message', (msg: IPCMessage) => {

      // Apply mutation to shared state in primary
      if (msg.type === 'ADD_PRODUCT') {
        sharedDB.products.push(msg.product);
      }
      if (msg.type === 'UPDATE_PRODUCT') {
        const idx = sharedDB.products.findIndex((p) => p.id === msg.productId);
        if (idx !== -1) sharedDB.products[idx] = msg.product;
      }
      if (msg.type === 'DELETE_PRODUCT') {
        const idx = sharedDB.products.findIndex((p) => p.id === msg.productId);
        if (idx !== -1) sharedDB.products.splice(idx, 1);
      }

      // Broadcast updated state to ALL workers after every mutation
      for (const id in cluster.workers) {
        cluster.workers[id]?.send({
          type    : 'SYNC_STATE',
          products: sharedDB.products,
        } satisfies IPCMessage);
      }
    });
  }

  // ── Round-robin load balancer ─────────────────────────────────────
  //
  //  localhost:PORT       ← load balancer (this primary process)
  //  localhost:PORT+1     ← worker 1
  //  localhost:PORT+2     ← worker 2
  //  localhost:PORT+N     ← worker N
  //
  let currentWorkerIndex = 0;

  const loadBalancer = http.createServer((req, res) => {
    // Pick next worker port — Round-robin
    const targetPort       = workerPorts[currentWorkerIndex];
    currentWorkerIndex     = (currentWorkerIndex + 1) % workerPorts.length;

    console.log(
      `[LB] ${req.method} ${req.url} → worker on port ${targetPort}`
    );

    // Forward request to selected worker
    const proxyReq = http.request(
      {
        hostname: 'localhost',
        port    : targetPort,
        path    : req.url,
        method  : req.method,
        headers : req.headers,
      },
      (workerRes) => {
        res.writeHead(workerRes.statusCode ?? 500, workerRes.headers);
        workerRes.pipe(res);
      }
    );

    proxyReq.on('error', (err) => {
      console.error(`Proxy error: ${err.message}`);
      res
        .writeHead(502, { 'Content-Type': 'application/json' })
        .end(JSON.stringify({ message: 'Bad Gateway' }));
    });

    req.pipe(proxyReq);
  });

  loadBalancer.listen(PORT, () => {
    console.log(`\nLoad balancer → http://localhost:${PORT}`);
    console.log(`Workers       → ports ${workerPorts.join(', ')}`);
    console.log(`\nSend requests to http://localhost:${PORT}/api/products\n`);
  });

  // Restart worker if it dies
  cluster.on('exit', (worker) => {
    const deadPort = workerPortMap.get(worker.id);
    if (deadPort !== undefined) {
      console.log(`Worker on port ${deadPort} died — restarting...`);
      const newWorker = cluster.fork({ PORT: String(deadPort) });
      workerPortMap.set(newWorker.id, deadPort);
    }
  });

} else {
  // ── Worker process — start the Fastify app ─────────────────────

  const WORKER_PORT = parseInt(process.env.PORT ?? '4001');
  const app         = buildApp();

  // Receive state sync messages from primary
  process.on('message', (msg: IPCMessage) => {
    if (msg.type === 'SYNC_STATE') {
      db.products = msg.products;
    }
  });

  await app.listen({ port: WORKER_PORT, host: '0.0.0.0' });
  console.log(`Worker ${process.pid} listening on port ${WORKER_PORT}`);
}