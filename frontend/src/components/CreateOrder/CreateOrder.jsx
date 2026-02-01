import React, { useState } from 'react';
import { useOrder } from '../../hooks/useOrder';
import { useContract } from '../../contexts/ContractContext';
import { generateOrderId, isValidOrderId } from '../../utils/helpers';
import { createMetadataHash, saveOrderMetadata } from '../../utils/orderMetadata';
import apiService from '../../services/apiService';
import './CreateOrder.css';

const CreateOrder = ({ onOrderCreated }) => {
  const [orderId, setOrderId] = useState('');
  const [txHash, setTxHash] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  
  // Form fields cho thông tin đơn hàng
  const [formData, setFormData] = useState({
    recipientName: '',
    recipientPhone: '',
    recipientAddress: '',
    productName: '',
    quantity: 1,
    price: '',
    notes: ''
  });
  
  const { createOrder, getOrder, loading, error } = useOrder();
  const { connected, account } = useContract();

  const handleGenerateOrderId = () => {
    const newOrderId = generateOrderId();
    setOrderId(newOrderId);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!connected) {
      alert('Vui lòng kết nối ví trước!');
      return;
    }

    if (!isValidOrderId(orderId)) {
      alert('Mã đơn hàng không hợp lệ!');
      return;
    }

    // Validate form
    if (!formData.recipientName || !formData.recipientPhone || !formData.recipientAddress) {
      alert('Vui lòng điền đầy đủ thông tin người nhận!');
      return;
    }

    if (!formData.productName || !formData.price) {
      alert('Vui lòng điền thông tin sản phẩm!');
      return;
    }

    try {
      setSuccessMessage('');
      setTxHash('');
      
      // Kiểm tra mã đơn hàng đã tồn tại chưa trước khi gửi transaction
      try {
        const existingOrder = await getOrder(orderId);
        if (existingOrder && existingOrder.orderId) {
          alert(`❌ Mã đơn hàng "${orderId}" đã tồn tại trên blockchain!\n\nVui lòng sử dụng mã khác hoặc bấm "Tạo tự động" để tạo mã mới.`);
          return;
        }
      } catch (err) {
        // Nếu lỗi "không tồn tại" thì OK, có thể tiếp tục tạo đơn
        if (!err.message.includes('không tồn tại') && !err.message.includes('does not exist')) {
          console.error('Error checking order existence:', err);
          // Nếu lỗi khác (không phải "không tồn tại"), hiển thị warning nhưng vẫn cho phép tiếp tục
          if (!window.confirm(`⚠️ Không thể kiểm tra mã đơn hàng: ${err.message}\n\nBạn có muốn tiếp tục tạo đơn?`)) {
            return;
          }
        }
      }
      
      // Tạo metadata từ form data (bao gồm cả địa chỉ gửi)
      const metadata = {
        orderId,
        senderAddress: account, // Địa chỉ ví đang đăng nhập
        recipientName: formData.recipientName,
        recipientPhone: formData.recipientPhone,
        recipientAddress: formData.recipientAddress,
        productName: formData.productName,
        quantity: parseInt(formData.quantity),
        price: formData.price,
        notes: formData.notes,
        createdAt: new Date().toISOString(),
        txHash: '' // Sẽ được cập nhật sau
      };
      
      // Tạo hash từ metadata
      const metadataHash = createMetadataHash(metadata);
      
      // Gọi smart contract
      const result = await createOrder(orderId, metadataHash);
      
      // Cập nhật txHash vào metadata
      metadata.txHash = result.txHash;
      
      // Lưu metadata vào localStorage (với txHash)
      saveOrderMetadata(orderId, metadata);
      
      // Lưu metadata lên API/MongoDB để ai cũng tra cứu được
      try {
        await apiService.saveOrderMetadata(
          orderId,
          {
            productName: formData.productName,
            quantity: parseInt(formData.quantity),
            price: formData.price,
            totalAmount: parseInt(formData.quantity) * parseFloat(formData.price),
            notes: formData.notes
          },
          {
            name: formData.recipientName,
            phone: formData.recipientPhone,
            address: formData.recipientAddress
          },
          account, // sender address
          result.txHash
        );
        console.log('✅ Metadata saved to database');
      } catch (apiError) {
        console.warn('⚠️ Failed to save metadata to database:', apiError);
        // Không block user, chỉ log warning
      }
      
      setTxHash(result.txHash);
      setSuccessMessage('✅ Tạo đơn hàng thành công! 🕒 Vui lòng đợi 10-30 giây để blockchain xác nhận, sau đó bạn có thể tra cứu đơn hàng.');
      
      // Reset form
      setOrderId('');
      setFormData({
        recipientName: '',
        recipientPhone: '',
        recipientAddress: '',
        productName: '',
        quantity: 1,
        price: '',
        notes: ''
      });
      
      // Callback
      if (onOrderCreated && typeof onOrderCreated === 'function') {
        onOrderCreated({ ...result, orderId, metadata });
      }
    } catch (err) {
      console.error('Submit error:', err);
    }
  };

  return (
    <div className="create-order">
      <h2 className="form-title">📦 Tạo Đơn Hàng Mới</h2>
      
      <form onSubmit={handleSubmit} className="order-form">
        <div className="form-group">
          <label htmlFor="orderId">Mã đơn hàng: <span className="required">*</span></label>
          <div className="input-group">
            <input
              type="text"
              id="orderId"
              value={orderId}
              onChange={(e) => setOrderId(e.target.value)}
              placeholder="Nhập mã đơn hàng"
              required
              disabled={loading}
            />
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleGenerateOrderId}
              disabled={loading}
            >
              Tạo tự động
            </button>
          </div>
        </div>

        <div className="form-section">
          <h3>👤 Thông Tin Người Nhận</h3>
          
          <div className="form-group">
            <label htmlFor="recipientName">Tên người nhận: <span className="required">*</span></label>
            <input
              type="text"
              id="recipientName"
              name="recipientName"
              value={formData.recipientName}
              onChange={handleInputChange}
              placeholder="Nhập tên người nhận"
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="recipientPhone">Số điện thoại: <span className="required">*</span></label>
            <input
              type="tel"
              id="recipientPhone"
              name="recipientPhone"
              value={formData.recipientPhone}
              onChange={handleInputChange}
              placeholder="Nhập số điện thoại"
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="recipientAddress">Địa chỉ giao hàng: <span className="required">*</span></label>
            <textarea
              id="recipientAddress"
              name="recipientAddress"
              value={formData.recipientAddress}
              onChange={handleInputChange}
              placeholder="Nhập địa chỉ giao hàng đầy đủ"
              required
              disabled={loading}
              rows="3"
            />
          </div>
        </div>

        <div className="form-section">
          <h3>📦 Thông Tin Sản Phẩm</h3>
          
          <div className="form-group">
            <label htmlFor="productName">Tên sản phẩm: <span className="required">*</span></label>
            <input
              type="text"
              id="productName"
              name="productName"
              value={formData.productName}
              onChange={handleInputChange}
              placeholder="Nhập tên sản phẩm"
              required
              disabled={loading}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="quantity">Số lượng: <span className="required">*</span></label>
              <input
                type="number"
                id="quantity"
                name="quantity"
                value={formData.quantity}
                onChange={handleInputChange}
                placeholder="1"
                min="1"
                required
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="price">Giá tiền (VNĐ): <span className="required">*</span></label>
              <input
                type="text"
                id="price"
                name="price"
                value={formData.price}
                onChange={handleInputChange}
                placeholder="Nhập giá tiền"
                required
                disabled={loading}
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="notes">Ghi chú:</label>
            <textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleInputChange}
              placeholder="Ghi chú thêm về đơn hàng (nếu có)"
              disabled={loading}
              rows="3"
            />
          </div>
        </div>

        <button 
          type="submit" 
          className="btn btn-primary btn-submit"
          disabled={loading || !connected}
        >
          {loading ? '⏳ Đang xử lý...' : '✨ Tạo Đơn Hàng'}
        </button>
      </form>

      {error && (
        <div className="message error-message">
          ❌ {error}
        </div>
      )}

      {successMessage && (
        <div className="message success-message">
          {successMessage}
          {txHash && (
            <div className="tx-info">
              <small>
                Transaction Hash: <code>{txHash}</code>
              </small>
            </div>
          )}
        </div>
      )}

      {!connected && (
        <div className="message warning-message">
          ⚠️ Vui lòng kết nối ví MetaMask để tạo đơn hàng
        </div>
      )}
    </div>
  );
};

export default CreateOrder;
