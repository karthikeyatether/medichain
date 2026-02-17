import { useEffect, useState } from 'react';
import Web3 from 'web3';
import { create } from 'ipfs-http-client';
import { Buffer } from 'buffer';
import MediChain from './contracts/MediChain.json';
import Dashboard from './components/Dashboard.js';
import Home from './components/Home.js';
import Login from './components/Login.js';
import Register from './components/Register.js';
import Footer from './components/Footer';
import SiteNavbar from './components/SiteNavbar';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ToastProvider } from './components/ToastContext';

const auth = 'Basic ' + Buffer.from(process.env.REACT_APP_INFURA_PROJECT_ID + ':' + process.env.REACT_APP_INFURA_API_KEY_SECRET).toString('base64');
const ipfs = create({
  host: 'ipfs.infura.io',
  port: 5001,
  protocol: 'https',
  headers: {
    authorization: auth
  }
});

function App() {
  const [account, setAccount] = useState('');
  const [token, setToken] = useState('');
  const [mediChain, setMediChain] = useState(null);

  const connectWallet = async () => {
    if (window.ethereum) {
      window.ethereum.request({ method: 'eth_requestAccounts' })
        .then(result => {
          setAccount(result[0]);
        })
        .catch(error => {
          console.error("Wallet connection failed:", error);
        });
      window.ethereum.on('chainChanged', () => window.location.reload());
    } else {
      alert('Please use Metamask or a Web3 enabled browser');
    }
  }

  const getContractInstance = async () => {
    const web3 = new Web3(window.ethereum || Web3.givenProvider || 'http://localhost:8545')
    const networkId = await web3.eth.net.getId()
    const networkData = MediChain.networks[networkId]
    if (networkData) {
      const mediChain = new web3.eth.Contract(MediChain.abi, networkData.address)
      setMediChain(mediChain)
    } else {
      // Try to switch to Localhost 8545 (Chain ID 1337)
      try {
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: '0x539' }], // 1337 in hex
        });
        window.location.reload();
      } catch (switchError) {
        // This error code indicates that the chain has not been added to MetaMask.
        if (switchError.code === 4902) {
          try {
            await window.ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [
                {
                  chainId: '0x539',
                  chainName: 'Localhost 8545',
                  rpcUrls: ['http://localhost:8545'],
                },
              ],
            });
            window.location.reload();
          } catch (addError) {
            console.error(addError);
          }
        }
        alert(`Smart contract not deployed to network ${networkId}. Please connect to Localhost 8545 (Chain ID 1337) or 5777.`);
      }
    }
  }

  useEffect(() => {
    getContractInstance()
  }, [])

  return (
    <ToastProvider>
      <div className="App">
        <Router>
          <SiteNavbar account={account} token={token} setToken={setToken} setAccount={setAccount} />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/register" element={<Register mediChain={mediChain} account={account} token={token} setToken={setToken} setAccount={setAccount} connectWallet={connectWallet} ipfs={ipfs} />} />
            <Route path="/login" element={<Login mediChain={mediChain} setToken={setToken} setAccount={setAccount} connectWallet={connectWallet} account={account} />} />
            <Route path="/dashboard" element={<Dashboard mediChain={mediChain} account={account} token={token} ipfs={ipfs} />} />
          </Routes>
          <Footer />
        </Router>
      </div>
    </ToastProvider>
  );
}

export default App;
