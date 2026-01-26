import { ETHERSCAN_URLS, NETWORK_NAMES } from './constants';

/**
 * Rút gọn địa chỉ Ethereum
 * @param {string} address - Địa chỉ đầy đủ
 * @param {number} chars - Số ký tự hiển thị ở mỗi đầu
 * @returns {string} Địa chỉ đã rút gọn
 */
export const truncateAddress = (address, chars = 4) => {
  if (!address) return '';
  return `${address.substring(0, chars + 2)}...${address.substring(address.length - chars)}`;
};

/**
 * Kiểm tra địa chỉ Ethereum hợp lệ
 * @param {string} address - Địa chỉ cần kiểm tra
 * @returns {boolean}
 */
export const isValidAddress = (address) => {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
};

/**
 * Format số dư ETH
 * @param {string} balance - Số dư trong Wei
 * @returns {string} Số dư đã format
 */
export const formatBalance = (balance) => {
  if (!balance) return '0';
  const ethBalance = parseFloat(balance);
  if (ethBalance === 0) return '0';
  if (ethBalance < 0.0001) return '< 0.0001';
  return ethBalance.toFixed(4);
};

/**
 * Format timestamp thành ngày giờ
 * @param {number} timestamp - Unix timestamp
 * @returns {string} Ngày giờ đã format
 */
export const formatDate = (timestamp) => {
  if (!timestamp) return '';
  const date = new Date(timestamp * 1000);
  return date.toLocaleString('vi-VN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
};

/**
 * Lấy URL Etherscan cho transaction
 * @param {string} txHash - Transaction hash
 * @param {number} chainId - Chain ID (default 338 - Cronos Testnet)
 * @returns {string} URL đầy đủ
 */
export const getEtherscanUrl = (txHash, chainId = 338) => {
  const baseUrl = ETHERSCAN_URLS[chainId] || ETHERSCAN_URLS[338];
  return `${baseUrl}/tx/${txHash}`;
};

/**
 * Lấy URL Etherscan cho địa chỉ
 * @param {string} address - Địa chỉ ví
 * @param {number} chainId - Chain ID (default 338 - Cronos Testnet)
 * @returns {string} URL đầy đủ
 */
export const getAddressUrl = (address, chainId = 338) => {
  const baseUrl = ETHERSCAN_URLS[chainId] || ETHERSCAN_URLS[338];
  return `${baseUrl}/address/${address}`;
};

/**
 * Lấy tên mạng từ chain ID
 * @param {number} chainId - Chain ID
 * @returns {string} Tên mạng
 */
export const getNetworkName = (chainId) => {
  return NETWORK_NAMES[chainId] || 'Unknown Network';
};

/**
 * Copy text vào clipboard
 * @param {string} text - Text cần copy
 * @returns {Promise<boolean>}
 */
export const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    console.error('Failed to copy:', err);
    return false;
  }
};

/**
 * Format số với dấu phẩy ngăn cách hàng nghìn
 * @param {number} num - Số cần format
 * @returns {string}
 */
export const formatNumber = (num) => {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};

/**
 * Tính thời gian đã trôi qua
 * @param {number} timestamp - Unix timestamp
 * @returns {string} Thời gian tương đối
 */
export const timeAgo = (timestamp) => {
  const seconds = Math.floor(Date.now() / 1000 - timestamp);
  
  if (seconds < 60) return `${seconds} giây trước`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)} phút trước`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} giờ trước`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)} ngày trước`;
  
  return formatDate(timestamp);
};
