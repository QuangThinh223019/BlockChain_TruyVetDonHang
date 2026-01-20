/**
 * COMPLETE METAMASK INTEGRATION
 * Hướng dẫn và utilities để tích hợp MetaMask với Order Tracking System
 */

const { ethers } = require('ethers');
require('dotenv').config();

// Load contract ABI từ artifacts
let contractArtifact;
try {
    contractArtifact = require('../blockchain/artifacts/contracts/OrderTracking.sol/OrderTracking.json');
} catch (error) {
    console.error('❌ Contract artifacts not found. Please run: cd blockchain && npm run compile');
    process.exit(1);
}

// ==================== CONFIGURATION ====================

const CONFIG = {
    CONTRACT_ADDRESS: process.env.CONTRACT_ADDRESS || process.env.SEPOLIA_CONTRACT_ADDRESS,
    RPC_URL: process.env.RPC_URL || process.env.SEPOLIA_RPC_URL || "http://localhost:8545",
    PRIVATE_KEY: process.env.PRIVATE_KEY,
    INFURA_KEY: process.env.INFURA_API_KEY || "7344f20358424a8c9e3bd5a2609c471a"
};

// Network configurations
const NETWORKS = {
    localhost: {
        name: "Localhost",
        rpcUrl: "http://localhost:8545",
        chainId: 31337
    },
    sepolia: {
        name: "Sepolia Testnet", 
        rpcUrl: `https://sepolia.infura.io/v3/${CONFIG.INFURA_KEY}`,
        chainId: 11155111,
        faucet: "https://sepoliafaucet.com/"
    },
    goerli: {
        name: "Goerli Testnet",
        rpcUrl: `https://goerli.infura.io/v3/${CONFIG.INFURA_KEY}`,
        chainId: 5
    },
    mainnet: {
        name: "Ethereum Mainnet",
        rpcUrl: `https://mainnet.infura.io/v3/${CONFIG.INFURA_KEY}`,
        chainId: 1
    }
};

// ==================== METAMASK ORDER TRACKING CLASS ====================

class MetaMaskOrderTracking {
    constructor(networkName = 'sepolia') {
        this.network = NETWORKS[networkName];
        this.provider = null;
        this.signer = null;
        this.contract = null;
        this.userAddress = null;
        this.isMetaMaskAvailable = typeof window !== 'undefined' && window.ethereum;
    }

    // ==================== CONNECTION METHODS ====================

    // Connect to MetaMask (frontend)
    async connectMetaMask() {
        if (!this.isMetaMaskAvailable) {
            throw new Error('MetaMask not detected. Please install MetaMask browser extension.');
        }

        try {
            console.log('🦊 Connecting to MetaMask...');
            
            // Request account access
            await window.ethereum.request({ method: 'eth_requestAccounts' });
            
            // Setup provider and signer
            this.provider = new ethers.BrowserProvider(window.ethereum);
            this.signer = this.provider.getSigner();
            this.userAddress = await this.signer.getAddress();
            
            // Check network
            const network = await this.provider.getNetwork();
            console.log(`✅ Connected to MetaMask`);
            console.log(`📍 Address: ${this.userAddress}`);
            console.log(`🌐 Network: ${network.name} (${network.chainId})`);
            
            // Connect to contract
            await this.connectContract();
            
            return {
                address: this.userAddress,
                network: network.name,
                chainId: network.chainId
            };
            
        } catch (error) {
            console.error('❌ MetaMask connection failed:', error);
            throw error;
        }
    }

    // Connect with private key (backend/testing)
    async connectWithPrivateKey(networkName = 'sepolia') {
        try {
            console.log(`🔑 Connecting with private key to ${networkName}...`);
            
            const network = NETWORKS[networkName];
            this.provider = new ethers.JsonRpcProvider(network.rpcUrl);
            this.signer = new ethers.Wallet(CONFIG.PRIVATE_KEY, this.provider);
            this.userAddress = this.signer.address;
            
            const networkInfo = await this.provider.getNetwork();
            const balance = await this.provider.getBalance(this.userAddress);
            
            console.log(`✅ Connected to ${network.name}`);
            console.log(`📍 Address: ${this.userAddress}`);
            console.log(`💰 Balance: ${ethers.formatEther(balance)} ETH`);
            
            await this.connectContract();
            
            return {
                address: this.userAddress,
                network: networkInfo.name,
                chainId: networkInfo.chainId,
                balance: ethers.formatEther(balance)
            };
            
        } catch (error) {
            console.error('❌ Private key connection failed:', error);
            throw error;
        }
    }

