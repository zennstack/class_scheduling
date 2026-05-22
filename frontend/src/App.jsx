import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import MobileNav from './components/MobileNav';
import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home';
import Resources from './pages/Resources';
import Activate from './pages/Activate';
import SectionManager from './pages/SectionManager';

import Profile from './pages/Profile';
import ScheduleManager from './pages/ScheduleManager';
import { Toaster, toast } from 'react-hot-toast';
import { useWebSocket } from './utils/useWebSocket';
import { getWebSocketURL } from './utils/api';

const WS_URL = getWebSocketURL();

const ProtectedRoute = ({ children }) => {
  const token = sessionStorage.getItem('access_token');
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return (
    <div className="app-container">
      <Sidebar />
      <main className="main-content">
        {children}
      </main>
      <MobileNav />
    </div>
  );
};

export default function App() {
  const { lastMessage } = useWebSocket(WS_URL);

  React.useEffect(() => {
    if (lastMessage && lastMessage.type === 'schedule_notification') {
      const message = lastMessage.message;
      if (lastMessage.action === 'deleted') {
        toast.error(message, { style: { borderRadius: '10px', background: '#333', color: '#fff' } });
      } else {
        toast.success(message, { style: { borderRadius: '10px', background: '#333', color: '#fff' } });
      }
    }
  }, [lastMessage]);

  React.useEffect(() => {
    const theme = localStorage.getItem('theme');
    if (theme === 'dark') {
      document.body.classList.add('dark-mode');
    }
  }, []);

  return (
    <BrowserRouter>
      <Toaster position="top-right" />

      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/verify-email/:token" element={<Activate />} />
        
        <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
        <Route path="/resources" element={<ProtectedRoute><Resources /></ProtectedRoute>} />
        <Route path="/sections" element={<ProtectedRoute><SectionManager /></ProtectedRoute>} />

        <Route path="/manage" element={<ProtectedRoute><ScheduleManager /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />

      </Routes>
    </BrowserRouter>
  );
}
