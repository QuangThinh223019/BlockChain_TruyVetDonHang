/**
 * REST API ENDPOINTS FOR BLOCKCHAIN ORDER TRACKING
 * API server để tương tác với blockchain order tracking system
 */

const express = require('express');
const cors = require('cors');
const { ethers } = require('ethers');
const mongoose = require('mongoose');
require('dotenv').config();

// Import optimization modules
const config = require('./config');
const CacheService = require('./cache-service');
const { createOrderValidation, updateStatusValidation, getOrderValidation, listOrdersValidation, handleValidationErrors, sanitizeInput } = require('./validation');
const logger = require('./logger');

const { Order } = require('./database/schemas/models');
const { initializeEmailService, notifyOrderCreated, notifyOrderStatusUpdated, notifyOrderDelivered } = require('./email-service');

const app = express();

// Initialize caching service
const cache = new CacheService({
  maxKeys: config.cacheConfig.limits.maxKeys,
  maxMemoryMB: config.cacheConfig.limits.maxMemoryMB
});

// Middleware - Order matters!
app.use(sanitizeInput); // Sanitize input first
app.use(cors(config.apiConfig.cors)); // CORS
app.use(express.json());

// Blockchain setup
const provider = new ethers.JsonRpcProvider(config.blockchainConfig.rpcUrl);
const signer = new ethers.Wallet(config.blockchainConfig.privateKey, provider);
const contractAddress = config.blockchainConfig.contractAddress;

let contract;
let mongoConnected = false;

// Initialize contract and database
async function initializeContract() {
    try {
        const contractArtifact = require('./blockchain/artifacts/contracts/OrderTracking.sol/OrderTracking.json');
        contract = new ethers.Contract(contractAddress, contractArtifact.abi, signer);
        logger.info('Smart contract initialized', { contractAddress });
        
        // Initialize email service
        initializeEmailService();
        
        // Connect to MongoDB with retry logic
        const maxRetries = config.databaseConfig.retry.maxAttempts;
        let retryCount = 0;
        let connected = false;

        while (retryCount < maxRetries && !connected) {
            try {
                await mongoose.connect(config.databaseConfig.uri, config.databaseConfig.options);
                mongoConnected = true;
                connected = true;
                logger.info('MongoDB connected successfully');
            } catch (dbError) {
                retryCount++;
                if (retryCount < maxRetries) {
                    const delayMs = config.databaseConfig.retry.delayMs * Math.pow(config.databaseConfig.retry.backoffMultiplier, retryCount - 1);
                    logger.warn(`MongoDB connection attempt ${retryCount} failed, retrying in ${delayMs}ms`, { error: dbError.message });
                    await new Promise(resolve => setTimeout(resolve, delayMs));
                } else {
                    logger.warn('MongoDB connection failed after retries, running without database', { error: dbError.message });
                }
            }
        }
        
        return true;
    } catch (error) {
        logger.error('Contract initialization failed', { error: error.message });
        return false;
    }
}

// ==================== API ENDPOINTS ====================

// Health check with caching
app.get('/api/health', async (req, res) => {
    try {
        // Check cache first
        const cached = cache.get('health');
        if (cached) {
            logger.debug('Health check from cache');
            return res.json(cached);
        }

        const blockNumber = await provider.getBlockNumber();
        const balance = await provider.getBalance(signer.address);
        const totalOrders = await contract.totalOrders();

        const healthData = {
            status: 'healthy',
            blockchain: {
                network: config.blockchainConfig.chainName,
                blockNumber,
                contractAddress,
                adminBalance: ethers.formatEther(balance),
                totalOrders: totalOrders.toString()
            },
            timestamp: new Date().toISOString()
        };

        // Cache for 5 seconds
        cache.set('health', healthData, config.cacheConfig.ttl.blockNumber);
        
        logger.http('Health check', { status: 'healthy' });
        res.json(healthData);
    } catch (error) {
        logger.error('Health check failed', { error: error.message });
        res.status(500).json({
            status: 'error',
            message: config.errorMessages.SERVER_ERROR
        });
    }
});

