# Lộ Trình Học Theo Vai Trò

---

## 👨‍💻 ROLE 1: FRONTEND DEVELOPER

### Mục Tiêu
Hiểu cách React components tương tác với blockchain và API, cách xử lý user input, cách gọi backend.

### Files Cần Học (Thứ Tự)

#### 1. Setup & Configuration
**File:** `frontend/src/utils/constants.js`
- API_BASE_URL: `http://localhost:3000/api`
- CONTRACT_ADDRESS: `0x5663b4AF89cFBFf92A29F8cb53516B705eF055C8`
- CHAIN_ID: 338 (Cronos Testnet)
- Status mapping

**Thời gian:** 10 phút

---

#### 2. Context API (Chia sẻ dữ liệu)
**File:** `frontend/src/contexts/ContractContext.jsx`
- Cung cấp contract instance cho tất cả components
- Provider pattern

**Thời gian:** 15 phút

---

#### 3. Custom Hooks (Logic Layer)
**File:** `frontend/src/hooks/useContract.js`
- Tạo provider, signer, contract instance
- Khởi tạo blockchain connection

**Thời gian:** 15 phút

---

#### 4. Order Logic Hook (KEY HOOK)
**File:** `frontend/src/hooks/useOrder.js` (Lines 65-95, 141-206)

**Dòng cần tập trung:**
- Lines 65-95: `getOrder()` - Lấy order từ blockchain
  - Retry logic (chờ contract ready)
  - Cách gọi `contract.getOrder(orderId)`

- Lines 141-206: `updateOrderStatus()` - UPDATE STATUS ⭐
  ```javascript
  // 1. Gọi blockchain trước
  const tx = await contract.updateStatus(orderId, newStatus);
  const receipt = await tx.wait();
  
  // 2. Gọi API sau để gửi email
  const response = await fetch(`${API_BASE_URL}/status`, {
    method: 'PUT',
    body: JSON.stringify({ orderId, status: newStatus, statusName })
  });
  ```
  - **Lines 181-206: API call to PUT /status là KEY**

**Thời gian:** 45 phút

---

#### 5. API Service Layer
**File:** `frontend/src/services/apiService.js`

**Functions:**
- `saveOrderMetadata(data)` - POST /metadata
- `updateOrderStatus(orderId, status)` - PUT /status
- `getOrder(orderId)` - GET /order/:id

**Thời gian:** 20 phút

---

#### 6. Create Order Component
**File:** `frontend/src/components/CreateOrder/CreateOrder.jsx` (Lines 155-175)

**Dòng chính:**
```javascript
// 1. Gọi blockchain
const tx = await contract.createOrder(form.productName, form.quantity);
const receipt = await tx.wait();

// 2. Gọi API lưu metadata + gửi email
await apiService.saveOrderMetadata({
  orderId: receipt.events[0].args.orderId.toString(),
  productName: form.productName,
  quantity: form.quantity,
  recipientEmail: form.recipientEmail,
  senderAddress: { address: account }  // ← Object form
});
```

**Thời gian:** 30 phút

---

#### 7. Order Detail Component
**File:** `frontend/src/components/OrderDetail/OrderDetail.jsx` (Lines 151-198, 275-320)

**Dòng chính:**
- Lines 151-198: `handleUpdateStatus()` - Gọi hook
- Lines 275-320: Status dropdown - Form update

**Thời gian:** 30 phút

---

#### 8. Order List Component
**File:** `frontend/src/components/OrderList/OrderList.jsx`
- Hiển thị danh sách orders
- Pagination/filtering

**Thời gian:** 20 phút

---

#### 9. Connect Wallet Component
**File:** `frontend/src/components/ConnectWallet/ConnectWallet.jsx`
- MetaMask integration
- Get user account

**Thời gian:** 15 phút

---

### Frontend Flow Chart
```
User Opens App
    ↓
ConnectWallet.jsx → Get account từ MetaMask
    ↓
ContractContext → Cung cấp contract instance
    ↓
CreateOrder.jsx → User nhập dữ liệu
    ↓
contract.createOrder() → Blockchain
    ↓
apiService.saveOrderMetadata() → API POST /metadata
    ↓
Order tạo thành công ✅

---

Admin cập nhật status:
OrderDetail.jsx → Admin chọn status mới
    ↓
useOrder.updateOrderStatus() → Blockchain + API
    ↓
contract.updateStatus() → Blockchain update
    ↓
fetch PUT /status → API gửi email
    ↓
Email gửi thành công ✅
```

