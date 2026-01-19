# 📡 API Specification Document

**For Backend Team**

---

## 📋 Overview

Backend API cần cung cấp các endpoints để:
1. Query order data từ MongoDB
2. Get order history từ blockchain
3. Create/Update orders
4. Manage users
5. Get statistics

---

## 🔌 Base Configuration

```
Base URL: http://localhost:3000/api
Content-Type: application/json
Authentication: Bearer Token (JWT)
```

---

## 📌 Endpoints Specification

### 1. ORDER MANAGEMENT

#### 1.1 Create Order
```
POST /orders
Content-Type: application/json
Authorization: Bearer {token}

Request Body:
{
  "orderId": "ORDER-2024-001",
  "metadata": {
    "productName": "Dell Laptop",
    "productDescription": "High-end laptop",
    "quantity": 1,
    "price": 1500,
    "sku": "DELL-001",
    "category": "Electronics"
  },
  "recipient": {
    "name": "Nguyễn Văn A",
    "phone": "0901234567",
    "email": "customer@email.com",
    "address": "123 Đường Tây Sơn",
    "city": "Hà Nội",
    "province": "Hà Nội",
    "postalCode": "100000",
    "country": "Việt Nam"
  },
  "sender": {
    "name": "Store Name",
    "address": "456 Store Street",
    "phone": "024-1234567"
  }
}

Response (201 Created):
{
  "success": true,
  "message": "Order created successfully",
  "data": {
    "orderId": "ORDER-2024-001",
    "status": "CREATED",
    "blockchainTx": "0xabc123...",
    "createdAt": "2024-01-19T10:30:00Z"
  }
}

Error (400/401):
{
  "success": false,
  "error": "Invalid input",
  "details": "Phone number format invalid"
}
```

---

#### 1.2 Get Order Details
```
GET /orders/:orderId
Authorization: Bearer {token}

Response (200):
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "orderId": "ORDER-2024-001",
    "adminAddress": "0x742d35Cc6634C0532925a3b844Bc9e7595f42e99",
    "createdAt": "2024-01-19T10:30:00Z",
    "status": "SHIPPED",
    "blockchainHash": "QmIPFSHash",
    "metadata": { ... },
    "recipient": { ... },
    "sender": { ... },
    "documents": [ ... ],
    "images": [ ... ],
    "estimatedDelivery": "2024-01-22T00:00:00Z",
    "actualDelivery": null,
    "updatedAt": "2024-01-20T14:00:00Z"
  }
}
```

---

#### 1.3 Update Order Status
```
PUT /orders/:orderId/status
Content-Type: application/json
Authorization: Bearer {token}

Request Body:
{
  "newStatus": "SHIPPED",
  "details": {
    "location": "Sorting Center",
    "notes": "Package dispatched",
    "handler": "Shipper Name",
    "contactPhone": "0987654321"
  },
  "attachments": ["QmIPFSHash1", "QmIPFSHash2"]
}

Response (200):
{
  "success": true,
  "message": "Order status updated",
  "data": {
    "orderId": "ORDER-2024-001",
    "previousStatus": "PROCESSING",
    "newStatus": "SHIPPED",
    "blockchainTx": "0xabc124...",
    "updatedAt": "2024-01-20T14:00:00Z"
  }
}
```

---

#### 1.4 Get Order Status History
```
GET /orders/:orderId/history
Authorization: Bearer {token}

Response (200):
{
  "success": true,
  "data": {
    "orderId": "ORDER-2024-001",
    "totalUpdates": 4,
    "history": [
      {
        "_id": "507f1f77bcf86cd799439011",
        "status": "CREATED",
        "timestamp": "2024-01-19T10:30:00Z",
        "details": {
          "location": "Warehouse",
          "notes": "Order created",
          "handler": "System"
        },
        "blockchainTxHash": "0xabc123..."
      },
      {
        "status": "PROCESSING",
        "timestamp": "2024-01-19T12:00:00Z",
        "details": { ... },
        "blockchainTxHash": "0xabc124..."
      },
      {
        "status": "SHIPPED",
        "timestamp": "2024-01-20T08:00:00Z",
        "details": { ... },
        "blockchainTxHash": "0xabc125..."
      },
      {
        "status": "DELIVERED",
        "timestamp": "2024-01-22T14:30:00Z",
        "details": { ... },
        "blockchainTxHash": "0xabc126..."
      }
    ]
  }
}
```

---

#### 1.5 Get Current Status
```
GET /orders/:orderId/status
Authorization: Bearer {token}

Response (200):
{
  "success": true,
  "data": {
    "orderId": "ORDER-2024-001",
    "currentStatus": "SHIPPED",
    "lastUpdated": "2024-01-20T14:00:00Z",
    "estimatedDelivery": "2024-01-22T00:00:00Z",
    "lastLocation": "Sorting Center",
    "estimatedArrival": "2 days from now"
  }
}
```

