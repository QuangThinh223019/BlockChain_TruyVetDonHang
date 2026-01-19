/**
 * Seed Database with Sample Data
 * Sử dụng: npm run seed:db
 */

const mongoose = require('mongoose');
require('dotenv').config();

const {
  Order,
  StatusLog,
  User,
  Statistics
} = require('../schemas/models');

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/order-tracking";

const SAMPLE_USERS = [
  {
    address: "0x742d35Cc6634C0532925a3b844Bc9e7595f42e99".toLowerCase(),
    name: "Admin Chính",
    email: "admin@company.com",
    phone: "0901234567",
    role: "ADMIN",
    organization: "Logistics Co.",
    isActive: true
  },
  {
    address: "0x1234567890123456789012345678901234567890".toLowerCase(),
    name: "Shipper Đỗ Văn B",
    email: "shipper1@company.com",
    phone: "0987654321",
    role: "SHIPPER",
    organization: "Logistics Co.",
    isActive: true
  },
  {
    address: "0x0987654321098765432109876543210987654321".toLowerCase(),
    name: "Viewer Nguyễn Văn C",
    email: "viewer@company.com",
    role: "VIEWER",
    organization: "Customer",
    isActive: true
  }
];

const SAMPLE_ORDERS = [
  {
    orderId: "ORDER-2024-001",
    adminAddress: "0x742d35Cc6634C0532925a3b844Bc9e7595f42e99".toLowerCase(),
    createdAt: new Date("2024-01-15T10:30:00Z"),
    status: "DELIVERED",
    blockchainHash: "QmAbCdEfGhIjKlMnOpQrStUvWxYz123456789",
    metadata: {
      productName: "Dell Laptop XPS 15",
      productDescription: "High-performance laptop",
      quantity: 1,
      price: 1500,
      totalAmount: 1500,
      sku: "DELL-XPS-15-001",
      category: "Electronics"
    },
    recipient: {
      name: "Nguyễn Văn A",
      phone: "0901234567",
      email: "customer1@email.com",
      address: "123 Đường Tây Sơn",
      city: "Hà Nội",
      province: "Hà Nội",
      postalCode: "100000",
      country: "Việt Nam",
      coordinates: {
        type: "Point",
        coordinates: [105.8342, 21.0285] // [longitude, latitude]
      }
    },
    sender: {
      name: "Tech Store Hà Nội",
      address: "456 Nguyễn Hue",
      phone: "024-12345678",
      email: "store@techstore.vn"
    },
    documents: [
      {
        type: "INVOICE",
        ipfsHash: "QmInvoice001",
        fileName: "invoice_2024_001.pdf",
        uploadedAt: new Date("2024-01-15T11:00:00Z")
      }
    ],
    images: [
      {
        ipfsHash: "QmImage001",
        fileName: "product_photo.jpg",
        size: 2048576,
        uploadedAt: new Date("2024-01-15T10:35:00Z")
      }
    ],
    estimatedDelivery: new Date("2024-01-18T00:00:00Z"),
    actualDelivery: new Date("2024-01-18T14:30:00Z"),
    notes: "Delivered successfully",
    updatedAt: new Date("2024-01-18T14:30:00Z")
  },
  {
    orderId: "ORDER-2024-002",
    adminAddress: "0x742d35Cc6634C0532925a3b844Bc9e7595f42e99".toLowerCase(),
    createdAt: new Date("2024-01-19T09:00:00Z"),
    status: "SHIPPED",
    blockchainHash: "QmAbCdEfGhIjKlMnOpQrStUvWxYz123457890",
    metadata: {
      productName: "iPhone 15 Pro Max",
      productDescription: "Latest Apple smartphone",
      quantity: 1,
      price: 1200,
      totalAmount: 1200,
      sku: "APPLE-IP15P-001",
      category: "Electronics"
    },
    recipient: {
      name: "Trần Thị B",
      phone: "0912345678",
      email: "customer2@email.com",
      address: "789 Nguyễn Văn Linh",
      city: "Hồ Chí Minh",
      province: "Hồ Chí Minh",
      postalCode: "700000",
      country: "Việt Nam",
      coordinates: {
        type: "Point",
        coordinates: [106.7017, 10.7769]
      }
    },
    sender: {
      name: "Apple Store HCMC",
      address: "654 Nguyễn Huệ",
      phone: "028-87654321"
    },
    estimatedDelivery: new Date("2024-01-21T00:00:00Z"),
    updatedAt: new Date("2024-01-19T14:00:00Z")
  },
  {
    orderId: "ORDER-2024-003",
    adminAddress: "0x742d35Cc6634C0532925a3b844Bc9e7595f42e99".toLowerCase(),
    createdAt: new Date("2024-01-19T11:30:00Z"),
    status: "PROCESSING",
    blockchainHash: "QmAbCdEfGhIjKlMnOpQrStUvWxYz123458901",
    metadata: {
      productName: "Sony WH-1000XM5 Headphones",
      productDescription: "Wireless noise-cancelling headphones",
      quantity: 2,
      price: 350,
      totalAmount: 700,
      sku: "SONY-WH1000-001",
      category: "Audio"
    },
    recipient: {
      name: "Lê Văn C",
      phone: "0923456789",
      email: "customer3@email.com",
      address: "321 Trần Hưng Đạo",
      city: "Đà Nẵng",
      province: "Đà Nẵng",
      postalCode: "550000",
      country: "Việt Nam",
      coordinates: {
        type: "Point",
        coordinates: [107.5905, 16.0544]
      }
    },
    sender: {
      name: "Electronics Hub",
      address: "111 Main Street",
      phone: "0236-123456"
    },
    estimatedDelivery: new Date("2024-01-20T00:00:00Z"),
    updatedAt: new Date("2024-01-19T11:30:00Z")
  }
];

