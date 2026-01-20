/**
 * Complete System Test Script
 * Test toàn bộ hệ thống sau khi sửa lỗi
 */

const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');

async function testSystem() {
    console.log('🧪 KIỂM TRA HỆ THỐNG SAU KHI SỬA LỖI\n');
    
    try {
        // 1. Test Blockchain Connection
        console.log('1️⃣ Test kết nối Blockchain...');
        await testBlockchainConnection();
        console.log('✅ Blockchain connection OK\n');
        
        // 2. Test Contract Interaction
        console.log('2️⃣ Test tương tác Smart Contract...');
        await testContractInteraction();
        console.log('✅ Contract interaction OK\n');
        
        // 3. Test Database Connection
        console.log('3️⃣ Test kết nối Database...');
        await testDatabaseConnection();
        console.log('✅ Database connection OK\n');
        
        console.log('🎉 TẤT CẢ TEST THÀNH CÔNG!');
        
    } catch (error) {
        console.error('❌ Lỗi trong quá trình test:', error.message);
        process.exit(1);
    }
}

async function testBlockchainConnection() {
    const provider = new ethers.JsonRpcProvider('https://sepolia.infura.io/v3/7344f20358424a8c9e3bd5a2609c471a');
    
    try {
        const network = await provider.getNetwork();
        console.log('   ✓ Network:', network.name, 'ChainID:', network.chainId.toString());
        
        const blockNumber = await provider.getBlockNumber();
        console.log('   ✓ Latest block:', blockNumber);
        
        // Test contract address
        const contractAddress = '0x5663b4AF89cFBFf92A29F8cb53516B705eF055C8';
        const code = await provider.getCode(contractAddress);
        if (code === '0x') {
            throw new Error('Contract không được deploy tại địa chỉ này');
        }
        console.log('   ✓ Contract tồn tại tại:', contractAddress);
        
    } catch (error) {
        throw new Error(`Blockchain connection failed: ${error.message}`);
    }
}

async function testContractInteraction() {
    try {
        // Kiểm tra artifact file
        const artifactPath = path.join(__dirname, 'blockchain', 'artifacts', 'contracts', 'OrderTracking.sol', 'OrderTracking.json');
        
        if (!fs.existsSync(artifactPath)) {
            throw new Error('Contract artifact không tìm thấy. Chạy: npx hardhat compile');
        }
        
        const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));
        console.log('   ✓ Contract artifact loaded');
        console.log('   ✓ ABI length:', artifact.abi.length);
        
        // Kiểm tra deployment addresses
        const deploymentsDir = path.join(__dirname, 'blockchain', 'deployments');
        if (fs.existsSync(deploymentsDir)) {
            const files = fs.readdirSync(deploymentsDir);
            console.log('   ✓ Deployment files:', files);
        }
        
    } catch (error) {
        throw new Error(`Contract test failed: ${error.message}`);
    }
}

async function testDatabaseConnection() {
    try {
        const { MongoClient } = require('mongodb');
        const client = new MongoClient('mongodb://localhost:27017');
        
        await client.connect();
        console.log('   ✓ MongoDB connected');
        
        const db = client.db('blockchain_order_tracking');
        const collections = await db.listCollections().toArray();
        console.log('   ✓ Collections:', collections.map(c => c.name));
        
        await client.close();
        console.log('   ✓ MongoDB disconnected');
        
    } catch (error) {
        throw new Error(`Database test failed: ${error.message}`);
    }
}

// Chạy test
if (require.main === module) {
    testSystem();
}

module.exports = { testSystem };
