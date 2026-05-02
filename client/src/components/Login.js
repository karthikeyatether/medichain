import React, { useState } from 'react';
import { Container, Row, Col, Form, Button, Alert } from 'react-bootstrap';
import { useNavigate, Link } from 'react-router-dom';
import { useWeb3 } from '../Web3Context';

const roleOptions = [
  { value: '1', label: 'Patient', icon: '👤', desc: 'Access your health records & insurance' },
  { value: '2', label: 'Doctor',  icon: '🩺', desc: 'Manage patients & submit diagnoses' },
  { value: '3', label: 'Insurer', icon: '🛡️', desc: 'Review policies & approve claims' },
];

const Login = () => {
  const { mediChain, setToken, setAccount, connectWallet, account } = useWeb3();
  const [role, setRole] = useState('1');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const loginUser = (userRole) => {
    setToken(userRole);
    localStorage.setItem('token', userRole);
    localStorage.setItem('account', account);
    navigate('/dashboard');
  };

  const checkUserRole = async () => {
    if (!mediChain || !account) return;
    setLoading(true);
    try {
      const norm = account.toLowerCase();
      const [patient, doctor, insurer] = await Promise.all([
        mediChain.methods.patientInfo(norm).call().catch(() => null),
        mediChain.methods.doctorInfo(norm).call().catch(() => null),
        mediChain.methods.insurerInfo(norm).call().catch(() => null),
      ]);
      if (patient?.exists) return loginUser('1');
      if (doctor?.exists)  return loginUser('2');
      if (insurer?.exists) return loginUser('3');
      setLoading(false);
    } catch (err) {
      console.error(err);
      setError('Error verifying role. Please check console.');
      setLoading(false);
    }
  };

  React.useEffect(() => {
    if (mediChain && account) checkUserRole();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mediChain, account]);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!mediChain || !account) return;
    setLoading(true);
    setError('');
    try {
      const norm = account.toLowerCase();
      let res = null;
      if (role === '1') res = await mediChain.methods.patientInfo(norm).call().catch(() => null);
      if (role === '2') res = await mediChain.methods.doctorInfo(norm).call().catch(() => null);
      if (role === '3') res = await mediChain.methods.insurerInfo(norm).call().catch(() => null);
      if (res?.exists) {
        loginUser(role);
      } else {
        const label = roleOptions.find(r => r.value === role)?.label;
        setError(`Your wallet is not registered as a ${label}. Please register first.`);
        setLoading(false);
      }
    } catch (err) {
      console.error('LOGIN ERROR:', err);
      setError('Login failed. Verify your MetaMask connection.');
      setLoading(false);
    }
  };

  const selected = roleOptions.find(r => r.value === role);

  return (
    <div className="auth-wrapper overflow-hidden position-relative">
      {/* Ambient blobs */}
      <div className="blob blob-1" />
      <div className="blob blob-2" />

      <Container className="position-relative" style={{ zIndex: 2 }}>
        <Row className="justify-content-center">
          <Col xs={12} sm={10} md={7} lg={5}>
            <div className="glass-card" style={{ borderTop: '3px solid transparent', borderImage: 'var(--grad-brand) 1' }}>

              {/* Header */}
              <div className="text-center mb-4">
                <div style={{
                  width: 60, height: 60, borderRadius: '1rem',
                  background: 'var(--grad-brand)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '1.6rem', margin: '0 auto 1rem',
                  boxShadow: 'var(--shadow-glow)',
                }}>⬡</div>
                <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.6rem', background: 'var(--grad-brand)', backgroundClip: 'text', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: '0.25rem' }}>
                  Welcome Back
                </h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>Access your secure medical portal</p>
              </div>

              {error && (
                <Alert variant="danger" className="border-0 mb-3" style={{ borderRadius: 'var(--r-lg)', fontSize: '0.85rem' }}>
                  ⚠️ {error}
                </Alert>
              )}

              {!account ? (
                <div className="text-center py-3">
                  <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>🦊</div>
                  <p style={{ color: 'var(--text-secondary)', marginBottom: '1.25rem', fontSize: '0.9rem' }}>
                    Connect your MetaMask wallet to access your dashboard.
                  </p>
                  <Button onClick={connectWallet} className="w-100 rounded-pill py-3 fw-bold btn-primary">
                    Connect MetaMask
                  </Button>
                </div>
              ) : loading ? (
                <div className="text-center py-5">
                  <div className="spinner-border mb-3" style={{ color: 'var(--brand-500)' }} role="status" />
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Verifying wallet on-chain...</p>
                </div>
              ) : (
                <Form onSubmit={handleLogin}>
                  {/* Role Selector — cards instead of boring <select> */}
                  <div style={{ marginBottom: '1.25rem' }}>
                    <label style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.6rem', display: 'block' }}>
                      Select Your Role
                    </label>
                    <div style={{ display: 'flex', gap: '0.6rem' }}>
                      {roleOptions.map(opt => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => setRole(opt.value)}
                          style={{
                            flex: 1,
                            background: role === opt.value ? 'var(--grad-brand)' : 'var(--surface-2)',
                            border: role === opt.value ? 'none' : 'var(--border)',
                            borderRadius: 'var(--r-lg)',
                            padding: '0.75rem 0.5rem',
                            cursor: 'pointer',
                            textAlign: 'center',
                            transition: 'all 0.2s ease',
                            transform: role === opt.value ? 'scale(1.03)' : 'scale(1)',
                            boxShadow: role === opt.value ? 'var(--shadow-md)' : 'none',
                          }}
                        >
                          <div style={{ fontSize: '1.4rem', marginBottom: '0.2rem' }}>{opt.icon}</div>
                          <div style={{ fontSize: '0.72rem', fontWeight: 700, color: role === opt.value ? '#fff' : 'var(--text-primary)' }}>
                            {opt.label}
                          </div>
                        </button>
                      ))}
                    </div>
                    {selected && (
                      <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.5rem', textAlign: 'center' }}>
                        {selected.desc}
                      </p>
                    )}
                  </div>

                  <Button
                    type="submit"
                    className="w-100 rounded-pill py-3 fw-bold btn-primary"
                    style={{ fontSize: '0.95rem', letterSpacing: '0.02em' }}
                    disabled={loading}
                  >
                    Login to Dashboard →
                  </Button>
                </Form>
              )}

              <div className="text-center mt-4 pt-3" style={{ borderTop: 'var(--border)' }}>
                <small style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                  New to MediChain?{' '}
                  <Link to="/register" style={{ fontWeight: 700, background: 'var(--grad-brand)', backgroundClip: 'text', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                    Create an Account
                  </Link>
                </small>
              </div>
            </div>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default Login;