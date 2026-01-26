import React, { createContext, useContext } from 'react';
import { useContract as useContractHook } from '../hooks/useContract';

const ContractContext = createContext(null);

export const ContractProvider = ({ children }) => {
  const contractData = useContractHook();
  
  return (
    <ContractContext.Provider value={contractData}>
      {children}
    </ContractContext.Provider>
  );
};

export const useContract = () => {
  const context = useContext(ContractContext);
  if (!context) {
    throw new Error('useContract must be used within ContractProvider');
  }
  return context;
};
