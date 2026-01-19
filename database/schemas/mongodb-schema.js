/**
 * MongoDB Schema Design for Order Tracking System
 * Lưu: Dữ liệu off-chain, metadata lớn, linh hoạt, thống kê
 */

// ==================== ORDER COLLECTION ====================
// Thông tin đơn hàng chi tiết
db.createCollection("orders", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["orderId", "createdAt", "status"],
      properties: {
        _id: { bsonType: "objectId" },
        orderId: { 
          bsonType: "string",
          description: "ID đơn hàng (unique)"
        },
        adminAddress: { 
          bsonType: "string",
          description: "Địa chỉ Ethereum của admin"
        },
        createdAt: { 
          bsonType: "date",
          description: "Thời điểm tạo đơn"
        },
        status: { 
          bsonType: "string",
          enum: ["CREATED", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"],
          description: "Trạng thái hiện tại"
        },
        blockchainHash: { 
          bsonType: "string",
          description: "Reference tới blockchain (tx hash hoặc metadata hash)"
        },
        metadata: {
          bsonType: "object",
          properties: {
            productName: { bsonType: "string" },
            productDescription: { bsonType: "string" },
            quantity: { bsonType: "int" },
            price: { bsonType: "double" },
            totalAmount: { bsonType: "double" }
          }
        },
        recipient: {
          bsonType: "object",
          properties: {
            name: { bsonType: "string" },
            phone: { bsonType: "string" },
            email: { bsonType: "string" },
            address: { bsonType: "string" },
            city: { bsonType: "string" },
            province: { bsonType: "string" },
            postalCode: { bsonType: "string" },
            country: { bsonType: "string" }
          }
        },
        sender: {
          bsonType: "object",
          properties: {
            name: { bsonType: "string" },
            address: { bsonType: "string" },
            phone: { bsonType: "string" }
          }
        },
        documents: {
          bsonType: "array",
          items: {
            bsonType: "object",
            properties: {
              type: { bsonType: "string", enum: ["INVOICE", "SHIPPING_LABEL", "CERTIFICATE", "OTHER"] },
              ipfsHash: { bsonType: "string" },
              fileName: { bsonType: "string" },
              uploadedAt: { bsonType: "date" }
            }
          }
        },
        images: {
          bsonType: "array",
          items: {
            bsonType: "object",
            properties: {
              ipfsHash: { bsonType: "string" },
              fileName: { bsonType: "string" },
              size: { bsonType: "int" },
              uploadedAt: { bsonType: "date" }
            }
          }
        },
        updatedAt: { 
          bsonType: "date",
          description: "Lần cập nhật cuối cùng"
        }
      }
    }
  }
});

// Index cho orders
db.orders.createIndex({ orderId: 1 }, { unique: true });
db.orders.createIndex({ adminAddress: 1 });
db.orders.createIndex({ status: 1 });
db.orders.createIndex({ createdAt: -1 });
db.orders.createIndex({ "recipient.name": 1 });

// ==================== STATUS_LOGS COLLECTION ====================
// Lịch sử cập nhật chi tiết (bổ sung từ blockchain)
db.createCollection("statusLogs", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["orderId", "status", "timestamp"],
      properties: {
        _id: { bsonType: "objectId" },
        orderId: { 
          bsonType: "string",
          description: "ID đơn hàng"
        },
        status: { 
          bsonType: "string",
          description: "Trạng thái"
        },
        timestamp: { 
          bsonType: "date",
          description: "Thời điểm cập nhật"
        },
        details: {
          bsonType: "object",
          properties: {
            location: { bsonType: "string" },
            notes: { bsonType: "string" },
            handler: { bsonType: "string" },
            contactPhone: { bsonType: "string" }
          }
        },
        attachments: {
          bsonType: "array",
          items: { bsonType: "string", description: "IPFS hash" }
        },
        blockchainTxHash: { 
          bsonType: "string",
          description: "Tx hash từ blockchain khi lưu status này"
        },
        updatedBy: { 
          bsonType: "string",
          description: "Địa chỉ Ethereum của người cập nhật"
        }
      }
    }
  }
});

db.statusLogs.createIndex({ orderId: 1, timestamp: -1 });
db.statusLogs.createIndex({ status: 1 });
db.statusLogs.createIndex({ timestamp: -1 });

// ==================== IPFS_REFERENCES COLLECTION ====================
// Theo dõi tất cả file lưu trên IPFS
db.createCollection("ipfsReferences", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["ipfsHash", "type"],
      properties: {
        _id: { bsonType: "objectId" },
        ipfsHash: { 
          bsonType: "string",
          description: "Hash IPFS"
        },
        orderId: { 
          bsonType: "string",
          description: "ID đơn hàng liên quan"
        },
        type: { 
          bsonType: "string",
          enum: ["IMAGE", "INVOICE", "SHIPPING_LABEL", "CERTIFICATE", "OTHER"],
          description: "Loại file"
        },
        fileName: { 
          bsonType: "string",
          description: "Tên file"
        },
        size: { 
          bsonType: "int",
          description: "Kích thước (bytes)"
        },
        mimeType: { 
          bsonType: "string",
          description: "MIME type"
        },
        uploadedAt: { 
          bsonType: "date",
          description: "Thời điểm upload"
        },
        uploadedBy: { 
          bsonType: "string",
          description: "Địa chỉ Ethereum của người upload"
        },
        description: { 
          bsonType: "string"
        }
      }
    }
  }
});

