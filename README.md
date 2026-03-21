Product Catalog CRUD API:

A high-performance CRUD API for managing products, built with Fastify,TypeScript, and Node.js. Features multi-process clustering, in-memory database, comprehensive API documentation, and full test coverage.

Features:

CRUD Operations - Create, Read, Update, Delete products  
Fastify Framework - Modern, fast HTTP server (v5.8.2)  
TypeScript - Type-safe codebase with strict mode enabled  
Cluster Mode - Multi-process architecture with load balancing  
API Documentation - Interactive Swagger UI at `/docs`  
Input Validation - JSON Schema validation with Zod  
Comprehensive Tests - 18 test cases covering all scenarios  
Error Handling - Proper HTTP status codes and error messages  
IPC Communication - State synchronization across worker processes  


Prerequisites

Node.js v25.2.1 or higher
npm v10.x or higher

Check your versions:

node --version
npm --version


Installation:

1. Clone the Repository:

git clone https://github.com/maheshwarikarankot/node-crud-API.git
cd node-crud-API


2. Install Dependencies:

npm install


This installs:
- Fastify framework
- Swagger documentation plugins
- TypeScript compiler
- Development tools (tsx, nodemon)

3. Verify Installation:

npm run build


If successful, you'll see no errors and a `dist/` folder will be created.

Running the Application:

1: Development Mode:

npm run start:dev

- Server runs at `http://localhost:4000`
- API: `http://localhost:4000/api/products`
- Swagger UI: `http://localhost:4000/docs`


Mode 2: Production Mode

npm run start:prod

- Compiles TypeScript to JavaScript
- Server runs at `http://localhost:4000`
- Use this for deployment

Mode 3: Cluster Mode (Multi-Process)

npm run start:multi

- Primary process on port 4000 (load balancer)
- Worker processes on ports 4001, 4002, etc. (one per CPU core)
- State synchronized across all workers via IPC
- Perfect for high-traffic scenarios


Testing:

npm test


Output:

- 18 tests
- 0 failed
- 100% pass rate


Test Coverage:
- GET /api/products** - List all products
- POST /api/products** - Create new product
- GET /api/products/:id** - Get single product
- PUT /api/products/:id** - Update product
- DELETE /api/products/:id** - Delete product
- Validation** - Missing fields, invalid prices, type errors
- Error Handling** - Invalid UUIDs, non-existent products

---

API Endpoints:

1. Get All Products:

curl -X GET http://localhost:4000/api/products

Response:

[
  {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "name": "Laptop",
    "description": "High-performance laptop",
    "price": 999,
    "category": "electronics",
    "inStock": true
  }
]


2. Create a Product:

curl -X POST http://localhost:4000/api/products \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Wireless Mouse",
    "description": "USB wireless mouse",
    "price": 29.99,
    "category": "accessories",
    "inStock": true
  }'


Response: (201 Created):

{
  "id": "c6e5cd1f-2033-4c26-8df3-fbd8876acf08",
  "name": "Wireless Mouse",
  "description": "USB wireless mouse",
  "price": 29.99,
  "category": "accessories",
  "inStock": true
}


3. Get Single Product:

curl -X GET http://localhost:4000/api/products/c6e5cd1f-2033-4c26-8df3-fbd8876acf08


Response: (200 OK):

{
  "id": "c6e5cd1f-2033-4c26-8df3-fbd8876acf08",
  "name": "Wireless Mouse",
  "description": "USB wireless mouse",
  "price": 29.99,
  "category": "accessories",
  "inStock": true
}


4. Update a Product:

curl -X PUT http://localhost:4000/api/products/c6e5cd1f-2033-4c26-8df3-fbd8876acf08 \
  -H "Content-Type: application/json" \
  -d '{
    "price": 24.99,
    "inStock": false
  }'


Response: (200 OK):

{
  "id": "c6e5cd1f-2033-4c26-8df3-fbd8876acf08",
  "name": "Wireless Mouse",
  "description": "USB wireless mouse",
  "price": 24.99,
  "category": "accessories",
  "inStock": false
}

5. Delete a Product:

curl -X DELETE http://localhost:4000/api/products/c6e5cd1f-2033-4c26-8df3-fbd8876acf08


Response: (204 No Content)
[]

API Documentation:

Interactive Swagger UI:
Visit `http://localhost:4000/docs` in your browser to:
- View all endpoints with descriptions
- See request/response schemas
- Test endpoints directly from the UI
- Export API spec as OpenAPI/Swagger file


Input Validation:

All requests are validated using JSON Schema. Invalid requests return `400 Bad Request`:

Required Fields for POST/PUT:
- `name` - string, min 1 character
- `description` - string, min 1 character
- `price` - number, must be > 0
- `category` - string, min 1 character
- `inStock` - boolean

Validation Examples:

Missing required field:
curl -X POST http://localhost:4000/api/products \
  -H "Content-Type: application/json" \
  -d '{"name": "Product"}' 
  Returns 400

Invalid price (zero not allowed):
curl -X POST http://localhost:4000/api/products \
  -H "Content-Type: application/json" \
  -d '{"name": "Product", "price": 0}' 
  Returns 400

Invalid UUID:
curl -X GET http://localhost:4000/api/products/invalid-id Returns 400

Non-existent product:
curl -X GET http://localhost:4000/api/products/00000000-0000-4000-8000-000000000000 
Returns 404

Project Structure:

node-crud-API/
├── src/
│   ├── server.ts              # Main Fastify app builder
│   ├── cluster/
│   │   └── index.ts           # Multi-process &orchestration
│   ├── routes/
│   │   └── Products.ts        # CRUD endpoint handlers
│   ├── db/
│   │   └── inmemorydb.ts      # In-memory database
│   ├── types/
│   │   └── Product.ts         # TypeScript interfaces & schemas
│   └── Test/
│       └── ProductTest.ts     # Test suite (18 tests)
├── dist/                       # Compiled JavaScript (generated)
├── package.json               # Dependencies and scripts
├── tsconfig.json              # TypeScript configuration
└── README.md                  # This file