---

### Frontend Learning Timeline (2.5 hours)
1. constants.js (10 min)
2. ContractContext.jsx (15 min)
3. useContract.js (15 min)
4. useOrder.js (45 min) ⭐
5. apiService.js (20 min)
6. CreateOrder.jsx (30 min)
7. OrderDetail.jsx (30 min)
8. Other components (20 min)

---

---

## ⚙️ ROLE 2: BACKEND DEVELOPER

### Mục Tiêu
Hiểu cách API kết nối blockchain, database, email service. Xử lý business logic ở backend.

### Files Cần Học (Thứ Tự)

#### 1. Database Schema (Dữ liệu)
**File:** `database/schemas/models.js`

**Order Schema:**
```javascript
{
  orderId: String (unique),
  metadata: {
    productName: String,
    quantity: Number,
    createdAt: Date
  },
  recipient: {
    email: String  // ← Lưu email để gửi notification
  },
  sender: {
    address: String (creator wallet)
  },
  status: String (CREATED, CONFIRMED, SHIPPED, DELIVERED)
}
```

**Tại sao quan trọng:** Email được lưu ở đây, dùng khi update status

**Thời gian:** 20 phút

---

#### 2. Email Service (Thông báo)
**File:** `email-service.js`

**Sections:**
- Lines 14-38: Gmail SMTP configuration
  ```javascript
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'socialcqt@gmail.com',
      pass: process.env.GMAIL_APP_PASSWORD  // App Password
    }
  });
  ```

- Lines 43-155: Order Created Email Template
  - HTML content
  - Variables: orderId, productName

- Lines 157-195: Status Update Email Template
  - HTML content
  - Variables: orderId, newStatus

- Lines 204-220: Async sending functions
  ```javascript
  async function sendOrderCreatedEmail(email, product, orderId)
  async function sendStatusUpdateEmail(email, orderId, status)
  ```

**Thời gian:** 40 phút

---

#### 3. Blockchain Integration
**File:** `api-server.js` (Lines 28-56)

**Sections:**
- Line 28: Connect to Cronos Testnet RPC
  ```javascript
  const provider = new ethers.providers.JsonRpcProvider(
    'https://evm.cronos.org'
  );
  ```

- Lines 35-40: Admin wallet (signer)
  ```javascript
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
  ```

- Lines 45-56: Contract instance
  ```javascript
  const contract = new ethers.Contract(
    CONTRACT_ADDRESS,
    CONTRACT_ABI,
    wallet
  );
  ```

**Tại sao:** Backend cần signer để gọi contract functions

**Thời gian:** 30 phút

---

#### 4. API Endpoints (Core Logic)
**File:** `api-server.js`

**Endpoint 1: GET /api/order/:orderId (Lines 75-120)**
```javascript
app.get('/api/order/:orderId', async (req, res) => {
  // 1. Lấy từ blockchain (contract.getOrder)
  // 2. Lấy từ database (Order.findOne)
  // 3. Merge data từ 2 sources
});
```
- Tất cả order data, ghép blockchain + DB

**Endpoint 2: POST /api/metadata (Lines 247-325)** ⭐ QUAN TRỌNG
```javascript
app.post('/api/metadata', async (req, res) => {
  // 1. Lấy dữ liệu từ frontend request
  const { orderId, productName, quantity, recipientEmail, senderAddress } = req.body;
  
  // 2. Lưu vào MongoDB
  const order = await Order.create({
    orderId,
    metadata: { productName, quantity },
    recipient: { email: recipientEmail },  // ← Email saved
    sender: { address: senderAddress.address },
    status: 'CREATED'
  });
  
  // 3. Gửi email (async, không chặn response)
  // Line 310-320: emailService.sendOrderCreatedEmail()
  
  // 4. Return response
  res.status(201).json({ success: true, orderId });
});
```
- **Dòng chính:** 247-325
- **Tại sao:** Frontend gọi đây sau khi blockchain confirm

**Endpoint 3: PUT /api/status (Lines 327-423)** ⭐ QUAN TRỌNG
```javascript
app.put('/api/status', async (req, res) => {
  // 1. Lấy dữ liệu
  const { orderId, status, statusName } = req.body;
  
  // 2. Tìm order trong DB
  const order = await Order.findOne({ orderId });
  
  // 3. Update status
  order.status = statusName;
  await order.save();
  
  // 4. Gửi email (async)
  // Line 410-420: emailService.sendStatusUpdateEmail()
  
  // 5. Return response
  res.json({ success: true, message: 'Status updated' });
});
```
- **Dòng chính:** 327-423
- **Tại sao:** Frontend gọi đây sau khi admin update blockchain