db.ipfsReferences.createIndex({ ipfsHash: 1 }, { unique: true });
db.ipfsReferences.createIndex({ orderId: 1 });
db.ipfsReferences.createIndex({ type: 1 });
db.ipfsReferences.createIndex({ uploadedAt: -1 });

// ==================== USERS COLLECTION ====================
// Thông tin người dùng (admin, nhân viên vận chuyển)
db.createCollection("users", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["address", "role"],
      properties: {
        _id: { bsonType: "objectId" },
        address: { 
          bsonType: "string",
          description: "Địa chỉ Ethereum (unique)"
        },
        name: { 
          bsonType: "string",
          description: "Tên người dùng"
        },
        email: { 
          bsonType: "string",
          description: "Email"
        },
        phone: { 
          bsonType: "string"
        },
        role: { 
          bsonType: "string",
          enum: ["ADMIN", "SHIPPER", "VIEWER"],
          description: "Vai trò người dùng"
        },
        organization: { 
          bsonType: "string",
          description: "Tên tổ chức / công ty"
        },
        isActive: { 
          bsonType: "bool",
          description: "Tài khoản có hoạt động không"
        },
        createdAt: { 
          bsonType: "date"
        },
        updatedAt: { 
          bsonType: "date"
        }
      }
    }
  }
});

db.users.createIndex({ address: 1 }, { unique: true });
db.users.createIndex({ email: 1 }, { unique: true });
db.users.createIndex({ role: 1 });

// ==================== STATISTICS COLLECTION ====================
// Dữ liệu thống kê
db.createCollection("statistics", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      properties: {
        _id: { bsonType: "objectId" },
        date: { 
          bsonType: "date",
          description: "Ngày thống kê"
        },
        totalOrders: { bsonType: "int" },
        deliveredOrders: { bsonType: "int" },
        cancelledOrders: { bsonType: "int" },
        pendingOrders: { bsonType: "int" },
        totalValue: { bsonType: "double" },
        averageDeliveryTime: { bsonType: "double", description: "Giờ" },
        adminAddress: { bsonType: "string" }
      }
    }
  }
});

db.statistics.createIndex({ date: -1 });
db.statistics.createIndex({ adminAddress: 1, date: -1 });

// ==================== BLOCKCHAIN_EVENTS COLLECTION ====================
// Lưu tất cả event từ blockchain
db.createCollection("blockchainEvents", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["eventName", "orderId"],
      properties: {
        _id: { bsonType: "objectId" },
        eventName: { 
          bsonType: "string",
          enum: ["OrderCreated", "OrderStatusUpdated", "OrderCancelled"],
          description: "Tên event"
        },
        orderId: { 
          bsonType: "string"
        },
        transactionHash: { 
          bsonType: "string",
          description: "Tx hash blockchain"
        },
        blockNumber: { 
          bsonType: "int"
        },
        blockTimestamp: { 
          bsonType: "date"
        },
        from: { 
          bsonType: "string",
          description: "Địa chỉ tác tử"
        },
        eventData: { 
          bsonType: "object",
          description: "Dữ liệu event chi tiết"
        },
        syncedAt: { 
          bsonType: "date",
          description: "Thời điểm đồng bộ vào MongoDB"
        }
      }
    }
  }
});

db.blockchainEvents.createIndex({ orderId: 1, blockTimestamp: -1 });
db.blockchainEvents.createIndex({ transactionHash: 1 }, { unique: true });
db.blockchainEvents.createIndex({ eventName: 1 });
db.blockchainEvents.createIndex({ blockNumber: 1 });

// ==================== AUDIT_LOGS COLLECTION ====================
// Ghi nhận tất cả hành động trên hệ thống
db.createCollection("auditLogs", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["action", "actor", "timestamp"],
      properties: {
        _id: { bsonType: "objectId" },
        action: { 
          bsonType: "string",
          description: "Hành động thực hiện"
        },
        actor: { 
          bsonType: "string",
          description: "Địa chỉ Ethereum"
        },
        orderId: { 
          bsonType: "string"
        },
        details: { 
          bsonType: "object"
        },
        timestamp: { 
          bsonType: "date"
        },
        ipAddress: { 
          bsonType: "string"
        }
      }
    }
  }
});

db.auditLogs.createIndex({ timestamp: -1 });
db.auditLogs.createIndex({ actor: 1, timestamp: -1 });
db.auditLogs.createIndex({ orderId: 1 });

// TTL Index - tự động xóa log cũ sau 90 ngày
db.auditLogs.createIndex({ timestamp: 1 }, { expireAfterSeconds: 7776000 });
