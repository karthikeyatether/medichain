import React, { useState, useEffect } from 'react';
import { Button, Badge, Card } from 'react-bootstrap';
import { useToast } from './ToastContext';
import Web3 from 'web3';

const Wallet = ({ mediChain, account, ethValue }) => {
    const [balanceEth, setBalanceEth] = useState("0");
    const [loading, setLoading] = useState(false);
    const addToast = useToast();

    const getBalance = async () => {
        if (!mediChain || !account) return;
        try {
            const balWei = await mediChain.methods.pendingWithdrawals(account).call();
            const balEth = Web3.utils.fromWei(balWei, 'ether');
            setBalanceEth(balEth);
        } catch (error) {
            console.error("Error fetching balance:", error);
        }
    };

    const handleWithdraw = async () => {
        setLoading(true);
        try {
            await mediChain.methods.withdraw().send({ from: account });
            addToast("Withdrawal successful!", "success");
            getBalance();
        } catch (error) {
            console.error("Withdrawal error:", error);
            addToast("Withdrawal failed.", "danger");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        getBalance();
    }, [mediChain, account]);

    return (
        <Card className="glass-card mb-4 border-primary border-opacity-25 shadow-sm">
            <Card.Body className="d-flex align-items-center justify-content-between py-3">
                <div>
                    <h6 className="text-uppercase text-muted fw-bold mb-1 small ls-1">Pending Earnings</h6>
                    <div className="d-flex align-items-baseline gap-2">
                        <h3 className="mb-0 fw-bold text-primary">{(parseFloat(balanceEth) * ethValue).toFixed(0)} INR</h3>
                        <span className="text-muted small">
                            ~ {parseFloat(balanceEth).toFixed(6)} ETH
                        </span>
                    </div>
                </div>
                <Button
                    variant="primary"
                    className="rounded-pill px-4 fw-bold"
                    disabled={loading || balanceEth === "0" || balanceEth === "0."}
                    onClick={handleWithdraw}
                >
                    {loading ? 'Processing...' : 'Withdraw Funds 💸'}
                </Button>
            </Card.Body>
        </Card>
    );
};

export default Wallet;
