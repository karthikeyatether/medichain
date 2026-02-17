import React from 'react';
import { Container, Row, Col, Card, Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';

const Home = () => {
    return (
        <div className="home-wrapper">
            {/* Hero Section */}
            <section className="hero-section">
                <Container>
                    <Row className="align-items-center">
                        <Col lg={6} className="mb-5 mb-lg-0">
                            <div className="hero-content text-start">
                                <h1 className="hero-title animate-title">
                                    Secure Medical Records on the
                                    <span className="text-gradient"> Blockchain</span>
                                </h1>
                                <p className="hero-subtitle">
                                    Control your health data with the power of decentralization.
                                    Secure, transparent, and always accessible to you and your trusted doctors.
                                </p>
                                <div className="d-flex gap-3">
                                    <Button as={Link} to="/register" variant="primary" size="lg" className="rounded-pill px-5 shadow-lg">
                                        Get Started
                                    </Button>
                                    <Button as={Link} to="/login" variant="outline-primary" size="lg" className="rounded-pill px-5">
                                        Login
                                    </Button>
                                </div>
                            </div>
                        </Col>
                        <Col lg={6}>
                            <div className="hero-visual glass-card p-4 position-relative">
                                {/* Abstract Visual Representation using CSS shapes/gradients if no image */}
                                <div style={{
                                    background: 'linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%)',
                                    borderRadius: '20px',
                                    height: '400px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    position: 'relative',
                                    overflow: 'hidden'
                                }}>
                                    <div style={{
                                        position: 'absolute',
                                        width: '200px',
                                        height: '200px',
                                        background: 'rgba(59, 130, 246, 0.2)',
                                        borderRadius: '50%',
                                        top: '-50px',
                                        right: '-50px',
                                        filter: 'blur(40px)'
                                    }}></div>
                                    <div style={{
                                        position: 'absolute',
                                        width: '150px',
                                        height: '150px',
                                        background: 'rgba(6, 182, 212, 0.2)',
                                        borderRadius: '50%',
                                        bottom: '-20px',
                                        left: '-20px',
                                        filter: 'blur(30px)'
                                    }}></div>
                                    <div className="text-center p-4" style={{ zIndex: 2 }}>
                                        <h3 className="mb-3 text-primary">MediChain Architecture</h3>
                                        <div className="d-flex justify-content-center gap-3 mt-4">
                                            <div className="p-3 bg-white rounded shadow-sm">
                                                <span style={{ fontSize: '2rem' }}>🏥</span>
                                                <p className="mb-0 mt-2 small fw-bold">Doctor</p>
                                            </div>
                                            <div className="p-3 bg-white rounded shadow-sm">
                                                <span style={{ fontSize: '2rem' }}>👤</span>
                                                <p className="mb-0 mt-2 small fw-bold">Patient</p>
                                            </div>
                                            <div className="p-3 bg-white rounded shadow-sm">
                                                <span style={{ fontSize: '2rem' }}>🛡️</span>
                                                <p className="mb-0 mt-2 small fw-bold">Insurer</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </Col>
                    </Row>
                </Container>
            </section>

            {/* Features Section */}
            <section className="section bg-white">
                <Container>
                    <div className="text-center mb-5">
                        <h2 className="display-5 fw-bold text-primary">Why Choose MediChain?</h2>
                        <p className="text-muted lead">Built with cutting-edge technology for maximum security and efficiency.</p>
                    </div>
                    <Row>
                        <Col md={4} className="mb-4">
                            <Card className="h-100 border-0 shadow-sm hover-card bg-light">
                                <Card.Body className="p-4 text-center">
                                    <div className="mb-3">
                                        <span style={{ fontSize: '3rem' }}>🔒</span>
                                    </div>
                                    <Card.Title as="h4" className="mb-3">Unmatched Security</Card.Title>
                                    <Card.Text className="text-muted">
                                        Your medical records are encrypted and stored securely, protected by the Ethereum blockchain.
                                    </Card.Text>
                                </Card.Body>
                            </Card>
                        </Col>
                        <Col md={4} className="mb-4">
                            <Card className="h-100 border-0 shadow-sm hover-card bg-light">
                                <Card.Body className="p-4 text-center">
                                    <div className="mb-3">
                                        <span style={{ fontSize: '3rem' }}>⚡</span>
                                    </div>
                                    <Card.Title as="h4" className="mb-3">Instant Access</Card.Title>
                                    <Card.Text className="text-muted">
                                        Grant access to doctors instantly from anywhere in the world without paperwork delays.
                                    </Card.Text>
                                </Card.Body>
                            </Card>
                        </Col>
                        <Col md={4} className="mb-4">
                            <Card className="h-100 border-0 shadow-sm hover-card bg-light">
                                <Card.Body className="p-4 text-center">
                                    <div className="mb-3">
                                        <span style={{ fontSize: '3rem' }}>👁️</span>
                                    </div>
                                    <Card.Title as="h4" className="mb-3">Total Transparency</Card.Title>
                                    <Card.Text className="text-muted">
                                        Every access and transaction is recorded on the blockchain, ensuring complete accountability.
                                    </Card.Text>
                                </Card.Body>
                            </Card>
                        </Col>
                    </Row>
                </Container>
            </section>
        </div>
    )
}

export default Home