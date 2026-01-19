# ⚡ Quick Start Guide

Hướng dẫn nhanh để bắt đầu phát triển ngay hôm nay!

---

## 📥 1. Cài Đặt Lần Đầu (5 phút)

### 1.1 Cài đặt Dependencies
```bash
# Smart Contract
cd blockchain
npm install

# Database
cd ../database
npm install
```

### 1.2 Tạo .env file
```bash
# Ở thư mục gốc (BlockChain_TruyVetDonHang)
cp .env.example .env

# Chỉnh sửa .env - THIẾT LẬP CÁC GIÁ TRỊ SAU:
# PRIVATE_KEY=0x...          (private key của wallet)
# RPC_URL=http://localhost:8545  (cho local development)
# MONGODB_URI=mongodb://localhost:27017/order-tracking
```

---

## 💻 2. Chạy Trên Local (15 phút)

### Step 1: Start MongoDB
```bash
# Tùy OS của bạn
# Windows: mongod
# Mac: brew services start mongodb-community
# Linux: sudo systemctl start mongod

# Kiểm tra MongoDB chạy
mongo  # hoặc mongosh
> db.version()
```

### Step 2: Setup Database
```bash
cd database
npm run setup:db
```

**Output nên là:**
```
✅ Connected to MongoDB
📝 Creating collections and indexes...
✅ Order indexes created
✅ StatusLog indexes created
... (các collections khác)
✅ Database setup completed successfully!
```

### Step 3: Start Local Blockchain
```bash
cd blockchain
npm run node
```

**Output nên là:**
```
> hardhat node

Started HTTP and WebSocket JSON-RPC server at http://127.0.0.1:8545/
...
Account #0: 0x1234... (ETH: 10000)
```

### Step 4: Deploy Smart Contract (Terminal mới)
```bash
cd blockchain
npm run deploy:local
```

**Output nên là:**
```
🚀 Deploying OrderTracking contract...
📍 Deploying with account: 0x...
💰 Account balance: 10000.0 ETH
...
✅ OrderTracking deployed to: 0x5FbDB2315...
```

**📌 LƯU ĐỊA CHỈ CONTRACT!**

### Step 5: Cập nhật .env
```env
CONTRACT_ADDRESS=0x5FbDB2315...  # Dán địa chỉ từ output ở trên
```

### Step 6: Start Event Listener (Terminal mới)
```bash
cd database
npm start
```

**Output nên là:**
```
🚀 Starting Blockchain Event Listener...
🔌 Connecting to MongoDB...
✅ MongoDB connected
🔌 Connecting to Blockchain...
✅ Blockchain connected
👂 Listening for events...
```

---

## 🧪 3. Kiểm Tra Hoạt Động

### 3.1 Chạy Tests
```bash
cd blockchain
npm test
```

Tất cả test nên **PASS** ✅

### 3.2 Tạo Đơn Hàng Test
```bash
# Dùng Hardhat console
cd blockchain
npx hardhat console --network localhost

# Trong console:
> const OrderTracking = await ethers.getContractFactory("OrderTracking");
> const contract = await OrderTracking.attach("0x5FbDB2315...");
> await contract.createOrder("ORDER-TEST-001", "QmIPFSHash...");
```

### 3.3 Kiểm Tra MongoDB
```bash
# Terminal mới
mongo

> use order-tracking
> db.orders.find()
> db.blockchainEvents.find()
```

**Bạn sẽ thấy:**
```javascript
{
  orderId: "ORDER-TEST-001",
  status: "CREATED",
  ...
}
```

---

## 📁 4. File Cấu Trúc

```
BlockChain_TruyVetDonHang/
├── blockchain/
│   ├── contracts/OrderTracking.sol       👈 Smart Contract
│   ├── scripts/deploy.js                 👈 Deploy Script
│   ├── test/OrderTracking.test.js        👈 Tests
│   ├── hardhat.config.js
│   └── package.json
│
├── database/
│   ├── schemas/
│   │   ├── mongodb-schema.js             👈 MongoDB Design
│   │   └── models.js                     👈 Mongoose Models
│   ├── scripts/
│   │   ├── setupDatabase.js              👈 DB Init
│   │   └── seedDatabase.js               👈 Sample Data
│   └── package.json
│
├── integration/
│   └── blockchainListener.js             👈 Event Listener
│
├── .env.example                          👈 Config Template
├── README_BLOCKCHAIN_DATABASE.md         👈 Full Docs
├── DEPLOYMENT_CHECKLIST.md               👈 Deploy Guide
├── ROADMAP.md                            👈 Development Plan
└── QUICK_START.md                        👈 This file
```

