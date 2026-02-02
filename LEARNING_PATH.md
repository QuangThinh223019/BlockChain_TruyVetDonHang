# 📚 Lộ Trình Học Theo Vai Trò

Chọn vai trò của bạn để bắt đầu học!

---

## 🎨 LỘ TRÌNH CHO FRONTEND DEVELOPER

### Mục Tiêu
Hiểu cách xây dựng giao diện React tương tác với blockchain và API

### Cơ Bản (Ngày 1)
1. **`.env`** - 10 phút
   - `REACT_APP_API_BASE_URL`, `CONTRACT_ADDRESS`

2. **`frontend/src/utils/constants.js`** - 15 phút
   - API_BASE_URL, CONTRACT_ADDRESS, ORDER_STATUS_LABELS, COLORS

3. **`package.json`** (frontend folder) - 5 phút
   - React, ethers.js, axios

### Tuần 1: Hooks & Services
4. **`frontend/src/services/apiService.js`** (206 lines) - 45 phút
   - Hiểu tất cả API endpoints
   - Request/response interceptor
   - Error handling

5. **`frontend/src/contexts/ContractContext.jsx`** - 20 phút
   - Context provider pattern
   - Pass contract data to components

6. **`frontend/src/hooks/useContract.js`** (322 lines) - 1.5 giờ
   - **Quan trọng**: `connectWallet()`, read-only contract, provider setup
   - Dòng 27-45: initProvider
   - Dòng 48-160: connectWallet
   - Dòng 220-250: init read-only contract

### Tuần 2: Order Logic
7. **`frontend/src/hooks/useOrder.js`** (297 lines) - 2 giờ
   - **Quan trọng**: `getOrder()`, `updateOrderStatus()`
   - Dòng 65-95: getOrder() - blockchain read
   - Dòng 141-180: updateOrderStatus() - blockchain + API call
   - **Dòng 181-206: API call PUT /status** - for email

8. **`frontend/src/hooks/useAutoRefresh.js`** - 30 phút
   - Auto-refresh pattern
   - Polling mechanism

### Tuần 3: Components & Pages
9. **`frontend/src/components/CreateOrder/CreateOrder.jsx`** (394 lines) - 1.5 giờ
   - Form handling
   - **Dòng 155-175: saveOrderMetadata()** - API call
   - Form validation & submission

10. **`frontend/src/components/OrderDetail/OrderDetail.jsx`** (487 lines) - 2 giờ
    - Order display
    - **Dòng 151-198: handleUpdateStatus()** - update logic
    - Dòng 275-320: Status update form

11. **`frontend/src/components/OrderHistory/OrderHistory.jsx`** - 45 phút
    - Timeline display
    - Auto-refresh integration

12. **`frontend/src/pages/TrackingPage.jsx`** - 30 phút
    - Page layout
    - Component orchestration

### CSS Styling
13. **Tất cả `.css` files** - 2 giờ
    - Component styling
    - Responsive design

### Frontend Learning Time
**Total: ~2.5 tuần** (25-30 giờ)

### 🎯 Thử Thách Frontend
- [ ] Thêm filter/search functionality
- [ ] Thêm dark mode toggle
- [ ] Thêm real-time notifications
- [ ] Thêm progress bar cho order

---

## 🔧 LỘ TRÌNH CHO BACKEND DEVELOPER

### Mục Tiêu
Hiểu cách xây dựng API server kết nối blockchain, database, và email

### Cơ Bản (Ngày 1)
1. **`.env`** - 10 phút
   - SEPOLIA_RPC_URL, PRIVATE_KEY, CONTRACT_ADDRESS
   - MONGODB_URI, EMAIL_USER, EMAIL_PASSWORD

2. **`package.json`** (root) - 5 phút
   - Express, ethers.js, Nodemailer, Mongoose

3. **`database/schemas/models.js`** - 30 phút
   - Order schema, fields, indexes
   - MongoDB connection logic

### Tuần 1: API Core
4. **`api-server.js`** (655 lines) - 3 giờ
   - **Quan trọng**: Toàn bộ file, nhưng focus:
   - Dòng 28-56: Blockchain setup (provider, signer, contract)
   - Dòng 37-54: MongoDB connection
   - Dòng 171-240: GET endpoints
   - Dòng 247-325: **POST metadata endpoint** (lưu DB + gửi email)
   - Dòng 327-423: **PUT status endpoint** (gửi email, không call blockchain)
   - Dòng 425-450: DELETE endpoint

5. **`database/scripts/setupDatabase.js`** - 30 phút
   - Database initialization
   - Schema creation

### Tuần 2: Email Service
6. **`email-service.js`** (440 lines) - 2 giờ
   - **Quan trọng**: Toàn bộ file
   - Dòng 14-38: Gmail SMTP setup
   - Dòng 43-155: Order creation email template
   - Dòng 157-195: Status update email template
   - Dòng 197-202: Delivery email template
   - Dòng 204-220: Async sending functions

7. **`test-email.js`** - 20 phút
   - Email testing
   - Debug email issues

### Tuần 3: Blockchain Integration
8. **`blockchain/contracts/OrderTracking.sol`** - 1.5 giờ
   - Contract functions: createOrder, updateStatus, getOrder, getOrderHistory
   - Status flow logic
   - Events

9. **`blockchain/scripts/deploy.js`** - 30 phút
   - Deployment logic
   - Contract initialization

### Advanced
10. **`integration/blockchainListener.js`** - 1 giờ
    - Event listening
    - Real-time updates

