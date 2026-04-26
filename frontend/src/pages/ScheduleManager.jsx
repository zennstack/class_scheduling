import React, { useEffect, useState } from 'react';
import api from '../utils/api';
import { Calendar as BigCalendar, dateFnsLocalizer } from 'react-big-calendar';
import format from 'date-fns/format';
import parse from 'date-fns/parse';
import startOfWeek from 'date-fns/startOfWeek';
import getDay from 'date-fns/getDay';
import enUS from 'date-fns/locale/en-US';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { Calendar, Clock, MapPin, User, Book, Edit3, Search, LayoutGrid, List, Info } from 'lucide-react';

const locales = { 'en-US': enUS };
const localizer = dateFnsLocalizer({ format, parse, startOfWeek, getDay, locales });

export default function ScheduleManager() {
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
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('grid');
  const [calendarView, setCalendarView] = useState(window.innerWidth <= 768 ? 'day' : 'work_week');

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

  const handleEditClick = (sched) => {
    setEditingId(sched.id);
    setFormData({
      course: sched.course.id,
      room: sched.room.id,
      instructor: sched.instructor.id,
      day_of_week: sched.day_of_week,
      start_time: sched.start_time.slice(0, 5),
      end_time: sched.end_time.slice(0, 5)
    });
    setError('');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api.put(`/schedules/${editingId}/`, formData);
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

  // Calendar Event Mapping
  const dayMap = { 'SUN': 0, 'MON': 1, 'TUE': 2, 'WED': 3, 'THU': 4, 'FRI': 5, 'SAT': 6 };
  const events = schedules.map(s => {
    const now = new Date();
    const currentDay = now.getDay();
    const targetDay = dayMap[s.day_of_week];
    let diff = targetDay - currentDay;
    
    const targetDate = new Date();
    targetDate.setDate(now.getDate() + diff);
    
    const [startH, startM] = s.start_time.split(':');
    const [endH, endM] = s.end_time.split(':');
    
    const start = new Date(targetDate);
    start.setHours(parseInt(startH), parseInt(startM), 0);
    
    const end = new Date(targetDate);
    end.setHours(parseInt(endH), parseInt(endM), 0);

    return {
      id: s.id,
      title: s.course.name,
      start,
      end,
      resource: {
        room: s.room.name,
        instructor: s.instructor.name
      }
    };
  });

  const filteredSchedules = schedules.filter(s => 
    s.course.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.course.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.instructor.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const EventComponent = ({ event }) => (
    <div style={{ fontSize: '0.75rem', lineHeight: '1.2' }}>
      <div style={{ fontWeight: 700 }}>{event.title}</div>
      <div style={{ opacity: 0.8 }}>{event.resource.room} • {event.resource.instructor}</div>
    </div>
  );

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="text-gradient" style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>Scheduling Hub</h1>
          <p className="text-muted">Manage assignments and view the interactive timetable.</p>
        </div>
        
        <div className="flex gap-4 items-center">
          <div className="table-container" style={{ padding: '0.25rem', display: 'flex', gap: '2px', border: 'none' }}>
             <button 
              onClick={() => setViewMode('grid')}
              className={`btn-icon ${viewMode === 'grid' ? 'active' : ''}`}
              style={{ backgroundColor: viewMode === 'grid' ? 'rgba(79, 70, 229, 0.1)' : 'transparent', color: viewMode === 'grid' ? 'var(--primary)' : 'inherit' }}
            >
              <LayoutGrid size={20} />
            </button>
            <button 
              onClick={() => setViewMode('list')}
              className={`btn-icon ${viewMode === 'list' ? 'active' : ''}`}
              style={{ backgroundColor: viewMode === 'list' ? 'rgba(79, 70, 229, 0.1)' : 'transparent', color: viewMode === 'list' ? 'var(--primary)' : 'inherit' }}
            >
              <List size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* TOP SECTION: Resource Management */}
      <div className="card" style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem' }}>
        <Search className="text-muted" size={20} />
        <input 
          type="text" 
          placeholder="Search by course, code, or instructor..." 
          className="form-input" 
          style={{ border: 'none', padding: '0.5rem', boxShadow: 'none' }}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div style={{ maxHeight: '400px', overflowY: 'auto', marginBottom: '3rem', paddingRight: '0.5rem' }}>
        {viewMode === 'grid' ? (
          <div className="grid-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
            {filteredSchedules.map((sched) => (
              <div key={sched.id} className="card stat-card" style={{ flexDirection: 'column', alignItems: 'flex-start', padding: '1.25rem', position: 'relative' }}>
                <div style={{ position: 'absolute', top: '1.25rem', right: '1.25rem' }}>
                  <button onClick={() => handleEditClick(sched)} className="btn-icon">
                    <Edit3 size={16} />
                  </button>
                </div>
                <div className="badge badge-primary" style={{ marginBottom: '0.75rem' }}>{sched.course.code}</div>
                <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', paddingRight: '2rem' }}>{sched.course.name}</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', width: '100%', fontSize: '0.85rem' }}>
                  <div className="flex items-center gap-2 text-muted">
                    <User size={14} className="text-primary" /> {sched.instructor.name}
                  </div>
                  <div className="flex items-center gap-2 text-muted">
                    <MapPin size={14} className="text-primary" /> Room: {sched.room.name}
                  </div>
                </div>
                <button 
                  onClick={() => handleEditClick(sched)}
                  className="btn btn-outline" 
                  style={{ width: '100%', marginTop: '1.25rem', fontSize: '0.8rem', padding: '0.5rem' }}
                >
                  Quick Reassign
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Course</th>
                  <th>Instructor</th>
                  <th>Location</th>
                  <th>Time Slot</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredSchedules.map((sched) => (
                  <tr key={sched.id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{sched.course.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{sched.course.code}</div>
                    </td>
                    <td>{sched.instructor.name}</td>
                    <td>{sched.room.name}</td>
                    <td>{sched.day_of_week} {sched.start_time.slice(0, 5)}</td>
                    <td style={{ textAlign: 'right' }}>
                      <button onClick={() => handleEditClick(sched)} className="btn btn-outline" style={{ padding: '0.4rem 0.8rem' }}>
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* BOTTOM SECTION: Visual Calendar */}
      <div className="page-header" style={{ marginBottom: '1rem' }}>
        <div className="flex items-center gap-2">
          <Calendar className="text-primary" size={24} />
          <h2 style={{ margin: 0 }}>Visual Timetable</h2>
        </div>
      </div>
      
      <div className="card" style={{ height: '700px', padding: '1.5rem' }}>
        <BigCalendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          view={calendarView}
          onView={(newView) => setCalendarView(newView)}
          views={['work_week', 'day', 'agenda']}
          components={{
            event: EventComponent
          }}
          onSelectEvent={(event) => {
            const sched = schedules.find(s => s.id === event.id);
            if (sched) handleEditClick(sched);
          }}
          style={{ height: '100%' }}
        />
      </div>

      {/* Reassignment Modal */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 style={{ margin: 0 }}>Assign Resources</h2>
              <button className="modal-close" onClick={() => setIsModalOpen(false)}>×</button>
            </div>
            
            <p className="text-muted mb-4" style={{ fontSize: '0.9rem' }}>
              Modify the assignment for <strong>{schedules.find(s => s.id === editingId)?.course.name}</strong>.
            </p>

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Instructor</label>
                <select 
                  className="form-input"
                  value={formData.instructor}
                  onChange={e => setFormData({...formData, instructor: e.target.value})}
                  required
                >
                  <option value="">Select Instructor</option>
                  {resources.instructors.map(inst => (
                    <option key={inst.id} value={inst.id}>{inst.name} ({inst.department})</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Room</label>
                <select 
                  className="form-input"
                  value={formData.room}
                  onChange={e => setFormData({...formData, room: e.target.value})}
                  required
                >
                  <option value="">Select Room</option>
                  {resources.rooms.map(rm => (
                    <option key={rm.id} value={rm.id}>{rm.name} (Cap: {rm.capacity})</option>
                  ))}
                </select>
              </div>

              <div className="grid-3" style={{ gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Day</label>
                  <select 
                    className="form-input"
                    value={formData.day_of_week}
                    onChange={e => setFormData({...formData, day_of_week: e.target.value})}
                  >
                    <option value="MON">Mon</option>
                    <option value="TUE">Tue</option>
                    <option value="WED">Wed</option>
                    <option value="THU">Thu</option>
                    <option value="FRI">Fri</option>
                    <option value="SAT">Sat</option>
                  </select>
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Start</label>
                  <input 
                    type="time" 
                    className="form-input"
                    value={formData.start_time}
                    onChange={e => setFormData({...formData, start_time: e.target.value})}
                  />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">End</label>
                  <input 
                    type="time" 
                    className="form-input"
                    value={formData.end_time}
                    onChange={e => setFormData({...formData, end_time: e.target.value})}
                  />
                </div>
              </div>

              {error && (
                <div className="badge badge-danger" style={{ width: '100%', marginBottom: '1rem', borderRadius: '8px', padding: '1rem' }}>
                  {error}
                </div>
              )}

              <div className="flex gap-4">
                <button type="button" className="btn btn-outline" style={{ flex: 1 }} onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 2 }}>Update Assignment</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
