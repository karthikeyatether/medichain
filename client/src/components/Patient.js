import React, { useEffect, useState } from 'react';
import 'bootstrap/dist/css/bootstrap.css';
import { Form, Button, Table, Modal, Row, Col, Badge, Container } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import Timeline from './Timeline';
import Web3 from 'web3';
import Wallet from './Wallet';
import { QRCodeCanvas } from 'qrcode.react';

const Patient = ({ mediChain, account, ethValue }) => {
  const [patient, setPatient] = useState(null);
  const [docEmail, setDocEmail] = useState("");
  const [docList, setDocList] = useState([]);
  const [insurer, setInsurer] = useState(null);
  const [insurerList, setInsurerList] = useState([]);
  const [buyFromInsurer, setBuyFromInsurer] = useState(null);
  const [policyList, setPolicyList] = useState([]);
  const [buyPolicyIndex, setBuyPolicyIndex] = useState(null);
  const [transactionsList, setTransactionsList] = useState([]);
  const [showRecordModal, setShowRecordModal] = useState(false);
  const [patientRecord, setPatientRecord] = useState(null);

  const handleDataError = (err) => {
    console.error("Dashboard failed to load data:", err);
    localStorage.removeItem("token");
    window.location.href = '/login';
  }

  const getPatientData = async () => {
    var patient = await mediChain.methods.patientInfo(account).call();
    var records = await mediChain.methods.getPatientRecords(account).call();
    setPatient({ ...patient, records });
  }
  const giveAccess = (e) => {
    e.preventDefault();
    mediChain.methods.permitAccess(docEmail).send({ from: account }).on('transactionHash', (hash) => {
      return window.location.href = '/login'
    })
  }
  const revokeAccess = async (email) => {
    var addr = await mediChain.methods.emailToAddress(email).call();
    mediChain.methods.revokeAccess(addr).send({ from: account }).on('transactionHash', (hash) => {
      return window.location.href = '/login';
    });
  }
  const getDoctorAccessList = async () => {
    var doc = await mediChain.methods.getPatientDoctorList(account).call();
    let dt = [];
    for (let i = 0; i < doc.length; i++) {
      let doctor = await mediChain.methods.doctorInfo(doc[i]).call();
      dt = [...dt, doctor]
    }
    setDocList(dt)
  }
  const getInsurer = async () => {
    var insurer = await mediChain.methods.insurerInfo(patient.policy.insurer).call();
    setInsurer(insurer)
  }
  const getInsurerList = async () => {
    var ins = await mediChain.methods.getAllInsurersAddress().call();
    let it = [];
    for (let i = 0; i < ins.length; i++) {
      let insurer = await mediChain.methods.insurerInfo(ins[i]).call();
      insurer = { ...insurer, account: ins[i] };
      it = [...it, insurer]
    }
    setInsurerList(it)
  }
  const getPolicyList = async () => {
    try {
      var policyList = await mediChain.methods.getInsurerPolicyList(buyFromInsurer).call()
      setPolicyList(policyList);
    } catch (err) { handleDataError(err) }
  }
  const purchasePolicy = async (e) => {
    e.preventDefault();
    var value = policyList[buyPolicyIndex].premium / ethValue;
    mediChain.methods.buyPolicy(parseInt(policyList[buyPolicyIndex].id)).send({ from: account, value: Web3.utils.toWei(value.toString(), 'Ether') }).on('transactionHash', (hash) => {
      return window.location.href = '/login'
    })
  }
  const getTransactionsList = async () => {
    try {
      var transactionsIdList = await mediChain.methods.getPatientTransactions(account).call();
      let tr = [];
      for (let i = transactionsIdList.length - 1; i >= 0; i--) {
        let transaction = await mediChain.methods.transactions(transactionsIdList[i]).call();
        let doctor = await mediChain.methods.doctorInfo(transaction.receiver).call();
        transaction = { ...transaction, id: transactionsIdList[i], doctorEmail: doctor.email }
        tr = [...tr, transaction];
      }
      setTransactionsList(tr);
    } catch (err) { handleDataError(err) }
  }
  const settlePayment = async (e, transaction) => {
    let value = transaction.value / ethValue;
    mediChain.methods.settleTransactionsByPatient(transaction.id).send({ from: account, value: Web3.utils.toWei(value.toString(), 'Ether') }).on('transactionHash', (hash) => {
      return window.location.href = '/login'
    })
  }

  const handleCloseRecordModal = () => setShowRecordModal(false);
  const handleShowRecordModal = async () => {
    let combinedTreatments = [];
    if (patient.records && patient.records.length > 0) {
      await Promise.all(patient.records.map(async (hash) => {
        if (!hash) return;
        try {
          if (hash.startsWith("QmMockHash")) {
            const existingRecords = JSON.parse(localStorage.getItem('mock_ipfs_records') || '{}');
            if (existingRecords[hash] && existingRecords[hash].treatments) {
              combinedTreatments = [...combinedTreatments, ...existingRecords[hash].treatments];
            }
          } else {
            const res = await fetch(`${process.env.REACT_APP_INFURA_DEDICATED_GATEWAY}/ipfs/${hash}`);
            if (res.ok) {
              const data = await res.json();
              if (data && data.treatments) {
                combinedTreatments = [...combinedTreatments, ...data.treatments];
              }
            }
          }
        } catch (e) {
          console.error("Error fetching record:", e);
        }
      }));
    }
    setPatientRecord({
      name: patient.name,
      age: patient.age,
      address: account,
      treatments: combinedTreatments.reverse()
    });
    setShowRecordModal(true);
  }

  useEffect(() => {
    if (account === "") {
      window.location.href = '/login';
      return;
    }
    if (!mediChain) return;

    getPatientData();
    getDoctorAccessList();
    getInsurerList();
    getTransactionsList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [account, mediChain]);

  useEffect(() => {
    if (!mediChain) return;
    if (patient && patient.policyActive) {
      getInsurer();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patient?.policyActive, mediChain]);

  useEffect(() => {
    if (!mediChain) return;
    if (buyFromInsurer) {
      getPolicyList();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [buyFromInsurer, mediChain]);

  if (!patient) return <div className="text-center mt-5"><div className="spinner-border text-primary" role="status"></div></div>;

  return (
    <div className="fade-in">
      <h2 className="mb-4 fw-bold text-primary">Patient Dashboard</h2>
      <Wallet mediChain={mediChain} account={account} ethValue={ethValue} />
      <Row className="mb-4">
        <Col md={6} lg={4}>
          <div className="glass-card h-100">
            <h4 className="mb-3 text-secondary">My Profile</h4>
            <div className="mb-2"><strong className="text-muted">Name:</strong> {patient.name}</div>
            <div className="mb-2"><strong className="text-muted">Email:</strong> {patient.email}</div>
            <div className="mb-2"><strong className="text-muted">Age:</strong> {patient.age}</div>
            <div className="mb-4 text-truncate"><strong className="text-muted">Account:</strong> {account}</div>
            <div className="text-center mb-4 p-3 bg-white rounded-3 shadow-sm d-inline-block border">
              <QRCodeCanvas value={account} size={120} level={"H"} />
              <div className="mt-2 small text-muted font-weight-bold">Digital ID (Web3)</div>
            </div>
            <Button variant="primary" className="w-100 rounded-pill btn-primary" onClick={handleShowRecordModal}>
              View Medical Records 📂
            </Button>
          </div>
        </Col>

        <Col md={6} lg={8}>
          <div className="glass-card h-100">
            <h4 className="mb-3 text-secondary">Manage Doctor Access</h4>
            <Form onSubmit={giveAccess} className="d-flex mb-4 gap-2">
              <Form.Control
                required
                type="email"
                value={docEmail}
                onChange={(e) => setDocEmail(e.target.value)}
                placeholder="Enter doctor's email to grant access"
                className="form-control"
              />
              <Button variant="outline-primary" type="submit" className="px-4 rounded-pill">
                Grant Access
              </Button>
            </Form>

            <h5 className="mt-4 mb-3 fs-6 text-uppercase text-muted ls-1">Authorized Doctors</h5>
            <div className="table-responsive">
              <Table className="custom-table align-middle">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Doctor Name</th>
                    <th>Doctor Email</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {docList.length > 0 ?
                    docList.map((doc, idx) => (
                      <tr key={idx}>
                        <td>{idx + 1}</td>
                        <td>Dr. {doc.name}</td>
                        <td>{doc.email}</td>
                        <td><Button variant="outline-danger" size="sm" className="rounded-pill" onClick={() => revokeAccess(doc.email)}>Revoke Access</Button></td>
                      </tr>
                    ))
                    : <tr><td colSpan="4" className="text-center text-muted">No doctors have access</td></tr>
                  }
                </tbody>
              </Table>
            </div>
          </div>
        </Col>
      </Row>

      <Row className="mb-4">
        <Col md={6}>
          <div className="glass-card h-100">
            {patient.policyActive && insurer ? (
              <>
                <h4 className="mb-3 text-secondary">Insurance Details</h4>
                <div className="p-3 bg-light rounded-3 mb-3 border">
                  <div className="d-flex justify-content-between mb-2">
                    <span className="text-muted">Provider:</span>
                    <span className="fw-bold">{insurer.name}</span>
                  </div>
                  <div className="d-flex justify-content-between mb-2">
                    <span className="text-muted">Policy:</span>
                    <span className="fw-bold">{patient.policy.name}</span>
                  </div>
                  <div className="d-flex justify-content-between mb-2">
                    <span className="text-muted">Cover Value:</span>
                    <span className="text-success fw-bold">INR {patient.policy.coverValue}</span>
                  </div>
                  <div className="d-flex justify-content-between mb-2">
                    <span className="text-muted">Premium:</span>
                    <span>
                      INR {patient.policy.premium}/year<br />
                      <small className="text-muted">~ {(patient.policy.premium / ethValue).toFixed(5)} ETH</small>
                    </span>
                  </div>
                  <div className="d-flex justify-content-between pt-2 border-top mt-2">
                    <span className="text-muted">Expiry:</span>
                    <span className={`fw-bold ${Number(patient.policyExpiry) * 1000 < Date.now() ? 'text-danger' : 'text-primary'}`}>
                      {new Date(Number(patient.policyExpiry) * 1000).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <div className="text-end text-muted small">
                  {Number(patient.policyExpiry) * 1000 < Date.now() ?
                    <Badge bg="danger" pill className="mb-1">Expired</Badge> :
                    <Badge bg="success" pill className="mb-1">Active</Badge>
                  }
                  <br />
                  Duration: {patient.policy.timePeriod} Year{patient.policy.timePeriod > 1 ? 's' : ''}
                </div>
              </>
            ) : (
              <>
                <h4 className="mb-3 text-secondary">Buy Insurance</h4>
                <Form onSubmit={purchasePolicy}>
                  <Form.Group className='mb-3'>
                    <Form.Label className="form-label">Select Provider</Form.Label>
                    <Form.Select className="form-control" onChange={(e) => {
                      if (e.target.value !== "Choose Provider") {
                        setBuyFromInsurer(e.target.value)
                      } else {
                        setBuyFromInsurer(null)
                      }
                    }}>
                      <option>Choose Provider</option>
                      {insurerList.map((ins, idx) => <option key={idx} value={ins.account}>{ins.name}</option>)}
                    </Form.Select>
                  </Form.Group>

                  <Form.Group className='mb-3'>
                    <Form.Label className="form-label">Select Policy</Form.Label>
                    <Form.Select className="form-control" onChange={(e) => setBuyPolicyIndex(e.target.value)}>
                      <option>Choose Policy</option>
                      {policyList.map((pol, idx) => <option key={idx} value={idx}>{pol.name}</option>)}
                    </Form.Select>
                  </Form.Group>

                  {policyList[buyPolicyIndex] && (
                    <div className="alert alert-info">
                      <small>
                        <strong>{policyList[buyPolicyIndex].name}</strong><br />
                        Cover: INR {policyList[buyPolicyIndex].coverValue} | Premium: INR {policyList[buyPolicyIndex].premium} (~ {(policyList[buyPolicyIndex].premium / ethValue).toFixed(5)} ETH)
                      </small>
                    </div>
                  )}

                  <Button variant="primary" type="submit" className="w-100 rounded-pill btn-primary" disabled={!policyList[buyPolicyIndex]}>
                    Purchase Policy
                  </Button>
                </Form>
              </>
            )}
          </div>
        </Col>

        <Col md={6}>
          <div className="glass-card h-100">
            <h4 className="mb-3 text-secondary">Transaction History</h4>
            <div className="table-responsive">
              <Table className="custom-table align-middle">
                <thead>
                  <tr>
                    <th>Doctor</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {transactionsList.length > 0 ?
                    transactionsList.map((transaction, idx) => (
                      <tr key={idx}>
                        <td><small>{transaction.doctorEmail}</small></td>
                        <td>
                          <strong>{transaction.value} INR</strong><br />
                          <small className="text-muted">~ {(transaction.value / ethValue).toFixed(5)} ETH</small>
                        </td>
                        <td>
                          {transaction.settled ?
                            <Badge bg="success" pill>Settled</Badge> :
                            <Badge bg="warning" text="dark" pill>Pending</Badge>
                          }
                        </td>
                        <td>
                          {!transaction.settled ?
                            <Button variant="primary" size="sm" className="rounded-pill btn-primary" onClick={(e) => settlePayment(e, transaction)}>Pay</Button>
                            : <Button variant="secondary" size="sm" className="rounded-pill" disabled>Paid</Button>
                          }
                        </td>
                      </tr>
                    ))
                    : <tr><td colSpan="4" className="text-center text-muted">No transactions found</td></tr>
                  }
                </tbody>
              </Table>
            </div>
          </div>
        </Col>
      </Row>

      {patientRecord && (
        <Modal id="modal" size="xl" centered show={showRecordModal} onHide={handleCloseRecordModal} contentClassName="glass-card border-0">
          <Modal.Header closeButton className="border-0">
            <Modal.Title className="text-primary fw-bold">Medical Records</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Row className="mb-4">
              <Col md={3}><strong className="text-muted">Name:</strong> {patientRecord.name}</Col>
              <Col md={3}><strong className="text-muted">Age:</strong> {patientRecord.age}</Col>
              <Col md={6}><strong className="text-muted">Address:</strong> {patientRecord.address}</Col>
            </Row>

            <div className="d-flex justify-content-between align-items-center mb-3 text-secondary border-bottom pb-2">
              <h5 className="mb-0">Treatment Timeline</h5>
              <Button variant="outline-dark" size="sm" className="rounded-pill" onClick={() => window.print()}>
                Print Report 🖨️
              </Button>
            </div>

            <Timeline treatments={patientRecord.treatments} />
          </Modal.Body>
          <Modal.Footer className="border-0">
            <Button variant="secondary" onClick={handleCloseRecordModal} className="rounded-pill">Close</Button>
          </Modal.Footer>
        </Modal>
      )}
    </div>
  )
}

export default Patient
