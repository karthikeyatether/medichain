import Identicon from 'identicon.js';
import { Container, Nav, Navbar, Button } from "react-bootstrap";
import { Link, useNavigate } from 'react-router-dom';
import logo from '../assets/logo.svg';
import { useWeb3 } from '../Web3Context';

const SiteNavbar = () => {
  const navigate = useNavigate();
  const { token, account, setAccount, setToken, isDarkMode, toggleTheme } = useWeb3();

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('account');
    setToken('');
    setAccount('');
    navigate('/login');
  };

  return (
    <Navbar collapseOnSelect expand="md" fixed="top" className="site-navbar">
      <Container>
        {/* Brand */}
        <Navbar.Brand as={Link} to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <img height="32" src={logo} alt="MediChain" style={{ borderRadius: '6px' }} />
          <span style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 800,
            fontSize: '1.25rem',
            background: 'var(--grad-brand)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>
            MediChain
          </span>
        </Navbar.Brand>

        <Navbar.Toggle aria-controls="responsive-navbar-nav" />

        <Navbar.Collapse id="responsive-navbar-nav">
          <Nav className="ms-auto align-items-center gap-2">

            {/* Dark Mode Toggle */}
            <button
              onClick={toggleTheme}
              title="Toggle Dark Mode"
              style={{
                background: isDarkMode ? 'rgba(99,102,241,0.15)' : 'rgba(99,102,241,0.07)',
                border: '1px solid rgba(99,102,241,0.18)',
                borderRadius: '50%',
                width: 36, height: 36,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer',
                fontSize: '1rem',
                color: 'var(--brand-500)',
                transition: 'all 0.25s ease',
              }}
            >
              {isDarkMode ? '🌞' : '🌙'}
            </button>

            {token !== '' && account !== '' ? (
              <>
                {/* Wallet chip */}
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '0.5rem',
                  background: 'rgba(99,102,241,0.06)',
                  border: '1px solid rgba(99,102,241,0.15)',
                  borderRadius: '50px',
                  padding: '0.3rem 0.75rem 0.3rem 0.3rem',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  color: 'var(--text-secondary)',
                }}>
                  <img
                    className="rounded-circle"
                    width="26" height="26"
                    src={`data:image/png;base64,${new Identicon(account, 26).toString()}`}
                    alt="avatar"
                    style={{ border: '2px solid rgba(99,102,241,0.3)' }}
                  />
                  {account.slice(0, 6)}...{account.slice(-4)}
                </div>

                {/* Logout */}
                <Button
                  variant="outline-danger"
                  size="sm"
                  className="rounded-pill px-3 fw-semibold"
                  style={{ fontSize: '0.82rem' }}
                  onClick={logout}
                >
                  Sign Out
                </Button>
              </>
            ) : (
              <>
                <Nav.Link
                  as={Link}
                  to="/login"
                  className="fw-semibold"
                  style={{ fontSize: '0.88rem' }}
                >
                  Sign In
                </Nav.Link>
                <Button
                  as={Link}
                  to="/register"
                  size="sm"
                  className="rounded-pill px-4 fw-bold btn-primary"
                  style={{ fontSize: '0.85rem' }}
                >
                  Register →
                </Button>
              </>
            )}
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default SiteNavbar;
