/**
 * BLOCKCHAIN ORDER TRACKING - PRODUCTION SYSTEM
 * Hệ thống truy vết đơn hàng blockchain chính thức
 */

const { ethers } = require('ethers');
require('dotenv').config();

class ProductionOrderTracking {
    constructor() {
        this.provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL);
        this.signer = new ethers.Wallet(process.env.PRIVATE_KEY, this.provider);
        this.contractAddress = process.env.CONTRACT_ADDRESS;
        this.contract = null;
    }

    async initialize() {
        console.log('🚀 KHỞI ĐỘNG HỆ THỐNG BLOCKCHAIN ORDER TRACKING');
        console.log('================================================\n');

        try {
            // Load contract
            const contractArtifact = require('./blockchain/artifacts/contracts/OrderTracking.sol/OrderTracking.json');
            this.contract = new ethers.Contract(
                this.contractAddress,
                contractArtifact.abi,
                this.signer
            );

            console.log('✅ Smart Contract loaded');
            console.log('📍 Contract Address:', this.contractAddress);
            console.log('� Contract instance:', this.contract ? 'OK' : 'FAILED');
            console.log('�👤 Admin Address:', this.signer.address);
            
            const balance = await this.provider.getBalance(this.signer.address);
            console.log('💰 Balance:', ethers.formatEther(balance), 'ETH');
            
            const totalOrders = await this.contract.totalOrders();
            console.log('📊 Total Orders:', totalOrders.toString());
            
            console.log('\n🎉 HỆ THỐNG SẴN SÀNG!\n');
            
            return true;
        } catch (error) {
            console.error('❌ Initialization failed:', error.message);
            return false;
        }
    }

    async createOrder(orderId, productInfo) {
        console.log(`\n📦 TẠO ĐỚN HÀNG: ${orderId}`);
        console.log('=' .repeat(50));

        try {
            // Check contract
            if (!this.contract) {
                console.log('⚠️ Contract not ready, reinitializing...');
                await this.initialize();
            }
            
            console.log('🔧 Contract check:', this.contract ? 'OK' : 'STILL NULL');
            console.log('🔧 Available functions:', Object.getOwnPropertyNames(this.contract).filter(x => typeof this.contract[x] === 'function'));

            // Tạo metadata
            const metadata = {
                ...productInfo,
                timestamp: Date.now(),
                creator: this.signer.address
            };
            
            const metadataString = JSON.stringify(metadata);
            const metadataHash = ethers.keccak256(ethers.toUtf8Bytes(metadataString));

            console.log('📝 Product:', productInfo.name);
            console.log('📝 Quantity:', productInfo.quantity);
            console.log('💵 Price:', productInfo.price, 'VND');
            console.log('🏷️  SKU:', productInfo.sku);

            // Estimate gas
            const gasEstimate = await this.contract.createOrder.estimateGas(orderId, metadataHash);
            console.log('⛽ Gas Estimate:', gasEstimate.toString());

            // Send transaction
            console.log('📤 Sending transaction...');
            const tx = await this.contract.createOrder(orderId, metadataHash, {
                gasLimit: gasEstimate * 120n / 100n
            });

            console.log('🔗 Transaction Hash:', tx.hash);
            console.log('⏳ Waiting for confirmation...');

            const receipt = await tx.wait();
            console.log('✅ THÀNH CÔNG! Block:', receipt.blockNumber);
            
            return {
                orderId,
                txHash: tx.hash,
                blockNumber: receipt.blockNumber,
                metadata,
                metadataHash
            };

        } catch (error) {
            console.error('❌ Create order failed:', error.message);
            throw error;
        }
    }

    async updateOrderStatus(orderId, newStatus, details = '') {
        console.log(`\n🔄 CẬP NHẬT TRẠNG THÁI: ${orderId} → ${newStatus}`);
        console.log('=' .repeat(50));

        try {
            // Check contract
            if (!this.contract) {
                console.log('⚠️ Contract not ready, reinitializing...');
                await this.initialize();
            }

            const detailsHash = ethers.keccak256(
                ethers.toUtf8Bytes(details || `${newStatus}_${Date.now()}`)
            );

            console.log('📝 Details:', details || 'No details provided');

            const gasEstimate = await this.contract.updateStatus.estimateGas(orderId, newStatus, detailsHash);
            console.log('⛽ Gas Estimate:', gasEstimate.toString());

            console.log('📤 Sending transaction...');
            const tx = await this.contract.updateStatus(orderId, newStatus, detailsHash, {
                gasLimit: gasEstimate * 120n / 100n
            });

            console.log('🔗 Transaction Hash:', tx.hash);
            console.log('⏳ Waiting for confirmation...');

            const receipt = await tx.wait();
            console.log('✅ THÀNH CÔNG! Block:', receipt.blockNumber);

            return {
                orderId,
                newStatus,
                txHash: tx.hash,
                blockNumber: receipt.blockNumber,
                details,
                detailsHash
            };

        } catch (error) {
            console.error('❌ Update status failed:', error.message);
            throw error;
        }
    }

    async getOrder(orderId) {
        console.log(`\n🔍 KIỂM TRA ĐƠN HÀNG: ${orderId}`);
        console.log('=' .repeat(50));

        try {
            const order = await this.contract.getOrder(orderId);
            
            console.log('📦 Order ID:', order.orderId);
            console.log('👤 Admin:', order.adminAddress);
            console.log('📅 Created:', new Date(Number(order.createdAt) * 1000).toLocaleString());
            console.log('📊 Status:', order.currentStatus);
            console.log('📝 Metadata Hash:', order.metadataHash);
            console.log('🔄 Last Updated:', new Date(Number(order.lastUpdated) * 1000).toLocaleString());
            console.log('✅ Active:', order.isActive);

            return order;

        } catch (error) {
            console.error('❌ Get order failed:', error.message);
            throw error;
        }
    }

    async showSystemStatus() {
        console.log('\n📊 TRẠNG THÁI HỆ THỐNG');
        console.log('=' .repeat(50));

        try {
            const blockNumber = await this.provider.getBlockNumber();
            const network = await this.provider.getNetwork();
            const balance = await this.provider.getBalance(this.signer.address);
            const totalOrders = await this.contract.totalOrders();

            console.log('🌐 Network:', network.name, `(Chain ID: ${network.chainId})`);
            console.log('🧱 Latest Block:', blockNumber);
            console.log('💰 Admin Balance:', ethers.formatEther(balance), 'ETH');
            console.log('📦 Total Orders:', totalOrders.toString());
            console.log('📍 Contract:', this.contractAddress);
            console.log('👤 Admin:', this.signer.address);

        } catch (error) {
            console.error('❌ System status failed:', error.message);
        }
    }
}

