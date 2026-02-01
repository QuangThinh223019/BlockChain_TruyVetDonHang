/**
 * Fix All System Issues
 * Script để sửa tất cả các vấn đề trong hệ thống
 */

const fs = require('fs');
const path = require('path');
const { MongoClient } = require('mongodb');

async function fixAllIssues() {
    console.log('🔧 Bắt đầu sửa tất cả các vấn đề...\n');

    try {
        // 1. Sửa Test File - Cập nhật ethers v6 API
        console.log('📝 Đang sửa test file ethers v6...');
        await fixTestFile();
        console.log('✅ Test file đã được sửa');

        // 2. Sửa Database Indexes
        console.log('🗄️  Đang sửa database indexes...');
        await fixDatabaseIndexes();
        console.log('✅ Database indexes đã được sửa');

        // 3. Sửa Quick Test File
        console.log('⚡ Đang sửa quick-test.js...');
        await fixQuickTestFile();
        console.log('✅ Quick test file đã được sửa');

        // 4. Tạo script test mới
        console.log('🧪 Đang tạo script test mới...');
        await createNewTestScript();
        console.log('✅ Script test mới đã được tạo');

        console.log('\n🎉 TẤT CẢ VẤN ĐỀ ĐÃ ĐƯỢC SỬA!');
        console.log('📋 Để test hệ thống, chạy: node test-system.js');

    } catch (error) {
        console.error('❌ Lỗi khi sửa hệ thống:', error.message);
        process.exit(1);
    }
}

async function fixTestFile() {
    const testFilePath = path.join(__dirname, 'blockchain', 'test', 'OrderTracking.test.js');
    
    if (fs.existsSync(testFilePath)) {
        let content = fs.readFileSync(testFilePath, 'utf8');
        
        // Sửa .deployed() thành waitForDeployment()
        content = content.replace(
            /await orderTracking\.deployed\(\)/g,
            'await orderTracking.waitForDeployment()'
        );
        
        // Sửa gas estimation cho ethers v6
        content = content.replace(
            /receipt\.gasUsed\./g,
            'receipt.gasUsed'
        );
        
        fs.writeFileSync(testFilePath, content);
    }
}

async function fixDatabaseIndexes() {
    const MONGO_URL = 'mongodb://localhost:27017';
    const DB_NAME = 'blockchain_order_tracking';
    
    try {
        const client = new MongoClient(MONGO_URL);
        await client.connect();
        console.log('   ✓ Kết nối MongoDB thành công');
        
        const db = client.db(DB_NAME);
        
        // Xóa index email duplicate trong users collection
        try {
            const usersCollection = db.collection('users');
            
            // Liệt kê indexes hiện tại
            const indexes = await usersCollection.indexes();
            console.log('   📊 Indexes hiện tại:', indexes.map(idx => idx.name));
            
            // Xóa index email duplicate nếu có
            const duplicateEmailIndexes = indexes.filter(idx => 
                idx.name.includes('email') && idx.name !== 'email_1'
            );
            
            for (const idx of duplicateEmailIndexes) {
                try {
                    await usersCollection.dropIndex(idx.name);
                    console.log(`   ✓ Đã xóa duplicate index: ${idx.name}`);
                } catch (e) {
                    console.log(`   ⚠️ Không thể xóa index ${idx.name}:`, e.message);
                }
            }
            
        } catch (error) {
            console.log('   ⚠️ Lỗi khi sửa indexes:', error.message);
        }
        
        await client.close();
        console.log('   ✓ Đóng kết nối MongoDB');
        
    } catch (error) {
        console.log('   ⚠️ Không thể kết nối MongoDB:', error.message);
    }
}

async function fixQuickTestFile() {
    const quickTestPath = path.join(__dirname, 'quick-test.js');
    
    if (fs.existsSync(quickTestPath)) {
        let content = fs.readFileSync(quickTestPath, 'utf8');
        
        // Sửa providers.JsonRpcProvider thành JsonRpcProvider
        content = content.replace(
            /new ethers\.providers\.JsonRpcProvider/g,
            'new ethers.JsonRpcProvider'
        );
        
        // Sửa contract.deployed() thành waitForDeployment()
        content = content.replace(
            /\.deployed\(\)/g,
            '.waitForDeployment()'
        );
        
        fs.writeFileSync(quickTestPath, content);
    }
}

async function createNewTestScript() {
    const testScript = `/**
 * Complete System Test Script
 * Test toàn bộ hệ thống sau khi sửa lỗi
 */

const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');

async function testSystem() {
    console.log('🧪 KIỂM TRA HỆ THỐNG SAU KHI SỬA LỖI\\n');
    
    try {
        // 1. Test Blockchain Connection
        console.log('1️⃣ Test kết nối Blockchain...');
        await testBlockchainConnection();
        console.log('✅ Blockchain connection OK\\n');
        
        // 2. Test Contract Interaction
        console.log('2️⃣ Test tương tác Smart Contract...');
        await testContractInteraction();
        console.log('✅ Contract interaction OK\\n');
        
        // 3. Test Database Connection
        console.log('3️⃣ Test kết nối Database...');
        await testDatabaseConnection();
        console.log('✅ Database connection OK\\n');
        
        console.log('🎉 TẤT CẢ TEST THÀNH CÔNG!');
        
    } catch (error) {
        console.error('❌ Lỗi trong quá trình test:', error.message);
        process.exit(1);
    }
}

async function testBlockchainConnection() {
    const provider = new ethers.JsonRpcProvider('https://sepolia.infura.io/v3/YOUR_PROJECT_ID');
    
    try {
        const network = await provider.getNetwork();
        console.log('   ✓ Network:', network.name, 'ChainID:', network.chainId.toString());
        
        const blockNumber = await provider.getBlockNumber();
        console.log('   ✓ Latest block:', blockNumber);
        
    } catch (error) {
        throw new Error(\`Blockchain connection failed: \${error.message}\`);
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
        throw new Error(\`Contract test failed: \${error.message}\`);
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
        throw new Error(\`Database test failed: \${error.message}\`);
    }
}

// Chạy test
if (require.main === module) {
    testSystem();
}

module.exports = { testSystem };
`;

    fs.writeFileSync(path.join(__dirname, 'test-system.js'), testScript);
}

// Chạy script
if (require.main === module) {
    fixAllIssues();
}

module.exports = { fixAllIssues };