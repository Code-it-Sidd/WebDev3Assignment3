const Product = require('../models/Product');
const { AppError } = require('../middleware/errorHandler');

const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const SORTABLE = ['name', 'sku', 'category', 'price', 'quantity', 'reorderLevel', 'supplier', 'createdAt', 'updatedAt'];

// POST /api/products
exports.createProduct = asyncHandler(async (req, res) => {
  const product = await Product.create(req.body);
  res.status(201).json(product);
});

// GET /api/products?category=&supplier=&search=&minPrice=&maxPrice=&inStock=&sort=-price,name&page=1&limit=10
exports.getProducts = asyncHandler(async (req, res) => {
  const { category, supplier, search, minPrice, maxPrice, inStock } = req.query;
  const filter = {};

  if (category) filter.category = new RegExp(`^${escapeRegex(category)}$`, 'i');
  if (supplier) filter.supplier = new RegExp(escapeRegex(supplier), 'i');
  if (search) filter.name = new RegExp(escapeRegex(search), 'i');

  if (minPrice !== undefined || maxPrice !== undefined) {
    filter.price = {};
    if (minPrice !== undefined) filter.price.$gte = Number(minPrice);
    if (maxPrice !== undefined) filter.price.$lte = Number(maxPrice);
    if (Object.values(filter.price).some(Number.isNaN)) {
      throw new AppError('minPrice and maxPrice must be numbers', 400);
    }
  }
  if (inStock === 'true') filter.quantity = { $gt: 0 };
  if (inStock === 'false') filter.quantity = 0;

  // Sorting: ?sort=-price,name (whitelisted fields only)
  const sortBy = {};
  (req.query.sort || '-createdAt').split(',').forEach((field) => {
    const key = field.replace(/^-/, '').trim();
    if (SORTABLE.includes(key)) sortBy[key] = field.startsWith('-') ? -1 : 1;
  });
  if (Object.keys(sortBy).length === 0) sortBy.createdAt = -1;

  // Pagination
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 10, 1), 100);

  const [total, products] = await Promise.all([
    Product.countDocuments(filter),
    Product.find(filter).sort(sortBy).skip((page - 1) * limit).limit(limit),
  ]);

  res.json({
    total,
    page,
    totalPages: Math.ceil(total / limit),
    count: products.length,
    products,
  });
});

// GET /api/products/:id
exports.getProductById = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) throw new AppError('Product not found', 404);
  res.json(product);
});

// PUT /api/products/:id  (update details; fields not sent are left untouched)
exports.updateProduct = asyncHandler(async (req, res) => {
  const product = await Product.findByIdAndUpdate(
    req.params.id,
    { $set: req.body },
    { new: true, runValidators: true }
  );
  if (!product) throw new AppError('Product not found', 404);
  res.json(product);
});

// PATCH /api/products/:id/stock   body: { "change": 10 }  (+ restock, - sale)
exports.adjustStock = asyncHandler(async (req, res) => {
  const { change } = req.body;
  const filter = { _id: req.params.id };

  // Atomic guard: a sale only succeeds if enough stock exists, so quantity never goes negative
  if (change < 0) filter.quantity = { $gte: -change };

  const product = await Product.findOneAndUpdate(
    filter,
    { $inc: { quantity: change } },
    { new: true, runValidators: true }
  );

  if (!product) {
    const exists = await Product.exists({ _id: req.params.id });
    if (!exists) throw new AppError('Product not found', 404);
    throw new AppError('Insufficient stock for this sale', 400);
  }
  res.json({ message: 'Stock updated', product });
});

// DELETE /api/products/:id
exports.deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findByIdAndDelete(req.params.id);
  if (!product) throw new AppError('Product not found', 404);
  res.json({ message: 'Product deleted', id: product.id });
});

// GET /api/products/low-stock  (quantity <= reorderLevel) - aggregation
exports.getLowStock = asyncHandler(async (req, res) => {
  const docs = await Product.aggregate([
    { $match: { $expr: { $lte: ['$quantity', '$reorderLevel'] } } },
    { $sort: { quantity: 1 } },
  ]);
  // hydrate so the stockValue / id virtuals appear like in the other responses
  const lowStockItems = docs.map((d) => Product.hydrate(d).toJSON());
  res.json({ count: lowStockItems.length, lowStockItems });
});

// GET /api/products/summary  - category-wise aggregation
exports.getSummary = asyncHandler(async (req, res) => {
  const summary = await Product.aggregate([
    {
      $group: {
        _id: '$category',
        totalItems: { $sum: 1 },
        totalQuantity: { $sum: '$quantity' },
        totalStockValue: { $sum: { $multiply: ['$price', '$quantity'] } },
        avgPrice: { $avg: '$price' },
      },
    },
    { $sort: { totalStockValue: -1 } },
  ]);
  res.json({ categories: summary.length, summary });
});
