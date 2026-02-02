# 🎓 Hướng Dẫn Học Code Dự Án BlockChain Order Tracking

**Tài liệu này giúp bạn hiểu 100% cách hệ thống hoạt động từ A-Z**

---

## 📚 Các Tài Liệu Học Có Sẵn

| Tài Liệu | Nội Dung | Thích Hợp Cho |
|---------|---------|-------------|
| `LEARNING_PATH.md` | Lộ trình 2.5 tuần cho 3 vai trò | Muốn học kỹ lưỡng |
| `LEARNING_1DAY.md` | Lộ trình 1 ngày focus | Muốn hiểu nhanh |
| `CREATE_ORDER_FLOW.md` | Chi tiết quá trình tạo đơn | Muốn hiểu flow cụ thể |
| **Tài liệu này** | Tổng quan toàn bộ + roadmap | **BẠN ĐANG ĐỌC** |

---

## 🗺️ Lộ Trình Học Toàn Diện (Từng Tuần)

### Tuần 1: Hiểu Architecture

**Mục tiêu**: Hiểu hệ thống gồm những gì, các phần làm gì.

**Ngày 1: Cơ Bản**
- [ ] Đọc `.env` (5 phút) - config gì
- [ ] Đọc `package.json` (10 phút) - dùng công nghệ gì
- [ ] Xem sơ đồ hệ thống (15 phút) → [Xem phần "Sơ Đồ Kiến Trúc" bên dưới]

**Ngày 2: Smart Contract**
- [ ] Đọc `blockchain/contracts/OrderTracking.sol` (1 giờ)
- [ ] Hiểu Status enum: 0=CREATED, 1=CONFIRMED, 2=SHIPPED, 3=DELIVERED, 4=CANCELLED
- [ ] Hiểu Order struct: (orderId, metadataHash, currentStatus, createdAt, adminAddress)

**Ngày 3: Database**
- [ ] Đọc `database/schemas/models.js` (30 phút)
- [ ] Hiểu Order schema có fields gì
- [ ] Hiểu relationship giữa metadata, recipient, sender

**Ngày 4: API Endpoints**
- [ ] Đọc API endpoints list (15 phút) → [Xem phần "API Endpoints" bên dưới]
- [ ] Hiểu mỗi endpoint làm gì
- [ ] Hiểu request/response format

**Ngày 5-7: Review + Q&A**
- [ ] Review tuần 1
- [ ] Ghi chú câu hỏi
- [ ] Chuẩn bị cho tuần 2

---

### Tuần 2: Học Backend

**Mục tiêu**: Hiểu backend hoạt động, gọi blockchain, lưu database, gửi email.

**Ngày 8: API Server Cơ Bản**
- [ ] Đọc `api-server.js` dòng 1-100 (30 phút) - imports + setup
- [ ] Hiểu blockchain provider, signer setup
- [ ] Hiểu MongoDB connection

**Ngày 9: GET Endpoints**
- [ ] Đọc `api-server.js` dòng 171-240 (1 giờ)
- [ ] `GET /api/health` - health check
- [ ] `GET /api/orders/:orderId` - lấy order từ blockchain
- [ ] `GET /api/orders/:orderId/metadata` - lấy order từ database

**Ngày 10: POST Metadata Endpoint**
- [ ] Đọc `api-server.js` dòng 247-325 (1.5 giờ) ⭐ **QUAN TRỌNG**
- [ ] Hiểu cách lưu order vào MongoDB
- [ ] Hiểu cách gọi email service
- [ ] **Đây là bridge giữa blockchain ↔ database**

**Ngày 11: Email Service**
- [ ] Đọc `email-service.js` toàn bộ (1.5 giờ) ⭐ **QUAN TRỌNG**
- [ ] Hiểu Gmail SMTP setup
- [ ] Hiểu 3 email templates
- [ ] Hiểu async email sending

**Ngày 12: PUT Status Endpoint**
- [ ] Đọc `api-server.js` dòng 327-423 (1 giờ)
- [ ] Hiểu: **Không call blockchain**, chỉ gửi email
- [ ] Hiểu: Cách MongoDB lookup order để lấy email

**Ngày 13-14: Test + Review**
- [ ] Test endpoint với Postman
- [ ] Chạy `node test-email.js`
- [ ] Review backend flow

---

### Tuần 3: Học Frontend

**Mục tiêu**: Hiểu frontend gọi blockchain, gọi API, quản lý state.

**Ngày 15: Setup & Utils**
- [ ] Đọc `frontend/src/utils/constants.js` (20 phút)
- [ ] Hiểu API_BASE_URL, CONTRACT_ADDRESS, ORDER_STATUS_LABELS
- [ ] Đọc `frontend/src/services/apiService.js` (1 giờ)

