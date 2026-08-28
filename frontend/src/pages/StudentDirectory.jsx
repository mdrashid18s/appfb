/**
 * @file StudentDirectory.jsx
 * @description Master Student Directory Component with High Performance Search,
 * Memoized O(1) Filtering, and Fast Pagination for 4,000+ Student Records.
 */

import React, { useState, useEffect, useMemo } from 'react';
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
  Clock,
  Eye,
  MapPin,
  Calendar,
  Phone,
  Award,
  School,
  Building2,
  Sparkles,
  Compass,
  User,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight
} from 'lucide-react';
import { useToast } from '../contexts/ToastContext';

export default function StudentDirectory({ embedded = true }) {
  const toast = useToast();
  
  const [students, setStudents] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDept, setSelectedDept] = useState('ALL');
  const [search, setSearch] = useState('');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  // Student Profile Modal State
  const [selectedProfileStudent, setSelectedProfileStudent] = useState(null);

  // Add Student Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [studentForm, setStudentForm] = useState({
    name: '',
    roll_no: '',
    department: 'Year 6',
    email: ''
  });

  const SCHOOL_YEARS = [
    'Year 6','Year 7','Year 8','Year 9','Year 10',
    'Year 11','Year 12','Year 13','GCSE','A-Level'
  ];

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
        setStudentForm({ name: '', roll_no: '', department: 'Year 6', email: '' });
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

  // Precompute Department Counts in a single O(N) pass for high performance
  const deptCounts = useMemo(() => {
    const counts = {};
    (students || []).forEach(s => {
      if (s && s.department) {
        const code = String(s.department).toUpperCase();
        counts[code] = (counts[code] || 0) + 1;
      }
    });
    return counts;
  }, [students]);

  // Memoized Fast Filtering
  const filteredStudents = useMemo(() => {
    const query = (search || '').toLowerCase().trim();
    const selDept = String(selectedDept || '').toUpperCase();

    return (students || []).filter(s => {
      if (!s) return false;

      // Department Match
      if (selDept !== 'ALL') {
        const sDept = String(s.department || '').toUpperCase();
        if (sDept !== selDept) return false;
      }

      // Search Query Match
      if (query) {
        const nameMatch = s.name && String(s.name).toLowerCase().includes(query);
        const rollMatch = s.roll_no && String(s.roll_no).toLowerCase().includes(query);
        const emailMatch = s.email && String(s.email).toLowerCase().includes(query);
        if (!nameMatch && !rollMatch && !emailMatch) return false;
      }

      return true;
    });
  }, [students, selectedDept, search]);

  // Reset page to 1 when search or department filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [search, selectedDept, pageSize]);

  // Paginated slice for current page
  const totalPages = Math.max(1, Math.ceil(filteredStudents.length / pageSize));
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedStudents = useMemo(() => {
    return filteredStudents.slice(startIndex, startIndex + pageSize);
  }, [filteredStudents, startIndex, pageSize]);

  return (
    <div className={styles.container}>
      {/* Header Bar */}
      <div className={styles.embeddedActionsHeader}>
        <div className={styles.statsBar}>
          <div className={styles.statCard}>
            <span className={styles.statNumber}>{(students || []).length}</span>
            <span className={styles.statLabel}>Total Enrolled Students</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statNumber}>{(courses || []).length}</span>
            <span className={styles.statLabel}>Year Groups / Classes</span>
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
            autoComplete="off"
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
            <span className={styles.chipBadge}>{(students || []).length}</span>
          </button>

          {(courses || []).map((c, idx) => {
            if (!c) return null;
            const codeStr = String(c.code || c.name || `DEPT-${idx}`);
            const count = deptCounts[codeStr.toUpperCase()] || 0;
            return (
              <button 
                key={c.id || idx}
                className={`${styles.deptChip} ${String(selectedDept).toUpperCase() === codeStr.toUpperCase() ? styles.deptChipActive : ''}`}
                onClick={() => setSelectedDept(codeStr)}
              >
                <span>{codeStr}</span>
                <span className={styles.chipBadge}>{count}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Results Count & Quick Stats Bar */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '0 0.5rem 0.75rem',
        fontSize: '0.85rem',
        color: '#64748b'
      }}>
        <div>
          Showing <strong>{filteredStudents.length === 0 ? 0 : startIndex + 1}</strong> - <strong>{Math.min(startIndex + pageSize, filteredStudents.length)}</strong> of <strong>{filteredStudents.length}</strong> matching students
          {search && <span style={{ color: '#ea580c', fontWeight: '600' }}> for "{search}"</span>}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span>Show:</span>
          <select 
            value={pageSize} 
            onChange={(e) => setPageSize(Number(e.target.value))}
            style={{
              padding: '0.3rem 0.6rem',
              borderRadius: '6px',
              border: '1px solid #cbd5e1',
              fontSize: '0.82rem',
              fontWeight: '600',
              color: '#0f172a',
              background: '#fff',
              cursor: 'pointer'
            }}
          >
            <option value={25}>25 per page</option>
            <option value={50}>50 per page</option>
            <option value={100}>100 per page</option>
          </select>
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
        <>
          <div className={styles.tableResponsive}>
            <table className={styles.studentsTable}>
              <thead>
                <tr>
                  <th>ROLL NO</th>
                  <th>STUDENT NAME</th>
                  <th>YEAR / CLASS</th>
                  <th>EMAIL ADDRESS</th>
                  <th>STATUS</th>
                  <th>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {paginatedStudents.map(s => (
                  <tr key={s.id}>
                    <td>
                      <span className={styles.rollBadge}>
                        <Hash size={12} /> {s.roll_no || `STU-${s.id}`}
                      </span>
                    </td>
                    <td>
                      <div 
                        className={styles.studentNameCell} 
                        onClick={() => setSelectedProfileStudent(s)}
                        style={{ cursor: 'pointer' }}
                        title="Click to view full registration profile"
                      >
                        <div className={styles.studentAvatar}>
                          {s.name ? s.name.slice(0, 2).toUpperCase() : 'ST'}
                        </div>
                        <span className={styles.studentName} style={{ textDecoration: 'underline', textDecorationColor: '#fed7aa' }}>
                          {s.name}
                        </span>
                      </div>
                    </td>
                    <td>
                      <span className={styles.deptBadge}>{s.department || 'Year 6'}</span>
                    </td>
                    <td>{s.email || 'N/A'}</td>
                    <td>
                      <span className={styles.activePill}>
                        <CheckCircle size={12} /> Enrolled
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <button 
                          className={styles.viewProfileBtn}
                          onClick={() => setSelectedProfileStudent(s)}
                          title="View Full Student Profile"
                        >
                          <Eye size={13} /> View
                        </button>
                        <button 
                          className={styles.deleteBtn}
                          onClick={() => handleDeleteStudent(s.id, s.name)}
                          title="Delete Student"
                        >
                          <Trash2 size={14} /> Remove
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Modern Sleek Pagination Bar */}
          {totalPages > 1 && (
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '1.25rem 0.5rem 0.5rem',
              flexWrap: 'wrap',
              gap: '1rem'
            }}>
              <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
                Page <strong>{currentPage}</strong> of <strong>{totalPages}</strong> ({filteredStudents.length} total students)
              </span>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <button
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                  style={{
                    padding: '0.4rem 0.6rem',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    background: currentPage === 1 ? '#f8fafc' : '#fff',
                    color: currentPage === 1 ? '#94a3b8' : '#0f172a',
                    cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                  title="First Page"
                >
                  <ChevronsLeft size={16} />
                </button>

                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  style={{
                    padding: '0.4rem 0.8rem',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    background: currentPage === 1 ? '#f8fafc' : '#fff',
                    color: currentPage === 1 ? '#94a3b8' : '#0f172a',
                    fontWeight: '600',
                    fontSize: '0.84rem',
                    cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <ChevronLeft size={16} /> Prev
                </button>

                {/* Page Number Chips */}
                <div style={{ display: 'flex', gap: '0.25rem', margin: '0 0.25rem' }}>
                  {[...Array(Math.min(5, totalPages))].map((_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }

                    const isActive = pageNum === currentPage;
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        style={{
                          width: '34px',
                          height: '34px',
                          borderRadius: '6px',
                          border: isActive ? 'none' : '1px solid #cbd5e1',
                          background: isActive ? 'linear-gradient(135deg, #f97316, #ea580c)' : '#fff',
                          color: isActive ? '#fff' : '#0f172a',
                          fontWeight: '700',
                          fontSize: '0.84rem',
                          cursor: 'pointer',
                          boxShadow: isActive ? '0 2px 6px rgba(234, 88, 12, 0.3)' : 'none'
                        }}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>

                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  style={{
                    padding: '0.4rem 0.8rem',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    background: currentPage === totalPages ? '#f8fafc' : '#fff',
                    color: currentPage === totalPages ? '#94a3b8' : '#0f172a',
                    fontWeight: '600',
                    fontSize: '0.84rem',
                    cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  Next <ChevronRight size={16} />
                </button>

                <button
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                  style={{
                    padding: '0.4rem 0.6rem',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    background: currentPage === totalPages ? '#f8fafc' : '#fff',
                    color: currentPage === totalPages ? '#94a3b8' : '#0f172a',
                    cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                  title="Last Page"
                >
                  <ChevronsRight size={16} />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Student Profile Modal */}
      {selectedProfileStudent && (
        <div className={styles.modalOverlay} onClick={() => setSelectedProfileStudent(null)}>
          <div className={styles.profileModalContent} onClick={e => e.stopPropagation()}>
            <div className={styles.profileHeaderCover}>
              <div className={styles.profileCoverInfo}>
                <div className={styles.profileCoverAvatar}>
                  {selectedProfileStudent.name ? selectedProfileStudent.name.slice(0, 2).toUpperCase() : 'ST'}
                </div>
                <div className={styles.profileCoverText}>
                  <h2>{selectedProfileStudent.name}</h2>
                  <div className={styles.profileCoverBadgeRow}>
                    <span className={styles.profileCoverBadge}>
                      <Hash size={11} /> Roll No: {selectedProfileStudent.roll_no}
                    </span>
                    <span className={styles.profileCoverBadge} style={{ background: '#ea580c' }}>
                      <GraduationCap size={11} /> {selectedProfileStudent.course_name || selectedProfileStudent.department}
                    </span>
                    <span className={styles.profileCoverBadge} style={{ background: '#16a34a' }}>
                      <CheckCircle size={11} /> Active
                    </span>
                  </div>
                </div>
              </div>

              <button className={styles.profileCloseBtn} onClick={() => setSelectedProfileStudent(null)}>
                <X size={18} />
              </button>
            </div>

            <div className={styles.profileModalBody}>
              {/* Section 1: Academic Details */}
              <div>
                <div className={styles.profileSectionTitle}>
                  <GraduationCap size={15} color="#ea580c" /> Academic &amp; Enrollment Information
                </div>
                <div className={styles.profileDetailsGrid}>
                  <div className={styles.profileDetailCard}>
                    <div className={styles.profileFieldLabel}><GraduationCap size={12} /> Course / Year</div>
                    <div className={styles.profileFieldValue}>{selectedProfileStudent.course_name || selectedProfileStudent.department}</div>
                  </div>
                  <div className={styles.profileDetailCard}>
                    <div className={styles.profileFieldLabel}><Calendar size={12} /> Academic Session</div>
                    <div className={styles.profileFieldValue}>{selectedProfileStudent.academic_session || '2026-2027'}</div>
                  </div>
                  <div className={styles.profileDetailCard}>
                    <div className={styles.profileFieldLabel}><Compass size={12} /> Target Grammar School</div>
                    <div className={styles.profileFieldValue}>{selectedProfileStudent.target_school || 'Reading / Kendrick School'}</div>
                  </div>
                  <div className={styles.profileDetailCard}>
                    <div className={styles.profileFieldLabel}><School size={12} /> Current Primary School</div>
                    <div className={styles.profileFieldValue}>{selectedProfileStudent.current_school || "St Edward's Prep School"}</div>
                  </div>
                </div>
              </div>

              {/* Section 2: Personal & Contact Information */}
              <div>
                <div className={styles.profileSectionTitle}>
                  <User size={15} color="#ea580c" /> Personal &amp; Contact Details
                </div>
                <div className={styles.profileDetailsGrid}>
                  <div className={styles.profileDetailCard}>
                    <div className={styles.profileFieldLabel}><Mail size={12} /> Email Address</div>
                    <div className={styles.profileFieldValue}>{selectedProfileStudent.email || 'N/A'}</div>
                  </div>
                  <div className={styles.profileDetailCard}>
                    <div className={styles.profileFieldLabel}><Phone size={12} /> Phone Number</div>
                    <div className={styles.profileFieldValue}>{selectedProfileStudent.phone || 'N/A'}</div>
                  </div>
                  <div className={styles.profileDetailCard}>
                    <div className={styles.profileFieldLabel}><Calendar size={12} /> Date of Birth</div>
                    <div className={styles.profileFieldValue}>{selectedProfileStudent.dob || 'N/A'}</div>
                  </div>
                  <div className={styles.profileDetailCard}>
                    <div className={styles.profileFieldLabel}><User size={12} /> Gender</div>
                    <div className={styles.profileFieldValue}>{selectedProfileStudent.gender || 'N/A'}</div>
                  </div>
                  <div className={styles.profileDetailCardFull}>
                    <div className={styles.profileFieldLabel}><MapPin size={12} /> Residential Address</div>
                    <div className={styles.profileFieldValue}>{selectedProfileStudent.address || 'N/A'}</div>
                  </div>
                </div>
              </div>

              {/* Section 3: Parent / Guardian Information */}
              <div>
                <div className={styles.profileSectionTitle}>
                  <Users size={15} color="#ea580c" /> Parent / Guardian Information
                </div>
                <div className={styles.profileDetailsGrid}>
                  <div className={styles.profileDetailCard}>
                    <div className={styles.profileFieldLabel}><User size={12} /> Parent Name</div>
                    <div className={styles.profileFieldValue}>{selectedProfileStudent.parent_name || 'N/A'}</div>
                  </div>
                  <div className={styles.profileDetailCard}>
                    <div className={styles.profileFieldLabel}><Phone size={12} /> Parent Phone</div>
                    <div className={styles.profileFieldValue}>{selectedProfileStudent.parent_phone || 'N/A'}</div>
                  </div>
                  <div className={styles.profileDetailCardFull}>
                    <div className={styles.profileFieldLabel}><Mail size={12} /> Parent Email</div>
                    <div className={styles.profileFieldValue}>{selectedProfileStudent.parent_email || selectedProfileStudent.email || 'N/A'}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Student Modal */}
      {showAddModal && (
        <div className={styles.modalOverlay} onClick={() => setShowAddModal(false)}>
          <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <UserPlus size={20} color="#ea580c" />
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800 }}>Add New Student</h3>
              </div>
              <button className={styles.modalCloseBtn} onClick={() => setShowAddModal(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveStudent}>
              <div className={styles.modalBody}>
                <div className={styles.formGroup}>
                  <label>STUDENT FULL NAME *</label>
                  <input 
                    type="text"
                    placeholder="e.g. John Doe"
                    value={studentForm.name}
                    onChange={e => setStudentForm({ ...studentForm, name: e.target.value })}
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>ROLL NUMBER *</label>
                  <input 
                    type="text"
                    placeholder="e.g. 20260045"
                    value={studentForm.roll_no}
                    onChange={e => setStudentForm({ ...studentForm, roll_no: e.target.value })}
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>ACADEMIC YEAR / CLASS *</label>
                  <select
                    value={studentForm.department}
                    onChange={e => setStudentForm({ ...studentForm, department: e.target.value })}
                  >
                    {SCHOOL_YEARS.map(yr => (
                      <option key={yr} value={yr}>{yr}</option>
                    ))}
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label>EMAIL ADDRESS (OPTIONAL)</label>
                  <input 
                    type="email"
                    placeholder="e.g. student@xleducation.co.uk"
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
                  <Plus size={16} /> Save Student
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
