/**
 * @file SubjectDirectory.jsx
 * @description Subject Master Directory View for Admin Portal.
 * Displays all course subjects, department tags, and teacher workload mapping from database.
 */

import React, { useState, useEffect } from 'react';
import styles from './SubjectDirectory.module.css';
import { BookOpen, Search, GraduationCap, Users, Hash, Plus, CheckCircle, X, BookPlus } from 'lucide-react';
import { useToast } from '../contexts/ToastContext';

export default function SubjectDirectory({ embedded = true }) {
  const toast = useToast();
  const [subjects, setSubjects] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedDept, setSelectedDept] = useState('ALL');

  // Add Subject Modal State
  const [showAddSubjectModal, setShowAddSubjectModal] = useState(false);
  const [subjectForm, setSubjectForm] = useState({ name: '', department: 'BCA', type: 'theory' });

  useEffect(() => {
    fetchDirectoryData();
  }, []);

  const fetchDirectoryData = async () => {
    setLoading(true);
    try {
      const [sRes, cRes] = await Promise.all([
        fetch('/api/admin/subjects', { headers: { Accept: 'application/json' } }),
        fetch('/api/admin/courses', { headers: { Accept: 'application/json' } })
      ]);
      const sData = await sRes.json();
      const cData = await cRes.json();

      if (sData.success) setSubjects(sData.subjects || []);
      if (cData.success) setCourses(cData.courses || []);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load subject directory');
    }
    setLoading(false);
  };

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
        toast.success(`Subject "${subjectForm.name}" created successfully`);
        setShowAddSubjectModal(false);
        setSubjectForm({ name: '', department: 'BCA', type: 'theory' });
        fetchDirectoryData();
      } else {
        toast.error(data.message || 'Failed to add subject');
      }
    } catch (err) {
      console.error(err);
      toast.error('Network error creating subject');
    }
  };

  const handleDeleteSubject = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete subject "${name}"?`)) return;
    try {
      const res = await fetch(`/api/admin/subjects/${id}`, {
        method: 'DELETE',
        headers: { Accept: 'application/json' }
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Subject "${name}" deleted`);
        fetchDirectoryData();
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to delete subject');
    }
  };

  const filteredSubjects = subjects.filter(s => {
    const deptCode = s.course_code || 'ALL';
    const matchDept = selectedDept === 'ALL' || deptCode.toUpperCase() === selectedDept.toUpperCase();
    const query = search.toLowerCase().trim();
    const matchSearch = !query || (s.name && s.name.toLowerCase().includes(query));
    return matchDept && matchSearch;
  });

  return (
    <div className={styles.container}>
      {/* Top Header Bar */}
      <div className={styles.embeddedActionsHeader}>
        <div className={styles.statsBar}>
          <div className={styles.statCard}>
            <span className={styles.statNumber}>{subjects.length}</span>
            <span className={styles.statLabel}>Total Subjects</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statNumber}>{courses.length}</span>
            <span className={styles.statLabel}>Departments</span>
          </div>
        </div>

        <button className={styles.primaryAddBtn} onClick={() => setShowAddSubjectModal(true)}>
          <BookPlus size={16} />
          <span>Add Subject</span>
        </button>
      </div>

      {/* Controls Bar */}
      <div className={styles.controlsBar}>
        <div className={styles.searchWrap}>
          <Search size={18} className={styles.searchIcon} />
          <input 
            type="text" 
            placeholder="Search subject by title..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={styles.searchInput}
          />
          {search && (
            <X size={16} className={styles.searchClear} onClick={() => setSearch('')} />
          )}
        </div>

        <div className={styles.deptChipContainer}>
          <button 
            className={`${styles.deptChip} ${selectedDept === 'ALL' ? styles.deptChipActive : ''}`}
            onClick={() => setSelectedDept('ALL')}
          >
            <span>All Courses</span>
            <span className={styles.chipBadge}>{subjects.length}</span>
          </button>

          {courses.map(c => {
            const count = subjects.filter(s => s.course_code && s.course_code.toUpperCase() === c.code.toUpperCase()).length;
            return (
              <button 
                key={c.id}
                className={`${styles.deptChip} ${selectedDept === c.code ? styles.deptChipActive : ''}`}
                onClick={() => setSelectedDept(c.code)}
              >
                <span>{c.code}</span>
                <span className={styles.chipBadge}>{count}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Table List */}
      {loading ? (
        <div className={styles.loadingBox}>Loading subject directory...</div>
      ) : filteredSubjects.length === 0 ? (
        <div className={styles.emptyBox}>
          <BookOpen size={36} color="#94a3b8" />
          <h3>No subjects found</h3>
          <p>No academic subjects match your search query or department filter.</p>
        </div>
      ) : (
        <div className={styles.tableResponsive}>
          <table className={styles.subjectsTable}>
            <thead>
              <tr>
                <th>SUBJECT NAME</th>
                <th>COURSE / DEPT</th>
                <th>TYPE</th>
                <th>ASSIGNED FACULTY</th>
                <th>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {filteredSubjects.map(s => (
                <tr key={s.id}>
                  <td>
                    <div className={styles.subCell}>
                      <BookOpen size={16} color="#ea580c" />
                      <span className={styles.subName}>{s.name}</span>
                    </div>
                  </td>
                  <td>
                    <span className={styles.deptBadge}>{s.course_code || 'General'}</span>
                  </td>
                  <td>
                    <span className={styles.typeTag}>{s.type ? s.type.toUpperCase() : 'THEORY'}</span>
                  </td>
                  <td>
                    {s.assigned_teachers && s.assigned_teachers.length > 0 ? (
                      <div className={styles.teachersWrap}>
                        {s.assigned_teachers.map(t => (
                          <span key={t.id} className={styles.teacherPill}>
                            <GraduationCap size={12} /> {t.name}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className={styles.noFacultyText}>Unassigned</span>
                    )}
                  </td>
                  <td>
                    <button 
                      className={styles.deleteBtn}
                      onClick={() => handleDeleteSubject(s.id, s.name)}
                      title="Delete Subject"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Subject Modal */}
      {showAddSubjectModal && (
        <div className={styles.modalOverlay} onClick={() => setShowAddSubjectModal(false)}>
          <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>Add Master Subject</h2>
              <button className={styles.closeBtn} onClick={() => setShowAddSubjectModal(false)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveSubject}>
              <div className={styles.modalBody}>
                <div className={styles.formGroup}>
                  <label>SUBJECT NAME *</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Data Structures & Algorithms"
                    value={subjectForm.name}
                    onChange={e => setSubjectForm({ ...subjectForm, name: e.target.value })}
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>DEPARTMENT / COURSE *</label>
                  <select 
                    value={subjectForm.department}
                    onChange={e => setSubjectForm({ ...subjectForm, department: e.target.value })}
                  >
                    {courses.map(c => (
                      <option key={c.id} value={c.code}>{c.code} - {c.name}</option>
                    ))}
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label>SUBJECT TYPE</label>
                  <select 
                    value={subjectForm.type}
                    onChange={e => setSubjectForm({ ...subjectForm, type: e.target.value })}
                  >
                    <option value="theory">Theory</option>
                    <option value="lab">Lab / Practical</option>
                    <option value="seminar">Seminar / Workshop</option>
                  </select>
                </div>
              </div>

              <div className={styles.modalFooter}>
                <button type="button" className={styles.cancelBtn} onClick={() => setShowAddSubjectModal(false)}>
                  Cancel
                </button>
                <button type="submit" className={styles.saveBtn}>
                  Save Subject
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
