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
      const { action, course, day, start_time, end_time, room, section, message } = lastMessage;

      // Build a rich notification message
      let richMessage = message;
      if (course && day) {
        const timeRange = start_time && end_time ? ` · ${start_time}–${end_time}` : '';
        const roomInfo = room ? ` · ${room}` : '';
        const sectionInfo = section ? ` [${section}]` : '';
        richMessage = `${course}${sectionInfo} — ${day}${timeRange}${roomInfo}`;
      }

      const toastStyle = {
        borderRadius: '10px',
        background: '#1e1e2e',
        color: '#cdd6f4',
        border: '1px solid rgba(205,214,244,0.15)',
        fontSize: '0.875rem',
        maxWidth: '380px',
      };

      if (action === 'deleted') {
        toast.error(`🗑 Deleted: ${richMessage}`, { style: toastStyle, duration: 6000 });
      } else if (action === 'added') {
        toast.success(`📅 New Schedule: ${richMessage}`, { style: toastStyle, duration: 6000 });
      } else {
        toast(`✏️ Updated: ${richMessage}`, { style: toastStyle, duration: 6000, icon: '🔔' });
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
