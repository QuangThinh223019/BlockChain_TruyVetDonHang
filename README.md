# 🔗 Blockchain Order Tracking System

**Hệ thống truy vết đơn hàng hoàn chỉnh với MetaMask integration**

## 🚀 QUICK START

### 1. Setup Tự Động
```bash
# Windows
.\setup-environment.bat

# Linux/Mac  
./setup-environment.sh

# Node.js (Recommended)
node startup.js
```

### 2. Test MetaMask Integration
```bash
# Test complete integration
node integration/metamaskSetup.js
```

## 🦊 MetaMask Setup

### 1. Configure Wallet
- **Private Key**: `bcf3e2fae340102c4ae31ad2277dbdf350f38a2c0dd7d2b008260d8c32daecc1`
- **Sepolia Network**: Chain ID `11155111`  
- **RPC URL**: `https://sepolia.infura.io/v3/7344f20358424a8c9e3bd5a2609c471a`
- **Faucet**: [sepoliafaucet.com](https://sepoliafaucet.com/)

### 2. Contract Information
- **Address**: `0x5663b4AF89cFBFf92A29F8cb53516B705eF055C8`
- **Network**: Sepolia Testnet
- **ABI**: Available trong `blockchain/artifacts/`

## 📊 Database Models

### Core Collections:
1. **Orders** - Thông tin đơn hàng chính
2. **StatusLogs** - Lịch sử cập nhật trạng thái  
3. **Users** - Quản lý người dùng
4. **BlockchainEvents** - Events từ smart contract
5. **IPFSReferences** - File storage references
6. **Statistics** - Thống kê và analytics
7. **AuditLogs** - Audit trail cho security

```javascript
// Example Order Model
{
  orderId: "ORDER_12345",
  adminAddress: "0x1234...",
  status: "SHIPPED", 
  metadata: {
    productName: "iPhone 14",
    quantity: 2,
    price: 999.99
  },
  recipient: {
    name: "John Doe",
    address: "123 Main St",
    coordinates: [106.7017, 10.7769]
  }
}
```

## 🔗 Contract Integration

### Smart Contract Functions:
```javascript
// Create order
await contract.createOrder(orderId, metadataHash);

// Update status  
await contract.updateOrderStatus(orderId, "SHIPPED", detailsHash);

// Query order
const order = await contract.getOrder(orderId);

// Get history
const history = await contract.getOrderHistory(orderId);
```

### Real-time Events:
```javascript
contract.on("OrderCreated", (orderId, admin, timestamp) => {
  console.log(`New order: ${orderId}`);
});

contract.on("OrderStatusUpdated", (orderId, status) => {
  console.log(`${orderId} → ${status}`);
});
```

## 🚀 Development Workflow

```bash
# Terminal 1 - Local Blockchain
cd blockchain && npm run node

# Terminal 2 - Deploy Contract  
cd blockchain && npm run deploy:local

# Terminal 3 - Database Sync
cd database && npm start

# Terminal 4 - Test Integration
node integration/metamaskSetup.js
```

## 🔧 Available Commands

### Blockchain
```bash
cd blockchain
npm run compile      # Compile contracts
npm run test         # Run tests
npm run deploy:local # Deploy locally
npm run deploy:sepolia # Deploy to testnet
npm run node         # Start local chain
```

### Database  
```bash
cd database
npm start            # Start listener
npm run setup:db     # Setup database
npm run seed:db      # Seed test data
```

### Integration
```bash
# Test MetaMask
node integration/metamaskSetup.js

# Start blockchain listener  
node integration/blockchainListener.js

# Complete system startup
node startup.js
```

## 📋 Environment (.env)

```env
# MetaMask Configuration
PRIVATE_KEY=bcf3e2fae340102c4ae31ad2277dbdf350f38a2c0dd7d2b008260d8c32daecc1
CONTRACT_ADDRESS=0x5663b4AF89cFBFf92A29F8cb53516B705eF055C8

# Network URLs
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/7344f20358424a8c9e3bd5a2609c471a
RPC_URL=https://sepolia.infura.io/v3/7344f20358424a8c9e3bd5a2609c471a

# Database
MONGODB_URI=mongodb://localhost:27017/order-tracking
```

## 📂 Project Structure

```
BlockChain_TruyVetDonHang/
├── 🔗 blockchain/
│   ├── contracts/OrderTracking.sol      # Smart contract
│   ├── scripts/deploy.js               # Deploy script  
│   └── test/OrderTracking.test.js      # Tests (40+)
├── 🗄️ database/
│   ├── schemas/models.js               # MongoDB models
│   └── scripts/setupDatabase.js       # DB setup
├── 🔄 integration/
│   ├── blockchainListener.js          # Event listener
│   └── metamaskSetup.js               # MetaMask utils
├── 📋 Setup Scripts/
│   ├── setup-environment.sh           # Linux/Mac setup  
│   ├── setup-environment.bat          # Windows setup
│   └── startup.js                     # Complete startup
├── 📚 Documentation/
│   └── SETUP_GUIDE.md                 # Complete guide
└── .env                               # Configuration
```

## ✅ What You Get

- **✅ Smart Contract**: Production-ready OrderTracking.sol
- **✅ Database Models**: 7 optimized MongoDB collections  
- **✅ MetaMask Integration**: Complete Web3 utilities
- **✅ Event Synchronization**: Real-time blockchain ↔ DB sync
- **✅ Development Tools**: Setup scripts, testing, deployment
- **✅ Documentation**: Complete setup và usage guides

## 🧪 Testing

```bash
# Smart contract tests
cd blockchain && npm test

# Database connection
cd database && node scripts/setupDatabase.js

# MetaMask integration  
node integration/metamaskSetup.js

# Full system test
node startup.js
```

## 📖 Documentation

- **📋 Setup Guide**: [SETUP_GUIDE.md](SETUP_GUIDE.md) - Complete setup instructions
- **🚀 Quick Start**: [GETTING_STARTED.md](GETTING_STARTED.md) - 30-minute setup
- **📊 API Docs**: [API_SPECIFICATION.md](API_SPECIFICATION.md) - REST API reference  
- **🦊 Frontend Guide**: [FRONTEND_INTEGRATION.md](FRONTEND_INTEGRATION.md) - Web3 integration
- **🚀 Deployment**: [DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md) - Production deploy

---

🎉 **Ready to track orders on the blockchain!**

**Next Steps:**
1. Run setup: `node startup.js`
2. Test MetaMask: `node integration/metamaskSetup.js`  
3. Build your frontend
4. Deploy to production

**Support**: See [SETUP_GUIDE.md](SETUP_GUIDE.md) cho detailed instructions