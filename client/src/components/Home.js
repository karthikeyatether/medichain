import React from 'react';
import { Container, Row, Col, Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';

const features = [
  {
    icon: '🔒',
    title: 'Immutable Records',
    desc: 'Medical records stored on Ethereum — tamper-proof, always accessible, owned by you.',
    color: 'rgba(99,102,241,0.12)',
  },
  {
    icon: '⚡',
    title: 'Instant Access',
    desc: 'Grant or revoke doctor access in seconds from anywhere in the world. No paperwork.',
    color: 'rgba(6,182,212,0.12)',
  },
  {
    icon: '🛡️',
    title: 'Smart Insurance',
    desc: 'Automated claim processing — when a doctor files a diagnosis, the insurer pays directly.',
    color: 'rgba(139,92,246,0.12)',
  },
  {
    icon: '👁️',
    title: 'Full Transparency',
    desc: 'Every access event and transaction is permanently recorded with timestamps on-chain.',
    color: 'rgba(16,185,129,0.12)',
  },
  {
    icon: '🌐',
    title: 'Decentralized',
    desc: 'No central server, no single point of failure. Your data lives on the blockchain.',
    color: 'rgba(245,158,11,0.12)',
  },
  {
    icon: '💊',
    title: 'IPFS Prescriptions',
    desc: 'Prescriptions and files stored on IPFS — distributed, permanent, and retrievable.',
    color: 'rgba(239,68,68,0.12)',
  },
];

const roles = [
  {
    icon: '🏥',
    role: 'Doctor',
    title: 'Doctor Portal',
    desc: 'View patient records, submit diagnoses, and manage insurance claims seamlessly.',
    color: '#6366f1',
  },
  {
    icon: '👤',
    role: 'Patient',
    title: 'Patient Dashboard',
    desc: 'Own your health data. Grant access, buy insurance, and track your transaction history.',
    color: '#06b6d4',
  },
  {
    icon: '🛡️',
    role: 'Insurer',
    title: 'Insurer Panel',
    desc: 'Manage policies, review claims, and approve payouts — all on-chain with full audit trails.',
    color: '#8b5cf6',
  },
];

const Home = () => {
  return (
    <div className="home-wrapper">
      {/* ─── Hero ─────────────────────────────── */}
      <section className="hero-section">
        {/* Ambient orbs */}
        <div className="hero-orb hero-orb-1" />
        <div className="hero-orb hero-orb-2" />
        <div className="hero-orb hero-orb-3" />

        <Container style={{ position: 'relative', zIndex: 2 }}>
          <Row className="align-items-center gy-5">
            <Col lg={6} className="slide-up">
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  background: 'rgba(99,102,241,0.1)',
                  border: '1px solid rgba(99,102,241,0.2)',
                  borderRadius: '50px',
                  padding: '0.35rem 1rem',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  color: '#6366f1',
                  marginBottom: '1.5rem',
                }}
              >
                <span style={{ animation: 'pulse-glow 2s ease infinite' }}>⬡</span>
                Built on Ethereum Blockchain
              </div>

              <h1 className="hero-title">
                Healthcare Records,<br />
                Secured Forever.
              </h1>

              <p className="hero-subtitle">
                MediChain gives patients full ownership of their medical data,
                automates insurance claims, and eliminates paperwork — powered
                by smart contracts.
              </p>

              <div className="d-flex flex-wrap gap-3">
                <Button
                  as={Link}
                  to="/register"
                  variant="primary"
                  size="lg"
                  className="rounded-pill px-5 btn-primary fw-bold"
                  style={{ fontSize: '0.95rem' }}
                >
                  Get Started Free →
                </Button>
                <Button
                  as={Link}
                  to="/login"
                  variant="outline-primary"
                  size="lg"
                  className="rounded-pill px-5 fw-bold"
                  style={{ fontSize: '0.95rem' }}
                >
                  Sign In
                </Button>
              </div>

              {/* Quick stats */}
              <div className="d-flex gap-4 mt-5">
                {[['3', 'User Roles'], ['100%', 'On-Chain'], ['0', 'Downtime']].map(([val, label]) => (
                  <div key={label}>
                    <div style={{ fontSize: '1.6rem', fontWeight: 800, background: 'var(--grad-brand)', backgroundClip: 'text', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{val}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>{label}</div>
                  </div>
                ))}
              </div>
            </Col>

            <Col lg={6}>
              <div className="hero-visual architecture-box fade-in">
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'radial-gradient(ellipse at center, rgba(99,102,241,0.08) 0%, transparent 70%)',
                  }}
                />
                <div style={{ position: 'relative', zIndex: 2, textAlign: 'center', padding: '2rem' }}>
                  <div style={{
                    fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.12em',
                    textTransform: 'uppercase', color: 'var(--brand-500)',
                    marginBottom: '1.5rem',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem'
                  }}>
                    <span style={{ width: 24, height: 1, background: 'var(--brand-400)', display: 'inline-block' }} />
                    MediChain Ecosystem
                    <span style={{ width: 24, height: 1, background: 'var(--brand-400)', display: 'inline-block' }} />
                  </div>

                  <div className="d-flex justify-content-center gap-3 flex-wrap">
                    {roles.map((r) => (
                      <div key={r.role} style={{
                        background: 'rgba(255,255,255,0.85)',
                        border: `1.5px solid ${r.color}30`,
                        borderRadius: '1rem',
                        padding: '1.25rem',
                        width: 120,
                        boxShadow: `0 8px 24px ${r.color}20`,
                        transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                        cursor: 'default',
                      }}
                        className="hover-scale"
                      >
                        <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{r.icon}</div>
                        <div style={{ fontSize: '0.75rem', fontWeight: 700, color: r.color }}>{r.role}</div>
                      </div>
                    ))}
                  </div>

                  {/* Connection lines hint */}
                  <div style={{ marginTop: '2rem', color: 'var(--text-muted)', fontSize: '0.78rem' }}>
                    ↔ Connected via Smart Contracts ↔
                  </div>

                  {/* Blockchain badge */}
                  <div style={{
                    marginTop: '1.5rem',
                    display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                    background: 'rgba(99,102,241,0.08)',
                    border: '1px solid rgba(99,102,241,0.15)',
                    borderRadius: '50px',
                    padding: '0.4rem 1rem',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    color: 'var(--brand-600)',
                  }}>
                    ⬡ Ethereum · Solidity · IPFS
                  </div>
                </div>
              </div>
            </Col>
          </Row>
        </Container>
      </section>

      {/* ─── Features ─────────────────────────── */}
      <section className="section" style={{ background: 'var(--surface)' }}>
        <Container>
          <div className="text-center mb-5">
            <div style={{
              display: 'inline-block',
              background: 'var(--grad-glow)',
              border: 'var(--border)',
              borderRadius: '50px',
              padding: '0.3rem 1rem',
              fontSize: '0.78rem',
              fontWeight: 700,
              color: 'var(--brand-600)',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              marginBottom: '1rem',
            }}>Why MediChain</div>
            <h2 style={{ fontSize: 'clamp(1.8rem, 3vw, 2.5rem)', fontWeight: 800, marginBottom: '0.75rem' }}>
              Everything you need for <span className="text-gradient">secure healthcare</span>
            </h2>
            <p style={{ color: 'var(--text-secondary)', maxWidth: 520, margin: '0 auto', lineHeight: 1.7 }}>
              Built with Ethereum smart contracts and IPFS — designed for real-world medical workflows.
            </p>
          </div>

          <Row className="g-4">
            {features.map((f, i) => (
              <Col md={4} key={i}>
                <div className="feature-card h-100">
                  <div className="feature-icon" style={{ background: f.color, border: '1px solid rgba(99,102,241,0.1)' }}>
                    {f.icon}
                  </div>
                  <h5 style={{ fontWeight: 700, marginBottom: '0.5rem' }}>{f.title}</h5>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: 0, lineHeight: 1.65 }}>{f.desc}</p>
                </div>
              </Col>
            ))}
          </Row>
        </Container>
      </section>

      {/* ─── Role Cards ───────────────────────── */}
      <section className="section" style={{ background: 'var(--bg)' }}>
        <Container>
          <div className="text-center mb-5">
            <h2 style={{ fontSize: 'clamp(1.8rem, 3vw, 2.4rem)', fontWeight: 800 }}>
              Three roles. <span className="text-gradient">One ecosystem.</span>
            </h2>
            <p style={{ color: 'var(--text-secondary)', maxWidth: 480, margin: '0.5rem auto 0' }}>
              Every party in the healthcare chain has a dedicated, role-specific dashboard.
            </p>
          </div>
          <Row className="g-4 justify-content-center">
            {roles.map((r) => (
              <Col md={4} key={r.role}>
                <div className="glass-card text-center" style={{ borderTop: `3px solid ${r.color}` }}>
                  <div style={{
                    width: 64, height: 64, borderRadius: '1rem',
                    background: `${r.color}18`,
                    border: `2px solid ${r.color}30`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '2rem', margin: '0 auto 1rem',
                  }}>{r.icon}</div>
                  <h4 style={{ fontWeight: 800, color: r.color }}>{r.title}</h4>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.65, marginBottom: '1.5rem' }}>{r.desc}</p>
                  <Button
                    as={Link} to="/register"
                    className="rounded-pill px-4 btn-primary fw-bold"
                    size="sm"
                    style={{ background: `${r.color}`, borderColor: r.color }}
                  >
                    Register as {r.role}
                  </Button>
                </div>
              </Col>
            ))}
          </Row>
        </Container>
      </section>

      {/* ─── CTA ──────────────────────────────── */}
      <section style={{
        background: 'var(--grad-brand)',
        padding: '5rem 0',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.08) 1px, transparent 0)',
          backgroundSize: '28px 28px',
        }} />
        <Container style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
          <h2 style={{ fontSize: 'clamp(1.8rem, 3vw, 2.8rem)', fontWeight: 800, color: '#fff', marginBottom: '1rem' }}>
            Ready to own your health data?
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.8)', maxWidth: 480, margin: '0 auto 2rem', lineHeight: 1.7 }}>
            Join the decentralized healthcare revolution. Register in seconds and connect your MetaMask wallet.
          </p>
          <Button
            as={Link} to="/register"
            size="lg"
            className="rounded-pill px-5 fw-bold"
            style={{ background: '#fff', color: '#6366f1', border: 'none', boxShadow: '0 8px 30px rgba(0,0,0,0.2)' }}
          >
            Get Started Now →
          </Button>
        </Container>
      </section>
    </div>
  );
};

export default Home;