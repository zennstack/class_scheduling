import React, { useEffect, useState } from 'react';
import api from '../utils/api';
import { Plus, Calendar, Clock, MapPin, User, Book, Trash2, Edit2, X, AlertCircle } from 'lucide-react';

export default function Home() {
  const [schedules, setSchedules] = useState([]);
  const [resources, setResources] = useState({ rooms: [], instructors: [], courses: [] });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    course: '',
    room: '',
    instructor: '',
    day_of_week: 'MON',
    start_time: '08:00',
    end_time: '09:00'
  });
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    fetchSchedules();
    fetchResources();
  }, []);

  const fetchSchedules = async () => {
    try {
      const response = await api.get('/schedules/');
      setSchedules(response.data);
    } catch (err) {
      console.error("Failed to load schedules", err);
    }
  };

  const fetchResources = async () => {
    try {
      const [rooms, inst, courses] = await Promise.all([
        api.get('/rooms/'), api.get('/instructors/'), api.get('/courses/')
      ]);
      setResources({ rooms: rooms.data, instructors: inst.data, courses: courses.data });
    } catch (err) {
      console.error("Failed to load resources", err);
    }
  };

  const handleOpenModal = (sched = null) => {
    if (sched) {
      setEditingId(sched.id);
      setFormData({
        course: sched.course.id,
        room: sched.room.id,
        instructor: sched.instructor.id,
        day_of_week: sched.day_of_week,
        start_time: sched.start_time.slice(0, 5),
        end_time: sched.end_time.slice(0, 5)
      });
    } else {
      setEditingId(null);
      setFormData({
        course: '',
        room: '',
        instructor: '',
        day_of_week: 'MON',
        start_time: '08:00',
        end_time: '09:00'
      });
    }
    setError('');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (editingId) {
        await api.put(`/schedules/${editingId}/`, formData);
      } else {
        await api.post('/schedules/', formData);
      }
      setIsModalOpen(false);
      fetchSchedules();
    } catch (err) {
      const errorData = err.response?.data;
      if (typeof errorData === 'object') {
        const firstError = Object.values(errorData)[0];
        setError(Array.isArray(firstError) ? firstError[0] : firstError);
      } else {
        setError('A conflict occurred. Please check room/instructor availability.');
      }
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this schedule?')) return;
    try {
      await api.delete(`/schedules/${id}/`);
      fetchSchedules();
    } catch (err) {
      console.error("Delete failed", err);
    }
  };

  const days = [
    { value: 'MON', label: 'Monday' },
    { value: 'TUE', label: 'Tuesday' },
    { value: 'WED', label: 'Wednesday' },
    { value: 'THU', label: 'Thursday' },
    { value: 'FRI', label: 'Friday' },
    { value: 'SAT', label: 'Saturday' },
    { value: 'SUN', label: 'Sunday' }
  ];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="text-gradient" style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>Class Scheduling</h1>
          <p className="text-muted">Orchestrate your academic calendar with precision.</p>
        </div>
        <button className="btn btn-primary bg-gradient" onClick={() => handleOpenModal()} style={{ gap: '0.5rem' }}>
          <Plus size={20} /> New Schedule
        </button>
      </div>

      <div className="grid-3" style={{ marginBottom: '2rem' }}>
        <div className="stat-card" style={{ borderLeft: '4px solid var(--primary)' }}>
          <div className="stat-icon"><Calendar size={24} /></div>
          <div>
            <p className="text-muted" style={{ fontSize: '0.875rem', fontWeight: 600 }}>Active Schedules</p>
            <h2 style={{ margin: 0, fontSize: '1.875rem' }}>{schedules.length}</h2>
          </div>
        </div>
        {/* Quick Tips Card */}
        <div className="stat-card" style={{ gridColumn: 'span 2', background: 'rgba(79, 70, 229, 0.02)' }}>
          <div className="stat-icon" style={{ background: 'rgba(79, 70, 229, 0.1)' }}><AlertCircle size={24} /></div>
          <div>
            <h4 style={{ marginBottom: '0.25rem' }}>Pro Tip</h4>
            <p className="text-muted" style={{ fontSize: '0.875rem', margin: 0 }}>The system automatically checks for room and instructor conflicts when you save a schedule.</p>
          </div>
        </div>
      </div>

      <div className="table-container animate-fade-in">
        <table className="table">
          <thead>
            <tr>
              <th>Course</th>
              <th>Time & Day</th>
              <th>Room</th>
              <th>Instructor</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {schedules.length === 0 ? (
              <tr>
                <td colSpan="5" style={{ textAlign: 'center', padding: '5rem', color: 'var(--text-muted)' }}>
                  <Calendar size={48} style={{ margin: '0 auto 1rem', opacity: 0.3 }} />
                  <p>No classes scheduled yet. Click "New Schedule" to begin.</p>
                </td>
              </tr>
            ) : (
              schedules.map(s => (
                <tr key={s.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <div className="stat-icon" style={{ width: '40px', height: '40px', borderRadius: '10px' }}><Book size={18} /></div>
                      <div>
                        <div style={{ fontWeight: 600 }}>{s.course.name}</div>
                        <div className="text-muted" style={{ fontSize: '0.75rem' }}>{s.course.code}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 500 }}>
                      <span className="badge badge-primary">{s.day_of_week}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.875rem' }}>
                        <Clock size={14} className="text-muted" />
                        {s.start_time.slice(0, 5)} - {s.end_time.slice(0, 5)}
                      </div>
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <MapPin size={16} className="text-muted" />
                      <span>{s.room.name}</span>
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <User size={16} className="text-muted" />
                      <span>{s.instructor.name}</span>
                    </div>
                  </td>
                  <td>
                    <div className="actions-row" style={{ justifyContent: 'flex-end' }}>
                      <button className="btn-icon" onClick={() => handleOpenModal(s)}><Edit2 size={16} /></button>
                      <button className="btn-icon danger" onClick={() => handleDelete(s.id)}><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <h2 style={{ margin: 0 }}>{editingId ? 'Edit Schedule' : 'Create New Schedule'}</h2>
              <button className="modal-close" onClick={() => setIsModalOpen(false)}><X size={20} /></button>
            </div>

            {error && (
              <div style={{ padding: '1rem', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', borderRadius: '8px', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.875rem' }}>
                <AlertCircle size={18} />
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="grid-3" style={{ gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label className="form-label">Course</label>
                  <select className="form-input" required value={formData.course} onChange={e => setFormData({ ...formData, course: e.target.value })}>
                    <option value="">Select a course...</option>
                    {resources.courses.map(c => <option key={c.id} value={c.id}>{c.code} - {c.name}</option>)}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Room</label>
                  <select className="form-input" required value={formData.room} onChange={e => setFormData({ ...formData, room: e.target.value })}>
                    <option value="">Select a room...</option>
                    {resources.rooms.map(r => <option key={r.id} value={r.id}>{r.name} (Cap: {r.capacity})</option>)}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Instructor</label>
                  <select className="form-input" required value={formData.instructor} onChange={e => setFormData({ ...formData, instructor: e.target.value })}>
                    <option value="">Select an instructor...</option>
                    {resources.instructors.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Day of Week</label>
                  <select className="form-input" required value={formData.day_of_week} onChange={e => setFormData({ ...formData, day_of_week: e.target.value })}>
                    {days.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Time Slot</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <input type="time" className="form-input" required value={formData.start_time} onChange={e => setFormData({ ...formData, start_time: e.target.value })} />
                    <span className="text-muted">to</span>
                    <input type="time" className="form-input" required value={formData.end_time} onChange={e => setFormData({ ...formData, end_time: e.target.value })} />
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' }}>
                <button type="button" className="btn btn-outline" onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary bg-gradient">Save Schedule</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
