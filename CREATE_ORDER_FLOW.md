# 🔍 Chi Tiết: Quá Trình Tạo Đơn Hàng (Order Creation Flow)

**Mục tiêu**: Hiểu từng bước khi user tạo order, file nào tương tác file nào, code làm gì.

---

## 📍 Tổng Quan - Các Bước Chính

```
User điền form → Browser execute JavaScript
    ↓
CreateOrder.jsx gọi contract.createOrder()
    ↓
Blockchain nhận & lưu order, trả lại txHash
    ↓
CreateOrder.jsx gọi apiService.saveOrderMetadata()
    ↓
API server lưu metadata vào MongoDB
    ↓
Email service gửi email notification
    ↓
User nhận email, order đã tạo thành công
```

---

## 🎨 FRONTEND: CreateOrder.jsx

### Vị Trí: `frontend/src/components/CreateOrder/CreateOrder.jsx`

### Bước 1: User Điền Form

**Dòng 1-50** (imports + component setup)
```javascript
import React, { useState } from 'react';
import { useOrder } from '../../hooks/useOrder';
import { useContract } from '../../contexts/ContractContext';
import apiService from '../../services/apiService';
import { createMetadataHash, saveOrderMetadata } from '../../utils/orderMetadata';
import './CreateOrder.css';

const CreateOrder = () => {
  const [formData, setFormData] = useState({
    productName: '',
    quantity: '',
    price: '',
    recipientName: '',
    recipientEmail: '',    // ← QUAN TRỌNG: Email field
    recipientPhone: '',
    recipientAddress: '',
    notes: ''
  });
```
**Ý nghĩa**: 
- Import các hook & service cần dùng
- State `formData` lưu toàn bộ thông tin form
- `recipientEmail` là field bắt buộc (sẽ dùng để gửi email sau)

### Bước 2: User Click Nút "Tạo Đơn"

**Dòng 80-120** (xử lý submit)
```javascript
const handleCreateOrder = async () => {
  // Validation
  if (!account) {
    alert('Vui lòng kết nối ví trước');
    return;
  }

  if (!formData.productName || !formData.quantity || !formData.price) {
    alert('Vui lòng điền đầy đủ thông tin');
    return;
  }

  if (!formData.recipientEmail) {
    alert('Email người nhận là bắt buộc!');  // ← Bắt buộc có email
    return;
  }

  setIsLoading(true);
  try {
    // Tạo unique orderId
    const orderId = `ORD-${Date.now()}-${Math.random().toString().slice(2, 6)}`;
    console.log('📝 Creating order:', orderId);
```
**Ý nghĩa**:
- Validate form phải có account (wallet connected)
- Validate tất cả fields bắt buộc
- Tạo unique `orderId` dạng: `ORD-1770016446655-7090`

---

## ⛓️ BLOCKCHAIN: Smart Contract

### Vị Trí: `blockchain/contracts/OrderTracking.sol`

### Bước 3: Call Blockchain createOrder()

**Dòng 120-135** (trong CreateOrder.jsx)
```javascript
    // Call blockchain to create order
    const metadataHash = ethers.keccak256(
      ethers.toUtf8Bytes(JSON.stringify({
        productName: formData.productName,
        quantity: formData.quantity,
        price: formData.price
      }))
    );
    // metadataHash = hash của product info
    // Ví dụ: 0x7a3b2c1d...

    const { createOrder } = useOrder();
    const result = await createOrder(orderId, metadataHash);
    // result.txHash = blockchain transaction hash
```
**Ý nghĩa**:
- Hash tất cả product info thành 1 chuỗi hex duy nhất
- Gọi hook `useOrder.createOrder()` → sẽ gọi smart contract
- Nhận lại `txHash` từ blockchain

### Blockchain Lưu Order

**Smart Contract (OrderTracking.sol)**:
```solidity
function createOrder(string memory _orderId, bytes32 _metadataHash) public {
    require(!orders[_orderId].isActive, "Order already exists");
    
    Order memory newOrder = Order({
        orderId: _orderId,
        metadataHash: _metadataHash,
        currentStatus: Status.CREATED,      // Status = CREATED (0)
        createdAt: block.timestamp,         // Lưu thời gian tạo
        lastUpdated: block.timestamp,
        adminAddress: msg.sender,           // Admin/creator
        isActive: true
    });
    
    orders[_orderId] = newOrder;
    emit OrderCreated(_orderId, _metadataHash);
}
```
**Ý nghĩa**:
- Smart contract lưu `_orderId` làm key
- Lưu `_metadataHash` (proof của data)
- Set `currentStatus = CREATED` (0)
- Set `adminAddress = msg.sender` (wallet người tạo)
- Emit event `OrderCreated` để listeners biết