**Thời gian:** 60 phút

---

#### 5. Error Handling & Logging
**File:** `api-server.js` (Throughout)

- Try-catch blocks
- HTTP status codes (201, 200, 500)
- Async email with .catch() (không block)

**Thời gian:** 20 phút

---

### Backend Flow Chart
```
Frontend POST /api/metadata
    ↓
api-server.js:247
    ├─ Validate input
    ├─ Order.create() → Save to MongoDB
    ├─ Extract email từ request
    ├─ emailService.sendOrderCreatedEmail()
    │  └─ email-service.js:43 → Create template
    │     └─ Gmail SMTP → Send email
    └─ Return { success: true }

---

Frontend PUT /api/status
    ↓
api-server.js:327
    ├─ Validate input
    ├─ Order.findOne() → Tìm order
    ├─ order.status = newStatus
    ├─ order.save() → Update DB
    ├─ emailService.sendStatusUpdateEmail()
    │  └─ email-service.js:157 → Create template
    │     └─ Gmail SMTP → Send email
    └─ Return { success: true }
```

---

### Backend Learning Timeline (2.5 hours)
1. models.js (20 min)
2. email-service.js (40 min) ⭐
3. api-server.js blockchain setup (30 min)
4. api-server.js POST /metadata (30 min) ⭐
5. api-server.js PUT /status (30 min) ⭐
6. Error handling (20 min)

---

---

## ⛓️ ROLE 3: BLOCKCHAIN DEVELOPER

### Mục Tiêu
Hiểu smart contract logic, cách create/update orders trên blockchain, event emissions.

### Files Cần Học

#### 1. Smart Contract Structure
**File:** `blockchain/contracts/OrderTracking.sol`

**State Variables:**
```solidity
mapping(uint256 => Order) public orders;
uint256 public orderCounter = 0;
address public owner;
```

**Order Struct:**
```solidity
struct Order {
  uint256 id;
  address creator;
  string product;
  uint256 quantity;
  OrderStatus status;
  uint256 timestamp;
  uint256 createdAt;
}
```

**OrderStatus Enum:**
```solidity
enum OrderStatus {
  CREATED,      // 0
  CONFIRMED,    // 1
  SHIPPED,      // 2
  DELIVERED,    // 3
  CANCELLED     // 4
}
```

**Thời gian:** 20 phút

---

#### 2. Events (Notifications)
**File:** `blockchain/contracts/OrderTracking.sol` (Lines 14-15)

```solidity
event OrderCreated(
  uint256 indexed orderId,
  address indexed creator,
  string product,
  uint256 quantity
);

event StatusUpdated(
  uint256 indexed orderId,
  OrderStatus newStatus
);
```

**Tại sao:** Frontend listens to these events để biết blockchain confirm

**Thời gian:** 10 phút

---

#### 3. Create Order Function
**File:** `blockchain/contracts/OrderTracking.sol` (Lines 45-55)

```solidity
function createOrder(string memory _product, uint256 _quantity) public {
  // 1. Tạo orderId mới (auto-increment từ orderCounter)
  uint256 orderId = orderCounter++;
  
  // 2. Lưu order vào mapping
  orders[orderId] = Order({
    id: orderId,
    creator: msg.sender,  // Wallet của user
    product: _product,
    quantity: _quantity,
    status: OrderStatus.CREATED,  // Status = 0
    timestamp: block.timestamp,
    createdAt: block.timestamp
  });
  
  // 3. Phát event (emit) để frontend biết
  emit OrderCreated(orderId, msg.sender, _product, _quantity);
}
```

**Điểm chính:**
- Auto-increment orderId
- lưu vào blockchain (immutable)
- Emit event với orderId

**Thời gian:** 20 phút

---

#### 4. Update Status Function
**File:** `blockchain/contracts/OrderTracking.sol` (Lines 57-66)

