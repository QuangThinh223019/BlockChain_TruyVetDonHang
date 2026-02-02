import { useState, useCallback } from 'react';
import { useOrder } from './useOrder';

/**
 * Hook để lấy order với retry logic
 * Giúp chờ blockchain xác nhận order
 */
export const useOrderWithRetry = () => {
  const { getOrder } = useOrder();
  const [retrying, setRetrying] = useState(false);

  /**
   * Lấy order với tối đa N lần thử, mỗi lần cách 2 giây
   * @param {string} orderId - ID của order
   * @param {number} maxRetries - Số lần thử tối đa (mặc định 10)
   * @param {number} delayMs - Thời gian chờ giữa các lần thử (mặc định 2000ms = 2s)
   * @returns {Promise<Object>} - Order data nếu thành công
   */
  const getOrderWithRetry = useCallback(
    async (orderId, maxRetries = 10, delayMs = 2000) => {
      setRetrying(true);
      const errors = [];

      for (let i = 0; i < maxRetries; i++) {
        try {
          console.log(`⏳ Attempting to fetch order (${i + 1}/${maxRetries})...`);
          const order = await getOrder(orderId);
          
          if (order && order.orderId) {
            console.log(`✅ Order found on blockchain after ${i + 1} attempt(s)`);
            setRetrying(false);
            return order;
          }
        } catch (err) {
          errors.push(err.message);
          console.warn(`❌ Attempt ${i + 1} failed:`, err.message);

          // Nếu không phải lần cuối cùng, chờ rồi thử lại
          if (i < maxRetries - 1) {
            const waitTime = delayMs / 1000; // Convert to seconds for display
            console.log(`⏰ Waiting ${waitTime}s before next attempt...`);
            await new Promise((resolve) => setTimeout(resolve, delayMs));
          }
        }
      }

      setRetrying(false);

      // Nếu tất cả lần thử đều thất bại
      const failureReason =
        errors.length > 0
          ? errors[errors.length - 1]
          : 'Unknown error';

      const errorMsg =
        `❌ Không thể lấy đơn hàng từ blockchain sau ${maxRetries} lần thử (${Math.round((maxRetries * delayMs) / 1000)}s).\n\n` +
        `📝 Lỗi cuối cùng: ${failureReason}\n\n` +
        `💡 Gợi ý:\n` +
        `• Đơn hàng có thể chưa được ghi lên blockchain\n` +
        `• Kiểm tra Transaction Hash trong MetaMask\n` +
        `• Thử lại sau vài phút\n` +
        `• Kiểm tra đơn hàng từ màn hình Tra cứu`;

      throw new Error(errorMsg);
    },
    [getOrder]
  );

  return {
    getOrderWithRetry,
    retrying
  };
};
