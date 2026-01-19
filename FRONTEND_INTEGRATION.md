# 🎨 Frontend Integration Guide

**For Frontend Team**

---

## 📋 Overview

Frontend cần tích hợp:
1. **Smart Contract** (Web3.js/Ethers.js)
2. **REST API** (HTTP requests)
3. **Real-time Updates** (WebSocket/Events)
4. **MetaMask** (Wallet connection)

---

## 🔧 Setup

### 1. Install Dependencies
```bash
npm install ethers web3 axios dotenv
```

### 2. Environment Variables
```env
REACT_APP_CONTRACT_ADDRESS=0x5FbDB2315Fa8eb8e9e3a7C0A5e9E1C1B4E6F8A0D
REACT_APP_RPC_URL=http://localhost:8545
REACT_APP_API_URL=http://localhost:3000/api
REACT_APP_CHAIN_ID=31337  # or 11155111 for Sepolia
```

---

## 📝 Smart Contract ABI

File location: `blockchain/artifacts/contracts/OrderTracking.sol/OrderTracking.json`

```json
{
  "contractAddress": "0x5FbDB2315...",
  "abi": [
    {
      "type": "function",
      "name": "createOrder",
      "inputs": [
        { "name": "_orderId", "type": "string" },
        { "name": "_metadataHash", "type": "string" }
      ],
      "outputs": [{ "name": "", "type": "bool" }],
      "stateMutability": "nonpayable"
    },
    ... (xem file ABI đầy đủ)
  ],
  "events": [
    {
      "name": "OrderCreated",
      "inputs": [
        { "name": "orderId", "indexed": true, "type": "string" },
        { "name": "admin", "indexed": true, "type": "address" },
        { "name": "timestamp", "type": "uint256" },
        { "name": "metadataHash", "type": "string" }
      ]
    }
  ]
}
```

---

## 🔗 Smart Contract Integration

### 1. Connect Wallet (MetaMask)

```javascript
// utils/web3.js
import { ethers } from 'ethers';

const connectWallet = async () => {
  try {
    // Request wallet connection
    const accounts = await window.ethereum.request({
      method: 'eth_requestAccounts'
    });

    // Get provider
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();

    // Get user address
    const address = await signer.getAddress();
    console.log('Connected:', address);

    return { provider, signer, address };
  } catch (error) {
    console.error('Connection failed:', error);
  }
};

// Check if MetaMask installed
const isMetaMaskInstalled = () => {
  return typeof window.ethereum !== 'undefined' &&
         window.ethereum.isMetaMask === true;
};

export { connectWallet, isMetaMaskInstalled };
```

---

### 2. Initialize Contract

```javascript
// utils/contract.js
import { ethers } from 'ethers';
import ContractABI from '../contracts/OrderTracking.json';

const CONTRACT_ADDRESS = process.env.REACT_APP_CONTRACT_ADDRESS;

const getContract = (signer) => {
  return new ethers.Contract(
    CONTRACT_ADDRESS,
    ContractABI.abi,
    signer
  );
};

const getContractReadOnly = () => {
  const provider = new ethers.providers.JsonRpcProvider(
    process.env.REACT_APP_RPC_URL
  );
  
  return new ethers.Contract(
    CONTRACT_ADDRESS,
    ContractABI.abi,
    provider
  );
};

export { getContract, getContractReadOnly, CONTRACT_ADDRESS };
```

---

### 3. Create Order (Write to Blockchain)

```javascript
// services/orderService.js
import { getContract } from '../utils/contract';

// Create order on blockchain
const createOrderOnBlockchain = async (orderId, metadataHash, signer) => {
  try {
    const contract = getContract(signer);

    console.log('Creating order:', orderId);
    
    // Call smart contract
    const tx = await contract.createOrder(orderId, metadataHash);
    
    console.log('Transaction submitted:', tx.hash);
    
    // Wait for confirmation
    const receipt = await tx.wait();
    
    console.log('Order created! Block:', receipt.blockNumber);
    
    return {
      success: true,
      transactionHash: receipt.transactionHash,
      blockNumber: receipt.blockNumber,
      blockHash: receipt.blockHash
    };
  } catch (error) {
    console.error('Failed to create order:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
};

export { createOrderOnBlockchain };
```

---

### 4. Get Order Details (Read from Blockchain)

```javascript
// services/orderService.js
import { getContractReadOnly } from '../utils/contract';

// Get order from blockchain
const getOrderFromBlockchain = async (orderId) => {
  try {
    const contract = getContractReadOnly();
    
    const order = await contract.getOrder(orderId);
    
    return {
      orderId: order.orderId,
      status: order.currentStatus,
      admin: order.adminAddress,
      timestamp: new Date(order.createdAt.toNumber() * 1000),
      lastUpdated: new Date(order.lastUpdated.toNumber() * 1000),
      metadataHash: order.metadataHash,
      isActive: order.isActive
    };
  } catch (error) {
    console.error('Failed to get order:', error.message);
    return null;
  }
};

export { getOrderFromBlockchain };
```

---

### 5. Listen to Events (Real-time)

