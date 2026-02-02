/**
 * Mongoose Models for MongoDB
 * Các schema cho Node.js backend
 */

const mongoose = require('mongoose');

// Connection helper function
async function connectWithRetry() {
    const options = {
        serverSelectionTimeoutMS: 3000,
        socketTimeoutMS: 10000,
        connectTimeoutMS: 3000,
        maxPoolSize: 5,
        minPoolSize: 1,
        maxIdleTimeMS: 30000,
        heartbeatFrequencyMS: 10000
    };
    
    try {
        await mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/order-tracking", options);
        
        // Wait for connection to be ready
        await new Promise((resolve) => {
            if (mongoose.connection.readyState === 1) {
                resolve();
            } else {
                mongoose.connection.once('connected', resolve);
            }
        });
        
        // Test connection
        await mongoose.connection.db.admin().ping();
        console.log('✅ MongoDB connected successfully with optimized settings');
    } catch (error) {
        console.error('❌ MongoDB connection failed:', error.message);
        throw error;
    }
}

// ==================== ORDER MODEL ====================
const orderSchema = new mongoose.Schema({
  orderId: {
    type: String,
    required: true,
    unique: true
  },
  adminAddress: {
    type: String,
    required: true,
    lowercase: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['CREATED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'],
    default: 'CREATED'
  },
  blockchainHash: {
    type: String,
    description: 'Hash từ blockchain'
  },
  metadata: {
    productName: String,
    productDescription: String,
    quantity: Number,
    price: Number,
    totalAmount: Number,
    sku: String,
    category: String
  },
  recipient: {
    name: String,
    phone: String,
    email: String,
    address: String,
    city: String,
    province: String,
    postalCode: String,
    country: String,
    coordinates: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point'
      },
      coordinates: [Number] // [longitude, latitude]
    }
  },
  sender: {
    name: String,
    address: String,
    phone: String,
    email: String
  },
  documents: [{
    type: {
      type: String,
      enum: ['INVOICE', 'SHIPPING_LABEL', 'CERTIFICATE', 'OTHER']
    },
    ipfsHash: String,
    fileName: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  images: [{
    ipfsHash: String,
    fileName: String,
    size: Number,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  estimatedDelivery: Date,
  actualDelivery: Date,
  notes: String,
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Indexes for performance optimization
// Single field indexes
orderSchema.index({ status: 1 });
orderSchema.index({ createdAt: -1 });
orderSchema.index({ 'recipient.email': 1 });
orderSchema.index({ adminAddress: 1 });

// Compound indexes for common queries
orderSchema.index({ status: 1, createdAt: -1 }); // Filter by status and sort by date
orderSchema.index({ orderId: 1, status: 1 });
orderSchema.index({ adminAddress: 1, createdAt: -1 }); // User's orders

// Geospatial index for location-based search
orderSchema.index({ 'recipient.coordinates': '2dsphere' });

// TTL index for automatic cleanup of old records (optional)
// orderSchema.index({ createdAt: 1 }, { expireAfterSeconds: 2592000 }); // 30 days

const Order = mongoose.model('Order', orderSchema);

// ==================== STATUS LOG MODEL ====================
const statusLogSchema = new mongoose.Schema({
  orderId: {
    type: String,
    required: true
  },
  status: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    required: true
  },
  details: {
    location: String,
    notes: String,
    handler: String,
    contactPhone: String,
    temperature: Number,
    humidity: Number
  },
  attachments: [String],
  blockchainTxHash: String,
  updatedBy: {
    type: String,
    lowercase: true
  }
});

// Indexes for status logs
statusLogSchema.index({ orderId: 1, timestamp: -1 });
statusLogSchema.index({ status: 1, timestamp: -1 });
statusLogSchema.index({ blockchainTxHash: 1 });

const StatusLog = mongoose.model('StatusLog', statusLogSchema);

// ==================== IPFS REFERENCE MODEL ====================
const ipfsReferenceSchema = new mongoose.Schema({
  ipfsHash: {
    type: String,
    required: true,
    unique: true
  },
  orderId: {
    type: String
  },
  type: {
    type: String,
    enum: ['IMAGE', 'INVOICE', 'SHIPPING_LABEL', 'CERTIFICATE', 'OTHER'],
    required: true
  },
  fileName: String,
  size: Number,
  mimeType: String,
  uploadedAt: {
    type: Date,
    default: Date.now
  },
  uploadedBy: {
    type: String,
    lowercase: true
  },
  description: String,
  cid: String // Content ID từ IPFS
});

// Indexes for IPFS references
ipfsReferenceSchema.index({ orderId: 1, uploadedAt: -1 });
ipfsReferenceSchema.index({ type: 1, uploadedAt: -1 });
ipfsReferenceSchema.index({ uploadedBy: 1 });

const IPFSReference = mongoose.model('IPFSReference', ipfsReferenceSchema);

// ==================== USER MODEL ====================
const userSchema = new mongoose.Schema({
  address: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  name: String,
  email: {
    type: String,
    sparse: true
  },
  phone: String,
  role: {
    type: String,
    enum: ['ADMIN', 'SHIPPER', 'VIEWER'],
    default: 'VIEWER'
  },
  organization: String,
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  lastLogin: Date
});

// Indexes for user queries
userSchema.index({ role: 1 });

const User = mongoose.model('User', userSchema);

// ==================== STATISTICS MODEL ====================
const statisticsSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true,
    index: true
  },
  totalOrders: Number,
  deliveredOrders: Number,
  cancelledOrders: Number,
  pendingOrders: Number,
  processingOrders: Number,
  shippedOrders: Number,
  totalValue: Number,
  averageValue: Number,
  averageDeliveryTime: Number, // hours
  adminAddress: {
    type: String,
    lowercase: true,
    index: true
  }
});