### Blockchain Trả Lại txHash

**Dòng 141-180** (trong useOrder.js - createOrder function):
```javascript
const createOrder = useCallback(async (orderId, metadataHash) => {
  // Call smart contract write function
  const tx = await contract.createOrder(orderId, metadataHash, {
    gasLimit: gasLimit
  });
  console.log('Transaction sent:', tx.hash);
  // tx.hash = "0xabc123..." ← txHash trả về
  
  const receipt = await tx.wait();  // Chờ blockchain confirm
  console.log('Transaction confirmed:', receipt);
  
  return {
    success: true,
    tx: tx,
    txHash: receipt.hash,  // ← Return lại frontend
    ...
  };
}, [contract, connected]);
```
**Ý nghĩa**:
- Gọi smart contract function
- Chờ blockchain confirm transaction
- Return `txHash` để frontend dùng sau

---

## 🔄 FRONTEND: Nhận txHash, Lưu Metadata

### Dòng 135-155 (CreateOrder.jsx tiếp tục):

```javascript
    // ✅ Blockchain transaction thành công
    console.log('✅ Order created on blockchain');
    
    // Lưu metadata lên API/MongoDB để ai cũng tra cứu được
    try {
      await apiService.saveOrderMetadata(
        orderId,
        {
          productName: formData.productName,
          quantity: parseInt(formData.quantity),
          price: formData.price,
          totalAmount: parseInt(formData.quantity) * parseFloat(formData.price),
          notes: formData.notes
        },
        {
          name: formData.recipientName,
          email: formData.recipientEmail,  // ← EMAIL CẬP NHẬT METADATA
          phone: formData.recipientPhone,
          address: formData.recipientAddress
        },
        { address: account },  // sender = wallet connected
        result.txHash          // txHash từ blockchain
      );
      console.log('✅ Metadata saved to database');
    } catch (apiError) {
      console.warn('⚠️ Failed to save metadata to database:', apiError);
    }
```
**Ý nghĩa**:
- Blockchain transaction xong, có `txHash`
- Gọi `apiService.saveOrderMetadata()` để lưu metadata
- Gửi:
  - Product info (productName, quantity, price)
  - Recipient info (**email là quan trọng**)
  - Sender address (wallet người tạo)
  - txHash từ blockchain

---

## 🌐 API SERVICE: apiService.js

### Vị Trí: `frontend/src/services/apiService.js`

### Dòng 93-110 (saveOrderMetadata function):

```javascript
async saveOrderMetadata(orderId, metadata, recipient, sender, txHash) {
  try {
    // Gọi API endpoint POST /api/orders/:orderId/metadata
    const response = await this.api.post(`/api/orders/${orderId}/metadata`, {
      metadata,      // { productName, quantity, price, ... }
      recipient,     // { name, email, phone, address }
      sender,        // { address }
      txHash         // "0xabc123..."
    });
    return response;
  } catch (error) {
    console.error('saveOrderMetadata error:', error);
    throw error;
  }
}
```
**Ý nghĩa**:
- Gọi HTTP POST request
- Endpoint: `http://localhost:3000/api/orders/ORD-1770016446655-7090/metadata`
- Body gồm: metadata, recipient (có email), sender, txHash

---

## 🖥️ BACKEND: api-server.js

### Vị Trí: `api-server.js`

### Dòng 247-325 (POST /api/orders/:orderId/metadata):

