import React, { useState } from 'react';
import { Container, Card, Form, Button, Alert, Row, Col } from 'react-bootstrap';
import { useNavigate, Link } from 'react-router-dom';

const Login = ({ mediChain, setToken, setAccount, connectWallet, account }) => {
    const [role, setRole] = useState("1");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const checkUserRole = async () => {
        if (!mediChain || !account) return;
        setLoading(true);
        try {
            const normalizedAccount = account.toLowerCase();
            const [patient, doctor, insurer] = await Promise.all([
                mediChain.methods.patientInfo(normalizedAccount).call().catch(() => null),
                mediChain.methods.doctorInfo(normalizedAccount).call().catch(() => null),
                mediChain.methods.insurerInfo(normalizedAccount).call().catch(() => null)
            ]);

            if (patient && patient.exists) return loginUser("1");
            if (doctor && doctor.exists) return loginUser("2");
            if (insurer && insurer.exists) return loginUser("3");

            // If no role found, stay on login page
            setLoading(false);
        } catch (error) {
            console.error(error);
            setError("Error verifying role. Please check console.");
            setLoading(false);
        }
    };

    const loginUser = (userRole) => {
        setToken(userRole);
        localStorage.setItem('token', userRole);
        localStorage.setItem('account', account);
        navigate('/dashboard');
    };

    React.useEffect(() => {
        if (mediChain && account) {
            checkUserRole();
        }
    }, [mediChain, account]);

    const handleLogin = async (e) => {
        e.preventDefault();
        if (!mediChain || !account) return;
        setLoading(true);
        setError('');
        try {
            let exists = false;
            const normalizedAccount = account.toLowerCase();
            if (role === "1") {
                const res = await mediChain.methods.patientInfo(normalizedAccount).call().catch(() => null);
                exists = res && res.exists;
            } else if (role === "2") {
                const res = await mediChain.methods.doctorInfo(normalizedAccount).call().catch(() => null);
                exists = res && res.exists;
            } else if (role === "3") {
                const res = await mediChain.methods.insurerInfo(normalizedAccount).call().catch(() => null);
                exists = res && res.exists;
            }

            if (exists) {
                loginUser(role);
            } else {
                setError(`Your wallet is not registered as a ${role === "1" ? "Patient" : role === "2" ? "Doctor" : "Insurer"}.`);
                setLoading(false);
            }
        } catch (err) {
            console.error("LOGIN ERROR STACK:", err);
            console.log("LOGIN MEDICHAIN CONTRACT:", mediChain);
            console.log("LOGIN ACCOUNT:", account);
            setError("Login failed. Verify your connection. See console for details.");
            setLoading(false);
        }
    };

    return (
        <div className="auth-wrapper overflow-hidden position-relative">
            <div className="blob blob-1"></div>
            <div className="blob blob-2"></div>
            <div className="blob blob-3"></div>
            <Container className="position-relative" style={{ zIndex: 2 }}>
                <Row className="justify-content-center">
                    <Col md={8} lg={5} className="auth-card">
                        <div className="glass-card">
                            <div className="text-center mb-2">
                                <h2 className="fw-bold text-primary">Welcome Back</h2>
                                <p className="text-muted small mb-0">Access your secure medical portal</p>
                            </div>

                            {error && <Alert variant="danger" className="border-0 shadow-sm">{error}</Alert>}

                            {!account ? (
                                <div className="text-center mt-3">
                                    <p className="mb-3 text-muted">Connect your wallet to access records.</p>
                                    <Button onClick={connectWallet} variant="primary" size="lg" className="w-100 rounded-pill shadow-sm">
                                        Connect Metamask 🦊
                                    </Button>
                                </div>
                            ) : loading ? (
                                <div className="text-center py-5">
                                    <div className="spinner-border text-primary mb-3" role="status"></div>
                                    <p>Verifying wallet role...</p>
                                </div>
                            ) : (
                                <Form onSubmit={handleLogin}>
                                    <Form.Group className="form-group mb-4">
                                        <Form.Label className="form-label">Select Your Role</Form.Label>
                                        <Form.Select
                                            className="form-control"
                                            value={role}
                                            onChange={(e) => setRole(e.target.value)}
                                            style={{ height: 'auto', padding: '0.75rem 1rem' }}
                                        >
                                            <option value="1">Patient</option>
                                            <option value="2">Doctor</option>
                                            <option value="3">Insurer</option>
                                        </Form.Select>
                                    </Form.Group>

                                    <Button
                                        type="submit"
                                        variant="primary"
                                        disabled={loading}
                                        className="w-100 rounded-pill py-3 fw-bold shadow-md"
                                    >
                                        Login to Dashboard
                                    </Button>
                                </Form>
                            )}

                            <div className="text-center mt-4 pt-3 border-top">
                                <small className="text-muted">
                                    New to MediChain? <Link to="/register" className="fw-bold text-secondary">Create an Account</Link>
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