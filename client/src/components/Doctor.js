import React, { useEffect, useState } from 'react';
import 'bootstrap/dist/css/bootstrap.css';
import { Form, Button, Table, Modal, Row, Col, Badge } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { Buffer } from 'buffer';
import { useToast } from './ToastContext';

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

  const getDoctorData = async () => {
    var doctor = await mediChain.methods.doctorInfo(account).call();
    setDoctor(doctor);
  }
  const getPatientAccessList = async () => {
    var pat = await mediChain.methods.getDoctorPatientList(account).call();
    let pt = []
    for (let i = 0; i < pat.length; i++) {
      let patient = await mediChain.methods.patientInfo(pat[i]).call();
      patient = { ...patient, account: pat[i] }
      pt = [...pt, patient]
    }
    setPatList(pt);
  }
  const getTransactionsList = async () => {
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
    var record = {}
    await fetch(`${process.env.REACT_APP_INFURA_DEDICATED_GATEWAY}/ipfs/${patient.record}`)
      .then(res => res.json())
      .then(data => record = data)
    await setPatientRecord(record);
    await setShowRecordModal(true);
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

      var record = {};
      try {
        const response = await fetch(`${process.env.REACT_APP_INFURA_DEDICATED_GATEWAY}/ipfs/${patient.record}`);
        if (response.ok) {
          record = await response.json();
        } else {
          console.warn("Failed to fetch existing record, starting fresh.");
          record = { treatments: [] }; // Fallback
        }
      } catch (err) {
        console.warn("Error fetching record:", err);
        record = { treatments: [] }; // Fallback
      }

      const date = new Date();
      const formattedDate = date.toLocaleString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit"
      });

      // Ensure record.treatments exists
      if (!record.treatments) record.treatments = [];

      record.treatments = [{ disease, treatment, charges, prescription: file, date: formattedDate, doctorEmail: doctor.email }, ...record.treatments];

      const recordBuffer = Buffer.from(JSON.stringify(record));

      const result = await ipfs.add(recordBuffer);
      if (!result || !result.path) throw new Error("Failed to upload record to IPFS");

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


  useEffect(() => {
    if (account === "") return window.location.href = '/login'
    if (!doctor) getDoctorData()
    if (patList.length === 0) getPatientAccessList();
    if (transactionsList.length === 0) getTransactionsList();
  }, [doctor, patList, transactionsList])


  if (!doctor) return <div className="text-center mt-5"><div className="spinner-border text-primary" role="status"></div></div>;

  return (
    <div className="fade-in">
      <div className="d-flex align-items-center justify-content-between mb-4">
        <h2 className="fw-bold text-primary">Doctor Workspace</h2>
        <span className="text-muted small">Welcome, Dr. {doctor.name}</span>
      </div>

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
              <Form.Control
                type="text"
                placeholder="Search by name or email..."
                className="form-control w-50"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
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
