import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';
import api from '../utils/api';

export default function Activate() {
  const { token } = useParams();
  const [status, setStatus] = useState('verifying');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const verify = async () => {
      try {
        await api.get(`/auth/verify-email/${token}/`);
        setStatus('success');
      } catch (err) {
        setStatus('error');
        setErrorMsg(err.response?.data?.error || 'Invalid or expired link.');
      }
    };
    if (token) {
      verify();
    } else {
      setStatus('error');
      setErrorMsg('Invalid activation link.');
    }
  }, [token]);

  return (
    <div className="auth-container">
      <div className="auth-card" style={{ textAlign: 'center', padding: '3rem 2rem' }}>
        
        {status === 'verifying' && (
          <div className="animate-fade-in">
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem', color: 'var(--primary)' }}>
              <Loader2 size={64} className="animate-spin" style={{ animation: 'spin 2s linear infinite' }} />
            </div>
            <h2 style={{ marginBottom: '1rem' }}>Verifying Account</h2>
            <p style={{ color: 'var(--text-muted)' }}>Please wait while we securely verify your email address...</p>
            <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
          </div>
        )}
        
        {status === 'success' && (
          <div className="animate-fade-in">
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem', color: 'var(--success)' }}>
              <CheckCircle2 size={64} />
            </div>
            <h2 style={{ marginBottom: '1rem' }}>Account Verified!</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>
              Your email has been successfully verified. You now have full access to PlanClass.
            </p>
            <Link to="/login" className="btn btn-primary" style={{ width: '100%' }}>
              Continue to Login
            </Link>
          </div>
        )}
        
        {status === 'error' && (
          <div className="animate-fade-in">
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem', color: 'var(--danger)' }}>
              <XCircle size={64} />
            </div>
            <h2 style={{ marginBottom: '1rem' }}>Verification Failed</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
              {errorMsg}
            </p>
            <div style={{ padding: '1rem', backgroundColor: 'rgba(239, 68, 68, 0.05)', borderRadius: '8px', marginBottom: '2rem' }}>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-main)' }}>
                This link might have expired or has already been used. Please try registering again or contact support.
              </p>
            </div>
            <Link to="/register" className="btn btn-outline" style={{ width: '100%' }}>
              Back to Registration
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
