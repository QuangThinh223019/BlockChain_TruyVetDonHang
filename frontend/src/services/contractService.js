import { ethers } from 'ethers';
import { GAS_LIMITS } from '../utils/constants';

/**
 * Service để tương tác với Smart Contract
 */
class ContractService {
  /**
   * Tạo đơn hàng mới
   */
  async createOrder(contract, signer, orderId, metadataHash) {
    try {
      const contractWithSigner = contract.connect(signer);
      
      const tx = await contractWithSigner.createOrder(orderId, metadataHash, {
        gasLimit: GAS_LIMITS.CREATE_ORDER
      });
      
      return tx;
    } catch (error) {
      console.error('ContractService - createOrder error:', error);
      throw error;
    }
  }

  /**
   * Lấy thông tin đơn hàng
   */
  async getOrder(contract, orderId) {
    try {
      const order = await contract.getOrder(orderId);
      return {
        orderId: order.orderId,
        metadataHash: order.metadataHash,
        status: Number(order.status),
        createdAt: Number(order.createdAt),
        updatedAt: Number(order.updatedAt),
        adminAddress: order.adminAddress,
        isActive: order.isActive
      };
    } catch (error) {
      console.error('ContractService - getOrder error:', error);
      throw error;
    }
  }

  /**
   * Cập nhật trạng thái đơn hàng
   */
  async updateOrderStatus(contract, signer, orderId, status, detailsHash) {
    try {
      const contractWithSigner = contract.connect(signer);
      
      const tx = await contractWithSigner.updateOrderStatus(
        orderId,
        status,
        detailsHash,
        {
          gasLimit: GAS_LIMITS.UPDATE_STATUS
        }
      );
      
      return tx;
    } catch (error) {
      console.error('ContractService - updateOrderStatus error:', error);
      throw error;
    }
  }

  /**
   * Lấy lịch sử đơn hàng
   */
  async getOrderHistory(contract, orderId) {
    try {
      const history = await contract.getOrderHistory(orderId);
      return history.map(item => ({
        status: Number(item.status),
        timestamp: Number(item.timestamp),
        detailsHash: item.detailsHash,
        updatedBy: item.updatedBy
      }));
    } catch (error) {
      console.error('ContractService - getOrderHistory error:', error);
      throw error;
    }
  }

  /**
   * Hủy đơn hàng
   */
  async cancelOrder(contract, signer, orderId) {
    try {
      const contractWithSigner = contract.connect(signer);
      
      const tx = await contractWithSigner.cancelOrder(orderId, {
        gasLimit: GAS_LIMITS.CANCEL_ORDER
      });
      
      return tx;
    } catch (error) {
      console.error('ContractService - cancelOrder error:', error);
      throw error;
    }
  }

  /**
   * Kiểm tra quyền admin
   */
  async isAdmin(contract, address) {
    try {
      const isAdmin = await contract.admins(address);
      return isAdmin;
    } catch (error) {
      console.error('ContractService - isAdmin error:', error);
      return false;
    }
  }

  /**
   * Lắng nghe events
   */
  listenToEvents(contract, eventName, callback) {
    try {
      contract.on(eventName, (...args) => {
        if (callback && typeof callback === 'function') {
          callback(...args);
        }
      });
    } catch (error) {
      console.error('ContractService - listenToEvents error:', error);
    }
  }

  /**
   * Dừng lắng nghe events
   */
  removeEventListener(contract, eventName) {
    try {
      contract.off(eventName);
    } catch (error) {
      console.error('ContractService - removeEventListener error:', error);
    }
  }
}

export default new ContractService();