    // Connect to smart contract
    async connectContract() {
        try {
            if (!CONFIG.CONTRACT_ADDRESS) {
                throw new Error('CONTRACT_ADDRESS not set in environment variables');
            }

            this.contract = new ethers.Contract(
                CONFIG.CONTRACT_ADDRESS, 
                contractArtifact.abi, 
                this.signer
            );
            
            console.log(`✅ Connected to contract: ${CONFIG.CONTRACT_ADDRESS}`);
            
            // Test contract connection
            const totalOrders = await this.contract.totalOrders();
            console.log(`📊 Total orders on contract: ${totalOrders}`);
            
            return this.contract;
        } catch (error) {
            console.error('❌ Contract connection failed:', error);
            throw error;
        }
    }

    // ==================== NETWORK MANAGEMENT ====================

    // Switch MetaMask to correct network
    async switchToNetwork(networkName) {
        if (!this.isMetaMaskAvailable) {
            console.log(`🔄 Switching provider to ${networkName}`);
            return this.connectWithPrivateKey(networkName);
        }

        const network = NETWORKS[networkName];
        
        try {
            await window.ethereum.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: ethers.toQuantity(network.chainId) }],
            });
            
            console.log(`✅ Switched to ${network.name}`);
            return true;
        } catch (error) {
            // Network not added to MetaMask, add it
            if (error.code === 4902) {
                return this.addNetworkToMetaMask(networkName);
            }
            throw error;
        }
    }

    // Add network to MetaMask
    async addNetworkToMetaMask(networkName) {
        const network = NETWORKS[networkName];
        
        try {
            await window.ethereum.request({
                method: 'wallet_addEthereumChain',
                params: [{
                    chainId: ethers.toQuantity(network.chainId),
                    chainName: network.name,
                    rpcUrls: [network.rpcUrl],
                    nativeCurrency: {
                        name: 'ETH',
                        symbol: 'ETH',
                        decimals: 18
                    }
                }]
            });
            
            console.log(`✅ Added ${network.name} to MetaMask`);
            return true;
        } catch (error) {
            console.error(`❌ Failed to add ${network.name}:`, error);
            throw error;
        }
    }

    // ==================== ORDER MANAGEMENT ====================

    // Create new order
    async createOrder(orderId, productInfo) {
        try {
            console.log(`📦 Creating order: ${orderId}`);
            
            // Debug contract instance
            if (!this.contract) {
                console.log('⚠️ Contract not initialized, attempting to connect...');
                await this.connectContract();
            }
            
            // Create metadata hash
            const metadata = {
                ...productInfo,
                timestamp: Date.now(),
                creator: this.userAddress
            };
            
            const metadataString = JSON.stringify(metadata);
            const metadataHash = ethers.keccak256(ethers.toUtf8Bytes(metadataString));
            
            // Estimate gas
            const gasEstimate = await this.contract.estimateGas.createOrder(orderId, metadataHash);
            console.log(`⛽ Estimated gas: ${gasEstimate.toString()}`);
            
            // Send transaction with 20% buffer
            const tx = await this.contract.createOrder(orderId, metadataHash, {
                gasLimit: gasEstimate * 120n / 100n
            });
            
            console.log(`📤 Transaction sent: ${tx.hash}`);
            console.log('⏳ Waiting for confirmation...');
            
            const receipt = await tx.wait();
            console.log(`✅ Order created in block: ${receipt.blockNumber}`);
            
            // Parse events for ethers v6
            const events = receipt.logs?.filter(log => {
                try {
                    const parsed = this.contract.interface.parseLog(log);
                    return parsed.name === 'OrderCreated';
                } catch (e) {
                    return false;
                }
            }) || [];
            
            return {
                orderId,
                txHash: tx.hash,
                blockNumber: receipt.blockNumber,
                gasUsed: receipt.gasUsed.toString(),
                metadata,
                metadataHash,
                events: events.map(log => this.contract.interface.parseLog(log).args)
            };
            
        } catch (error) {
            console.error('❌ Create order failed:', error);
            throw error;
        }
    }

    // Update order status
    async updateOrderStatus(orderId, newStatus, details = '') {
        try {
            console.log(`📦 Updating ${orderId} to ${newStatus}`);
            
            const detailsHash = ethers.keccak256(
                ethers.toUtf8Bytes(details || `${newStatus}_${Date.now()}`)
            );
            
            // Estimate gas
            const gasEstimate = await this.contract.estimateGas.updateOrderStatus(
                orderId, newStatus, detailsHash
            );
            
            const tx = await this.contract.updateOrderStatus(orderId, newStatus, detailsHash, {
                gasLimit: gasEstimate.mul(120).div(100)
            });
            
            console.log(`📤 Update sent: ${tx.hash}`);
            
            const receipt = await tx.wait();
            console.log(`✅ Status updated in block: ${receipt.blockNumber}`);
            
            return {
                orderId,
                newStatus,
                txHash: tx.hash,
                blockNumber: receipt.blockNumber,
                gasUsed: receipt.gasUsed.toString(),
                detailsHash
            };
            
        } catch (error) {
            console.error('❌ Update status failed:', error);
            throw error;
        }
    }

    // Cancel order
    async cancelOrder(orderId) {
        try {
            console.log(`❌ Cancelling order: ${orderId}`);
            
            const tx = await this.contract.cancelOrder(orderId);
            console.log(`📤 Cancel sent: ${tx.hash}`);
            
            const receipt = await tx.wait();
            console.log(`✅ Order cancelled in block: ${receipt.blockNumber}`);
            
            return {
                orderId,
                txHash: tx.hash,
                blockNumber: receipt.blockNumber,
                gasUsed: receipt.gasUsed.toString()
            };
            
        } catch (error) {
            console.error('❌ Cancel order failed:', error);
            throw error;
        }
    }

    // ==================== QUERY METHODS ====================

    // Get order information
    async getOrder(orderId) {
        try {
            console.log(`🔍 Querying order: ${orderId}`);
            
            const order = await this.contract.getOrder(orderId);
            
            const orderInfo = {
                orderId: order.orderId,
                adminAddress: order.adminAddress,
                createdAt: new Date(order.createdAt * 1000),
                currentStatus: order.currentStatus,
                metadataHash: order.metadataHash,
                lastUpdated: new Date(order.lastUpdated * 1000),
                isActive: order.isActive
            };
            
            console.log('📋 Order Information:');
            console.log(`   ID: ${orderInfo.orderId}`);
            console.log(`   Status: ${orderInfo.currentStatus}`);
            console.log(`   Created: ${orderInfo.createdAt.toLocaleString()}`);
            console.log(`   Updated: ${orderInfo.lastUpdated.toLocaleString()}`);
            console.log(`   Admin: ${orderInfo.adminAddress}`);
            console.log(`   Active: ${orderInfo.isActive}`);
            
            return orderInfo;
        } catch (error) {
            console.error('❌ Query order failed:', error);
            throw error;
        }
    }

    // Get order history
    async getOrderHistory(orderId) {
        try {
            console.log(`🔍 Getting order history: ${orderId}`);
            
            // Get all status updates for this order
            const filter = this.contract.filters.OrderStatusUpdated(orderId);
            const events = await this.contract.queryFilter(filter);
            
            const history = await Promise.all(events.map(async (event) => {
                const block = await this.provider.getBlock(event.blockNumber);
                return {
                    blockNumber: event.blockNumber,
                    transactionHash: event.transactionHash,
                    status: event.args.newStatus,
                    timestamp: new Date(event.args.timestamp * 1000),
                    blockTime: new Date(block.timestamp * 1000),
                    updatedBy: event.args.updatedBy,
                    detailsHash: event.args.detailsHash
                };
            }));
            
            console.log(`📋 Found ${history.length} status updates`);
            history.forEach((update, index) => {
                console.log(`   ${index + 1}. ${update.status} at ${update.timestamp.toLocaleString()}`);
            });
            
            return history.sort((a, b) => a.blockNumber - b.blockNumber);
        } catch (error) {
            console.error('❌ Get history failed:', error);
            throw error;
        }
    }

    // Listen for real-time events
    startEventListener(callback) {
        console.log('👂 Starting event listener...');
        
        // Listen for new orders
        this.contract.on('OrderCreated', (orderId, admin, timestamp, metadataHash, event) => {
            const eventData = {
                type: 'OrderCreated',
                orderId,
                admin,
                timestamp: new Date(timestamp * 1000),
                metadataHash,
                blockNumber: event.blockNumber,
                txHash: event.transactionHash
            };
            
            console.log(`🆕 New Order: ${orderId} by ${admin}`);
            callback(eventData);
        });
        
        // Listen for status updates
        this.contract.on('OrderStatusUpdated', (orderId, newStatus, timestamp, detailsHash, updatedBy, event) => {
            const eventData = {
                type: 'OrderStatusUpdated',
                orderId,
                newStatus,
                timestamp: new Date(timestamp * 1000),
                detailsHash,
                updatedBy,
                blockNumber: event.blockNumber,
                txHash: event.transactionHash
            };
            
            console.log(`🔄 Status Update: ${orderId} → ${newStatus}`);
            callback(eventData);
        });
        
        console.log('✅ Event listener started');
    }

    // Stop event listener
    stopEventListener() {
        this.contract.removeAllListeners();
        console.log('🛑 Event listener stopped');
    }

    // ==================== UTILITY METHODS ====================

    // Get gas price
    async getGasPrice() {
        const gasPrice = await this.provider.getGasPrice();
        return {
            wei: gasPrice.toString(),
            gwei: ethers.formatUnits(gasPrice, 'gwei'),
            eth: ethers.formatEther(gasPrice * 21000n) // Standard transfer cost
        };
    }

    // Check if user is admin
    async isUserAdmin() {
        try {
            return await this.contract.authorizedAdmins(this.userAddress);
        } catch (error) {
            console.error('❌ Failed to check admin status:', error);
            return false;
        }
    }

    // Get contract statistics
    async getContractStats() {
        try {
            const totalOrders = await this.contract.totalOrders();
            const contractOwner = await this.contract.contractOwner();
            const isAdmin = await this.isUserAdmin();
            
            return {
                totalOrders: totalOrders.toString(),
                contractOwner,
                userIsAdmin: isAdmin,
                contractAddress: CONFIG.CONTRACT_ADDRESS
            };
        } catch (error) {
            console.error('❌ Failed to get contract stats:', error);
            return null;
        }
    }
}