```javascript
app.post('/api/orders/:orderId/metadata', async (req, res) => {
    try {
        const { orderId } = req.params;
        const { metadata, recipient, sender, txHash } = req.body;
        // orderId = "ORD-1770016446655-7090"
        // metadata = { productName: "iPhone", quantity: 1, price: 1000 }
        // recipient = { email: "customer@gmail.com", ... }
        // sender = { address: "0x0ac..." }
        // txHash = "0xabc123..."

        console.log(`📥 POST /api/orders/${orderId}/metadata`);
        
        if (!mongoConnected) {
            return res.status(503).json({ error: 'Database not available' });
        }
        
        // Lưu order vào MongoDB
        const orderDoc = await Order.findOneAndUpdate(
            { orderId },  // Find by orderId
            {
                orderId,
                adminAddress: sender?.address,  // "0x0ac..."
                metadata: {
                    productName: metadata?.productName,  // "iPhone"
                    quantity: metadata?.quantity,        // 1
                    price: metadata?.price,              // 1000
                    totalAmount: metadata?.totalAmount,  // 1000
                    ...
                },
                recipient: {
                    name: recipient?.name,        // "Nguyễn Văn A"
                    phone: recipient?.phone,      // "0123456789"
                    address: recipient?.address,  // "123 Lê Lợi"
                    email: recipient?.email       // ← QUAN TRỌNG: Email lưu vào DB
                },
                sender: {
                    name: sender?.name,
                    address: sender?.address,    // "0x0ac..."
                    ...
                },
                blockchainHash: txHash,         // "0xabc123..."
                status: 'CREATED'
            },
            { upsert: true, new: true }
        );
        
        console.log(`✅ Order saved to MongoDB:`, orderDoc.orderId);
        
        // Gửi email notification
        if (recipient?.email) {
            const recipientEmail = recipient.email;  // "customer@gmail.com"
            const emailData = {
                orderId,
                productName: metadata?.productName,
                quantity: metadata?.quantity,
                price: metadata?.price,
                recipientName: recipient?.name,
                metadataHash: txHash,
                createdAt: new Date().toISOString()
            };
            
            console.log(`📧 Sending order creation email to ${recipientEmail}`);
            // Gọi email service gửi email
            notifyOrderCreated(recipientEmail, emailData)
                .then(() => {
                    console.log(`✅ Order creation email sent to ${recipientEmail}`);
                })
                .catch(err => {
                    console.error('❌ Failed to send email:', err.message);
                });
        }
        
        res.json({
            success: true,
            orderId,
            message: 'Metadata saved successfully',
            data: orderDoc
        });

    } catch (error) {
        res.status(500).json({
            error: 'Failed to save order metadata',
            message: error.message
        });
    }
});
```

**Ý nghĩa từng phần**:

1. **Dòng 257-260**: Lấy dữ liệu từ request body
   ```javascript
   const { orderId } = req.params;  // "ORD-..."
   const { metadata, recipient, sender, txHash } = req.body;
   ```

2. **Dòng 267**: Check MongoDB connection
   ```javascript
   if (!mongoConnected) return res.status(503).json(...);
   ```

3. **Dòng 270-298**: Lưu vào MongoDB
   ```javascript
   const orderDoc = await Order.findOneAndUpdate(
       { orderId },  // WHERE orderId = "ORD-..."
       { ... },      // SET các fields này
       { upsert: true }  // Nếu không có thì INSERT, nếu có thì UPDATE
   );
   ```
   - `recipient.email` được lưu vào DB
   - Sẽ dùng để gửi email khi update status sau

4. **Dòng 302-320**: Gửi email
   ```javascript
   if (recipient?.email) {
       const recipientEmail = recipient.email;  // Lấy email từ DB
       notifyOrderCreated(recipientEmail, emailData);  // Gọi email service
   }
   ```

---

## 📧 EMAIL SERVICE: email-service.js

### Vị Trí: `email-service.js`

### Dòng 14-38 (Gmail SMTP Setup):

```javascript
let transporter;

function initializeEmailService() {
    const emailUser = process.env.EMAIL_USER;      // "socialcqt@gmail.com"
    const emailPassword = process.env.EMAIL_PASSWORD;  // "16-char-app-password"

    transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: emailUser,
            pass: emailPassword
        }
    });
    
    console.log('✅ Email service initialized');
}
```
**Ý nghĩa**:
- Cấu hình Nodemailer để dùng Gmail SMTP
- `transporter` là object để gửi email

### Dòng 204-215 (Gửi Email Async):

```javascript
async function notifyOrderCreated(recipientEmail, orderData) {
    if (!transporter) {
        console.warn('Email service not initialized');
        return;
    }

    try {
        const emailContent = emailTemplates.orderCreated(orderData);
        
        // Gửi email
        await transporter.sendMail({
            from: process.env.EMAIL_USER,        // "socialcqt@gmail.com"
            to: recipientEmail,                  // "customer@gmail.com"
            subject: emailContent.subject,       // "📦 Đơn hàng của bạn đã được tạo"
            html: emailContent.html              // HTML email content
        });

        console.log(`✅ Email sent to ${recipientEmail}`);
    } catch (error) {
        console.error('❌ Email sending failed:', error.message);
    }
}
```
**Ý nghĩa**:
- Lấy email address từ tham số `recipientEmail`
- Tạo email content từ template
- Gửi email dùng `transporter.sendMail()`
- Log thành công hoặc lỗi

### Dòng 43-155 (Email Template):

