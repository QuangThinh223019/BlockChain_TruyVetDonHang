/**
 * Blockchain Event Listener & MongoDB Sync
 * Lắng nghe events từ blockchain và lưu vào MongoDB
 */

const ethers = require('ethers');
const mongoose = require('mongoose');
require('dotenv').config();

const { BlockchainEvent, Order, StatusLog, AuditLog } = require('../schemas/models');

// ==================== CONFIGURATION ====================

const RPC_URL = process.env.RPC_URL || "http://localhost:8545";
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS || "";
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/order-tracking";
const PRIVATE_KEY = process.env.PRIVATE_KEY || "";

// ABI của contract
const CONTRACT_ABI = [
  "event OrderCreated(string indexed orderId, address indexed admin, uint256 timestamp, string metadataHash)",
  "event OrderStatusUpdated(string indexed orderId, string newStatus, uint256 timestamp, string detailsHash, address indexed updatedBy)",
  "event OrderCancelled(string indexed orderId, uint256 timestamp)",
  "function getOrder(string memory _orderId) view returns (tuple(string orderId, address adminAddress, uint256 createdAt, string currentStatus, string metadataHash, uint256 lastUpdated, bool isActive) memory)"
];

// ==================== INITIALIZE ====================

async function initializeConnection() {
  try {
    // Kết nối MongoDB
    console.log("🔌 Connecting to MongoDB...");
    await mongoose.connect(MONGODB_URI);
    console.log("✅ MongoDB connected");

    // Kết nối Blockchain
    console.log("🔌 Connecting to Blockchain...");
    const provider = new ethers.providers.JsonRpcProvider(RPC_URL);
    const signer = new ethers.Wallet(PRIVATE_KEY, provider);
    const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);

    console.log("✅ Blockchain connected");
    console.log(`📍 Contract Address: ${CONTRACT_ADDRESS}`);
    console.log(`📍 Provider: ${RPC_URL}`);

    return { provider, contract, signer };
  } catch (error) {
    console.error("❌ Connection failed:", error.message);
    process.exit(1);
  }
}

// ==================== EVENT LISTENERS ====================

async function listenToOrderCreated(contract, provider) {
  contract.on("OrderCreated", async (orderId, admin, timestamp, metadataHash, event) => {
    console.log(`\n📝 OrderCreated Event: ${orderId}`);
    console.log(`   Admin: ${admin}`);
    console.log(`   Tx: ${event.transactionHash}`);

    try {
      // Lưu event vào MongoDB
      const blockchainEvent = new BlockchainEvent({
        eventName: "OrderCreated",
        orderId,
        transactionHash: event.transactionHash,
        blockNumber: event.blockNumber,
        blockTimestamp: new Date(timestamp.toNumber() * 1000),
        from: admin,
        eventData: {
          metadataHash,
          admin
        }
      });

      await blockchainEvent.save();
      console.log("✅ Event saved to MongoDB");

      // Cập nhật Order collection
      await Order.findOneAndUpdate(
        { orderId },
        {
          orderId,
          adminAddress: admin,
          createdAt: new Date(timestamp.toNumber() * 1000),
          status: "CREATED",
          blockchainHash: metadataHash,
          updatedAt: new Date()
        },
        { upsert: true, new: true }
      );

      console.log("✅ Order updated in MongoDB");

      // Ghi nhận audit log
      const auditLog = new AuditLog({
        action: "ORDER_CREATED",
        actor: admin.toLowerCase(),
        orderId,
        details: { blockNumber: event.blockNumber, txHash: event.transactionHash },
        timestamp: new Date(timestamp.toNumber() * 1000)
      });

      await auditLog.save();
      console.log("✅ Audit log created");

    } catch (error) {
      console.error("❌ Error processing OrderCreated event:", error.message);
    }
  });
}

async function listenToOrderStatusUpdated(contract, provider) {
  contract.on("OrderStatusUpdated", async (orderId, newStatus, timestamp, detailsHash, updatedBy, event) => {
    console.log(`\n📝 OrderStatusUpdated Event: ${orderId}`);
    console.log(`   New Status: ${newStatus}`);
    console.log(`   Updated By: ${updatedBy}`);
    console.log(`   Tx: ${event.transactionHash}`);

    try {
      // Lưu event vào blockchain_events collection
      const blockchainEvent = new BlockchainEvent({
        eventName: "OrderStatusUpdated",
        orderId,
        transactionHash: event.transactionHash,
        blockNumber: event.blockNumber,
        blockTimestamp: new Date(timestamp.toNumber() * 1000),
        from: updatedBy,
        eventData: {
          newStatus,
          detailsHash,
          updatedBy
        }
      });

      await blockchainEvent.save();
      console.log("✅ Event saved to MongoDB");

      // Tạo status log
      const statusLog = new StatusLog({
        orderId,
        status: newStatus,
        timestamp: new Date(timestamp.toNumber() * 1000),
        blockchainTxHash: event.transactionHash,
        updatedBy: updatedBy.toLowerCase()
      });

      await statusLog.save();
      console.log("✅ Status log created");

      // Cập nhật Order
      const updatedOrder = await Order.findOneAndUpdate(
        { orderId },
        {
          status: newStatus,
          blockchainHash: detailsHash,
          updatedAt: new Date(timestamp.toNumber() * 1000)
        },
        { new: true }
      );

      console.log("✅ Order updated");

      // Audit log
      const auditLog = new AuditLog({
        action: "ORDER_STATUS_UPDATED",
        actor: updatedBy.toLowerCase(),
        orderId,
        details: {
          newStatus,
          blockNumber: event.blockNumber,
          txHash: event.transactionHash
        },
        timestamp: new Date(timestamp.toNumber() * 1000)
      });

      await auditLog.save();
      console.log("✅ Audit log created");

    } catch (error) {
      console.error("❌ Error processing OrderStatusUpdated event:", error.message);
    }
  });
}

