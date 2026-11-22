const mongoose = require('mongoose');
const { AppError } = require('./errorHandler');

// Rejects malformed ObjectIds before they hit the database
const validateObjectId = (req, res, next) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return next(new AppError('Invalid product ID', 400));
  }
  next();
};

// Body must be a non-empty object
const requireBody = (req, res, next) => {
  if (!req.body || Object.keys(req.body).length === 0) {
    return next(new AppError('Request body cannot be empty', 400));
  }
  next();
};

// Stock adjustment body: { "change": <non-zero integer> }
const validateStockChange = (req, res, next) => {
  const change = req.body && req.body.change;
  if (typeof change !== 'number' || !Number.isInteger(change) || change === 0) {
    return next(new AppError("'change' must be a non-zero integer (positive = restock, negative = sale)", 400));
  }
  next();
};

module.exports = { validateObjectId, requireBody, validateStockChange };
