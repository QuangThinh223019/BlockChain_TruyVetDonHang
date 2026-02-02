import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import OrderDetail from '../components/OrderDetail/OrderDetail';
import TrackingMap from '../components/TrackingMap/TrackingMap';
import './TrackingPage.css';

const TrackingPage = () => {
  const [searchParams] = useSearchParams();
  const [orderId, setOrderId] = useState('');

  useEffect(() => {
    const id = searchParams.get('id');
    if (id) {
      setOrderId(id);
    }
  }, [searchParams]);

  // Callback để nhận orderId từ OrderDetail khi search
  const handleOrderIdChange = (newOrderId) => {
    console.log('📝 TrackingPage: OrderId changed to:', newOrderId);
    setOrderId(newOrderId);
  };

  return (
    <div className="tracking-page">
      <div className="page-header">
        <h1>🔍 Tra Cứu Đơn Hàng</h1>
        <p className="page-subtitle">
          Nhập mã đơn hàng để xem chi tiết và theo dõi lịch sử vận chuyển
        </p>
      </div>

      <div className="page-content">
        <div className="tracking-section">
          <OrderDetail orderId={orderId} onOrderIdChange={handleOrderIdChange} />
        </div>

        {/* GPS Tracking Map */}
        {orderId && (
          <div className="tracking-map-section">
            <TrackingMap orderId={orderId} />
          </div>
        )}
      </div>
    </div>
  );
};

export default TrackingPage;