// ==================== HELPER FUNCTIONS ====================

// Setup MetaMask for development
async function setupMetaMaskForDevelopment() {
    console.log('🛠️  Setting up MetaMask for development...');
    
    const steps = [
        '1. Install MetaMask browser extension',
        '2. Create or import wallet',
        '3. Import private key from .env file',
        '4. Add Sepolia testnet to MetaMask',
        '5. Get test ETH from Sepolia faucet',
        '6. Switch to Sepolia network in MetaMask'
    ];
    
    console.log('📋 Setup steps:');
    steps.forEach(step => console.log(`   ${step}`));
    
    console.log('\n🔑 Private Key (from .env):');
    console.log(`   ${CONFIG.PRIVATE_KEY?.substring(0, 10)}...`);
    
    console.log('\n🌐 Sepolia Network Details:');
    console.log(`   Network Name: ${NETWORKS.sepolia.name}`);
    console.log(`   RPC URL: ${NETWORKS.sepolia.rpcUrl}`);
    console.log(`   Chain ID: ${NETWORKS.sepolia.chainId}`);
    console.log(`   Faucet: ${NETWORKS.sepolia.faucet}`);
    
    console.log('\n📋 Contract Information:');
    console.log(`   Address: ${CONFIG.CONTRACT_ADDRESS}`);
    console.log(`   Network: ${CONFIG.RPC_URL.includes('sepolia') ? 'Sepolia' : 'Localhost'}`);
}

