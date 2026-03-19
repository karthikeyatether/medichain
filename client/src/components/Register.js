import React, { useState } from 'react';
import { Container, Row, Col, Form, Button, Alert } from 'react-bootstrap';
import { useNavigate, Link } from 'react-router-dom';

const roleOptions = [
  { value: '1', label: 'Patient',  icon: '👤', desc: 'Manage health records & insurance', color: '#6366f1' },
  { value: '2', label: 'Doctor',   icon: '🩺', desc: 'View patients & submit diagnoses', color: '#06b6d4'  },
  { value: '3', label: 'Insurer',  icon: '🛡️', desc: 'Create policies & review claims',  color: '#8b5cf6' },
];

const Register = ({ mediChain, setToken, setAccount, connectWallet, account }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [role, setRole] = useState('1');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [age, setAge] = useState('');

  const selected = roleOptions.find(r => r.value === role);

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (!mediChain) throw new Error('Blockchain not connected');
      if (!account)   throw new Error('Wallet not connected');

      // Validate age for non-insurer roles
      if (role !== '3' && (!age || parseInt(age) < 1 || parseInt(age) > 130)) {
        setError('Please enter a valid age (1–130).');
        setLoading(false);
        return;
      }

      // Check email uniqueness
      const existingAddr = await mediChain.methods
        .emailToAddress(email.toLowerCase().trim())
        .call()
        .catch(() => '0x0000000000000000000000000000000000000000');
      if (existingAddr !== '0x0000000000000000000000000000000000000000') {
        setError('This email is already registered to another account.');
        setLoading(false);
        return;
      }

      const hash = role === '1' ? 'init' : '';
      const norm = account.toLowerCase();
      await mediChain.methods
        .register(name.trim(), parseInt(age || '0'), role, email.toLowerCase().trim(), hash)
        .send({ from: norm });

      // Verify registration succeeded
      let exists = false;
      if (role === '1') { const res = await mediChain.methods.patientInfo(norm).call().catch(() => null); exists = res?.exists; }
      if (role === '2') { const res = await mediChain.methods.doctorInfo(norm).call().catch(() => null);  exists = res?.exists; }
      if (role === '3') { const res = await mediChain.methods.insurerInfo(norm).call().catch(() => null); exists = res?.exists; }

      if (!exists) {
        setError('Transaction completed but account not created. Your wallet may already be registered under a different role.');
        setLoading(false);
        return;
      }

      setToken(role);
      localStorage.setItem('token', role);
      localStorage.setItem('account', account);
      navigate('/dashboard');

    } catch (err) {
      console.error('REGISTER ERROR:', err);
      const msg = err?.message?.includes('revert')
        ? 'Contract reverted: ' + (err.message.split('revert')[1]?.trim() || 'Unknown reason')
        : 'Registration failed. Ensure MetaMask is connected and transaction approved.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrapper overflow-hidden position-relative">
      <div className="blob blob-1" />
      <div className="blob blob-2" />

      <Container className="position-relative" style={{ zIndex: 2 }}>
        <Row className="justify-content-center">
          <Col xs={12} sm={10} md={8} lg={6}>
            <div className="glass-card">

              {/* Header */}
              <div className="text-center mb-4">
                <div style={{
                  width: 60, height: 60, borderRadius: '1rem',
                  background: 'var(--grad-brand)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '1.6rem', margin: '0 auto 1rem',
                  boxShadow: 'var(--shadow-glow)',
                }}>✚</div>
                <h2 style={{
                  fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.6rem',
                  background: 'var(--grad-brand)', backgroundClip: 'text',
                  WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                  marginBottom: '0.25rem'
                }}>Create Account</h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>
                  Join the decentralized healthcare network
                </p>
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
                    Connect your MetaMask wallet to create an account.
                  </p>
                  <Button onClick={connectWallet} className="w-100 rounded-pill py-3 fw-bold btn-primary">
                    Connect MetaMask
                  </Button>
                </div>
              ) : (
                <Form onSubmit={handleRegister}>

                  {/* Role Selector Cards */}
                  <div style={{ marginBottom: '1.25rem' }}>
                    <label style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.6rem', display: 'block' }}>
                      I am a…
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

                  {/* Fields */}
                  <div style={{ marginBottom: '1rem' }}>
                    <label style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.4rem', display: 'block' }}>
                      Full Name
                    </label>
                    <Form.Control
                      type="text"
                      placeholder={`Enter ${selected?.label === 'Insurer' ? 'company' : 'your'} name`}
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      className="form-control"
                    />
                  </div>

                  <div style={{ marginBottom: '1rem' }}>
                    <label style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.4rem', display: 'block' }}>
                      Email Address
                    </label>
                    <Form.Control
                      type="email"
                      placeholder="Enter email address"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="form-control"
                    />
                  </div>

                  <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.4rem', display: 'block' }}>
                      Age {role === '3' && <span style={{ fontWeight: 400, textTransform: 'none' }}>(enter 0 for organization)</span>}
                    </label>
                    <Form.Control
                      type="number"
                      min="0"
                      max="130"
                      placeholder={role === '3' ? '0' : 'Enter your age'}
                      value={age}
                      onChange={(e) => setAge(e.target.value)}
                      required
                      className="form-control"
                    />
                  </div>

                  {/* Wallet indicator */}
                  <div style={{
                    background: 'rgba(99,102,241,0.05)',
                    border: 'var(--border)',
                    borderRadius: 'var(--r-lg)',
                    padding: '0.6rem 1rem',
                    marginBottom: '1.25rem',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontSize: '0.8rem',
                  }}>
                    <span style={{ color: 'var(--text-muted)' }}>Wallet</span>
                    <span style={{ fontWeight: 700, color: 'var(--brand-500)', fontFamily: 'monospace', fontSize: '0.78rem' }}>
                      {account.slice(0, 8)}...{account.slice(-6)}
                    </span>
                  </div>

                  <Button
                    type="submit"
                    className="w-100 rounded-pill py-3 fw-bold btn-primary"
                    style={{ fontSize: '0.95rem', letterSpacing: '0.02em' }}
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" />
                        Creating Identity on Blockchain...
                      </>
                    ) : (
                      `Register as ${selected?.label} →`
                    )}
                  </Button>
                </Form>
              )}

              <div className="text-center mt-4 pt-3" style={{ borderTop: 'var(--border)' }}>
                <small style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                  Already have an account?{' '}
                  <Link to="/login" style={{ fontWeight: 700, background: 'var(--grad-brand)', backgroundClip: 'text', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                    Sign In
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

export default Register;