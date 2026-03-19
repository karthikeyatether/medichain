import React, { useState, useEffect } from 'react';
import { Button } from 'react-bootstrap';
import { useToast } from './ToastContext';
import Web3 from 'web3';

const Wallet = ({ mediChain, account, ethValue }) => {
  const [balanceEth, setBalanceEth] = useState('0');
  const [loading, setLoading] = useState(false);
  const addToast = useToast();

  const getBalance = async () => {
    if (!mediChain || !account) return;
    try {
      const balWei = await mediChain.methods.pendingWithdrawals(account).call();
      setBalanceEth(Web3.utils.fromWei(balWei, 'ether'));
    } catch (err) {
      console.error('Error fetching wallet balance:', err);
    }
  };

  const handleWithdraw = async () => {
    setLoading(true);
    try {
      await mediChain.methods.withdraw().send({ from: account });
      addToast('Withdrawal successful! Funds sent to your wallet. 💸', 'success');
      getBalance();
    } catch (err) {
      console.error('Withdrawal error:', err);
      addToast('Withdrawal failed. See console for details.', 'danger');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { getBalance(); }, [mediChain, account]);

  const inrValue = (parseFloat(balanceEth) * ethValue).toFixed(0);
  const hasBalance = parseFloat(balanceEth) > 0;

  return (
    <div className="mb-4" style={{
      background: hasBalance
        ? 'linear-gradient(135deg, rgba(99,102,241,0.08) 0%, rgba(139,92,246,0.06) 100%)'
        : 'var(--surface)',
      border: hasBalance ? '1.5px solid rgba(99,102,241,0.2)' : 'var(--border)',
      borderRadius: 'var(--r-2xl)',
      padding: '1.1rem 1.5rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      flexWrap: 'wrap',
      gap: '0.75rem',
      transition: 'all 0.3s ease',
    }}>
      <div>
        <div style={{
          fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase',
          letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: '0.25rem',
        }}>
          💼 Pending Earnings
        </div>
        <div className="d-flex align-items-baseline gap-2">
          <span style={{
            fontSize: '1.6rem', fontWeight: 800,
            fontFamily: 'var(--font-display)',
            background: 'var(--grad-brand)',
            backgroundClip: 'text', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>
            ₹{Number(inrValue).toLocaleString('en-IN')}
          </span>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            ~ {parseFloat(balanceEth).toFixed(6)} ETH
          </span>
        </div>
      </div>

      <Button
        variant="primary"
        className={`rounded-pill px-4 fw-bold btn-primary ${!hasBalance ? 'opacity-50' : ''}`}
        disabled={loading || !hasBalance}
        onClick={handleWithdraw}
        style={{ fontSize: '0.85rem', whiteSpace: 'nowrap' }}
      >
        {loading ? (
          <><span className="spinner-border spinner-border-sm me-2" style={{ width: '0.8rem', height: '0.8rem' }} /> Withdrawing...</>
        ) : (
          hasBalance ? 'Withdraw Funds 💸' : 'No Funds Yet'
        )}
      </Button>
    </div>
  );
};

export default Wallet;
