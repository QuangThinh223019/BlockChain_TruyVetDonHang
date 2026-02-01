/**
 * SIMPLE METAMASK TEST
 * Test cơ bản để verify MetaMask integration
 */

const ethers = require('ethers');
require('dotenv').config();

// Cấu hình từ .env
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS || process.env.SEPOLIA_CONTRACT_ADDRESS;
const RPC_URL = process.env.RPC_URL || process.env.SEPOLIA_RPC_URL || "http://localhost:8545";
const PRIVATE_KEY = process.env.PRIVATE_KEY;

async function testBasicConnection() {
    console.log('🔍 BASIC CONNECTION TEST');
    console.log('========================\n');
    
    try {
        // Test environment variables
        console.log('📋 Environment Variables:');
        console.log(`   CONTRACT_ADDRESS: ${CONTRACT_ADDRESS || 'Not set'}`);
        console.log(`   RPC_URL: ${RPC_URL}`);
        console.log(`   PRIVATE_KEY: ${PRIVATE_KEY ? 'Set ✅' : 'Not set ❌'}`);
        
        if (!PRIVATE_KEY) {
            throw new Error('PRIVATE_KEY not found in .env file');
        }
        
        // Test provider connection
        console.log('\n🔌 Testing Provider Connection...');
        const provider = new ethers.JsonRpcProvider(RPC_URL);
        const network = await provider.getNetwork();
        console.log(`✅ Connected to ${network.name} (Chain ID: ${network.chainId})`);
        
        // Test wallet
        console.log('\n👛 Testing Wallet...');
        const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
        console.log(`✅ Wallet Address: ${wallet.address}`);
        
        const balance = await provider.getBalance(wallet.address);
        const ethBalance = ethers.formatEther(balance);
        console.log(`💰 Balance: ${ethBalance} ETH`);
        
        if (parseFloat(ethBalance) === 0) {
            console.log('⚠️  Warning: Wallet has 0 ETH. Get test ETH from faucet if using testnet.');
        }
        
        // Test contract artifacts
        console.log('\n📋 Testing Contract Artifacts...');
        try {
            const contractArtifact = require('./blockchain/artifacts/contracts/OrderTracking.sol/OrderTracking.json');
            console.log('✅ Contract ABI loaded successfully');
            console.log(`📊 Contract has ${contractArtifact.abi.length} functions/events`);
        } catch (error) {
            throw new Error('Contract artifacts not found. Please run: cd blockchain && npm run compile');
        }
        
        // Test contract connection (if address provided)
        if (CONTRACT_ADDRESS) {
            console.log('\n🔗 Testing Contract Connection...');
            const contractArtifact = require('./blockchain/artifacts/contracts/OrderTracking.sol/OrderTracking.json');
            const contract = new ethers.Contract(CONTRACT_ADDRESS, contractArtifact.abi, wallet);
            
            // Test contract call
            try {
                const totalOrders = await contract.totalOrders();
                console.log(`✅ Contract connected! Total orders: ${totalOrders}`);
                
                // Test if user is admin
                const isAdmin = await contract.authorizedAdmins(wallet.address);
                console.log(`👤 Is Admin: ${isAdmin ? 'Yes ✅' : 'No ❌'}`);
                
            } catch (error) {
                console.log(`⚠️  Contract exists but call failed: ${error.message.substring(0, 100)}`);
            }
        } else {
            console.log('\n⚠️  Contract address not set. Deploy contract first:');
            console.log('   cd blockchain && npm run deploy:sepolia');
        }
        
        // Summary
        console.log('\n✅ ===============================');
        console.log('✅ BASIC CONNECTION TEST PASSED!');
        console.log('✅ ===============================');
        
        console.log('\n📋 Summary:');
        console.log(`   🌐 Network: ${network.name}`);
        console.log(`   💰 Balance: ${ethBalance} ETH`);
        console.log(`   📋 Contract: ${CONTRACT_ADDRESS ? 'Connected ✅' : 'Not deployed ⚠️'}`);
        
        console.log('\n🚀 Next Steps:');
        if (!CONTRACT_ADDRESS) {
            console.log('   1. Deploy contract: cd blockchain && npm run deploy:sepolia');
        }
        if (parseFloat(ethBalance) === 0) {
            console.log('   2. Get test ETH: https://sepoliafaucet.com/');
        }
        console.log('   3. Test full integration: node integration/metamaskSetup.js');
        
        return true;
        
    } catch (error) {
        console.error('\n❌ ===============================');
        console.error('❌ BASIC CONNECTION TEST FAILED!');
        console.error('❌ ===============================');
        console.error(`Error: ${error.message}`);
        
        // Troubleshooting suggestions
        console.log('\n🔧 Troubleshooting:');
        if (error.message.includes('PRIVATE_KEY')) {
            console.log('   - Add PRIVATE_KEY to .env file');
        }
        if (error.message.includes('Contract artifacts')) {
            console.log('   - Run: cd blockchain && npm run compile');
        }
        if (error.message.includes('connect')) {
            console.log('   - Check RPC_URL in .env file');
            console.log('   - Verify internet connection');
        }
        
        return false;
    }
}

