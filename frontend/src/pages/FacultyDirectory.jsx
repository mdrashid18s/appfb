/**
 * @file FacultyDirectory.jsx
 * @description Master Faculty & Academic Directory Page.
 * Single unified page for managing faculty members, departments, master subjects & subject assignments.
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './FacultyDirectory.module.css';
import { 
  GraduationCap, 
  Search, 
  X, 
  ArrowLeft, 
  BookOpen, 
  Award, 
  Plus, 
  Check, 
  Trash2,
  Edit2,
  FolderPlus,
  BookPlus,
  UserPlus
} from 'lucide-react';
import { useToast } from '../contexts/ToastContext';

export default function FacultyDirectory({ embedded = false }) {
  const navigate = useNavigate();
  const toast = useToast();

  const [teachers, setTeachers] = useState([]);
  const [courses, setCourses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selectedDept, setSelectedDept] = useState('ALL');
  const [search, setSearch] = useState('');

  // Modals state
  const [showAddFacultyModal, setShowAddFacultyModal] = useState(false);
  const [editingFaculty, setEditingFaculty] = useState(null); // null if creating, teacher object if editing
  const [facultyForm, setFacultyForm] = useState({ name: '', designation: 'Senior Specialist Tutor', department: '' });

  const [showAddDeptModal, setShowAddDeptModal] = useState(false);
  const [deptForm, setDeptForm] = useState({ name: '', code: '' });

  const [showAddSubjectModal, setShowAddSubjectModal] = useState(false);
  const [subjectForm, setSubjectForm] = useState({ name: '', department: '' });

  // Assign Subject Modal state
  const [assigningTeacher, setAssigningTeacher] = useState(null);
  const [selectedSubjectIds, setSelectedSubjectIds] = useState([]);
  const [savingAssignments, setSavingAssignments] = useState(false);

  useEffect(() => {
    fetchDirectoryData();
  }, []);

  const fetchDirectoryData = async () => {
    setLoading(true);
    try {
      const [tRes, cRes, sRes] = await Promise.all([
        fetch('/api/admin/teachers', { headers: { Accept: 'application/json' } }),
        fetch('/api/admin/courses', { headers: { Accept: 'application/json' } }),
        fetch('/api/admin/subjects', { headers: { Accept: 'application/json' } })
      ]);

      const tData = await tRes.json();
      const cData = await cRes.json();
      const sData = await sRes.json();

      if (tData.success) setTeachers(tData.teachers || []);
      if (cData.success) setCourses(cData.courses || []);
      if (sData.success) setSubjects(sData.subjects || []);
    } catch (err) {
      console.error('Failed to load faculty directory data', err);
      toast.error('Failed to load directory data');
    }
    setLoading(false);
  };

  const isDeptMatch = (courseCode, courseName, deptFilter) => {
    if (!deptFilter || deptFilter === 'ALL') return true;
    const f = deptFilter.trim().toUpperCase();
    if (courseCode && courseCode.trim().toUpperCase() === f) return true;
    if (courseName && courseName.trim().toUpperCase() === f) return true;
    return false;
  };

  // Filter teachers by department and search query
  const filteredTeachers = teachers.filter(t => {
    const deptOk = selectedDept === 'ALL' || isDeptMatch(t.course_code, t.course_name, selectedDept);
    if (!deptOk) return false;

    if (!search.trim()) return true;
    const q = search.toLowerCase();
    const nameMatch = t.name.toLowerCase().includes(q);
    const subMatch = (t.assigned_subjects || []).some(s => s.name.toLowerCase().includes(q));
    const deptMatch = (t.course_code || t.course_name || '').toLowerCase().includes(q);
    const desigMatch = (t.designation || '').toLowerCase().includes(q);
    return nameMatch || subMatch || deptMatch || desigMatch;
  });

  const getInitials = (name) => {
    const parts = name.trim().split(' ').filter(Boolean);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  const AVATAR_COLORS = [
    ['#6366f1', '#4f46e5'],
    ['#ec4899', '#db2777'],
    ['#0ea5e9', '#0284c7'],
    ['#f59e0b', '#d97706'],
    ['#22c55e', '#16a34a'],
    ['#a855f7', '#9333ea'],
    ['#ef4444', '#dc2626'],
    ['#14b8a6', '#0d9488'],
  ];
  const getAvatarColor = (id) => AVATAR_COLORS[id % AVATAR_COLORS.length];

  // ── Faculty CRUD Handlers ─────────────────────────────────────
  const openAddFaculty = () => {
    setEditingFaculty(null);
    setFacultyForm({ name: '', designation: 'Assistant Professor', department: selectedDept !== 'ALL' ? selectedDept : (courses[0]?.code || '') });
    setShowAddFacultyModal(true);
  };

  const openEditFaculty = (t) => {
    setEditingFaculty(t);
    setFacultyForm({
      name: t.name,
      designation: t.designation || 'Assistant Professor',
      department: t.course_code || t.course_name || ''
    });
    setShowAddFacultyModal(true);
  };

  const handleSaveFaculty = async (e) => {
    e.preventDefault();
    if (!facultyForm.name.trim()) {
      toast.error('Faculty name is required');
      return;
    }

    try {
      const url = editingFaculty ? `/api/admin/teachers/${editingFaculty.id}` : '/api/admin/teachers';
      const method = editingFaculty ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(facultyForm)
      });
      const data = await res.json();
      if (data.success) {
        toast.success(editingFaculty ? 'Faculty updated successfully' : 'New faculty member added');
        setShowAddFacultyModal(false);
        fetchDirectoryData();
      } else {
        toast.error(data.message || 'Failed to save faculty');
      }
    } catch (err) {
      console.error(err);
      toast.error('Network error saving faculty');
    }
  };

  const handleDeleteFaculty = async (id, name) => {
    if (!window.confirm(`Are you sure you want to remove faculty "${name}"?`)) return;
    try {
      const res = await fetch(`/api/admin/teachers/${id}`, {
        method: 'DELETE',
        headers: { Accept: 'application/json' }
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Faculty ${name} removed`);
        fetchDirectoryData();
      } else {
        toast.error(data.message || 'Failed to delete faculty');
      }
    } catch (err) {
      console.error(err);
      toast.error('Network error deleting faculty');
    }
  };

  // ── Department CRUD Handlers ──────────────────────────────────
  const handleSaveDept = async (e) => {
    e.preventDefault();
    if (!deptForm.name.trim()) {
      toast.error('Department name is required');
      return;
    }

    try {
      const res = await fetch('/api/admin/courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(deptForm)
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Department ${deptForm.name} created`);
        setShowAddDeptModal(false);
        setDeptForm({ name: '', code: '' });
        fetchDirectoryData();
      } else {
        toast.error(data.message || 'Failed to add department');
      }
    } catch (err) {
      console.error(err);
      toast.error('Network error creating department');
    }
  };

  // ── Subject CRUD Handlers ─────────────────────────────────────
  const handleSaveSubject = async (e) => {
    e.preventDefault();
    if (!subjectForm.name.trim()) {
      toast.error('Subject name is required');
      return;
    }

    try {
      const res = await fetch('/api/admin/subjects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(subjectForm)
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Subject "${subjectForm.name}" created`);
        setShowAddSubjectModal(false);
        setSubjectForm({ name: '', department: '' });
        fetchDirectoryData();
      } else {
        toast.error(data.message || 'Failed to add subject');
      }
    } catch (err) {
      console.error(err);
      toast.error('Network error creating subject');
    }
  };

  // ── Subject Assignment Handlers ──────────────────────────────
  const openAssignModal = (teacher) => {
    setAssigningTeacher(teacher);
    const existingIds = (teacher.assigned_subjects || []).map(s => s.id);
    setSelectedSubjectIds(existingIds);
  };

  const toggleSubjectSelect = (subId) => {
    if (selectedSubjectIds.includes(subId)) {
      setSelectedSubjectIds(selectedSubjectIds.filter(id => id !== subId));
    } else {
      setSelectedSubjectIds([...selectedSubjectIds, subId]);
    }
  };

  const handleSaveAssignments = async () => {
    if (!assigningTeacher) return;
    setSavingAssignments(true);
    try {
      const res = await fetch('/api/admin/teachers/assign-subjects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          teacher_id: assigningTeacher.id,
          subject_ids: selectedSubjectIds
        })
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Updated subjects for ${assigningTeacher.name}`);
        setAssigningTeacher(null);
        fetchDirectoryData();
      } else {
        toast.error(data.message || 'Failed to save subject mapping');
      }
    } catch (err) {
      console.error(err);
      toast.error('Network error saving subject mapping');
    }
    setSavingAssignments(false);
  };

  return (
    <div className={`${styles.container} ${embedded ? styles.embeddedContainer : ''}`}>
      {!embedded ? (
        <div className={styles.topBanner}>
          <div className={styles.topBannerContent}>
            <button className={styles.backBtn} onClick={() => navigate('/admin/dashboard')}>
              <ArrowLeft size={18} />
              <span>Back to Dashboard</span>
            </button>

            <div className={styles.titleArea}>
              <div className={styles.titleIcon}>
                <GraduationCap size={28} color="#ea580c" />
              </div>
              <div>
                <h1 className={styles.pageTitle}>Faculty & Academic Directory</h1>
                <p className={styles.pageSub}>
                  Unified Master Directory: Manage faculty members, departments, subjects & workload mapping
                </p>
              </div>
            </div>

            <div className={styles.bannerActionsRow}>
              <div className={styles.statsBar}>
                <div className={styles.statCard}>
                  <span className={styles.statNumber}>{teachers.length}</span>
                  <span className={styles.statLabel}>Total Faculty</span>
                </div>
                <div className={styles.statCard}>
                  <span className={styles.statNumber}>{courses.length}</span>
                  <span className={styles.statLabel}>Departments</span>
                </div>
                <div className={styles.statCard}>
                  <span className={styles.statNumber}>{subjects.length}</span>
                  <span className={styles.statLabel}>Subjects</span>
                </div>
              </div>

              {/* Quick Action Buttons */}
              <div className={styles.actionBtnGroup}>
                <button className={styles.primaryAddBtn} onClick={openAddFaculty}>
                  <UserPlus size={16} />
                  <span>Add Faculty</span>
                </button>
                <button className={styles.secondaryAddBtn} onClick={() => { setSubjectForm({ name: '', department: selectedDept !== 'ALL' ? selectedDept : (courses[0]?.code || '') }); setShowAddSubjectModal(true); }}>
                  <BookPlus size={16} />
                  <span>Add Subject</span>
                </button>
                <button className={styles.secondaryAddBtn} onClick={() => { setDeptForm({ name: '', code: '' }); setShowAddDeptModal(true); }}>
                  <FolderPlus size={16} />
                  <span>Add Department</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className={styles.embeddedActionsHeader}>
          <div className={styles.statsBar}>
            <div className={styles.statCard}>
              <span className={styles.statNumber}>{teachers.length}</span>
              <span className={styles.statLabel}>Total Faculty</span>
            </div>
            <div className={styles.statCard}>
              <span className={styles.statNumber}>{courses.length}</span>
              <span className={styles.statLabel}>Departments</span>
            </div>
            <div className={styles.statCard}>
              <span className={styles.statNumber}>{subjects.length}</span>
              <span className={styles.statLabel}>Subjects</span>
            </div>
          </div>

          <div className={styles.actionBtnGroup}>
            <button className={styles.primaryAddBtn} onClick={openAddFaculty}>
              <UserPlus size={16} />
              <span>Add Faculty</span>
            </button>
            <button className={styles.secondaryAddBtn} onClick={() => { setSubjectForm({ name: '', department: selectedDept !== 'ALL' ? selectedDept : (courses[0]?.code || '') }); setShowAddSubjectModal(true); }}>
              <BookPlus size={16} />
              <span>Add Subject</span>
            </button>
            <button className={styles.secondaryAddBtn} onClick={() => { setDeptForm({ name: '', code: '' }); setShowAddDeptModal(true); }}>
              <FolderPlus size={16} />
              <span>Add Department</span>
            </button>
          </div>
        </div>
      )}

      {/* Filter Bar & Search */}
      <div className={styles.controlsBar}>
        {/* Search */}
        <div className={styles.searchWrap}>
          <Search size={16} className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Search faculty name, designation, subject..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className={styles.searchInput}
          />
          {search && (
            <X size={14} className={styles.searchClear} onClick={() => setSearch('')} />
          )}
        </div>

        {/* Department Chips */}
        <div className={styles.deptChipContainer}>
          <button
            className={`${styles.deptChip} ${selectedDept === 'ALL' ? styles.deptChipActive : ''}`}
            onClick={() => setSelectedDept('ALL')}
          >
            All Departments
            <span className={styles.chipBadge}>{teachers.length}</span>
          </button>
          {courses.map(c => {
            const cnt = teachers.filter(t => isDeptMatch(t.course_code, t.course_name, c.code || c.name)).length;
            return (
              <button
                key={c.id}
                className={`${styles.deptChip} ${selectedDept === (c.code || c.name) ? styles.deptChipActive : ''}`}
                onClick={() => setSelectedDept(c.code || c.name)}
              >
                {c.code || c.name}
                <span className={styles.chipBadge}>{cnt}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Content Area */}
      <div className={styles.contentBody}>
        {loading ? (
          <div className={styles.loadingBox}>
            <div className={styles.spinner} />
            <span>Loading Directory Data...</span>
          </div>
        ) : filteredTeachers.length === 0 ? (
          <div className={styles.emptyBox}>
            <GraduationCap size={56} color="#94a3b8" />
            <h3>No faculty members found</h3>
            <p>
              {search 
                ? `No faculty match "${search}" in ${selectedDept}`
                : `No faculty registered under ${selectedDept} department yet.`}
            </p>
            <button className={styles.primaryAddBtn} style={{ marginTop: '16px' }} onClick={openAddFaculty}>
              <UserPlus size={16} /> Add First Faculty Member
            </button>
          </div>
        ) : (
          <div className={styles.facultyGrid}>
            {filteredTeachers.map(teacher => {
              const [bg1, bg2] = getAvatarColor(teacher.id);
              const assignedSubs = teacher.assigned_subjects || [];

              return (
                <div key={teacher.id} className={styles.facultyCard}>
                  {/* Card Header Banner */}
                  <div className={styles.cardHeader}>
                    <div
                      className={styles.avatarCircle}
                      style={{ background: `linear-gradient(135deg, ${bg1}, ${bg2})` }}
                    >
                      {getInitials(teacher.name)}
                    </div>

                    <div className={styles.headerDetails}>
                      <div className={styles.nameRow}>
                        <h3 className={styles.teacherName}>{teacher.name}</h3>
                        {(teacher.course_code || teacher.course_name) && (
                          <span
                            className={styles.deptBadge}
                            style={{ background: `${bg1}18`, color: bg1, border: `1px solid ${bg1}44` }}
                          >
                            {teacher.course_code || teacher.course_name}
                          </span>
                        )}
                      </div>

                      <div className={styles.designationRow}>
                        <Award size={13} color="#64748b" />
                        <span>{teacher.designation || 'Senior Specialist Tutor'}</span>
                      </div>
                    </div>

                    <div className={styles.cardHeaderActions}>
                      <button 
                        className={styles.cardEditBtn} 
                        onClick={() => openEditFaculty(teacher)} 
                        title="Edit Faculty Details"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button 
                        className={styles.cardDeleteBtn} 
                        onClick={() => handleDeleteFaculty(teacher.id, teacher.name)} 
                        title="Remove Faculty"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Card Body — Subjects */}
                  <div className={styles.cardBody}>
                    <div className={styles.subjectsHeader}>
                      <span className={styles.subjectsTitle}>
                        <BookOpen size={13} color="#4f46e5" />
                        Assigned Subjects ({assignedSubs.length})
                      </span>
                      <button
                        className={styles.assignBtn}
                        onClick={() => openAssignModal(teacher)}
                        title="Edit Assigned Subjects"
                      >
                        <Plus size={13} />
                        Assign Subjects
                      </button>
                    </div>

                    <div className={styles.subjectsList}>
                      {assignedSubs.length === 0 ? (
                        <div className={styles.noSubsText}>
                          No subjects assigned yet — click Assign Subjects
                        </div>
                      ) : (
                        assignedSubs.map(sub => (
                          <div key={sub.id} className={styles.subjectPill}>
                            <span className={styles.subjectName}>{sub.name}</span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add / Edit Faculty Modal */}
      {showAddFacultyModal && (
        <div className={styles.modalOverlay} onClick={() => setShowAddFacultyModal(false)}>
          <div className={styles.formModal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>{editingFaculty ? 'Edit Faculty Details' : 'Add New Faculty Member'}</h3>
              <button className={styles.modalCloseBtn} onClick={() => setShowAddFacultyModal(false)}><X size={18} /></button>
            </div>

            <form onSubmit={handleSaveFaculty}>
              <div className={styles.modalBody}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Faculty Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Prof. R. K. Sharma"
                    value={facultyForm.name}
                    onChange={e => setFacultyForm({ ...facultyForm, name: e.target.value })}
                    className={styles.formInput}
                    autoFocus
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Designation</label>
                  <select
                    value={facultyForm.designation}
                    onChange={e => setFacultyForm({ ...facultyForm, designation: e.target.value })}
                    className={styles.formSelect}
                  >
                    <option value="Head of Academics & Mathematics Lead">Head of Academics & Mathematics Lead</option>
                    <option value="Lead English & Verbal Reasoning Specialist">Lead English & Verbal Reasoning Specialist</option>
                    <option value="Non-Verbal & Spatial Reasoning Specialist">Non-Verbal & Spatial Reasoning Specialist</option>
                    <option value="Senior Physics & Science Specialist">Senior Physics & Science Specialist</option>
                    <option value="Lead Chemistry & Biology Specialist">Lead Chemistry & Biology Specialist</option>
                    <option value="Senior GCSE & A-Level Mathematics Tutor">Senior GCSE & A-Level Mathematics Tutor</option>
                    <option value="Advanced A-Level Mathematics & Economics Lead">Advanced A-Level Mathematics & Economics Lead</option>
                    <option value="11+ Primary Foundation Tutor">11+ Primary Foundation Tutor</option>
                    <option value="Senior Specialist Tutor">Senior Specialist Tutor</option>
                    <option value="Assistant Tutor">Assistant Tutor</option>
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Department / Course</label>
                  <select
                    value={facultyForm.department}
                    onChange={e => setFacultyForm({ ...facultyForm, department: e.target.value })}
                    className={styles.formSelect}
                  >
                    <option value="">-- General / Unassigned --</option>
                    {courses.map(c => (
                      <option key={c.id} value={c.code || c.name}>{c.name} ({c.code})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className={styles.modalFooter}>
                <button type="button" className={styles.cancelBtn} onClick={() => setShowAddFacultyModal(false)}>Cancel</button>
                <button type="submit" className={styles.saveBtn}>
                  {editingFaculty ? 'Update Faculty' : 'Save Faculty'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Department Modal */}
      {showAddDeptModal && (
        <div className={styles.modalOverlay} onClick={() => setShowAddDeptModal(false)}>
          <div className={styles.formModal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Add New Department / Course</h3>
              <button className={styles.modalCloseBtn} onClick={() => setShowAddDeptModal(false)}><X size={18} /></button>
            </div>

            <form onSubmit={handleSaveDept}>
              <div className={styles.modalBody}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Department Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Master of Business Administration"
                    value={deptForm.name}
                    onChange={e => setDeptForm({ ...deptForm, name: e.target.value })}
                    className={styles.formInput}
                    autoFocus
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Department Code *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. MBA"
                    value={deptForm.code}
                    onChange={e => setDeptForm({ ...deptForm, code: e.target.value.toUpperCase() })}
                    className={styles.formInput}
                  />
                </div>
              </div>

              <div className={styles.modalFooter}>
                <button type="button" className={styles.cancelBtn} onClick={() => setShowAddDeptModal(false)}>Cancel</button>
                <button type="submit" className={styles.saveBtn}>Create Department</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Subject Modal */}
      {showAddSubjectModal && (
        <div className={styles.modalOverlay} onClick={() => setShowAddSubjectModal(false)}>
          <div className={styles.formModal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Add New Master Subject</h3>
              <button className={styles.modalCloseBtn} onClick={() => setShowAddSubjectModal(false)}><X size={18} /></button>
            </div>

            <form onSubmit={handleSaveSubject}>
              <div className={styles.modalBody}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Subject Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Business Statistics"
                    value={subjectForm.name}
                    onChange={e => setSubjectForm({ ...subjectForm, name: e.target.value })}
                    className={styles.formInput}
                    autoFocus
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Department / Course</label>
                  <select
                    value={subjectForm.department}
                    onChange={e => setSubjectForm({ ...subjectForm, department: e.target.value })}
                    className={styles.formSelect}
                  >
                    <option value="">-- General / All Courses --</option>
                    {courses.map(c => (
                      <option key={c.id} value={c.code || c.name}>{c.name} ({c.code})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className={styles.modalFooter}>
                <button type="button" className={styles.cancelBtn} onClick={() => setShowAddSubjectModal(false)}>Cancel</button>
                <button type="submit" className={styles.saveBtn}>Create Subject</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assign Subjects Modal Overlay */}
      {assigningTeacher && (
        <div className={styles.modalOverlay} onClick={() => setAssigningTeacher(null)}>
          <div className={styles.assignModal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div>
                <h3 className={styles.modalTitle}>Assign Subjects</h3>
                <p className={styles.modalSub}>
                  Select subjects taught by <strong>{assigningTeacher.name}</strong> ({assigningTeacher.course_code || 'All Courses'})
                </p>
              </div>
              <button className={styles.modalCloseBtn} onClick={() => setAssigningTeacher(null)}>
                <X size={18} />
              </button>
            </div>

            <div className={styles.modalBody}>
              {subjects.length === 0 ? (
                <p className={styles.noSubsText}>No master subjects available.</p>
              ) : (
                <div className={styles.subjectCheckGrid}>
                  {subjects.map(sub => {
                    const isChecked = selectedSubjectIds.includes(sub.id);
                    return (
                      <div
                        key={sub.id}
                        className={`${styles.subjectCheckCard} ${isChecked ? styles.subjectCheckCardActive : ''}`}
                        onClick={() => toggleSubjectSelect(sub.id)}
                      >
                        <div className={styles.checkIconBox}>
                          {isChecked ? <Check size={14} color="#fff" /> : <div className={styles.uncheckCircle} />}
                        </div>
                        <div className={styles.checkDetails}>
                          <span className={styles.checkSubName}>{sub.name}</span>
                          <span className={styles.checkSubDept}>
                            {sub.course_code || sub.course_name || 'General'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className={styles.modalFooter}>
              <button className={styles.cancelBtn} onClick={() => setAssigningTeacher(null)}>
                Cancel
              </button>
              <button
                className={styles.saveBtn}
                onClick={handleSaveAssignments}
                disabled={savingAssignments}
              >
                {savingAssignments ? 'Saving...' : 'Save Subject Mapping'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
