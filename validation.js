/**
 * Input Validation Service
 * Validate and sanitize all API inputs
 */

const { validationResult } = require('express-validator');
const { body, param, query } = require('express-validator');
const config = require('./config');

// ==================== CUSTOM VALIDATORS ====================

const validateOrderId = (value) => {
  if (!value || typeof value !== 'string' || value.trim().length === 0) {
    throw new Error('Order ID is required and must be a non-empty string');
  }
  if (value.length > 100) {
    throw new Error('Order ID is too long (max 100 characters)');
  }
  return true;
};

const validateEmail = (value) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(value)) {
    throw new Error('Invalid email format');
  }
  return true;
};

const validateEthereumAddress = (value) => {
  if (!/^0x[a-fA-F0-9]{40}$/.test(value)) {
    throw new Error('Invalid Ethereum address');
  }
  return true;
};

const validateProductName = (value) => {
  if (!value || typeof value !== 'string' || value.trim().length === 0) {
    throw new Error('Product name is required');
  }
  if (value.length > 500) {
    throw new Error('Product name is too long (max 500 characters)');
  }
  return true;
};

const validateQuantity = (value) => {
  const qty = parseInt(value, 10);
  if (isNaN(qty) || qty < 1) {
    throw new Error('Quantity must be a positive number');
  }
  if (qty > 1000000) {
    throw new Error('Quantity is too large');
  }
  return true;
};

const validateStatus = (value) => {
  const validStatuses = [0, 1, 2, 3, 4];
  const status = parseInt(value, 10);
  if (!validStatuses.includes(status)) {
    throw new Error('Invalid status');
  }
  return true;
};

// ==================== VALIDATION CHAINS ====================

const createOrderValidation = [
  body('productName')
    .trim()
    .notEmpty().withMessage('Product name is required')
    .isLength({ max: 500 }).withMessage('Product name is too long')
    .custom(validateProductName),
  
  body('quantity')
    .notEmpty().withMessage('Quantity is required')
    .isInt({ min: 1, max: 1000000 }).withMessage('Quantity must be between 1 and 1000000')
    .custom(validateQuantity),
  
  body('recipientEmail')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Invalid email format')
    .custom(validateEmail),
  
  body('recipientName')
    .optional()
    .trim()
    .isLength({ max: 255 }).withMessage('Name is too long'),
  
  body('recipientPhone')
    .optional()
    .trim()
    .matches(/^[\d\s\-\+\(\)]+$/).withMessage('Invalid phone format'),
  
  body('recipientAddress')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Address is too long'),
  
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 1000 }).withMessage('Notes is too long')
];

const updateStatusValidation = [
  param('orderId')
    .trim()
    .notEmpty().withMessage('Order ID is required')
    .custom(validateOrderId),
  
  body('status')
    .notEmpty().withMessage('Status is required')
    .isString().withMessage('Status must be a string')
    .isIn(['PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'CREATED', 'CONFIRMED'])
    .withMessage('Invalid status value')
];

const getOrderValidation = [
  param('orderId')
    .trim()
    .notEmpty().withMessage('Order ID is required')
    .custom(validateOrderId)
];

const listOrdersValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('Page must be a positive number'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  
  query('status')
    .optional()
    .isInt({ min: 0, max: 4 }).withMessage('Invalid status value')
];

// ==================== MIDDLEWARE ====================

/**
 * Validation error handler middleware
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: config.errorMessages.VALIDATION_ERROR,
      details: errors.array().map(err => ({
        field: err.param,
        message: err.msg
      }))
    });
  }
  
  next();
};

/**
 * Input sanitization middleware
 */
const sanitizeInput = (req, res, next) => {
  // Sanitize request body
  if (req.body && typeof req.body === 'object') {
    for (const [key, value] of Object.entries(req.body)) {
      if (typeof value === 'string') {
        // Remove leading/trailing whitespace
        req.body[key] = value.trim();
      }
    }
  }
  
  next();
};

// ==================== EXPORT ====================

module.exports = {
  // Custom validators
  validateOrderId,
  validateEmail,
  validateEthereumAddress,
  validateProductName,
  validateQuantity,
  validateStatus,
  
  // Validation chains
  createOrderValidation,
  updateStatusValidation,
  getOrderValidation,
  listOrdersValidation,
  
  // Middleware
  handleValidationErrors,
  sanitizeInput
};
