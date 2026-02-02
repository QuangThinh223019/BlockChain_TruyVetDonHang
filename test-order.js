/**
 * Test Order: ORD-1770012275498-3917
 */

const axios = require('axios');
const { ethers } = require('ethers');
require('dotenv').config();

const API_BASE_URL = 'http://localhost:3000';
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS || process.env.SEPOLIA_CONTRACT_ADDRESS;
const RPC_URL = process.env.SEPOLIA_RPC_URL || 'http://localhost:8545';

const orderId = 'ORD-1770012275498-3917';

async function testOrder() {
    console.log('\n========================================');
    console.log('🧪 TESTING ORDER:', orderId);
    console.log('========================================\n');

    try {
        // 1. Test API endpoint
        console.log('1️⃣  Testing API endpoint...');
        try {
            const response = await axios.get(`${API_BASE_URL}/api/orders/${orderId}`, {
                timeout: 5000
            });
            console.log('✅ API Response:', JSON.stringify(response.data, null, 2));
        } catch (error) {
            if (error.response?.status === 404) {
                console.log('❌ Order not found in API (404)');
                console.log('   Message:', error.response.data?.message || 'Not found');
            } else {
                console.log('❌ API Error:', error.message);
            }
        }

        // 2. Check Blockchain directly
        console.log('\n2️⃣  Checking Blockchain...');
        const provider = new ethers.JsonRpcProvider(RPC_URL);
        const contractArtifact = require('./blockchain/artifacts/contracts/OrderTracking.sol/OrderTracking.json');
        const contract = new ethers.Contract(CONTRACT_ADDRESS, contractArtifact.abi, provider);

        try {
            const order = await contract.getOrder(orderId);
            console.log('✅ Blockchain Result:', {
                id: order[0],
                customerId: order[1],
                status: order[2],
                createdAt: new Date(Number(order[3]) * 1000).toISOString(),
                updatedAt: new Date(Number(order[4]) * 1000).toISOString()
            });
        } catch (error) {
            if (error.reason === 'Order does not exist') {
                console.log('❌ Order does NOT exist on blockchain');
                console.log('   The order ID has not been registered yet.');
            } else {
                console.log('❌ Blockchain Error:', error.message);
            }
        }

        // 3. Check Health
        console.log('\n3️⃣  Checking System Health...');
        try {
            const health = await axios.get(`${API_BASE_URL}/api/health`, { timeout: 5000 });
            console.log('✅ System Status:', health.data);
        } catch (error) {
            console.log('❌ Health check failed:', error.message);
        }

        // 4. Get Stats
        console.log('\n4️⃣  Checking System Statistics...');
        try {
            const stats = await axios.get(`${API_BASE_URL}/api/stats`, { timeout: 5000 });
            console.log('✅ Statistics:', JSON.stringify(stats.data, null, 2));
        } catch (error) {
            console.log('❌ Stats Error:', error.message);
        }

    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }

    console.log('\n========================================');
    console.log('✅ Test completed');
    console.log('========================================\n');
    
    process.exit(0);
}

// Wait for API to be ready
setTimeout(testOrder, 2000);