**Ngày 16: useContract Hook**
- [ ] Đọc `frontend/src/hooks/useContract.js` (2 giờ) ⭐ **QUAN TRỌNG**
- [ ] Hiểu `connectWallet()` - kết nối MetaMask
- [ ] Hiểu read-only contract - cho chế độ công khai
- [ ] Hiểu contract instance - khi wallet connected

**Ngày 17: useOrder Hook**
- [ ] Đọc `frontend/src/hooks/useOrder.js` (2 giờ) ⭐ **QUAN TRỌNG**
- [ ] `getOrder()` - lấy order từ blockchain
- [ ] `createOrder()` - tạo order trên blockchain
- [ ] `updateOrderStatus()` - update blockchain + gọi API

**Ngày 18: CreateOrder Component**
- [ ] Đọc `frontend/src/components/CreateOrder/CreateOrder.jsx` (1.5 giờ) ⭐ **QUAN TRỌNG**
- [ ] Hiểu form state management
- [ ] Hiểu gọi blockchain contract
- [ ] Hiểu gọi API saveOrderMetadata
- [ ] **Đây là entry point tạo order**

**Ngày 19: OrderDetail Component**
- [ ] Đọc `frontend/src/components/OrderDetail/OrderDetail.jsx` (1.5 giờ)
- [ ] Hiểu hiển thị order chi tiết
- [ ] Hiểu form update status
- [ ] Hiểu handleUpdateStatus logic

**Ngày 20-21: Test + Demo**
- [ ] Chạy frontend + backend
- [ ] Tạo test order
- [ ] Update status
- [ ] Check email có đến không
- [ ] Review frontend flow

---

## 🏗️ Sơ Đồ Kiến Trúc Hệ Thống

```
┌─────────────────────────────────────────────────────────┐
│                    FRONTEND (React)                      │
│  CreateOrder.jsx → blockchain + API                     │
│  OrderDetail.jsx → update status + show history         │
│  OrderHistory.jsx → timeline of updates                 │
│                                                          │
│  Hooks: useContract, useOrder, useAutoRefresh           │
│  Services: apiService (HTTP client)                     │
└─────────────────┬───────────────────────────────────────┘
                  │
                  ├─→ HTTP requests ──────────────────┐
                  │                                   │
                  └─→ Blockchain calls ───────────┐   │
                                                 │   │
                                    ┌────────────▼─┐ │
                                    │  BLOCKCHAIN  │ │
                                    │              │ │
                                    │ OrderTracking│ │
                                    │ Smart Contract
                                    │              │ │
                                    │ - createOrder│ │
                                    │ - updateStatus
                                    │ - getOrder   │ │
                                    │ - getHistory │ │
                                    └────────────┬─┘ │
                                                 │   │
                                                 │   │
┌────────────────────────────────────────────────▼──▼─────┐
│                BACKEND (Node.js/Express)                 │
│                                                          │
│  api-server.js:                                         │
│  ├─ GET /api/health - health check                     │
│  ├─ GET /api/orders/:id - read blockchain             │
│  ├─ GET /api/orders/:id/metadata - read MongoDB       │
│  ├─ POST /api/orders/:id/metadata - save + email      │
│  └─ PUT /api/orders/:id/status - email only           │
│                                                          │
│  email-service.js:                                      │
│  ├─ initializeEmailService() - Gmail setup            │
│  ├─ notifyOrderCreated() - send creation email        │
│  ├─ notifyOrderStatusUpdated() - send update email    │
│  └─ notifyOrderDelivered() - send delivery email      │
│                                                          │
└─────────────────────────────────┬──────────────────────┘
                                   │
                 ┌─────────────────┴──────────────────┐
                 │                                    │
                 ▼                                    ▼
        ┌──────────────────┐            ┌─────────────────────┐
        │   MongoDB        │            │  Gmail SMTP         │
        │   (Database)     │            │  (Email Service)    │
        │                  │            │                     │
        │ - Order data     │            │ - Nodemailer        │
        │ - Metadata       │            │ - Email templates   │
        │ - Recipients     │            │ - Async sending     │
        └──────────────────┘            └─────────────────────┘
```

---

## 🔄 Các Quá Trình Chính (3 Flows)

### Flow 1: Tạo Đơn Hàng (Create Order)

