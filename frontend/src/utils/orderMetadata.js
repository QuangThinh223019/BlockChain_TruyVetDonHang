/**
 * Order Metadata Utilities
 * Quản lý metadata của đơn hàng trong localStorage
 */

/**
 * Tạo hash từ metadata object
 * @param {Object} metadata - Thông tin metadata của đơn hàng
 * @returns {string} Hash string
 */
export const createMetadataHash = (metadata) => {
  try {
    const jsonString = JSON.stringify(metadata);
    // Sử dụng simple hash function cho demo
    // Trong production nên dùng crypto library như crypto-js
    let hash = 0;
    for (let i = 0; i < jsonString.length; i++) {
      const char = jsonString.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return '0x' + Math.abs(hash).toString(16).padStart(64, '0');
  } catch (error) {
    console.error('Error creating metadata hash:', error);
    return '0x' + Date.now().toString(16).padStart(64, '0');
  }
};

/**
 * Lưu metadata vào localStorage
 * @param {string} orderId - Mã đơn hàng
 * @param {Object} metadata - Thông tin metadata
 */
export const saveOrderMetadata = (orderId, metadata) => {
  try {
    const key = `order_metadata_${orderId}`;
    localStorage.setItem(key, JSON.stringify(metadata));
    
    // Cập nhật danh sách order IDs
    const orderIds = getOrderIds();
    if (!orderIds.includes(orderId)) {
      orderIds.push(orderId);
      localStorage.setItem('order_ids', JSON.stringify(orderIds));
    }
    
    return true;
  } catch (error) {
    console.error('Error saving order metadata:', error);
    return false;
  }
};

/**
 * Lấy metadata từ localStorage
 * @param {string} orderId - Mã đơn hàng
 * @returns {Object|null} Metadata object hoặc null nếu không tìm thấy
 */
export const getOrderMetadata = (orderId) => {
  try {
    const key = `order_metadata_${orderId}`;
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Error getting order metadata:', error);
    return null;
  }
};

/**
 * Xóa metadata khỏi localStorage
 * @param {string} orderId - Mã đơn hàng
 */
export const removeOrderMetadata = (orderId) => {
  try {
    const key = `order_metadata_${orderId}`;
    localStorage.removeItem(key);
    
    // Cập nhật danh sách order IDs
    const orderIds = getOrderIds();
    const updatedIds = orderIds.filter(id => id !== orderId);
    localStorage.setItem('order_ids', JSON.stringify(updatedIds));
    
    return true;
  } catch (error) {
    console.error('Error removing order metadata:', error);
    return false;
  }
};

/**
 * Lấy danh sách tất cả order IDs
 * @returns {Array<string>} Mảng các order IDs
 */
export const getOrderIds = () => {
  try {
    const data = localStorage.getItem('order_ids');
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error getting order IDs:', error);
    return [];
  }
};

/**
 * Lấy tất cả metadata của các đơn hàng từ một địa chỉ ví cụ thể
 * @param {string} walletAddress - Địa chỉ ví
 * @returns {Array<Object>} Mảng các metadata objects
 */
export const getOrdersByWallet = (walletAddress) => {
  try {
    const orderIds = getOrderIds();
    const orders = [];
    
    for (const orderId of orderIds) {
      const metadata = getOrderMetadata(orderId);
      if (metadata && metadata.senderAddress?.toLowerCase() === walletAddress?.toLowerCase()) {
        orders.push({
          orderId,
          ...metadata
        });
      }
    }
    
    // Sắp xếp theo thời gian tạo (mới nhất trước)
    return orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  } catch (error) {
    console.error('Error getting orders by wallet:', error);
    return [];
  }
};

/**
 * Xóa tất cả metadata (dùng để reset)
 */
export const clearAllMetadata = () => {
  try {
    const orderIds = getOrderIds();
    orderIds.forEach(orderId => {
      const key = `order_metadata_${orderId}`;
      localStorage.removeItem(key);
    });
    localStorage.removeItem('order_ids');
    return true;
  } catch (error) {
    console.error('Error clearing all metadata:', error);
    return false;
  }
};