```javascript
// hooks/useOrderEvents.js
import { useEffect, useState } from 'react';
import { getContractReadOnly } from '../utils/contract';

const useOrderEvents = (orderId) => {
  const [events, setEvents] = useState([]);

  useEffect(() => {
    const contract = getContractReadOnly();

    // Listen for OrderStatusUpdated events
    const filter = contract.filters.OrderStatusUpdated(orderId, null);

    const handleOrderStatusUpdated = (orderId, newStatus, timestamp, detailsHash, updatedBy, event) => {
      console.log('Order status updated:', newStatus);
      
      setEvents(prev => [...prev, {
        type: 'StatusUpdated',
        newStatus,
        timestamp: new Date(timestamp.toNumber() * 1000),
        updatedBy,
        blockNumber: event.blockNumber
      }]);
    };

    contract.on(filter, handleOrderStatusUpdated);

    return () => {
      contract.removeAllListeners(filter);
    };
  }, [orderId]);

  return events;
};

export default useOrderEvents;
```

---

## 🌐 REST API Integration

### 1. Setup Axios Client

```javascript
// utils/api.js
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL;

const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add token to requests
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized
      localStorage.removeItem('authToken');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default apiClient;
```

---

### 2. Order API Calls

```javascript
// services/api.js
import apiClient from '../utils/api';

// Get order details
export const getOrder = async (orderId) => {
  try {
    const response = await apiClient.get(`/orders/${orderId}`);
    return response.data.data;
  } catch (error) {
    console.error('Error fetching order:', error);
    throw error;
  }
};

// Get order history
export const getOrderHistory = async (orderId) => {
  try {
    const response = await apiClient.get(`/orders/${orderId}/history`);
    return response.data.data.history;
  } catch (error) {
    console.error('Error fetching history:', error);
    throw error;
  }
};

// Get order status
export const getOrderStatus = async (orderId) => {
  try {
    const response = await apiClient.get(`/orders/${orderId}/status`);
    return response.data.data;
  } catch (error) {
    console.error('Error fetching status:', error);
    throw error;
  }
};

// Create order (API only)
export const createOrder = async (orderData) => {
  try {
    const response = await apiClient.post('/orders', orderData);
    return response.data.data;
  } catch (error) {
    console.error('Error creating order:', error);
    throw error;
  }
};

// Update order status
export const updateOrderStatus = async (orderId, statusData) => {
  try {
    const response = await apiClient.put(`/orders/${orderId}/status`, statusData);
    return response.data.data;
  } catch (error) {
    console.error('Error updating status:', error);
    throw error;
  }
};

// Search orders
export const searchOrders = async (filters) => {
  try {
    const response = await apiClient.get('/orders', { params: filters });
    return response.data;
  } catch (error) {
    console.error('Error searching orders:', error);
    throw error;
  }
};

// Upload file
export const uploadFile = async (orderId, file, fileType) => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', fileType);

    const response = await apiClient.post(`/orders/${orderId}/upload`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });

    return response.data.data;
  } catch (error) {
    console.error('Error uploading file:', error);
    throw error;
  }
};

export default {
  getOrder,
  getOrderHistory,
  getOrderStatus,
  createOrder,
  updateOrderStatus,
  searchOrders,
  uploadFile
};
```

---

## 🎯 React Component Examples

### 1. Order Detail Component

```javascript
// components/OrderDetail.jsx
import React, { useState, useEffect } from 'react';
import { getOrder, getOrderHistory, getOrderStatus } from '../services/api';
import { getOrderFromBlockchain } from '../services/orderService';
import useOrderEvents from '../hooks/useOrderEvents';

const OrderDetail = ({ orderId }) => {
  const [order, setOrder] = useState(null);
  const [history, setHistory] = useState([]);
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const blockchainEvents = useOrderEvents(orderId);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        // Get from MongoDB
        const orderData = await getOrder(orderId);
        setOrder(orderData);

        // Get history
        const historyData = await getOrderHistory(orderId);
        setHistory(historyData);

        // Get current status
        const statusData = await getOrderStatus(orderId);
        setStatus(statusData);

        // Get from blockchain
        const blockchainOrder = await getOrderFromBlockchain(orderId);
        console.log('Blockchain data:', blockchainOrder);

      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderId]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!order) return <div>Order not found</div>;

  return (
    <div className="order-detail">
      <h1>Order {order.orderId}</h1>

      <div className="order-info">
        <p><strong>Status:</strong> {order.status}</p>
        <p><strong>Created:</strong> {new Date(order.createdAt).toLocaleString()}</p>
        <p><strong>Recipient:</strong> {order.recipient.name}</p>
        <p><strong>Product:</strong> {order.metadata.productName}</p>
      </div>

      <div className="timeline">
        <h2>Timeline</h2>
        {history.map((log, index) => (
          <div key={index} className="timeline-item">
            <p><strong>{log.status}</strong></p>
            <p>{new Date(log.timestamp).toLocaleString()}</p>
            <p>{log.details?.location}</p>
          </div>
        ))}
      </div>

      {blockchainEvents.length > 0 && (
        <div className="blockchain-events">
          <h2>Real-time Updates</h2>
          {blockchainEvents.map((event, index) => (
            <p key={index}>{event.type}: {event.newStatus}</p>
          ))}
        </div>
      )}
    </div>
  );
};

export default OrderDetail;
```

