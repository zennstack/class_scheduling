import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { Plus, Edit2, Trash2, MapPin, Users, BookOpen, X } from 'lucide-react';
import ConfirmModal from '../components/ConfirmModal';

export default function Resources() {
  const [activeTab, setActiveTab] = useState('rooms');
  const [data, setData] = useState({ rooms: [], instructors: [], courses: [] });
  const [isStaff, setIsStaff] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [users, setUsers] = useState([]);
  const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, id: null });

  useEffect(() => {
    fetchData();
    fetchUsers();
  }, []);

  const fetchData = async () => {
    try {
      const [rm, inst, crs, profileRes] = await Promise.all([
        api.get('/rooms/'), api.get('/instructors/'), api.get('/courses/'), api.get('/auth/profile/')
      ]);
      setData({ rooms: rm.data, instructors: inst.data, courses: crs.data });
      setIsStaff(profileRes.data.is_staff);
    } catch (err) {
      console.error("Failed to load resources", err);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await api.get('/users/');
      setUsers(response.data);
    } catch (err) {
      console.error("Failed to load users", err);
    }
  };

  const tabs = [
    { id: 'rooms', label: 'Rooms', icon: <MapPin size={18} /> },
    { id: 'instructors', label: 'Instructors', icon: <Users size={18} /> },
    { id: 'courses', label: 'Courses', icon: <BookOpen size={18} /> }
  ];

  const handleOpenModal = (item = null) => {
    setEditingItem(item);
    setFormData(item ? { ...item } : {});
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingItem(null);
    setFormData({});
  };

  const handleDelete = async () => {
    if (!deleteConfirm.id) return;
    try {
      await api.delete(`/${activeTab}/${deleteConfirm.id}/`);
      fetchData();
    } catch (err) {
      console.error('Failed to delete', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingItem) {
        await api.put(`/${activeTab}/${editingItem.id}/`, formData);
      } else {
        await api.post(`/${activeTab}/`, formData);
      }
      handleCloseModal();
      fetchData();
    } catch (err) {
      console.error('Failed to save', err);
    }
  };

  const filteredData = (data[activeTab] || []).filter(item => {
    const search = searchTerm.toLowerCase();
    if (activeTab === 'rooms') return item.name.toLowerCase().includes(search);
    if (activeTab === 'instructors') return (item.name || '').toLowerCase().includes(search) || item.department.toLowerCase().includes(search);
    if (activeTab === 'courses') return item.code.toLowerCase().includes(search) || item.name.toLowerCase().includes(search);
    return true;
  });

  const renderStats = () => (
    <div className="grid-3">
      <div className="stat-card" style={{borderLeft: '4px solid var(--primary)'}}>
        <div className="stat-icon"><MapPin size={24} /></div>
        <div>
          <p className="text-muted" style={{fontSize: '0.875rem', fontWeight: 600}}>Total Rooms</p>
          <h2 style={{margin: 0, fontSize: '1.875rem'}}>{data.rooms.length}</h2>
        </div>
      </div>
      <div className="stat-card" style={{borderLeft: '4px solid var(--success)'}}>
        <div className="stat-icon" style={{background: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)'}}><Users size={24} /></div>
        <div>
          <p className="text-muted" style={{fontSize: '0.875rem', fontWeight: 600}}>Total Instructors</p>
          <h2 style={{margin: 0, fontSize: '1.875rem'}}>{data.instructors.length}</h2>
        </div>
      </div>
      <div className="stat-card" style={{borderLeft: '4px solid #f59e0b'}}>
        <div className="stat-icon" style={{background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b'}}><BookOpen size={24} /></div>
        <div>
          <p className="text-muted" style={{fontSize: '0.875rem', fontWeight: 600}}>Total Courses</p>
          <h2 style={{margin: 0, fontSize: '1.875rem'}}>{data.courses.length}</h2>
        </div>
      </div>
    </div>
  );

  const renderTable = () => {
    const isRooms = activeTab === 'rooms';
    const isInstructors = activeTab === 'instructors';
    const isCourses = activeTab === 'courses';

    return (
      <div className="table-container animate-fade-in">
        <div style={{padding: '1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
          <div style={{position: 'relative', width: '100%', maxWidth: '300px'}}>
            <input 
              type="text" 
              placeholder={`Search ${activeTab}...`} 
              className="form-input" 
              style={{paddingLeft: '2.5rem', marginBottom: 0}}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <div style={{position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)'}}>
              <BookOpen size={16} />
            </div>
          </div>
          <p className="text-muted" style={{fontSize: '0.875rem'}}>Showing {filteredData.length} items</p>
        </div>
        <table className="table">
          <thead>
            <tr>
              {isRooms && <><th>Name</th><th>Capacity</th></>}
              {isInstructors && <><th>Full Name</th><th>Account</th><th>Department</th></>}
              {isCourses && <><th>Code</th><th>Name</th></>}
              {isStaff && <th style={{width: '100px', textAlign: 'right'}}>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {filteredData.length === 0 ? (
              <tr>
                <td colSpan="5" style={{textAlign: 'center', padding: '5rem', color: 'var(--text-muted)'}}>
                  <div style={{opacity: 0.5, marginBottom: '1rem'}}><BookOpen size={48} style={{margin: '0 auto'}} /></div>
                  <p>No {activeTab} found matching your search.</p>
                </td>
              </tr>
            ) : filteredData.map((item) => (
              <tr key={item.id}>
                {isRooms && (
                  <>
                    <td style={{fontWeight: 600}}>{item.name}</td>
                    <td><span className="badge badge-primary">{item.capacity} seats</span></td>
                  </>
                )}
                {isInstructors && (
                  <>
                    <td style={{fontWeight: 600}}>
                      <div style={{display: 'flex', alignItems: 'center', gap: '0.75rem'}}>
                        <div style={{width: '32px', height: '32px', borderRadius: '50%', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700}}>
                          {item.name ? item.name.charAt(0) : 'I'}
                        </div>
                        {item.name}
                      </div>
                    </td>
                    <td>{item.user_details ? (
                      <span className="badge badge-primary">{item.user_details.username}</span>
                    ) : (
                      <span className="text-muted" style={{fontSize: '0.75rem'}}>No Account Linked</span>
                    )}</td>
                    <td>{item.department}</td>
                  </>
                )}
                {isCourses && (
                  <>
                    <td style={{fontWeight: 600}}><span className="badge badge-success" style={{padding: '0.25rem 0.5rem'}}>{item.code}</span></td>
                    <td>{item.name}</td>
                  </>
                )}
                {isStaff && (
                  <td>
                    <div className="actions-row" style={{justifyContent: 'flex-end'}}>
                      <button className="btn-icon" onClick={() => handleOpenModal(item)} title="Edit">
                        <Edit2 size={16} />
                      </button>
                      <button className="btn-icon danger" onClick={() => setDeleteConfirm({ isOpen: true, id: item.id })} title="Delete">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const renderModal = () => {
    if (!isModalOpen) return null;

    const isRooms = activeTab === 'rooms';
    const isInstructors = activeTab === 'instructors';
    const isCourses = activeTab === 'courses';

    return (
      <div className="modal-overlay">
        <div className="modal-content">
          <div className="modal-header">
            <h2 style={{margin: 0}}>{editingItem ? 'Edit' : 'Add'} {activeTab.slice(0, -1)}</h2>
            <button className="modal-close" onClick={handleCloseModal}><X size={20} /></button>
          </div>
          <form onSubmit={handleSubmit}>
            {isRooms && (
              <>
                <div className="form-group">
                  <label className="form-label">Room Name</label>
                  <input type="text" className="form-input" required value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="e.g. 101" />
                </div>
                <div className="form-group">
                  <label className="form-label">Capacity</label>
                  <input type="number" className="form-input" required value={formData.capacity || ''} onChange={e => setFormData({...formData, capacity: e.target.value})} placeholder="e.g. 30" />
                </div>
              </>
            )}
            {isInstructors && (
              <>
                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <input type="text" className="form-input" required value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="e.g. John Doe" />
                </div>
                <div className="form-group">
                  <label className="form-label">Linked User (ID)</label>
                  <select 
                    className="form-input" 
                    value={formData.user || ''} 
                    onChange={e => setFormData({...formData, user: e.target.value})}
                  >
                    <option value="">-- No Account Linked --</option>
                    {users.map(u => (
                      <option key={u.id} value={u.id}>{u.username} ({u.email})</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Department</label>
                  <input type="text" className="form-input" required value={formData.department || ''} onChange={e => setFormData({...formData, department: e.target.value})} placeholder="e.g. Computer Science" />
                </div>
              </>
            )}
            {isCourses && (
              <>
                <div className="form-group">
                  <label className="form-label">Course Code</label>
                  <input type="text" className="form-input" required value={formData.code || ''} onChange={e => setFormData({...formData, code: e.target.value})} placeholder="e.g. CS101" />
                </div>
                <div className="form-group">
                  <label className="form-label">Course Name</label>
                  <input type="text" className="form-input" required value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="e.g. Intro to Programming" />
                </div>
              </>
            )}
            <div style={{display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem'}}>
              <button type="button" className="btn btn-outline" onClick={handleCloseModal}>Cancel</button>
              <button type="submit" className="btn btn-primary">Save Changes</button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="text-gradient" style={{fontSize: '2.25rem', marginBottom: '0.5rem'}}>Resource Dashboard</h1>
          <p className="text-muted">Manage all your academic resources in one place.</p>
        </div>
        {isStaff && (
          <button className="btn btn-primary bg-gradient" onClick={() => handleOpenModal()} style={{gap: '0.5rem'}}>
            <Plus size={18} /> Add New {activeTab.slice(0, -1)}
          </button>
        )}
      </div>

      {renderStats()}

      <div className="tabs">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
            style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {renderTable()}
      {renderModal()}
      
      <ConfirmModal 
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, id: null })}
        onConfirm={handleDelete}
        title={`Delete ${activeTab.slice(0, -1)}`}
        message={`Are you sure you want to delete this ${activeTab.slice(0, -1)}? This will remove all associated data and cannot be undone.`}
      />
    </div>
  );
}
