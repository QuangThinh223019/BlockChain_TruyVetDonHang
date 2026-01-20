/**
 * DATABASE SYNC SERVICE
 * Đồng bộ dữ liệu giữa blockchain và database
 */

const { ethers } = require('ethers');
const mongoose = require('mongoose');
require('dotenv').config();

const { Order, StatusLog, BlockchainEvent } = require('./database/schemas/models');

class DatabaseSyncService {
    constructor() {
        this.provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL);
        this.signer = new ethers.Wallet(process.env.PRIVATE_KEY, this.provider);
        this.contractAddress = process.env.CONTRACT_ADDRESS;
        this.contract = null;
        this.isConnected = false;
    }

    async initialize() {
        console.log('🔄 INITIALIZING DATABASE SYNC SERVICE');
        console.log('=' .repeat(50));

        try {
            // Connect to MongoDB với improved settings
            console.log('📊 Connecting to MongoDB...');
            
            await mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/order-tracking", {
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
            console.log('✅ MongoDB connected and tested');

            // Load smart contract
            console.log('⛓️  Loading smart contract...');
            const contractArtifact = require('./blockchain/artifacts/contracts/OrderTracking.sol/OrderTracking.json');
            this.contract = new ethers.Contract(
                this.contractAddress,
                contractArtifact.abi,
                this.signer
            );
            console.log('✅ Smart contract loaded');

            this.isConnected = true;
            return true;
        } catch (error) {
            console.error('❌ Initialization failed:', error.message);
            return false;
        }
    }

    async syncSingleOrder(orderId) {
        console.log(`\n🔄 SYNCING ORDER: ${orderId}`);
        console.log('-'.repeat(40));

        try {
            // Get order from blockchain
            const blockchainOrder = await this.contract.getOrder(orderId);
            console.log(`⛓️  Found order on blockchain: ${blockchainOrder.orderId}`);

            // Check if exists in database
            let dbOrder = await Order.findOne({ orderId });
            
            if (!dbOrder) {
                // Create new order in database
                dbOrder = new Order({
                    orderId: blockchainOrder.orderId,
                    adminAddress: blockchainOrder.adminAddress.toLowerCase(),
                    createdAt: new Date(Number(blockchainOrder.createdAt) * 1000),
                    status: blockchainOrder.currentStatus,
                    blockchainHash: 'manual_sync',
                    metadata: {
                        hash: blockchainOrder.metadataHash,
                        syncedAt: new Date()
                    },
                    lastUpdated: new Date(Number(blockchainOrder.lastUpdated) * 1000),
                    isActive: blockchainOrder.isActive
                });

                await dbOrder.save();
                console.log(`✅ Order created in database`);
            } else {
                // Update existing order
                await Order.findOneAndUpdate(
                    { orderId },
                    {
                        status: blockchainOrder.currentStatus,
                        lastUpdated: new Date(Number(blockchainOrder.lastUpdated) * 1000),
                        isActive: blockchainOrder.isActive,
                        'metadata.lastSyncedAt': new Date()
                    }
                );
                console.log(`✅ Order updated in database`);
            }

            return {
                orderId,
                status: blockchainOrder.currentStatus,
                synced: true
            };

        } catch (error) {
            console.error(`❌ Sync failed for ${orderId}:`, error.message);
            return {
                orderId,
                error: error.message,
                synced: false
            };
        }
    }

    async syncAllOrdersByEvents() {
        console.log('\n📡 SYNCING ALL ORDERS VIA EVENTS');
        console.log('=' .repeat(50));

        try {
            const currentBlock = await this.provider.getBlockNumber();
            const startBlock = Math.max(0, currentBlock - 50000); // Last 50k blocks

            console.log(`🧱 Scanning blocks ${startBlock} to ${currentBlock}`);

            // Get OrderCreated events
            const orderCreatedFilter = this.contract.filters.OrderCreated();
            const createdEvents = await this.contract.queryFilter(orderCreatedFilter, startBlock, currentBlock);
            
            console.log(`📦 Found ${createdEvents.length} OrderCreated events`);

            const syncResults = [];

            for (const event of createdEvents) {
                try {
                    const parsedLog = this.contract.interface.parseLog(event);
                    const orderId = parsedLog.args.orderId.toString();
                    
                    const result = await this.syncSingleOrder(orderId);
                    syncResults.push(result);

                    // Add small delay to avoid overwhelming the system
                    await new Promise(resolve => setTimeout(resolve, 100));
                } catch (error) {
                    console.error('Error processing event:', error.message);
                }
            }

            console.log(`\n📊 SYNC RESULTS:`);
            console.log(`   Total orders processed: ${syncResults.length}`);
            console.log(`   Successful: ${syncResults.filter(r => r.synced).length}`);
            console.log(`   Failed: ${syncResults.filter(r => !r.synced).length}`);

            return syncResults;

        } catch (error) {
            console.error('❌ Bulk sync failed:', error.message);
            return [];
        }
    }

    async syncRecentEvents(hoursBack = 24) {
        console.log(`\n⏰ SYNCING RECENT EVENTS (${hoursBack} hours)`);
        console.log('=' .repeat(50));

        try {
            const currentBlock = await this.provider.getBlockNumber();
            const blocksBack = Math.floor(hoursBack * 3600 / 12); // ~12 seconds per block
            const startBlock = Math.max(0, currentBlock - blocksBack);

            console.log(`🧱 Scanning recent blocks ${startBlock} to ${currentBlock}`);

            // Sync OrderCreated events
            const orderFilter = this.contract.filters.OrderCreated();
            const orderEvents = await this.contract.queryFilter(orderFilter, startBlock, currentBlock);

            console.log(`📦 Found ${orderEvents.length} recent order events`);

            for (const event of orderEvents) {
                await this.processOrderCreatedEvent(event);
            }

            // Sync StatusUpdated events
            const statusFilter = this.contract.filters.OrderStatusUpdated();
            const statusEvents = await this.contract.queryFilter(statusFilter, startBlock, currentBlock);

            console.log(`🔄 Found ${statusEvents.length} recent status events`);

            for (const event of statusEvents) {
                await this.processStatusUpdatedEvent(event);
            }

            console.log(`✅ Recent events sync completed`);

        } catch (error) {
            console.error('❌ Recent events sync failed:', error.message);
        }
    }

    async processOrderCreatedEvent(event) {
        try {
            const block = await this.provider.getBlock(event.blockNumber);
            const parsedLog = this.contract.interface.parseLog(event);
            const { orderId, admin, timestamp, metadataHash } = parsedLog.args;

            // Save blockchain event
            const blockchainEventDoc = new BlockchainEvent({
                eventName: 'OrderCreated',
                orderId: orderId.toString(),
                transactionHash: event.transactionHash,
                blockNumber: event.blockNumber,
                blockTimestamp: new Date(block.timestamp * 1000),
                from: admin.toString().toLowerCase(),
                eventData: {
                    orderId: orderId.toString(),
                    admin: admin.toString(),
                    timestamp: Number(timestamp),
                    metadataHash
                }
            });

            await blockchainEventDoc.save();

            // Create/update order
            await Order.findOneAndUpdate(
                { orderId: orderId.toString() },
                {
                    orderId: orderId.toString(),
                    adminAddress: admin.toString().toLowerCase(),
                    createdAt: new Date(Number(timestamp) * 1000),
                    status: 'CREATED',
                    blockchainHash: event.transactionHash,
                    metadata: {
                        hash: metadataHash,
                        blockNumber: event.blockNumber
                    }
                },
                { upsert: true, new: true }
            );

            console.log(`📦 Processed OrderCreated: ${orderId.toString()}`);

        } catch (error) {
            console.error('Error processing OrderCreated:', error.message);
        }
    }

    async processStatusUpdatedEvent(event) {
        try {
            const block = await this.provider.getBlock(event.blockNumber);
            const parsedLog = this.contract.interface.parseLog(event);
            const { orderId, newStatus, timestamp, detailsHash, updatedBy } = parsedLog.args;

            // Update order status
            await Order.findOneAndUpdate(
                { orderId: orderId.toString() },
                { 
                    status: newStatus,
                    lastUpdated: new Date(Number(timestamp) * 1000)
                }
            );

            // Create status log
            const statusLogDoc = new StatusLog({
                orderId: orderId.toString(),
                status: newStatus,
                timestamp: new Date(Number(timestamp) * 1000),
                blockchainTxHash: event.transactionHash,
                updatedBy: updatedBy.toString().toLowerCase(),
                details: {
                    detailsHash,
                    blockNumber: event.blockNumber
                }
            });

            await statusLogDoc.save();

            console.log(`🔄 Processed StatusUpdate: ${orderId.toString()} → ${newStatus}`);

        } catch (error) {
            console.error('Error processing StatusUpdated:', error.message);
        }
    }

    async getDatabaseStats() {
        console.log('\n📊 DATABASE STATISTICS');
        console.log('=' .repeat(50));

        try {
            const orderCount = await Order.countDocuments();
            const statusLogCount = await StatusLog.countDocuments();
            const eventCount = await BlockchainEvent.countDocuments();

            const stats = {
                orders: orderCount,
                statusLogs: statusLogCount,
                blockchainEvents: eventCount
            };

            console.log(`📦 Orders: ${stats.orders}`);
            console.log(`🔄 Status Logs: ${stats.statusLogs}`);
            console.log(`📡 Blockchain Events: ${stats.blockchainEvents}`);

            // Show recent activity
            const recentOrders = await Order.find({})
                .sort({ createdAt: -1 })
                .limit(3)
                .select('orderId status createdAt');

            if (recentOrders.length > 0) {
                console.log('\n📦 RECENT ORDERS:');
                recentOrders.forEach(order => {
                    console.log(`   ${order.orderId} | ${order.status} | ${order.createdAt.toISOString()}`);
                });
            }

            return stats;

        } catch (error) {
            console.error('❌ Stats failed:', error.message);
            return null;
        }
    }

    async validateDataConsistency() {
        console.log('\n🔍 VALIDATING DATA CONSISTENCY');
        console.log('=' .repeat(50));

        try {
            const issues = [];

            // Check for orders without status logs
            const ordersWithoutLogs = await Order.aggregate([
                {
                    $lookup: {
                        from: 'statuslogs',
                        localField: 'orderId',
                        foreignField: 'orderId',
                        as: 'logs'
                    }
                },
                {
                    $match: { logs: { $size: 0 } }
                }
            ]);

            if (ordersWithoutLogs.length > 0) {
                issues.push(`${ordersWithoutLogs.length} orders without status logs`);
            }

            // Check for duplicate orders
            const duplicateOrders = await Order.aggregate([
                {
                    $group: {
                        _id: '$orderId',
                        count: { $sum: 1 }
                    }
                },
                {
                    $match: { count: { $gt: 1 } }
                }
            ]);

            if (duplicateOrders.length > 0) {
                issues.push(`${duplicateOrders.length} duplicate order IDs`);
            }

            if (issues.length === 0) {
                console.log('✅ Data consistency check passed');
            } else {
                console.log('⚠️ Data consistency issues found:');
                issues.forEach(issue => console.log(`   - ${issue}`));
            }

            return issues;

        } catch (error) {
            console.error('❌ Consistency check failed:', error.message);
            return ['Consistency check failed'];
        }
    }
}

