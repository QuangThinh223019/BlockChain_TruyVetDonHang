import React, { useState, useEffect, useCallback } from 'react';
import { useOrder } from '../../hooks/useOrder';
import { useAutoRefresh } from '../../hooks/useAutoRefresh';
import { useContract } from '../../contexts/ContractContext';
import { ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from '../../utils/constants';
import { formatDate, truncateAddress, timeAgo } from '../../utils/web3Utils';
import './OrderHistory.css';

const OrderHistory = ({ orderId }) => {
  const [manualError, setManualError] = useState(null);
  const { getOrderHistory } = useOrder();
  const { contract, readOnlyContract } = useContract();

  // Callback để fetch history
  const fetchHistoryData = useCallback(async () => {
    if (!orderId) {
      throw new Error('Vui lòng nhập mã đơn hàng');
    }

    const activeContract = contract || readOnlyContract;
    if (!activeContract) {
      throw new Error('Đang khởi tạo kết nối blockchain...');
    }

    try {
      console.log('📜 Loading history for order:', orderId);
      const historyData = await getOrderHistory(orderId);
      console.log('✅ History loaded:', historyData);
      setManualError(null);
      return historyData;
    } catch (err) {
      console.error('❌ Load history error:', err);
      setManualError(err.message);
      return [];
    }
  }, [orderId, getOrderHistory, contract, readOnlyContract]);

  // Auto-refresh history mỗi 10 giây khi có orderId (tránh lag)
  const { 
    data: historyData,
    isLoading, 
    isRefreshing, 
    error: autoRefreshError 
  } = useAutoRefresh(fetchHistoryData, [orderId], 10000, !!orderId);  // 10 seconds instead of 3

  // Ensure history is always an array
  const history = Array.isArray(historyData) ? historyData : [];
  const displayError = manualError || autoRefreshError;

  if (!orderId) {
    return (
      <div className="order-history">
        <p className="empty-message">Vui lòng nhập mã đơn hàng</p>
      </div>
    );
  }

  return (
    <div className="order-history">
      <div className="history-header">
        <h3 className="history-title">📜 Lịch Sử Cập Nhật</h3>
        {isRefreshing && (
          <span className="refresh-indicator" title="Đang cập nhật tự động...">
            🔄 <span className="refresh-text">Cập nhật tự động</span>
          </span>
        )}
      </div>

      {isLoading && <p className="loading-message">⏳ Đang tải lịch sử...</p>}

      {displayError && <p className="error-message">❌ {displayError}</p>}

      {!isLoading && !displayError && history.length === 0 && (
        <p className="empty-message">Chưa có lịch sử cập nhật</p>
      )}

      {history.length > 0 && (
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
