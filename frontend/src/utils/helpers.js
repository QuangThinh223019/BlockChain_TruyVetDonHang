/**
 * Các hàm helper chung cho ứng dụng
 */

/**
 * Tạo ID đơn hàng ngẫu nhiên
 * @returns {string} Order ID
 */
export const generateOrderId = () => {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 10000);
  return `ORD-${timestamp}-${random}`;
};

/**
 * Validate Order ID format
 * @param {string} orderId
 * @returns {boolean}
 */
export const isValidOrderId = (orderId) => {
  if (!orderId || typeof orderId !== 'string') return false;
  return orderId.length >= 3 && orderId.length <= 100;
};

/**
 * Validate metadata hash (IPFS format)
 * @param {string} hash
 * @returns {boolean}
 */
export const isValidMetadataHash = (hash) => {
  if (!hash || typeof hash !== 'string') return false;
  // Check if it's a valid IPFS hash (Qm... format)
  return /^Qm[a-zA-Z0-9]{44}$/.test(hash) || hash.length >= 10;
};

/**
 * Sleep function
 * @param {number} ms - Milliseconds
 * @returns {Promise}
 */
export const sleep = (ms) => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

/**
 * Retry async function
 * @param {Function} fn - Async function
 * @param {number} retries - Số lần retry
 * @param {number} delay - Delay giữa các lần retry (ms)
 * @returns {Promise}
 */
export const retry = async (fn, retries = 3, delay = 1000) => {
  try {
    return await fn();
  } catch (error) {
    if (retries === 0) throw error;
    await sleep(delay);
    return retry(fn, retries - 1, delay * 2);
  }
};

/**
 * Debounce function
 * @param {Function} func
 * @param {number} wait
 * @returns {Function}
 */
export const debounce = (func, wait = 300) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

/**
 * Format error message
 * @param {Error} error
 * @returns {string}
 */
export const formatError = (error) => {
  if (!error) return 'Đã xảy ra lỗi không xác định';
  
  // MetaMask errors - User rejection (kiểm tra trước các lỗi khác)
  if (error.code === 4001 || error.code === 'ACTION_REJECTED' || error.reason === 'rejected') {
    return 'Bạn đã hủy giao dịch trên MetaMask';
  }
  if (error.message?.includes('user rejected') || error.message?.includes('User denied')) {
    return 'Bạn đã hủy giao dịch trên MetaMask';
  }
  
  if (error.code === -32002) {
    return 'Vui lòng mở MetaMask và kết nối ví';
  }
  if (error.code === -32603) {
    return 'Lỗi xử lý giao dịch. Vui lòng kiểm tra số dư ví và thử lại';
  }
  
  // Network errors
  if (error.message?.includes('network')) {
    return 'Lỗi kết nối mạng. Vui lòng kiểm tra lại';
  }
  
  // Gas errors - nhưng KHÔNG phải user rejection
  if (error.message?.includes('insufficient funds') || 
      (error.message?.includes('gas') && !error.message?.includes('rejected'))) {
    return 'Không đủ ETH để trả phí gas. Vui lòng nạp thêm ETH vào ví';
  }
  
  // Contract errors - execution reverted
  if (error.message?.includes('execution reverted')) {
    // Nếu lỗi là "Order does not exist" - giữ nguyên message gốc
    if (error.message?.includes('Order does not exist') || error.message?.includes('does not exist')) {
      return error.message; // Trả về message gốc
    }
    // Các lỗi khác
    return 'Giao dịch bị từ chối bởi smart contract. Có thể mã đơn hàng đã tồn tại';
  }
  
  // UNPREDICTABLE_GAS_LIMIT
  if (error.code === 'UNPREDICTABLE_GAS_LIMIT') {
    return 'Không thể ước tính gas. Vui lòng kiểm tra dữ liệu đầu vào và số dư ví';
  }
  
  // BAD_DATA - Đơn hàng không tồn tại
  if (error.code === 'BAD_DATA') {
    return 'Không tìm thấy đơn hàng trên blockchain. Có thể giao dịch vẫn đang chờ xác nhận hoặc mã đơn hàng không đúng.';
  }
  
  // Order not found message
  if (error.message?.includes('không tồn tại') || error.message?.includes('not found')) {
    return 'Không tìm thấy đơn hàng. Nếu vừa tạo đơn, vui lòng đợi vài giây để blockchain xác nhận.';
  }
  
  return error.message || error.toString();
};

/**
 * Parse transaction receipt
 * @param {Object} receipt
 * @returns {Object}
 */
export const parseReceipt = (receipt) => {
  return {
    txHash: receipt.transactionHash || receipt.hash,
    blockNumber: receipt.blockNumber,
    gasUsed: receipt.gasUsed?.toString(),
    status: receipt.status === 1 ? 'success' : 'failed'
  };
};

/**
 * Local storage helpers
 */
export const storage = {
  set: (key, value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error('Storage set error:', error);
      return false;
    }
  },
  
  get: (key, defaultValue = null) => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.error('Storage get error:', error);
      return defaultValue;
    }
  },
  
  remove: (key) => {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error('Storage remove error:', error);
      return false;
    }
  },
  
  clear: () => {
    try {
      localStorage.clear();
      return true;
    } catch (error) {
      console.error('Storage clear error:', error);
      return false;
    }
  }
};
