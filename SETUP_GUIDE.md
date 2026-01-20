# 🚀 COMPLETE SETUP GUIDE - BLOCKCHAIN ORDER TRACKING

## 📋 Tổng Quan Hệ Thống

Hệ thống truy vết đơn hàng hoàn chỉnh bao gồm:

- **🔗 Blockchain Layer**: Smart Contract trên Ethereum/Polygon
- **🗄️ Database Layer**: MongoDB với Mongoose ODM
- **🔄 Integration Layer**: Event listener đồng bộ blockchain ↔ database
- **🦊 MetaMask Integration**: Web3 wallet integration

---

## 🛠️ SETUP ENVIRONMENT

### 1. Quick Setup (Recommended)

#### Windows:
```cmd
# Run setup script
.\setup-environment.bat
```

#### Linux/Mac:
```bash
# Make executable and run
chmod +x setup-environment.sh
./setup-environment.sh
```

#### Node.js (Cross-platform):
```bash
# Complete system startup
node startup.js
```

### 2. Manual Setup

#### Step 1: Prerequisites
```bash
# Kiểm tra Node.js (v16+)
node --version

# Kiểm tra npm
npm --version

# Kiểm tra MongoDB
mongod --version
```

#### Step 2: Install Dependencies
```bash
# Blockchain dependencies
cd blockchain
npm install

# Database dependencies
cd ../database
npm install
```

#### Step 3: Setup Database
```bash
# Tạo MongoDB collections và indexes
cd database
node scripts/setupDatabase.js

# Seed sample data (optional)
node scripts/seedDatabase.js
```

#### Step 4: Compile Smart Contracts
```bash
cd blockchain
npm run compile
npm run test
```

---

## 🗄️ DATABASE MODELS

### Cấu Trúc Database

Hệ thống sử dụng **7 collections** chính:

#### 1. **Orders Collection**
```javascript
{
  orderId: "ORDER_12345",           // Unique identifier
  adminAddress: "0x1234...",        // MetaMask address
  status: "SHIPPED",                // Current status
  blockchainHash: "0xabcd...",      // Transaction hash
  metadata: {                       // Product details
    productName: "iPhone 14",
    quantity: 2,
    price: 999.99,
    totalAmount: 1999.98
  },
  recipient: {                      // Delivery information
    name: "John Doe",
    address: "123 Main St",
    phone: "+1234567890",
    coordinates: [106.7017, 10.7769] // [longitude, latitude]
  },
  createdAt: "2024-01-20T10:30:00Z",
  updatedAt: "2024-01-20T14:45:00Z"
}
```

#### 2. **StatusLogs Collection**
```javascript
{
  orderId: "ORDER_12345",
  status: "SHIPPED",
  timestamp: "2024-01-20T14:45:00Z",
  details: {
    location: "Distribution Center",
    handler: "John Smith",
    notes: "Package shipped via express delivery"
  },
  blockchainTxHash: "0xabcd...",
  updatedBy: "0x1234..."
}
```

#### 3. **Users Collection**
```javascript
{
  address: "0x1234567890123456789012345678901234567890",
  name: "Admin User",
  role: "ADMIN",                    // ADMIN, SHIPPER, VIEWER
  organization: "Logistics Corp",
  isActive: true,
  createdAt: "2024-01-20T10:00:00Z"
}
```

#### 4. **BlockchainEvents Collection**
```javascript
{
  eventName: "OrderCreated",
  orderId: "ORDER_12345",
  transactionHash: "0xabcd...",
  blockNumber: 1234567,
  blockTimestamp: "2024-01-20T10:30:00Z",
  eventData: { /* event arguments */ },
  syncedAt: "2024-01-20T10:31:00Z"
}
```

#### 5. **IPFSReferences Collection**
```javascript
{
  ipfsHash: "QmX123...",
  orderId: "ORDER_12345",
  type: "IMAGE",                    // IMAGE, INVOICE, CERTIFICATE
  fileName: "product_photo.jpg",
  size: 1048576,
  uploadedAt: "2024-01-20T10:30:00Z"
}
```

#### 6. **Statistics Collection**
```javascript
{
  date: "2024-01-20",
  totalOrders: 150,
  deliveredOrders: 120,
  cancelledOrders: 5,
  averageDeliveryTime: 48,          // hours
  adminAddress: "0x1234..."
}
```