// ==================== CLI INTERFACE ====================

async function runSync() {
    const syncService = new DatabaseSyncService();
    
    if (!await syncService.initialize()) {
        process.exit(1);
    }

    const action = process.argv[2] || 'full';

    switch (action) {
        case 'full':
            console.log('🔄 Running full sync...');
            await syncService.syncAllOrdersByEvents();
            break;
            
        case 'recent':
            const hours = parseInt(process.argv[3]) || 24;
            await syncService.syncRecentEvents(hours);
            break;
            
        case 'order':
            const orderId = process.argv[3];
            if (!orderId) {
                console.error('❌ Please provide order ID: node database-sync.js order ORDER_ID');
                process.exit(1);
            }
            await syncService.syncSingleOrder(orderId);
            break;
            
        case 'stats':
            await syncService.getDatabaseStats();
            break;
            
        case 'validate':
            await syncService.validateDataConsistency();
            break;
            
        default:
            console.log('📋 Usage:');
            console.log('   node database-sync.js full     - Sync all orders');
            console.log('   node database-sync.js recent [hours] - Sync recent events');
            console.log('   node database-sync.js order <id> - Sync specific order');
            console.log('   node database-sync.js stats    - Show database stats');
            console.log('   node database-sync.js validate - Validate data consistency');
            break;
    }

    // Show final stats
    await syncService.getDatabaseStats();
    await syncService.validateDataConsistency();

    await mongoose.disconnect();
    console.log('\n✅ Database sync completed');
}

// Run if main module
if (require.main === module) {
    runSync().catch(console.error);
}

module.exports = DatabaseSyncService;