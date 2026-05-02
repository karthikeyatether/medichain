import React, { createContext, useContext, useState, useEffect } from 'react';
import Web3 from 'web3';
import MediChain from './contracts/MediChain.json';

const PINATA_JWT = process.env.REACT_APP_PINATA_JWT;

// Upload raw text/string to Pinata and return CID
export const pinataUploadText = async (text) => {
  const blob = new Blob([text], { type: 'text/plain' });
  const formData = new FormData();
  formData.append('file', blob, 'record.enc');
  const res = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
    method: 'POST',
    headers: { Authorization: `Bearer ${PINATA_JWT}` },
    body: formData,
  });
  if (!res.ok) throw new Error(`Pinata upload failed: ${res.statusText}`);
  const data = await res.json();
  return data.IpfsHash;
};

// Upload a binary Buffer (e.g. prescription PDF) to Pinata and return CID
export const pinataUploadFile = async (fileBuffer, fileName) => {
  const blob = new Blob([fileBuffer]);
  const formData = new FormData();
  formData.append('file', blob, fileName || 'prescription');
  const res = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
    method: 'POST',
    headers: { Authorization: `Bearer ${PINATA_JWT}` },
    body: formData,
  });
  if (!res.ok) throw new Error(`Pinata upload failed: ${res.statusText}`);
  const data = await res.json();
  return data.IpfsHash;
};

const Web3Context = createContext();

export const useWeb3 = () => useContext(Web3Context);

export const Web3Provider = ({ children }) => {
  const [account, setAccount] = useState('');
  const [token, setToken] = useState('');
  const [mediChain, setMediChain] = useState(null);
  const [ethValue, setEthValue] = useState(250000); // Mock ETH to INR value for display
  const [isDarkMode, setIsDarkMode] = useState(
    localStorage.getItem('theme') === 'dark' || false
  );

  useEffect(() => {
    if (isDarkMode) {
      document.body.classList.add('dark-theme');
      localStorage.setItem('theme', 'dark');
    } else {
      document.body.classList.remove('dark-theme');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  const toggleTheme = () => setIsDarkMode(!isDarkMode);

  const connectWallet = async () => {
    if (window.ethereum) {
      try {
        const result = await window.ethereum.request({ method: 'eth_requestAccounts' });
        setAccount(result[0]);
      } catch (error) {
        console.error("Wallet connection failed:", error);
      }
      window.ethereum.on('chainChanged', () => window.location.reload());
      window.ethereum.on('accountsChanged', (accounts) => setAccount(accounts[0] || ''));
    } else {
      alert('Please use Metamask or a Web3 enabled browser');
    }
  };

  const getContractInstance = async () => {
    if (!window.ethereum) return;
    const web3 = new Web3(window.ethereum || Web3.givenProvider || 'http://localhost:7545');
    try {
      const networkId = await web3.eth.net.getId();
      const networkData = MediChain.networks[networkId];
      if (networkData) {
        const instance = new web3.eth.Contract(MediChain.abi, networkData.address);
        setMediChain(instance);
      } else {
        // Switch chain logic if missing
      }
    } catch (e) {
      console.error(e);
    }
  };

  const eagerlyConnectWallet = async () => {
    if (window.ethereum) {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        if (accounts.length > 0) {
          setAccount(accounts[0]);
        }
      } catch (error) {
        console.error("Eager connection failed", error);
      }
    }
  };

  useEffect(() => {
    getContractInstance();
    eagerlyConnectWallet();

    fetch('https://api.coinbase.com/v2/exchange-rates?currency=ETH')
      .then(res => res.json())
      .then(res => setEthValue(res.data.rates.INR))
      .catch(err => {
        console.error("Failed to fetch ETH rate, using offline fallback", err);
        setEthValue(250000); // Default to 250,000 INR
      });
  }, []);

  const value = {
    account,
    setAccount,
    token,
    setToken,
    mediChain,
    isDarkMode,
    toggleTheme,
    connectWallet,
    ethValue
  };

  return (
    <Web3Context.Provider value={value}>
      {children}
    </Web3Context.Provider>
  );
};