---

## 🔑 5. Các Lệnh Thường Dùng

### Smart Contract
```bash
cd blockchain

# Compile
npm run compile

# Test
npm test

# Local deployment
npm run deploy:local

# Sepolia testnet deployment
npm run deploy:sepolia

# Verify on Etherscan
npm run verify:sepolia

# Flatten contract
npm run flatten
```

### Database
```bash
cd database

# Setup DB
npm run setup:db

# Seed sample data
npm run seed:db

# Start event listener
npm start

# Development mode
npm run dev
```

---

## 🚨 6. Troubleshooting

### ❌ "Contract not found"
```bash
# Kiểm tra:
1. CONTRACT_ADDRESS đúng trong .env?
2. Local node vẫn chạy?
3. Deploy command chạy thành công?
```

### ❌ "MongoDB connection failed"
```bash
# Kiểm tra:
1. MongoDB service đang chạy?
   - Windows: Services → MongoDB
   - Mac: brew services list | grep mongo
   
2. Connection string đúng?
   MONGODB_URI=mongodb://localhost:27017/order-tracking
```

### ❌ "Event not captured"
```bash
# Kiểm tra:
1. Event listener vẫn chạy?
2. Contract address đúng?
3. Private key đúng?
4. MongoDB connected?
```

---

## 📊 7. Testing Workflow

### Workflow Đầy Đủ:
```
1. Tạo Order trên Blockchain
   ↓
2. Smart Contract emit OrderCreated event
   ↓
3. Event Listener captures event
   ↓
4. Data saved to MongoDB
   ↓
5. Backend API truy vấn MongoDB
   ↓
6. Frontend display order
```

### Test Bằng Code:
```javascript
// 1. Create order
await contract.createOrder("ORDER-001", "hash");

// 2. Check blockchain
const order = await contract.getOrder("ORDER-001");
console.log(order);

// 3. Check MongoDB (sau 1-2 giây)
const mongoOrder = await Order.findOne({ orderId: "ORDER-001" });
console.log(mongoOrder);

// 4. Check events
const events = await BlockchainEvent.find({ orderId: "ORDER-001" });
console.log(events);
```

---

## 🎯 8. Next Steps

Sau khi setup xong:

1. **Read Documentation**
   - [README_BLOCKCHAIN_DATABASE.md](README_BLOCKCHAIN_DATABASE.md)
   - [ROADMAP.md](ROADMAP.md)

2. **Explore Smart Contract**
   - Xem file `blockchain/contracts/OrderTracking.sol`
   - Hiểu functions: createOrder, updateStatus, getOrderHistory

3. **Explore Database**
   - Xem file `database/schemas/models.js`
   - Hiểu 7 collections

4. **Explore Integration**
   - Xem file `integration/blockchainListener.js`
   - Hiểu event listener logic

5. **Implement Features**
   - Thêm functions vào smart contract
   - Thêm collections vào MongoDB
   - Update event listener

---

## 📞 7. Cần Giúp?

**Xem các file:**
- ❓ Làm sao deploy? → [DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md)
- ❓ API làm sao? → [README_BLOCKCHAIN_DATABASE.md](README_BLOCKCHAIN_DATABASE.md#-api-response-examples)
- ❓ Tiếp theo là gì? → [ROADMAP.md](ROADMAP.md)

---

## ✅ Checklist Hoàn Thành Setup

- [ ] Node.js và npm cài đặt
- [ ] MongoDB cài đặt
- [ ] Repository clone
- [ ] Dependencies cài `npm install`
- [ ] .env file tạo
- [ ] MongoDB connected
- [ ] Local blockchain node chạy
- [ ] Smart contract deployed
- [ ] Event listener chạy
- [ ] Tests pass
- [ ] Sample order created
- [ ] Data synced to MongoDB

---

**Chúc mừng! 🎉 Bây giờ bạn có thể bắt đầu phát triển!**

---

**Time to Setup:** ~30 phút  
**Difficulty:** ⭐⭐☆☆☆ (Intermediate)  
**Last Updated:** January 19, 2024
