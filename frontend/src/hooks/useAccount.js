import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { useContract } from './useContract';

/**
 * Hook để quản lý thông tin tài khoản
 */
export const useAccount = () => {
  const { provider, account, chainId, connected } = useContract();
  const [balance, setBalance] = useState('0');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Lấy địa chỉ ví hiện tại
   */
  const getCurrentAddress = useCallback(() => {
    return account;
  }, [account]);

  /**
   * Lấy số dư ETH
   */
  const getBalance = useCallback(async () => {
    if (!provider || !account) {
      return '0';
    }

    setLoading(true);
    setError(null);

    try {
      const balance = await provider.getBalance(account);
      const ethBalance = ethers.formatEther(balance);
      setBalance(ethBalance);
      return ethBalance;
    } catch (err) {
      console.error('Get balance error:', err);
      setError('Không thể lấy số dư');
      return '0';
    } finally {
      setLoading(false);
    }
  }, [provider, account]);

  /**
   * Theo dõi thay đổi account
   */
  const watchAccountChange = useCallback((callback) => {
    if (typeof window.ethereum !== 'undefined') {
      const handleAccountsChanged = (accounts) => {
        if (callback && typeof callback === 'function') {
          callback(accounts[0] || null);
        }
      };

      window.ethereum.on('accountsChanged', handleAccountsChanged);

      return () => {
        if (window.ethereum.removeListener) {
          window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        }
      };
    }
  }, []);

  /**
   * Theo dõi thay đổi network
   */
  const watchNetworkChange = useCallback((callback) => {
    if (typeof window.ethereum !== 'undefined') {
      const handleChainChanged = (chainIdHex) => {
        const newChainId = parseInt(chainIdHex, 16);
        if (callback && typeof callback === 'function') {
          callback(newChainId);
        }
      };

      window.ethereum.on('chainChanged', handleChainChanged);

      return () => {
        if (window.ethereum.removeListener) {
          window.ethereum.removeListener('chainChanged', handleChainChanged);
        }
      };
    }
  }, []);

  /**
   * Tự động cập nhật số dư khi account hoặc chainId thay đổi
   */
  useEffect(() => {
    console.log('useAccount - connected:', connected, 'account:', account);
    if (connected && account) {
      getBalance();
    } else {
      setBalance('0');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connected, account, chainId]);

  return {
    address: account,
    balance,
    chainId,
    isConnected: connected,
    loading,
    error,
    getCurrentAddress,
    getBalance,
    watchAccountChange,
    watchNetworkChange
  };
};
