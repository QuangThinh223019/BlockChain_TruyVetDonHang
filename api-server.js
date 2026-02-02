/**
 * REST API ENDPOINTS FOR BLOCKCHAIN ORDER TRACKING
 * API server để tương tác với blockchain order tracking system
 */

const express = require('express');
const cors = require('cors');
const { ethers } = require('ethers');
const mongoose = require('mongoose');
require('dotenv').config();

const { Order } = require('./database/schemas/models');
const { initializeEmailService, notifyOrderCreated, notifyOrderStatusUpdated, notifyOrderDelivered } = require('./email-service');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB setup
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/order-tracking';
let mongoConnected = false;

// Blockchain setup
const provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL);
const signer = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
const contractAddress = process.env.CONTRACT_ADDRESS;

let contract;

// Initialize contract and database
async function initializeContract() {
    try {
        const contractArtifact = require('./blockchain/artifacts/contracts/OrderTracking.sol/OrderTracking.json');
        contract = new ethers.Contract(contractAddress, contractArtifact.abi, signer);
        console.log('✅ Smart contract initialized');
        
        // Initialize email service
        initializeEmailService();
        
        // Connect to MongoDB
        try {
            await mongoose.connect(MONGODB_URI, {
                serverSelectionTimeoutMS: 3000,
                socketTimeoutMS: 10000,
                connectTimeoutMS: 3000
            });
            mongoConnected = true;
            console.log('✅ MongoDB connected');
        } catch (dbError) {
            console.warn('⚠️ MongoDB connection failed, running without database');
        }
        
        return true;
    } catch (error) {
        console.error('❌ Contract initialization failed:', error.message);
        return false;
    }
}

// ==================== API ENDPOINTS ====================

