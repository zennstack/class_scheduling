import React, { useEffect, useState } from 'react';
import api from '../utils/api';
import { Calendar as BigCalendar, dateFnsLocalizer } from 'react-big-calendar';
import format from 'date-fns/format';
import parse from 'date-fns/parse';
import startOfWeek from 'date-fns/startOfWeek';
import getDay from 'date-fns/getDay';
import enUS from 'date-fns/locale/en-US';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { Calendar, Clock, MapPin, User, Book, Edit3, Search, LayoutGrid, List, Info, Plus, Trash2, Users } from 'lucide-react';

const locales = { 'en-US': enUS };
const localizer = dateFnsLocalizer({ format, parse, startOfWeek, getDay, locales });

export default function ScheduleManager() {
  const [schedules, setSchedules] = useState([]);
  const [resources, setResources] = useState({ rooms: [], instructors: [], courses: [] });
  const [sections, setSections] = useState([]);
  const [isStaff, setIsStaff] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add' | 'edit'
  const [formData, setFormData] = useState({
    course: '',
    room: '',
    instructor: '',
    day_of_week: 'MON',
    start_time: '08:00',
    end_time: '09:00',
    class_type: 'LECTURE',
    section: 'IT3R1'
  });
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSectionFilter, setSelectedSectionFilter] = useState('ALL');
  const [viewMode, setViewMode] = useState('grid');
  const [calendarView, setCalendarView] = useState(window.innerWidth <= 768 ? 'day' : 'work_week');

  // Student List Modal state
  const [isStudentModalOpen, setIsStudentModalOpen] = useState(false);
  const [selectedScheduleForStudents, setSelectedScheduleForStudents] = useState(null);
  const [studentSearchTerm, setStudentSearchTerm] = useState('');

  const sectionsList = ['IT3R1', 'IT3R2', 'IT3R3', 'IT3R4', 'IT3R5', 'IT3R6', 'IT3R7', 'IT3R8', 'IT3R9', 'IT3R10'];

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
      const [rooms, inst, courses, sectionsRes, profileRes] = await Promise.all([
        api.get('/rooms/'), 
        api.get('/instructors/'), 
        api.get('/courses/'), 
        api.get('/sections/'),
        api.get('/auth/profile/')
      ]);
      setResources({ rooms: rooms.data, instructors: inst.data, courses: courses.data });
      setSections(sectionsRes.data);
      setIsStaff(profileRes.data.is_staff);
    } catch (err) {
      console.error("Failed to load resources", err);
    }
  };

  const handleAddClick = () => {
    setModalMode('add');
    setEditingId(null);
    setFormData({ course: '', room: '', instructor: '', day_of_week: 'MON', start_time: '08:00', end_time: '09:00', class_type: 'LECTURE', section: 'IT3R1' });
    setError('');
    setIsModalOpen(true);
  };

  const handleEditClick = (sched) => {
    setModalMode('edit');
    setEditingId(sched.id);
    setFormData({
      course: sched.course.id,
      room: sched.room ? sched.room.id : '',
      instructor: sched.instructor.id,
      day_of_week: sched.day_of_week,
      start_time: sched.start_time.slice(0, 5),
      end_time: sched.end_time.slice(0, 5),
      class_type: sched.class_type || 'LECTURE',
      section: sched.section || 'IT3R1'
    });
    setError('');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const payload = { ...formData };
      if (payload.class_type === 'ONLINE') {
        payload.room = null;
      }
      
      if (modalMode === 'add') {
        await api.post('/schedules/', payload);
      } else {
        await api.put(`/schedules/${editingId}/`, payload);
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
    if (window.confirm("Are you sure you want to delete this schedule?")) {
      try {
        await api.delete(`/schedules/${id}/`);
        fetchSchedules();
      } catch (err) {
        console.error("Failed to delete schedule", err);
        alert("Failed to delete schedule.");
      }
    }
  };

  const filteredSchedules = schedules.filter(s => {
    const matchesSearch = s.course.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.course.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.instructor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.section && s.section.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesSection = selectedSectionFilter === 'ALL' || s.section === selectedSectionFilter;
    
    return matchesSearch && matchesSection;
  });

  // Calendar Event Mapping
  const dayMap = { 'SUN': 0, 'MON': 1, 'TUE': 2, 'WED': 3, 'THU': 4, 'FRI': 5, 'SAT': 6 };
  const events = filteredSchedules.map(s => {
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
      title: `${s.course.name} (${s.section || 'IT3R1'})`,
      start,
      end,
      resource: {
        room: s.class_type === 'ONLINE' ? 'Online' : (s.room ? s.room.name : 'TBA'),
        instructor: s.instructor.name
      }
    };
  });

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
        
        <div className="header-actions flex gap-4 items-center">
          <div className="view-toggle" style={{ padding: '0.25rem', display: 'flex', gap: '2px', border: '1px solid var(--border)', borderRadius: '8px' }}>
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
          {isStaff && (
            <button onClick={handleAddClick} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
              <Plus size={18} /> Add Schedule
            </button>
          )}
        </div>
      </div>

      {/* TOP SECTION: Resource Management */}
      <div className="card filter-row">
        <div className="filter-search-container">
          <Search className="text-muted" size={20} />
          <input 
            type="text" 
            placeholder="Search by course, code, section, or instructor..." 
            className="form-input" 
            style={{ border: 'none', padding: '0.5rem', boxShadow: 'none', margin: 0 }}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="filter-select-container">
          <span className="text-muted" style={{ fontSize: '0.85rem', whiteSpace: 'nowrap' }}>Section:</span>
          <select 
            className="form-input" 
            style={{ width: '130px', padding: '0.35rem 0.5rem', marginBottom: 0 }}
            value={selectedSectionFilter}
            onChange={(e) => setSelectedSectionFilter(e.target.value)}
          >
            <option value="ALL">All Sections</option>
            {(sections.length > 0 ? sections.map(s => s.name) : sectionsList).map(sec => (
              <option key={sec} value={sec}>{sec}</option>
            ))}
          </select>
        </div>
      </div>

      <div style={{ maxHeight: '420px', overflowY: 'auto', marginBottom: '3rem', paddingRight: '0.5rem' }}>
        {viewMode === 'grid' ? (
          <div className="grid-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
            {filteredSchedules.map((sched) => (
              <div key={sched.id} className="card stat-card" style={{ flexDirection: 'column', alignItems: 'flex-start', padding: '1.25rem', position: 'relative' }}>
                {isStaff && (
                  <div style={{ position: 'absolute', top: '1.25rem', right: '1.25rem', display: 'flex', gap: '0.5rem' }}>
                    <button onClick={() => handleEditClick(sched)} className="btn-icon" title="Edit Schedule">
                      <Edit3 size={16} />
                    </button>
                    <button onClick={() => handleDelete(sched.id)} className="btn-icon" style={{ color: '#ef4444' }} title="Delete Schedule">
                      <Trash2 size={16} />
                    </button>
                  </div>
                )}
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
                  <span className="badge badge-primary">{sched.course.code}</span>
                  <span className="badge badge-success" style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.2)' }}>{sched.section || 'IT3R1'}</span>
                </div>
                <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', paddingRight: '2rem' }}>{sched.course.name}</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', width: '100%', fontSize: '0.85rem' }}>
                  <div className="flex items-center gap-2 text-muted">
                    <User size={14} className="text-primary" /> {sched.instructor.name}
                  </div>
                  <div className="flex items-center gap-2 text-muted">
                    <MapPin size={14} className="text-primary" /> {sched.class_type === 'ONLINE' ? 'Online' : `Room: ${sched.room ? sched.room.name : 'TBA'}`}
                  </div>
                  <div className="flex items-center gap-2 text-muted" style={{ fontWeight: 500 }}>
                    <Users size={14} className="text-primary" /> Enrolled: {sched.students?.length ?? 0} Students
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', width: '100%', marginTop: '1.25rem' }}>
                  <button 
                    onClick={() => {
                      setSelectedScheduleForStudents(sched);
                      setStudentSearchTerm('');
                      setIsStudentModalOpen(true);
                    }}
                    className="btn btn-outline" 
                    style={{ flex: 1, fontSize: '0.8rem', padding: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem' }}
                  >
                    <Users size={14} /> View Students
                  </button>
                  {isStaff && (
                    <button 
                      onClick={() => handleEditClick(sched)}
                      className="btn btn-primary" 
                      style={{ fontSize: '0.8rem', padding: '0.5rem 0.75rem' }}
                    >
                      Reassign
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Course</th>
                  <th>Section</th>
                  <th>Instructor</th>
                  <th>Location</th>
                  <th>Time Slot</th>
                  <th>Enrolled</th>
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
                    <td>
                      <span className="badge badge-success" style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.2)' }}>{sched.section || 'IT3R1'}</span>
                    </td>
                    <td>{sched.instructor.name}</td>
                    <td>{sched.class_type === 'ONLINE' ? <span className="badge badge-primary">Online</span> : (sched.room ? sched.room.name : 'TBA')}</td>
                    <td>{sched.day_of_week} {sched.start_time.slice(0, 5)}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Users size={16} className="text-muted" />
                        <span>{sched.students?.length ?? 0}</span>
                      </div>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                        <button 
                          onClick={() => {
                            setSelectedScheduleForStudents(sched);
                            setStudentSearchTerm('');
                            setIsStudentModalOpen(true);
                          }}
                          className="btn btn-outline" 
                          style={{ padding: '0.4rem 0.8rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                        >
                          <Users size={14} /> Students
                        </button>
                        {isStaff && (
                          <>
                            <button onClick={() => handleEditClick(sched)} className="btn btn-outline" style={{ padding: '0.4rem 0.8rem' }}>
                              Edit
                            </button>
                            <button onClick={() => handleDelete(sched.id)} className="btn btn-outline" style={{ padding: '0.4rem 0.8rem', color: '#ef4444', borderColor: '#ef4444' }}>
                              Delete
                            </button>
                          </>
                        )}
                      </div>
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
            if (!isStaff) return;
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
              <h2 style={{ margin: 0 }}>{modalMode === 'add' ? 'Add New Schedule' : 'Assign Resources'}</h2>
              <button className="modal-close" onClick={() => setIsModalOpen(false)}>×</button>
            </div>
            
            <p className="text-muted mb-4" style={{ fontSize: '0.9rem' }}>
              {modalMode === 'add'
                ? 'Create a new schedule entry by filling in all fields below.'
                : <>Modify the assignment for <strong>{schedules.find(s => s.id === editingId)?.course.name}</strong>.</>}
            </p>

            <form onSubmit={handleSubmit}>
              {modalMode === 'add' && (
                <div className="form-group">
                  <label className="form-label">Course</label>
                  <select
                    className="form-input"
                    value={formData.course}
                    onChange={e => setFormData({...formData, course: e.target.value})}
                    required
                  >
                    <option value="">Select Course</option>
                    {resources.courses.map(c => (
                      <option key={c.id} value={c.id}>{c.name} ({c.code})</option>
                    ))}
                  </select>
                </div>
              )}
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
                <label className="form-label">Section</label>
                <select 
                  className="form-input"
                  value={formData.section}
                  onChange={e => setFormData({...formData, section: e.target.value})}
                  required
                >
                  {(sections.length > 0 ? sections.map(s => s.name) : sectionsList).map(sec => (
                    <option key={sec} value={sec}>{sec}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Class Type</label>
                <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                    <input 
                      type="radio" 
                      name="class_type"
                      value="LECTURE"
                      checked={formData.class_type === 'LECTURE'}
                      onChange={e => setFormData({...formData, class_type: e.target.value})}
                    />
                    Lecture (In-Person)
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                    <input 
                      type="radio" 
                      name="class_type"
                      value="ONLINE"
                      checked={formData.class_type === 'ONLINE'}
                      onChange={e => setFormData({...formData, class_type: e.target.value})}
                    />
                    Online
                  </label>
                </div>
              </div>
              {formData.class_type === 'LECTURE' && (
                <div className="form-group">
                  <label className="form-label">Room</label>
                  <select 
                    className="form-input"
                    value={formData.room || ''}
                    onChange={e => setFormData({...formData, room: e.target.value})}
                    required={formData.class_type === 'LECTURE'}
                  >
                    <option value="">Select Room</option>
                    {resources.rooms.map(rm => (
                      <option key={rm.id} value={rm.id}>{rm.name} (Cap: {rm.capacity})</option>
                    ))}
                  </select>
                </div>
              )}

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
                <button type="submit" className="btn btn-primary" style={{ flex: 2 }}>
                  {modalMode === 'add' ? 'Create Schedule' : 'Update Assignment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Student List Modal */}
      {isStudentModalOpen && selectedScheduleForStudents && (
        <div className="modal-overlay" onClick={() => setIsStudentModalOpen(false)}>
          <div className="modal-content" style={{ maxWidth: '600px', width: '90%', maxHeight: '85vh', display: 'flex', flexDirection: 'column', padding: '2rem' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header" style={{ paddingBottom: '1rem', borderBottom: '1px solid var(--border)' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Users className="text-primary" size={24} /> Enrolled Student List
                </h2>
                <p className="text-muted" style={{ fontSize: '0.85rem', marginTop: '0.25rem' }}>
                  {selectedScheduleForStudents.course.name} ({selectedScheduleForStudents.course.code}) • Section: <strong>{selectedScheduleForStudents.section || 'IT3R1'}</strong>
                </p>
              </div>
              <button className="modal-close" onClick={() => setIsStudentModalOpen(false)} style={{ fontSize: '2rem', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>×</button>
            </div>

            {/* Search Input for Students */}
            <div className="form-group" style={{ marginTop: '1.5rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem', border: '1px solid var(--border)', borderRadius: '8px', padding: '0.25rem 0.75rem' }}>
              <Search className="text-muted" size={16} />
              <input 
                type="text" 
                placeholder="Search students by name or ID..." 
                className="form-input" 
                style={{ border: 'none', padding: '0.5rem 0', boxShadow: 'none', flex: 1 }}
                value={studentSearchTerm}
                onChange={(e) => setStudentSearchTerm(e.target.value)}
              />
            </div>

            {/* Student Count Badge */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', fontSize: '0.85rem' }}>
              <span className="text-muted">Officially Enrolled:</span>
              <span className="badge badge-primary" style={{ fontWeight: 600 }}>{selectedScheduleForStudents.students?.length ?? 0} Students</span>
            </div>

            {/* Scrollable Student Table */}
            <div style={{ flex: 1, overflowY: 'auto', border: '1px solid var(--border)', borderRadius: '12px', minHeight: '200px' }}>
              <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead style={{ position: 'sticky', top: 0, backgroundColor: '#f8fafc', zIndex: 1, borderBottom: '2px solid var(--border)' }}>
                  <tr>
                    <th style={{ textAlign: 'left', padding: '0.75rem 1rem' }}>ID</th>
                    <th style={{ textAlign: 'left', padding: '0.75rem 1rem' }}>Name</th>
                    <th style={{ textAlign: 'left', padding: '0.75rem 1rem' }}>Email</th>
                    <th style={{ textAlign: 'left', padding: '0.75rem 1rem' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {(selectedScheduleForStudents.students || []).filter(student => 
                    student.name.toLowerCase().includes(studentSearchTerm.toLowerCase()) ||
                    student.student_id.toLowerCase().includes(studentSearchTerm.toLowerCase())
                  ).length > 0 ? (
                    (selectedScheduleForStudents.students || [])
                      .filter(student => 
                        student.name.toLowerCase().includes(studentSearchTerm.toLowerCase()) ||
                        student.student_id.toLowerCase().includes(studentSearchTerm.toLowerCase())
                      )
                      .map(student => (
                        <tr key={student.id} style={{ borderBottom: '1px solid var(--border)' }}>
                          <td style={{ padding: '0.75rem 1rem', fontSize: '0.85rem', fontWeight: 600, color: 'var(--primary)' }}>{student.student_id}</td>
                          <td style={{ padding: '0.75rem 1rem', fontSize: '0.85rem', fontWeight: 500 }}>{student.name}</td>
                          <td style={{ padding: '0.75rem 1rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>{student.email}</td>
                          <td style={{ padding: '0.75rem 1rem', fontSize: '0.85rem' }}>
                            <span className="badge badge-success" style={{ fontSize: '0.7rem', padding: '2px 8px', backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.2)', borderRadius: '6px', fontWeight: 600 }}>Enrolled</span>
                          </td>
                        </tr>
                      ))
                  ) : (
                    <tr>
                      <td colSpan="4" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                        No students found matching your search.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end' }}>
              <button className="btn btn-primary" onClick={() => setIsStudentModalOpen(false)} style={{ padding: '0.6rem 1.5rem' }}>
                Close Directory
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
