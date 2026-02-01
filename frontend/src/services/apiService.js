import axios from 'axios';
import { API_BASE_URL } from '../utils/constants';

/**
 * API Service để giao tiếp với Backend
 */
class ApiService {
  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    // Request interceptor
    this.api.interceptors.request.use(
      (config) => {
        // Add token if exists
        const token = localStorage.getItem('token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.api.interceptors.response.use(
      (response) => response.data,
      (error) => {
        if (error.response) {
          // Server responded with error
          const message = error.response.data?.message || 'Có lỗi xảy ra';
          console.error('API Error:', message);
          throw new Error(message);
        } else if (error.request) {
          // Request made but no response
          console.error('Network Error:', error.request);
          throw new Error('Lỗi kết nối mạng');
        } else {
          console.error('Error:', error.message);
          throw new Error(error.message);
        }
      }
    );
  }

  /**
   * Lấy tất cả đơn hàng
   */
  async getAllOrders(params = {}) {
    try {
      const response = await this.api.get('/orders', { params });
      return response;
    } catch (error) {
      console.error('getAllOrders error:', error);
      throw error;
    }
  }

  /**
   * Lấy đơn hàng theo ID
   */
  async getOrderById(orderId) {
    try {
      const response = await this.api.get(`/orders/${orderId}`);
      return response;
    } catch (error) {
      console.error('getOrderById error:', error);
      throw error;
    }
  }

  /**
   * Lấy metadata đơn hàng từ database
   */
  async getOrderMetadata(orderId) {
    try {
      const response = await this.api.get(`/orders/${orderId}/metadata`);
      return response;
    } catch (error) {
      console.error('getOrderMetadata error:', error);
      // Return null nếu không tìm thấy thay vì throw error
      return null;
    }
  }

  /**
   * Lưu metadata đơn hàng vào database
   */
  async saveOrderMetadata(orderId, metadata, recipient, sender, txHash) {
    try {
      const response = await this.api.post(`/orders/${orderId}/metadata`, {
        metadata,
        recipient,
        sender,
        txHash
      });
      return response;
    } catch (error) {
      console.error('saveOrderMetadata error:', error);
      throw error;
    }
  }

  /**
   * Tạo đơn hàng mới
   */
  async createOrder(orderData) {
    try {
      const response = await this.api.post('/orders', orderData);
      return response;
    } catch (error) {
      console.error('createOrder error:', error);
      throw error;
    }
  }

  /**
   * Cập nhật đơn hàng
   */
  async updateOrder(orderId, updateData) {
    try {
      const response = await this.api.put(`/orders/${orderId}`, updateData);
      return response;
    } catch (error) {
      console.error('updateOrder error:', error);
      throw error;
    }
  }

  /**
   * Xóa đơn hàng
   */
  async deleteOrder(orderId) {
    try {
      const response = await this.api.delete(`/orders/${orderId}`);
      return response;
    } catch (error) {
      console.error('deleteOrder error:', error);
      throw error;
    }
  }

  /**
   * Lấy lịch sử đơn hàng
   */
  async getOrderHistory(orderId) {
    try {
      const response = await this.api.get(`/orders/${orderId}/history`);
      return response;
    } catch (error) {
      console.error('getOrderHistory error:', error);
      throw error;
    }
  }

  /**
   * Lấy thống kê
   */
  async getStats() {
    try {
      const response = await this.api.get('/stats');
      return response;
    } catch (error) {
      console.error('getStats error:', error);
      throw error;
    }
  }

  /**
   * Kiểm tra health
   */
  async checkHealth() {
    try {
      const response = await this.api.get('/health');
      return response;
    } catch (error) {
      console.error('checkHealth error:', error);
      throw error;
    }
  }

  /**
   * Tìm kiếm đơn hàng
   */
  async searchOrders(searchTerm) {
    try {
      const response = await this.api.get('/orders/search', {
        params: { q: searchTerm }
      });
      return response;
    } catch (error) {
      console.error('searchOrders error:', error);
      throw error;
    }
  }
}

export default new ApiService();
