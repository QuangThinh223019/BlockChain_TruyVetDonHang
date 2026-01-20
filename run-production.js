/**
 * RUN PRODUCTION SYSTEM
 * Chạy hệ thống production blockchain order tracking
 */

const ProductionOrderTracking = require('./production-system');

async function runSystem() {
    console.log('🚀 KHỞI ĐỘNG TOÀN BỘ HỆ THỐNG BLOCKCHAIN ORDER TRACKING');
    console.log('=' .repeat(60));
    console.log('📅 Date:', new Date().toLocaleString('vi-VN'));
    console.log('🌐 Network: Sepolia Testnet');
    console.log('=' .repeat(60));

    const system = new ProductionOrderTracking();
    
    if (!await system.initialize()) {
        console.error('❌ System initialization failed');
        process.exit(1);
    }

    // Show system status
    await system.showSystemStatus();

    // Demo: Create new order
    console.log('\n🛍️ TẠO ĐƠN HÀNG MỚI');
    console.log('=' .repeat(50));

    const newOrder = {
        orderId: `ORDER_${Date.now()}`,
        productInfo: {
            name: 'MacBook Pro M3 Max',
            description: 'MacBook Pro 16-inch M3 Max 1TB Space Black',
            quantity: 1,
            price: 89990000, // VND
            category: 'Laptops',
            sku: 'MBPM3MAX16TB',
            supplier: 'Apple Vietnam',
            warranty: '24 months',
            weight: '2.1kg',
            dimensions: '35.57 x 24.81 x 1.68 cm'
        }
    };

    try {
        // Create order
        console.log('📦 Creating order:', newOrder.orderId);
        const createResult = await system.createOrder(
            newOrder.orderId, 
            newOrder.productInfo
        );

        console.log('\n⏰ Waiting 5 seconds...');
        await new Promise(resolve => setTimeout(resolve, 5000));

        // Update through order lifecycle
        const orderLifecycle = [
            { 
                status: 'PROCESSING', 
                details: 'Order confirmed and payment verified. Preparing for shipment.' 
            },
            { 
                status: 'SHIPPED', 
                details: 'Package shipped via Viettel Post Express. Tracking: VTP123456789' 
            },
            { 
                status: 'DELIVERED', 
                details: 'Package delivered successfully to customer at Ho Chi Minh City' 
            }
        ];

        for (const { status, details } of orderLifecycle) {
            console.log(`\n⏰ Waiting 3 seconds before updating to ${status}...`);
            await new Promise(resolve => setTimeout(resolve, 3000));
            
            await system.updateOrderStatus(newOrder.orderId, status, details);
        }

        // Final verification
        console.log('\n⏰ Waiting 5 seconds for final verification...');
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        console.log('\n🔍 KIỂM TRA KẾT QUẢ CUỐI CÙNG');
        console.log('=' .repeat(50));
        await system.getOrder(newOrder.orderId);

        // System statistics
        await system.showSystemStatus();

        console.log('\n🎉 TOÀN BỘ HỆ THỐNG HOẠT ĐỘNG THÀNH CÔNG!');
        console.log('🔗 Transaction details có thể xem tại: https://sepolia.etherscan.io/');
        console.log('💾 Dữ liệu đã được lưu vào MongoDB');
        console.log('📊 Blockchain events đang được theo dõi real-time');
        console.log('✅ Hệ thống sẵn sàng cho production!');

    } catch (error) {
        console.error('❌ System execution failed:', error.message);
        process.exit(1);
    }
}

// Run the complete system
runSystem().catch(console.error);