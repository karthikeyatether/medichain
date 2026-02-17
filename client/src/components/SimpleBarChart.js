import React from 'react';

const SimpleBarChart = ({ data, title, color = "bg-primary" }) => {
    const maxVal = Math.max(...data.map(d => d.value), 10); // Avoid division by zero

    return (
        <div className="glass-card h-100">
            <h5 className="text-secondary mb-4">{title}</h5>
            <div className="d-flex align-items-end justify-content-around" style={{ height: '200px' }}>
                {data.map((item, index) => (
                    <div key={index} className="text-center w-100 px-2 group">
                        <div
                            className={`rounded-top ${color} mb-2 position-relative chart-bar`}
                            style={{
                                height: `${(item.value / maxVal) * 100}%`,
                                minHeight: '4px',
                                transition: 'height 1s ease-in-out',
                                opacity: 0.8
                            }}
                        >
                            <span className="position-absolute top-0 start-50 translate-middle badge bg-dark"
                                style={{ marginTop: '-25px' }}>
                                {item.value}
                            </span>
                        </div>
                        <small className="text-muted d-block text-truncate fw-bold">{item.label}</small>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default SimpleBarChart;
