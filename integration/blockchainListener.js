/**
 * IMPROVED BLOCKCHAIN EVENT LISTENER
 * Enhanced event listener với real-time monitoring và webhook support
 */

const ethers = require('ethers');
const mongoose = require('mongoose');
const axios = require('axios');
require('dotenv').config();

const { BlockchainEvent, Order, StatusLog } = require('../database/schemas/models');

// ==================== CONFIGURATION ====================

const RPC_URL = process.env.SEPOLIA_RPC_URL || process.env.RPC_URL || "http://localhost:8545";
const CONTRACT_ADDRESS = process.env.SEPOLIA_CONTRACT_ADDRESS || process.env.CONTRACT_ADDRESS || "";
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/order-tracking";
const WEBHOOK_URL = process.env.WEBHOOK_URL; // Optional webhook for notifications

// Event types to monitor
const EVENT_TYPES = [
    'OrderCreated',
    'OrderStatusUpdated', 
    'OrderCancelled',
    'AdminAuthorizationChanged'
];

class EnhancedBlockchainListener {
    constructor() {
        this.provider = null;
        this.contract = null;
        this.isRunning = false;
        this.eventStats = {
            totalProcessed: 0,
            errors: 0,
            lastProcessed: null
        };
    }

    async initialize() {
        console.log('🚀 ENHANCED BLOCKCHAIN EVENT LISTENER');
        console.log('=' .repeat(50));

        try {
            // Connect to blockchain
            console.log('⛓️  Connecting to blockchain...');
            this.provider = new ethers.JsonRpcProvider(RPC_URL);
            
            const contractArtifact = require('../blockchain/artifacts/contracts/OrderTracking.sol/OrderTracking.json');
            const signer = new ethers.Wallet(process.env.PRIVATE_KEY, this.provider);
            this.contract = new ethers.Contract(CONTRACT_ADDRESS, contractArtifact.abi, signer);
            
            console.log('✅ Blockchain connected');
            console.log(`📍 Contract: ${CONTRACT_ADDRESS}`);
            console.log(`🌐 Provider: ${RPC_URL}`);

            // Test contract connection
            const totalOrders = await this.contract.totalOrders();
            console.log(`📊 Current orders: ${totalOrders}`);

            // Connect to MongoDB (optional)
            if (MONGODB_URI) {
                try {
                    console.log('📊 Connecting to MongoDB...');
                    
                    await mongoose.connect(MONGODB_URI, {
                        serverSelectionTimeoutMS: 3000,
                        socketTimeoutMS: 10000,
                        connectTimeoutMS: 3000,
                        maxPoolSize: 5,
                        minPoolSize: 1,
                        maxIdleTimeMS: 30000,
                        heartbeatFrequencyMS: 10000
                    });
                    
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
                    console.log('✅ MongoDB connected');
                } catch (error) {
                    console.log('⚠️ MongoDB connection failed, running without database');
                }
            }

            return true;
        } catch (error) {
            console.error('❌ Initialization failed:', error.message);
            return false;
        }
    }

    async setupEventListeners() {
        console.log('\n📡 SETTING UP EVENT LISTENERS');
        console.log('=' .repeat(50));

        // OrderCreated event
        this.contract.on('OrderCreated', async (orderId, admin, timestamp, metadataHash, event) => {
            await this.handleEvent('OrderCreated', {
                orderId: orderId.toString(),
                admin: admin.toString(),
                timestamp: Number(timestamp),
                metadataHash,
                blockNumber: event.blockNumber,
                transactionHash: event.transactionHash
            });
        });

        // OrderStatusUpdated event
        this.contract.on('OrderStatusUpdated', async (orderId, newStatus, timestamp, detailsHash, updatedBy, event) => {
            await this.handleEvent('OrderStatusUpdated', {
                orderId: orderId.toString(),
                newStatus,
                timestamp: Number(timestamp),
                detailsHash,
                updatedBy: updatedBy.toString(),
                blockNumber: event.blockNumber,
                transactionHash: event.transactionHash
            });
        });

        // OrderCancelled event
        this.contract.on('OrderCancelled', async (orderId, timestamp, event) => {
            await this.handleEvent('OrderCancelled', {
                orderId: orderId.toString(),
                timestamp: Number(timestamp),
                blockNumber: event.blockNumber,
                transactionHash: event.transactionHash
            });
        });

        // AdminAuthorizationChanged event
        this.contract.on('AdminAuthorizationChanged', async (admin, authorized, event) => {
            await this.handleEvent('AdminAuthorizationChanged', {
                admin: admin.toString(),
                authorized,
                blockNumber: event.blockNumber,
                transactionHash: event.transactionHash
            });
        });

        console.log(`✅ Event listeners active for: ${EVENT_TYPES.join(', ')}`);
        this.isRunning = true;
    }

