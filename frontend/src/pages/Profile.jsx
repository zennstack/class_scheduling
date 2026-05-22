import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { 
  User, 
  Mail, 
  Lock, 
  CheckCircle, 
  AlertCircle, 
  LogOut, 
  Shield, 
  Bell, 
  Settings, 
  Database,
  ChevronRight,
  UserCheck,
  Moon,
  Sun,
  Globe,
  Monitor
} from 'lucide-react';

export default function Profile() {
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState({ schedules: 0, courses: 0 });
  const [loading, setLoading] = useState(true);
  const [passwordData, setPasswordData] = useState({ old_password: '', new_password: '', confirm_password: '' });
  const [message, setMessage] = useState({ type: '', text: '' });
  const navigate = useNavigate();

  // Settings State
  const [isDarkMode, setIsDarkMode] = useState(localStorage.getItem('theme') === 'dark');
  const [language, setLanguage] = useState(localStorage.getItem('lang') || 'English');

  useEffect(() => {
    fetchProfileData();
    // Apply theme on load
    if (isDarkMode) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
  }, [isDarkMode]);

  const toggleDarkMode = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    localStorage.setItem('theme', newMode ? 'dark' : 'light');
    document.body.classList.toggle('dark-mode');
  };

  const handleLanguageChange = (e) => {
    const newLang = e.target.value;
    setLanguage(newLang);
    localStorage.setItem('lang', newLang);
  };

  const fetchProfileData = async () => {
    try {
      setLoading(true);
      const [profRes, schedRes, courseRes] = await Promise.all([
        api.get('/auth/profile/'),
        api.get('/schedules/'),
        api.get('/courses/')
      ]);
      setProfile(profRes.data);
      setStats({
        schedules: schedRes.data.length,
        courses: courseRes.data.length
      });
    } catch (err) {
      console.error("Failed to load profile data", err);
    } finally {
      setLoading(false);
    }
  };

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
    sessionStorage.removeItem('access_token');
    sessionStorage.removeItem('refresh_token');
    navigate('/login');
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="animate-spin text-primary"><Settings size={40} /></div>
    </div>
  );

  return (
    <div className="animate-fade-in" style={{ maxWidth: '1000px', margin: '0 auto' }}>
      
      {/* Header Profile Section */}
      <div className="card" style={{ padding: 0, overflow: 'hidden', border: 'none', marginBottom: '2rem' }}>
        <div className="bg-gradient" style={{ height: '140px' }}></div>
        <div style={{ padding: '0 2rem 2rem', marginTop: '-60px', textAlign: 'center' }}>
          <div style={{ 
            width: '120px', 
            height: '120px', 
            borderRadius: '50%', 
            backgroundColor: 'var(--surface)', 
            margin: '0 auto 1.5rem',
            padding: '4px',
            boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
          }}>
            <div style={{ 
              width: '100%', 
              height: '100%', 
              borderRadius: '50%', 
              backgroundColor: 'rgba(79, 70, 229, 0.1)', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              color: 'var(--primary)'
            }}>
              <User size={60} />
            </div>
          </div>
          <h1 style={{ marginBottom: '0.25rem' }}>{profile?.username}</h1>
          <p className="text-muted" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
            <Mail size={16} /> {profile?.email}
          </p>
          
          <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem', marginTop: '1.5rem' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontWeight: 700, fontSize: '1.25rem' }}>{stats.schedules}</div>
              <div className="text-muted" style={{ fontSize: '0.8rem', textTransform: 'uppercase' }}>Schedules</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontWeight: 700, fontSize: '1.25rem' }}>{stats.courses}</div>
              <div className="text-muted" style={{ fontSize: '0.8rem', textTransform: 'uppercase' }}>Courses</div>
            </div>
          </div>
        </div>
      </div>

      <div className="profile-grid">
        
        {/* Settings Groups */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', minWidth: 0 }}>
          <div className="card">
            <h3 style={{ fontSize: '1.1rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Monitor size={18} className="text-primary" /> App Appearance
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* Dark Mode Toggle */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem 0' }}>
                <div className="flex items-center gap-3">
                  {isDarkMode ? <Moon size={20} className="text-primary" /> : <Sun size={20} className="text-primary" />}
                  <span>Dark Mode</span>
                </div>
                <div 
                  onClick={toggleDarkMode}
                  style={{ 
                    width: '50px', 
                    height: '26px', 
                    backgroundColor: isDarkMode ? 'var(--primary)' : '#e2e8f0', 
                    borderRadius: '13px', 
                    position: 'relative', 
                    cursor: 'pointer',
                    transition: 'background-color 0.2s'
                  }}
                >
                  <div style={{ 
                    width: '20px', 
                    height: '20px', 
                    backgroundColor: 'white', 
                    borderRadius: '50%', 
                    position: 'absolute', 
                    top: '3px', 
                    left: isDarkMode ? '27px' : '3px',
                    transition: 'left 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                  }}></div>
                </div>
              </div>

              {/* Language Selector */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem 0' }}>
                <div className="flex items-center gap-3">
                  <Globe size={20} className="text-primary" />
                  <span>Language</span>
                </div>
                <select 
                  className="form-input" 
                  style={{ width: 'auto', padding: '0.25rem 0.5rem', fontSize: '0.85rem', border: 'none', backgroundColor: 'transparent', fontWeight: 600, color: 'var(--text-main)' }}
                  value={language}
                  onChange={handleLanguageChange}
                >
                  <option value="English">English</option>
                  <option value="Spanish">Español</option>
                  <option value="French">Français</option>
                  <option value="Tagalog">Tagalog</option>
                </select>
              </div>
            </div>
          </div>

          <div className="card">
             <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>Notifications</h3>
             <div className="flex items-center justify-between py-2">
                <div className="flex items-center gap-3">
                  <Bell size={18} className="text-primary" />
                  <span>Email Alerts</span>
                </div>
                <ChevronRight size={16} className="text-muted" />
             </div>
          </div>
        </div>

        {/* Change Password Card */}
        <div className="card">
          <div className="flex items-center gap-3 mb-6">
            <div className="stat-icon" style={{ width: '40px', height: '40px' }}><Lock size={20} /></div>
            <h3 style={{ margin: 0 }}>Security Center</h3>
          </div>

          {message.text && (
            <div className={`badge ${message.type === 'success' ? 'badge-success' : 'badge-danger'}`} style={{ width: '100%', marginBottom: '1.5rem', padding: '1rem', borderRadius: '12px', gap: '0.75rem' }}>
              {message.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
              {message.text}
            </div>
          )}

          <form onSubmit={handlePasswordChange}>
            <div className="form-group">
              <label className="form-label">Current Password</label>
              <div style={{ position: 'relative' }}>
                <input 
                  type="password" 
                  className="form-input" 
                  style={{ paddingLeft: '2.75rem' }}
                  required 
                  value={passwordData.old_password} 
                  onChange={e => setPasswordData({...passwordData, old_password: e.target.value})} 
                />
                <Lock size={16} className="text-muted" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
              </div>
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
              <label className="form-label">Confirm Password</label>
              <input 
                type="password" 
                className="form-input" 
                required 
                value={passwordData.confirm_password} 
                onChange={e => setPasswordData({...passwordData, confirm_password: e.target.value})} 
              />
            </div>

            <button type="submit" className="btn btn-primary bg-gradient" style={{ width: '100%', marginTop: '0.5rem', padding: '1rem' }}>
              Save Security Changes
            </button>
          </form>

          <div style={{ marginTop: '2rem', padding: '1rem', backgroundColor: 'rgba(16, 185, 129, 0.05)', borderRadius: '12px', display: 'flex', gap: '1rem', alignItems: 'center', border: '1px solid rgba(16, 185, 129, 0.1)' }}>
             <UserCheck size={24} className="text-success" />
             <div style={{ fontSize: '0.85rem' }}>
               <div style={{ fontWeight: 600 }}>Account Verification</div>
               <div className="text-muted">Your account is fully verified and secure.</div>
             </div>
          </div>
        </div>
      </div>

      {/* Logout at the very bottom */}
      <div style={{ marginTop: '3rem', marginBottom: '2rem' }}>
        <button 
          onClick={handleLogout} 
          className="btn btn-outline danger-hover" 
          style={{ 
            width: '100%', 
            gap: '0.75rem', 
            padding: '1.25rem', 
            borderRadius: '16px', 
            borderWidth: '2px',
            fontSize: '1rem'
          }}
        >
          <LogOut size={20} /> Log Out of PlanClass
        </button>
        <p className="text-muted" style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.75rem' }}>
          Version 1.2.0 • Build 2026.04
        </p>
      </div>
    </div>
  );
}
