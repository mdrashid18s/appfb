/**
 * @file StudentDirectory.jsx
 * @description Dedicated Master Student Directory Component.
 * Displays all enrolled students course-wise (BCA, BBA, BCOM) with search, filtering,
 * assigned tests overview, and student management capabilities.
 */

import React, { useState, useEffect } from 'react';
import styles from './StudentDirectory.module.css';
import { 
  Users, 
  Search, 
  UserPlus, 
  GraduationCap, 
  BookOpen, 
  Trash2, 
  Mail, 
  Hash, 
  X, 
  Plus, 
  FileText,
  CheckCircle,
  Clock
} from 'lucide-react';
import { useToast } from '../contexts/ToastContext';

export default function StudentDirectory({ embedded = true }) {
  const toast = useToast();
  
  const [students, setStudents] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDept, setSelectedDept] = useState('ALL');
  const [search, setSearch] = useState('');

  // Add Student Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [studentForm, setStudentForm] = useState({
    name: '',
    roll_no: '',
    department: 'BCA',
    email: ''
  });

  useEffect(() => {
    fetchDirectoryData();
  }, []);

  const fetchDirectoryData = async () => {
    setLoading(true);
    try {
      const [stdRes, crsRes] = await Promise.all([
        fetch('/api/admin/students', { headers: { Accept: 'application/json' } }),
        fetch('/api/admin/courses', { headers: { Accept: 'application/json' } })
      ]);
      
      const stdData = await stdRes.json();
      const crsData = await crsRes.json();

      if (stdData.success && stdData.students) {
        setStudents(stdData.students);
      }
      if (crsData.success && crsData.courses) {
        setCourses(crsData.courses);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to fetch student directory data');
    }
    setLoading(false);
  };

  const handleSaveStudent = async (e) => {
    e.preventDefault();
    if (!studentForm.name || !studentForm.roll_no) {
      toast.error('Student Name and Roll Number are required');
      return;
    }

    try {
      const res = await fetch('/api/admin/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(studentForm)
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Student added successfully!');
        setShowAddModal(false);
        setStudentForm({ name: '', roll_no: '', department: 'BCA', email: '' });
        fetchDirectoryData();
      } else {
        toast.error(data.message || 'Failed to save student');
      }
    } catch (err) {
      console.error(err);
      toast.error('Network error saving student');
    }
  };

  const handleDeleteStudent = async (id, name) => {
    if (!window.confirm(`Are you sure you want to remove student "${name}"?`)) return;
    try {
      const res = await fetch(`/api/admin/students/${id}`, {
        method: 'DELETE',
        headers: { Accept: 'application/json' }
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Student ${name} removed`);
        fetchDirectoryData();
      } else {
        toast.error(data.message || 'Failed to delete student');
      }
    } catch (err) {
      console.error(err);
      toast.error('Network error deleting student');
    }
  };

  // Filter logic
  const filteredStudents = students.filter(s => {
    const matchDept = selectedDept === 'ALL' || (s.department && s.department.toUpperCase() === selectedDept.toUpperCase());
    const query = search.toLowerCase().trim();
    const matchSearch = !query || 
      (s.name && s.name.toLowerCase().includes(query)) ||
      (s.roll_no && String(s.roll_no).toLowerCase().includes(query)) ||
      (s.email && s.email.toLowerCase().includes(query));
    return matchDept && matchSearch;
  });

  return (
    <div className={styles.container}>
      {/* Header Bar */}
      <div className={styles.embeddedActionsHeader}>
        <div className={styles.statsBar}>
          <div className={styles.statCard}>
            <span className={styles.statNumber}>{students.length}</span>
            <span className={styles.statLabel}>Total Enrolled Students</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statNumber}>{courses.length}</span>
            <span className={styles.statLabel}>Departments</span>
          </div>
        </div>

        <div className={styles.actionBtnGroup}>
          <button className={styles.primaryAddBtn} onClick={() => setShowAddModal(true)}>
            <UserPlus size={16} />
            <span>Add Student</span>
          </button>
        </div>
      </div>

      {/* Controls Bar: Search & Department Chips */}
      <div className={styles.controlsBar}>
        <div className={styles.searchWrap}>
          <Search size={18} className={styles.searchIcon} />
          <input 
            type="text" 
            placeholder="Search by student name or roll number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={styles.searchInput}
          />
          {search && (
            <X size={16} className={styles.searchClear} onClick={() => setSearch('')} />
          )}
        </div>

        {/* Department Chips */}
        <div className={styles.deptChipContainer}>
          <button 
            className={`${styles.deptChip} ${selectedDept === 'ALL' ? styles.deptChipActive : ''}`}
            onClick={() => setSelectedDept('ALL')}
          >
            <span>All Courses</span>
            <span className={styles.chipBadge}>{students.length}</span>
          </button>

          {courses.map(c => {
            const count = students.filter(s => s.department && s.department.toUpperCase() === c.code.toUpperCase()).length;
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

      {/* Student List View */}
      {loading ? (
        <div className={styles.loadingBox}>Loading student records...</div>
      ) : filteredStudents.length === 0 ? (
        <div className={styles.emptyState}>
          <Users size={36} color="#94a3b8" />
          <h3>No students found</h3>
          <p>No student records match your selected course filter or search term.</p>
        </div>
      ) : (
        <div className={styles.tableResponsive}>
          <table className={styles.studentsTable}>
            <thead>
              <tr>
                <th>ROLL NO</th>
                <th>STUDENT NAME</th>
                <th>COURSE / DEPT</th>
                <th>EMAIL ADDRESS</th>
                <th>STATUS</th>
                <th>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.map(s => (
                <tr key={s.id}>
                  <td>
                    <span className={styles.rollBadge}>
                      <Hash size={12} /> {s.roll_no || `STU-${s.id}`}
                    </span>
                  </td>
                  <td>
                    <div className={styles.studentNameCell}>
                      <div className={styles.studentAvatar}>
                        {s.name ? s.name.slice(0, 2).toUpperCase() : 'ST'}
                      </div>
                      <span className={styles.studentName}>{s.name}</span>
                    </div>
                  </td>
                  <td>
                    <span className={styles.deptBadge}>{s.department || 'BCA'}</span>
                  </td>
                  <td>{s.email || 'N/A'}</td>
                  <td>
                    <span className={styles.activePill}>
                      <CheckCircle size={12} /> Enrolled
                    </span>
                  </td>
                  <td>
                    <button 
                      className={styles.deleteBtn}
                      onClick={() => handleDeleteStudent(s.id, s.name)}
                      title="Delete Student"
                    >
                      <Trash2 size={14} /> Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Student Modal */}
      {showAddModal && (
        <div className={styles.modalOverlay} onClick={() => setShowAddModal(false)}>
          <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>Add New Student</h2>
              <button className={styles.closeBtn} onClick={() => setShowAddModal(false)}>
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSaveStudent}>
              <div className={styles.modalBody}>
                <div className={styles.formGroup}>
                  <label>STUDENT FULL NAME *</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Rahul Sharma"
                    value={studentForm.name}
                    onChange={e => setStudentForm({ ...studentForm, name: e.target.value })}
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>ROLL NUMBER *</label>
                  <input 
                    type="text" 
                    placeholder="e.g. 101"
                    value={studentForm.roll_no}
                    onChange={e => setStudentForm({ ...studentForm, roll_no: e.target.value })}
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>COURSE / DEPARTMENT *</label>
                  <select 
                    value={studentForm.department}
                    onChange={e => setStudentForm({ ...studentForm, department: e.target.value })}
                  >
                    {courses.map(c => (
                      <option key={c.id} value={c.code}>{c.code} - {c.name}</option>
                    ))}
                    <option value="BCA">BCA</option>
                    <option value="BBA">BBA</option>
                    <option value="BCOM">BCOM</option>
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label>EMAIL ADDRESS (OPTIONAL)</label>
                  <input 
                    type="email" 
                    placeholder="e.g. rahul@example.com"
                    value={studentForm.email}
                    onChange={e => setStudentForm({ ...studentForm, email: e.target.value })}
                  />
                </div>
              </div>

              <div className={styles.modalFooter}>
                <button type="button" className={styles.cancelBtn} onClick={() => setShowAddModal(false)}>
                  Cancel
                </button>
                <button type="submit" className={styles.saveBtn}>
                  Save Student
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
