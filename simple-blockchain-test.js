/**
 * Simple Blockchain Test
 * Test đơn giản để kiểm tra kết nối blockchain
 */

const { ethers } = require('ethers');
require('dotenv').config();

async function testBlockchain() {
    console.log('🧪 SIMPLE BLOCKCHAIN TEST\n');

    try {
        // 1. Connect to blockchain
        console.log('1️⃣ Kết nối Blockchain...');
        const provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL);
        const signer = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
        
        console.log('✅ Provider connected');
        console.log('📍 Address:', signer.address);
        
        // 2. Check balance
        const balance = await provider.getBalance(signer.address);
        console.log('💰 Balance:', ethers.formatEther(balance), 'ETH');
        
        // 3. Load contract
        console.log('\n2️⃣ Kết nối Smart Contract...');
        const contractArtifact = require('./blockchain/artifacts/contracts/OrderTracking.sol/OrderTracking.json');
        const contract = new ethers.Contract(
            process.env.CONTRACT_ADDRESS,
            contractArtifact.abi,
            signer
        );
        
        console.log('✅ Contract loaded:', process.env.CONTRACT_ADDRESS);
        
        // 4. Test contract read
        const totalOrders = await contract.totalOrders();
        const isAdmin = await contract.isAdminAuthorized(signer.address);
        
        console.log('📊 Total Orders:', totalOrders.toString());
        console.log('👤 Is Admin:', isAdmin);
        
        // 5. Create test order (if admin)
        if (isAdmin) {
            console.log('\n3️⃣ Tạo Order Test...');
            const orderId = `SIMPLE_TEST_${Date.now()}`;
            const metadataHash = ethers.keccak256(ethers.toUtf8Bytes(JSON.stringify({
                name: 'Test Product',
                timestamp: Date.now()
            })));
            
            console.log('📦 Creating order:', orderId);
            const tx = await contract.createOrder(orderId, metadataHash);
            console.log('⏳ Waiting for confirmation...');
            
            const receipt = await tx.wait();
            console.log('✅ Order created in block:', receipt.blockNumber);
            console.log('🔗 Transaction:', tx.hash);
            
            // Verify order exists
            const order = await contract.getOrder(orderId);
            console.log('📋 Order status:', order.currentStatus);
        }
        
        console.log('\n🎉 TẤT CẢ TEST THÀNH CÔNG!');
        console.log('🚀 Hệ thống blockchain sẵn sàng!');
        
    } catch (error) {
        console.error('❌ Lỗi:', error.message);
        process.exit(1);
    }
}

// Chạy test
testBlockchain();