    async handleEvent(eventType, eventData) {
        try {
            console.log(`\n📨 ${eventType} Event Received`);
            console.log('─'.repeat(40));
            console.log('Data:', JSON.stringify(eventData, null, 2));

            // Update statistics
            this.eventStats.totalProcessed++;
            this.eventStats.lastProcessed = new Date();

            // Save to database if available
            if (mongoose.connection.readyState === 1) {
                await this.saveEventToDatabase(eventType, eventData);
            }

            // Send webhook notification if configured
            if (WEBHOOK_URL) {
                await this.sendWebhookNotification(eventType, eventData);
            }

            // Log processing
            console.log(`✅ Event processed: ${eventType}`);
            console.log(`📊 Total processed: ${this.eventStats.totalProcessed}`);

        } catch (error) {
            console.error(`❌ Error handling ${eventType} event:`, error.message);
            this.eventStats.errors++;
        }
    }

    async saveEventToDatabase(eventType, eventData) {
        try {
            // Save blockchain event
            const blockchainEventDoc = new BlockchainEvent({
                eventName: eventType,
                orderId: eventData.orderId || 'N/A',
                transactionHash: eventData.transactionHash,
                blockNumber: eventData.blockNumber,
                blockTimestamp: new Date(eventData.timestamp ? eventData.timestamp * 1000 : Date.now()),
                from: eventData.admin || eventData.updatedBy || 'system',
                eventData: eventData
            });

            await blockchainEventDoc.save();
            console.log('💾 Event saved to database');

            // Handle specific event types
            if (eventType === 'OrderCreated') {
                await this.handleOrderCreatedInDB(eventData);
            } else if (eventType === 'OrderStatusUpdated') {
                await this.handleStatusUpdateInDB(eventData);
            } else if (eventType === 'OrderCancelled') {
                await this.handleOrderCancelledInDB(eventData);
            }

        } catch (error) {
            console.error('💾 Database save failed:', error.message);
        }
    }

    async handleOrderCreatedInDB(eventData) {
        try {
            const orderDoc = new Order({
                orderId: eventData.orderId,
                adminAddress: eventData.admin.toLowerCase(),
                createdAt: new Date(eventData.timestamp * 1000),
                status: 'CREATED',
                blockchainHash: eventData.transactionHash,
                metadata: {
                    hash: eventData.metadataHash,
                    blockNumber: eventData.blockNumber
                }
            });

            await orderDoc.save();
            console.log(`📦 Order saved to DB: ${eventData.orderId}`);
        } catch (error) {
            if (!error.message.includes('duplicate key')) {
                console.error('Order save failed:', error.message);
            }
        }
    }

    async handleStatusUpdateInDB(eventData) {
        try {
            // Update order status
            await Order.findOneAndUpdate(
                { orderId: eventData.orderId },
                { 
                    status: eventData.newStatus,
                    lastUpdated: new Date(eventData.timestamp * 1000)
                }
            );

            // Create status log
            const statusLogDoc = new StatusLog({
                orderId: eventData.orderId,
                status: eventData.newStatus,
                timestamp: new Date(eventData.timestamp * 1000),
                blockchainTxHash: eventData.transactionHash,
                updatedBy: eventData.updatedBy.toLowerCase(),
                details: {
                    detailsHash: eventData.detailsHash,
                    blockNumber: eventData.blockNumber
                }
            });

            await statusLogDoc.save();
            console.log(`🔄 Status updated in DB: ${eventData.orderId} → ${eventData.newStatus}`);
        } catch (error) {
            console.error('Status update failed:', error.message);
        }
    }

