import React, { useEffect } from 'react';
import { useContract } from '../../contexts/ContractContext';
import { truncateAddress, getNetworkName } from '../../utils/web3Utils';
import './ConnectWallet.css';

const ConnectWallet = () => {
  const { connected, loading, error, connectWallet, disconnectWallet, chainId, account } = useContract();

  console.log('ConnectWallet render - connected:', connected, 'account:', account, 'chainId:', chainId);

  // Thêm class vào body để ẩn/hiện menu items
  useEffect(() => {
    if (connected) {
      document.body.classList.add('wallet-connected');
    } else {
      document.body.classList.remove('wallet-connected');
    }
  }, [connected]);

  const handleConnect = async () => {
    await connectWallet();
  };

  const handleDisconnect = () => {
    disconnectWallet();
  };

  return (
    <div className="connect-wallet">
      {!connected ? (
        <div className="wallet-disconnected">
          <button 
            className="btn btn-connect" 
            onClick={handleConnect}
            disabled={loading}
          >
            {loading ? 'Đang kết nối...' : '🔗 Kết nối'}
          </button>
          {error && <p className="error-message">{error}</p>}
        </div>
      ) : (
        <div className="wallet-connected">
          <div className="wallet-info">
            <div className="wallet-address">
              <span className="value">{truncateAddress(account)}</span>
            </div>
            <div className="wallet-network">
              <span className="value network-badge">{getNetworkName(chainId)}</span>
            </div>
          </div>
          <button 
            className="btn btn-disconnect" 
            onClick={handleDisconnect}
          >
            Ngắt kết nối
          </button>
        </div>
      )}
    </div>
  );
};

export default ConnectWallet;
