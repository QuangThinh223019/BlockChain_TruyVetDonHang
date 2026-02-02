# Các File Quan Trọng - Hệ Thống Order Tracking

## 🎯 Tổng Quan

Hệ thống có 9 file chính cần học để nắm được quy trình. Theo thứ tự từ cơ bản đến ứng dụng.

---

## 1️⃣ Smart Contract (Nền Tảng)

**File:** `blockchain/contracts/OrderTracking.sol`

**Tại sao quan trọng:** Định nghĩa logic hệ thống (tạo order, update status, lưu trữ trên blockchain)

**Những gì cần học:**
- Lines 45-55: `createOrder()` - tạo order mới trên blockchain
- Lines 57-66: `updateStatus()` - cập nhật trạng thái (chỉ admin)
- Lines 68-72: `getOrder()` - lấy thông tin order
- Lines 74-80: `getOrderHistory()` - lấy lịch sử order

**Khái niệm chính:**
- Order Status: CREATED (0), CONFIRMED (1), SHIPPED (2), DELIVERED (3), CANCELLED (4)
- Emit events: OrderCreated, StatusUpdated
- Blockchain lưu trữ vĩnh viễn

**Bắt đầu:** Đọc toàn bộ file, hiểu struct Order và 4 function

---

## 2️⃣ Backend API (Trục Chính)

**File:** `api-server.js`

**Tại sao quan trọng:** Kết nối blockchain + database + email service, xử lý tất cả request từ frontend

**Những gì cần học:**
- Lines 1-30: Import, cấu hình Express
- Lines 28-56: Khởi tạo blockchain connection (provider, signer, contract)
  - `ethers.providers.JsonRpcProvider(RPC_URL)` - kết nối Cronos Testnet
  - `new ethers.Wallet(PRIVATE_KEY, provider)` - admin wallet
  - `new ethers.Contract(ADDRESS, ABI, signer)` - contract instance
- Lines 75-120: GET /api/order/:orderId - lấy order từ blockchain + DB
- **Lines 247-325: POST /api/metadata - QUAN TRỌNG**
  - Lưu order metadata vào MongoDB
  - Gọi `emailService.sendOrderCreatedEmail()` (async, không chặn)
  - Dòng chính: 310-320
- **Lines 327-423: PUT /api/status - QUAN TRỌNG**
  - Update status trong DB (blockchain đã update từ frontend)
  - Gọi `emailService.sendStatusUpdateEmail()` (async)
  - Dòng chính: 410-420

**Khái niệm chính:**
- REST API (POST, GET, PUT)
- Async/await cho database calls
- .catch() để không block email errors
- HTTP status codes (201, 200, 500)

**Bắt đầu:** Đọc lines 28-56, sau đó 247-325, cuối cùng 327-423

---

## 3️⃣ Email Service (Thông Báo)

**File:** `email-service.js`

**Tại sao quan trọng:** Gửi email tự động khi tạo order và update status

**Những gì cần học:**
- Lines 1-12: Import packages (nodemailer, dotenv)
- **Lines 14-38: Cấu hình Gmail SMTP**
  - Service: 'gmail'
  - Email: socialcqt@gmail.com
  - Password: App Password từ `process.env.GMAIL_APP_PASSWORD`
  - Tại sao App Password: Gmail không cho phép mật khẩu thường
- **Lines 43-155: Template email "Order Created"**
  - HTML content với inline CSS
  - Hiển thị orderId, productName, status
  - Professional design
- **Lines 157-195: Template email "Status Updated"**
  - Khác với order created
  - Hiển thị status thay đổi
- **Lines 204-220: Async sending functions**
  - `sendOrderCreatedEmail(email, product, orderId)`
  - `sendStatusUpdateEmail(email, orderId, status)`
  - Sử dụng transporter.sendMail()

**Khái niệm chính:**
- Nodemailer SMTP configuration
- HTML email templates
- Async email sending (không block API)
- Gmail App Password vs regular password

**Bắt đầu:** Đọc lines 14-38, sau đó hiểu 2 templates (43-155, 157-195)

---

## 4️⃣ Database Schema (Dữ Liệu)

**File:** `database/schemas/models.js`

**Tại sao quan trọng:** Định nghĩa cấu trúc dữ liệu được lưu trữ

**Những gì cần học:**
- Order schema fields:
  - `orderId`: String, unique (khóa từ blockchain)
  - `metadata`: { productName, quantity, createdAt }
  - `recipient`: { email } **← Email được lưu ở đây để gửi email sau**
  - `sender`: { address } (creator address)
  - `status`: String (CREATED, CONFIRMED, SHIPPED, DELIVERED)

