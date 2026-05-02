import React, { useEffect, useState } from 'react';
import 'bootstrap/dist/css/bootstrap.css';
import { Form, Button, Table, Modal, Row, Col, Badge, ProgressBar } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import Timeline from './Timeline';
import Web3 from 'web3';

import { QRCodeCanvas } from 'qrcode.react';
import { useToast } from './ToastContext';
import { useWeb3 } from '../Web3Context';
import CryptoJS from 'crypto-js';

const SECRET_KEY = process.env.REACT_APP_ENCRYPTION_SECRET || 'medichain-secure-key-2026';

const Patient = () => {
  const { mediChain, account, ethValue } = useWeb3();
  const addToast = useToast();
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
  // Confirmation modals
  const [showPolicyConfirm, setShowPolicyConfirm] = useState(false);
  const [showRevokeConfirm, setShowRevokeConfirm] = useState(false);
  const [revokeTarget, setRevokeTarget] = useState(null);
  // Renew policy
  const [showRenewModal, setShowRenewModal] = useState(false);
  const [renewInsurer, setRenewInsurer] = useState(null);
  const [renewPolicyIndex, setRenewPolicyIndex] = useState(null);
  const [renewPolicyList, setRenewPolicyList] = useState([]);
  // Cover tracking (original cover for progress bar)
  const [originalCover, setOriginalCover] = useState(null);
  const [txPending, setTxPending] = useState(false);

  const handleDataError = (err) => {
    console.error("Dashboard failed to load data:", err);
    localStorage.removeItem("token");
    window.location.href = '/login';
  }

  const getPatientData = async () => {
    var p = await mediChain.methods.patientInfo(account).call();
    var records = await mediChain.methods.getPatientRecords(account).call();
    setPatient({ ...p, records });
    // Retrieve original cover from localStorage for progress bar
    const savedCover = localStorage.getItem(`originalCover_${account}`);
    if (savedCover) setOriginalCover(Number(savedCover));
  }

  const giveAccess = (e) => {
    e.preventDefault();
    setTxPending(true);
    mediChain.methods.permitAccess(docEmail).send({ from: account })
      .on('transactionHash', () => {
        addToast("Doctor access granted successfully!", "success");
        setTxPending(false);
        setTimeout(() => window.location.href = '/login', 1500);
      })
      .on('error', (err) => {
        addToast("Failed to grant access: " + (err.message || "Unknown error"), "danger");
        setTxPending(false);
      });
  }

  const revokeAccess = async (email) => {
    setRevokeTarget(email);
    setShowRevokeConfirm(true);
  }

  const confirmRevokeAccess = async () => {
    setShowRevokeConfirm(false);
    setTxPending(true);
    try {
      var addr = await mediChain.methods.emailToAddress(revokeTarget).call();
      mediChain.methods.revokeAccess(addr).send({ from: account })
        .on('transactionHash', () => {
          addToast("Doctor access revoked.", "warning");
          setTxPending(false);
          setTimeout(() => window.location.href = '/login', 1500);
        })
        .on('error', (err) => {
          addToast("Failed to revoke access.", "danger");
          setTxPending(false);
        });
    } catch (err) {
      addToast("Failed to revoke access.", "danger");
      setTxPending(false);
    }
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
    var ins = await mediChain.methods.insurerInfo(patient.policy.insurer).call();
    setInsurer(ins)
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
      var list = await mediChain.methods.getInsurerPolicyList(buyFromInsurer).call()
      setPolicyList(list);
    } catch (err) { handleDataError(err) }
  }

  const getRenewPolicyList = async (insurerAddr) => {
    try {
      var list = await mediChain.methods.getInsurerPolicyList(insurerAddr).call();
      setRenewPolicyList(list);
    } catch (err) { console.error(err); }
  }

  const purchasePolicy = async (e) => {
    e.preventDefault();
    setShowPolicyConfirm(true);
  }

  const confirmPurchasePolicy = async () => {
    setShowPolicyConfirm(false);
    setTxPending(true);
    var value = policyList[buyPolicyIndex].premium / ethValue;
    // Save original cover to localStorage for progress bar reference
    localStorage.setItem(`originalCover_${account}`, policyList[buyPolicyIndex].coverValue);
    mediChain.methods.buyPolicy(parseInt(policyList[buyPolicyIndex].id)).send({ from: account, value: Web3.utils.toWei(value.toString(), 'Ether') })
      .on('transactionHash', () => {
        addToast("Policy purchased successfully! 🎉", "success");
        setTxPending(false);
        setTimeout(() => window.location.href = '/login', 1500);
      })
      .on('error', (err) => {
        addToast("Policy purchase failed.", "danger");
        setTxPending(false);
      });
  }

  const confirmRenewPolicy = async () => {
    if (renewPolicyIndex === null || !renewInsurer) return;
    setShowRenewModal(false);
    setTxPending(true);
    var pol = renewPolicyList[renewPolicyIndex];
    var value = pol.premium / ethValue;
    localStorage.setItem(`originalCover_${account}`, pol.coverValue);
    mediChain.methods.renewPolicy(parseInt(pol.id)).send({ from: account, value: Web3.utils.toWei(value.toString(), 'Ether') })
      .on('transactionHash', () => {
        addToast("Policy renewed successfully! 🎉", "success");
        setTxPending(false);
        setTimeout(() => window.location.href = '/login', 1500);
      })
      .on('error', (err) => {
        addToast("Policy renewal failed: " + (err.message || ""), "danger");
        setTxPending(false);
      });
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
    setTxPending(true);
    mediChain.methods.settleTransactionsByPatient(transaction.id).send({ from: account, value: Web3.utils.toWei(value.toString(), 'Ether') })
      .on('transactionHash', () => {
        addToast("Payment settled successfully!", "success");
        setTxPending(false);
        setTimeout(() => getTransactionsList(), 1500);
      })
      .on('error', (err) => {
        addToast("Payment failed.", "danger");
        setTxPending(false);
      });
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
              const encryptedText = await res.text();
              try {
                const bytes = CryptoJS.AES.decrypt(encryptedText, SECRET_KEY);
                const decryptedData = JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
                if (decryptedData && decryptedData.treatments) {
                  combinedTreatments = [...combinedTreatments, ...decryptedData.treatments];
                }
              } catch (e) {
                try {
                  const data = JSON.parse(encryptedText);
                  if (data && data.treatments) {
                    combinedTreatments = [...combinedTreatments, ...data.treatments];
                  }
                } catch (err) {}
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

  // Derived expiry info
  const getPolicyExpiryInfo = () => {
    if (!patient || !patient.policyActive) return null;
    const expiryMs = Number(patient.policyExpiry) * 1000;
    const now = Date.now();
    const daysLeft = Math.ceil((expiryMs - now) / (1000 * 60 * 60 * 24));
    const isExpired = expiryMs < now;
    return { isExpired, daysLeft, expiryDate: new Date(expiryMs).toLocaleDateString() };
  };

  const expiryInfo = getPolicyExpiryInfo();
  const coverPct = (originalCover && patient?.policyActive)
    ? Math.max(0, Math.min(100, Math.round((Number(patient.policy.coverValue) / originalCover) * 100)))
    : null;

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

      <Row className="mb-4">
        <Col md={6} lg={4}>
          <div className="glass-card h-100">
            <h4 className="mb-3 text-secondary">My Profile</h4>
            <div className="d-flex flex-column gap-2 mb-4">
              <div className="d-flex justify-content-between"><span className="text-muted">Name:</span> <strong style={{color: 'var(--text-primary)'}}>{patient.name}</strong></div>
              <div className="d-flex justify-content-between"><span className="text-muted">Email:</span> <strong style={{color: 'var(--text-primary)'}}>{patient.email}</strong></div>
              <div className="d-flex justify-content-between"><span className="text-muted">Age:</span> <strong style={{color: 'var(--text-primary)'}}>{patient.age}</strong></div>
              <div className="d-flex justify-content-between"><span className="text-muted">Account:</span> <strong className="text-truncate" style={{maxWidth: '120px', color: 'var(--text-primary)'}}>{account}</strong></div>
            </div>
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
              <Button variant="outline-primary" type="submit" className="px-4 rounded-pill" disabled={txPending}>
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
                        <td><Button variant="outline-danger" size="sm" className="rounded-pill" onClick={() => revokeAccess(doc.email)} disabled={txPending}>Revoke Access</Button></td>
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
                <div className="p-3 rounded-3 mb-3 border" style={{background: 'var(--surface)'}}>
                  <div className="d-flex justify-content-between mb-2">
                    <span className="text-muted">Provider:</span>
                    <span className="fw-bold" style={{color: 'var(--text-primary)'}}>{insurer.name}</span>
                  </div>
                  <div className="d-flex justify-content-between mb-2">
                    <span className="text-muted">Policy:</span>
                    <span className="fw-bold" style={{color: 'var(--text-primary)'}}>{patient.policy.name}</span>
                  </div>
                  <div className="d-flex justify-content-between mb-2">
                    <span className="text-muted">Cover Value:</span>
                    <span className="text-success fw-bold">INR {patient.policy.coverValue}</span>
                  </div>
                  {coverPct !== null && (
                    <div className="mb-2">
                      <small className="text-muted d-flex justify-content-between mb-1">
                        <span>Cover Remaining</span>
                        <span>{coverPct}%</span>
                      </small>
                      <ProgressBar
                        now={coverPct}
                        variant={coverPct > 60 ? 'success' : coverPct > 25 ? 'warning' : 'danger'}
                        className="rounded-pill"
                        style={{ height: '8px' }}
                      />
                    </div>
                  )}
                  <div className="d-flex justify-content-between mb-2">
                    <span className="text-muted">Premium:</span>
                    <span className="text-end" style={{color: 'var(--text-primary)'}}>
                      INR {patient.policy.premium}/year<br />
                      <small className="text-muted">~ {(patient.policy.premium / ethValue).toFixed(5)} ETH</small>
                    </span>
                  </div>
                  <div className="d-flex justify-content-between pt-2 border-top mt-2">
                    <span className="text-muted">Expiry:</span>
                    <div className="text-end">
                      <span className={`fw-bold ${expiryInfo?.isExpired ? 'text-danger' : 'text-primary'}`}>
                        {expiryInfo?.expiryDate}
                      </span>
                      <br />
                      {expiryInfo && !expiryInfo.isExpired && (
                        <small className={`${expiryInfo.daysLeft <= 30 ? 'text-warning fw-bold' : 'text-muted'}`}>
                          {expiryInfo.daysLeft} day{expiryInfo.daysLeft !== 1 ? 's' : ''} remaining
                        </small>
                      )}
                    </div>
                  </div>
                </div>
                <div className="text-end text-muted small">
                  {expiryInfo?.isExpired ?
                    <>
                      <Badge bg="danger" pill className="mb-2">Expired</Badge>
                      <br />
                      <Button
                        variant="warning"
                        size="sm"
                        className="rounded-pill fw-bold"
                        onClick={() => {
                          setRenewInsurer(patient.policy.insurer);
                          getRenewPolicyList(patient.policy.insurer);
                          setShowRenewModal(true);
                        }}
                      >
                        🔄 Renew Policy
                      </Button>
                    </> :
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
                        Cover: INR {policyList[buyPolicyIndex].coverValue} | Premium: INR {policyList[buyPolicyIndex].premium}/yr (~ {(policyList[buyPolicyIndex].premium / ethValue).toFixed(5)} ETH)
                        <br />Duration: {policyList[buyPolicyIndex].timePeriod} Year{policyList[buyPolicyIndex].timePeriod > 1 ? 's' : ''}
                      </small>
                    </div>
                  )}

                  <Button variant="primary" type="submit" className="w-100 rounded-pill btn-primary" disabled={!policyList[buyPolicyIndex] || txPending}>
                    {txPending ? '⏳ Processing...' : 'Review & Purchase Policy'}
                  </Button>
                </Form>
              </>
            )}
          </div>
        </Col>

        <Col md={6}>
          <div className="glass-card h-100">
            <h4 className="mb-3 text-secondary">Transaction History
              {transactionsList.filter(t => !t.settled).length > 0 &&
                <Badge bg="warning" text="dark" pill className="ms-2 fs-6">
                  {transactionsList.filter(t => !t.settled).length} Pending
                </Badge>
              }
            </h4>
            <div className="table-responsive">
              <Table className="custom-table align-middle">
                <thead>
                  <tr>
                    <th>Doctor</th>
                    <th>Amount</th>
                    <th>Date</th>
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
                          <small className="text-muted">
                            {transaction.timestamp && Number(transaction.timestamp) > 0
                              ? new Date(Number(transaction.timestamp) * 1000).toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric" })
                              : "—"
                            }
                          </small>
                        </td>
                        <td>
                          {transaction.settled ?
                            <Badge bg="success" pill>Settled</Badge> :
                            <Badge bg="warning" text="dark" pill>Pending</Badge>
                          }
                        </td>
                        <td>
                          {!transaction.settled ?
                            <Button variant="primary" size="sm" className="rounded-pill btn-primary" onClick={(e) => settlePayment(e, transaction)} disabled={txPending}>Pay</Button>
                            : <Button variant="secondary" size="sm" className="rounded-pill" disabled>Paid</Button>
                          }
                        </td>
                      </tr>
                    ))
                    : <tr><td colSpan="5" className="text-center text-muted">
                      {patient.policyActive && !expiryInfo?.isExpired
                        ? "No out-of-pocket transactions — your insurer covers charges directly."
                        : "No transactions found"
                      }
                    </td></tr>
                  }
                </tbody>
              </Table>
            </div>
          </div>
        </Col>
      </Row>

      {/* Policy Purchase Confirmation Modal */}
      <Modal show={showPolicyConfirm} onHide={() => setShowPolicyConfirm(false)} centered contentClassName="glass-card border-0">
        <Modal.Header closeButton className="border-0">
          <Modal.Title className="fw-bold text-warning">⚠️ Confirm Policy Purchase</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>This will initiate a <strong>blockchain transaction</strong>. Your premium will be transferred to the insurer immediately and <strong>cannot be refunded</strong>.</p>
          {policyList[buyPolicyIndex] && (
            <div className="bg-light rounded p-3">
              <div className="d-flex justify-content-between"><span className="text-muted">Policy:</span><strong>{policyList[buyPolicyIndex].name}</strong></div>
              <div className="d-flex justify-content-between"><span className="text-muted">Cover:</span><strong>INR {policyList[buyPolicyIndex].coverValue}</strong></div>
              <div className="d-flex justify-content-between"><span className="text-muted">Premium:</span><strong>INR {policyList[buyPolicyIndex].premium}</strong></div>
              <div className="d-flex justify-content-between"><span className="text-muted">Duration:</span><strong>{policyList[buyPolicyIndex].timePeriod} Year{policyList[buyPolicyIndex].timePeriod > 1 ? 's' : ''}</strong></div>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer className="border-0">
          <Button variant="secondary" className="rounded-pill" onClick={() => setShowPolicyConfirm(false)}>Cancel</Button>
          <Button variant="primary" className="rounded-pill btn-primary" onClick={confirmPurchasePolicy}>✅ Confirm Purchase</Button>
        </Modal.Footer>
      </Modal>

      {/* Revoke Access Confirmation Modal */}
      <Modal show={showRevokeConfirm} onHide={() => setShowRevokeConfirm(false)} centered contentClassName="glass-card border-0">
        <Modal.Header closeButton className="border-0">
          <Modal.Title className="fw-bold text-danger">⚠️ Revoke Doctor Access</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Are you sure you want to revoke access for <strong>{revokeTarget}</strong>?</p>
          <p className="text-muted small">They will no longer be able to view your medical records or submit diagnoses.</p>
        </Modal.Body>
        <Modal.Footer className="border-0">
          <Button variant="secondary" className="rounded-pill" onClick={() => setShowRevokeConfirm(false)}>Cancel</Button>
          <Button variant="danger" className="rounded-pill" onClick={confirmRevokeAccess}>Revoke Access</Button>
        </Modal.Footer>
      </Modal>

      {/* Renew Policy Modal */}
      <Modal show={showRenewModal} onHide={() => setShowRenewModal(false)} centered contentClassName="glass-card border-0">
        <Modal.Header closeButton className="border-0">
          <Modal.Title className="fw-bold text-primary">🔄 Renew Insurance Policy</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p className="text-muted">Your current policy has expired. Select a policy to renew.</p>
          <Form.Group className='mb-3'>
            <Form.Label className="form-label fw-bold">Select Policy to Renew</Form.Label>
            <Form.Select className="form-control" onChange={(e) => setRenewPolicyIndex(e.target.value)}>
              <option>Choose Policy</option>
              {renewPolicyList.map((pol, idx) => <option key={idx} value={idx}>{pol.name} — INR {pol.premium}/yr</option>)}
            </Form.Select>
          </Form.Group>
          {renewPolicyList[renewPolicyIndex] && (
            <div className="alert alert-info">
              <small>
                <strong>{renewPolicyList[renewPolicyIndex].name}</strong><br />
                Cover: INR {renewPolicyList[renewPolicyIndex].coverValue} | Duration: {renewPolicyList[renewPolicyIndex].timePeriod} Yr
              </small>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer className="border-0">
          <Button variant="secondary" className="rounded-pill" onClick={() => setShowRenewModal(false)}>Cancel</Button>
          <Button variant="primary" className="rounded-pill btn-primary" disabled={renewPolicyIndex === null || !renewPolicyList[renewPolicyIndex]} onClick={confirmRenewPolicy}>
            ✅ Renew Policy
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Medical Records Modal */}
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