// Get system statistics with caching
app.get('/api/stats', async (req, res) => {
    try {
        // Check cache first
        const cached = cache.get('stats');
        if (cached) {
            logger.debug('Stats from cache');
            return res.json(cached);
        }

        const totalOrders = await contract.totalOrders();
        const network = await provider.getNetwork();
        const blockNumber = await provider.getBlockNumber();
        const balance = await provider.getBalance(signer.address);

        const statsData = {
            totalOrders: totalOrders.toString(),
            network: {
                name: network.name,
                chainId: network.chainId.toString()
            },
            blockchain: {
                latestBlock: blockNumber,
                contractAddress,
                adminAddress: signer.address,
                adminBalance: ethers.formatEther(balance)
            },
            timestamp: new Date().toISOString()
        };

        // Cache for 1 minute
        cache.set('stats', statsData, config.cacheConfig.ttl.systemStats);
        
        logger.http('Statistics retrieved');
        res.json(statsData);
    } catch (error) {
        logger.error('Failed to get statistics', { error: error.message });
        res.status(500).json({
            success: false,
            error: config.errorMessages.SERVER_ERROR
        });
    }
});

// Create new order
app.post('/api/orders', createOrderValidation, handleValidationErrors, async (req, res) => {
    try {
        const { orderId, productInfo } = req.body;

        if (!orderId || !productInfo) {
            return res.status(400).json({
                success: false,
                error: config.errorMessages.INVALID_INPUT
            });
        }

        // Create metadata hash
        const metadata = {
            ...productInfo,
            timestamp: Date.now(),
            creator: signer.address
        };
        
        const metadataString = JSON.stringify(metadata);
        const metadataHash = ethers.keccak256(ethers.toUtf8Bytes(metadataString));

        // Estimate gas
        const gasEstimate = await contract.createOrder.estimateGas(orderId, metadataHash);
        
        // Send transaction
        const tx = await contract.createOrder(orderId, metadataHash, {
            gasLimit: gasEstimate * BigInt(config.blockchainConfig.gas.multiplier * 100) / BigInt(100)
        });

        logger.info('Order creation transaction sent', { orderId, txHash: tx.hash });

        // Wait for confirmation
        const receipt = await tx.wait();

        // Save order to MongoDB
        if (mongoConnected) {
            try {
                const newOrder = new Order({
                    orderId,
                    adminAddress: signer.address,
                    status: 'CREATED',
                    metadata: {
                        productName: productInfo?.productName,
                        productDescription: productInfo?.productDescription,
                        quantity: productInfo?.quantity,
                        price: productInfo?.price,
                        totalAmount: productInfo?.totalAmount,
                        sku: productInfo?.sku,
                        category: productInfo?.category
                    },
                    recipient: productInfo?.recipient,
                    sender: productInfo?.sender,
                    blockchainHash: tx.hash,
                    metadataHash
                });
                
                await newOrder.save();
                logger.info('Order saved to MongoDB', { orderId });
            } catch (dbError) {
                logger.warn('Failed to save order to MongoDB', { orderId, error: dbError.message });
                // Don't fail the entire request if DB save fails
            }
        }

        // Invalidate cache
        cache.delete('stats');

        logger.info('Order created successfully', { orderId, blockNumber: receipt.blockNumber });
        res.json({
            success: true,
            orderId,
            transactionHash: tx.hash,
            blockNumber: receipt.blockNumber,
            gasUsed: receipt.gasUsed.toString(),
            metadata,
            metadataHash
        });

    } catch (error) {
        logger.error('Failed to create order', { error: error.message });
        res.status(500).json({
            success: false,
            error: config.errorMessages.TRANSACTION_FAILED
        });
    }
});

