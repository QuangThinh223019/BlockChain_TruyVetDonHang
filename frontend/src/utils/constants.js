// Constants cho ứng dụng Blockchain Truy Vết Đơn Hàng

// Địa chỉ Smart Contract (Cronos Testnet)
export const CONTRACT_ADDRESS = '0x5663b4AF89cFBFf92A29F8cb53516B705eF055C8';

// RPC URLs cho các mạng
export const RPC_URLS = {
  11155111: 'https://sepolia.infura.io/v3/YOUR_INFURA_KEY',
  1: 'https://mainnet.infura.io/v3/YOUR_INFURA_KEY',
  80001: 'https://rpc-mumbai.maticvigil.com',
  338: 'https://evm-t3.cronos.org',
  25: 'https://evm.cronos.org'
};

// Chain IDs
export const CHAIN_IDS = {
  SEPOLIA: 11155111,
  MAINNET: 1,
  MUMBAI: 80001,
  CRONOS_TESTNET: 338,
  CRONOS: 25
};

// Chain ID mặc định (Cronos Testnet)
export const DEFAULT_CHAIN_ID = 338;

// Tên mạng
export const NETWORK_NAMES = {
  11155111: 'Sepolia Testnet',
  1: 'Ethereum Mainnet',
  80001: 'Mumbai Testnet',
  338: 'Cronos Testnet',
  25: 'Cronos Mainnet'
};

// Trạng thái đơn hàng
export const ORDER_STATUSES = {
  CREATED: 0,
  CONFIRMED: 1,
  SHIPPED: 2,
  DELIVERED: 3,
  CANCELLED: 4
};

// Tên trạng thái tiếng Việt
export const ORDER_STATUS_LABELS = {
  0: 'Đã Tạo',
  1: 'Đã Xác Nhận',
  2: 'Đang Giao',
  3: 'Đã Giao',
  4: 'Đã Hủy'
};

// Màu sắc cho trạng thái
export const ORDER_STATUS_COLORS = {
  0: '#3b82f6', // blue
  1: '#8b5cf6', // purple
  2: '#f59e0b', // amber
  3: '#10b981', // green
  4: '#ef4444'  // red
};

// Gas limits
export const GAS_LIMITS = {
  CREATE_ORDER: 200000,
  UPDATE_STATUS: 150000,
  CANCEL_ORDER: 100000
};

// Etherscan URLs
export const ETHERSCAN_URLS = {
  11155111: 'https://sepolia.etherscan.io',
  1: 'https://etherscan.io',
  80001: 'https://mumbai.polygonscan.com',
  338: 'https://explorer.cronos.org/testnet',
  25: 'https://explorer.cronos.org'
};

// API Base URL
export const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api';

// Local Storage Keys
export const STORAGE_KEYS = {
  WALLET_ADDRESS: 'wallet_address',
  SELECTED_NETWORK: 'selected_network',
  THEME: 'theme'
};