---

#### 1.6 Cancel Order
```
PUT /orders/:orderId/cancel
Authorization: Bearer {token}

Request Body:
{
  "reason": "Customer request"
}

Response (200):
{
  "success": true,
  "message": "Order cancelled successfully",
  "data": {
    "orderId": "ORDER-2024-001",
    "status": "CANCELLED",
    "cancelledAt": "2024-01-20T15:00:00Z",
    "blockchainTx": "0xabc127..."
  }
}
```

---

#### 1.7 Search Orders
```
GET /orders?status=SHIPPED&startDate=2024-01-01&endDate=2024-01-31&limit=50&page=1
Authorization: Bearer {token}

Query Parameters:
- status: CREATED|PROCESSING|SHIPPED|DELIVERED|CANCELLED (optional)
- startDate: ISO date (optional)
- endDate: ISO date (optional)
- recipient: recipient name (optional)
- recipientCity: city name (optional)
- limit: number (default: 20, max: 100)
- page: number (default: 1)
- sortBy: createdAt|status|updatedAt (default: createdAt)
- sortOrder: asc|desc (default: desc)

Response (200):
{
  "success": true,
  "pagination": {
    "total": 150,
    "page": 1,
    "limit": 50,
    "pages": 3
  },
  "data": [
    { order object },
    { order object },
    ...
  ]
}
```

---

### 2. FILE MANAGEMENT

#### 2.1 Upload File (Image/Document)
```
POST /orders/:orderId/upload
Content-Type: multipart/form-data
Authorization: Bearer {token}

Form Data:
- file: <binary>
- type: IMAGE|INVOICE|SHIPPING_LABEL|CERTIFICATE|OTHER
- description: "Optional description"

Response (201):
{
  "success": true,
  "data": {
    "ipfsHash": "QmAbCdEfGhIjKl...",
    "fileName": "invoice.pdf",
    "size": 1024576,
    "type": "INVOICE",
    "uploadedAt": "2024-01-19T10:30:00Z",
    "ipfsUrl": "https://ipfs.io/ipfs/QmAbCdEfGhIjKl..."
  }
}
```

---

#### 2.2 Get IPFS Reference
```
GET /files/:ipfsHash
Authorization: Bearer {token}

Response (200):
{
  "success": true,
  "data": {
    "ipfsHash": "QmAbCdEfGhIjKl...",
    "orderId": "ORDER-2024-001",
    "type": "INVOICE",
    "fileName": "invoice.pdf",
    "size": 1024576,
    "mimeType": "application/pdf",
    "uploadedAt": "2024-01-19T10:30:00Z",
    "uploadedBy": "0x742d35Cc...",
    "ipfsUrl": "https://ipfs.io/ipfs/QmAbCdEfGhIjKl..."
  }
}
```

---

### 3. STATISTICS

#### 3.1 Get Statistics
```
GET /statistics?date=2024-01-19&adminAddress=0x...
Authorization: Bearer {token}

Query Parameters:
- date: ISO date (optional, default: today)
- adminAddress: Ethereum address (optional)
- period: day|week|month|year (optional, default: day)

Response (200):
{
  "success": true,
  "data": {
    "date": "2024-01-19",
    "totalOrders": 125,
    "deliveredOrders": 45,
    "processingOrders": 60,
    "shippedOrders": 15,
    "cancelledOrders": 5,
    "totalValue": "₫125,000,000",
    "averageValue": "₫1,000,000",
    "averageDeliveryTime": "3.2 days",
    "deliveryRate": "92%"
  }
}
```

---

### 4. USER MANAGEMENT

#### 4.1 Get User Info
```
GET /users/:address
Authorization: Bearer {token}

Response (200):
{
  "success": true,
  "data": {
    "address": "0x742d35Cc...",
    "name": "Admin Chính",
    "email": "admin@company.com",
    "phone": "0901234567",
    "role": "ADMIN",
    "organization": "Logistics Co.",
    "isActive": true,
    "createdAt": "2024-01-15T10:00:00Z",
    "lastLogin": "2024-01-19T09:30:00Z"
  }
}
```

---

#### 4.2 Update User Profile
```
PUT /users/:address
Authorization: Bearer {token}

Request Body:
{
  "name": "Admin Chính",
  "phone": "0901234567",
  "organization": "Logistics Co."
}

Response (200):
{
  "success": true,
  "message": "Profile updated",
  "data": { user object }
}
```

---

### 5. BLOCKCHAIN INTEGRATION

