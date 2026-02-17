import React, { createContext, useContext, useState, useCallback } from 'react';
import { Toast, ToastContainer } from 'react-bootstrap';

const ToastContext = createContext();

export const useToast = () => {
    return useContext(ToastContext);
};

export const ToastProvider = ({ children }) => {
    const [toasts, setToasts] = useState([]);

    const addToast = useCallback((message, variant = 'info') => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, message, variant }]);
        // Auto remove after 3 seconds
        setTimeout(() => {
            removeToast(id);
        }, 3000);
    }, []);

    const removeToast = (id) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    };

    return (
        <ToastContext.Provider value={addToast}>
            {children}
            <ToastContainer position="top-end" className="p-3" style={{ zIndex: 9999, position: 'fixed' }}>
                {toasts.map(toast => (
                    <Toast
                        key={toast.id}
                        onClose={() => removeToast(toast.id)}
                        show={true}
                        delay={3000}
                        autohide
                        bg={toast.variant}
                        className="text-white shadow-lg border-0"
                    >
                        <Toast.Header closeButton={false} className={`justify-content-between bg-${toast.variant} text-white border-0`}>
                            <strong className="me-auto">MediChain Notification</strong>
                            <button type="button" className="btn-close btn-close-white" onClick={() => removeToast(toast.id)}></button>
                        </Toast.Header>
                        <Toast.Body className="fw-bold">{toast.message}</Toast.Body>
                    </Toast>
                ))}
            </ToastContainer>
        </ToastContext.Provider>
    );
};