```solidity
function updateStatus(
  uint256 _orderId,
  OrderStatus _newStatus
) public onlyOwner {
  // 1. Kiểm tra order tồn tại
  require(orders[_orderId].id != 0, "Order not found");
  
  // 2. Update status
  orders[_orderId].status = _newStatus;
  
  // 3. Emit event
  emit StatusUpdated(_orderId, _newStatus);
}

modifier onlyOwner() {
  require(msg.sender == owner, "Only owner can call");
  _;
}
```

**Điểm chính:**
- Chỉ owner (admin) có thể update
- Check order exists
- Emit event

**Thời gian:** 20 phút

---

#### 5. Get Order Function
**File:** `blockchain/contracts/OrderTracking.sol` (Lines 68-72)

```solidity
function getOrder(uint256 _orderId)
  public view
  returns (Order memory)
{
  return orders[_orderId];
}
```

**Điểm chính:**
- View function (read-only, không tốn gas)
- Trả về Order struct
- Frontend gọi hàm này để lấy data

**Thời gian:** 10 phút

---

#### 6. Get Order History
**File:** `blockchain/contracts/OrderTracking.sol` (Lines 74-80)

```solidity
function getOrderHistory(uint256 _orderId)
  public view
  returns (Order memory)
{
  return orders[_orderId];
  // Thực tế cần loop through all, but concept là get history
}
```

**Thời gian:** 10 phút

---

#### 7. Contract Deployment
**File:** `blockchain/deployments/deployment-cronos-*.json`

**Thông tin:**
```json
{
  "address": "0x5663b4AF89cFBFf92A29F8cb53516B705eF055C8",
  "chainId": 338,  // Cronos Testnet
  "owner": "0x0aCdc16d8fB5ac46cC309Cbe6b235BC481c91B4a"
}
```

**Thời gian:** 10 phút

---

#### 8. Testing
**File:** `blockchain/test/OrderTracking.test.js`
- Unit tests cho các functions
- Test scenarios

**Thời gian:** 20 phút

---

### Blockchain Flow Chart
```
Frontend: contract.createOrder("Laptop", 1)
    ↓
OrderTracking.sol:45
    ├─ orderId = orderCounter++ (e.g., 123)
    ├─ orders[123] = { id: 123, creator: msg.sender, ... }
    ├─ emit OrderCreated(123, creator, "Laptop", 1)
    └─ Return (blockchain stores data)

Frontend receives event
    ├─ Extract orderId = 123
    └─ Call API POST /metadata

---

Admin: contract.updateStatus(123, 2)
    ↓
OrderTracking.sol:57
    ├─ Check msg.sender == owner
    ├─ Check orders[123] exists
    ├─ orders[123].status = 2  // SHIPPED
    ├─ emit StatusUpdated(123, 2)
    └─ Return (blockchain updates)

Frontend receives event
    ├─ Blockchain confirmed
    └─ Call API PUT /status
```

---

### Blockchain Learning Timeline (1.5 hours)
1. Contract structure & enums (20 min)
2. Events (10 min)
3. createOrder() function (20 min)
4. updateStatus() function (20 min)
5. getOrder() function (10 min)
6. Deployment info (10 min)
7. Testing (20 min)

---

---

## 🔄 SYSTEM FLOW (End-to-End)

### Complete Flow: CREATE ORDER

