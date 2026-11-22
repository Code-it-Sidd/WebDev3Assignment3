// Optional: npm run seed  -> loads 12 sample products across 5 categories
require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('./models/Product');

const data = [
  { name: 'Study Table', sku: 'FURN-TB-812', category: 'Furniture', price: 3999, quantity: 2, reorderLevel: 4, supplier: 'IKEA India' },
  { name: 'Office Chair', sku: 'FURN-CH-204', category: 'Furniture', price: 5499, quantity: 15, reorderLevel: 5, supplier: 'IKEA India' },
  { name: 'Laptop 15"', sku: 'ELEC-LP-101', category: 'Electronics', price: 54999, quantity: 3, reorderLevel: 5, supplier: 'Dell India' },
  { name: 'Wireless Mouse', sku: 'ELEC-MS-102', category: 'Electronics', price: 799, quantity: 40, reorderLevel: 10, supplier: 'Logitech' },
  { name: 'Bluetooth Speaker', sku: 'ELEC-SP-103', category: 'Electronics', price: 2499, quantity: 30, reorderLevel: 8, supplier: 'boAt' },
  { name: 'Smartphone', sku: 'ELEC-PH-104', category: 'Electronics', price: 18999, quantity: 23, reorderLevel: 6, supplier: 'Samsung' },
  { name: 'Cotton T-Shirt', sku: 'APRL-TS-301', category: 'Apparel', price: 499, quantity: 50, reorderLevel: 15, supplier: 'Allen Solly' },
  { name: 'Denim Jacket', sku: 'APRL-JK-302', category: 'Apparel', price: 2299, quantity: 28, reorderLevel: 10, supplier: 'Levis' },
  { name: 'Notebook A4 (Pack of 5)', sku: 'STNY-NB-701', category: 'Stationery', price: 250, quantity: 8, reorderLevel: 20, supplier: 'Classmate' },
  { name: 'Marker Set', sku: 'STNY-MK-702', category: 'Stationery', price: 180, quantity: 60, reorderLevel: 20, supplier: 'Camlin' },
  { name: 'Basmati Rice 5kg', sku: 'GROC-RC-501', category: 'Grocery', price: 650, quantity: 5, reorderLevel: 10, supplier: 'India Gate' },
  { name: 'Olive Oil 1L', sku: 'GROC-OL-502', category: 'Grocery', price: 899, quantity: 25, reorderLevel: 10, supplier: 'Figaro' },
];

(async () => {
  await mongoose.connect(process.env.MONGO_URI);
  await Product.deleteMany({});
  await Product.insertMany(data);
  console.log(`Seeded ${data.length} products`);
  await mongoose.disconnect();
})();