const SAMPLE_STATUS_LOGS = [
  {
    orderId: "ORDER-2024-001",
    status: "CREATED",
    timestamp: new Date("2024-01-15T10:30:00Z"),
    details: {
      location: "Warehouse",
      notes: "Order created",
      handler: "System"
    },
    blockchainTxHash: "0xabc123..."
  },
  {
    orderId: "ORDER-2024-001",
    status: "PROCESSING",
    timestamp: new Date("2024-01-15T12:00:00Z"),
    details: {
      location: "Warehouse",
      notes: "Processing order",
      handler: "Warehouse Staff"
    },
    blockchainTxHash: "0xabc124..."
  },
  {
    orderId: "ORDER-2024-001",
    status: "SHIPPED",
    timestamp: new Date("2024-01-16T08:00:00Z"),
    details: {
      location: "Sorting Center",
      notes: "Dispatched",
      handler: "Shipper",
      contactPhone: "0987654321"
    },
    blockchainTxHash: "0xabc125..."
  },
  {
    orderId: "ORDER-2024-001",
    status: "DELIVERED",
    timestamp: new Date("2024-01-18T14:30:00Z"),
    details: {
      location: "123 Đường Tây Sơn, Hà Nội",
      notes: "Delivered to recipient",
      handler: "Delivery Driver"
    },
    blockchainTxHash: "0xabc126..."
  }
];

const SAMPLE_STATISTICS = [
  {
    date: new Date("2024-01-19T00:00:00Z"),
    totalOrders: 3,
    deliveredOrders: 1,
    cancelledOrders: 0,
    pendingOrders: 0,
    processingOrders: 1,
    shippedOrders: 1,
    totalValue: 3400,
    averageValue: 1133.33,
    averageDeliveryTime: 72,
    adminAddress: "0x742d35Cc6634C0532925a3b844Bc9e7595f42e99".toLowerCase()
  }
];

async function seedDatabase() {
  try {
    console.log("🔌 Connecting to MongoDB...");
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log("✅ Connected\n");

    console.log("🌱 Seeding sample data...\n");

    // 1. Clear existing data
    console.log("🗑️  Clearing existing data...");
    await User.deleteMany({});
    await Order.deleteMany({});
    await StatusLog.deleteMany({});
    await Statistics.deleteMany({});
    console.log("✅ Cleared\n");

    // 2. Insert users
    console.log("👥 Adding sample users...");
    const createdUsers = await User.insertMany(SAMPLE_USERS);
    console.log(`✅ Added ${createdUsers.length} users\n`);

    // 3. Insert orders
    console.log("📦 Adding sample orders...");
    const createdOrders = await Order.insertMany(SAMPLE_ORDERS);
    console.log(`✅ Added ${createdOrders.length} orders\n`);

    // 4. Insert status logs
    console.log("📝 Adding status logs...");
    const createdStatusLogs = await StatusLog.insertMany(SAMPLE_STATUS_LOGS);
    console.log(`✅ Added ${createdStatusLogs.length} status logs\n`);

    // 5. Insert statistics
    console.log("📊 Adding statistics...");
    const createdStats = await Statistics.insertMany(SAMPLE_STATISTICS);
    console.log(`✅ Added ${createdStats.length} statistics\n`);

    console.log("✅ Database seeding completed successfully!\n");

    // Show summary
    console.log("📋 Summary:");
    console.log(`   - Users: ${createdUsers.length}`);
    console.log(`   - Orders: ${createdOrders.length}`);
    console.log(`   - Status Logs: ${createdStatusLogs.length}`);
    console.log(`   - Statistics: ${createdStats.length}\n`);

  } catch (error) {
    console.error("❌ Seeding failed:", error.message);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 Disconnected from MongoDB");
  }
}

seedDatabase();
