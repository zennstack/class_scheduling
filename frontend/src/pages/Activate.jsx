import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../utils/api';

export default function Activate() {
  const { uid, token } = useParams();
  const [status, setStatus] = useState('verifying');
  const [errorMsg, setErrorMsg] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const verify = async () => {
      try {
        await api.post(`/auth/activate/${uid}/${token}/`);
        setStatus('success');
        setTimeout(() => navigate('/login'), 3000);
      } catch (err) {
        setStatus('error');
        setErrorMsg(err.response?.data?.error || 'Invalid or expired link.');
      }
    };
    if (uid && token) {
      verify();
    } else {
      setStatus('error');
      setErrorMsg('Invalid activation link.');
    }
  }, [uid, token, navigate]);

  return (
    <div className="auth-container">
      <div className="auth-card" style={{ textAlign: 'center' }}>
        <h2 style={{ marginBottom: '1.5rem' }}>Account Activation</h2>
        
        {status === 'verifying' && (
          <div style={{ color: 'var(--text-muted)' }}>
            <p>Verifying your email address...</p>
          </div>
        )}
        
        {status === 'success' && (
          <div style={{ color: 'var(--success)' }}>
            <p>Your account has been successfully verified!</p>
            <p style={{ fontSize: '0.875rem', marginTop: '0.5rem' }}>Redirecting to login...</p>
          </div>
        )}
        
        {status === 'error' && (
          <div>
            <p style={{ color: 'var(--danger)', marginBottom: '1.5rem' }}>{errorMsg}</p>
            <Link to="/login" className="btn btn-primary">Go to Login</Link>
          </div>
        )}
      </div>
    </div>
  );
}
