import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import api from '../utils/api';

export default function Register() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isRegistered, setIsRegistered] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();

    try {
      await api.post('/auth/register/', { username, password, email });

      toast.success('Registration successful! You can now log in.', {
        style: {
          borderRadius: '10px',
          background: '#333',
          color: '#fff'
        }
      });

      navigate('/login');

    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed');
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">

        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <img
            src="/logo.png"
            alt="PlanClass Logo"
            style={{ width: '64px', height: '64px', borderRadius: '12px' }}
          />
        </div>

        <h2 style={{ textAlign: 'center', marginBottom: '2rem' }}>
          Create Account
        </h2>

        {error && (
          <div
            style={{
              color: 'var(--danger)',
              marginBottom: '1rem',
              textAlign: 'center'
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleRegister}>

          <div className="form-group">
            <label className="form-label">Username</label>

            <input
              className="form-input"
              value={username}
              onChange={e => setUsername(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Email</label>

            <input
              type="email"
              className="form-input"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>

            <input
              type={showPassword ? 'text' : 'password'}
              className="form-input"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />

            <div style={{ marginTop: '0.5rem' }}>
              <label style={{ fontSize: '0.875rem', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={showPassword}
                  onChange={() => setShowPassword(!showPassword)}
                  style={{ marginRight: '0.5rem' }}
                />
                Show Password
              </label>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', marginTop: '1rem' }}
          >
            Register
          </button>

        </form>

        <p
          style={{
            textAlign: 'center',
            marginTop: '1.5rem',
            fontSize: '0.875rem'
          }}
        >
          Already have an account?{' '}
          <Link to="/login" style={{ color: 'var(--primary)' }}>
            Log In
          </Link>
        </p>

      </div>
    </div>
  );
}