#### 7. **AuditLogs Collection**
```javascript
{
  action: "ORDER_STATUS_UPDATED",
  actor: "0x1234...",
  orderId: "ORDER_12345",
  details: { /* action details */ },
  timestamp: "2024-01-20T14:45:00Z",
  ipAddress: "192.168.1.100"
}
```

### Database Indexes

Tất cả collections đã được tối ưu với indexes:
- **Performance indexes**: orderId, adminAddress, status, createdAt
- **Geospatial indexes**: recipient.coordinates (2dsphere)
- **Compound indexes**: orderId + timestamp cho StatusLogs
- **TTL indexes**: AuditLogs tự động xóa sau 90 ngày

---

## 🔗 CONTRACT INTEGRATION

### Smart Contract Features

#### Core Functions:
```solidity
// Tạo đơn hàng mới
function createOrder(string _orderId, string _metadataHash)

// Cập nhật trạng thái đơn hàng
function updateOrderStatus(string _orderId, string _newStatus, string _detailsHash)

// Hủy đơn hàng
function cancelOrder(string _orderId)

// Xem thông tin đơn hàng
function getOrder(string _orderId) returns (Order)

// Xem lịch sử cập nhật
function getOrderHistory(string _orderId) returns (StatusUpdate[])
```

#### Events:
```solidity
event OrderCreated(string indexed orderId, address indexed admin, uint256 timestamp, string metadataHash);
event OrderStatusUpdated(string indexed orderId, string newStatus, uint256 timestamp, string detailsHash, address indexed updatedBy);
event OrderCancelled(string indexed orderId, uint256 timestamp);
```

### Integration Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Smart Contract │    │  Event Listener  │    │    MongoDB      │
│   (Blockchain)   │◄──►│  (Integration)   │◄──►│   (Database)    │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         ▲                        ▲                        ▲
         │                        │                        │
         ▼                        ▼                        ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│    MetaMask      │    │   Audit Logs    │    │   Statistics    │
│   (Frontend)     │    │   (Tracking)     │    │  (Analytics)    │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

---

## 🦊 METAMASK INTEGRATION

### 1. MetaMask Setup