// Get order by ID with caching
app.get('/api/orders/:orderId', getOrderValidation, handleValidationErrors, async (req, res) => {
    try {
        const { orderId } = req.params;
        
        // Check cache first
        const cacheKey = `order:${orderId}`;
        const cached = cache.get(cacheKey);
        if (cached) {
            logger.debug('Order retrieved from cache', { orderId });
            return res.json(cached);
        }
        
        const order = await contract.getOrder(orderId);
        
        const orderData = {
            orderId: order.orderId,
            adminAddress: order.adminAddress,
            createdAt: new Date(Number(order.createdAt) * 1000).toISOString(),
            currentStatus: order.currentStatus,
            metadataHash: order.metadataHash,
            lastUpdated: new Date(Number(order.lastUpdated) * 1000).toISOString(),
            isActive: order.isActive
        };

        // Cache for 1 minute
        cache.set(cacheKey, orderData, config.cacheConfig.ttl.orderData);
        
        logger.http('Order retrieved', { orderId });
        res.json(orderData);

    } catch (error) {
        if (error.message.includes('Order does not exist')) {
            logger.warn('Order not found', { orderId: req.params.orderId });
            return res.status(404).json({
                success: false,
                error: config.errorMessages.NOT_FOUND,
                orderId: req.params.orderId
            });
        }
        
        logger.error('Failed to get order', { error: error.message, orderId: req.params.orderId });
        res.status(500).json({
            success: false,
            error: config.errorMessages.SERVER_ERROR
        });
    }
});

// Get order metadata from MongoDB
app.get('/api/orders/:orderId/metadata', async (req, res) => {
    try {
        const { orderId } = req.params;
        
        if (!mongoConnected) {
            return res.status(503).json({
                success: false,
                error: 'Database not available'
            });
        }
        
        // Find order in MongoDB
        const orderDoc = await Order.findOne({ orderId });
        
        if (!orderDoc) {
            logger.warn('Order metadata not found', { orderId });
            return res.status(404).json({
                success: false,
                error: config.errorMessages.NOT_FOUND,
                orderId
            });
        }
        
        logger.http('Order metadata retrieved', { orderId });
        res.json({
            orderId: orderDoc.orderId,
            metadata: orderDoc.metadata,
            recipient: orderDoc.recipient,
            sender: orderDoc.sender,
            productName: orderDoc.metadata?.productName,
            productDescription: orderDoc.metadata?.productDescription,
            quantity: orderDoc.metadata?.quantity,
            price: orderDoc.metadata?.price,
            recipientName: orderDoc.recipient?.name,
            recipientPhone: orderDoc.recipient?.phone,
            recipientAddress: orderDoc.recipient?.address
        });

    } catch (error) {
        logger.error('Failed to get order metadata', { error: error.message, orderId: req.params.orderId });
        res.status(500).json({
            success: false,
            error: config.errorMessages.SERVER_ERROR
        });
    }
});

// Save order metadata to MongoDB
app.post('/api/orders/:orderId/metadata', async (req, res) => {
    try {
        const { orderId } = req.params;
        const { metadata, recipient, sender, txHash } = req.body;
        
        logger.info('POST /api/orders/:orderId/metadata', { orderId, metadata, recipient });
        
        if (!mongoConnected) {
            logger.warn('MongoDB not connected');
            return res.status(503).json({
                success: false,
                error: 'Database not available'
            });
        }
        
        // Create or update order in MongoDB
        const orderDoc = await Order.findOneAndUpdate(
            { orderId },
            {
                orderId,
                adminAddress: sender?.address || sender,
                metadata: {
                    productName: metadata?.productName,
                    productDescription: metadata?.productDescription,
                    quantity: metadata?.quantity,
                    price: metadata?.price,
                    totalAmount: metadata?.totalAmount || (metadata?.quantity * metadata?.price),
                    sku: metadata?.sku,
                    category: metadata?.category
                },
                recipient: {
                    name: recipient?.name || metadata?.recipientName,
                    phone: recipient?.phone || metadata?.recipientPhone,
                    address: recipient?.address || metadata?.recipientAddress,
                    email: recipient?.email || metadata?.recipientEmail
                },
                sender: {
                    name: sender?.name,
                    address: sender?.address || sender,
                    phone: sender?.phone,
                    email: sender?.email
                },
                blockchainHash: txHash,
                status: 'CREATED'
            },
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );
        
        logger.info('Order saved to MongoDB', { orderId });
        
        // Invalidate cache
        cache.delete(`order:${orderId}`);
        cache.delete('stats');
        
        // Send email notification if recipient email is provided
        if (recipient?.email || metadata?.recipientEmail) {
            const recipientEmail = recipient?.email || metadata?.recipientEmail;
            const emailData = {
                orderId,
                productName: metadata?.productName,
                quantity: metadata?.quantity,
                price: metadata?.price,
                recipientName: recipient?.name || metadata?.recipientName,
                recipientPhone: recipient?.phone || metadata?.recipientPhone,
                recipientAddress: recipient?.address || metadata?.recipientAddress,
                metadataHash: txHash,
                createdAt: new Date().toISOString()
            };
            
            logger.info('Sending order creation email', { recipientEmail });
            // Send email asynchronously (don't wait for it)
            notifyOrderCreated(recipientEmail, emailData).then(() => {
                logger.info('Order creation email sent', { recipientEmail });
            }).catch(err => {
                logger.error('Failed to send order creation email', { error: err.message, recipientEmail });
            });
        }
        
        res.json({
            success: true,
            orderId,
            message: config.successMessages.DATA_SAVED,
            data: orderDoc
        });

    } catch (error) {
        logger.error('Error in POST metadata', { error: error.message, orderId: req.params.orderId });
        res.status(500).json({
            success: false,
            error: config.errorMessages.SERVER_ERROR
        });
    }
});