```
┌─────────────────────────────────────────────────────────────────┐
│                    USER CREATES ORDER                           │
└─────────────────────────────────────────────────────────────────┘

1. FRONTEND (React)
   └─ User fills form in CreateOrder.jsx
      └─ productName: "Laptop"
      └─ quantity: 1
      └─ recipientEmail: "customer@gmail.com"
      └─ Click "Create Order" button

2. FRONTEND (useOrder hook)
   └─ Line 190: const tx = await contract.createOrder("Laptop", 1)
      
      This calls...
      
3. BLOCKCHAIN (Solidity)
   └─ OrderTracking.sol:45
      └─ function createOrder(string memory _product, uint256 _quantity)
         ├─ orderId = 0 + 1 = 1 (orderCounter increments)
         ├─ orders[1] = Order {
         │    id: 1,
         │    creator: 0x123... (user's wallet),
         │    product: "Laptop",
         │    quantity: 1,
         │    status: OrderStatus.CREATED (0),
         │    timestamp: block.timestamp,
         │    createdAt: block.timestamp
         │  }
         ├─ emit OrderCreated(1, 0x123..., "Laptop", 1)
         └─ Transaction mined & confirmed (~30 seconds)

4. FRONTEND (React)
   └─ const receipt = await tx.wait()  // Chờ blockchain confirm
      └─ Extract orderId from receipt.events[0].args.orderId = 1
      └─ Continue to next step

5. FRONTEND (apiService)
   └─ Line 173: await apiService.saveOrderMetadata({
        orderId: "1",
        productName: "Laptop",
        quantity: 1,
        recipientEmail: "customer@gmail.com",
        senderAddress: { address: "0x123..." }
      })
      
      This calls...

6. BACKEND (Express API)
   └─ api-server.js:247 POST /api/metadata
      └─ const { orderId, productName, quantity, recipientEmail, senderAddress } = req.body
         ├─ const order = await Order.create({
         │    orderId: "1",
         │    metadata: {
         │      productName: "Laptop",
         │      quantity: 1,
         │      createdAt: Date.now()
         │    },
         │    recipient: {
         │      email: "customer@gmail.com"  ← IMPORTANT: Email saved here
         │    },
         │    sender: {
         │      address: "0x123..."
         │    },
         │    status: "CREATED"
         │  })
         │
         └─ Database saved ✅

7. BACKEND (Email Service)
   └─ api-server.js:310
      └─ emailService.sendOrderCreatedEmail(
           "customer@gmail.com",
           "Laptop",
           "1"
         )
         
      This calls...

8. EMAIL SERVICE (Nodemailer)
   └─ email-service.js:43 sendOrderCreatedEmail()
      └─ Create HTML template:
         ```html
         <h1>Your Order Has Been Created!</h1>
         <p>Order ID: 1</p>
         <p>Product: Laptop</p>
         <p>Status: CREATED</p>
         ```
         
      └─ Configure Gmail SMTP:
         service: 'gmail'
         user: 'socialcqt@gmail.com'
         pass: process.env.GMAIL_APP_PASSWORD
         
      └─ Send email via Gmail:
         from: 'socialcqt@gmail.com'
         to: 'customer@gmail.com'
         subject: 'Order Confirmation'
         html: template
         
      └─ Email sent ✅ (async, doesn't block)

9. BACKEND (Response)
   └─ api-server.js returns:
      {
        success: true,
        orderId: "1",
        message: "Order metadata saved successfully"
      }

10. FRONTEND (Response)
    └─ React shows success toast message
       └─ Order created successfully! ✅

11. CUSTOMER (Email)
    └─ Customer receives email in inbox
       From: socialcqt@gmail.com
       To: customer@gmail.com
       Subject: Order Confirmation
       Body: HTML with Order ID 1, Product Laptop, Status CREATED ✅

RESULT:
✅ Blockchain: Order 1 stored on Cronos Testnet
✅ Database: Order metadata + email stored in MongoDB
✅ Email: Customer received confirmation email
```

---

### Complete Flow: UPDATE STATUS

```
┌─────────────────────────────────────────────────────────────────┐
│                 ADMIN UPDATES ORDER STATUS                      │
└─────────────────────────────────────────────────────────────────┘

1. FRONTEND (React)
   └─ Admin views OrderDetail.jsx
      └─ Sees order #1 with status "CREATED"
      └─ Dropdown with status options (CONFIRMED, SHIPPED, DELIVERED)
      └─ Admin selects "SHIPPED"

2. FRONTEND (OrderDetail)
   └─ Line 151: handleUpdateStatus("2")  // 2 = SHIPPED
      └─ Calls updateOrderStatus(1, 2)  // orderId, status
      
      This calls...

3. FRONTEND (useOrder hook)
   └─ useOrder.js:141 updateOrderStatus()
      └─ Line 143: const tx = await contract.updateStatus(1, 2)
      
      This calls...

4. BLOCKCHAIN (Solidity)
   └─ OrderTracking.sol:57 updateStatus()
      └─ function updateStatus(uint256 _orderId, OrderStatus _newStatus) public onlyOwner
         ├─ require(msg.sender == owner) ← Check: must be admin
         │  msg.sender = 0x0aCdc16d8fB5ac46cC309Cbe6b235BC481c91B4a ✅
         │
         ├─ require(orders[1].id != 0) ← Check: order exists ✅
         │
         ├─ orders[1].status = OrderStatus.SHIPPED  // 2
         │
         ├─ emit StatusUpdated(1, OrderStatus.SHIPPED)
         │
         └─ Transaction mined & confirmed (~30 seconds)

5. FRONTEND (React)
   └─ useOrder.js:156: const receipt = await tx.wait()
      └─ Blockchain confirmed ✅
      └─ Continue to next step

6. FRONTEND (API Call)
   └─ useOrder.js:181-206 (KEY PART!)
      └─ const response = await fetch(`http://localhost:3000/api/status`, {
           method: 'PUT',
           headers: { 'Content-Type': 'application/json' },
           body: JSON.stringify({
             orderId: 1,
             status: 2,
             statusName: 'SHIPPED'
           })
         })
      
      This calls...

