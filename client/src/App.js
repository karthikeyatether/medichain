import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ToastProvider } from './components/ToastContext';
import { Web3Provider, useWeb3 } from './Web3Context';
import Dashboard from './components/Dashboard.js';
import Home from './components/Home.js';
import Login from './components/Login.js';
import Register from './components/Register.js';
import Footer from './components/Footer';
import SiteNavbar from './components/SiteNavbar';

const AppContent = () => {
  const { isDarkMode } = useWeb3();
  return (
    <div className={`app-wrapper ${isDarkMode ? 'dark-theme' : ''}`}>
      <Router>
        <SiteNavbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={<Dashboard />} />
        </Routes>
        <Footer />
      </Router>
    </div>
  );
};

function App() {
  return (
    <Web3Provider>
      <ToastProvider>
        <AppContent />
      </ToastProvider>
    </Web3Provider>
  );
}

export default App;