async function testQuickOrder() {
    if (!CONTRACT_ADDRESS) {
        console.log('\n⚠️  Skipping order test - contract not deployed');
        return;
    }
    
    console.log('\n🧪 QUICK ORDER TEST');
    console.log('===================');
    
    try {
        const provider = new ethers.JsonRpcProvider(RPC_URL);
        const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
        const contractArtifact = require('./blockchain/artifacts/contracts/OrderTracking.sol/OrderTracking.json');
        const contract = new ethers.Contract(CONTRACT_ADDRESS, contractArtifact.abi, wallet);
        
        const orderId = `QUICK_TEST_${Date.now()}`;
        const metadataHash = ethers.keccak256(ethers.toUtf8Bytes(`{"test": true, "time": ${Date.now()}}`));
        
        console.log(`📦 Creating test order: ${orderId}`);
        
        // Estimate gas first
        try {
            const gasEstimate = await contract.estimateGas.createOrder(orderId, metadataHash);
            console.log(`⛽ Gas estimate: ${gasEstimate.toString()}`);
        } catch (gasError) {
            console.log('⚠️  Gas estimation failed - might need admin authorization');
            return;
        }
        
        // Create order
        const tx = await contract.createOrder(orderId, metadataHash);
        console.log(`📤 Transaction sent: ${tx.hash}`);
        console.log('⏳ Waiting for confirmation...');
        
        const receipt = await tx.wait();
        console.log(`✅ Order created in block: ${receipt.blockNumber}`);
        
        // Query the order
        const order = await contract.getOrder(orderId);
        console.log(`🔍 Order verified: Status = ${order.currentStatus}`);
        
        console.log('\n✅ QUICK ORDER TEST PASSED! 🎉');
        
    } catch (error) {
        console.log('\n❌ Quick order test failed:');
        console.log(`   Error: ${error.message.substring(0, 150)}`);
        
        if (error.message.includes('not authorized')) {
            console.log('💡 Tip: This wallet might not be authorized as admin');
        }
    }
}

// Main execution
async function main() {
    console.log('🚀 METAMASK INTEGRATION QUICK TEST');
    console.log('===================================\n');
    
    const basicTest = await testBasicConnection();
    
    if (basicTest && CONTRACT_ADDRESS) {
        await testQuickOrder();
    }
    
    console.log('\n🎯 Test completed!');
    console.log('\nFor full testing run: node integration/metamaskSetup.js');
}

if (require.main === module) {
    main().catch(error => {
        console.error('Unexpected error:', error);
        process.exit(1);
    });
}

module.exports = { testBasicConnection, testQuickOrder };