async function listenToOrderCancelled(contract, provider) {
  contract.on("OrderCancelled", async (orderId, timestamp, event) => {
    console.log(`\n📝 OrderCancelled Event: ${orderId}`);
    console.log(`   Tx: ${event.transactionHash}`);

    try {
      // Lưu event
      const blockchainEvent = new BlockchainEvent({
        eventName: "OrderCancelled",
        orderId,
        transactionHash: event.transactionHash,
        blockNumber: event.blockNumber,
        blockTimestamp: new Date(timestamp.toNumber() * 1000),
        eventData: {
          cancelled: true
        }
      });

      await blockchainEvent.save();
      console.log("✅ Event saved to MongoDB");

      // Cập nhật Order
      await Order.findOneAndUpdate(
        { orderId },
        {
          status: "CANCELLED",
          updatedAt: new Date(timestamp.toNumber() * 1000)
        }
      );

      console.log("✅ Order cancelled in MongoDB");

      // Tạo status log
      const statusLog = new StatusLog({
        orderId,
        status: "CANCELLED",
        timestamp: new Date(timestamp.toNumber() * 1000),
        blockchainTxHash: event.transactionHash
      });

      await statusLog.save();
      console.log("✅ Status log created");

    } catch (error) {
      console.error("❌ Error processing OrderCancelled event:", error.message);
    }
  });
}

// ==================== SYNC HISTORICAL DATA ====================

async function syncHistoricalEvents(contract, provider) {
  try {
    console.log("\n📚 Syncing historical events...");

    // Lấy deployment block (hoặc khởi đầu từ block nào đó)
    const startBlock = process.env.START_BLOCK || 0;
    const currentBlock = await provider.getBlockNumber();

    console.log(`Syncing blocks ${startBlock} to ${currentBlock}`);

    // Query các sự kiện cũ
    const filters = [
      contract.filters.OrderCreated(),
      contract.filters.OrderStatusUpdated(),
      contract.filters.OrderCancelled()
    ];

    for (const filter of filters) {
      try {
        const events = await contract.queryFilter(filter, startBlock, currentBlock);
        console.log(`Found ${events.length} events with filter`);

        for (const event of events) {
          // Kiểm tra xem đã tồn tại chưa
          const existingEvent = await BlockchainEvent.findOne({
            transactionHash: event.transactionHash
          });

          if (!existingEvent) {
            // Xử lý event
            const blockchainEvent = new BlockchainEvent({
              eventName: event.event,
              orderId: event.args.orderId || event.args[0],
              transactionHash: event.transactionHash,
              blockNumber: event.blockNumber,
              blockTimestamp: new Date((await provider.getBlock(event.blockNumber)).timestamp * 1000),
              from: event.args.admin || event.args.updatedBy || event.address,
              eventData: event.args
            });

            await blockchainEvent.save();
            console.log(`✅ Synced ${event.event} for order ${event.args.orderId || event.args[0]}`);
          }
        }
      } catch (error) {
        console.error(`Error syncing events: ${error.message}`);
      }
    }

    console.log("✅ Historical sync completed");
  } catch (error) {
    console.error("❌ Historical sync failed:", error.message);
  }
}

// ==================== MAIN ====================

async function main() {
  console.log("🚀 Starting Blockchain Event Listener...\n");

  const { provider, contract, signer } = await initializeConnection();

  // Sync lịch sử
  await syncHistoricalEvents(contract, provider);

  // Lắng nghe events mới
  console.log("\n👂 Listening for events...");
  await listenToOrderCreated(contract, provider);
  await listenToOrderStatusUpdated(contract, provider);
  await listenToOrderCancelled(contract, provider);

  console.log("✅ Event listeners active\n");

  // Keep running
  process.on("SIGINT", async () => {
    console.log("\n🛑 Shutting down...");
    await mongoose.disconnect();
    process.exit(0);
  });
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
