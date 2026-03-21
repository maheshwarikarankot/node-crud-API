import type { Product } from '../types/ProductType.js';
// In-memory database — array acting as our database
// Data resets every time the server restarts.
export const db: { products: Product[] } = {
  products: [],
};