```
1. Frontend (CreateOrder.jsx)
   └─ User điền form
   └─ Click "Tạo Đơn"
   └─ Call contract.createOrder()

2. Blockchain
   └─ Smart Contract lưu order
   └─ Set status = CREATED
   └─ Return txHash

3. Frontend
   └─ Nhận txHash
   └─ Call apiService.saveOrderMetadata()

4. Backend (api-server.js)
   └─ POST /api/orders/:id/metadata
   └─ Order.findOneAndUpdate() → Save to MongoDB
   └─ Call email-service.notifyOrderCreated()

5. Email Service (email-service.js)
   └─ Get email from recipient
   └─ Send via Gmail SMTP
   └─ Log success/error

6. User
   └─ Nhận email confirmation
   └─ Order đã tạo thành công
```

**Tài liệu chi tiết**: Đọc `CREATE_ORDER_FLOW.md`

### Flow 2: Cập Nhật Trạng Thái (Update Status)

```
1. Frontend (OrderDetail.jsx)
   └─ User chọn status mới từ dropdown
   └─ Click "✨ Cập Nhật"
   └─ handleUpdateStatus()

2. Blockchain
   └─ Call contract.updateStatus()
   └─ Smart Contract update currentStatus
   └─ Return txHash

3. Frontend
   └─ Blockchain transaction thành công
   └─ Call fetch() PUT /api/orders/:id/status

4. Backend (api-server.js)
   └─ PUT /api/orders/:id/status
   └─ Order.findOne() → Get order from MongoDB
   └─ Get recipient email từ MongoDB
   └─ Call email-service.notifyOrderStatusUpdated()

5. Email Service
   └─ Send status update email
   └─ Include: new status, order details

6. User
   └─ Nhận email status update
```

### Flow 3: Xem Chi Tiết & Lịch Sử (View Order)

```
1. Frontend (OrderDetail.jsx)
   └─ User nhập mã order
   └─ Click search

2. Blockchain
   └─ Call contract.getOrder()
   └─ Return: orderId, metadataHash, status, createdAt

3. API
   └─ Call apiService.getOrderMetadata()
   └─ GET /api/orders/:id/metadata

4. Backend
   └─ Order.findOne() → Get from MongoDB
   └─ Return: metadata, recipient, sender info

5. OrderHistory Component
   └─ Call contract.getOrderHistory()
   └─ Get all status updates
   └─ Display timeline

6. Frontend
   └─ Display full order detail
   └─ Show all status history
```

---

## 📋 API Endpoints Chi Tiết

### Health Check
```
GET /api/health
Purpose: Kiểm tra server + blockchain + contract status
Returns: blockNumber, balance, totalOrders
```

### Lấy Order (Blockchain)
```
GET /api/orders/:orderId
Purpose: Lấy order thông tin từ blockchain
Returns: {
  orderId, metadataHash, currentStatus, 
  createdAt, lastUpdated, adminAddress, isActive
}
Code: api-server.js dòng 171-200
```

### Lấy Metadata (Database)
```
GET /api/orders/:orderId/metadata
Purpose: Lấy order metadata từ MongoDB
Returns: {
  orderId, metadata, recipient, sender, 
  productName, quantity, price, ...
}
Code: api-server.js dòng 203-240
⭐ Dùng khi hiển thị order chi tiết
```

### Lưu Metadata (Create Order)
```
POST /api/orders/:orderId/metadata
Purpose: Lưu order vào MongoDB + gửi email
Body: { metadata, recipient, sender, txHash }
Code: api-server.js dòng 247-325
⭐ Gọi khi tạo đơn xong trên blockchain
```

### Cập Nhật Status (Update Order)
```
PUT /api/orders/:orderId/status
Purpose: Gửi email khi update status (blockchain update từ frontend)
Body: { status, details }
Code: api-server.js dòng 327-423
⭐ KHÔNG call blockchain, chỉ gửi email
```

### Hủy Đơn
```
DELETE /api/orders/:orderId
Purpose: Hủy đơn trên blockchain
Code: api-server.js dòng 425-450
```

---

## 🎯 Code Trọng Tâm Từng File

### 1️⃣ Smart Contract (OrderTracking.sol)
```
Status enum: 0=CREATED, 1=CONFIRMED, 2=SHIPPED, 3=DELIVERED, 4=CANCELLED

Key Functions:
- createOrder(orderId, metadataHash) → create + emit event
- updateStatus(orderId, newStatus, detailsHash) → update status
- getOrder(orderId) → return Order struct
- getOrderHistory(orderId) → return all updates
- cancelOrder(orderId) → set status to CANCELLED

⭐ Focus: Hiểu Status flow: 0→1→2→3 (hoặc 4 anytime)
```

