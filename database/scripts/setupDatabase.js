/**
 * Database Setup Script
 * Tạo collections, indexes, và sample data
 */

const mongoose = require('mongoose');
require('dotenv').config();

const {
  Order,
  StatusLog,
  IPFSReference,
  User,
  Statistics,
  BlockchainEvent,
  AuditLog
} = require('../schemas/models');

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/order-tracking";

async function setupDatabase() {
  try {
    console.log("🔌 Connecting to MongoDB...");
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log("✅ Connected to MongoDB\n");

    // Drop database cũ (nếu cần)
    // await mongoose.connection.dropDatabase();
    // console.log("🗑️  Database dropped\n");

    console.log("📝 Creating collections and indexes...\n");

    // Order collection
    await Order.collection.createIndex({ orderId: 1 }, { unique: true });
    await Order.collection.createIndex({ adminAddress: 1 });
    await Order.collection.createIndex({ status: 1 });
    await Order.collection.createIndex({ createdAt: -1 });
    console.log("✅ Order indexes created");

    // StatusLog collection
    await StatusLog.collection.createIndex({ orderId: 1, timestamp: -1 });
    await StatusLog.collection.createIndex({ status: 1 });
    console.log("✅ StatusLog indexes created");

    // IPFSReference collection
    await IPFSReference.collection.createIndex({ ipfsHash: 1 }, { unique: true });
    await IPFSReference.collection.createIndex({ orderId: 1 });
    console.log("✅ IPFSReference indexes created");

    // User collection
    await User.collection.createIndex({ address: 1 }, { unique: true });
    await User.collection.createIndex({ email: 1 }, { sparse: true });
    console.log("✅ User indexes created");

    // Statistics collection
    await Statistics.collection.createIndex({ date: -1 });
    await Statistics.collection.createIndex({ adminAddress: 1, date: -1 });
    console.log("✅ Statistics indexes created");

    // BlockchainEvent collection
    await BlockchainEvent.collection.createIndex({ orderId: 1, blockTimestamp: -1 });
    await BlockchainEvent.collection.createIndex({ transactionHash: 1 }, { unique: true });
    console.log("✅ BlockchainEvent indexes created");

    // AuditLog collection
    await AuditLog.collection.createIndex({ timestamp: -1 });
    await AuditLog.collection.createIndex({ actor: 1, timestamp: -1 });
    // TTL Index
    await AuditLog.collection.createIndex({ timestamp: 1 }, { expireAfterSeconds: 7776000 });
    console.log("✅ AuditLog indexes created\n");

    console.log("✅ Database setup completed successfully!\n");

  } catch (error) {
    console.error("❌ Setup failed:", error.message);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 Disconnected from MongoDB");
  }
}

setupDatabase();