    async handleOrderCancelledInDB(eventData) {
        try {
            await Order.findOneAndUpdate(
                { orderId: eventData.orderId },
                { 
                    status: 'CANCELLED',
                    isActive: false,
                    lastUpdated: new Date(eventData.timestamp * 1000)
                }
            );

            console.log(`❌ Order cancelled in DB: ${eventData.orderId}`);
        } catch (error) {
            console.error('Order cancellation failed:', error.message);
        }
    }

    async sendWebhookNotification(eventType, eventData) {
        try {
            const payload = {
                event: eventType,
                data: eventData,
                timestamp: new Date().toISOString(),
                source: 'blockchain-listener'
            };

            await axios.post(WEBHOOK_URL, payload, {
                timeout: 5000,
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            console.log('🔔 Webhook notification sent');
        } catch (error) {
            console.error('🔔 Webhook failed:', error.message);
        }
    }

    getStats() {
        return {
            ...this.eventStats,
            isRunning: this.isRunning,
            uptime: this.eventStats.lastProcessed ? 
                Date.now() - this.eventStats.lastProcessed.getTime() : 0
        };
    }

    async stop() {
        console.log('\n🛑 Stopping event listener...');
        this.isRunning = false;
        
        if (this.contract) {
            this.contract.removeAllListeners();
        }
        
        if (mongoose.connection.readyState === 1) {
            await mongoose.disconnect();
        }
        
        console.log('✅ Event listener stopped');
    }
}

// ==================== MAIN EXECUTION ====================

async function startListener() {
    const listener = new EnhancedBlockchainListener();
    
    if (!await listener.initialize()) {
        process.exit(1);
    }

    await listener.setupEventListeners();

    // Status monitoring
    setInterval(() => {
        const stats = listener.getStats();
        console.log('\n📊 LISTENER STATISTICS');
        console.log(`   Events processed: ${stats.totalProcessed}`);
        console.log(`   Errors: ${stats.errors}`);
        console.log(`   Running: ${stats.isRunning}`);
        console.log(`   Last event: ${stats.lastProcessed || 'None'}`);
    }, 30000); // Every 30 seconds

    console.log('\n🎯 EVENT LISTENER RUNNING');
    console.log('Press Ctrl+C to stop...');

    // Graceful shutdown
    process.on('SIGINT', async () => {
        await listener.stop();
        process.exit(0);
    });

    return listener;
}

// Start if main module
if (require.main === module) {
    startListener().catch(console.error);
}

module.exports = EnhancedBlockchainListener;

// ==================== INITIALIZE ====================

async function initializeConnection() {
  try {
    // Kết nối MongoDB với options
    console.log("🔌 Connecting to MongoDB...");
    
    // Disable buffering to avoid timeout issues
    mongoose.set('bufferCommands', false);
    
    await mongoose.connect(MONGODB_URI, {
        serverSelectionTimeoutMS: 3000,
        socketTimeoutMS: 10000,
        connectTimeoutMS: 3000,
        maxPoolSize: 5,
        minPoolSize: 1,
        maxIdleTimeMS: 30000,
        heartbeatFrequencyMS: 10000
    });
    
    // Test connection
    await mongoose.connection.db.admin().ping();
    console.log("✅ MongoDB connected");

    // Kết nối Blockchain
    console.log("🔌 Connecting to Blockchain...");
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const signer = new ethers.Wallet(PRIVATE_KEY, provider);
    
    // Load contract ABI
    const contractArtifact = require('../blockchain/artifacts/contracts/OrderTracking.sol/OrderTracking.json');
    const contract = new ethers.Contract(CONTRACT_ADDRESS, contractArtifact.abi, signer);

    console.log("✅ Blockchain connected");
    console.log(`📍 Contract Address: ${CONTRACT_ADDRESS}`);
    console.log(`📍 Provider: ${RPC_URL}`);

    return { provider, contract, signer };
  } catch (error) {
    console.error("❌ Connection failed:", error.message);
    process.exit(1);
  }
}

// ==================== EVENT LISTENERS ====================

async function listenToOrderCreated(contract, provider) {
  contract.on("OrderCreated", async (orderId, admin, timestamp, metadataHash, event) => {
    console.log(`\n📝 OrderCreated Event: ${orderId}`);
    console.log(`   Admin: ${admin}`);
    console.log(`   Tx: ${event.transactionHash}`);

    try {
      // Lưu event vào MongoDB
      const blockchainEvent = new BlockchainEvent({
        eventName: "OrderCreated",
        orderId,
        transactionHash: event.transactionHash,
        blockNumber: event.blockNumber,
        blockTimestamp: new Date(timestamp.toNumber() * 1000),
        from: admin,
        eventData: {
          metadataHash,
          admin
        }
      });

      await blockchainEvent.save();
      console.log("✅ Event saved to MongoDB");

      // Cập nhật Order collection
      await Order.findOneAndUpdate(
        { orderId },
        {
          orderId,
          adminAddress: admin,
          createdAt: new Date(timestamp.toNumber() * 1000),
          status: "CREATED",
          blockchainHash: metadataHash,
          updatedAt: new Date()
        },
        { upsert: true, new: true }
      );

      console.log("✅ Order updated in MongoDB");

      // Ghi nhận audit log
      const auditLog = new AuditLog({
        action: "ORDER_CREATED",
        actor: admin.toLowerCase(),
        orderId,
        details: { blockNumber: event.blockNumber, txHash: event.transactionHash },
        timestamp: new Date(timestamp.toNumber() * 1000)
      });

      await auditLog.save();
      console.log("✅ Audit log created");

    } catch (error) {
      console.error("❌ Error processing OrderCreated event:", error.message);
    }
  });
}

async function listenToOrderStatusUpdated(contract, provider) {
  contract.on("OrderStatusUpdated", async (orderId, newStatus, timestamp, detailsHash, updatedBy, event) => {
    console.log(`\n📝 OrderStatusUpdated Event: ${orderId}`);
    console.log(`   New Status: ${newStatus}`);
    console.log(`   Updated By: ${updatedBy}`);
    console.log(`   Tx: ${event.transactionHash}`);

    try {
      // Lưu event vào blockchain_events collection
      const blockchainEvent = new BlockchainEvent({
        eventName: "OrderStatusUpdated",
        orderId,
        transactionHash: event.transactionHash,
        blockNumber: event.blockNumber,
        blockTimestamp: new Date(timestamp.toNumber() * 1000),
        from: updatedBy,
        eventData: {
          newStatus,
          detailsHash,
          updatedBy
        }
      });

      await blockchainEvent.save();
      console.log("✅ Event saved to MongoDB");

      // Tạo status log
      const statusLog = new StatusLog({
        orderId,
        status: newStatus,
        timestamp: new Date(timestamp.toNumber() * 1000),
        blockchainTxHash: event.transactionHash,
        updatedBy: updatedBy.toLowerCase()
      });

      await statusLog.save();
      console.log("✅ Status log created");

      // Cập nhật Order
      const updatedOrder = await Order.findOneAndUpdate(
        { orderId },
        {
          status: newStatus,
          blockchainHash: detailsHash,
          updatedAt: new Date(timestamp.toNumber() * 1000)
        },
        { new: true }
      );

      console.log("✅ Order updated");

      // Audit log
      const auditLog = new AuditLog({
        action: "ORDER_STATUS_UPDATED",
        actor: updatedBy.toLowerCase(),
        orderId,
        details: {
          newStatus,
          blockNumber: event.blockNumber,
          txHash: event.transactionHash
        },
        timestamp: new Date(timestamp.toNumber() * 1000)
      });

      await auditLog.save();
      console.log("✅ Audit log created");

    } catch (error) {
      console.error("❌ Error processing OrderStatusUpdated event:", error.message);
    }
  });
}

async function listenToOrderCancelled(contract, provider) {
  contract.on("OrderCancelled", async (orderId, timestamp, event) => {
    console.log(`\n📝 OrderCancelled Event: ${orderId}`);
    console.log(`   Tx: ${event.transactionHash}`);

    try {
      // Lưu event
      const blockchainEvent = new BlockchainEvent({
        eventName: "OrderCancelled",
        orderId,
        transactionHash: event.transactionHash,
        blockNumber: event.blockNumber,
        blockTimestamp: new Date(timestamp.toNumber() * 1000),
        eventData: {
          cancelled: true
        }
      });

      await blockchainEvent.save();
      console.log("✅ Event saved to MongoDB");

      // Cập nhật Order
      await Order.findOneAndUpdate(
        { orderId },
        {
          status: "CANCELLED",
          updatedAt: new Date(timestamp.toNumber() * 1000)
        }
      );

      console.log("✅ Order cancelled in MongoDB");

      // Tạo status log
      const statusLog = new StatusLog({
        orderId,
        status: "CANCELLED",
        timestamp: new Date(timestamp.toNumber() * 1000),
        blockchainTxHash: event.transactionHash
      });

      await statusLog.save();
      console.log("✅ Status log created");

    } catch (error) {
      console.error("❌ Error processing OrderCancelled event:", error.message);
    }
  });
}

// ==================== SYNC HISTORICAL DATA ====================

async function syncHistoricalEvents(contract, provider) {
  try {
    console.log("\n📚 Syncing historical events...");

    // Lấy deployment block (hoặc khởi đầu từ block nào đó)
    const startBlock = process.env.START_BLOCK || 0;
    const currentBlock = await provider.getBlockNumber();

    console.log(`Syncing blocks ${startBlock} to ${currentBlock}`);

    // Query các sự kiện cũ
    const filters = [
      contract.filters.OrderCreated(),
      contract.filters.OrderStatusUpdated(),
      contract.filters.OrderCancelled()
    ];

    for (const filter of filters) {
      try {
        const events = await contract.queryFilter(filter, startBlock, currentBlock);
        console.log(`Found ${events.length} events with filter`);

        for (const event of events) {
          try {
            // Kiểm tra xem đã tồn tại chưa với timeout
            const existingEvent = await Promise.race([
              BlockchainEvent.findOne({
                transactionHash: event.transactionHash
              }),
              new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Timeout')), 3000)
              )
            ]);

            if (!existingEvent) {
              // Xử lý event
              const blockchainEvent = new BlockchainEvent({
                eventName: event.event,
                orderId: event.args.orderId || event.args[0],
                transactionHash: event.transactionHash,
                blockNumber: event.blockNumber,
                blockTimestamp: new Date((await provider.getBlock(event.blockNumber)).timestamp * 1000),
                from: event.args.admin || event.args.updatedBy || event.address,
                eventData: event.args
              });

              await blockchainEvent.save();
              console.log(`✅ Synced ${event.event} for order ${event.args.orderId || event.args[0]}`);
            }
          } catch (error) {
            if (error.message === 'Timeout') {
              console.log(`⚠️ Skipping event due to timeout: ${event.transactionHash}`);
              continue;
            }
            console.error(`Error processing event: ${error.message}`);
          }
        }
      } catch (error) {
        console.error(`Error syncing events: ${error.message}`);
      }
    }

    console.log("✅ Historical sync completed");
  } catch (error) {
    console.error("❌ Historical sync failed:", error.message);
  }
}

// ==================== MAIN ====================

async function main() {
  console.log("🚀 Starting Blockchain Event Listener...\n");

  const { provider, contract, signer } = await initializeConnection();

  // Sync lịch sử
  await syncHistoricalEvents(contract, provider);

  // Lắng nghe events mới
  console.log("\n👂 Listening for events...");
  await listenToOrderCreated(contract, provider);
  await listenToOrderStatusUpdated(contract, provider);
  await listenToOrderCancelled(contract, provider);

  console.log("✅ Event listeners active\n");

  // Keep running
  process.on("SIGINT", async () => {
    console.log("\n🛑 Shutting down...");
    await mongoose.disconnect();
    process.exit(0);
  });
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