```javascript
const emailTemplates = {
    orderCreated: (orderData) => ({
        subject: `📦 Đơn hàng của bạn đã được tạo - #${orderData.orderId}`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px;">
                <h1>✅ Đơn hàng được tạo</h1>
                
                <div style="background: #f3f4f6; padding: 20px;">
                    <h3>Thông tin đơn hàng</h3>
                    <p><strong>Mã đơn hàng:</strong> ${orderData.orderId}</p>
                    <p><strong>Sản phẩm:</strong> ${orderData.productName}</p>
                    <p><strong>Số lượng:</strong> ${orderData.quantity}</p>
                    <p><strong>Giá:</strong> ${orderData.price} VND</p>
                </div>
                
                <p>Cảm ơn bạn đã sử dụng dịch vụ của chúng tôi!</p>
            </div>
        `
    })
};
```
**Ý nghĩa**:
- Template HTML cho email order creation
- Hiển thị order ID, product name, quantity, price
- Dùng template literal `${...}` để inject data vào email

---

## 📊 DATABASE: MongoDB

### Vị Trí: `database/schemas/models.js`

### Order Schema:

```javascript
const orderSchema = new mongoose.Schema({
  orderId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  adminAddress: String,
  metadata: {
    productName: String,
    quantity: Number,
    price: Number,
    totalAmount: Number
  },
  recipient: {
    name: String,
    email: String,        // ← EMAIL ĐƯỢC LƯU TẠI ĐÂY
    phone: String,
    address: String
  },
  sender: {
    name: String,
    address: String
  },
  blockchainHash: String,
  status: String,
  createdAt: { type: Date, default: Date.now }
});
```

**Ý nghĩa**:
- `orderId` là primary key (unique)
- `recipient.email` được lưu để dùng sau (khi update status sẽ lấy email này)
- Tất cả data lưu vào MongoDB

---

## 🔄 SƠ ĐỒ: Files Tương Tác

```
CreateOrder.jsx
  │
  ├─→ useOrder.js (hook)
  │    └─→ contract.createOrder() [Blockchain]
  │        └─→ Smart Contract lưu order
  │            └─→ Return txHash
  │
  └─→ apiService.js (service)
       └─→ POST /api/orders/:orderId/metadata
            │
            └─→ api-server.js
                 │
                 ├─→ Order.findOneAndUpdate() [MongoDB]
                 │    └─→ Lưu order vào DB
                 │
                 └─→ email-service.js
                      └─→ notifyOrderCreated()
                           └─→ transporter.sendMail()
                                └─→ Gmail SMTP
                                    └─→ Gửi email đến recipient
```

---

## 📍 Lộ Trình Data:

```
Form Input:
├─ productName: "iPhone 15"
├─ quantity: 1
├─ price: 25000000
├─ recipientName: "Nguyễn Văn A"
├─ recipientEmail: "customer@gmail.com"  ← QUAN TRỌNG
└─ recipientPhone: "0123456789"

            ↓

Blockchain (Smart Contract):
├─ orderId: "ORD-1770016446655-7090"
├─ metadataHash: "0x7a3b2c1d..."
├─ status: CREATED (0)
└─ txHash: "0xabc123def456..."

            ↓

MongoDB (Database):
├─ orderId: "ORD-1770016446655-7090"
├─ metadata: { productName, quantity, price, ... }
├─ recipient: { name, email, phone, address }
├─ sender: { address }
├─ blockchainHash: "0xabc123def456..."
└─ Email lưu tại: recipient.email = "customer@gmail.com"

            ↓

Email Service:
├─ TO: "customer@gmail.com"  ← Lấy từ MongoDB
├─ SUBJECT: "📦 Đơn hàng của bạn đã được tạo - #ORD-..."
└─ BODY: HTML template với order details

            ↓

Gmail Server:
└─ Gửi email đến "customer@gmail.com"
```

---

## 🎯 Key Code Lines Cần Nhớ

| File | Dòng | Ý Nghĩa |
|------|------|---------|
| CreateOrder.jsx | 155 | `apiService.saveOrderMetadata()` - Gọi API |
| apiService.js | 95 | `this.api.post(/metadata)` - HTTP POST |
| api-server.js | 270 | `Order.findOneAndUpdate()` - Lưu DB |
| api-server.js | 304 | `notifyOrderCreated()` - Gửi email |
| email-service.js | 211 | `transporter.sendMail()` - Gửi qua Gmail |

---

## ❓ FAQ

**Q: Tại sao phải gửi metadata qua API, không lưu trực tiếp blockchain?**
A: Blockchain storage có giới hạn & tốn gas. Database lưu metadata cho search/filter, blockchain lưu proof (hash).

**Q: Email được lấy từ đâu khi update status?**
A: Từ MongoDB! Dòng 304 ở api-server.js lấy `orderDoc.recipient.email` từ database.

**Q: Tại sao txHash phải gửi đến API?**
A: Để lưu proof trên database, user có thể verify transaction trên Cronos Explorer.

**Q: Nếu email không gửi được thì sao?**
A: API sẽ trả về success=true vì blockchain đã thành công. Email gửi async (don't block response).
