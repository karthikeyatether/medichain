import React, { useState } from 'react';
import { Container, Row, Col, Form, Button, Alert } from 'react-bootstrap';
import { useNavigate, Link } from 'react-router-dom';

const Register = ({ mediChain, setToken, setAccount, connectWallet, account }) => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Form States
    const [role, setRole] = useState("1");
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [age, setAge] = useState("");

    const handleRegister = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            if (!mediChain) throw new Error("Blockchain not connected");

            // Smart Contract: register(string _name, uint _age, uint _designation, string _email, string _hash)
            // For Patient (_designation 1), _hash must be > 0 length. usage: "init"
            const hash = role === "1" ? "init" : "";

            await mediChain.methods.register(name, parseInt(age), role, email, hash).send({ from: account });
            // Add Insurer logic if applicable in contract

            // Auto login after register
            setToken(role);
            localStorage.setItem('token', role);
            localStorage.setItem('account', account);
            navigate('/dashboard');

        } catch (err) {
            console.error(err);
            setError("Registration failed. Ensure you are connected and transaction is approved.");
        } finally {
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
                    <Col md={8} lg={6} className="auth-card">
                        <div className="glass-card">
                            <div className="text-center mb-2">
                                <h2 className="fw-bold text-primary">Create Account</h2>
                                <p className="text-muted small mb-0">Join the secure healthcare network</p>
                            </div>

                            {error && <Alert variant="danger" className="border-0 shadow-sm mb-3">{error}</Alert>}

                            {!account ? (
                                <div className="text-center mt-3">
                                    <p className="mb-3 text-muted">Connect wallet to verify identity.</p>
                                    <Button onClick={connectWallet} variant="primary" size="lg" className="w-100 rounded-pill shadow-sm">
                                        Connect Metamask 🦊
                                    </Button>
                                </div>
                            ) : (
                                <Form onSubmit={handleRegister}>
                                    <Form.Group className="form-group">
                                        <Form.Label className="form-label">I am a</Form.Label>
                                        <Form.Select
                                            className="form-control"
                                            value={role}
                                            onChange={(e) => setRole(e.target.value)}
                                        >
                                            <option value="1">Patient</option>
                                            <option value="2">Doctor</option>
                                        </Form.Select>
                                    </Form.Group>

                                    <Form.Group className="form-group">
                                        <Form.Label className="form-label">Full Name</Form.Label>
                                        <Form.Control
                                            type="text"
                                            placeholder="Enter your name"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            required
                                            className="form-control"
                                        />
                                    </Form.Group>

                                    <Form.Group className="form-group">
                                        <Form.Label className="form-label">Email Address</Form.Label>
                                        <Form.Control
                                            type="email"
                                            placeholder="Enter your email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            required
                                            className="form-control"
                                        />
                                    </Form.Group>

                                    <Form.Group className="form-group">
                                        <Form.Label className="form-label">Age</Form.Label>
                                        <Form.Control
                                            type="number"
                                            placeholder="Enter your age"
                                            value={age}
                                            onChange={(e) => setAge(e.target.value)}
                                            required
                                            className="form-control"
                                        />
                                    </Form.Group>

                                    <Button
                                        type="submit"
                                        variant="primary"
                                        disabled={loading}
                                        className="w-100 rounded-pill py-3 fw-bold mt-2 shadow-md"
                                    >
                                        {loading ? 'Creating Identity...' : 'Register Account'}
                                    </Button>
                                </Form>
                            )}

                            <div className="text-center mt-4 pt-3 border-top">
                                <small className="text-muted">
                                    Already have an account? <Link to="/login" className="fw-bold text-secondary">Login Here</Link>
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