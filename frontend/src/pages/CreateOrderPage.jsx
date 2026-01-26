import React, { useState } from 'react';
import CreateOrder from '../components/CreateOrder/CreateOrder';
import TransactionStatus from '../components/TransactionStatus/TransactionStatus';
import { useNavigate } from 'react-router-dom';
import { useContract } from '../contexts/ContractContext';
import './CreateOrderPage.css';

const CreateOrderPage = () => {
  const [txResult, setTxResult] = useState(null);
  const navigate = useNavigate();
  const { connected } = useContract();

  const handleOrderCreated = (result) => {
    setTxResult(result);
    
    // Redirect to tracking page after 3 seconds
    setTimeout(() => {
      if (result.orderId) {
        navigate(`/tracking?id=${result.orderId}`);
      }
    }, 3000);
  };

  // Hiển thị thông báo nếu chưa đăng nhập
  if (!connected) {
    return (
      <div className="create-order-page">
        <div className="page-header">
          <h1>🔒 Truy Cập Bị Hạn Chế</h1>
          <p className="page-subtitle">
            Vui lòng kết nối ví để tạo đơn hàng mới.
          </p>
        </div>
        <div className="empty-state" style={{padding: '48px', textAlign: 'center', background: 'white', borderRadius: '12px', margin: '24px auto', maxWidth: '600px'}}>
          <p style={{fontSize: '18px', marginBottom: '16px'}}>
            👉 Nhấn vào nút "Kết Nối Ví" ở góc trên cùng để bắt đầu.
          </p>
          <p style={{color: '#6b7280'}}>
            Nếu bạn chưa có ví, hãy tải <a href="https://metamask.io" target="_blank" rel="noopener noreferrer" style={{color: '#667eea', fontWeight: 'bold'}}>MetaMask</a>.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="create-order-page">
      <div className="page-header">
        <h1>➕ Tạo Đơn Hàng Mới</h1>
        <p className="page-subtitle">
          Tạo đơn hàng mới và lưu trên Blockchain để theo dõi toàn bộ quá trình vận chuyển
        </p>
      </div>

      <div className="page-content">
        <div className="left-section">
          <CreateOrder onOrderCreated={handleOrderCreated} />
          
          {txResult && (
            <div className="result-section">
              <h3>✨ Kết Quả Giao Dịch</h3>
              <TransactionStatus 
                txHash={txResult.txHash}
                status="confirmed"
              />
            </div>
          )}
        </div>

        <div className="right-section">
          <div className="info-panel tech-panel">
            <h3>⚙️ Thông Tin Kỹ Thuật</h3>
            <div className="tech-info">
              <div className="tech-item">
                <span className="tech-label">Smart Contract:</span>
                <code className="tech-value">0x5663...055C8</code>
              </div>
              <div className="tech-item">
                <span className="tech-label">Network:</span>
                <span className="tech-value">Cronos Testnet</span>
              </div>
              <div className="tech-item">
                <span className="tech-label">Gas Limit:</span>
                <span className="tech-value">~200,000</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateOrderPage;