// Run comprehensive integration test
async function runComprehensiveTest() {
    console.log('🧪 Running Comprehensive MetaMask Integration Test...');
    console.log('================================================');
    
    const tracker = new MetaMaskOrderTracking();
    
    try {
        // Connect
        await tracker.connectWithPrivateKey();
        
        // Get contract stats
        const stats = await tracker.getContractStats();
        console.log('📊 Contract Statistics:', stats);
        
        // Create test order
        const orderId = `COMPREHENSIVE_TEST_${Date.now()}`;
        const productInfo = {
            name: 'Test Product',
            description: 'Comprehensive test product',
            quantity: 5,
            price: 99.99,
            category: 'Electronics',
            sku: 'TST001'
        };
        
        console.log('\n📦 Creating test order...');
        const createResult = await tracker.createOrder(orderId, productInfo);
        
        // Update status multiple times
        const statuses = ['PROCESSING', 'SHIPPED', 'DELIVERED'];
        
        for (const status of statuses) {
            console.log(`\n🔄 Updating to ${status}...`);
            await tracker.updateOrderStatus(orderId, status, `Order ${status.toLowerCase()}`);
            await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
        }
        
        // Get final order state
        console.log('\n🔍 Getting final order state...');
        const finalOrder = await tracker.getOrder(orderId);
        
        // Get complete history
        console.log('\n📋 Getting order history...');
        const history = await tracker.getOrderHistory(orderId);
        
        // Test completed
        console.log('\n✅ ================================================');
        console.log('✅ COMPREHENSIVE TEST COMPLETED SUCCESSFULLY!');
        console.log('✅ ================================================');
        console.log(`📦 Test Order: ${orderId}`);
        console.log(`📊 Final Status: ${finalOrder.currentStatus}`);
        console.log(`📋 History Length: ${history.length}`);
        console.log(`💰 Total Gas Used: ${createResult.gasUsed}`);
        
        return {
            success: true,
            orderId,
            finalStatus: finalOrder.currentStatus,
            historyLength: history.length,
            gasUsed: createResult.gasUsed
        };
        
    } catch (error) {
        console.error('❌ Comprehensive test failed:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

// ==================== EXPORT & MAIN ====================

module.exports = {
    MetaMaskOrderTracking,
    setupMetaMaskForDevelopment,
    runComprehensiveTest,
    NETWORKS,
    CONFIG
};

// Run test if executed directly
if (require.main === module) {
    console.log('🚀 MetaMask Integration Script');
    console.log('==============================\n');
    
    // Check if all required config is available
    if (!CONFIG.CONTRACT_ADDRESS) {
        console.log('❌ CONTRACT_ADDRESS not found in environment variables');
        console.log('📋 Please ensure contract is deployed and .env is configured\n');
        setupMetaMaskForDevelopment();
        process.exit(1);
    }
    
    if (!CONFIG.PRIVATE_KEY) {
        console.log('❌ PRIVATE_KEY not found in environment variables');
        console.log('📋 Please add your MetaMask private key to .env file\n');
        setupMetaMaskForDevelopment();
        process.exit(1);
    }
    
    // Run comprehensive test
    runComprehensiveTest()
        .then(result => {
            if (result.success) {
                console.log('\n🎉 MetaMask integration is fully functional!');
                console.log('Ready for frontend development and production use!');
            } else {
                console.log(`\n❌ Integration test failed: ${result.error}`);
                console.log('Please check your configuration and try again.');
                process.exit(1);
            }
        })
        .catch(error => {
            console.error('❌ Unexpected error during testing:', error);
            process.exit(1);
        });
}