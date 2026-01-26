import { useState, useCallback } from 'react';
import { useContract } from '../contexts/ContractContext';
import { formatError, parseReceipt } from '../utils/helpers';

/**
 * Hook để tương tác với Order trong Smart Contract
 */
export const useOrder = () => {
  const { contract, connected, readOnlyContract } = useContract();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Tạo đơn hàng mới
   */
  const createOrder = useCallback(async (orderId, metadataHash) => {
    if (!connected || !contract) {
      throw new Error('Vui lòng kết nối ví trước');
    }

    setLoading(true);
    setError(null);

    try {
      console.log('Creating order:', { orderId, metadataHash });

      // Estimate gas trước khi gửi transaction
      let gasLimit;
      try {
        const estimatedGas = await contract.createOrder.estimateGas(orderId, metadataHash);
        // Thêm 20% buffer cho gas limit
        gasLimit = estimatedGas * 120n / 100n;
        console.log('Gas estimated:', estimatedGas.toString(), 'with buffer:', gasLimit.toString());
      } catch (estimateErr) {
        console.warn('Gas estimation failed, using default:', estimateErr.message);
        // Sử dụng gas limit mặc định nếu estimate thất bại
        gasLimit = 200000n;
      }

      // Call smart contract với gas limit
      const tx = await contract.createOrder(orderId, metadataHash, {
        gasLimit: gasLimit
      });
      console.log('Transaction sent:', tx.hash);

      // Wait for confirmation
      const receipt = await tx.wait();
      console.log('Transaction confirmed:', receipt);

      return {
        success: true,
        tx: tx,
        receipt: parseReceipt(receipt),
        txHash: receipt.hash
      };
    } catch (err) {
      console.error('Create order error:', err);
      const errorMsg = formatError(err);
      setError(errorMsg);
      throw new Error(errorMsg);
    } finally {
      setLoading(false);
    }
  }, [contract, connected]);

  /**
   * Lấy thông tin đơn hàng
   */
  const getOrder = useCallback(async (orderId) => {
    // Sử dụng contract nếu đã kết nối, nếu không dùng readOnlyContract
    const activeContract = contract || readOnlyContract;
    
    if (!activeContract) {
      throw new Error('Đang khởi tạo kết nối blockchain... Vui lòng thử lại sau vài giây.');
    }

    setLoading(true);
    setError(null);

    try {
      console.log('Getting order:', orderId, 'Using contract:', contract ? 'connected' : 'read-only');

      const order = await activeContract.getOrder(orderId);
      console.log('Raw order from contract:', order);
      
      // Kiểm tra nếu đơn hàng không tồn tại (orderId rỗng)
      if (!order || !order.orderId || order.orderId === '') {
        throw new Error('Đơn hàng không tồn tại hoặc chưa được tạo trên blockchain');
      }
      
      // Map string status to number
      const statusMap = {
        'CREATED': 0,
        'CONFIRMED': 1,
        'SHIPPED': 2,
        'DELIVERED': 3,
        'CANCELLED': 4
      };
      
      console.log('Order status:', order.currentStatus, 'Mapped to:', statusMap[order.currentStatus]);
      
      // Parse order data
      const orderData = {
        orderId: order.orderId,
        metadataHash: order.metadataHash,
        status: statusMap[order.currentStatus] || 0, // Convert string to number
        createdAt: Number(order.createdAt),
        updatedAt: Number(order.lastUpdated), // Correct field name
        adminAddress: order.adminAddress,
        isActive: order.isActive
      };

      console.log('Order data:', orderData);
      return orderData;
    } catch (err) {
      console.error('Get order error:', err);
      const errorMsg = formatError(err);
      setError(errorMsg);
      throw new Error(errorMsg);
    } finally {
      setLoading(false);
    }
  }, [contract, readOnlyContract]);

  /**
   * Cập nhật trạng thái đơn hàng
   */
  const updateOrderStatus = useCallback(async (orderId, newStatus, detailsHash = '') => {
    if (!connected || !contract) {
      throw new Error('Vui lòng kết nối ví trước');
    }

    setLoading(true);
    setError(null);

    try {
      console.log('Updating order status:', { orderId, newStatus, detailsHash });

      // Convert numeric status to string for contract
      const statusStrings = {
        0: 'CREATED',
        1: 'CONFIRMED',
        2: 'SHIPPED',
        3: 'DELIVERED',
        4: 'CANCELLED'
      };
      
      const statusString = statusStrings[newStatus] || 'CREATED';

      // Estimate gas
      let gasLimit;
      try {
        const estimatedGas = await contract.updateStatus.estimateGas(orderId, statusString, detailsHash);
        gasLimit = estimatedGas * 120n / 100n;
        console.log('Gas estimated:', estimatedGas.toString(), 'with buffer:', gasLimit.toString());
      } catch (estimateErr) {
        console.warn('Gas estimation failed, using default:', estimateErr.message);
        gasLimit = 200000n;
      }

      const tx = await contract.updateStatus(orderId, statusString, detailsHash, {
        gasLimit: gasLimit
      });
      console.log('Transaction sent:', tx.hash);

      const receipt = await tx.wait();
      console.log('Transaction confirmed:', receipt);

      return {
        success: true,
        tx: tx,
        receipt: parseReceipt(receipt),
        txHash: receipt.hash
      };
    } catch (err) {
      console.error('Update status error:', err);
      const errorMsg = formatError(err);
      setError(errorMsg);
      throw new Error(errorMsg);
    } finally {
      setLoading(false);
    }
  }, [contract, connected]);

  /**
   * Lấy lịch sử cập nhật đơn hàng
   */
  const getOrderHistory = useCallback(async (orderId) => {
    // Sử dụng contract nếu đã kết nối, nếu không dùng readOnlyContract
    const activeContract = contract || readOnlyContract;
    
    if (!activeContract) {
      throw new Error('Đang khởi tạo kết nối blockchain... Vui lòng thử lại sau vài giây.');
    }

    setLoading(true);
    setError(null);

    try {
      console.log('📜 Getting order history for:', orderId);

      const history = await activeContract.getOrderHistory(orderId);
      console.log('📦 Raw history from contract:', history);
      console.log('📊 History length:', history.length);
      
      // Map string status to number (same as getOrder)
      const statusMap = {
        'CREATED': 0,
        'CONFIRMED': 1,
        'SHIPPED': 2,
        'DELIVERED': 3,
        'CANCELLED': 4
      };
      
      // Parse history data
      const historyData = history.map((item, index) => {
        console.log(`  History item ${index}:`, item);
        return {
          status: statusMap[item.status] !== undefined ? statusMap[item.status] : 0,
          timestamp: Number(item.timestamp),
          detailsHash: item.details || item.detailsHash || '',
          updatedBy: item.updatedBy
        };
      });

      console.log('✅ Parsed history data:', historyData);
      return historyData;
    } catch (err) {
      console.error('❌ Get history error:', err);
      const errorMsg = formatError(err);
      setError(errorMsg);
      throw new Error(errorMsg);
    } finally {
      setLoading(false);
    }
  }, [contract, readOnlyContract]);

  /**
   * Hủy đơn hàng
   */
  const cancelOrder = useCallback(async (orderId) => {
    if (!connected || !contract) {
      throw new Error('Vui lòng kết nối ví trước');
    }

    setLoading(true);
    setError(null);

    try {
      console.log('Cancelling order:', orderId);

      const tx = await contract.cancelOrder(orderId);
      console.log('Transaction sent:', tx.hash);

      const receipt = await tx.wait();
      console.log('Transaction confirmed:', receipt);

      return {
        success: true,
        tx: tx,
        receipt: parseReceipt(receipt),
        txHash: receipt.hash
      };
    } catch (err) {
      console.error('Cancel order error:', err);
      const errorMsg = formatError(err);
      setError(errorMsg);
      throw new Error(errorMsg);
    } finally {
      setLoading(false);
    }
  }, [contract, connected]);

  return {
    loading,
    error,
    createOrder,
    getOrder,
    updateOrderStatus,
    getOrderHistory,
    cancelOrder
  };
};