**Khái niệm chính:**
- MongoDB document structure
- Nested objects (metadata, recipient, sender)
- Why email in DB: cần gửi email khi status update, không thể lấy từ blockchain

**Bắt đầu:** Đọc Order schema, hiểu tại sao email được lưu

---

## 5️⃣ Frontend - Tạo Order (UI Chính)

**File:** `frontend/src/components/CreateOrder/CreateOrder.jsx`

**Tại sao quan trọng:** User nhập dữ liệu, tạo order - điểm bắt đầu của flow

**Những gì cần học:**
- Lines 1-50: State management (form data, loading, error)
- Lines 100-150: Form JSX
  - Input cho productName, quantity, recipientEmail
  - Submit button
- **Lines 155-175: QUAN TRỌNG - Main function**
  ```javascript
  // 1. Gọi contract.createOrder()
  const tx = await contract.createOrder(form.productName, form.quantity);
  const receipt = await tx.wait();
  
  // 2. Khi blockchain confirm, gọi API lưu metadata + gửi email
  const response = await apiService.saveOrderMetadata({
    orderId: receipt.events[0].args.orderId.toString(),
    productName: form.productName,
    quantity: form.quantity,
    recipientEmail: form.recipientEmail,
    senderAddress: { address: account }  // ← Object, không string
  });
  ```
- Lines 180-200: Error handling, validation
- Lines 380-394: Styling

**Khái niệm chính:**
- React form handling
- Contract interaction (await tx.wait())
- API calls after blockchain confirmation
- Why sender must be object: API expects { address: "0x..." }

**Bắt đầu:** Đọc lines 155-175, đó là heart của component

---

## 6️⃣ Frontend - Hook Logic (Xử Lý Logic)

**File:** `frontend/src/hooks/useOrder.js`

**Tại sao quan trọng:** Chứa logic kết nối frontend với blockchain + API, dùng bởi nhiều components

**Những gì cần học:**
- **Lines 65-95: getOrder() function - QUAN TRỌNG**
  ```javascript
  // Retry logic: cố gắng 5 lần nếu contract chưa ready
  for (let i = 0; i < 5; i++) {
    try {
      order = await contract.getOrder(orderId);
      break;
    } catch (error) {
      if (i < 4) await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  return order; // Từ blockchain
  ```
  - Tại sao retry: Contract initialization có thể delay
  
- **Lines 141-206: updateOrderStatus() function - QUAN TRỌNG**
  ```javascript
  // 1. Gọi blockchain
  const tx = await contract.updateStatus(orderId, newStatus);
  const receipt = await tx.wait();
  
  // 2. Gọi API để gửi email (⭐ KEY POINT)
  const response = await fetch(`${API_BASE_URL}/status`, {
    method: 'PUT',
    body: JSON.stringify({ orderId, status: newStatus, statusName })
  });
  return await response.json();
  ```
  - **Lines 181-206: API call to PUT /status**
    - Tại sao cần API call: để lấy email từ DB rồi gửi email
    - Tại sao sau blockchain: blockchain phải confirm trước
    
- Lines 208-230: getOrderHistory() - lấy lịch sử

**Khái niệm chính:**
- Custom React hooks
- Retry logic for async operations
- Blockchain call → API call flow
- Why email sent from API (not frontend): email config sensitive

**Bắt đầu:** Đọc lines 65-95, sau đó lines 141-206 (KEY!)

---

## 7️⃣ Frontend - Xem & Update Order (UI Chi Tiết)

**File:** `frontend/src/components/OrderDetail/OrderDetail.jsx`

**Tại sao quan trọng:** Hiển thị chi tiết order, cho admin update status

**Những gì cần học:**
- Lines 1-50: State, hooks setup
- Lines 80-130: useEffect để fetch order
  ```javascript
  useEffect(() => {
    const fetchOrder = async () => {
      const data = await getOrder(orderId);
      setOrder(data);
    };
    fetchOrder();
  }, [orderId]);
  ```
  
- **Lines 151-198: handleUpdateStatus() function**
  ```javascript
  const handleUpdateStatus = async (newStatus) => {
    await updateOrderStatus(order.id, parseInt(newStatus));
    toast.success('Status updated');
    const updated = await getOrder(order.id);
    setOrder(updated);
  };
  ```
  - Line 160: Kiểm tra `if (account)` (only wallet connected)
  - Tại sao không kiểm tra isCreator: vì chỉ admin có private key để call blockchain
  