### 2️⃣ Backend API (api-server.js)
```
Dòng 28-56: Blockchain setup (provider, signer, contract)
Dòng 37-54: MongoDB connection

GET /api/orders/:orderId (dòng 171)
- contract.getOrder(orderId) → read blockchain
- Returns order struct

GET /api/orders/:orderId/metadata (dòng 203)
- Order.findOne({orderId}) → read database
- Returns metadata + recipient email
⭐ Cần email để gửi notification khi update

POST /api/orders/:orderId/metadata (dòng 247) ⭐ QUAN TRỌNG
- Order.findOneAndUpdate({orderId}, data, {upsert: true})
  → Lưu order vào database
- notifyOrderCreated(recipient.email, data)
  → Gửi email ngay lập tức

PUT /api/orders/:orderId/status (dòng 327) ⭐ QUAN TRỌNG
- Order.findOne({orderId})
  → Lấy recipient email từ DB
- notifyOrderStatusUpdated(email, data)
  → Gửi email notification
- ⚠️ KHÔNG call blockchain! Blockchain đã update từ frontend
```

### 3️⃣ Email Service (email-service.js)
```
Dòng 14-38: Gmail SMTP initialization
- transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user, pass }
  })

Dòng 43-155: Email templates
- orderCreated: 📦 Order created
- orderStatusUpdated: 🔄 Status changed
- orderDelivered: ✔️ Delivered

Dòng 204-220: Async email sending
- transporter.sendMail({
    from: EMAIL_USER,
    to: recipientEmail,
    subject, html
  })
⭐ Async - không block response
```

### 4️⃣ Frontend Services (apiService.js)
```
POST /api/orders/:orderId/metadata (dòng 93)
- saveOrderMetadata(orderId, metadata, recipient, sender, txHash)
- Called từ CreateOrder.jsx sau blockchain success
- Trigger: email sent

PUT /api/orders/:orderId/status (via useOrder.js dòng 190-200)
- Called từ OrderDetail.jsx sau blockchain success
- Trigger: email sent
```

### 5️⃣ Frontend Hooks (useOrder.js)
```
getOrder(orderId) (dòng 65-95) ⭐ READ
- contract.getOrder(orderId)
- Returns: orderId, status, metadata, history

createOrder(orderId, metadataHash) (dòng 101-135)
- contract.createOrder(orderId, metadataHash)
- Wait for confirm
- Return txHash
⭐ Called từ CreateOrder.jsx

updateOrderStatus(orderId, newStatus) (dòng 141-206) ⭐ UPDATE
- contract.updateStatus(orderId, statusString, hash)
- Wait for confirm
- ✨ Dòng 181-206: Call API PUT /status để gửi email
- ⭐ KEY: Blockchain update + API email call
```

### 6️⃣ Frontend Components (CreateOrder.jsx)
```
Dòng 1-50: Imports + form state
- useOrder, useContract, apiService
- formData state với fields

Dòng 120-135: Blockchain transaction
- const metadataHash = ethers.keccak256(...)
- const result = await createOrder()
- Nhận txHash

Dòng 155-175: Save metadata ⭐ IMPORTANT
- await apiService.saveOrderMetadata(
    orderId,
    { metadata fields },
    { recipient fields + EMAIL },
    { sender address },
    txHash
  )
⭐ Đây là lúc email được trigger!
```

### 7️⃣ Frontend Components (OrderDetail.jsx)
```
Dòng 151-198: handleUpdateStatus() ⭐ IMPORTANT
- Validate form + blockchain status
- const result = await updateOrderStatus(orderId, status)
- Nhận txHash từ blockchain
- updateOrderStatus() ở useOrder.js sẽ gọi API tự động

Dòng 275-320: Form cập nhật status
- Dropdown chọn status mới
- Button submit

Dòng 477-480: Import OrderHistory
- Hiển thị lịch sử updates
```

---

## 🔗 File Dependencies Graph

```
CreateOrder.jsx
├─→ useOrder.js (createOrder hook)
│   └─→ Smart Contract
├─→ apiService.js (saveOrderMetadata)
│   └─→ api-server.js POST /metadata
│       └─→ email-service.js (notifyOrderCreated)

OrderDetail.jsx
├─→ useOrder.js (getOrder, updateOrderStatus)
│   ├─→ Smart Contract
│   └─→ fetch() PUT /api/orders/:id/status
│       └─→ api-server.js
│           └─→ email-service.js (notifyOrderStatusUpdated)
├─→ OrderHistory.jsx
│   └─→ useOrder.js (getOrderHistory)
│       └─→ Smart Contract

api-server.js
├─→ Smart Contract (via ethers.js)
├─→ MongoDB (Order model)
└─→ email-service.js (notifyOrderCreated, notifyOrderStatusUpdated)
```

