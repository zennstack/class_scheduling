import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { Plus, Trash2, Users, Search, X, CheckSquare, Square, Shield } from 'lucide-react';
import ConfirmModal from '../components/ConfirmModal';
import { toast } from 'react-hot-toast';

export default function SectionManager() {
  const [sections, setSections] = useState([]);
  const [allStudents, setAllStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isStaff, setIsStaff] = useState(false);

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isManageStudentsOpen, setIsManageStudentsOpen] = useState(false);
  const [isViewStudentsOpen, setIsViewStudentsOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, id: null, name: '' });

  // Form state
  const [newSectionName, setNewSectionName] = useState('');
  const [selectedSection, setSelectedSection] = useState(null);
  const [studentSearchTerm, setStudentSearchTerm] = useState('');
  const [selectedStudentIds, setSelectedStudentIds] = useState([]);
  const [sectionSearchTerm, setSectionSearchTerm] = useState('');

  useEffect(() => {
    checkPermissionAndFetch();
  }, []);

  const checkPermissionAndFetch = async () => {
    try {
      setLoading(true);
      const profileRes = await api.get('/auth/profile/');
      setIsStaff(profileRes.data.is_staff);
      
      if (profileRes.data.is_staff) {
        await Promise.all([fetchSections(), fetchAllStudents()]);
      }
    } catch (err) {
      console.error("Failed to authenticate or load data", err);
      toast.error("Access denied or failed to load data.");
    } finally {
      setLoading(false);
    }
  };

  const fetchSections = async () => {
    try {
      const res = await api.get('/sections/');
      setSections(res.data);
    } catch (err) {
      console.error("Failed to fetch sections", err);
      toast.error("Failed to load sections.");
    }
  };

  const fetchAllStudents = async () => {
    try {
      const res = await api.get('/students/');
      setAllStudents(res.data);
    } catch (err) {
      console.error("Failed to fetch students", err);
      toast.error("Failed to load students.");
    }
  };

  const handleCreateSection = async (e) => {
    e.preventDefault();
    if (!newSectionName.trim()) {
      toast.error("Section name is required.");
      return;
    }
    try {
      await api.post('/sections/', { name: newSectionName.trim(), students: [] });
      toast.success(`Section "${newSectionName}" created successfully!`);
      setNewSectionName('');
      setIsCreateOpen(false);
      fetchSections();
    } catch (err) {
      console.error("Failed to create section", err);
      const errorMsg = err.response?.data?.name?.[0] || err.response?.data?.error || "Failed to create section.";
      toast.error(errorMsg);
    }
  };

  const handleDeleteSection = async () => {
    if (!deleteConfirm.id) return;
    try {
      await api.delete(`/sections/${deleteConfirm.id}/`);
      toast.success(`Section "${deleteConfirm.name}" deleted successfully.`);
      setDeleteConfirm({ isOpen: false, id: null, name: '' });
      fetchSections();
    } catch (err) {
      console.error("Failed to delete section", err);
      toast.error("Failed to delete section.");
    }
  };

  const handleOpenManageStudents = (section) => {
    setSelectedSection(section);
    // Populate with currently assigned student IDs
    setSelectedStudentIds(section.students || []);
    setStudentSearchTerm('');
    setIsManageStudentsOpen(true);
  };

  const handleToggleStudent = (studentId) => {
    setSelectedStudentIds(prev => 
      prev.includes(studentId)
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
  };

  const handleSaveStudents = async () => {
    try {
      await api.put(`/sections/${selectedSection.id}/`, {
        name: selectedSection.name,
        students: selectedStudentIds
      });
      toast.success(`Students updated for section "${selectedSection.name}".`);
      setIsManageStudentsOpen(false);
      setSelectedSection(null);
      fetchSections();
    } catch (err) {
      console.error("Failed to update section students", err);
      toast.error("Failed to update student assignments.");
    }
  };

  const handleOpenViewStudents = (section) => {
    setSelectedSection(section);
    setIsViewStudentsOpen(true);
  };

  // Filter students based on search term
  const filteredStudents = allStudents.filter(student => 
    student.name.toLowerCase().includes(studentSearchTerm.toLowerCase()) ||
    student.student_id.toLowerCase().includes(studentSearchTerm.toLowerCase()) ||
    student.email.toLowerCase().includes(studentSearchTerm.toLowerCase())
  );

  // Filter sections based on search term
  const filteredSections = sections.filter(section =>
    section.name.toLowerCase().includes(sectionSearchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <div className="text-muted">Loading Section Manager...</div>
      </div>
    );
  }

  if (!isStaff) {
    return (
      <div className="card" style={{ maxWidth: '500px', margin: '4rem auto', textAlign: 'center', padding: '3rem 2rem' }}>
        <div style={{ display: 'inline-flex', padding: '1rem', borderRadius: '50%', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', marginBottom: '1.5rem' }}>
          <Shield size={48} />
        </div>
        <h2 style={{ color: 'var(--danger)' }}>Access Denied</h2>
        <p className="text-muted" style={{ marginBottom: '1.5rem' }}>
          Only administrators and staff members are authorized to access the Section Management features.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="text-gradient" style={{ fontSize: '2.25rem', marginBottom: '0.5rem' }}>Section Management</h1>
          <p className="text-muted">Configure student sections and group enrollments.</p>
        </div>
        <button className="btn btn-primary bg-gradient" onClick={() => setIsCreateOpen(true)} style={{ gap: '0.5rem' }}>
          <Plus size={18} /> Create Section
        </button>
      </div>

      {/* Stats row */}
      <div className="grid-3" style={{ marginBottom: '2rem' }}>
        <div className="stat-card" style={{ borderLeft: '4px solid var(--primary)' }}>
          <div className="stat-icon"><Users size={24} /></div>
          <div>
            <p className="text-muted" style={{ fontSize: '0.875rem', fontWeight: 600 }}>Total Sections</p>
            <h2 style={{ margin: 0, fontSize: '1.875rem' }}>{sections.length}</h2>
          </div>
        </div>
        <div className="stat-card" style={{ borderLeft: '4px solid var(--success)' }}>
          <div className="stat-icon" style={{ background: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)' }}><Users size={24} /></div>
          <div>
            <p className="text-muted" style={{ fontSize: '0.875rem', fontWeight: 600 }}>Total Enrolled Students</p>
            <h2 style={{ margin: 0, fontSize: '1.875rem' }}>{allStudents.length}</h2>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="card" style={{ padding: '1rem 1.5rem', marginBottom: '1.5rem' }}>
        <div style={{ position: 'relative', width: '100%', maxWidth: '350px' }}>
          <input 
            type="text" 
            placeholder="Search sections by name..." 
            className="form-input" 
            style={{ paddingLeft: '2.5rem', marginBottom: 0 }}
            value={sectionSearchTerm}
            onChange={(e) => setSectionSearchTerm(e.target.value)}
          />
          <div style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
            <Search size={16} />
          </div>
        </div>
      </div>

      {/* Sections Cards Grid */}
      <div className="grid-3">
        {filteredSections.length === 0 ? (
          <div className="card" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
            <Users size={48} style={{ margin: '0 auto 1rem', opacity: 0.4 }} />
            <h3>No Sections Found</h3>
            <p>Get started by creating a new section to group your students.</p>
          </div>
        ) : filteredSections.map((sec) => (
          <div key={sec.id} className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '1.5rem', minHeight: '180px' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <span className="badge badge-primary" style={{ fontSize: '1rem', padding: '0.35rem 0.75rem', fontWeight: 600 }}>
                  {sec.name}
                </span>
                <button 
                  className="btn-icon danger" 
                  onClick={() => setDeleteConfirm({ isOpen: true, id: sec.id, name: sec.name })}
                  title="Delete Section"
                >
                  <Trash2 size={16} />
                </button>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '1.5rem', color: 'var(--text-muted)' }}>
                <Users size={16} />
                <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>
                  {sec.student_details?.length || 0} students assigned
                </span>
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
              <button 
                className="btn btn-outline" 
                style={{ flex: 1, padding: '0.5rem 1rem', fontSize: '0.8rem' }}
                onClick={() => handleOpenViewStudents(sec)}
              >
                View Students
              </button>
              <button 
                className="btn btn-primary" 
                style={{ flex: 1, padding: '0.5rem 1rem', fontSize: '0.8rem' }}
                onClick={() => handleOpenManageStudents(sec)}
              >
                Configure
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* CREATE SECTION MODAL */}
      {isCreateOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2 style={{ margin: 0 }}>Create Section</h2>
              <button className="modal-close" onClick={() => { setIsCreateOpen(false); setNewSectionName(''); }}><X size={20} /></button>
            </div>
            <form onSubmit={handleCreateSection}>
              <div className="form-group">
                <label className="form-label">Section Name</label>
                <input 
                  type="text" 
                  className="form-input" 
                  required 
                  value={newSectionName} 
                  onChange={e => setNewSectionName(e.target.value)} 
                  placeholder="e.g. IT3R1" 
                  autoFocus
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' }}>
                <button type="button" className="btn btn-outline" onClick={() => { setIsCreateOpen(false); setNewSectionName(''); }}>Cancel</button>
                <button type="submit" className="btn btn-primary">Create</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VIEW STUDENTS MODAL */}
      {isViewStudentsOpen && selectedSection && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <div>
                <h2 style={{ margin: 0 }}>Students in {selectedSection.name}</h2>
                <p className="text-muted" style={{ fontSize: '0.875rem', marginTop: '0.25rem' }}>
                  Total of {selectedSection.student_details?.length || 0} students
                </p>
              </div>
              <button className="modal-close" onClick={() => { setIsViewStudentsOpen(false); setSelectedSection(null); }}><X size={20} /></button>
            </div>
            
            <div style={{ maxHeight: '400px', overflowY: 'auto', border: '1px solid var(--border)', borderRadius: '8px' }}>
              {(!selectedSection.student_details || selectedSection.student_details.length === 0) ? (
                <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                  <Users size={32} style={{ margin: '0 auto 0.5rem', opacity: 0.5 }} />
                  <p>No students assigned to this section yet.</p>
                </div>
              ) : (
                <table className="table" style={{ margin: 0 }}>
                  <thead>
                    <tr>
                      <th style={{ padding: '0.75rem 1rem' }}>ID</th>
                      <th style={{ padding: '0.75rem 1rem' }}>Name</th>
                      <th style={{ padding: '0.75rem 1rem' }}>Email</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedSection.student_details.map(student => (
                      <tr key={student.id}>
                        <td style={{ padding: '0.75rem 1rem', fontSize: '0.85rem' }}><span className="badge badge-primary">{student.student_id}</span></td>
                        <td style={{ padding: '0.75rem 1rem', fontSize: '0.85rem', fontWeight: 600 }}>{student.name}</td>
                        <td style={{ padding: '0.75rem 1rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>{student.email}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '2rem' }}>
              <button className="btn btn-primary" onClick={() => { setIsViewStudentsOpen(false); setSelectedSection(null); }}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIGURE STUDENTS MODAL */}
      {isManageStudentsOpen && selectedSection && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '650px' }}>
            <div className="modal-header">
              <div>
                <h2 style={{ margin: 0 }}>Configure Section: {selectedSection.name}</h2>
                <p className="text-muted" style={{ fontSize: '0.875rem', marginTop: '0.25rem' }}>
                  Select students to enroll in this section ({selectedStudentIds.length} selected)
                </p>
              </div>
              <button className="modal-close" onClick={() => { setIsManageStudentsOpen(false); setSelectedSection(null); }}><X size={20} /></button>
            </div>

            {/* Search filter in modal */}
            <div style={{ position: 'relative', marginBottom: '1rem' }}>
              <input 
                type="text" 
                placeholder="Search students by name, ID, or email..." 
                className="form-input" 
                style={{ paddingLeft: '2.5rem', marginBottom: 0 }}
                value={studentSearchTerm}
                onChange={(e) => setStudentSearchTerm(e.target.value)}
              />
              <div style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
                <Search size={16} />
              </div>
            </div>

            {/* Select student checklist */}
            <div style={{ maxHeight: '350px', overflowY: 'auto', border: '1px solid var(--border)', borderRadius: '8px', padding: '0.5rem' }}>
              {filteredStudents.length === 0 ? (
                <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                  <p>No students found matching search criteria.</p>
                </div>
              ) : filteredStudents.map(student => {
                const isSelected = selectedStudentIds.includes(student.id);
                return (
                  <div 
                    key={student.id} 
                    onClick={() => handleToggleStudent(student.id)}
                    style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      padding: '0.75rem 1rem', 
                      borderRadius: '6px', 
                      cursor: 'pointer',
                      background: isSelected ? 'rgba(79, 70, 229, 0.05)' : 'transparent',
                      borderBottom: '1px solid var(--border)',
                      transition: 'background 0.2s'
                    }}
                  >
                    <div style={{ marginRight: '1rem', color: isSelected ? 'var(--primary)' : 'var(--text-muted)' }}>
                      {isSelected ? <CheckSquare size={20} /> : <Square size={20} />}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{student.name}</span>
                        <span className="badge badge-primary" style={{ fontSize: '0.7rem', padding: '0.1rem 0.4rem' }}>{student.student_id}</span>
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{student.email}</div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' }}>
              <button type="button" className="btn btn-outline" onClick={() => { setIsManageStudentsOpen(false); setSelectedSection(null); }}>Cancel</button>
              <button type="button" className="btn btn-primary" onClick={handleSaveStudents}>Save Enrollment</button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRM DELETE */}
      <ConfirmModal 
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, id: null, name: '' })}
        onConfirm={handleDeleteSection}
        title="Delete Section"
        message={`Are you sure you want to delete section "${deleteConfirm.name}"? This action only deletes the section organization. Students and classes will not be deleted, but the student lists for associated schedules will be unlinked.`}
      />
    </div>
  );
}