#### 5.1 Get Blockchain Events
```
GET /blockchain/events?orderId=ORDER-2024-001
Authorization: Bearer {token}

Response (200):
{
  "success": true,
  "data": {
    "orderId": "ORDER-2024-001",
    "events": [
      {
        "eventName": "OrderCreated",
        "transactionHash": "0xabc123...",
        "blockNumber": 19261234,
        "blockTimestamp": "2024-01-19T10:30:00Z",
        "from": "0x742d35Cc...",
        "syncedAt": "2024-01-19T10:30:05Z"
      },
      {
        "eventName": "OrderStatusUpdated",
        "transactionHash": "0xabc124...",
        "blockNumber": 19261240,
        "blockTimestamp": "2024-01-19T12:00:00Z",
        "from": "0x1234567890...",
        "eventData": {
          "newStatus": "PROCESSING"
        }
      }
    ]
  }
}
```

---

#### 5.2 Get Audit Logs
```
GET /audit-logs?actor=0x...&orderId=ORDER-2024-001&limit=50
Authorization: Bearer {token}

Response (200):
{
  "success": true,
  "data": {
    "total": 124,
    "logs": [
      {
        "action": "ORDER_CREATED",
        "actor": "0x742d35Cc...",
        "orderId": "ORDER-2024-001",
        "details": { ... },
        "timestamp": "2024-01-19T10:30:00Z",
        "ipAddress": "192.168.1.1"
      },
      {
        "action": "ORDER_STATUS_UPDATED",
        "actor": "0x1234567890...",
        "orderId": "ORDER-2024-001",
        "details": { ... },
        "timestamp": "2024-01-19T12:00:00Z"
      }
    ]
  }
}
```

---

## 🔐 Authentication

### Login with Wallet Signature
```
POST /auth/login
Content-Type: application/json

Request:
{
  "address": "0x742d35Cc...",
  "signature": "0xsignature...",
  "message": "Sign this message to login"
}

Response (200):
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": 86400,
  "user": { user object }
}
```

### Verify JWT Token
```
Header:
Authorization: Bearer {token}

Token Payload:
{
  "iat": 1705691400,
  "exp": 1705777800,
  "sub": "0x742d35Cc...",
  "role": "ADMIN"
}
```

---

## 🎯 Error Responses

### Standard Error Format
```json
{
  "success": false,
  "error": "Error code",
  "message": "Human readable message",
  "details": "Additional details (optional)"
}
```

### HTTP Status Codes
- **200** OK - Success
- **201** Created - Resource created
- **400** Bad Request - Invalid input
- **401** Unauthorized - Auth failed
- **403** Forbidden - Permission denied
- **404** Not Found - Resource not found
- **409** Conflict - Duplicate resource
- **500** Internal Server Error - Server error

### Common Error Codes
- `INVALID_INPUT` - Validation failed
- `UNAUTHORIZED` - Authentication required
- `FORBIDDEN` - Insufficient permissions
- `NOT_FOUND` - Resource not found
- `DUPLICATE_ORDER` - Order ID already exists
- `INVALID_STATUS` - Status transition invalid
- `DATABASE_ERROR` - Database operation failed
- `BLOCKCHAIN_ERROR` - Blockchain operation failed
- `IPFS_ERROR` - IPFS operation failed

---

## 📊 Database Models Reference

```javascript
Order {
  _id: ObjectId
  orderId: String (unique)
  status: String
  metadata: Object
  recipient: Object
  sender: Object
  documents: Array
  images: Array
  createdAt: Date
  updatedAt: Date
}

StatusLog {
  _id: ObjectId
  orderId: String
  status: String
  timestamp: Date
  details: Object
  blockchainTxHash: String
  updatedBy: String
}

BlockchainEvent {
  _id: ObjectId
  eventName: String
  orderId: String
  transactionHash: String
  blockNumber: Number
  blockTimestamp: Date
  eventData: Object
}

User {
  _id: ObjectId
  address: String (unique)
  name: String
  role: String (ADMIN|SHIPPER|VIEWER)
  isActive: Boolean
}

AuditLog {
  _id: ObjectId
  action: String
  actor: String
  orderId: String
  timestamp: Date
  details: Object
}
```

---

## 🧪 Rate Limiting

```
Rate Limit: 100 requests per minute per user
Headers:
  X-RateLimit-Limit: 100
  X-RateLimit-Remaining: 95
  X-RateLimit-Reset: 1705695600
```

---

## 📝 Implementation Notes for Backend

1. **Database Connection**
   - Sử dụng connection string từ .env
   - Implement connection pooling
   - Add retry logic

2. **Authentication**
   - Verify wallet signature
   - Generate JWT tokens
   - Implement token refresh

3. **Blockchain Interaction**
   - Call smart contract functions
   - Wait for transaction confirmation
   - Handle contract errors

4. **Data Validation**
   - Validate email formats
   - Validate phone numbers
   - Validate Ethereum addresses

5. **Logging**
   - Log all API requests
   - Log blockchain transactions
   - Log errors with stack traces

6. **Caching**
   - Cache frequently accessed data
   - Implement cache invalidation
   - Use Redis for session storage

---

**Last Updated:** January 19, 2024  
**Version:** 1.0.0  
**Status:** ✅ Ready for Implementation