#### Install MetaMask:
1. Visit [metamask.io](https://metamask.io/)
2. Install browser extension
3. Create new wallet hoặc import existing wallet

#### Import Development Wallet:
```javascript
// Từ .env file
PRIVATE_KEY=bcf3e2fae340102c4ae31ad2277dbdf350f38a2c0dd7d2b008260d8c32daecc1
```

#### Add Sepolia Testnet:
```
Network Name: Sepolia Test Network
RPC URL: https://sepolia.infura.io/v3/7344f20358424a8c9e3bd5a2609c471a
Chain ID: 11155111
Currency Symbol: ETH
Block Explorer: https://sepolia.etherscan.io
```

#### Get Test ETH:
- Visit: [sepoliafaucet.com](https://sepoliafaucet.com/)
- Paste MetaMask address
- Request 0.5 ETH

### 2. Frontend Integration

#### Basic Connection:
```javascript
import { MetaMaskOrderTracking } from './integration/metamaskSetup.js';

// Initialize
const tracker = new MetaMaskOrderTracking();

// Connect to MetaMask
const connection = await tracker.connectMetaMask();
console.log('Connected:', connection.address);

// Check if user is admin
const isAdmin = await tracker.isUserAdmin();
```

#### Create Order:
```javascript
const productInfo = {
    name: "iPhone 14",
    description: "Latest iPhone model",
    quantity: 1,
    price: 999.99,
    category: "Electronics",
    sku: "IPH14-001"
};

const result = await tracker.createOrder("ORDER_001", productInfo);
console.log('Order created:', result.txHash);
```

#### Update Order Status:
```javascript
await tracker.updateOrderStatus("ORDER_001", "SHIPPED", "Shipped via DHL");
```

#### Track Order:
```javascript
// Get current status
const order = await tracker.getOrder("ORDER_001");

// Get complete history
const history = await tracker.getOrderHistory("ORDER_001");
```

#### Listen for Real-time Updates:
```javascript
tracker.startEventListener((event) => {
    if (event.type === 'OrderCreated') {
        console.log('New order:', event.orderId);
    } else if (event.type === 'OrderStatusUpdated') {
        console.log('Status update:', event.orderId, '→', event.newStatus);
    }
});
```

### 3. Backend Integration

#### Event Listener (Auto-sync):
```javascript
// integration/blockchainListener.js automatically:
// 1. Listens to blockchain events
// 2. Syncs data to MongoDB
// 3. Updates statistics
// 4. Creates audit logs

// Start listener
cd database
npm start
```

---

## 🚀 DEVELOPMENT WORKFLOW

### 1. Local Development

#### Terminal 1 - Local Blockchain:
```bash
cd blockchain
npm run node
# ➜ Local blockchain started at http://localhost:8545
```

#### Terminal 2 - Deploy Contract:
```bash
cd blockchain
npm run deploy:local
# ➜ Contract deployed: 0x5663b4AF89cFBFf92A29F8cb53516B705eF055C8
```

#### Terminal 3 - Database Listener:
```bash
cd database
npm start
# ➜ MongoDB sync started
```

#### Terminal 4 - Test Integration:
```bash
node integration/metamaskSetup.js
# ➜ Full integration test
```

### 2. Testnet Development

#### Deploy to Sepolia:
```bash
cd blockchain
npm run deploy:sepolia
# Update CONTRACT_ADDRESS in .env
```

#### Start Integration:
```bash
# Update .env với Sepolia settings
RPC_URL=https://sepolia.infura.io/v3/7344f20358424a8c9e3bd5a2609c471a
CONTRACT_ADDRESS=0x5663b4AF89cFBFf92A29F8cb53516B705eF055C8

# Start database listener
cd database
npm start
```

---

## 🧪 TESTING

### 1. Smart Contract Tests
```bash
cd blockchain
npm run test
# ➜ 40+ test cases covering all functions
```

### 2. Integration Tests
```bash
# Test MetaMask integration
node integration/metamaskSetup.js

# Test database setup
cd database
node scripts/setupDatabase.js
```

### 3. Full System Test
```bash
# Complete system test
node startup.js
```

### 4. Manual Testing

#### Create Test Order:
```javascript
const tracker = new MetaMaskOrderTracking();
await tracker.connectWithPrivateKey();

const result = await tracker.createOrder("TEST_001", {
    name: "Test Product",
    quantity: 1,
    price: 100
});
```

---

## 📋 CONFIGURATION

### Environment Variables (.env)

```env
# ==================== BLOCKCHAIN ====================
PRIVATE_KEY=bcf3e2fae340102c4ae31ad2277dbdf350f38a2c0dd7d2b008260d8c32daecc1
INFURA_API_KEY=7344f20358424a8c9e3bd5a2609c471a

# Networks
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/7344f20358424a8c9e3bd5a2609c471a
LOCALHOST_RPC_URL=http://localhost:8545
RPC_URL=https://sepolia.infura.io/v3/7344f20358424a8c9e3bd5a2609c471a

# Contract
CONTRACT_ADDRESS=0x5663b4AF89cFBFf92A29F8cb53516B705eF055C8
SEPOLIA_CONTRACT_ADDRESS=0x5663b4AF89cFBFf92A29F8cb53516B705eF055C8

# ==================== DATABASE ====================
MONGODB_URI=mongodb://localhost:27017/order-tracking
MONGODB_HOST=localhost
MONGODB_PORT=27017

# ==================== APPLICATION ====================
PORT=3000
NODE_ENV=development
LOG_LEVEL=info

# Event Listener
POLL_INTERVAL=3000
BLOCK_CONFIRMATION=2
```

---

## 📂 PROJECT STRUCTURE

```
BlockChain_TruyVetDonHang/
├── 🔗 blockchain/
│   ├── contracts/
│   │   └── OrderTracking.sol           # Smart contract
│   ├── scripts/
│   │   └── deploy.js                   # Deployment script
│   ├── test/
│   │   └── OrderTracking.test.js       # Contract tests
│   ├── hardhat.config.js               # Hardhat configuration
│   └── package.json                    # Dependencies
│
├── 🗄️ database/
│   ├── schemas/
│   │   ├── models.js                   # Mongoose models
│   │   └── mongodb-schema.js           # Schema definitions
│   ├── scripts/
│   │   ├── setupDatabase.js            # DB initialization
│   │   └── seedDatabase.js             # Sample data
│   └── package.json                    # Dependencies
│
├── 🔄 integration/
│   ├── blockchainListener.js           # Event listener
│   └── metamaskSetup.js                # MetaMask integration
│
├── 📋 scripts/
│   ├── setup-environment.sh            # Linux/Mac setup
│   ├── setup-environment.bat           # Windows setup
│   └── startup.js                      # Complete startup
│
├── 📚 documentation/
│   ├── GETTING_STARTED.md              # Quick start guide
│   ├── QUICK_START.md                  # 30-minute setup
│   ├── API_SPECIFICATION.md            # REST API docs
│   └── FRONTEND_INTEGRATION.md         # Frontend guide
│
├── .env                                # Environment config
└── README.md                           # Project overview
```

---

## 🔧 TROUBLESHOOTING

### Common Issues

#### 1. Contract Compilation Failed
```bash
# Solution
cd blockchain
rm -rf cache artifacts
npm run compile
```

#### 2. MongoDB Connection Failed
```bash
# Check MongoDB status
mongod --version

# Start MongoDB
mongod --dbpath /path/to/data/db

# Or use MongoDB Compass
```

#### 3. MetaMask Connection Issues
- Ensure correct network selected
- Check RPC URL in MetaMask
- Verify contract address
- Check account has sufficient ETH

#### 4. Transaction Failed
- Check gas price
- Verify account balance
- Ensure contract is deployed
- Check network congestion

---

## 🚀 DEPLOYMENT CHECKLIST

### Pre-deployment
- [ ] All tests passing
- [ ] Environment variables configured
- [ ] Contract compiled successfully
- [ ] Database collections created
- [ ] MetaMask configured

### Local Deployment
- [ ] Start local blockchain: `npm run node`
- [ ] Deploy contract: `npm run deploy:local`
- [ ] Start database listener: `npm start`
- [ ] Test integration: `node integration/metamaskSetup.js`

### Testnet Deployment
- [ ] Get test ETH from faucet
- [ ] Deploy to Sepolia: `npm run deploy:sepolia`
- [ ] Update environment variables
- [ ] Test on testnet
- [ ] Verify contract on Etherscan

### Production Deployment
- [ ] Security audit completed
- [ ] Gas optimization done
- [ ] Monitoring setup
- [ ] Backup procedures in place
- [ ] Deploy to mainnet

---

## 📞 SUPPORT & RESOURCES

### Documentation
- **Setup Guide**: [SETUP_GUIDE.md](SETUP_GUIDE.md)
- **API Reference**: [API_SPECIFICATION.md](API_SPECIFICATION.md)
- **Frontend Guide**: [FRONTEND_INTEGRATION.md](FRONTEND_INTEGRATION.md)
- **Deployment Guide**: [DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md)

### Quick Commands
```bash
# Full setup
node startup.js

# Test integration
node integration/metamaskSetup.js

# Run all tests
cd blockchain && npm test

# Deploy to testnet
cd blockchain && npm run deploy:sepolia

# Start development
# Terminal 1: cd blockchain && npm run node
# Terminal 2: cd blockchain && npm run deploy:local
# Terminal 3: cd database && npm start
```

### External Resources
- **MetaMask**: [metamask.io](https://metamask.io/)
- **Sepolia Faucet**: [sepoliafaucet.com](https://sepoliafaucet.com/)
- **Etherscan Sepolia**: [sepolia.etherscan.io](https://sepolia.etherscan.io/)
- **MongoDB**: [mongodb.com](https://mongodb.com/)
- **Hardhat**: [hardhat.org](https://hardhat.org/)

---

## ✅ SUCCESS CRITERIA

Sau khi hoàn thành setup:

### ✅ Environment
- [ ] All dependencies installed
- [ ] Smart contract compiled
- [ ] Database models created
- [ ] MetaMask configured

### ✅ Functionality
- [ ] Create orders via MetaMask
- [ ] Update order status
- [ ] Query order information
- [ ] Real-time event listening
- [ ] Database synchronization

### ✅ Integration
- [ ] Blockchain ↔ Database sync
- [ ] MetaMask wallet connection
- [ ] Event-driven architecture
- [ ] Audit logging

---

## 🎉 CONGRATULATIONS!

Bạn đã setup thành công **Complete Blockchain Order Tracking System**!

**Ready to:**
- 📦 Create và track orders on blockchain
- 🦊 Integrate với MetaMask wallet
- 🗄️ Store data trong MongoDB
- 🔄 Real-time synchronization
- 📊 Analytics và reporting
- 🔒 Secure audit trails

**Next Steps:**
1. Test tất cả functionality
2. Build frontend application
3. Deploy to production network
4. Monitor và optimize performance

---

**🚀 Happy Coding! Chúc bạn thành công với dự án!**