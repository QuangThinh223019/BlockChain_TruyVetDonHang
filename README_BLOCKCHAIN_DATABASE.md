# 🔗 Hệ Thống Truy Vết Đơn Hàng - Blockchain

Hệ thống truy vết đơn hàng sử dụng Blockchain (Smart Contract Solidity) + Off-chain Database (MongoDB + IPFS).

**Vai trò:** Blockchain + Database Management  
**Ngôn ngữ:** Solidity, JavaScript/Node.js  
**Công nghệ:** Hardhat, Ethers.js, Mongoose, MongoDB  

---

## 📋 Mục Lục

1. [Cấu Trúc Dự Án](#cấu-trúc-dự-án)
2. [Yêu Cầu Hệ Thống](#yêu-cầu-hệ-thống)
3. [Hướng Dẫn Cài Đặt](#hướng-dẫn-cài-đặt)
4. [Smart Contract](#smart-contract)
5. [Database Layer](#database-layer)
6. [Integration & Event Listener](#integration--event-listener)
7. [Deployment](#deployment)
8. [Testing](#testing)
9. [Các Lệnh Hữu Ích](#các-lệnh-hữu-ích)

---

## 📁 Cấu Trúc Dự Án

```
BlockChain_TruyVetDonHang/
├── blockchain/                          # Smart Contract Layer
│   ├── contracts/
│   │   └── OrderTracking.sol           # Main Smart Contract
│   ├── scripts/
│   │   └── deploy.js                   # Deployment Script
│   ├── test/
│   │   └── OrderTracking.test.js       # Unit Tests
│   ├── hardhat.config.js               # Hardhat Configuration
│   ├── package.json
│   └── artifacts/                      # Generated (ABI, bytecode)
│
├── database/                            # Off-chain Database Layer
│   ├── schemas/
│   │   ├── mongodb-schema.js           # MongoDB Schema Definition
│   │   └── models.js                   # Mongoose Models
│   ├── scripts/
│   │   ├── setupDatabase.js            # Initialize DB
│   │   ├── seedDatabase.js             # Sample Data
│   │   └── createIndexes.js            # Create Indexes
│   └── package.json
│
├── integration/                         # Blockchain-Database Bridge
│   └── blockchainListener.js           # Event Listener & Sync
│
├── .env.example                        # Environment Variables Template
└── README.md                           # Documentation
```

---

## 🛠️ Yêu Cầu Hệ Thống

### Phần Mềm
- **Node.js** v16+ và npm/yarn
- **MongoDB** v5.0+ (hoặc MongoDB Atlas)
- **Git**

### Địa Chỉ Ví
- Ethereum Wallet (MetaMask, Hardhat account)
- Testnet ETH (cho Sepolia hoặc Mumbai)

### API Keys (tùy chọn cho production)
- **Alchemy API Key** (RPC provider)
- **Etherscan API Key** (contract verification)
- **Pinata API Key** (IPFS)

---

## 🚀 Hướng Dẫn Cài Đặt

### 1️⃣ Clone Repository
```bash
cd BlockChain_TruyVetDonHang
```

### 2️⃣ Cài Đặt Smart Contract Dependencies

```bash
cd blockchain
npm install
```

### 3️⃣ Cài Đặt Database Dependencies

```bash
cd ../database
npm install
```

### 4️⃣ Cấu Hình Environment Variables

```bash
# Ở thư mục gốc
cp .env.example .env

# Chỉnh sửa .env với thông tin của bạn
# - PRIVATE_KEY: Private key của Ethereum wallet
# - RPC_URL: RPC endpoint
# - MONGODB_URI: MongoDB connection string
# - CONTRACT_ADDRESS: Sau khi deploy
```

### 5️⃣ Khởi Tạo MongoDB

```bash
cd database
npm run setup:db
npm run seed:db    # (optional) thêm sample data
```

---

## 📝 Smart Contract

### 🏗️ Thiết Kế

**Contract:** `OrderTracking.sol`

**Data Structures:**
- `Order`: Thông tin đơn hàng (ID, timestamp, status, metadata hash)
- `StatusUpdate`: Lịch sử cập nhật (status, time, details, updater)

**Key Features:**
✅ Tạo đơn hàng  
✅ Cập nhật trạng thái  
✅ Lưu lịch sử bất biến  
✅ Emit events  
✅ Admin authorization  

### 📌 Main Functions

| Function | Mô Tả | Quyền |
|----------|-------|-------|
| `createOrder(orderId, metadataHash)` | Tạo đơn hàng | Admin |
| `updateStatus(orderId, newStatus, detailsHash)` | Cập nhật trạng thái | Admin |
| `cancelOrder(orderId)` | Hủy đơn hàng | Admin |
| `getOrder(orderId)` | Lấy thông tin đơn hàng | Public |
| `getOrderHistory(orderId)` | Lấy lịch sử cập nhật | Public |
| `setAdminAuthorization(address, bool)` | Quản lý quyền admin | Owner |

### 🎯 Events

```solidity
event OrderCreated(string indexed orderId, address indexed admin, uint256 timestamp, string metadataHash);

event OrderStatusUpdated(string indexed orderId, string newStatus, uint256 timestamp, string detailsHash, address indexed updatedBy);

event OrderCancelled(string indexed orderId, uint256 timestamp);

event AdminAuthorizationChanged(address indexed admin, bool isAuthorized);
```

---

## 🗄️ Database Layer

### Collections

| Collection | Mục Đích | Fields Chính |
|-----------|---------|--------------|
| `orders` | Thông tin đơn hàng | orderId, status, recipient, metadata, images |
| `statusLogs` | Lịch sử cập nhật | orderId, status, timestamp, details |
| `ipfsReferences` | Theo dõi file IPFS | ipfsHash, orderId, type, fileName |
| `users` | Người dùng hệ thống | address, role, organization |
| `statistics` | Thống kê | date, totalOrders, deliveredOrders, totalValue |
| `blockchainEvents` | Events từ blockchain | eventName, orderId, txHash, blockNumber |
| `auditLogs` | Ghi nhận hành động | action, actor, timestamp, details |

### Indexes

```javascript
// Tối ưu truy vấn
db.orders.createIndex({ orderId: 1 }, { unique: true });
db.orders.createIndex({ status: 1 });
db.orders.createIndex({ createdAt: -1 });
db.orders.createIndex({ 'recipient.coordinates': '2dsphere' });

db.statusLogs.createIndex({ orderId: 1, timestamp: -1 });

db.blockchainEvents.createIndex({ orderId: 1, blockTimestamp: -1 });
```

---

## 🔌 Integration & Event Listener

### Blockchain Listener (`blockchainListener.js`)

Chương trình này:
1. **Kết nối** đến Smart Contract trên blockchain
2. **Lắng nghe** events: OrderCreated, OrderStatusUpdated, OrderCancelled
3. **Đồng bộ** dữ liệu vào MongoDB
4. **Tạo** audit logs

```bash
# Start listener
cd database
npm start

# Hoặc development mode
npm run dev
```

### Luồng Dữ Liệu

```
Smart Contract Events
        ↓
blockchainListener.js
        ↓
Parse & Process
        ↓
Save to MongoDB:
   - blockchainEvents
   - statusLogs
   - orders (update)
   - auditLogs
```

---

## 🚀 Deployment

### 1️⃣ Deploy lên Local Network (Hardhat)

```bash
cd blockchain

# Terminal 1: Start local blockchain node
npm run node

# Terminal 2: Deploy contract
npm run deploy:local
```

### 2️⃣ Deploy lên Sepolia Testnet

```bash
# 1. Cấu hình .env
# PRIVATE_KEY=0x...
# SEPOLIA_RPC_URL=https://eth-sepolia...

# 2. Deploy
npm run deploy:sepolia
```

### 3️⃣ Deploy lên Mumbai Testnet (Polygon)

```bash
npm run deploy:mumbai
```

### 4️⃣ Lấy Contract ABI

Sau khi compile, ABI sẽ ở:
```
blockchain/artifacts/contracts/OrderTracking.sol/OrderTracking.json
```

Cây frontend sẽ dùng file này để gọi contract.

---

## ✅ Testing

### Chạy Unit Tests

```bash
cd blockchain
npm test
```

### Tests bao gồm:

✅ Admin Authorization  
✅ Create Order  
✅ Update Status  
✅ Cancel Order  
✅ Order History Tracking  
✅ View Functions  
✅ Gas Efficiency  

### Gas Report

```bash
npm run test:gas
```

---

## 📚 Workflow Sử Dụng

### 1️⃣ Frontend tạo đơn hàng

```javascript
// Frontend gọi smart contract
await orderTrackingContract.createOrder(
  "ORDER-001",
  "QmIPFSHash..." // metadata hash
);
```

### 2️⃣ Smart Contract emit event

```solidity
emit OrderCreated("ORDER-001", admin, timestamp, "QmIPFSHash...");
```

### 3️⃣ Blockchain Listener captures event

```javascript
contract.on("OrderCreated", async (orderId, admin, ...) => {
  // Save to MongoDB
  const order = new Order({...});
  await order.save();
});
```

### 4️⃣ Backend query MongoDB

```javascript
const order = await Order.findOne({ orderId: "ORDER-001" });
// Có cả blockchain data + full metadata
```

---

## 🎮 Các Lệnh Hữu Ích

### Smart Contract

```bash
cd blockchain

# Compile
npm run compile

# Test
npm test

# Deploy
npm run deploy:local
npm run deploy:sepolia

# Verify on Etherscan
npm run verify:sepolia

# Flatten contract (cho security audit)
npm run flatten

# Clean artifacts
npm run clean
```

### Database

```bash
cd database

# Setup MongoDB
npm run setup:db

# Add sample data
npm run seed:db

# Start event listener
npm start

# Development mode
npm run dev
```

### Hardhat Console

```bash
cd blockchain

# Connect đến local node
npx hardhat console --network localhost

# Trong console:
const contract = await ethers.getContractAt("OrderTracking", "0x...");
await contract.createOrder("ORDER-001", "hash");
```

---

## 📖 API Response Examples

### Get Order

```javascript
{
  orderId: "ORDER-001",
  adminAddress: "0x742d35Cc6634C0532925a3b844Bc9e7595f42e99",
  createdAt: "2024-01-15T10:30:00Z",
  status: "SHIPPED",
  blockchainHash: "QmAbCdEf...",
  metadata: {
    productName: "Laptop",
    quantity: 1,
    price: 1000,
    totalAmount: 1000
  },
  recipient: {
    name: "Nguyễn Văn A",
    address: "123 Đường Tây Sơn, Hà Nội",
    phone: "0987654321"
  },
  documents: [
    {
      type: "INVOICE",
      ipfsHash: "QmXyz...",
      fileName: "invoice.pdf"
    }
  ],
  updatedAt: "2024-01-16T14:20:00Z"
}
```

---

## 🔐 Security Checklist

- ✅ Private key không commit vào git
- ✅ Use environment variables
- ✅ Validate input dữ liệu
- ✅ Rate limiting trên API
- ✅ Only authorized admins có quyền tạo/update
- ✅ All events được audit log
- ✅ MongoDB data encrypted

---

## 🐛 Troubleshooting

### Contract Deploy Failed

```bash
# Check balance
npx hardhat console --network sepolia
> await ethers.provider.getBalance("0x...")

# Lấy testnet ETH từ faucet
# https://www.sepoliafaucet.com
```

### MongoDB Connection Error

```bash
# Kiểm tra MongoDB running
mongodb://localhost:27017

# Hoặc dùng MongoDB Atlas
mongodb+srv://user:pass@cluster.mongodb.net/db
```

### Event Listener Not Syncing

```bash
# Kiểm tra RPC URL
# Kiểm tra Contract Address
# Kiểm tra MongoDB connection
# Check logs
```

---

## 📞 Support

Liên hệ team blockchain/database nếu có vấn đề.

---

**Last Updated:** January 2024  
**Status:** ✅ Ready for Development
