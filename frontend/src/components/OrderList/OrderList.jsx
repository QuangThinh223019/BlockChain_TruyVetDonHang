import React from 'react';
import { ORDER_STATUS_LABELS } from '../../utils/constants';
import { formatDate } from '../../utils/web3Utils';
import { Link } from 'react-router-dom';
import './OrderList.css';

const OrderList = ({ orders = [] }) => {
  if (!orders || orders.length === 0) {
    return (
      <div className="order-list">
        <div className="empty-state">
          <p>📦 Chưa có đơn hàng nào</p>
        </div>
      </div>
    );
  }

  const getStatusClass = (status) => {
    const statusClasses = {
      0: 'status-created',
      1: 'status-confirmed',
      2: 'status-shipped',
      3: 'status-delivered',
      4: 'status-cancelled'
    };
    return statusClasses[status] || 'status-default';
  };

  return (
    <div className="order-list">
      <h2 className="list-title">📋 Danh Sách Đơn Hàng</h2>
      
      <div className="table-container">
        <table className="orders-table">
          <thead>
            <tr>
              <th>Mã Đơn Hàng</th>
              <th>Trạng Thái</th>
              <th>Ngày Tạo</th>
              <th>Cập Nhật</th>
              <th>Thao Tác</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order, index) => (
              <tr key={order.orderId || index}>
                <td className="order-id">{order.orderId}</td>
                <td>
                  <span className={`status-badge ${getStatusClass(order.status)}`}>
                    {ORDER_STATUS_LABELS[order.status]}
                  </span>
                </td>
                <td>{formatDate(order.createdAt)}</td>
                <td>{formatDate(order.updatedAt)}</td>
                <td>
                  <Link 
                    to={`/tracking?id=${order.orderId}`} 
                    className="btn-view"
                  >
                    Xem chi tiết
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default OrderList;