---

### 2. Create Order Component

```javascript
// components/CreateOrder.jsx
import React, { useState } from 'react';
import { createOrderOnBlockchain } from '../services/orderService';
import { createOrder } from '../services/api';
import { connectWallet } from '../utils/web3';

const CreateOrder = () => {
  const [formData, setFormData] = useState({
    orderId: '',
    productName: '',
    quantity: 1,
    price: 0,
    recipientName: '',
    recipientPhone: '',
    recipientAddress: ''
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 1. Connect wallet
      const { signer } = await connectWallet();

      // 2. Create on blockchain
      const metadataHash = 'Qm' + Math.random().toString(36).substring(7);
      
      const blockchainResult = await createOrderOnBlockchain(
        formData.orderId,
        metadataHash,
        signer
      );

      if (!blockchainResult.success) {
        throw new Error(blockchainResult.error);
      }

      // 3. Create in MongoDB
      const apiResult = await createOrder({
        orderId: formData.orderId,
        metadata: {
          productName: formData.productName,
          quantity: parseInt(formData.quantity),
          price: parseFloat(formData.price),
          totalAmount: parseInt(formData.quantity) * parseFloat(formData.price)
        },
        recipient: {
          name: formData.recipientName,
          phone: formData.recipientPhone,
          address: formData.recipientAddress
        }
      });

      setResult({
        success: true,
        message: 'Order created successfully!',
        orderId: formData.orderId,
        txHash: blockchainResult.transactionHash
      });

    } catch (error) {
      setResult({
        success: false,
        message: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-order">
      <h2>Create New Order</h2>

      {result && (
        <div className={`alert ${result.success ? 'success' : 'error'}`}>
          {result.message}
          {result.txHash && <p>Tx: {result.txHash}</p>}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <input
          type="text"
          name="orderId"
          placeholder="Order ID"
          value={formData.orderId}
          onChange={handleChange}
          required
        />

        <input
          type="text"
          name="productName"
          placeholder="Product Name"
          value={formData.productName}
          onChange={handleChange}
          required
        />

        <input
          type="number"
          name="quantity"
          placeholder="Quantity"
          value={formData.quantity}
          onChange={handleChange}
          required
        />

        <input
          type="number"
          name="price"
          placeholder="Price"
          step="0.01"
          value={formData.price}
          onChange={handleChange}
          required
        />

        <input
          type="text"
          name="recipientName"
          placeholder="Recipient Name"
          value={formData.recipientName}
          onChange={handleChange}
          required
        />

        <input
          type="tel"
          name="recipientPhone"
          placeholder="Recipient Phone"
          value={formData.recipientPhone}
          onChange={handleChange}
          required
        />

        <textarea
          name="recipientAddress"
          placeholder="Recipient Address"
          value={formData.recipientAddress}
          onChange={handleChange}
          required
        />

        <button type="submit" disabled={loading}>
          {loading ? 'Creating...' : 'Create Order'}
        </button>
      </form>
    </div>
  );
};

export default CreateOrder;
```

---

## 📋 Important Notes for Frontend

### 1. Gas Fees
```javascript
// Estimate gas before transaction
const gasEstimate = await contract.estimateGas.createOrder(orderId, hash);
console.log('Estimated gas:', gasEstimate.toString());
```

### 2. Transaction Handling
```javascript
// Always wait for confirmation
const receipt = await tx.wait(1); // wait 1 block confirmation
// or
const receipt = await tx.wait(6); // wait 6 blocks (more secure)
```

### 3. Error Handling
```javascript
try {
  // transaction
} catch (error) {
  if (error.code === 'INSUFFICIENT_FUNDS') {
    console.log('Not enough ETH');
  } else if (error.code === 'ACTION_REJECTED') {
    console.log('User rejected transaction');
  }
}
```

### 4. Network Validation
```javascript
// Check connected network
const network = await provider.getNetwork();
console.log('Connected network:', network.chainId);

// Match with expected chain
if (network.chainId !== parseInt(process.env.REACT_APP_CHAIN_ID)) {
  alert('Please connect to correct network');
}
```

### 5. Authentication Flow
```
1. User connects wallet
2. Backend sends message to sign
3. User signs with MetaMask
4. Frontend sends signature
5. Backend verifies signature
6. Backend returns JWT token
7. Frontend stores token
8. Use token for all API calls
```

---

## 🧪 Testing Checklist

- [ ] MetaMask connection works
- [ ] Create order: Blockchain + API
- [ ] Get order: Verify data consistency
- [ ] Update status: Real-time events
- [ ] Order history: Timeline displays
- [ ] File upload: IPFS integration
- [ ] Error handling: Show user-friendly messages
- [ ] Network switching: Validate chain ID

---

**Last Updated:** January 19, 2024  
**Version:** 1.0.0  
**Status:** ✅ Ready for Implementation
