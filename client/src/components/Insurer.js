import React, { useEffect, useState } from 'react';
import 'bootstrap/dist/css/bootstrap.css';
import { Form, Button, Modal, Table, Dropdown, DropdownButton, Row, Col, Badge } from 'react-bootstrap';
import Web3 from 'web3';
import { Link } from 'react-router-dom'
import SimpleBarChart from './SimpleBarChart';
import Timeline from './Timeline';

const Insurer = ({ mediChain, account, ethValue }) => {
    const [insurer, setInsurer] = useState(null);
    const [patList, setPatList] = useState([]);
    const [policyList, setPolicyList] = useState([]);
    const [polName, setPolName] = useState('');
    const [polCoverValue, setPolCoverValue] = useState('');
    const [polDuration, setPolDuration] = useState('');
    const [polPremium, setPolPremium] = useState('');
    const [showRecord, setShowRecord] = useState(false);
    const [claimsIdList, setClaimsIdList] = useState([]);
    const [claimsList, setClaimsList] = useState([]);
    const [showRecordModal, setShowRecordModal] = useState(false);
    const [patientRecord, setPatientRecord] = useState(null);

    const getInsurerData = async () => {
        var insurer = await mediChain.methods.insurerInfo(account).call();
        setInsurer(insurer);
    }
    const getPolicyList = async () => {
        var pol = await mediChain.methods.getInsurerPolicyList(account).call();
        setPolicyList(pol)
    }
    const createPolicy = (e) => {
        e.preventDefault()
        mediChain.methods.createPolicy(polName, polCoverValue, polDuration, polPremium).send({ from: account }).on('transactionHash', (hash) => {
            return window.location.href = '/login'
        })
    }
    const handleCloseRecordModal = () => setShowRecordModal(false);
    const handleShowRecordModal = async (e, patient) => {
        var record = {}
        await fetch(`${process.env.REACT_APP_INFURA_DEDICATED_GATEWAY}/ipfs/${patient.record}`)
            .then(res => res.json())
            .then(data => record = data)
        await setPatientRecord(record);
        await setShowRecordModal(true);
    }
    const getPatientList = async () => {
        var pat = await mediChain.methods.getInsurerPatientList(account).call();
        let pt = [];
        for (let i = 0; i < pat.length; i++) {
            let patient = await mediChain.methods.patientInfo(pat[i]).call();
            pt = [...pt, patient]
        }
        setPatList(pt)
    }
    const getClaimsData = async () => {
        var claimsIdList = await mediChain.methods.getInsurerClaims(account).call();
        let cl = [];
        for (let i = claimsIdList.length - 1; i >= 0; i--) {
            let claim = await mediChain.methods.claims(claimsIdList[i]).call();
            let patient = await mediChain.methods.patientInfo(claim.patient).call();
            let doctor = await mediChain.methods.doctorInfo(claim.doctor).call();
            claim = { ...claim, id: claimsIdList[i], patientEmail: patient.email, doctorEmail: doctor.email, policyName: claim.policyName }
            cl = [...cl, claim];
        }
        setClaimsList(cl);
    }
    const approveClaim = async (e, claim) => {
        let value = claim.valueClaimed / ethValue;
        mediChain.methods.approveClaimsByInsurer(claim.id).send({ from: account, value: Web3.utils.toWei(value.toString(), 'Ether') }).on('transactionHash', (hash) => {
            return window.location.href = '/login'
        })
    }
    const rejectClaim = async (e, claim) => {
        mediChain.methods.rejectClaimsByInsurer(claim.id).send({ from: account }).on('transactionHash', (hash) => {
            return window.location.href = '/login'
        })
    }

    useEffect(() => {
        if (account === "") return window.location.href = '/login'
        if (!insurer) getInsurerData()
        if (policyList.length === 0) getPolicyList();
        if (patList.length === 0) getPatientList();
        if (claimsIdList.length === 0) getClaimsData();
    }, [insurer, patList, policyList, claimsIdList])


    if (!insurer) return <div className="text-center mt-5"><div className="spinner-border text-primary" role="status"></div></div>;

    return (
        <div className="fade-in">
            <div className="d-flex align-items-center justify-content-between mb-4">
                <h2 className="fw-bold text-primary">Insurer Dashboard</h2>
                <span className="text-muted small">Logged in as: {insurer.email}</span>
            </div>

            <Row className="mb-4">
                <Col md={4} className="mb-4 mb-md-0">
                    <div className="glass-card h-100">
                        <h4 className="mb-3 text-secondary">Create New Policy</h4>
                        <Form onSubmit={createPolicy}>
                            <Form.Group className='mb-3'>
                                <Form.Label className="text-muted fw-bold small">Policy Name</Form.Label>
                                <Form.Control required type="text" value={polName} onChange={(e) => setPolName(e.target.value)} placeholder='e.g. Gold Health Plan' className="form-control" />
                            </Form.Group>
                            <Form.Group className='mb-3'>
                                <Form.Label className="text-muted fw-bold small">Cover Value (INR)</Form.Label>
                                <Form.Control required type="number" value={polCoverValue} onChange={(e) => setPolCoverValue(e.target.value)} placeholder='500000' className="form-control" />
                            </Form.Group>
                            <Form.Group className='mb-3'>
                                <Form.Label className="text-muted fw-bold small">Yearly Premium (INR)</Form.Label>
                                <Form.Control required type="number" value={polPremium} onChange={(e) => setPolPremium(e.target.value)} placeholder='12000' className="form-control" />
                            </Form.Group>
                            <Form.Group className='mb-3'>
                                <Form.Label className="text-muted fw-bold small">Duration (Years)</Form.Label>
                                <Form.Control required type="number" max={3} min={1} value={polDuration} onChange={(e) => setPolDuration(e.target.value)} placeholder='1' className="form-control" />
                            </Form.Group>
                            <Button type="submit" variant="primary" className="w-100 rounded-pill btn-primary mt-2">
                                Launch Policy
                            </Button>
                        </Form>
                    </div>
                </Col>

                <Col md={8}>
                    <div className="glass-card h-100">
                        <h4 className="mb-3 text-secondary">Stats Overview</h4>
                        <Row className="g-3">
                            <Col sm={6}>
                                <div className="p-3 bg-light rounded text-center border h-100">
                                    <h2 className="text-primary fw-bold mb-0">{policyList.length}</h2>
                                    <small className="text-muted">Total Active Policies</small>
                                </div>
                            </Col>
                            <Col sm={6}>
                                <div className="p-3 bg-light rounded text-center border h-100">
                                    <h2 className="text-info fw-bold mb-0">{patList.length}</h2>
                                    <small className="text-muted">Total Customers</small>
                                </div>
                            </Col>
                        </Row>
                        <div className="mt-4">
                            <SimpleBarChart
                                title="Claims Overview"
                                color="bg-warning"
                                data={[
                                    { label: 'Pending', value: claimsList.filter(c => !c.approved && !c.rejected).length },
                                    { label: 'Approved', value: claimsList.filter(c => c.approved).length },
                                    { label: 'Rejected', value: claimsList.filter(c => c.rejected).length },
                                ]}
                            />
                        </div>

                        <h5 className="mt-4 mb-3 fs-6 text-muted text-uppercase ls-1">Your Policies</h5>
                        <div className="table-responsive" style={{ maxHeight: '300px' }}>
                            <Table className="custom-table align-middle" size="sm">
                                <thead>
                                    <tr>
                                        <th>Name</th>
                                        <th>Cover</th>
                                        <th>Premium</th>
                                        <th>Duration</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {policyList.length > 0 ?
                                        policyList.map((pol, idx) => (
                                            <tr key={idx}>
                                                <td>{pol.name}</td>
                                                <td>INR {pol.coverValue}</td>
                                                <td>INR {pol.premium}</td>
                                                <td>{pol.timePeriod} Yr</td>
                                            </tr>
                                        ))
                                        : <tr><td colSpan="4" className="text-center text-muted">No policies created</td></tr>
                                    }
                                </tbody>
                            </Table>
                        </div>
                    </div>
                </Col>
            </Row>

            <Row className="mb-4">
                <Col md={12}>
                    <div className="glass-card">
                        <h4 className="mb-3 text-secondary">Claims Management</h4>
                        <div className="table-responsive">
                            <Table className="custom-table align-middle">
                                <thead>
                                    <tr>
                                        <th>Patient</th>
                                        <th>Doctor</th>
                                        <th>Policy</th>
                                        <th>Claim Value</th>
                                        <th>Status</th>
                                        <th>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {claimsList.length > 0 ?
                                        claimsList.map((claim, idx) => (
                                            <tr key={idx}>
                                                <td><small>{claim.patientEmail}</small></td>
                                                <td><small>{claim.doctorEmail}</small></td>
                                                <td>{claim.policyName}</td>
                                                <td><strong>INR {claim.valueClaimed}</strong></td>
                                                <td>
                                                    {!claim.approved && !claim.rejected ? <Badge bg="warning" text="dark">Pending</Badge> :
                                                        !claim.approved ? <Badge bg="danger">Rejected</Badge> :
                                                            <Badge bg="success">Approved</Badge>}
                                                </td>
                                                <td>
                                                    {!claim.approved && !claim.rejected ?
                                                        <div className="d-flex gap-2">
                                                            <Button onClick={(e) => approveClaim(e, claim)} variant="success" size="sm" className="rounded-pill px-3">
                                                                Approve
                                                            </Button>
                                                            <Button onClick={(e) => rejectClaim(e, claim)} variant="danger" size="sm" className="rounded-pill px-3">
                                                                Reject
                                                            </Button>
                                                        </div>
                                                        : <span className="text-muted small">Processed</span>
                                                    }
                                                </td>
                                            </tr>
                                        ))
                                        : <tr><td colSpan="6" className="text-center text-muted">No claims pending</td></tr>
                                    }
                                </tbody>
                            </Table>
                        </div>
                    </div>
                </Col>
            </Row>

            <div className="glass-card">
                <h4 className="mb-3 text-secondary">Customer Database</h4>
                <div className="table-responsive">
                    <Table className="custom-table align-middle">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Email</th>
                                <th>Current Policy</th>
                                <th>Total Spent</th>
                                <th>Records</th>
                            </tr>
                        </thead>
                        <tbody>
                            {patList.length > 0 ?
                                patList.map((pat, idx) => (
                                    <tr key={idx}>
                                        <td>{pat.name}</td>
                                        <td>{pat.email}</td>
                                        <td>{pat.policyActive ? <Badge bg="info">{pat.policy.name}</Badge> : <span className="text-muted">-</span>}</td>
                                        <td>
                                            <span className="fw-bold text-success">
                                                {claimsList
                                                    .filter(c => c.patientEmail === pat.email && c.approved)
                                                    .reduce((total, c) => total + Number(c.valueClaimed), 0)
                                                } INR
                                            </span>
                                            <br />
                                            <small className="text-muted">
                                                ~ {(claimsList
                                                    .filter(c => c.patientEmail === pat.email && c.approved)
                                                    .reduce((total, c) => total + Number(c.valueClaimed), 0) / ethValue).toFixed(5)
                                                } ETH
                                            </small>
                                        </td>
                                        <td><Button variant="outline-primary" size="sm" className="rounded-pill" onClick={(e) => handleShowRecordModal(e, pat)}>View History</Button></td>
                                    </tr>
                                ))
                                : <tr><td colSpan="4" className="text-center text-muted">No customers found</td></tr>
                            }
                        </tbody>
                    </Table>
                </div>
            </div>

            {patientRecord && (
                <Modal size="xl" centered show={showRecordModal} onHide={handleCloseRecordModal} contentClassName="glass-card border-0">
                    <Modal.Header closeButton className="border-0">
                        <Modal.Title className="text-primary fw-bold">Records for: {patientRecord.name}</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <div className="d-flex justify-content-between align-items-center mb-3 border-bottom pb-2">
                            <h5 className="text-secondary mb-0">Diagnosis & Treatment History</h5>
                            <Button variant="outline-dark" size="sm" className="rounded-pill" onClick={() => window.print()}>
                                Print Report 🖨️
                            </Button>
                        </div>
                        <Timeline treatments={patientRecord.treatments} />
                    </Modal.Body>
                </Modal>
            )}
        </div>
    )
}

export default Insurer
