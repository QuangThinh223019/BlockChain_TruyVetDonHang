import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import { ContractProvider, useContract } from './contexts/ContractContext';
import Dashboard from './pages/Dashboard';
import CreateOrderPage from './pages/CreateOrderPage';
import TrackingPage from './pages/TrackingPage';
import ConnectWallet from './components/ConnectWallet/ConnectWallet';
import './styles/globals.css';
import './App.css';

function AppContent() {
  const { connected, initializing } = useContract();
  const navigate = useNavigate();
  const location = useLocation();

  // Redirect về trang tra cứu khi ngắt kết nối ví (nếu đang ở trang khác)
  // CHỈ redirect khi đã khởi tạo xong (không redirect trong lúc auto-reconnect)
  useEffect(() => {
    if (!initializing && !connected && location.pathname !== '/' && location.pathname !== '/tracking') {
      console.log('🔄 Wallet disconnected, redirecting to tracking page...');
      navigate('/');
    }
  }, [connected, initializing, location.pathname, navigate]);

  return (
    <div className="app">
      <nav className="navbar">
        <div className="nav-container">
          <Link to="/" className="nav-logo">
            <span className="logo-icon">⛓️</span>
            <span className="logo-text">Blockchain Order Tracking</span>
          </Link>

          <div className="nav-menu">
            {connected && (
              <>
                <Link to="/" className="nav-link">
                  🔍 Tra Cứu Đơn Hàng
                </Link>
                <Link to="/dashboard" className="nav-link">
                  🏠 Dashboard
                </Link>
                <Link to="/create" className="nav-link">
                  ➕ Tạo Đơn Hàng
                </Link>
              </>
            )}
            <div className="nav-wallet">
              <ConnectWallet />
            </div>
          </div>
        </div>
      </nav>

      <main className="main-content">
        <Routes>
          <Route path="/" element={<TrackingPage />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/create" element={<CreateOrderPage />} />
          <Route path="/tracking" element={<TrackingPage />} />
        </Routes>
      </main>

      <footer className="footer">
        <div className="footer-container">
          <p className="footer-text">
            © 2026 Blockchain Order Tracking. Được xây dựng trên Cronos Blockchain.
          </p>
          <div className="footer-links">
            <a href="https://explorer.cronos.org/testnet" target="_blank" rel="noopener noreferrer">
              Cronos Explorer
            </a>
            <span className="separator">•</span>
            <a href="https://metamask.io" target="_blank" rel="noopener noreferrer">
              MetaMask
            </a>
            <span className="separator">•</span>
            <a href="https://github.com" target="_blank" rel="noopener noreferrer">
              GitHub
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

function App() {
  return (
    <Router>
      <ContractProvider>
        <AppContent />
      </ContractProvider>
    </Router>
  );
}

export default App;
