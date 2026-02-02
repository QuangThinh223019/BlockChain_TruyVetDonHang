/**
 * Create Test Order Script
 */

const axios = require('axios');
require('dotenv').config();

const API_BASE_URL = 'http://localhost:3000';

async function createTestOrder() {
    console.log('\n========================================');
    console.log('🚀 CREATING TEST ORDER');
    console.log('========================================\n');

    const newOrder = {
        id: 'ORD-' + Date.now() + '-TEST',
        customerId: 'CUST-12345',
        items: [
            {
                name: 'Product A',
                quantity: 2,
                price: 100000
            }
        ],
        totalAmount: 200000,
        status: 'pending',
        shippingAddress: '123 Main Street, Hanoi, Vietnam',
        notes: 'Test order for tracking'
    };

    try {
        console.log('📋 Creating order with data:');
        console.log(JSON.stringify(newOrder, null, 2));
        console.log('\n');

        const response = await axios.post(`${API_BASE_URL}/api/orders`, newOrder, {
            headers: {
                'Content-Type': 'application/json'
            },
            timeout: 30000
        });

        console.log('✅ Order created successfully!');
        console.log('📊 Response:', JSON.stringify(response.data, null, 2));
        
        console.log('\n📝 New Order ID:', newOrder.id);
        console.log('🔗 You can now track this order using the ID above');

    } catch (error) {
        if (error.response) {
            console.log('❌ API Error:', error.response.status);
            console.log('   Message:', error.response.data?.message || JSON.stringify(error.response.data));
        } else {
            console.log('❌ Error:', error.message);
        }
    }

    console.log('\n========================================\n');
    process.exit(0);
}

setTimeout(createTestOrder, 2000);
