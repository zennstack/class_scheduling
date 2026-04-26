import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { 
  Users, 
  DoorOpen, 
  BookOpen, 
  Calendar, 
  ArrowRight, 
  PlusCircle, 
  Activity,
  Clock,
  MapPin,
  ChevronRight
} from 'lucide-react';

export default function Home() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    classes: 0,
    rooms: 0,
    instructors: 0,
    courses: 0
  });
  const [todayClasses, setTodayClasses] = useState([]);
  const [recentSchedules, setRecentSchedules] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [schedules, rooms, instructors, courses] = await Promise.all([
        api.get('/schedules/'),
        api.get('/rooms/'),
        api.get('/instructors/'),
        api.get('/courses/')
      ]);

      setStats({
        classes: schedules.data.length,
        rooms: rooms.data.length,
        instructors: instructors.data.length,
        courses: courses.data.length
      });

      // Filter for today's classes
      const days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
      const today = days[new Date().getDay()];
      const todayList = schedules.data
        .filter(s => s.day_of_week === today)
        .sort((a, b) => a.start_time.localeCompare(b.start_time));
      
      setTodayClasses(todayList);
      setRecentSchedules(schedules.data.slice(-5).reverse()); // Last 5 created/updated

    } catch (err) {
      console.error("Failed to load dashboard data", err);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ icon: Icon, label, value, color }) => (
    <div className="card stat-card" style={{ borderLeft: `4px solid ${color}` }}>
      <div className="stat-icon" style={{ backgroundColor: `${color}15`, color: color }}>
        <Icon size={24} />
      </div>
      <div>
        <p className="text-muted" style={{ fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</p>
        <h2 style={{ margin: 0, fontSize: '1.75rem' }}>{value}</h2>
      </div>
    </div>
  );

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="page-header" style={{ marginBottom: '2.5rem' }}>
        <div>
          <h1 className="text-gradient" style={{ fontSize: '2.75rem', marginBottom: '0.5rem' }}>Executive Overview</h1>
          <p className="text-muted">Welcome back! Here is what's happening in your academy today.</p>
        </div>
        <button onClick={() => navigate('/manage')} className="btn btn-primary" style={{ gap: '0.5rem' }}>
          Go to Scheduling Hub <ArrowRight size={18} />
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid-3" style={{ marginBottom: '2.5rem' }}>
        <StatCard icon={BookOpen} label="Total Classes" value={stats.classes} color="#4f46e5" />
        <StatCard icon={DoorOpen} label="Active Rooms" value={stats.rooms} color="#10b981" />
        <StatCard icon={Users} label="Faculty Members" value={stats.instructors} color="#f59e0b" />
      </div>

      <div className="profile-grid">
        {/* Left Column: Today's Timeline & Events */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', minWidth: 0 }}>

          
          {/* Today's Schedule List */}
          <div className="card">
            <div className="flex justify-between items-center mb-4">
              <h3 className="flex items-center gap-2" style={{ margin: 0 }}>
                <Clock className="text-primary" size={20} /> Today's Timeline
              </h3>
              <span className="badge badge-primary">{todayClasses.length} Classes</span>
            </div>

            {todayClasses.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {todayClasses.map((item, idx) => (
                  <div key={item.id} className="flex items-center gap-4 p-4" style={{ backgroundColor: '#f8fafc', borderRadius: '12px', border: '1px solid var(--border)' }}>
                    <div style={{ minWidth: '80px', textAlign: 'center', borderRight: '2px solid var(--border)', paddingRight: '1rem' }}>
                      <div style={{ fontWeight: 700, color: 'var(--primary)' }}>{item.start_time.slice(0, 5)}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{item.end_time.slice(0, 5)}</div>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600 }}>{item.course.name}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', gap: '1rem' }}>
                         <span className="flex items-center gap-1"><MapPin size={12} /> {item.room.name}</span>
                         <span className="flex items-center gap-1"><Users size={12} /> {item.instructor.name}</span>
                      </div>
                    </div>
                    <ChevronRight className="text-muted" size={20} />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-muted p-8 text-center" style={{ border: '2px dashed var(--border)', borderRadius: '12px' }}>
                No classes scheduled for today.
              </div>
            )}
          </div>

          {/* Event Feed (Recent Activity) */}
          <div className="card">
            <h3 className="flex items-center gap-2 mb-4">
              <Activity className="text-primary" size={20} /> Event Activity Log
            </h3>
            <div className="table-container" style={{ border: 'none', boxShadow: 'none' }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>Event</th>
                    <th>Assignment</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentSchedules.map((s) => (
                    <tr key={s.id}>
                      <td>
                        <div style={{ fontWeight: 600 }}>{s.course.code}</div>
                        <div style={{ fontSize: '0.75rem' }} className="text-muted">{s.course.name}</div>
                      </td>
                      <td>
                        <div style={{ fontSize: '0.85rem' }}>{s.instructor.name} in {s.room.name}</div>
                        <div style={{ fontSize: '0.75rem' }} className="text-muted">{s.day_of_week} at {s.start_time.slice(0, 5)}</div>
                      </td>
                      <td><span className="badge badge-success">Active</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column: Quick Actions & Distribution */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          {/* Quick Actions */}
          <div className="card bg-gradient" style={{ padding: '2rem' }}>
            <h3 style={{ color: 'white', marginBottom: '1.5rem' }}>Quick Actions</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <button onClick={() => navigate('/resources')} className="btn" style={{ backgroundColor: 'rgba(255,255,255,0.2)', color: 'white', justifyContent: 'flex-start', gap: '1rem' }}>
                <PlusCircle size={20} /> Add New Course
              </button>
              <button onClick={() => navigate('/resources')} className="btn" style={{ backgroundColor: 'rgba(255,255,255,0.2)', color: 'white', justifyContent: 'flex-start', gap: '1rem' }}>
                <DoorOpen size={20} /> Register New Room
              </button>
              <button onClick={() => navigate('/resources')} className="btn" style={{ backgroundColor: 'rgba(255,255,255,0.2)', color: 'white', justifyContent: 'flex-start', gap: '1rem' }}>
                <Users size={20} /> Onboard Instructor
              </button>
            </div>
          </div>

          {/* Room Distribution Visualization */}
          <div className="card">
            <h3 className="mb-4">Room Utilization</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {stats.rooms > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                    <span>Capacity Status</span>
                    <span className="text-primary font-bold">{Math.round((stats.classes / (stats.rooms * 5)) * 100)}%</span>
                  </div>
                  <div style={{ width: '100%', height: '8px', backgroundColor: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ 
                      width: `${Math.min(100, (stats.classes / (stats.rooms * 5)) * 100)}%`, 
                      height: '100%', 
                      backgroundColor: 'var(--primary)',
                      transition: 'width 1s ease-out'
                    }}></div>
                  </div>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Based on an average of 5 slots per room per day.
                  </p>
                </div>
              ) : (
                <p className="text-muted">No rooms registered yet.</p>
              )}
            </div>
          </div>

          {/* Info Card */}
          <div className="card" style={{ backgroundColor: '#eff6ff', borderColor: '#bfdbfe' }}>
             <div className="flex gap-3">
                <Calendar className="text-primary" size={24} />
                <div>
                  <h4 style={{ margin: 0, color: '#1e40af' }}>Academic Tip</h4>
                  <p style={{ fontSize: '0.85rem', color: '#1e3a8a', marginTop: '0.5rem' }}>
                    Peak scheduling hours are between 10:00 AM and 2:00 PM. Consider spreading classes to the early morning to improve room availability.
                  </p>
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
