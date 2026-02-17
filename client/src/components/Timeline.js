import React from 'react';

const Timeline = ({ treatments }) => {
    return (
        <div className="timeline-container">
            {treatments.length > 0 ? (
                treatments.map((item, index) => (
                    <div className="timeline-item" key={index}>
                        <div className="timeline-marker"></div>
                        <div className="timeline-content glass-card p-3">
                            <div className="d-flex justify-content-between align-items-start mb-2">
                                <div>
                                    <h5 className="mb-1 fw-bold text-primary">{item.disease}</h5>
                                    <small className="text-muted d-block mb-1">
                                        <i className="bi bi-calendar-event me-1"></i>
                                        {item.date}
                                    </small>
                                </div>
                                <span className="badge bg-light text-primary border">
                                    Dr. {item.doctorEmail.split('@')[0]}
                                </span>
                            </div>

                            <div className="timeline-body mb-3">
                                <p className="mb-0 text-dark small">{item.treatment}</p>
                            </div>

                            {item.prescription && (
                                <div className="timeline-footer border-top pt-2">
                                    <a
                                        href={`${process.env.REACT_APP_INFURA_DEDICATED_GATEWAY}/ipfs/${item.prescription}`}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="btn btn-sm btn-outline-secondary rounded-pill"
                                    >
                                        View Prescription 📄
                                    </a>
                                </div>
                            )}
                        </div>
                    </div>
                ))
            ) : (
                <div className="text-center text-muted py-5">
                    <p>No medical history available on the blockchain.</p>
                </div>
            )}
        </div>
    );
};

export default Timeline;