---

## 📖 Cách Đọc Code Hiệu Quả

### 1. Đọc Từ Top → Bottom
- Đọc imports (hiểu file dùng gì)
- Đọc main function/component
- Đọc helper functions

### 2. Focus Vào Logic
- **Bỏ qua**: comments dài, styling, edge cases
- **Focus**: Control flow, function calls, data transformation

### 3. Trace Data Flow
- Input: Data từ đâu?
- Processing: Làm gì với data?
- Output: Data đi đâu?

### 4. Test While Learning
- Đọc code → test behavior
- Thêm console.log() → debug
- Sửa code → hiểu deep hơn

---

## 🚀 Roadmap Học Chi Tiết

### Phase 1: Architecture (Ngày 1-7) ⏱️ 7 hours
- [ ] Đọc `.env` + `package.json`
- [ ] Đọc Smart Contract (OrderTracking.sol)
- [ ] Đọc Database Schema
- [ ] Hiểu 3 flows chính

### Phase 2: Backend (Ngày 8-14) ⏱️ 12 hours
- [ ] `api-server.js` dòng 1-100 (setup)
- [ ] GET endpoints (dòng 171-240)
- [ ] POST metadata endpoint (dòng 247-325) ⭐
- [ ] `email-service.js` toàn bộ ⭐
- [ ] PUT status endpoint (dòng 327-423) ⭐
- [ ] Test với Postman + test-email.js

### Phase 3: Frontend (Ngày 15-21) ⏱️ 14 hours
- [ ] `constants.js` + `apiService.js`
- [ ] `useContract.js` ⭐
- [ ] `useOrder.js` ⭐
- [ ] `CreateOrder.jsx` ⭐
- [ ] `OrderDetail.jsx`
- [ ] Test end-to-end

### Phase 4: Deep Dive (Tuần 4+) ⏱️ 10+ hours
- [ ] Thêm feature mới
- [ ] Debug lỗi
- [ ] Optimize performance
- [ ] Read blockchain events

**Total: ~40+ hours** để hiểu 80% code

---

## ✅ Checklist: Biết Bao Nhiêu?

**Sau Phase 1**, bạn có thể:**
- [ ] Giải thích kiến trúc hệ thống
- [ ] Hiểu 3 flows: create, update, view
- [ ] Vẽ diagram file interactions

**Sau Phase 2**, bạn có thể:**
- [ ] Giải thích từng API endpoint
- [ ] Hiểu email flow
- [ ] Sửa backend code
- [ ] Thêm new endpoint

**Sau Phase 3**, bạn có thể:**
- [ ] Giải thích frontend state management
- [ ] Hiểu blockchain interaction
- [ ] Sửa frontend code
- [ ] Thêm new component

**Sau Phase 4**, bạn có thể:**
- [ ] Thêm feature mới
- [ ] Debug complex issues
- [ ] Deploy to production
- [ ] Mentor người khác

---

## 🎯 Bước Kế Tiếp

1. **Chọn vai trò**: Frontend / Backend / Blockchain
2. **Đọc LEARNING_PATH.md**: Lộ trình chi tiết cho vai trò
3. **Đọc CREATE_ORDER_FLOW.md**: Hiểu flow tạo order
4. **Bắt đầu từ Phase 1**: Tuần 1
5. **Thực hành**: Chạy code, test, modify

---

## 📞 Nếu Bị Stuck

| Vấn đề | Giải pháp |
|--------|---------|
| Không hiểu file nào | Xem `CREATE_ORDER_FLOW.md` |
| Không hiểu dòng code | Thêm `console.log()` debug |
| Không biết test như thế nào | Chạy `test-email.js` hoặc `test-order.js` |
| Không hiểu blockchain | Đọc Smart Contract dòng comment |
| Không hiểu email | Check `.env` + `email-service.js` setup |

---

## 🎓 Tóm Tắt

**Hệ thống = Frontend + Backend + Blockchain + Database + Email**

```
User tạo order
  → Frontend call Blockchain
  → Blockchain lưu + return txHash
  → Frontend call API
  → API lưu MongoDB + gửi email
  → Email đến recipient
  → Done!
```

**Key files cần học**:
1. Smart Contract (BlockChain logic)
2. api-server.js (Backend logic)
3. email-service.js (Email logic)
4. CreateOrder.jsx (Frontend create)
5. OrderDetail.jsx (Frontend update)
6. useOrder.js (Frontend-Blockchain bridge)

**Bắt đầu từ Phase 1 → Phase 4, bạn sẽ hiểu 100% code!**

---

**Happy Learning! 🚀**
