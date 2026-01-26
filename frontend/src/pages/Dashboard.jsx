import React, { useState, useEffect } from 'react';
import OrderList from '../components/OrderList/OrderList';
import { useContract } from '../contexts/ContractContext';
import { useOrder } from '../hooks/useOrder';
import { getOrdersByWallet } from '../utils/orderMetadata';
import './Dashboard.css';

const Dashboard = () => {
  const [stats, setStats] = useState({
    total: 0,
    created: 0,
    confirmed: 0,
    shipped: 0,
    delivered: 0,
    cancelled: 0
  });
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const { connected, account, contract, readOnlyContract } = useContract();
  const { getOrder } = useOrder();

  // Load orders from blockchain and calculate stats
  useEffect(() => {
    const loadOrdersWithStatus = async () => {
      if (!connected || !account) {
        // Reset khi disconnect
        setStats({
          total: 0,
          created: 0,
          confirmed: 0,
          shipped: 0,
          delivered: 0,
          cancelled: 0
        });
        setRecentOrders([]);
        return;
      }

      setLoading(true);
      console.log('📊 Loading orders for wallet:', account);

      try {
        // Lấy đơn hàng của ví hiện tại từ localStorage
        const walletOrders = getOrdersByWallet(account);
        console.log('📦 Found orders in localStorage:', walletOrders.length);

        if (walletOrders.length === 0) {
          setStats({
            total: 0,
            created: 0,
            confirmed: 0,
            shipped: 0,
            delivered: 0,
            cancelled: 0
          });
          setRecentOrders([]);
          setLoading(false);
          return;
        }

        // Load trạng thái thực tế từ blockchain cho từng đơn
        const ordersWithStatus = [];
        const orderStats = {
          total: walletOrders.length,
          created: 0,
          confirmed: 0,
          shipped: 0,
          delivered: 0,
          cancelled: 0
        };

        for (const localOrder of walletOrders) {
          try {
            // Lấy thông tin từ blockchain
            const blockchainOrder = await getOrder(localOrder.orderId);
            
            // Đếm theo trạng thái
            switch (blockchainOrder.status) {
              case 0:
                orderStats.created++;
                break;
              case 1:
                orderStats.confirmed++;
                break;
              case 2:
                orderStats.shipped++;
                break;
              case 3:
                orderStats.delivered++;
                break;
              case 4:
                orderStats.cancelled++;
                break;
              default:
                break;
            }

            ordersWithStatus.push({
              orderId: blockchainOrder.orderId,
              status: blockchainOrder.status,
              createdAt: blockchainOrder.createdAt,
              updatedAt: blockchainOrder.updatedAt
            });
          } catch (err) {
            console.error(`Error loading order ${localOrder.orderId}:`, err);
            // Nếu lỗi, vẫn thêm vào danh sách nhưng với status mặc định
            ordersWithStatus.push({
              orderId: localOrder.orderId,
              status: 0,
              createdAt: new Date(localOrder.createdAt).getTime() / 1000,
              updatedAt: new Date(localOrder.createdAt).getTime() / 1000
            });
          }
        }

        // Sắp xếp theo thời gian tạo mới nhất
        ordersWithStatus.sort((a, b) => b.createdAt - a.createdAt);

        // Lấy 5 đơn gần nhất
        const recent = ordersWithStatus.slice(0, 5);

        setStats(orderStats);
        setRecentOrders(recent);
        console.log('✅ Stats updated:', orderStats);
        console.log('✅ Recent orders:', recent.length);
      } catch (err) {
        console.error('❌ Error loading dashboard:', err);
      } finally {
        setLoading(false);
      }
    };

    loadOrdersWithStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connected, account, contract, readOnlyContract]);

  // Hiển thị thông báo nếu chưa đăng nhập
  if (!connected) {
    return (
      <div className="dashboard">
        <div className="dashboard-header">
          <h1>🔒 Truy Cập Bị Hạn Chế</h1>
          <p className="subtitle">
            Vui lòng kết nối ví để xem Dashboard và quản lý đơn hàng của bạn.
          </p>
        </div>
        <div className="empty-state" style={{padding: '48px', textAlign: 'center'}}>
          <p style={{fontSize: '18px', marginBottom: '16px'}}>
            👉 Nhấn vào nút "Kết Nối Ví" ở góc trên cùng để bắt đầu.
          </p>
          <p style={{color: '#6b7280'}}>
            Nếu bạn chưa có ví, hãy tải <a href="https://metamask.io" target="_blank" rel="noopener noreferrer" style={{color: '#667eea'}}>MetaMask</a>.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>🎯 Dashboard - Truy Vết Đơn Hàng</h1>
        <p className="subtitle">Quản lý và theo dõi đơn hàng trên Blockchain</p>
        {loading && (
          <p className="loading-text" style={{marginTop: '8px', color: '#667eea', fontSize: '14px'}}>
            ⏳ Đang tải dữ liệu từ blockchain...
          </p>
        )}
      </div>

      {connected && (
        <>
          <div className="stats-section">
            <h2>📊 Thống Kê Tổng Quan</h2>
            <div className="stats-grid">
              <div className="stat-card stat-total">
                <div className="stat-icon">📦</div>
                <div className="stat-content">
                  <div className="stat-value">{stats.total}</div>
                  <div className="stat-label">Tổng đơn hàng</div>
                </div>
              </div>

              <div className="stat-card stat-created">
                <div className="stat-icon">🆕</div>
                <div className="stat-content">
                  <div className="stat-value">{stats.created}</div>
                  <div className="stat-label">Đã tạo</div>
                </div>
              </div>

              <div className="stat-card stat-confirmed">
                <div className="stat-icon">✔️</div>
                <div className="stat-content">
                  <div className="stat-value">{stats.confirmed}</div>
                  <div className="stat-label">Đã xác nhận</div>
                </div>
              </div>

              <div className="stat-card stat-shipped">
                <div className="stat-icon">🚚</div>
                <div className="stat-content">
                  <div className="stat-value">{stats.shipped}</div>
                  <div className="stat-label">Đang giao</div>
                </div>
              </div>

              <div className="stat-card stat-delivered">
                <div className="stat-icon">✅</div>
                <div className="stat-content">
                  <div className="stat-value">{stats.delivered}</div>
                  <div className="stat-label">Đã giao</div>
                </div>
              </div>

              <div className="stat-card stat-cancelled">
                <div className="stat-icon">❌</div>
                <div className="stat-content">
                  <div className="stat-value">{stats.cancelled}</div>
                  <div className="stat-label">Đã hủy</div>
                </div>
              </div>
            </div>
          </div>

          <div className="recent-section">
            <h2>📋 Đơn Hàng Gần Đây</h2>
            {recentOrders.length > 0 ? (
              <OrderList orders={recentOrders} />
            ) : (
              <div className="empty-orders" style={{padding: '40px', textAlign: 'center', background: 'white', borderRadius: '12px'}}>
                <p style={{fontSize: '48px', margin: '0 0 16px 0'}}>📦</p>
                <p style={{fontSize: '16px', color: '#6b7280', margin: '0'}}>
                  Chưa có đơn hàng nào. Tạo đơn hàng đầu tiên của bạn!
                </p>
              </div>
            )}
          </div>
        </>
      )}

      {!connected && (
        <div className="connect-prompt">
          <div className="prompt-icon">🔐</div>
          <h3>Kết Nối Ví Để Bắt Đầu</h3>
          <p>Vui lòng kết nối ví MetaMask để sử dụng các tính năng của ứng dụng</p>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