// Update order status - Only for email notification
app.put('/api/orders/:orderId/status', updateStatusValidation, handleValidationErrors, async (req, res) => {
    try {
        const { orderId } = req.params;
        const { status, details } = req.body;

        const validStatuses = ['PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'CREATED', 'CONFIRMED'];
        if (!validStatuses.includes(status)) {
            logger.warn('Invalid status provided', { status, orderId });
            return res.status(400).json({
                success: false,
                error: 'Invalid status',
                validStatuses
            });
        }

        // Send email notification if MongoDB is connected
        if (mongoConnected) {
            try {
                logger.info('Searching for order in database', { orderId });
                const orderDoc = await Order.findOne({ orderId });
                
                if (orderDoc) {
                    logger.info('Order found in MongoDB', { orderId });
                    
                    if (orderDoc.recipient?.email) {
                        logger.info('Sending status update email', { email: orderDoc.recipient.email, status });
                        
                        // Map status string to number for email template
                        const statusMap = {
                            'CREATED': '0',
                            'PROCESSING': '1',
                            'CONFIRMED': '1',
                            'SHIPPED': '2',
                            'DELIVERED': '3',
                            'CANCELLED': '4'
                        };
                        
                        const emailData = {
                            orderId,
                            status: statusMap[status] || '0',
                            productName: orderDoc.metadata?.productName,
                            quantity: orderDoc.metadata?.quantity,
                            price: orderDoc.metadata?.price,
                            recipientName: orderDoc.recipient?.name,
                            updatedAt: new Date().toISOString(),
                            notes: details
                        };
                        
                        // Send email asynchronously
                        if (status === 'DELIVERED') {
                            emailData.deliveredAt = new Date().toISOString();
                            notifyOrderDelivered(orderDoc.recipient.email, emailData).then(() => {
                                logger.info('Delivery notification sent', { orderId });
                            }).catch(err => {
                                logger.error('Failed to send delivery notification', { error: err.message, orderId });
                            });
                        } else {
                            notifyOrderStatusUpdated(orderDoc.recipient.email, emailData).then(() => {
                                logger.info('Status update email sent', { orderId, status });
                            }).catch(err => {
                                logger.error('Failed to send status update email', { error: err.message, orderId });
                            });
                        }

                        // Invalidate cache
                        cache.delete(`order:${orderId}`);
                        cache.delete('stats');
                    } else {
                        logger.warn('No recipient email found for order', { orderId });
                    }
                } else {
                    logger.warn('Order not found in MongoDB', { orderId });
                }
            } catch (emailError) {
                logger.error('Error sending status update email', { error: emailError.message, orderId });
            }
        } else {
            logger.warn('MongoDB not connected, email not sent', { orderId });
        }

        res.json({
            success: true,
            orderId,
            newStatus: status,
            details,
            message: config.successMessages.ORDER_UPDATED
        });

    } catch (error) {
        logger.error('Failed to process status update', { error: error.message, orderId: req.params.orderId });
        res.status(500).json({
            success: false,
            error: config.errorMessages.SERVER_ERROR
        });
    }
});

// Cancel order
app.delete('/api/orders/:orderId', async (req, res) => {
    try {
        const { orderId } = req.params;
        
        // Estimate gas
        const gasEstimate = await contract.cancelOrder.estimateGas(orderId);
        
        // Send transaction
        const tx = await contract.cancelOrder(orderId, {
            gasLimit: gasEstimate * BigInt(config.blockchainConfig.gas.multiplier * 100) / BigInt(100)
        });

        logger.info('Order cancellation transaction sent', { orderId, txHash: tx.hash });

        // Wait for confirmation
        const receipt = await tx.wait();

        // Invalidate cache
        cache.delete(`order:${orderId}`);
        cache.delete('stats');

        logger.info('Order cancelled successfully', { orderId });
        res.json({
            success: true,
            orderId,
            status: 'CANCELLED',
            transactionHash: tx.hash,
            blockNumber: receipt.blockNumber,
            gasUsed: receipt.gasUsed.toString()
        });

    } catch (error) {
        logger.error('Failed to cancel order', { error: error.message, orderId: req.params.orderId });
        res.status(500).json({
            success: false,
            error: config.errorMessages.TRANSACTION_FAILED
        });
    }
});

// Get contract events
app.get('/api/events', async (req, res) => {
    try {
        const { fromBlock, toBlock, orderId } = req.query;
        
        const currentBlock = await provider.getBlockNumber();
        const startBlock = fromBlock ? parseInt(fromBlock) : Math.max(0, currentBlock - 1000);
        const endBlock = toBlock ? parseInt(toBlock) : currentBlock;

        let events = [];

        logger.info('Fetching contract events', { startBlock, endBlock });

        // Get OrderCreated events
        const orderCreatedFilter = contract.filters.OrderCreated();
        const createdEvents = await contract.queryFilter(orderCreatedFilter, startBlock, endBlock);
        
        for (const event of createdEvents) {
            const block = await provider.getBlock(event.blockNumber);
            const parsedLog = contract.interface.parseLog(event);
            
            events.push({
                eventType: 'OrderCreated',
                orderId: parsedLog.args.orderId.toString(),
                blockNumber: event.blockNumber,
                transactionHash: event.transactionHash,
                timestamp: new Date(block.timestamp * 1000).toISOString(),
                data: {
                    admin: parsedLog.args.admin,
                    metadataHash: parsedLog.args.metadataHash
                }
            });
        }

        // Get OrderStatusUpdated events
        const statusUpdatedFilter = contract.filters.OrderStatusUpdated();
        const statusEvents = await contract.queryFilter(statusUpdatedFilter, startBlock, endBlock);
        
        for (const event of statusEvents) {
            const block = await provider.getBlock(event.blockNumber);
            const parsedLog = contract.interface.parseLog(event);
            
            events.push({
                eventType: 'OrderStatusUpdated',
                orderId: parsedLog.args.orderId.toString(),
                blockNumber: event.blockNumber,
                transactionHash: event.transactionHash,
                timestamp: new Date(block.timestamp * 1000).toISOString(),
                data: {
                    newStatus: parsedLog.args.newStatus,
                    detailsHash: parsedLog.args.detailsHash,
                    updatedBy: parsedLog.args.updatedBy
                }
            });
        }

        // Filter by orderId if specified
        if (orderId) {
            events = events.filter(event => event.orderId === orderId);
        }

        // Sort by block number (newest first)
        events.sort((a, b) => b.blockNumber - a.blockNumber);

        logger.http('Events retrieved', { total: events.length });
        res.json({
            success: true,
            events,
            total: events.length,
            fromBlock: startBlock,
            toBlock: endBlock
        });

    } catch (error) {
        logger.error('Failed to get events', { error: error.message });
        res.status(500).json({
            success: false,
            error: config.errorMessages.SERVER_ERROR
        });
    }
});

// Get admin status
app.get('/api/admin/:address', async (req, res) => {
    try {
        const { address } = req.params;
        
        const isAuthorized = await contract.isAdminAuthorized(address);
        const isOwner = await contract.owner() === address;

        logger.http('Admin status retrieved', { address, isOwner, isAuthorized });
        res.json({
            success: true,
            address,
            isAuthorized,
            isOwner,
            role: isOwner ? 'owner' : (isAuthorized ? 'admin' : 'unauthorized')
        });

    } catch (error) {
        logger.error('Failed to get admin status', { error: error.message, address: req.params.address });
        res.status(500).json({
            success: false,
            error: config.errorMessages.SERVER_ERROR
        });
    }
});

// Set admin authorization (owner only)
app.post('/api/admin/:address', async (req, res) => {
    try {
        const { address } = req.params;
        const { authorized } = req.body;

        if (typeof authorized !== 'boolean') {
            return res.status(400).json({
                success: false,
                error: config.errorMessages.INVALID_INPUT
            });
        }

        // Estimate gas
        const gasEstimate = await contract.setAdminAuthorization.estimateGas(address, authorized);
        
        // Send transaction
        const tx = await contract.setAdminAuthorization(address, authorized, {
            gasLimit: gasEstimate * BigInt(config.blockchainConfig.gas.multiplier * 100) / BigInt(100)
        });

        logger.info('Admin authorization transaction sent', { address, authorized, txHash: tx.hash });

        // Wait for confirmation
        const receipt = await tx.wait();

        logger.info('Admin authorization updated', { address, authorized });
        res.json({
            success: true,
            address,
            authorized,
            transactionHash: tx.hash,
            blockNumber: receipt.blockNumber,
            gasUsed: receipt.gasUsed.toString()
        });

    } catch (error) {
        logger.error('Failed to set admin authorization', { error: error.message, address: req.params.address });
        res.status(500).json({
            success: false,
            error: config.errorMessages.TRANSACTION_FAILED
        });
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    logger.error('Unhandled error', { error: err.message, stack: err.stack });
    res.status(500).json({
        success: false,
        error: config.errorMessages.SERVER_ERROR
    });
});

// 404 handler
app.use((req, res) => {
    logger.warn('Endpoint not found', { path: req.path, method: req.method });
    res.status(404).json({
        success: false,
        error: 'Endpoint not found',
        path: req.path
    });
});

// ==================== SERVER STARTUP ====================

async function startServer() {
    logger.info('STARTING BLOCKCHAIN ORDER TRACKING API SERVER');

    // Initialize contract
    if (!await initializeContract()) {
        logger.error('Failed to initialize contract');
        process.exit(1);
    }

    // Start server
    app.listen(config.serverConfig.port, () => {
        logger.info('Server started successfully', {
            port: config.serverConfig.port,
            contractAddress,
            adminAddress: signer.address
        });
        
        console.log('\n🌐 Server running at: http://localhost:' + config.serverConfig.port);
        console.log('📍 Contract Address: ' + contractAddress);
        console.log('👤 Admin Address: ' + signer.address);
        console.log('\n📋 Available Endpoints:');
        console.log('   GET  /api/health              - Health check');
        console.log('   GET  /api/stats               - System statistics');
        console.log('   POST /api/orders              - Create new order');
        console.log('   GET  /api/orders/:id          - Get order by ID');
        console.log('   POST /api/orders/:id/metadata - Save order metadata');
        console.log('   PUT  /api/orders/:id/status   - Update order status');
        console.log('   DEL  /api/orders/:id          - Cancel order');
        console.log('   GET  /api/events              - Get blockchain events');
        console.log('   GET  /api/admin/:address      - Get admin status');
        console.log('   POST /api/admin/:address      - Set admin authorization');
        console.log('\n✅ Ready to accept requests!\n');
    });
}

// Handle graceful shutdown
process.on('SIGINT', () => {
    logger.info('Shutting down server');
    process.exit(0);
});

// Debug endpoint - List all orders
app.get('/api/debug/orders', async (req, res) => {
    try {
        const orders = await Order.find().select('orderId status createdAt');
        res.json({
            success: true,
            totalOrders: orders.length,
            orders: orders.map(o => ({
                orderId: o.orderId,
                status: o.status,
                createdAt: o.createdAt
            }))
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// WebSocket endpoint stub - just return 405 Method Not Allowed
app.all('/ws', (req, res) => {
    res.status(405).json({
        success: false,
        error: 'WebSocket not supported via HTTP. Please use ws:// protocol if WebSocket is needed.'
    });
});

// Start the server
if (require.main === module) {
    startServer().catch(err => {
        logger.error('Failed to start server', { error: err.message });
        process.exit(1);
    });
}

module.exports = app;