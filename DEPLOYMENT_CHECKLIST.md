# 📋 Deployment Checklist

## 🔵 PRE-DEPLOYMENT (Trước Deployment)

### Smart Contract Review
- [ ] Code review hoàn thành
- [ ] Unit tests pass 100%
- [ ] Gas optimization kiểm tra
- [ ] Security audit (nếu cần)
- [ ] No console.log() ở production code
- [ ] All require/revert messages có ý nghĩa

### Security Checks
- [ ] Private key not hardcoded
- [ ] Envionment variables configured
- [ ] Admin addresses verified
- [ ] Contract ownership có rõ ràng
- [ ] Event logging complete

### Testing
```bash
# Run full test suite
npm test

# Check gas usage
npm run test:gas

# Deploy to local first
npm run deploy:local

# Test trong local environment
```

---

## 🟢 DEPLOYMENT STEPS

### 1️⃣ Deploy Smart Contract

#### Step 1: Chuẩn Bị
```bash
cd blockchain

# Compile contract
npm run compile

# Verify bytecode
npx hardhat compile
```

#### Step 2: Configure Network
```javascript
// hardhat.config.js - verify network config
// - RPC URL: ✅ correct
// - Private Key: ✅ loaded from .env
// - Chain ID: ✅ correct
```

#### Step 3: Deploy
```bash
# Sepolia Testnet
npm run deploy:sepolia

# Output example:
# ✅ OrderTracking deployed to: 0x1234567890...
# 📄 Deployment info saved to: deployments/deployment-sepolia-1234567890.json
```

#### Step 4: Verify (Optional but Recommended)
```bash
npm run verify:sepolia
```

#### Step 5: Save Contract Address
```
Copy từ output: 0x1234567890...
Lưu vào .env:
CONTRACT_ADDRESS=0x1234567890...
```

---

### 2️⃣ Setup MongoDB

#### Step 1: Create Database
```bash
# Local MongoDB
mongod --dbpath ./data

# Hoặc MongoDB Atlas - copy connection string vào .env
MONGODB_URI=mongodb+srv://...
```

#### Step 2: Setup Collections & Indexes
```bash
cd database
npm run setup:db
```

#### Step 3: (Optional) Add Sample Data
```bash
npm run seed:db
```

---

### 3️⃣ Start Integration Services

#### Step 1: Start Blockchain Listener
```bash
cd database
npm start

# Output:
# 🚀 Starting Blockchain Event Listener...
# 🔌 Connecting to MongoDB...
# ✅ MongoDB connected
# 🔌 Connecting to Blockchain...
# ✅ Blockchain connected
# 👂 Listening for events...
```

#### Step 2: Verify Listener is Working
- Check logs thường xuyên
- Test bằng cách tạo order mới trên blockchain
- Verify dữ liệu xuất hiện trong MongoDB

---

## 🟡 VERIFICATION CHECKLIST

### ✅ Smart Contract
- [ ] Contract deployed tại address: ________
- [ ] Owner address: ________
- [ ] Admins authorized: ________
- [ ] Can create orders
- [ ] Can update status
- [ ] Can emit events
- [ ] Can query data

### ✅ MongoDB
- [ ] Collections created:
  - [ ] orders
  - [ ] statusLogs
  - [ ] ipfsReferences
  - [ ] users
  - [ ] statistics
  - [ ] blockchainEvents
  - [ ] auditLogs
- [ ] Indexes created
- [ ] Sample data available (optional)

### ✅ Integration
- [ ] Event listener running
- [ ] Can connect to contract
- [ ] Can connect to MongoDB
- [ ] Events being captured
- [ ] Data syncing correctly

### ✅ API Endpoints (Backend)
- [ ] GET /orders/:orderId
- [ ] GET /orders/:orderId/history
- [ ] GET /orders/:orderId/status
- [ ] POST /orders (create)
- [ ] PUT /orders/:orderId/status (update)
- [ ] GET /statistics

---

## 🔴 PRODUCTION DEPLOYMENT

### Pre-Production
- [ ] All tests passing
- [ ] Security audit completed
- [ ] Performance tested
- [ ] Load testing done
- [ ] Monitoring configured
- [ ] Backup strategy in place

### Mainnet (Ethereum, Polygon, etc.)
```bash
# Cảnh báo: Chi phí gas thực
# Kiểm tra giá gas trước

npm run deploy:mainnet  # hoặc npm run deploy:polygon
```

### Post-Deployment
- [ ] Verify contract on block explorer
- [ ] Monitor events
- [ ] Monitor MongoDB
- [ ] Check for errors
- [ ] Verify transaction costs

---

## 📊 Monitoring Checklist

### Blockchain
```javascript
// Monitor:
// - Transaction status
// - Event emission
// - Gas usage
// - Contract state
```

### MongoDB
```javascript
// Monitor:
// - Collection sizes
// - Index performance
// - Query latency
// - Connection pool
```

### Integration
```javascript
// Monitor:
// - Event listener uptime
// - Sync latency
// - Error rates
// - Log rotation
```

---

## 🆘 Rollback Plan

### If Deployment Fails

#### Option 1: Redeploy
```bash
npm run deploy:sepolia
```

#### Option 2: Use Previous Version
```bash
# Check deployments folder
cat deployments/deployment-*.json

# Update CONTRACT_ADDRESS in .env to previous
```

#### Option 3: Manual Recovery
- Stop event listener
- Check MongoDB state
- Verify contract state
- Clear invalid data if needed
- Restart listener

---

## 📝 Deployment Log Template

```
Deployment Date: _______________
Network: _______________
Contract Address: _______________
Deployer Address: _______________
Transaction Hash: _______________

MongoDB Status: _______________
Event Listener: _______________

Issues Encountered: _______________

Resolution: _______________

Verified By: _______________ Date: _______________
```

---

## 🎯 Final Checklist Before Going Live

- [ ] Contract deployed
- [ ] Contract verified
- [ ] MongoDB setup complete
- [ ] Event listener running
- [ ] All tests passing
- [ ] Documentation updated
- [ ] Team trained
- [ ] Monitoring active
- [ ] Backup tested
- [ ] Rollback plan ready

---

**Status:** ⏳ Ready for Deployment  
**Last Updated:** January 2024

