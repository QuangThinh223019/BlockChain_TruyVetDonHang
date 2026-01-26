import React, { useState, useEffect } from 'react';
import { useOrder } from '../../hooks/useOrder';
import { useContract } from '../../contexts/ContractContext';
import { ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from '../../utils/constants';
import { formatDate, truncateAddress, timeAgo } from '../../utils/web3Utils';
import './OrderHistory.css';

const OrderHistory = ({ orderId }) => {
  const [history, setHistory] = useState([]);
  const { getOrderHistory, loading, error } = useOrder();
  const { contract, readOnlyContract } = useContract();

  useEffect(() => {
    const loadHistory = async () => {
      if (!orderId) return;
      
      // Sử dụng contract hoặc readOnlyContract
      const activeContract = contract || readOnlyContract;
      if (!activeContract) {
        console.log('⏳ Contract not initialized yet, will retry when available');
        return;
      }

      console.log('📜 Loading history for order:', orderId);
      console.log('🔗 Using contract:', contract ? 'connected wallet' : 'read-only');

      try {
        const historyData = await getOrderHistory(orderId);
        console.log('✅ History loaded:', historyData);
        setHistory(historyData);
      } catch (err) {
        // Silently handle error, will be shown in parent UI
        console.error('❌ Load history error:', err);
        setHistory([]); // Reset history on error
      }
    };

    loadHistory();
    // Remove getOrderHistory from deps to prevent infinite loop
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId, contract, readOnlyContract]);

  if (!orderId) {
    return (
      <div className="order-history">
        <p className="empty-message">Vui lòng nhập mã đơn hàng</p>
      </div>
    );
  }

  return (
    <div className="order-history">
      <h3 className="history-title">📜 Lịch Sử Cập Nhật</h3>

      {loading && <p className="loading-message">⏳ Đang tải lịch sử...</p>}

      {error && <p className="error-message">❌ {error}</p>}

      {!loading && !error && history.length === 0 && (
        <p className="empty-message">Chưa có lịch sử cập nhật</p>
      )}

      {!loading && history.length > 0 && (
        <div className="timeline">
          {history.map((item, index) => (
            <div key={index} className="timeline-item">
              <div 
                className="timeline-marker"
                style={{ backgroundColor: ORDER_STATUS_COLORS[item.status] }}
              />
              <div className="timeline-content">
                <div className="timeline-header">
                  <span 
                    className="status-badge"
                    style={{ backgroundColor: ORDER_STATUS_COLORS[item.status] }}
                  >
                    {ORDER_STATUS_LABELS[item.status]}
                  </span>
                  <span className="timeline-time">
                    {timeAgo(item.timestamp)}
                  </span>
                </div>
                <div className="timeline-details">
                  <p className="timeline-date">
                    🕐 {formatDate(item.timestamp)}
                  </p>
                  <p className="timeline-updater">
                    👤 Cập nhật bởi: {truncateAddress(item.updatedBy)}
                  </p>
                  {item.detailsHash && (
                    <p className="timeline-hash">
                      📄 Chi tiết: <code>{item.detailsHash}</code>
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default OrderHistory;