11. **Error Handling & Logging** - 1 giờ
    - Structured logging
    - Error responses

### Backend Learning Time
**Total: ~2.5 tuần** (25-30 giờ)

### 🎯 Thử Thách Backend
- [ ] Thêm order filtering/pagination endpoint
- [ ] Thêm email retry mechanism
- [ ] Thêm order status webhook
- [ ] Thêm analytics endpoint

---

## ⛓️ LỘ TRÌNH CHO BLOCKCHAIN DEVELOPER

### Mục Tiêu
Hiểu smart contract logic, deployment, và blockchain interactions

### Cơ Bản (Ngày 1)
1. **`.env`** - 10 phút
   - SEPOLIA_RPC_URL, PRIVATE_KEY, CONTRACT_ADDRESS
   - Network configuration

2. **`blockchain/hardhat.config.js`** - 20 phút
   - Hardhat setup
   - Network configuration
   - Compiler settings

3. **Solidity Basics** - 1 giờ (nếu chưa biết)
   - Smart contract anatomy
   - Solidity syntax

### Tuần 1: Smart Contract
4. **`blockchain/contracts/OrderTracking.sol`** - 3 giờ
   - **Quan trọng**: Toàn bộ contract
   - Order struct & storage
   - `createOrder()` - tạo order
   - `updateStatus()` - update status
   - `getOrder()` - lấy order data
   - `getOrderHistory()` - lấy lịch sử
   - `cancelOrder()` - hủy order
   - Events (OrderCreated, StatusUpdated, etc.)

5. **Status Flow Logic** - 1 giờ
   - CREATED (0) → CONFIRMED (1) → SHIPPED (2) → DELIVERED (3)
   - CANCELLED (4) - bất kỳ lúc nào
   - State transitions

### Tuần 2: Deployment & Testing
6. **`blockchain/scripts/deploy.js`** - 1 giờ
   - Deployment process
   - Contract initialization
   - Network switching

7. **`blockchain/test/OrderTracking.test.js`** - 2 giờ
   - Unit tests
   - Integration tests
   - Test patterns

8. **`blockchain/scripts/test-*.js`** - 1 giờ
   - Manual testing scripts
   - Testnet interactions

### Tuần 3: Integration & Monitoring
9. **`api-server.js`** (Blockchain parts only) - 1.5 giờ
   - Dòng 28-56: Contract initialization
   - Dòng 171-240: Contract read methods
   - Dòng 327-360: Contract write methods

10. **`integration/blockchainListener.js`** - 1.5 giờ
    - Event listening
    - Real-time monitoring
    - Event filtering

11. **Cronos Testnet & Explorers** - 1 giờ
    - Network configuration
    - Transaction verification
    - Block explorer usage

### Advanced Topics
12. **Gas Optimization** - 1 giờ
    - Gas estimation
    - Optimization techniques

13. **Security Considerations** - 1 giờ
    - Re-entrancy
    - Overflow/underflow
    - Access control

### Blockchain Learning Time
**Total: ~2.5 tuần** (25-30 giờ)

### 🎯 Thử Thách Blockchain
- [ ] Thêm refund functionality
- [ ] Thêm multi-signature approval
- [ ] Thêm event-based notifications
- [ ] Deploy trên mainnet

---

## 📊 So Sánh 3 Lộ Trình

| Khía Cạnh | Frontend | Backend | Blockchain |
|-----------|----------|---------|-----------|
| Main Files | 13 files | 6 files | 3 files |
| Learning Time | 25-30h | 25-30h | 25-30h |
| Focus Area | React, UI/UX | API, Database | Smart Contract |
| Key Skill | Component Design | System Design | Protocol Design |
| Testing | Unit + E2E | Unit + Integration | Unit + Testnet |

---

## 🔗 Kết Nối Giữa 3 Vai Trò

```
Frontend Developer
    ↓ calls API
Backend Developer ← → Blockchain Developer
    ↓ reads contract
```

### Frontend ↔ Backend
- Frontend gọi API endpoints (POST /metadata, PUT /status)
- Backend trả về data từ blockchain + database

### Backend ↔ Blockchain
- Backend khởi tạo contract instance
- Backend gọi contract methods (read-only)
- Backend lắng nghe contract events

### Frontend ↔ Blockchain
- Frontend kết nối MetaMask
- Frontend gọi contract methods trực tiếp (write operations)
- Frontend đọc contract state (read operations)

---

## 💡 Học Hiệu Quả

### Frontend Dev
- [ ] Hiểu flow của từng component
- [ ] Debug với React DevTools
- [ ] Test API calls với Postman trước
- [ ] Hiểu contract ABI structure

### Backend Dev
- [ ] Hiểu mỗi API endpoint làm gì
- [ ] Test với MongoDB Compass
- [ ] Debug email sending với test-email.js
- [ ] Hiểu contract functions

### Blockchain Dev
- [ ] Hiểu từng function của contract
- [ ] Deploy & test trên testnet
- [ ] Verify contract trên explorer
- [ ] Hiểu gas costs

---

## ❓ Cross-Role FAQ

**Frontend Dev hỏi Backend Dev**:
- "Làm sao để trigger email khi update status?" → Dùng PUT /status endpoint

**Backend Dev hỏi Blockchain Dev**:
- "Làm sao để lấy order history?" → Gọi `getOrderHistory()` function

**Blockchain Dev hỏi Frontend Dev**:
- "Làm sao để user kết nối ví?" → Dùng `connectWallet()` từ useContract hook