// ==================== MAIN PRODUCTION SYSTEM ====================

async function runProductionSystem() {
    const system = new ProductionOrderTracking();
    
    if (!await system.initialize()) {
        process.exit(1);
    }

    // Show system status
    await system.showSystemStatus();

    // Demo: Create sample order
    console.log('\n🎯 DEMO: TẠO ĐƠN HÀNG MẪU');
    console.log('=' .repeat(50));

    const sampleOrder = {
        orderId: `PROD_ORDER_${Date.now()}`,
        productInfo: {
            name: 'iPhone 15 Pro Max',
            description: 'iPhone 15 Pro Max 256GB Natural Titanium',
            quantity: 1,
            price: 29990000, // VND
            category: 'Electronics',
            sku: 'IPH15PM256NT',
            supplier: 'Apple Vietnam',
            warranty: '12 months'
        }
    };

    try {
        // Create order
        const createResult = await system.createOrder(
            sampleOrder.orderId, 
            sampleOrder.productInfo
        );

        // Update status progression
        const statuses = [
            { status: 'PROCESSING', details: 'Order confirmed and being prepared' },
            { status: 'SHIPPED', details: 'Package shipped via VNPost Express' },
            { status: 'DELIVERED', details: 'Package delivered successfully' }
        ];

        for (const { status, details } of statuses) {
            console.log(`\n⏰ Waiting 3 seconds before next update...`);
            await new Promise(resolve => setTimeout(resolve, 3000));
            
            await system.updateOrderStatus(sampleOrder.orderId, status, details);
        }

        // Final check
        console.log('\n⏰ Waiting 5 seconds for final check...');
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        await system.getOrder(sampleOrder.orderId);

        console.log('\n🎉 DEMO HOÀN THÀNH THÀNH CÔNG!');
        console.log('🚀 Hệ thống blockchain order tracking đã sẵn sàng production!');

    } catch (error) {
        console.error('❌ Demo failed:', error.message);
    }
}

// Chạy hệ thống production
if (require.main === module) {
    runProductionSystem();
}

module.exports = ProductionOrderTracking;