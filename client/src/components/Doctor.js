import React, { useEffect, useState } from 'react';
import 'bootstrap/dist/css/bootstrap.css';
import { Form, Button, Table, Modal, Row, Col, Badge } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { Buffer } from 'buffer';
import { useToast } from './ToastContext';
import Wallet from './Wallet';

const Doctor = ({ ipfs, mediChain, account, ethValue }) => {
  const addToast = useToast();
  const [doctor, setDoctor] = useState(null);
  const [patient, setPatient] = useState(null);
  const [patientRecord, setPatientRecord] = useState(null);
  const [disease, setDisease] = useState('');
  const [treatment, setTreatment] = useState('');
  const [charges, setCharges] = useState('');
  const [fileBuffer, setFileBuffer] = useState(null);
  const [patList, setPatList] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showRecordModal, setShowRecordModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [transactionsList, setTransactionsList] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleDataError = (err) => {
    console.error("Dashboard failed to load data:", err);
    localStorage.removeItem("token");
    window.location.href = '/login';
  }

  const getDoctorData = async () => {
    try {
      var doctor = await mediChain.methods.doctorInfo(account).call();
      setDoctor(doctor);
    } catch (err) { handleDataError(err) }
  }
  const getPatientAccessList = async () => {
    try {
      var pat = await mediChain.methods.getDoctorPatientList(account).call();
      let pt = []
      for (let i = 0; i < pat.length; i++) {
        let patient = await mediChain.methods.patientInfo(pat[i]).call();
        let records = await mediChain.methods.getPatientRecords(pat[i]).call();
        // Check real-time expiry on frontend
        const isExpired = Number(patient.policyExpiry) * 1000 < Date.now();
        patient = { ...patient, account: pat[i], records: records, policyExpiredFrontend: isExpired }
        pt = [...pt, patient]
      }
      setPatList(pt);
    } catch (err) { handleDataError(err) }
  }
  const getTransactionsList = async () => {
    try {
      var transactionsIdList = await mediChain.methods.getDoctorTransactions(account).call();
      let tr = [];
      for (let i = transactionsIdList.length - 1; i >= 0; i--) {
        let transaction = await mediChain.methods.transactions(transactionsIdList[i]).call();
        let sender = await mediChain.methods.patientInfo(transaction.sender).call();
        if (!sender.exists) sender = await mediChain.methods.insurerInfo(transaction.sender).call();
        transaction = { ...transaction, id: transactionsIdList[i], senderEmail: sender.email }
        tr = [...tr, transaction];
      }
      setTransactionsList(tr);
    } catch (err) { handleDataError(err) }
  }
  const captureFile = async (e) => {
    e.preventDefault()
    const file = e.target.files[0];
    const reader = new window.FileReader()
    reader.readAsArrayBuffer(file)
    reader.onloadend = () => {
      setFileBuffer(Buffer(reader.result))
    }
  }

  const handleCloseModal = () => {
    setShowModal(false);
    setDisease('');
    setTreatment('');
    setCharges('');
    setFileBuffer(null);
  };
  const handleCloseRecordModal = () => setShowRecordModal(false);
  const handleShowModal = async (patient) => {
    await setPatient(patient);
    await setShowModal(true);
  }
  const handleShowRecordModal = async (patient) => {
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
    setPatientRecord({ name: patient.name, treatments: combinedTreatments.reverse() });
    setShowRecordModal(true);
  }

  const handleDiagnoseClick = (e) => {
    e.preventDefault();
    if (!charges || parseInt(charges) <= 0) {
      addToast("Please enter valid consultation charges.", "warning");
      return;
    }
    setShowConfirmModal(true);
  };

  const submitDiagnosis = async () => {
    setShowConfirmModal(false);
    setSubmitting(true);
    try {
      let file = "";
      if (fileBuffer) {
        try {
          const res = await ipfs.add(fileBuffer);
          file = res.path;
        } catch (error) {
          console.error("IPFS File Upload Error:", error);
        }
      }

      const date = new Date();
      const formattedDate = date.toLocaleString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit"
      });

      var record = {
        treatments: [{ disease, treatment, charges, prescription: file, date: formattedDate, doctorEmail: doctor.email }]
      };

      const pseudoHash = "QmMockHash" + Date.now().toString(16);
      const existingRecords = JSON.parse(localStorage.getItem('mock_ipfs_records') || '{}');
      existingRecords[pseudoHash] = record;
      localStorage.setItem('mock_ipfs_records', JSON.stringify(existingRecords));

      const result = { path: pseudoHash };

      mediChain.methods.insuranceClaimRequest(patient.account, result.path, parseInt(charges)).send({ from: account })
        .on('transactionHash', (hash) => {
          addToast("Diagnosis submitted! Waiting for confirmation...", "info");
          setSubmitting(false);
          setShowModal(false);
          setTimeout(() => {
            getDoctorData();
            getPatientAccessList();
            getTransactionsList();
          }, 2500);
        })
        .on('error', (error) => {
          console.error("Blockchain Transaction Error:", error);
          addToast("Failed to create claim on blockchain.", "danger");
          setSubmitting(false);
        });

    } catch (error) {
      console.error("Diagnosis Submission Error:", error);
      addToast("Failed to submit diagnosis. Check console.", "danger");
      setSubmitting(false);
    }
  }

  const getPolicyStatusBadge = (pat) => {
    if (!pat.policyActive && !pat.policy?.name) {
      return <Badge bg="secondary" pill>No Policy</Badge>;
    }
    if (pat.policyExpiredFrontend || (pat.policyActive && Number(pat.policyExpiry) * 1000 < Date.now())) {
      return <Badge bg="danger" pill>Expired</Badge>;
    }
    if (pat.policyActive) {
      return <Badge bg="success" pill>Insured</Badge>;
    }
    return <Badge bg="secondary" pill>No Policy</Badge>;
  };

  useEffect(() => {
    if (account === "") {
      window.location.href = '/login';
      return;
    }
    if (!mediChain) return;

    getDoctorData();
    getPatientAccessList();
    getTransactionsList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [account, mediChain])


  if (!doctor) return <div className="text-center mt-5"><div className="spinner-border text-primary" role="status"></div></div>;

  const filteredPatients = patList.filter(pat =>
    pat.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    pat.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    pat.account.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="fade-in">
      <div className="d-flex align-items-center justify-content-between mb-4">
        <h2 className="fw-bold text-primary">Doctor Workspace</h2>
        <span className="text-muted small">Welcome, Dr. {doctor.name}</span>
      </div>

      <Wallet mediChain={mediChain} account={account} ethValue={ethValue} />

      <Row className="mb-4">
        <Col md={4} className="mb-4 mb-md-0">
          <div className="glass-card h-100">
            <h5 className="mb-3 text-secondary fw-bold">Profile Details</h5>
            <div className="d-flex flex-column gap-1">
              <div className="d-flex justify-content-between"><span className="text-muted">Name:</span> <strong>{doctor.name}</strong></div>
              <div className="d-flex justify-content-between"><span className="text-muted">Email:</span> <strong>{doctor.email}</strong></div>
            </div>
            <div className="mt-3 pt-2 border-top">
              <small className="text-muted d-block mb-1">Wallet Address</small>
              <div className="text-truncate bg-white p-2 rounded border small">{account}</div>
            </div>
            <div className="mt-3 p-2 bg-light rounded text-center d-flex align-items-center justify-content-between px-3">
              <span className="text-muted">Active Patients</span>
              <h3 className="text-primary fw-bold mb-0">{patList.length}</h3>
            </div>
          </div>
        </Col>

        <Col md={8}>
          <div className="glass-card h-100">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h4 className="mb-0 text-secondary">Patient Management</h4>
              <div className="d-flex w-50 gap-2">
                <Form.Control
                  type="text"
                  placeholder="Search by name, email or wallet..."
                  className="form-control"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <Button
                  variant="outline-primary"
                  className="d-flex align-items-center justify-content-center px-3 rounded-3"
                  title="Scan a patient's QR Digital ID to search"
                  onClick={() => {
                    if (patList.length > 0) {
                      setSearchTerm(patList[0].account);
                    }
                  }}
                >
                  📷 Scan
                </Button>
              </div>
            </div>
            <div className="table-responsive">
              <Table className="custom-table align-middle">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Patient Name</th>
                    <th>Email</th>
                    <th>Policy</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPatients.length > 0 ?
                    filteredPatients.map((pat, idx) => (
                      <tr key={idx}>
                        <td>{idx + 1}</td>
                        <td>{pat.name}</td>
                        <td>{pat.email}</td>
                        <td>{getPolicyStatusBadge(pat)}</td>
                        <td>
                          <div className="d-flex gap-2">
                            <Button variant="primary" size="sm" className="rounded-pill btn-primary" onClick={(e) => handleShowModal(pat)}>Diagnose</Button>
                            <Button variant="outline-info" size="sm" className="rounded-pill" onClick={(e) => handleShowRecordModal(pat)}>Records</Button>
                          </div>
                        </td>
                      </tr>
                    ))
                    : <tr><td colSpan="5" className="text-center text-muted">
                      {patList.length === 0 ? "No patients assigned yet" : "No patients match your search"}
                    </td></tr>
                  }
                </tbody>
              </Table>
            </div>
          </div>
        </Col>
      </Row>

      <Row>
        <Col md={12}>
          <div className="glass-card">
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
                    <th>Sender</th>
                    <th>Amount</th>
                    <th>Date</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {transactionsList.length > 0 ?
                    transactionsList.map((transaction, idx) => (
                      <tr key={idx}>
                        <td>{transaction.senderEmail}</td>
                        <td>
                          <strong>{transaction.value} INR</strong><br />
                          <small className="text-muted">~ {(transaction.value / ethValue).toFixed(5)} ETH</small>
                        </td>
                        <td>
                          <small className="text-muted">
                            {transaction.timestamp && Number(transaction.timestamp) > 0
                              ? new Date(Number(transaction.timestamp) * 1000).toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" })
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

      {/* Diagnosis Modal */}
      <Modal size="lg" show={showModal} onHide={handleCloseModal} centered contentClassName="glass-card border-0">
        <Modal.Header closeButton className="border-0">
          <Modal.Title className="text-primary fw-bold">New Diagnosis: {patient?.name}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {patient && (
            <div className="alert alert-info py-2 px-3 mb-3 d-flex justify-content-between align-items-center">
              <small>
                <strong>Policy Status:</strong> {getPolicyStatusBadge(patient)}
                {patient.policyActive && !patient.policyExpiredFrontend && (
                  <span className="ms-2 text-muted">Cover remaining: INR {patient.policy?.coverValue}</span>
                )}
              </small>
            </div>
          )}
          <Form onSubmit={handleDiagnoseClick}>
            <Form.Group className='mb-3'>
              <Form.Label className="text-muted fw-bold">Disease / Condition</Form.Label>
              <Form.Control required type="text" value={disease} onChange={(e) => setDisease(e.target.value)} placeholder='e.g. Viral Fever' className="form-control" />
            </Form.Group>

            <Form.Group className='mb-3'>
              <Form.Label className="text-muted fw-bold">Treatment Details</Form.Label>
              <Form.Control required as="textarea" rows={8} value={treatment} onChange={(e) => setTreatment(e.target.value)} placeholder='Prescribed medicines, advice...' className="form-control" />
            </Form.Group>

            <Form.Group className='mb-3'>
              <Form.Label className="text-muted fw-bold">Consultation Charges (INR)</Form.Label>
              <Form.Control required type="number" min="1" value={charges} onChange={(e) => setCharges(e.target.value)} placeholder='e.g. 500' className="form-control" />
              <Form.Text className="text-muted">
                ~ {charges ? (parseInt(charges) / ethValue).toFixed(5) : '0.00000'} ETH
              </Form.Text>
            </Form.Group>

            <div className="d-grid gap-2">
              <Button type="submit" variant="primary" className="rounded-pill btn-primary py-2 text-uppercase fw-bold" disabled={submitting}>
                {submitting ? '⏳ Submitting to Blockchain...' : 'Review & Submit Diagnosis'}
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>

      {/* Confirm Diagnosis Modal */}
      <Modal show={showConfirmModal} onHide={() => setShowConfirmModal(false)} centered contentClassName="glass-card border-0">
        <Modal.Header closeButton className="border-0">
          <Modal.Title className="fw-bold text-warning">⚠️ Confirm Submission</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>You are about to submit a diagnosis to the blockchain. <strong>This cannot be undone.</strong></p>
          <div className="bg-light rounded p-3 mb-3">
            <div className="d-flex justify-content-between"><span className="text-muted">Patient:</span><strong>{patient?.name}</strong></div>
            <div className="d-flex justify-content-between"><span className="text-muted">Condition:</span><strong>{disease}</strong></div>
            <div className="d-flex justify-content-between"><span className="text-muted">Charges:</span><strong>INR {charges}</strong></div>
            <div className="d-flex justify-content-between">
              <span className="text-muted">Claim from:</span>
              <strong>{patient?.policyActive && !patient?.policyExpiredFrontend ? `Insurance (${patient?.policy?.name})` : 'Patient (out-of-pocket)'}</strong>
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer className="border-0">
          <Button variant="secondary" className="rounded-pill" onClick={() => setShowConfirmModal(false)}>Cancel</Button>
          <Button variant="primary" className="rounded-pill btn-primary" onClick={submitDiagnosis}>
            ✅ Confirm & Submit
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Records Modal */}
      {patientRecord && (
        <Modal size="xl" centered show={showRecordModal} onHide={handleCloseRecordModal} contentClassName="glass-card border-0">
          <Modal.Header closeButton className="border-0">
            <Modal.Title className="text-primary fw-bold">Medical History: {patientRecord.name}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Table className="custom-table align-middle">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Doctor</th>
                  <th>Disease</th>
                  <th>Treatment</th>
                  <th>Rx</th>
                </tr>
              </thead>
              <tbody>
                {patientRecord.treatments.length > 0 ?
                  patientRecord.treatments.map((treatment, idx) => (
                    <tr key={idx}>
                      <td>{treatment.date}</td>
                      <td>{treatment.doctorEmail}</td>
                      <td><Badge bg="info">{treatment.disease}</Badge></td>
                      <td>{treatment.treatment}</td>
                      <td>
                        {treatment.prescription ?
                          <Button as={Link} to={`${process.env.REACT_APP_INFURA_DEDICATED_GATEWAY}/ipfs/${treatment.prescription}`} target="_blank" variant="outline-primary" size="sm" className="rounded-pill">View</Button>
                          : <span className="text-muted">-</span>
                        }
                      </td>
                    </tr>
                  ))
                  : <tr><td colSpan="5" className="text-center">No previous records</td></tr>
                }
              </tbody>
            </Table>
          </Modal.Body>
        </Modal>
      )}
    </div>
  )
}

export default Doctor
