import React, { useState } from 'react';
import { Badge } from 'react-bootstrap';
import CryptoJS from 'crypto-js';
import { useToast } from './ToastContext';
import { decryptFile, isWebCryptoFile } from '../cryptoUtils';

const SECRET_KEY = process.env.REACT_APP_ENCRYPTION_SECRET || 'medichain-secure-key-2026';

const Timeline = ({ treatments }) => {
  const addToast = useToast();
  const [downloading, setDownloading] = useState(null);

  const handleViewPrescription = async (cid) => {
    setDownloading(cid);
    try {
      const res = await fetch(`${process.env.REACT_APP_INFURA_DEDICATED_GATEWAY}/ipfs/${cid}`);
      if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText} (Gateway may be timing out on large files)`);
      
      const blob = await res.blob();
      const arrayBuffer = await blob.arrayBuffer();
      
      if (isWebCryptoFile(arrayBuffer)) {
        // New High-Performance Web Crypto Decryption
        const { blob: decryptedBlob, ext } = await decryptFile(arrayBuffer, SECRET_KEY);
        const objectUrl = URL.createObjectURL(decryptedBlob);
        
        const a = document.createElement('a');
        a.href = objectUrl;
        a.download = `prescription_${cid.slice(0, 6)}.${ext}`;
        a.target = '_blank';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        setTimeout(() => URL.revokeObjectURL(objectUrl), 10000);
      } else {
        // Legacy CryptoJS Decryption Fallback
        const textData = new TextDecoder().decode(arrayBuffer);
        let fileData = textData;
        try {
          const bytes = CryptoJS.AES.decrypt(textData, SECRET_KEY);
          const decryptedStr = bytes.toString(CryptoJS.enc.Utf8);
          if (decryptedStr.startsWith('data:')) {
            fileData = decryptedStr;
          }
        } catch (err) {}

        if (fileData.startsWith('data:')) {
          const fetchRes = await fetch(fileData);
          const legacyBlob = await fetchRes.blob();
          const objectUrl = URL.createObjectURL(legacyBlob);
          
          let ext = 'bin';
          if (legacyBlob.type.includes('pdf')) ext = 'pdf';
          else if (legacyBlob.type.includes('png')) ext = 'png';
          else if (legacyBlob.type.includes('jpeg')) ext = 'jpg';

          const a = document.createElement('a');
          a.href = objectUrl;
          a.download = `prescription_${cid.slice(0, 6)}.${ext}`;
          a.target = '_blank';
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);

          setTimeout(() => URL.revokeObjectURL(objectUrl), 10000);
        } else {
          // Raw unencrypted fallback
          window.open(`${process.env.REACT_APP_INFURA_DEDICATED_GATEWAY}/ipfs/${cid}`, '_blank');
        }
      }
    } catch (e) {
      console.error("Prescription fetch error:", e);
      addToast(`Failed to fetch prescription: ${e.message}`, 'danger');
    }
    setDownloading(null);
  };
  if (!treatments || treatments.length === 0) {
    return (
      <div className="text-center py-5" style={{ color: 'var(--text-muted)' }}>
        <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem', opacity: 0.4 }}>🩺</div>
        <p style={{ fontWeight: 500, color: 'var(--text-secondary)' }}>No medical history found on the blockchain.</p>
        <small style={{ color: 'var(--text-muted)' }}>Treatments submitted by doctors will appear here.</small>
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
                  background: 'rgba(99,102,241,0.12)',
                  border: '1px solid rgba(99,102,241,0.25)',
                  borderRadius: '50px',
                  padding: '0.2rem 0.65rem',
                  color: 'var(--brand-400)',
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
              color: 'var(--text-primary)',
              lineHeight: 1.65,
              marginBottom: item.prescription ? '0.75rem' : 0,
              whiteSpace: 'pre-wrap',
            }}>
              {item.treatment}
            </p>

            {/* Prescription link */}
            {item.prescription && (
              <div style={{ borderTop: 'var(--border)', paddingTop: '0.6rem' }}>
                <button
                  onClick={() => handleViewPrescription(item.prescription)}
                  disabled={downloading === item.prescription}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    background: 'rgba(99,102,241,0.12)',
                    border: '1px solid rgba(99,102,241,0.3)',
                    borderRadius: '50px',
                    padding: '0.3rem 0.9rem',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    color: 'var(--brand-400)',
                    cursor: downloading === item.prescription ? 'wait' : 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={e => { if (downloading !== item.prescription) { e.currentTarget.style.boxShadow = 'var(--shadow-sm)'; e.currentTarget.style.background = 'rgba(99,102,241,0.2)'; } }}
                  onMouseLeave={e => { if (downloading !== item.prescription) { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.background = 'rgba(99,102,241,0.12)'; } }}
                >
                  {downloading === item.prescription ? '⏳ Decrypting...' : '📄 View Prescription'}
                </button>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default Timeline;

