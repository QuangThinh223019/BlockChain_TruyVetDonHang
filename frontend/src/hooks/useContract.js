import { useState, useEffect, useCallback, useRef } from 'react';
import { ethers } from 'ethers';
import { CONTRACT_ADDRESS, DEFAULT_CHAIN_ID, RPC_URLS } from '../utils/constants';
import ContractABI from '../contracts/OrderTracking.json';

/**
 * Hook để tương tác với Smart Contract
 */
export const useContract = () => {
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [contract, setContract] = useState(null);
  const [readOnlyContract, setReadOnlyContract] = useState(null);
  const [account, setAccount] = useState(null);
  const [chainId, setChainId] = useState(null);
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [error, setError] = useState(null);
  const hasLoggedConnection = useRef(false);

  /**
   * Khởi tạo provider từ MetaMask
   */
  const initProvider = useCallback(async () => {
    if (typeof window.ethereum !== 'undefined') {
      try {
        const web3Provider = new ethers.BrowserProvider(window.ethereum);
        setProvider(web3Provider);
        
        // Lấy network info
        const network = await web3Provider.getNetwork();
        setChainId(Number(network.chainId));
        
        return web3Provider;
      } catch (err) {
        console.error('Error initializing provider:', err);
        setError('Không thể khởi tạo provider');
        return null;
      }
    } else {
      setError('Vui lòng cài đặt MetaMask');
      return null;
    }
  }, []);

  /**
   * Kết nối ví MetaMask - luôn hiển thị popup để chọn tài khoản
   */
  const connectWallet = useCallback(async () => {
    console.log('🔄 Starting wallet connection...');
    setLoading(true);
    setError(null);
    
    try {
      if (typeof window.ethereum === 'undefined') {
        throw new Error('MetaMask chưa được cài đặt');
      }

      // Kiểm tra xem MetaMask có đang locked không
      try {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        if (accounts.length === 0) {
          console.log('⚠️ MetaMask chưa được unlock hoặc chưa có tài khoản được kết nối');
        }
      } catch (e) {
        console.log('⚠️ Không thể kiểm tra trạng thái MetaMask');
      }

      console.log('📡 Requesting accounts with popup...');
      // Request wallet_requestPermissions để bắt buộc hiển thị popup chọn tài khoản
      try {
        await window.ethereum.request({
          method: 'wallet_requestPermissions',
          params: [{ eth_accounts: {} }]
        });
      } catch (permErr) {
        // Nếu user từ chối permission, throw error
        if (permErr.code === 4001) {
          throw new Error('Bạn đã từ chối cấp quyền truy cập');
        }
        // Nếu lỗi khác, tiếp tục với eth_requestAccounts
        console.log('Permission request failed, falling back to eth_requestAccounts');
      }

      // Request accounts sau khi đã yêu cầu permissions
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts'
      });

      if (accounts.length === 0) {
        throw new Error('Không tìm thấy tài khoản');
      }

      console.log('🌐 Initializing provider...');
      // Init provider directly
      const web3Provider = new ethers.BrowserProvider(window.ethereum);
      
      console.log('🔗 Getting network info...');
      // Get network info
      const network = await web3Provider.getNetwork();
      const currentChainId = Number(network.chainId);
      console.log('Network ChainID:', currentChainId);

      console.log('✍️ Getting signer...');
      // Get signer
      const web3Signer = await web3Provider.getSigner();

      console.log('📍 Getting address...');
      // Get address
      const address = await web3Signer.getAddress();
      console.log('Address:', address);

      console.log('📄 Initializing contract...');
      // Init contract
      const contractInstance = new ethers.Contract(
        CONTRACT_ADDRESS,
        ContractABI.abi,
        web3Signer
      );

      // Update all states together
      setProvider(web3Provider);
      setChainId(currentChainId);
      setSigner(web3Signer);
      setAccount(address);
      setContract(contractInstance);
      setConnected(true);
      setLoading(false);
      
      console.log('✅ Wallet connected successfully!');
      
      return true;
    } catch (err) {
      console.error('❌ Connect wallet error:', err);
      console.error('Error details:', {
        message: err.message,
        code: err.code,
        data: err.data
      });
      
      let errorMessage = 'Không thể kết nối ví';
      
      if (err.code === 4001) {
        errorMessage = 'Bạn đã từ chối kết nối';
      } else if (err.code === -32002) {
        errorMessage = 'Vui lòng mở MetaMask và chấp nhận yêu cầu kết nối';
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
      setConnected(false);
      setLoading(false);
      return false;
    }
  }, []);

  /**
   * Ngắt kết nối ví
   */
  const disconnectWallet = useCallback(() => {
    setProvider(null);
    setSigner(null);
    setContract(null);
    setAccount(null);
    setConnected(false);
    hasLoggedConnection.current = false; // Reset log flag
    // console.log('🔌 Disconnected wallet');
  }, []);

  /**
   * Lấy provider (read-only)
   */
  const getProvider = useCallback(() => {
    return provider;
  }, [provider]);

  /**
   * Lấy signer
   */
  const getSigner = useCallback(() => {
    return signer;
  }, [signer]);

  /**
   * Lấy contract instance
   */
  const getContract = useCallback(() => {
    return contract;
  }, [contract]);

  /**
   * Lấy chain ID
   */
  const getChainId = useCallback(() => {
    return chainId;
  }, [chainId]);

  /**
   * Chuyển mạng
   */
  const switchNetwork = useCallback(async (targetChainId = DEFAULT_CHAIN_ID) => {
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${targetChainId.toString(16)}` }]
      });
      return true;
    } catch (err) {
      console.error('Switch network error:', err);
      setError('Không thể chuyển mạng');
      return false;
    }
  }, []);

  /**
   * Khởi tạo read-only contract khi component mount
   */
  useEffect(() => {
    const initReadOnlyContract = async () => {
      try {
        // Sử dụng RPC URL của Cronos Testnet
        const rpcUrl = RPC_URLS[DEFAULT_CHAIN_ID] || 'https://evm-t3.cronos.org';
        console.log('🔗 Initializing read-only contract with RPC:', rpcUrl);
        
        const publicProvider = new ethers.JsonRpcProvider(rpcUrl);
        
        // Kiểm tra kết nối
        try {
          const network = await publicProvider.getNetwork();
          console.log('📡 Connected to network:', network.chainId.toString());
        } catch (netErr) {
          console.warn('⚠️ Network check failed:', netErr.message);
        }
        
        // Tạo contract chỉ đọc
        const readContract = new ethers.Contract(
          CONTRACT_ADDRESS,
          ContractABI.abi,
          publicProvider
        );
        
        setReadOnlyContract(readContract);
        console.log('✅ Read-only contract initialized at:', CONTRACT_ADDRESS);
      } catch (err) {
        console.error('❌ Failed to initialize read-only contract:', err);
      }
    };

    initReadOnlyContract();
  }, []);

  /**
   * Khởi tạo - không tự động kết nối, yêu cầu người dùng chọn tài khoản qua popup
   */
  useEffect(() => {
    const initializeApp = async () => {
      if (typeof window.ethereum === 'undefined') {
        setError('Vui lòng cài đặt MetaMask để sử dụng ứng dụng');
      }
      setInitializing(false);
    };

    initializeApp();
  }, []);

  /**
   * Lắng nghe sự thay đổi account
   */
  useEffect(() => {
    if (typeof window.ethereum !== 'undefined') {
      const handleAccountsChanged = (accounts) => {
        if (accounts.length === 0) {
          disconnectWallet();
        } else if (accounts[0] !== account) {
          setAccount(accounts[0]);
          // Reconnect to update signer
          connectWallet();
        }
      };

      const handleChainChanged = (chainIdHex) => {
        const newChainId = parseInt(chainIdHex, 16);
        setChainId(newChainId);
        // Reload page to reset state
        window.location.reload();
      };

      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);

      return () => {
        if (window.ethereum.removeListener) {
          window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
          window.ethereum.removeListener('chainChanged', handleChainChanged);
        }
      };
    }
  }, [account, connectWallet, disconnectWallet]);

  return {
    provider,
    signer,
    contract,
    readOnlyContract,
    account,
    chainId,
    connected,
    loading,
    initializing,
    error,
    connectWallet,
    disconnectWallet,
    getProvider,
    getSigner,
    getContract,
    getChainId,
    switchNetwork
  };
};
