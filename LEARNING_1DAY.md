# ⚡ Lộ Trình Học 1 Ngày Cho 3 Vai Trò

**Tiêu chí**: Focus vào những thứ quan trọng nhất, có thể áp dụng ngay.

---

## 🎨 FRONTEND DEVELOPER - 1 NGÀY

### Sáng (3 giờ): Cơ Bản & Setup
```
1. Clone project + npm install (20 phút)
2. Đọc constants.js (10 phút) - hiểu API_BASE_URL, CONTRACT_ADDRESS
3. Đọc .env (5 phút) - hiểu config
4. Chạy `npm start` frontend (10 phút)
5. Mở browser, xem giao diện (20 phút)
```

### Trưa (2.5 giờ): Học Hooks
```
1. Đọc useContract.js dòng 48-160: connectWallet() (40 phút)
   - Cách kết nối MetaMask
   - State management (provider, signer, account)

2. Đọc useOrder.js dòng 141-180: updateOrderStatus() (50 phút)
   - Cách update blockchain
   - Cách gọi API PUT /status

3. Đọc apiService.js dòng 93-110: saveOrderMetadata() (40 phút)
   - Cách lưu metadata vào API
```

### Chiều (2.5 giờ): Học Components
```
1. Đọc CreateOrder.jsx dòng 155-175: (50 phút)
   - Form tạo order
   - Gọi blockchain + API

2. Đọc OrderDetail.jsx dòng 151-198: handleUpdateStatus() (50 phút)
   - Xử lý update status
   - Validation

3. Mở DevTools, test tạo 1 order + update status (30 phút)
```

### Tối (1 giờ): Thực Hành
```
- Thêm 1 field mới vào CreateOrder form
- Hiểu flow dữ liệu từ form → blockchain → API → DB
```

---

## 🔧 BACKEND DEVELOPER - 1 NGÀY

### Sáng (3 giờ): Cơ Bản & API
```
1. Clone project + npm install (20 phút)
2. Đọc .env (10 phút)
3. Chạy `node api-server.js` (10 phút)
4. Test endpoints với Postman:
   - GET /api/health (10 phút)
   - GET /api/orders/:orderId (20 phút)
5. Đọc api-server.js dòng 28-56: blockchain setup (30 phút)
6. Đọc api-server.js dòng 37-54: MongoDB connection (30 phút)
```

### Trưa (2.5 giờ): POST Metadata
```
1. Đọc api-server.js dòng 247-325: POST /metadata endpoint (60 phút)
   - Lưu order vào MongoDB
   - Gọi email-service

2. Đọc database/schemas/models.js (30 phút)
   - Order schema
   - Fields cần biết

3. Test POST /metadata với Postman (40 phút)
```

### Chiều (2 giờ): Status & Email
```
1. Đọc api-server.js dòng 327-423: PUT /status endpoint (40 phút)
   - Không call blockchain
   - Chỉ gửi email

2. Đọc email-service.js dòng 14-38: Gmail setup (30 phút)
   - SMTP configuration
   - Nodemailer

3. Chạy test-email.js để gửi test email (20 phút)

4. Đọc email-service.js dòng 204-220: async sending (30 phút)
```

### Tối (1 giờ): Thực Hành
```
- Test tạo order + update status
- Kiểm tra email có đến không
- Debug logs ở console
```

---

## ⛓️ BLOCKCHAIN DEVELOPER - 1 NGÀY

### Sáng (3 giờ): Contract & Setup
```
1. Clone project + npm install blockchain (20 phút)
2. Đọc .env: SEPOLIA_RPC_URL, PRIVATE_KEY, CONTRACT_ADDRESS (10 phút)
3. Đọc blockchain/hardhat.config.js (20 phút)
4. Đọc blockchain/contracts/OrderTracking.sol:
   - Order struct (15 phút)
   - Status enum: CREATED(0), CONFIRMED(1), SHIPPED(2), DELIVERED(3), CANCELLED(4) (15 phút)
5. Deploy test: `npx hardhat run scripts/deploy.js` (30 phút)
```

### Trưa (2.5 giờ): Functions
```
1. Đọc OrderTracking.sol:
   - createOrder() (40 phút)
   - updateStatus() (40 phút)
   - getOrder() (30 phút)

2. Hiểu flow:
   - Tạo order → emit OrderCreated event (20 phút)
   - Update status → emit StatusUpdated event (20 phút)
```

### Chiều (2 giờ): Testing
```
1. Đọc blockchain/test/OrderTracking.test.js (40 phút)
2. Chạy test: `npx hardhat test` (20 phút)
3. Chạy test script: `npx hardhat run scripts/test-sepolia-order.js` (30 phút)
4. Check Cronos Explorer để verify transactions (30 phút)
```

### Tối (1 giờ): Thực Hành
```
- Deploy lại contract
- Test createOrder, updateStatus trên testnet
- Verify transaction trên explorer
```

---

## 📊 Summary - 1 Ngày Cho Mỗi Vai Trò

| Vai Trò | Files Chính | Key Hours | Output |
|---------|-----------|----------|--------|
| Frontend | useOrder.js, apiService.js, CreateOrder.jsx, OrderDetail.jsx | Sáng: hooks, Trưa: components, Chiều: test | Có thể modify form + test giao diện |
| Backend | api-server.js, email-service.js, models.js | Sáng: API setup, Trưa: POST, Chiều: PUT+email | Có thể test endpoints + send email |
| Blockchain | OrderTracking.sol, deploy.js, test.js | Sáng: contract, Trưa: functions, Chiều: test | Có thể deploy + test contract |

---

## 🚀 Sau 1 Ngày - Có Thể Làm Gì

### Frontend Dev
- ✅ Hiểu cách kết nối MetaMask
- ✅ Hiểu cách gọi API
- ✅ Hiểu cách update status
- ✅ Có thể thêm field form mới

### Backend Dev
- ✅ Hiểu cách API hoạt động
- ✅ Hiểu MongoDB schema
- ✅ Hiểu cách gửi email
- ✅ Có thể thêm endpoint mới

### Blockchain Dev
- ✅ Hiểu smart contract logic
- ✅ Hiểu status flow
- ✅ Hiểu deployment process
- ✅ Có thể modify contract + deploy

---

## 💡 Tips Học Nhanh

### Dành Cho Tất Cả
- **Không đọc comment dài** - focus vào code logic
- **Chạy code ngay** - không chỉ đọc
- **Dùng debugger** - browser DevTools hoặc console.log
- **Copy-paste & modify** - không viết từ đầu

### Frontend
- Open DevTools (F12) → Network tab → xem API calls
- Xem React Components tab → check state & props

### Backend
- Mở API server console → xem logs
- Dùng Postman → test từng endpoint
- Dùng MongoDB Compass → xem data realtime

### Blockchain
- Dùng `console.log` trong contract (không có)
- Dùng events → emit + check logs
- Chạy test script → xem output

---

## 🎯 Milestone Sau 1 Ngày

- [ ] Có thể chạy full system (frontend + API + blockchain)
- [ ] Có thể tạo order → nhận email
- [ ] Có thể update status → nhận email mới
- [ ] Có thể xem lịch sử order
- [ ] Hiểu cách tất cả kết nối với nhau

---

## ❓ Nếu Stuck

**Frontend**:
- Check browser console (F12)
- Check API_BASE_URL ở constants.js
- Check MetaMask network (Cronos Testnet)

**Backend**:
- Check .env file
- Check MongoDB connection
- Check email credentials

**Blockchain**:
- Check contract address ở .env
- Check network ở hardhat.config.js
- Check RPC URL
