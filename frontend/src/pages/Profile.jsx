import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { User, Mail, Lock, CheckCircle, AlertCircle, LogOut } from 'lucide-react';

export default function Profile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [passwordData, setPasswordData] = useState({ old_password: '', new_password: '', confirm_password: '' });
  const [message, setMessage] = useState({ type: '', text: '' });
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await api.get('/auth/profile/');
        setProfile(response.data);
      } catch (err) {
        console.error("Failed to load profile", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (passwordData.new_password !== passwordData.confirm_password) {
      setMessage({ type: 'error', text: 'New passwords do not match.' });
      return;
    }

    try {
      await api.post('/auth/change-password/', {
        old_password: passwordData.old_password,
        new_password: passwordData.new_password
      });
      setMessage({ type: 'success', text: 'Password updated successfully!' });
      setPasswordData({ old_password: '', new_password: '', confirm_password: '' });
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.old_password?.[0] || 'Failed to update password.' });
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('username');
    navigate('/login');
  };

  if (loading) return <div className="text-muted">Loading profile...</div>;

  return (
    <div className="profile-container" style={{ maxWidth: '800px', margin: '0 auto' }}>
      <h1 className="text-gradient" style={{ fontSize: '2.25rem', marginBottom: '2rem' }}>User Profile</h1>
      
      <div className="profile-grid">
        <div className="card profile-info-card">
          <div className="profile-avatar">
            <User size={48} />
          </div>
          <h2 style={{ marginBottom: '0.25rem' }}>{profile?.username}</h2>
          <p className="text-muted" style={{ marginBottom: '2rem' }}>{profile?.email}</p>
          
          <button onClick={handleLogout} className="btn btn-outline danger-hover" style={{ width: '100%', gap: '0.5rem' }}>
            <LogOut size={18} /> Logout
          </button>
        </div>

        <div className="card profile-settings-card">
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
            <Lock size={20} /> Change Password
          </h3>

          {message.text && (
            <div style={{ 
              padding: '1rem', 
              borderRadius: '8px', 
              marginBottom: '1.5rem', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.75rem',
              backgroundColor: message.type === 'success' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
              color: message.type === 'success' ? 'var(--success)' : 'var(--danger)'
            }}>
              {message.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
              {message.text}
            </div>
          )}

          <form onSubmit={handlePasswordChange}>
            <div className="form-group">
              <label className="form-label">Current Password</label>
              <input 
                type="password" 
                className="form-input" 
                required 
                value={passwordData.old_password} 
                onChange={e => setPasswordData({...passwordData, old_password: e.target.value})} 
              />
            </div>
            <div className="form-group">
              <label className="form-label">New Password</label>
              <input 
                type="password" 
                className="form-input" 
                required 
                value={passwordData.new_password} 
                onChange={e => setPasswordData({...passwordData, new_password: e.target.value})} 
              />
            </div>
            <div className="form-group">
              <label className="form-label">Confirm New Password</label>
              <input 
                type="password" 
                className="form-input" 
                required 
                value={passwordData.confirm_password} 
                onChange={e => setPasswordData({...passwordData, confirm_password: e.target.value})} 
              />
            </div>
            <button type="submit" className="btn btn-primary bg-gradient" style={{ width: '100%', marginTop: '1rem' }}>
              Update Password
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
