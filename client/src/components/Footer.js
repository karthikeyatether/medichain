import React from 'react';

const Footer = () => {
    return (
        <footer className="py-4 mt-auto" style={{ background: '#f1f5f9', borderTop: '1px solid #e2e8f0' }}>
            <div className="container text-center">
                <p className="mb-0 text-muted" style={{ fontWeight: 500 }}>
                    &copy; {new Date().getFullYear()} <span style={{ color: 'var(--primary-color)', fontWeight: 700 }}>MediChain</span>.
                    Decentralized Medical Records.
                </p>
                <div className="mt-2">
                    <small className="text-muted">Built with Blockchain Security</small>
                </div>
            </div>
        </footer>
    );
};

export default Footer;