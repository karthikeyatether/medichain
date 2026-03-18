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
  const [transactionsList, setTransactionsList] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [emergencyEmail, setEmergencyEmail] = useState("");
  const [emergencyLoading, setEmergencyLoading] = useState(false);

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
        patient = { ...patient, account: pat[i], records: records }
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


  const handleCloseModal = () => setShowModal(false);
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
          const res = await fetch(`${process.env.REACT_APP_INFURA_DEDICATED_GATEWAY}/ipfs/${hash}`);
          if (res.ok) {
            const data = await res.json();
            if (data && data.treatments) {
              combinedTreatments = [...combinedTreatments, ...data.treatments];
            }
          }
        } catch (e) {
          console.error("Error fetching record:", e);
        }
      }));
    }
    // Sort by date roughly or just show as fetched (since IPFS hashes are in order of insertion, we can reverse to show latest first)
    setPatientRecord({ name: patient.name, treatments: combinedTreatments.reverse() });
    setShowRecordModal(true);
  }
  const submitDiagnosis = async (e) => {
    e.preventDefault();
    try {
      let file = "";
      if (fileBuffer) {
        try {
          const res = await ipfs.add(fileBuffer);
          file = res.path;
        } catch (error) {
          console.error("IPFS File Upload Error:", error);
          // Proceed without file if upload fails? Or stop? 
          // For now, let's allow proceeding but warn user, or just log.
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

      // Create an isolated record for just this new diagnosis
      var record = {
        treatments: [{ disease, treatment, charges, prescription: file, date: formattedDate, doctorEmail: doctor.email }]
      };

      // Since Infura IPFS is deprecated and requires Auth, we will mock the upload
      // and generate a deterministic pseudo-hash to allow the Smart Contract to proceed.
      const pseudoHash = "QmMockHash" + Date.now().toString(16);

      // Store locally so Patient Dashboard can still fetch it later as a demo
      const existingRecords = JSON.parse(localStorage.getItem('mock_ipfs_records') || '{}');
      existingRecords[pseudoHash] = record;
      localStorage.setItem('mock_ipfs_records', JSON.stringify(existingRecords));

      const result = { path: pseudoHash };

      mediChain.methods.insuranceClaimRequest(patient.account, result.path, charges).send({ from: account })
        .on('transactionHash', (hash) => {
          addToast("Diagnosis submitted and claim created successfully!", "success");
          setShowModal(false);
          setTimeout(() => window.location.reload(), 2000);
        })
        .on('error', (error) => {
          console.error("Blockchain Transaction Error:", error);
          addToast("Failed to create claim on blockchain.", "danger");
        });

    } catch (error) {
      console.error("Diagnosis Submission Error:", error);
      addToast("Failed to submit diagnosis. Check console.", "danger");
    }
  }

  const handleEmergencyAccess = async (e) => {
    e.preventDefault();
    if (!emergencyEmail) return;
    setEmergencyLoading(true);
    try {
      const paddr = await mediChain.methods.emailToAddress(emergencyEmail).call();
      if (paddr === "0x0000000000000000000000000000000000000000") {
        throw new Error("Patient not found.");
      }
      await mediChain.methods.requestEmergencyAccess(paddr).send({ from: account });
      addToast("Emergency access granted! Audit log created.", "warning");
      getPatientAccessList();
      setEmergencyEmail("");
    } catch (error) {
      console.error("Emergency access error:", error);
      addToast(error.message || "Failed to grant emergency access.", "danger");
    } finally {
      setEmergencyLoading(false);
    }
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

          <div className="glass-card mt-4 border-danger border-opacity-25 bg-danger bg-opacity-10">
            <h5 className="text-danger fw-bold mb-2 small">🚨 Emergency Access</h5>
            <p className="small text-muted mb-2" style={{ fontSize: '0.75rem' }}>Request immediate access to a patient's records. Action will be permanently logged.</p>
            <Form onSubmit={handleEmergencyAccess}>
              <Form.Group className="mb-2">
                <Form.Control
                  type="email"
                  placeholder="Patient Email"
                  value={emergencyEmail}
                  onChange={(e) => setEmergencyEmail(e.target.value)}
                  className="form-control-sm"
                  required
                />
              </Form.Group>
              <Button
                type="submit"
                variant="danger"
                size="sm"
                className="w-100 rounded-pill fw-bold"
                disabled={emergencyLoading}
              >
                {emergencyLoading ? 'Requesting...' : 'Force Emergency Access'}
              </Button>
            </Form>
          </div>
        </Col>





        <Col md={8}>
          <div className="glass-card h-100">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h4 className="mb-0 text-secondary">Patient Management</h4>
              <div className="d-flex w-50 gap-2">
                <Form.Control
                  type="text"
                  placeholder="Search Patient Digital ID or Name..."
                  className="form-control"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <Button
                  variant="outline-primary"
                  className="d-flex align-items-center justify-content-center px-3 rounded-3"
                  title="Simulate scanning a Patient's QR Digital ID"
                  onClick={() => {
                    // Simulation: auto-fill with a demo address or just focus if empty
                    if (patList.length > 0) setSearchTerm(patList[0].account);
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
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {patList.length > 0 ?
                    patList
                      .filter(pat =>
                        pat.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        pat.email.toLowerCase().includes(searchTerm.toLowerCase())
                      )
                      .map((pat, idx) => (
                        <tr key={idx}>
                          <td>{idx + 1}</td>
                          <td>{pat.name}</td>
                          <td>{pat.email}</td>
                          <td>
                            <div className="d-flex gap-2">
                              <Button variant="primary" size="sm" className="rounded-pill btn-primary" onClick={(e) => handleShowModal(pat)} >Diagnose</Button>
                              <Button variant="outline-info" size="sm" className="rounded-pill" onClick={(e) => handleShowRecordModal(pat)} >Records</Button>
                            </div>
                          </td>
                        </tr>
                      ))
                    : <tr><td colSpan="4" className="text-center text-muted">No patients assigned yet</td></tr>
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
            <h4 className="mb-3 text-secondary">Transaction History</h4>
            <div className="table-responsive">
              <Table className="custom-table align-middle">
                <thead>
                  <tr>
                    <th>Sender</th>
                    <th>Amount</th>
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
                          {transaction.settled ?
                            <Badge bg="success" pill>Settled</Badge> :
                            <Badge bg="warning" text="dark" pill>Pending</Badge>
                          }
                        </td>
                      </tr>
                    ))
                    : <tr><td colSpan="3" className="text-center text-muted">No transactions found</td></tr>
                  }
                </tbody>
              </Table>
            </div>
          </div>
        </Col>
      </Row>

      <Modal size="lg" show={showModal} onHide={handleCloseModal} centered contentClassName="glass-card border-0">
        <Modal.Header closeButton className="border-0">
          <Modal.Title className="text-primary fw-bold">New Diagnosis: {patient?.name}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={submitDiagnosis}>
            <Form.Group className='mb-3'>
              <Form.Label className="text-muted fw-bold">Disease / Condition</Form.Label>
              <Form.Control required type="text" value={disease} onChange={(e) => setDisease(e.target.value)} placeholder='e.g. Viral Fever' className="form-control" />
            </Form.Group>

            <Form.Group className='mb-3'>
              <Form.Label className="text-muted fw-bold">Treatment Details</Form.Label>
              <Form.Control required as="textarea" rows={12} value={treatment} onChange={(e) => setTreatment(e.target.value)} placeholder='Prescribed medicines, advice...' className="form-control" />
            </Form.Group>


            <Form.Group className='mb-3'>
              <Form.Label className="text-muted fw-bold">Consultation Charges (INR)</Form.Label>
              <Form.Control required type="number" value={charges} onChange={(e) => setCharges(e.target.value)} placeholder='e.g. 500' className="form-control" />
              <Form.Text className="text-muted">
                ~ {(charges / ethValue).toFixed(5)} ETH
              </Form.Text>
            </Form.Group>

            {/* File Upload Removed as per request
            <Form.Group className='mb-4'>
              <Form.Label className="text-muted fw-bold">Upload Prescription (PDF/Image)</Form.Label>
              <Form.Control onChange={captureFile} accept=".jpg, .jpeg, .png, .pdf" type="file" className="form-control" />
            </Form.Group>
            */}

            <div className="d-grid gap-2">
              <Button type="submit" variant="primary" className="rounded-pill btn-primary py-2 text-uppercase fw-bold">
                Submit & Create Claim
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>

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