- **Lines 275-320: Status update dropdown**
  ```javascript
  <select onChange={(e) => handleUpdateStatus(e.target.value)}>
    <option value="1">CONFIRMED</option>
    <option value="2">SHIPPED</option>
    <option value="3">DELIVERED</option>
  </select>
  ```
  - Chỉ hiển thị nếu: account && order.isActive
  
- Lines 330-480: Display order details (product, quantity, status, email)
- Lines 477-480: Import OrderHistory component

**Khái niệm chính:**
- Component state management
- Fetching data on mount
- Form submission with validation
- Conditional rendering based on wallet

**Bắt đầu:** Đọc lines 151-198, sau đó 275-320

---

## 8️⃣ API Service (Frontend → API)

**File:** `frontend/src/services/apiService.js`

**Tại sao quan trọng:** Wrapper layer để frontend gọi API, tập trung cấu hình endpoint

**Những gì cần học:**
- Base URL: `http://localhost:3000/api`
- **saveOrderMetadata(data)** - POST /metadata
  - Gửi: { orderId, productName, quantity, recipientEmail, senderAddress }
  - Trả về: { success, orderId }
  
- **updateOrderStatus(orderId, status)** - PUT /status
  - Gửi: { orderId, status }
  - Trả về: { success, message }
  
- **getOrder(orderId)** - GET /order/:id
  - Lấy order từ API (kết hợp blockchain + DB)
  
- **getOrders()** - GET /orders
  - Lấy danh sách all orders

**Khái niệm chính:**
- Centralized API endpoint configuration
- Async fetch wrapper
- Error handling at service level

**Bắt đầu:** Đọc 3 function chính (saveOrderMetadata, updateOrderStatus, getOrder)

---

## 9️⃣ Constants (Cấu Hình)

**File:** `frontend/src/utils/constants.js`

**Tại sao quan trọng:** Chứa configuration globally, dễ thay đổi

**Những gì cần học:**
- `API_BASE_URL = "http://localhost:3000/api"`
- `CONTRACT_ADDRESS = "0x5663b4AF89cFBFf92A29F8cb53516B705eF055C8"` (Cronos Testnet)
- `CHAIN_ID = 338` (Cronos Testnet)
- Status mapping: { 0: "CREATED", 1: "CONFIRMED", 2: "SHIPPED", 3: "DELIVERED" }
- RPC_URL, API endpoints, etc.

**Bắt đầu:** Chỉ cần biết 4 constants trên

---

## Thứ Tự Học Khuyến Nghị

### Nếu muốn hiểu flow tạo order (1.5 giờ):
1. **OrderTracking.sol** - Đọc `createOrder()` (lines 45-55)
2. **CreateOrder.jsx** - Đọc `handleCreateOrder()` (lines 155-175)
3. **apiService.js** - Đọc `saveOrderMetadata()`
4. **api-server.js** - Đọc POST /metadata (lines 247-325)
5. **email-service.js** - Đọc templates (lines 43-195)

**Result:** Hiểu User → Form → Blockchain → API → DB → Email

---

### Nếu muốn hiểu flow update status (1.5 giờ):
1. **OrderTracking.sol** - Đọc `updateStatus()` (lines 57-66)
2. **OrderDetail.jsx** - Đọc `handleUpdateStatus()` (lines 151-198)
3. **useOrder.js** - Đọc `updateOrderStatus()` (lines 141-206) ⭐
4. **api-server.js** - Đọc PUT /status (lines 327-423)
5. **email-service.js** - Đọc `sendStatusUpdateEmail()`

**Result:** Hiểu Admin → Blockchain → API → DB → Email

---

### Nếu muốn hiểu toàn bộ (4 giờ):
1. **OrderTracking.sol** (30 min) - toàn bộ
2. **api-server.js** (45 min) - lines 28-56, 247-325, 327-423
3. **email-service.js** (30 min) - lines 14-38, 43-195
4. **models.js** (15 min) - Order schema
5. **CreateOrder.jsx** (30 min) - lines 155-175
6. **useOrder.js** (45 min) - lines 65-95, 141-206
7. **OrderDetail.jsx** (30 min) - lines 151-198, 275-320
8. **apiService.js** (15 min) - 3 main functions
9. **constants.js** (5 min) - 4 main constants

---

## Trace Một Flow Đầy Đủ

### Scenario: User tạo order "Laptop"

