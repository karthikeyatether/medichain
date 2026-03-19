import React from 'react';
import { Container } from 'react-bootstrap';

const Footer = () => {
  return (
    <footer className="site-footer mt-auto py-4">
      <Container>
        <div className="d-flex flex-wrap justify-content-between align-items-center gap-3">
          <div className="d-flex align-items-center gap-2">
            <span style={{
              fontSize: '1.1rem', fontWeight: 800,
              background: 'var(--grad-brand)',
              backgroundClip: 'text', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              fontFamily: 'var(--font-display)',
            }}>⬡ MediChain</span>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              © {new Date().getFullYear()} · Decentralized Medical Records
            </span>
          </div>
          <div className="d-flex align-items-center gap-2" style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            <span style={{
              background: 'rgba(99,102,241,0.08)',
              border: '1px solid rgba(99,102,241,0.15)',
              borderRadius: '50px',
              padding: '0.25rem 0.75rem',
              fontWeight: 600,
              color: 'var(--brand-500)',
            }}>⬡ Etherneum · Solidity · IPFS</span>
          </div>
        </div>
      </Container>
    </footer>
  );
};

export default Footer;