// Health check
app.get('/api/health', async (req, res) => {
    try {
        const blockNumber = await provider.getBlockNumber();
        const balance = await provider.getBalance(signer.address);
        const totalOrders = await contract.totalOrders();

        res.json({
            status: 'healthy',
            blockchain: {
                network: 'Sepolia',
                blockNumber,
                contractAddress,
                adminBalance: ethers.formatEther(balance),
                totalOrders: totalOrders.toString()
            },
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
});

// Get system statistics
app.get('/api/stats', async (req, res) => {
    try {
        const totalOrders = await contract.totalOrders();
        const network = await provider.getNetwork();
        const blockNumber = await provider.getBlockNumber();
        const balance = await provider.getBalance(signer.address);

        res.json({
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
            }
        });
    } catch (error) {
        res.status(500).json({
            error: 'Failed to get statistics',
            message: error.message
        });
    }
});

// Create new order
app.post('/api/orders', async (req, res) => {
    try {
        const { orderId, productInfo } = req.body;

        if (!orderId || !productInfo) {
            return res.status(400).json({
                error: 'Missing required fields: orderId, productInfo'
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
            gasLimit: gasEstimate * 120n / 100n
        });

        // Wait for confirmation
        const receipt = await tx.wait();

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
        res.status(500).json({
            error: 'Failed to create order',
            message: error.message
        });
    }
});

// Get order by ID
app.get('/api/orders/:orderId', async (req, res) => {
    try {
        const { orderId } = req.params;
        
        const order = await contract.getOrder(orderId);
        
        res.json({
            orderId: order.orderId,
            adminAddress: order.adminAddress,
            createdAt: new Date(Number(order.createdAt) * 1000).toISOString(),
            currentStatus: order.currentStatus,
            metadataHash: order.metadataHash,
            lastUpdated: new Date(Number(order.lastUpdated) * 1000).toISOString(),
            isActive: order.isActive
        });

    } catch (error) {
        if (error.message.includes('Order does not exist')) {
            return res.status(404).json({
                error: 'Order not found',
                orderId: req.params.orderId
            });
        }
        
        res.status(500).json({
            error: 'Failed to get order',
            message: error.message
        });
    }
});

// Get order metadata from MongoDB
app.get('/api/orders/:orderId/metadata', async (req, res) => {
    try {
        const { orderId } = req.params;
        
        if (!mongoConnected) {
            return res.status(503).json({
                error: 'Database not available',
                message: 'MongoDB connection is not established'
            });
        }
        
        // Find order in MongoDB
        const orderDoc = await Order.findOne({ orderId });
        
        if (!orderDoc) {
            return res.status(404).json({
                error: 'Order metadata not found',
                orderId
            });
        }
        
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
        res.status(500).json({
            error: 'Failed to get order metadata',
            message: error.message
        });
    }
});

// Save order metadata to MongoDB
app.post('/api/orders/:orderId/metadata', async (req, res) => {
    try {
        const { orderId } = req.params;
        const { metadata, recipient, sender, txHash } = req.body;
        
        console.log(`📥 POST /api/orders/${orderId}/metadata`);
        console.log('Request body:', { metadata, recipient, sender, txHash });
        
        if (!mongoConnected) {
            console.warn('⚠️ MongoDB not connected');
            return res.status(503).json({
                error: 'Database not available',
                message: 'MongoDB connection is not established'
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
        
        console.log(`✅ Order saved to MongoDB:`, orderDoc.orderId);
        
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
            
            console.log(`📧 Sending order creation email to ${recipientEmail}`);
            // Send email asynchronously (don't wait for it)
            notifyOrderCreated(recipientEmail, emailData).then(() => {
                console.log(`✅ Order creation email sent to ${recipientEmail}`);
            }).catch(err => {
                console.error('❌ Failed to send order creation email:', err.message);
            });
        }
        
        res.json({
            success: true,
            orderId,
            message: 'Metadata saved successfully',
            data: orderDoc
        });

    } catch (error) {
        console.error('❌ Error in POST metadata:', error.message);
        res.status(500).json({
            error: 'Failed to save order metadata',
            message: error.message
        });
    }
});

// Update order status - Only for email notification, blockchain already updated by frontend
app.put('/api/orders/:orderId/status', async (req, res) => {
    try {
        const { orderId } = req.params;
        const { status, details } = req.body;

        if (!status) {
            return res.status(400).json({
                error: 'Missing required field: status'
            });
        }

        // Valid statuses
        const validStatuses = ['PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'CREATED', 'CONFIRMED'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                error: 'Invalid status',
                validStatuses
            });
        }

        // Send email notification if MongoDB is connected
        if (mongoConnected) {
            try {
                console.log(`📧 Searching for order: ${orderId}`);
                const orderDoc = await Order.findOne({ orderId });
                
                if (orderDoc) {
                    console.log(`✅ Order found in MongoDB`);
                    console.log(`📧 Recipient email: ${orderDoc.recipient?.email}`);
                    
                    if (orderDoc.recipient?.email) {
                        // Map status string to number for email template
                        const statusMap = {
                            'CREATED': '0',
                            'PROCESSING': '1',
                            'CONFIRMED': '1',  // Confirmed
                            'SHIPPED': '2',      // Shipping
                            'DELIVERED': '3',    // Delivered
                            'CANCELLED': '4'     // Cancelled
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
                        
                        console.log(`📧 Preparing email with status: ${emailData.status} (${status})`);
                        
                        // Send email asynchronously
                        if (status === 'DELIVERED') {
                            console.log(`📧 Sending delivery notification...`);
                            emailData.deliveredAt = new Date().toISOString();
                            notifyOrderDelivered(orderDoc.recipient.email, emailData).then(() => {
                                console.log(`✅ Delivery notification sent to ${orderDoc.recipient.email}`);
                            }).catch(err => {
                                console.error('❌ Failed to send delivery notification:', err.message);
                            });
                        } else {
                            console.log(`📧 Sending status update email...`);
                            notifyOrderStatusUpdated(orderDoc.recipient.email, emailData).then(() => {
                                console.log(`✅ Status update email sent to ${orderDoc.recipient.email}`);
                            }).catch(err => {
                                console.error('❌ Failed to send status update email:', err.message);
                            });
                        }
                    } else {
                        console.warn(`⚠️ No recipient email found for order ${orderId}`);
                    }
                } else {
                    console.warn(`⚠️ Order not found in MongoDB: ${orderId}`);
                }
            } catch (emailError) {
                console.error('❌ Error sending status update email:', emailError.message);
            }
        } else {
            console.warn('⚠️ MongoDB not connected, email not sent');
        }

        res.json({
            success: true,
            orderId,
            newStatus: status,
            details,
            message: 'Status update notification sent'
        });

    } catch (error) {
        res.status(500).json({
            error: 'Failed to process status update',
            message: error.message
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
            gasLimit: gasEstimate * 120n / 100n
        });

        // Wait for confirmation
        const receipt = await tx.wait();

        res.json({
            success: true,
            orderId,
            status: 'CANCELLED',
            transactionHash: tx.hash,
            blockNumber: receipt.blockNumber,
            gasUsed: receipt.gasUsed.toString()
        });

    } catch (error) {
        res.status(500).json({
            error: 'Failed to cancel order',
            message: error.message
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

        res.json({
            events,
            total: events.length,
            fromBlock: startBlock,
            toBlock: endBlock
        });

    } catch (error) {
        res.status(500).json({
            error: 'Failed to get events',
            message: error.message
        });
    }
});

// Get admin status
app.get('/api/admin/:address', async (req, res) => {
    try {
        const { address } = req.params;
        
        const isAuthorized = await contract.isAdminAuthorized(address);
        const isOwner = await contract.owner() === address;

        res.json({
            address,
            isAuthorized,
            isOwner,
            role: isOwner ? 'owner' : (isAuthorized ? 'admin' : 'unauthorized')
        });

    } catch (error) {
        res.status(500).json({
            error: 'Failed to get admin status',
            message: error.message
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
                error: 'Missing or invalid field: authorized (boolean required)'
            });
        }

        // Estimate gas
        const gasEstimate = await contract.setAdminAuthorization.estimateGas(address, authorized);
        
        // Send transaction
        const tx = await contract.setAdminAuthorization(address, authorized, {
            gasLimit: gasEstimate * 120n / 100n
        });

        // Wait for confirmation
        const receipt = await tx.wait();

        res.json({
            success: true,
            address,
            authorized,
            transactionHash: tx.hash,
            blockNumber: receipt.blockNumber,
            gasUsed: receipt.gasUsed.toString()
        });

    } catch (error) {
        res.status(500).json({
            error: 'Failed to set admin authorization',
            message: error.message
        });
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        error: 'Internal server error',
        message: err.message
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        error: 'Endpoint not found',
        path: req.path
    });
});

// ==================== SERVER STARTUP ====================

async function startServer() {
    console.log('🚀 STARTING BLOCKCHAIN ORDER TRACKING API SERVER');
    console.log('=' .repeat(60));

    // Initialize contract
    if (!await initializeContract()) {
        console.error('❌ Failed to initialize contract');
        process.exit(1);
    }

    // Start server
    app.listen(PORT, () => {
        console.log('✅ Server started successfully');
        console.log(`🌐 Server running at: http://localhost:${PORT}`);
        console.log(`📍 Contract Address: ${contractAddress}`);
        console.log(`👤 Admin Address: ${signer.address}`);
        console.log('\n📋 Available Endpoints:');
        console.log('   GET  /api/health           - Health check');
        console.log('   GET  /api/stats            - System statistics');
        console.log('   POST /api/orders           - Create new order');
        console.log('   GET  /api/orders/:id       - Get order by ID');
        console.log('   PUT  /api/orders/:id/status - Update order status');
        console.log('   DEL  /api/orders/:id       - Cancel order');
        console.log('   GET  /api/events           - Get blockchain events');
        console.log('   GET  /api/admin/:address   - Get admin status');
        console.log('   POST /api/admin/:address   - Set admin authorization');
        console.log('\n🎯 Ready to accept requests!');
    });
}

// Handle graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down server...');
    process.exit(0);
});

// Start the server
if (require.main === module) {
    startServer().catch(console.error);
}

module.exports = app;