```
1. USER CREATES ORDER
   Location: CreateOrder.jsx:155-175
   
   const tx = await contract.createOrder("Laptop", 1);
   ├─ Goes to: OrderTracking.sol:45
   ├─ Creates: orderId = 123, saves to blockchain
   ├─ Emits: OrderCreated event with orderId
   
   const receipt = await tx.wait();  // Chờ blockchain
   ├─ Blockchain confirms
   ├─ Extract orderId = 123 from receipt
   
   await apiService.saveOrderMetadata({
     orderId: "123",
     productName: "Laptop",
     recipientEmail: "customer@gmail.com",
     senderAddress: { address: "0x123..." }
   });
   └─ Goes to: apiService.js (wrapper)
      └─ Goes to: api-server.js:247 (POST /metadata)
         ├─ Save to MongoDB with recipient.email
         ├─ Get email from req.body.recipientEmail
         ├─ Call: emailService.sendOrderCreatedEmail()
         │  └─ Goes to: email-service.js:43
         │     └─ Create HTML template
         │     └─ Configure Gmail SMTP
         │     └─ Send email (async, no wait)
         └─ Return { success: true, orderId: "123" }

2. USER RECEIVES EMAIL
   ├─ From: socialcqt@gmail.com
   ├─ To: customer@gmail.com
   ├─ Subject: Order Confirmation
   ├─ Body: HTML with orderId, productName, status


3. ADMIN UPDATES STATUS
   Location: OrderDetail.jsx:151-198
   
   await updateOrderStatus(123, 2);  // status = 2 = SHIPPED
   └─ Goes to: useOrder.js:141
      ├─ const tx = await contract.updateStatus(123, 2);
      │  └─ Goes to: OrderTracking.sol:57
      │     ├─ Check msg.sender == owner (admin)
      │     ├─ Update orders[123].status = 2
      │     ├─ Emit StatusUpdated event
      │     └─ Blockchain confirms
      │
      ├─ const receipt = await tx.wait();
      │
      └─ await fetch(`${API_BASE_URL}/status`, {  // Lines 181-206
           method: 'PUT',
           body: JSON.stringify({ orderId: 123, status: 2, statusName: 'SHIPPED' })
         })
         └─ Goes to: api-server.js:327 (PUT /status)
            ├─ Find order in MongoDB by orderId
            ├─ Get email from order.recipient.email
            ├─ Update order.status = 'SHIPPED'
            ├─ Call: emailService.sendStatusUpdateEmail(email, 123, 'SHIPPED')
            │  └─ Goes to: email-service.js:157
            │     └─ Create HTML template with status
            │     └─ Send email (async, no wait)
            └─ Return { success: true, message: "Status updated" }

4. CUSTOMER RECEIVES EMAIL
   ├─ From: socialcqt@gmail.com
   ├─ To: customer@gmail.com
   ├─ Subject: Order 123 Status: SHIPPED
   ├─ Body: HTML with new status
```

---

## Summary Table

| File | Lines | Purpose | When Read |
|------|-------|---------|-----------|
| OrderTracking.sol | 45-80 | Smart contract logic | Start here |
| api-server.js | 28-56, 247-325, 327-423 | API endpoints + blockchain | Read after contract |
| email-service.js | 14-38, 43-195 | Email templates + SMTP | Read after API |
| models.js | Full | Database schema | Read in parallel |
| CreateOrder.jsx | 155-175 | Create order UI | Read after contract |
| useOrder.js | 65-95, 141-206 | Hooks for blockchain calls | Read in parallel |
| OrderDetail.jsx | 151-198, 275-320 | Update status UI | Read after hooks |
| apiService.js | All | API wrapper | Read after api-server |
| constants.js | All | Global config | Read anytime |

---

## Common Debug Tips

**Email not sending?**
1. Check email-service.js SMTP config (lines 14-38)
2. Check Gmail App Password in .env
3. Check recipientEmail is saved in MongoDB

**Order not created?**
1. Check blockchain transaction in OrderTracking.sol
2. Check API response in api-server.js:247
3. Check MongoDB saved order

**Status not updating?**
1. Check admin wallet (must be 0x0aCdc16d8fB5ac46cC309Cbe6b235BC481c91B4a)
2. Check blockchain transaction in OrderTracking.sol
3. Check API PUT /status response

---

## Key Takeaways

1. **Blockchain** (OrderTracking.sol) = Source of truth for orders
2. **Database** (models.js) = Stores email + metadata
3. **API** (api-server.js) = Bridge between frontend & blockchain/DB
4. **Email** (email-service.js) = Notifications to customers
5. **Frontend** (React) = User interface for interaction

Each part depends on the previous one. Master them in order!