const Statistics = mongoose.model('Statistics', statisticsSchema);

// ==================== BLOCKCHAIN EVENT MODEL ====================
const blockchainEventSchema = new mongoose.Schema({
  eventName: {
    type: String,
    enum: ['OrderCreated', 'OrderStatusUpdated', 'OrderCancelled'],
    required: true,
    index: true
  },
  orderId: {
    type: String,
    required: true,
    index: true
  },
  transactionHash: {
    type: String,
    unique: true,
    index: true
  },
  blockNumber: {
    type: Number,
    index: true
  },
  blockTimestamp: {
    type: Date,
    required: true
  },
  from: {
    type: String,
    lowercase: true
  },
  eventData: mongoose.Schema.Types.Mixed,
  syncedAt: {
    type: Date,
    default: Date.now
  }
});

const BlockchainEvent = mongoose.model('BlockchainEvent', blockchainEventSchema);

// ==================== AUDIT LOG MODEL ====================
const auditLogSchema = new mongoose.Schema({
  action: {
    type: String,
    required: true
  },
  actor: {
    type: String,
    required: true,
    lowercase: true,
    index: true
  },
  orderId: {
    type: String,
    index: true
  },
  details: mongoose.Schema.Types.Mixed,
  timestamp: {
    type: Date,
    default: Date.now,
    index: true,
    expires: 7776000 // 90 days auto-delete
  },
  ipAddress: String
});

const AuditLog = mongoose.model('AuditLog', auditLogSchema);

// ==================== LOCATION HISTORY MODEL ====================
const locationHistorySchema = new mongoose.Schema({
  orderId: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now,
    required: true
  },
  coordinates: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: true
    }
  },
  address: String,
  city: String,
  province: String,
  postalCode: String,
  country: String,
  shipper: {
    name: String,
    phone: String,
    address: String
  },
  status: {
    type: String,
    enum: ['IN_TRANSIT', 'ARRIVED', 'DELAYED', 'DELIVERED'],
    default: 'IN_TRANSIT'
  },
  details: {
    temperature: Number,        // Nhiệt độ môi trường
    humidity: Number,           // Độ ẩm
    speed: Number,              // Tốc độ di chuyển (km/h)
    altitude: Number,           // Độ cao
    accuracy: Number,           // Độ chính xác GPS (meter)
    heading: Number,            // Hướng di chuyển (0-360 độ)
    notes: String
  },
  images: [String],             // IPFS hashes of images
  verifiedBy: String,           // Address of person who verified location
  blockchainTxHash: String      // Transaction hash nếu được ghi lên blockchain
});

// Indexes for location queries
locationHistorySchema.index({ orderId: 1, timestamp: -1 });
locationHistorySchema.index({ coordinates: '2dsphere' });        // For geospatial queries
locationHistorySchema.index({ 'shipper.name': 1, timestamp: -1 });
locationHistorySchema.index({ status: 1, timestamp: -1 });
locationHistorySchema.index({ city: 1, timestamp: -1 });

const LocationHistory = mongoose.model('LocationHistory', locationHistorySchema);

// ==================== EXPORT ====================
module.exports = {
  connectWithRetry,
  Order,
  StatusLog,
  IPFSReference,
  User,
  Statistics,
  BlockchainEvent,
  AuditLog,
  LocationHistory
};
