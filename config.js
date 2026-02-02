/**
 * Central Configuration File
 * Centralized configuration for the entire application
 */

const path = require('path');
require('dotenv').config();

// ==================== VALIDATION ====================
const requiredEnvVars = [
  'MONGODB_URI',
  'CONTRACT_ADDRESS',
  'PRIVATE_KEY',
  'EMAIL_USER',
  'EMAIL_PASSWORD',
  'SEPOLIA_RPC_URL'
];

const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);
if (missingEnvVars.length > 0) {
  console.warn(`⚠️  Missing environment variables: ${missingEnvVars.join(', ')}`);
  console.warn('📄 Copy .env.example to .env and fill in the values');
}

// ==================== SERVER CONFIG ====================
const serverConfig = {
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production'
};

// ==================== BLOCKCHAIN CONFIG ====================
const blockchainConfig = {
  rpcUrl: process.env.SEPOLIA_RPC_URL,
  contractAddress: process.env.CONTRACT_ADDRESS,
  privateKey: process.env.PRIVATE_KEY,
  chainId: 11155111, // Sepolia chain ID
  chainName: 'Sepolia',
  
  // Gas settings
  gas: {
    limit: BigInt(300000),
    multiplier: 1.2 // 20% buffer
  },
  
  // Retry settings
  retry: {
    maxAttempts: 3,
    delayMs: 1000,
    backoffMultiplier: 2
  },
  
  // Transaction settings
  transaction: {
    confirmations: 1,
    timeout: 300000 // 5 minutes
  }
};

// ==================== DATABASE CONFIG ====================
const databaseConfig = {
  uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/order-tracking',
  
  options: {
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
    connectTimeoutMS: 10000,
    maxPoolSize: 10,
    minPoolSize: 2,
    maxIdleTimeMS: 45000,
    heartbeatFrequencyMS: 10000,
    retryWrites: true,
    w: 'majority'
  },
  
  // Connection retry
  retry: {
    maxAttempts: 5,
    delayMs: 2000,
    backoffMultiplier: 1.5
  }
};

// ==================== EMAIL CONFIG ====================
const emailConfig = {
  provider: 'gmail', // gmail, sendgrid, etc.
  from: process.env.EMAIL_USER,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  },
  
  // Retry settings for email
  retry: {
    maxAttempts: 3,
    delayMs: 1000
  },
  
  // Rate limiting
  rateLimit: {
    maxEmailsPerMinute: 10,
    maxEmailsPerHour: 100
  },
  
  // Templates
  templates: {
    orderCreated: {
      subject: '📦 Đơn hàng của bạn đã được tạo - #{orderId}'
    },
    statusUpdated: {
      subject: '📦 Cập nhật trạng thái đơn hàng - #{orderId}: {status}'
    },
    delivered: {
      subject: '✅ Đơn hàng đã được giao - #{orderId}'
    }
  }
};

// ==================== API CONFIG ====================
const apiConfig = {
  prefix: '/api',
  
  // CORS settings
  cors: {
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  },
  
  // Rate limiting
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.'
  },
  
  // Pagination
  pagination: {
    defaultLimit: 20,
    maxLimit: 100
  },
  
  // Response timeout
  timeout: 30000, // 30 seconds
  
  // Cache settings
  cache: {
    enabled: true,
    ttl: 30, // seconds
    clearOnUpdate: true
  }
};

// ==================== CACHING CONFIG ====================
const cacheConfig = {
  enabled: true,
  provider: 'memory', // memory, redis
  
  // Cache keys with TTL
  ttl: {
    blockNumber: 5, // 5 seconds
    contractData: 30, // 30 seconds
    orderData: 60, // 1 minute
    systemStats: 60, // 1 minute
    orderHistory: 120 // 2 minutes
  },
  
  // Cache size limits
  limits: {
    maxKeys: 1000,
    maxMemoryMB: 100
  }
};

// ==================== LOGGING CONFIG ====================
const loggingConfig = {
  level: process.env.LOG_LEVEL || 'info',
  format: 'json', // json, text
  
  // Log rotation
  files: {
    enabled: true,
    directory: path.join(__dirname, 'logs'),
    maxSize: '10m',
    maxFiles: '14d'
  },
  
  // Exclude sensitive fields
  excludeFields: ['password', 'privateKey', 'token', 'secret', 'email_password'],
  
  // Log levels
  levels: {
    error: 0,
    warn: 1,
    info: 2,
    http: 3,
    debug: 4
  }
};

// ==================== SECURITY CONFIG ====================
const securityConfig = {
  // Input validation
  validation: {
    maxStringLength: 1000,
    maxArrayLength: 100,
    maxNumberValue: Number.MAX_SAFE_INTEGER
  },
  
  // Rate limiting
  rateLimiting: {
    enabled: true,
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 100
  },
  
  // CORS
  corsEnabled: true,
  
  // Helmet security headers
  helmetEnabled: true
};

// ==================== STATUS CONSTANTS ====================
const orderStatusMap = {
  CREATED: 0,
  CONFIRMED: 1,
  SHIPPED: 2,
  DELIVERED: 3,
  CANCELLED: 4
};

const orderStatusNames = {
  0: 'CREATED',
  1: 'CONFIRMED',
  2: 'SHIPPED',
  3: 'DELIVERED',
  4: 'CANCELLED'
};

// ==================== ERROR MESSAGES ====================
const errorMessages = {
  WALLET_NOT_CONNECTED: 'Please connect your wallet first',
  INVALID_INPUT: 'Invalid input provided',
  CONTRACT_ERROR: 'Smart contract error',
  DATABASE_ERROR: 'Database error',
  EMAIL_ERROR: 'Email sending failed',
  TRANSACTION_FAILED: 'Transaction failed',
  NOT_FOUND: 'Resource not found',
  UNAUTHORIZED: 'Unauthorized access',
  VALIDATION_ERROR: 'Validation error',
  SERVER_ERROR: 'Internal server error'
};

// ==================== SUCCESS MESSAGES ====================
const successMessages = {
  ORDER_CREATED: 'Order created successfully',
  ORDER_UPDATED: 'Order updated successfully',
  EMAIL_SENT: 'Email sent successfully',
  DATA_SAVED: 'Data saved successfully'
};

// ==================== API ENDPOINTS ====================
const apiEndpoints = {
  health: '/api/health',
  stats: '/api/stats',
  order: '/api/order/:id',
  orders: '/api/orders',
  createOrder: '/api/create-order',
  updateStatus: '/api/order/:id/status',
  metadata: '/api/metadata'
};

// ==================== EXPORT ====================
module.exports = {
  // Config objects
  serverConfig,
  blockchainConfig,
  databaseConfig,
  emailConfig,
  apiConfig,
  cacheConfig,
  loggingConfig,
  securityConfig,
  
  // Constants
  orderStatusMap,
  orderStatusNames,
  errorMessages,
  successMessages,
  apiEndpoints,
  
  // Utilities
  isDevelopment: serverConfig.isDevelopment,
  isProduction: serverConfig.isProduction
};
