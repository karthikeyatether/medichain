import React from 'react';
import { Badge } from 'react-bootstrap';

const Timeline = ({ treatments }) => {
  if (!treatments || treatments.length === 0) {
    return (
      <div className="text-center py-5" style={{ color: 'var(--text-muted)' }}>
        <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem', opacity: 0.4 }}>🩺</div>
        <p style={{ fontWeight: 500 }}>No medical history found on the blockchain.</p>
        <small>Treatments submitted by doctors will appear here.</small>
      </div>
    );
  }

  return (
    <div className="timeline-container">
      {treatments.map((item, index) => (
        <div className="timeline-item" key={index}>
          <div className="timeline-marker" />
          <div className="timeline-content">
            {/* Header row */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.75rem' }}>
              <div>
                <Badge style={{
                  background: 'var(--grad-brand)',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  padding: '0.35em 0.85em',
                  borderRadius: '50px',
                  marginBottom: '0.35rem',
                  display: 'inline-block',
                }}>
                  {item.disease}
                </Badge>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.2rem' }}>
                <span style={{
                  fontSize: '0.72rem',
                  background: 'rgba(99,102,241,0.07)',
                  border: '1px solid rgba(99,102,241,0.15)',
                  borderRadius: '50px',
                  padding: '0.2rem 0.65rem',
                  color: 'var(--brand-600)',
                  fontWeight: 600,
                }}>
                  Dr. {item.doctorEmail?.split('@')[0]}
                </span>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  {item.date}
                </span>
              </div>
            </div>

            {/* Treatment text */}
            <p style={{
              fontSize: '0.875rem',
              color: 'var(--text-secondary)',
              lineHeight: 1.65,
              marginBottom: item.prescription ? '0.75rem' : 0,
              whiteSpace: 'pre-wrap',
            }}>
              {item.treatment}
            </p>

            {/* Prescription link */}
            {item.prescription && (
              <div style={{ borderTop: 'var(--border)', paddingTop: '0.6rem' }}>
                <a
                  href={`${process.env.REACT_APP_INFURA_DEDICATED_GATEWAY}/ipfs/${item.prescription}`}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    background: 'var(--grad-glow)',
                    border: 'var(--border)',
                    borderRadius: '50px',
                    padding: '0.3rem 0.9rem',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    color: 'var(--brand-600)',
                    textDecoration: 'none',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={e => e.currentTarget.style.boxShadow = 'var(--shadow-sm)'}
                  onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}
                >
                  📄 View Prescription
                </a>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default Timeline;