7. BACKEND (Express API)
   └─ api-server.js:327 PUT /api/status
      └─ const { orderId, status, statusName } = req.body
         │
         ├─ const order = await Order.findOne({ orderId: 1 })
         │  └─ Found order in MongoDB ✅
         │
         ├─ order.status = "SHIPPED"
         │
         ├─ await order.save()
         │  └─ Database updated ✅
         │
         └─ Continue...

8. BACKEND (Email Service)
   └─ api-server.js:410
      └─ emailService.sendStatusUpdateEmail(
           order.recipient.email,  // "customer@gmail.com" from DB
           1,  // orderId
           "SHIPPED"
         )
         
      This calls...

9. EMAIL SERVICE (Nodemailer)
   └─ email-service.js:157 sendStatusUpdateEmail()
      └─ Create HTML template:
         ```html
         <h1>Order Status Updated</h1>
         <p>Order ID: 1</p>
         <p>New Status: SHIPPED</p>
         ```
         
      └─ Configure Gmail SMTP (same as before)
         
      └─ Send email:
         from: 'socialcqt@gmail.com'
         to: 'customer@gmail.com' (from order.recipient.email)
         subject: 'Order 1 Status: SHIPPED'
         html: template
         
      └─ Email sent ✅ (async, doesn't block)

10. BACKEND (Response)
    └─ api-server.js returns:
       {
         success: true,
         message: "Status updated and email sent"
       }

11. FRONTEND (Response)
    └─ React shows success toast
       └─ Status updated! ✅

12. CUSTOMER (Email)
    └─ Customer receives status update email
       From: socialcqt@gmail.com
       To: customer@gmail.com
       Subject: Order 1 Status: SHIPPED
       Body: HTML with new status ✅

RESULT:
✅ Blockchain: Order 1 status updated to SHIPPED (immutable record)
✅ Database: Order status updated to "SHIPPED" in MongoDB
✅ Email: Customer notified about status change
```

---

## Key Takeaways

### Data Flow Layers
```
User Interaction (React Components)
        ↓
Blockchain Calls (Contract Functions)
        ↓
API Requests (REST Endpoints)
        ↓
Database Storage (MongoDB)
        ↓
Email Notifications (Gmail SMTP)
```

### Each Role Owns One Layer
- **Frontend Developer:** React components + hooks + API calls
- **Backend Developer:** API endpoints + blockchain integration + database + email
- **Blockchain Developer:** Smart contract logic + events

### They Work Together
```
Frontend  →  Blockchain  →  Backend  →  Database
  ↓                          ↓
User Input            Smart Contract Logic
                              ↓
                        Email Service → Customer
```

### Critical Connection Points
1. **Frontend → Blockchain:** contract.createOrder(), contract.updateStatus()
2. **Blockchain → Frontend:** Events (OrderCreated, StatusUpdated)
3. **Frontend → Backend:** API POST /metadata, PUT /status
4. **Backend → Database:** Order.create(), Order.save()
5. **Backend → Email:** emailService.sendOrderCreatedEmail(), sendStatusUpdateEmail()
6. **Email → Customer:** Gmail SMTP sends emails

---

## Testing Each Layer

### Frontend Testing
```
npm install (frontend folder)
npm start → Opens React on port 3001
Test CreateOrder component
Test OrderDetail component
Check browser console for errors
```

### Backend Testing
```
node api-server.js → Starts API on port 3000
Test POST /api/metadata with curl or Postman
Test PUT /api/status with curl or Postman
Check MongoDB for saved orders
```

### Blockchain Testing
```
cd blockchain
npm test → Runs OrderTracking.test.js
Test createOrder() function
Test updateStatus() function
Test events emission
```

### End-to-End Testing
```
1. Start backend: node api-server.js
2. Start frontend: npm start (in frontend folder)
3. Create order in React UI
4. Check MongoDB for order
5. Check email inbox
6. Update status in React UI
7. Check email for status update
8. View transaction on blockchain explorer
```

---

