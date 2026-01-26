import React, { useState, useEffect } from 'react';
import { useOrder } from '../../hooks/useOrder';
import { useContract } from '../../contexts/ContractContext';
import { ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from '../../utils/constants';
import { formatDate, truncateAddress, getEtherscanUrl, copyToClipboard } from '../../utils/web3Utils';
import { getOrderMetadata } from '../../utils/orderMetadata';
import './OrderDetail.css';

const OrderDetail = ({ orderId: propOrderId, onOrderIdChange }) => {
  const [orderId, setOrderId] = useState(propOrderId || '');
  const [order, setOrder] = useState(null);
  const [metadata, setMetadata] = useState(null);
  const [txHash, setTxHash] = useState(null);
  const [isCreator, setIsCreator] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const { getOrder, updateOrderStatus, loading, error } = useOrder();
  const { account, readOnlyContract, contract } = useContract();

  const handleSearch = async (e) => {
    e?.preventDefault();
    
    if (!orderId || orderId.trim() === '') {
      alert('Vui lòng nhập mã đơn hàng!');
      return;
    }

    try {
      const trimmedOrderId = orderId.trim();
      const orderData = await getOrder(trimmedOrderId);
      setOrder(orderData);
      setSelectedStatus(orderData.status.toString());
      
      // Notify parent component về orderId change
      if (onOrderIdChange) {
        onOrderIdChange(trimmedOrderId);
      }
      
      // Lấy metadata từ localStorage
      const metadataData = getOrderMetadata(trimmedOrderId);
      setMetadata(metadataData);
      
      // Lấy transaction hash từ metadata
      if (metadataData && metadataData.txHash) {
        setTxHash(metadataData.txHash);
      }
      
      // Kiểm tra nếu người dùng hiện tại là người tạo đơn
      if (account && metadataData && metadataData.senderAddress) {
        setIsCreator(account.toLowerCase() === metadataData.senderAddress.toLowerCase());
      } else {
        setIsCreator(false);
      }
    } catch (err) {
      // console.error('Search error:', err);
      setOrder(null);
      setMetadata(null);
      setTxHash(null);
      setIsCreator(false);
    }
  };

  useEffect(() => {
    if (propOrderId && propOrderId.trim() !== '') {
      setOrderId(propOrderId);
      // Tự động tra cứu khi có propOrderId từ URL
      const autoSearch = async () => {
        try {
          const orderData = await getOrder(propOrderId.trim());
          setOrder(orderData);
          setSelectedStatus(orderData.status.toString());
          
          if (onOrderIdChange) {
            onOrderIdChange(propOrderId.trim());
          }
          
          const metadataData = getOrderMetadata(propOrderId.trim());
          setMetadata(metadataData);
          
          if (metadataData && metadataData.txHash) {
            setTxHash(metadataData.txHash);
          }
          
          if (account && metadataData && metadataData.senderAddress) {
            setIsCreator(account.toLowerCase() === metadataData.senderAddress.toLowerCase());
          } else {
            setIsCreator(false);
          }
        } catch (err) {
          setOrder(null);
          setMetadata(null);
          setTxHash(null);
          setIsCreator(false);
        }
      };
      autoSearch();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [propOrderId]);

  const handleUpdateStatus = async () => {
    if (!isCreator) {
      alert('Bạn không có quyền cập nhật đơn hàng này!');
      return;
    }

    if (selectedStatus === order.status.toString()) {
      alert('Vui lòng chọn trạng thái mới!');
      return;
    }

    // Validate luồng trạng thái
    const validStatuses = getValidNextStatuses(order.status);
    const newStatusNum = parseInt(selectedStatus);
    
    if (!validStatuses.includes(newStatusNum)) {
      alert(`❌ Không thể cập nhật từ "${ORDER_STATUS_LABELS[order.status]}" sang "${ORDER_STATUS_LABELS[newStatusNum]}"!\n\nChỉ có thể cập nhật theo luồng: Đã Tạo → Đã Xác Nhận → Đang Giao → Đã Giao`);
      return;
    }

    if (!window.confirm(`Xác nhận cập nhật trạng thái thành: ${ORDER_STATUS_LABELS[selectedStatus]}?`)) {
      return;
    }

    setIsUpdating(true);
    try {
      const result = await updateOrderStatus(order.orderId, parseInt(selectedStatus), '');
      alert('✅ Cập nhật trạng thái thành công!');
      
      // Cập nhật txHash mới và lưu vào localStorage
      if (result.txHash) {
        setTxHash(result.txHash);
        // Update metadata with new txHash
        const metadataData = getOrderMetadata(order.orderId);
        if (metadataData) {
          metadataData.lastUpdateTxHash = result.txHash;
          metadataData.updateHistory = metadataData.updateHistory || [];
          metadataData.updateHistory.push({
            status: parseInt(selectedStatus),
            txHash: result.txHash,
            timestamp: Date.now()
          });
          localStorage.setItem(`order_${order.orderId}`, JSON.stringify(metadataData));
        }
      }
      
      // Tải lại thông tin đơn hàng
      await handleSearch();
    } catch (err) {
      console.error('Update status error:', err);
      alert(`❌ Lỗi: ${err.message}`);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCopyAddress = async (text, label) => {
    const success = await copyToClipboard(text);
    if (success) {
      alert(`✅ Đã sao chép ${label}`);
    } else {
      alert('❌ Không thể sao chép');
    }
  };

  const getStatusColor = (status) => {
    return ORDER_STATUS_COLORS[status] || '#6b7280';
  };

  /**
   * Xác định các trạng thái hợp lệ tiếp theo dựa trên trạng thái hiện tại
   * Luồng: CREATED(0) → CONFIRMED(1) → SHIPPED(2) → DELIVERED(3)
   * CANCELLED(4) có thể từ bất kỳ trạng thái nào trừ DELIVERED
   */
  const getValidNextStatuses = (currentStatus) => {
    const statuses = [];
    
    switch (currentStatus) {
      case 0: // CREATED
        statuses.push(1, 4); // Có thể → CONFIRMED hoặc CANCELLED
        break;
      case 1: // CONFIRMED
        statuses.push(2, 4); // Có thể → SHIPPED hoặc CANCELLED
        break;
      case 2: // SHIPPED
        statuses.push(3, 4); // Có thể → DELIVERED hoặc CANCELLED
        break;
      case 3: // DELIVERED
        // Không thể thay đổi từ DELIVERED
        break;
      case 4: // CANCELLED
        // Không thể thay đổi từ CANCELLED
        break;
      default:
        break;
    }
    
    return statuses;
  };

  return (
    <div className="order-detail">
      <h2 className="detail-title">🔍 Chi Tiết Đơn Hàng</h2>
      
      {!account && !contract && !readOnlyContract && (
        <div className="info-banner" style={{backgroundColor: '#fef3c7', borderColor: '#f59e0b'}}>
          <p>⏳ <strong>Đang khởi tạo kết nối blockchain...</strong> Vui lòng đợi vài giây.</p>
        </div>
      )}
      
      {!account && readOnlyContract && (
        <div className="info-banner">
          <p>💡 <strong>Lưu ý:</strong> Bạn đang ở chế độ xem công khai. Kết nối ví để có thể tạo và cập nhật đơn hàng.</p>
        </div>
      )}

      <form onSubmit={handleSearch} className="search-form">
        <div className="search-group">
          <input
            type="text"
            value={orderId}
            onChange={(e) => setOrderId(e.target.value)}
            placeholder="Nhập mã đơn hàng để tìm kiếm..."
            disabled={loading}
            className="search-input"
          />
          <button 
            type="submit" 
            className="btn btn-search"
            disabled={loading}
          >
            {loading ? '⏳ Đang tìm...' : '🔎 Tìm kiếm'}
          </button>
        </div>
      </form>

      {error && (
        <div className="message error-message">
          ❌ {error}
        </div>
      )}

      {order && (
        <div className="order-card">
          <div className="order-header">
            <h3>Thông Tin Đơn Hàng</h3>
            <span 
              className="status-badge"
              style={{ backgroundColor: getStatusColor(order.status) }}
            >
              {ORDER_STATUS_LABELS[order.status]}
            </span>
          </div>

          <div className="order-info">
            <div className="info-row">
              <span className="info-label">Mã đơn hàng:</span>
              <span className="info-value">{order.orderId}</span>
            </div>

            <div className="info-row">
              <span className="info-label">Trạng thái:</span>
              <span className="info-value">
                {ORDER_STATUS_LABELS[order.status]}
              </span>
            </div>

            {metadata && (
              <>
                <div className="section-divider">
                  <h4>👤 Thông Tin Người Nhận</h4>
                </div>
                
                <div className="info-row">
                  <span className="info-label">Tên người nhận:</span>
                  <span className="info-value">{metadata.recipientName}</span>
                </div>

                <div className="info-row">
                  <span className="info-label">Số điện thoại:</span>
                  <span className="info-value">{metadata.recipientPhone}</span>
                </div>

                <div className="info-row">
                  <span className="info-label">Địa chỉ giao hàng:</span>
                  <span className="info-value">{metadata.recipientAddress}</span>
                </div>

                <div className="section-divider">
                  <h4>📦 Thông Tin Sản Phẩm</h4>
                </div>

                <div className="info-row">
                  <span className="info-label">Tên sản phẩm:</span>
                  <span className="info-value">{metadata.productName}</span>
                </div>

                <div className="info-row">
                  <span className="info-label">Số lượng:</span>
                  <span className="info-value">{metadata.quantity}</span>
                </div>

                <div className="info-row">
                  <span className="info-label">Giá tiền:</span>
                  <span className="info-value">{metadata.price} VNĐ</span>
                </div>

                {metadata.notes && (
                  <div className="info-row">
                    <span className="info-label">Ghi chú:</span>
                    <span className="info-value">{metadata.notes}</span>
                  </div>
                )}
              </>
            )}

            <div className="section-divider">
              <h4>🔗 Thông Tin Blockchain</h4>
            </div>

            {txHash && (
              <div className="info-row">
                <span className="info-label">Transaction Hash:</span>
                <span className="info-value">
                  <div className="hash-container">
                    <code className="hash-code">{truncateAddress(txHash, 8)}</code>
                    <button 
                      className="btn-copy"
                      onClick={() => handleCopyAddress(txHash, 'Transaction Hash')}
                      title="Sao chép"
                    >
                      📋
                    </button>
                    <a 
                      href={getEtherscanUrl(txHash)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-etherscan"
                      title="Xem trên Cronos Explorer"
                    >
                      🔍 Kiểm tra giao dịch
                    </a>
                  </div>
                </span>
              </div>
            )}

            <div className="info-row">
              <span className="info-label">Metadata Hash:</span>
              <span className="info-value hash">
                {truncateAddress(order.metadataHash, 8)}
              </span>
            </div>

            <div className="info-row">
              <span className="info-label">Admin:</span>
              <span className="info-value">
                <div className="hash-container">
                  <code className="hash-code">{truncateAddress(order.adminAddress)}</code>
                  <button 
                    className="btn-copy"
                    onClick={() => handleCopyAddress(order.adminAddress, 'Địa chỉ Admin')}
                    title="Sao chép"
                  >
                    📋
                  </button>
                </div>
              </span>
            </div>

            <div className="info-row">
              <span className="info-label">Ngày tạo:</span>
              <span className="info-value">
                {formatDate(order.createdAt)}
              </span>
            </div>

            <div className="info-row">
              <span className="info-label">Cập nhật lần cuối:</span>
              <span className="info-value">
                {formatDate(order.updatedAt)}
              </span>
            </div>

            <div className="info-row">
              <span className="info-label">Trạng thái hoạt động:</span>
              <span className="info-value">
                {order.isActive ? (
                  <span className="active-badge">✅ Đang hoạt động</span>
                ) : (
                  <span className="inactive-badge">❌ Đã hủy</span>
                )}
              </span>
            </div>
          </div>

          {account && isCreator && order.isActive && getValidNextStatuses(order.status).length > 0 && (
            <div className="update-status-section">
              <h3>🔄 Cập Nhật Trạng Thái</h3>
              <div className="status-update-form">
                <select 
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="status-select"
                  disabled={isUpdating || loading}
                >
                  <option value={order.status.toString()}>--- Chọn trạng thái mới ---</option>
                  {getValidNextStatuses(order.status).map(statusNum => {
                    const icons = ['⚖️', '✅', '🚚', '🎉', '❌'];
                    return (
                      <option key={statusNum} value={statusNum.toString()}>
                        {icons[statusNum]} {ORDER_STATUS_LABELS[statusNum]}
                      </option>
                    );
                  })}
                </select>
                <button 
                  onClick={handleUpdateStatus}
                  className="btn btn-primary"
                  disabled={isUpdating || loading || selectedStatus === order.status.toString()}
                >
                  {isUpdating ? '⏳ Đang cập nhật...' : '✨ Cập Nhật'}
                </button>
              </div>
            </div>
          )}

          {account && isCreator && order.isActive && getValidNextStatuses(order.status).length === 0 && (
            <div className="final-status-note">
              <p>
                {order.status === 3 ? (
                  <span>🎉 <strong>Đơn hàng đã hoàn thành!</strong> Không thể thay đổi trạng thái từ "Đã Giao".</span>
                ) : (
                  <span>🔒 <strong>Không thể cập nhật thêm.</strong> Đơn hàng ở trạng thái cuối cùng.</span>
                )}
              </p>
            </div>
          )}

          {!isCreator && order && account && (
            <div className="viewer-note">
              <p>👁️ <strong>Chế độ xem:</strong> Bạn không phải là người tạo đơn, chỉ có thể xem thông tin.</p>
            </div>
          )}
        </div>
      )}

      {!order && !loading && !error && (
        <div className="empty-state">
          <p>📋 Nhập mã đơn hàng để xem chi tiết</p>
        </div>
      )}
    </div>
  );
};

export default OrderDetail;
