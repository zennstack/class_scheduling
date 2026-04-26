import React from 'react';
import { X, AlertTriangle } from 'lucide-react';

export default function ConfirmModal({ isOpen, onClose, onConfirm, title, message, confirmText = 'Delete', type = 'danger' }) {
  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <div className="modal-overlay" style={{ zIndex: 1100 }}>
      <div className="modal-content" style={{ maxWidth: '400px', textAlign: 'center' }}>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '-1.5rem' }}>
          <button className="modal-close" onClick={onClose}><X size={20} /></button>
        </div>
        
        <div style={{ 
          width: '64px', 
          height: '64px', 
          borderRadius: '50%', 
          background: type === 'danger' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(245, 158, 11, 0.1)', 
          color: type === 'danger' ? 'var(--danger)' : '#f59e0b',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 1.5rem'
        }}>
          <AlertTriangle size={32} />
        </div>

        <h2 style={{ marginBottom: '0.75rem', fontSize: '1.5rem' }}>{title}</h2>
        <p className="text-muted" style={{ marginBottom: '2rem', fontSize: '1rem' }}>
          {message}
        </p>

        <div style={{ display: 'flex', gap: '1rem' }}>
          <button 
            type="button" 
            className="btn btn-outline" 
            onClick={onClose}
            style={{ flex: 1 }}
          >
            Cancel
          </button>
          <button 
            type="button" 
            className={`btn ${type === 'danger' ? 'btn-danger' : 'btn-primary'} bg-gradient`} 
            onClick={handleConfirm}
            style={{ flex: 1, background: type === 'danger' ? 'var(--danger)' : '' }}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
