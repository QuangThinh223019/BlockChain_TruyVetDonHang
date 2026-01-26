import React from 'react';
import { getEtherscanUrl, truncateAddress, copyToClipboard } from '../../utils/web3Utils';
import './TransactionStatus.css';

const TransactionStatus = ({ txHash, status = 'pending', chainId = 11155111 }) => {
  const handleCopy = async () => {
    const success = await copyToClipboard(txHash);
    if (success) {
      alert('Đã copy transaction hash!');
    }
  };

  const getStatusInfo = () => {
    switch (status) {
      case 'pending':
        return {
          icon: '⏳',
          text: 'Đang xử lý',
          className: 'status-pending'
        };
      case 'confirmed':
      case 'success':
        return {
          icon: '✅',
          text: 'Đã xác nhận',
          className: 'status-confirmed'
        };
      case 'failed':
        return {
          icon: '❌',
          text: 'Thất bại',
          className: 'status-failed'
        };
      default:
        return {
          icon: 'ℹ️',
          text: 'Không rõ',
          className: 'status-unknown'
        };
    }
  };

  const statusInfo = getStatusInfo();
  const etherscanUrl = getEtherscanUrl(txHash, chainId);

  if (!txHash) {
    return null;
  }

  return (
    <div className="transaction-status">
      <div className="tx-header">
        <span className={`tx-status ${statusInfo.className}`}>
          {statusInfo.icon} {statusInfo.text}
        </span>
      </div>

      <div className="tx-info">
        <div className="tx-hash-container">
          <span className="tx-label">Transaction Hash:</span>
          <code className="tx-hash">{truncateAddress(txHash, 8)}</code>
          <button 
            className="btn-copy"
            onClick={handleCopy}
            title="Copy hash"
          >
            📋
          </button>
        </div>

        <a
          href={etherscanUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-etherscan"
        >
          🔗 Xem trên Etherscan
        </a>
      </div>
    </div>
  );
};

export default TransactionStatus;
