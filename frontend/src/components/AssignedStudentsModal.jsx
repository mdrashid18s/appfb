/**
 * @file AssignedStudentsModal.jsx
 * @description Admin Modal: Kisi Test ke Assigned Students ki List Dekhna aur Manage Karna.
 *
 * Yeh component admin ko ek specific test mein assigned students ki poori list dikhata hai.
 * Admin yahan se:
 *   - Department ke hisab se students filter kar sakta hai (All / BCA / BBA / BCom)
 *   - Name ya Roll Number se search kar sakta hai
 *   - Kisi bhi student ko test se remove kar sakta hai
 *
 * @param {Object}   test     - Test object jiske assigned students dekhe ja rahe hain (id, name, code)
 * @param {Function} onClose  - Modal band karne ka callback
 * @param {Function} onUpdate - Student remove hone par parent AdminDashboard ka data refresh karne ka callback
 */

import React, { useState, useEffect } from 'react';
import styles from './AssignedStudentsModal.module.css'; // CSS Modules styling

// Trash2=Remove button, Users=Header icon, FileText=View answers icon
import { X, Search, User, Trash2, Users, FileText } from 'lucide-react';

// Global toast notification hook
import { useToast } from '../contexts/ToastContext';
import ViewAnswersModal from './ViewAnswersModal';

/**
 * AssignedStudentsModal Component
 * Teen main sections hain:
 *   1. Header: Test code + naam + close button
 *   2. Body: Department filter tabs + search input + students list
 *   3. Footer: Total count + Close button
 */
export default function AssignedStudentsModal({ test, onClose, onUpdate }) {

  // ─────────────────────────────────────────────
  // STATE VARIABLES
  // ─────────────────────────────────────────────

  /** students: Backend se fetch hue is test ke sare assigned students ki array */
  const [students, setStudents] = useState([]);

  /** loading: true hone par "Loading..." state dikhata hai */
  const [loading, setLoading] = useState(true);

  /** toast: Success/Error messages ke liye global toast helper */
  const toast = useToast();

  /** filterDept: Active department filter ('All', 'BCA', 'BBA', 'BCom') */
  const [filterDept, setFilterDept] = useState('All');

  /** searchQuery: Search input mein user ne jo type kiya hai */
  const [searchQuery, setSearchQuery] = useState('');

  /** 
   * removingId: Woh student ka roll_no jo currently remove ho raha hai.
   * Jab student remove ho raha ho to sirf us specific student ka button disabled hota hai.
   * null = koi student remove nahi ho raha abhi
   */
  const [removingId, setRemovingId] = useState(null);

  /** selectedStudentForAnswers: If not null, shows ViewAnswersModal for this student */
  const [selectedStudentForAnswers, setSelectedStudentForAnswers] = useState(null);

  /**
   * Helper function to determine badge color based on score
   */
  const getScoreColor = (score) => {
    if (score === null || score === undefined) return '#94a3b8'; // Default pending color
    if (score < 30) return '#ef4444'; // Red
    if (score < 50) return '#f97316'; // Orange
    if (score < 70) return '#eab308'; // Yellow
    if (score < 85) return '#84cc16'; // Light Green
    return '#22c55e'; // Green
  };

  // ─────────────────────────────────────────────
  // LIFECYCLE - Component Mount hone par
  // ─────────────────────────────────────────────

  /**
   * useEffect: Component pehli baar render hone par assigned students fetch karta hai.
   * [] dependency = sirf once chalega (mount par)
   */
  useEffect(() => {
    fetchAssignedStudents(); // Modal open hote hi students load karo
  }, []);

  // ─────────────────────────────────────────────
  // DATA FETCHING
  // ─────────────────────────────────────────────

  /**
   * fetchAssignedStudents: Backend se is test ke assigned students ki list fetch karta hai.
   * Endpoint: GET /api/admin/tests/:testId/assigned-students
   * Success hone par students state update hoti hai.
   */
  const fetchAssignedStudents = async () => {
    try {
      const res = await fetch(`/api/admin/tests/${test.id}/assigned-students`, {
        headers: { 'Accept': 'application/json' } // JSON response chahiye
      });
      const data = await res.json();
      if (data.success) {
        setStudents(data.students); // Students array state mein store karo
      }
    } catch (err) {
      console.error('Failed to fetch assigned students', err);
    }
    setLoading(false); // Loading khatam (success ya failure dono mein)
  };

  // ─────────────────────────────────────────────
  // EVENT HANDLERS
  // ─────────────────────────────────────────────

  /**
   * handleRemove: Kisi student ko is test se remove karne ka handler.
   * Steps:
   *   1. window.confirm se user se confirmation leta hai
   *   2. Woh student ka removingId set karta hai (button disable ke liye)
   *   3. Backend API ko POST request bhejta hai
   *   4. Success hone par local students state se bhi us student ko remove karta hai
   *   5. Parent component ko refresh karta hai
   *
   * @param {string} roll_no - Remove hone wale student ka roll number
   */
  const handleRemove = async (roll_no) => {
    // User se confirmation lo
    if (!window.confirm('Are you sure you want to remove this student from the test?')) return;
    
    setRemovingId(roll_no); // Is student ka button "Removing..." state mein aao

    try {
      const res = await fetch(`/api/admin/tests/${test.id}/remove-student`, {
        method: 'POST', // POST method se remove request
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ roll_no }) // Sirf roll_no bhejo
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Student removed successfully');
        
        // 
        // Local state update: Backend se dobara fetch karne ki zaroorat nahi.
        // Simply us student ko filter karke hata do jiska roll_no match kare.
        //
        setStudents(students.filter(s => s.roll_no !== roll_no));
        
        onUpdate(); // Parent AdminDashboard ko refresh karo (assigned count update ke liye)
      } else {
        toast.error(data.message || 'Failed to remove');
      }
    } catch (err) {
      console.error('Failed to remove student', err);
      toast.error('Unable to remove student.');
    }
    setRemovingId(null); // Remove complete - button wapas normal state mein
  };

  // ─────────────────────────────────────────────
  // COMPUTED / DERIVED VALUES
  // ─────────────────────────────────────────────

  /**
   * filteredStudents: students array ko filter kar ke result array.
   * Do conditions dono satisfy honi chahiye (AND logic):
   *   1. matchDept: Department filter se match kare (ya 'All' selected ho)
   *   2. matchSearch: Search query name ya roll_no mein ho
   */
  const filteredStudents = students.filter(s => {
    // Department match: 'All' selected hai ya student ka department match kare (case-insensitive)
    const matchDept = filterDept === 'All' || s.department.toUpperCase() === filterDept.toUpperCase();
    
    // Search match: Name ya roll_no mein search query exist kare (case-insensitive)
    const matchSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                       (s.roll_no && s.roll_no.toLowerCase().includes(searchQuery.toLowerCase()));
    
    return matchDept && matchSearch; // Dono true hone chahiye
  });

  // ─────────────────────────────────────────────
  // JSX RENDER
  // ─────────────────────────────────────────────

  return (
    // Modal overlay: Dark semi-transparent background
    <div className={styles['assigned-modal-overlay']}>
      
      {/* Main modal container */}
      <div className={styles['assigned-modal-container']}>
        
        {/* ── Header Section ── */}
        <div className={styles['assigned-modal-header']}>
          <div className={styles['assigned-header-left']}>
            {/* Title row: Users icon + "Assigned Students:" + test code */}
            <div className={styles['assigned-title-row']}>
              <Users size={20} />
              <h2>Assigned Students:</h2>
              <span className={styles['assigned-test-code']}>{test.code}</span>
            </div>
            {/* Subtitle: Test ka full naam */}
            <p className={styles['assigned-subtitle']}>{test.name} — Manage assigned students</p>
          </div>
          {/* X button: Modal band karo */}
          <button className={styles['modal-close-btn']} onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* ── Body Section ── */}
        <div className={styles['assigned-modal-body']}>
          
          {/* Controls: Filter tabs + Search input */}
          <div className={styles['assigned-controls']}>
            
            {/* Department Filter Tabs */}
            <div className={styles['assigned-filter-tabs']}>
              {/* ['All', 'BCA', 'BBA', 'BCom'] mein se har ek ke liye ek button */}
              {['All', 'BCA', 'BBA', 'BCom'].map(dept => (
                <button 
                  key={dept}
                  // filterDept === dept hone par 'active' class lagao (blue highlighted style)
                  className={`${styles['assigned-filter-tab']} ${filterDept === dept ? styles['active'] : ''}`}
                  onClick={() => setFilterDept(dept)} // Click karne par filter update karo
                >
                  {dept}
                </button>
              ))}
            </div>
            
            {/* Search Input with Icon */}
            <div className={styles['assigned-search-wrapper']}>
              <Search className={styles['search-icon']} size={14} /> {/* Search magnifier icon */}
              <input 
                type="text" 
                placeholder="Search student name, roll..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)} // Har keystroke par search filter update karo
              />
            </div>
          </div>

          {/* ── Students List ── */}
          <div className={styles['assigned-list']}>
            {loading ? (
              /* Loading state */
              <div style={{textAlign: 'center', padding: '3rem', color: '#64748b'}}>Loading assigned students...</div>
            ) : filteredStudents.length === 0 ? (
              /* Empty state: Ya koi student hai hi nahi, ya filter se koi match nahi */
              <div style={{textAlign: 'center', padding: '3rem', color: '#64748b'}}>
                {students.length === 0 ? 'No students are assigned to this test.' : 'No students match your filter.'}
              </div>
            ) : (
              /* Students ki list render karo */
              filteredStudents.map(student => (
                <div key={student.roll_no} className={styles['assigned-item']}>
                  
                  {/* Student Avatar: Naam ka pehla letter (capital) */}
                  <div className={styles['assigned-avatar']}>
                    {student.name.charAt(0).toUpperCase()}
                  </div>
                  
                  {/* Student Info: Naam aur Roll+Email */}
                  <div className={styles['assigned-info']}>
                    <h4 className={styles['assigned-name']}>{student.name}</h4>
                    <p className={styles['assigned-meta']}>Roll: {student.roll_no} • {student.email}</p>
                  </div>
                  
                  {/* Status Badges + Remove Button */}
                  <div className={styles['assigned-status']}>
                    {/* Department Badge: BCA/BBA/BCom */}
                    <span className={`${styles['dept-badge']} ${styles[student.department.toLowerCase()] || ''}`}>
                      {student.department.toUpperCase()}
                    </span>
                    
                    {/* Mode Badge: ONLINE ya OFFLINE */}
                    <span className={styles['assigned-mode-badge']}>
                      {student.mode && student.mode.includes('Offline') ? 'OFFLINE' : 'ONLINE'}
                    </span>
                    
                    {/* Score/Status Badge */}
                    {student.status === 'completed' && (
                      <span style={{ 
                        background: student.score !== null ? getScoreColor(student.score) : '#f59e0b', 
                        color: 'white', padding: '2px 8px', borderRadius: '12px', 
                        fontSize: '0.75rem', fontWeight: 600, marginRight: '5px' 
                      }}>
                        {student.score !== null ? `Score: ${student.score}%` : 'Grading Pending'}
                      </span>
                    )}
                    
                    {/* 
                      View Answers Button:
                    */}
                    <button 
                      className={styles['remove-btn']}
                      style={{ background: '#3b82f6', color: 'white', borderColor: '#2563eb', marginRight: '5px' }}
                      onClick={() => setSelectedStudentForAnswers(student)}
                    >
                      <FileText size={12} /> Answers
                    </button>

                    {/* 
                      Remove Button:
                      - removingId === student.roll_no hone par button disabled + "Removing..." text
                      - Click karne par handleRemove function call hota hai
                    */}
                    <button 
                      className={styles['remove-btn']}
                      onClick={() => handleRemove(student.roll_no)}
                      disabled={removingId === student.roll_no} // Sirf is student ka button disable karo
                    >
                      <Trash2 size={12} /> {removingId === student.roll_no ? 'Removing...' : 'Remove'}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* ── Footer Section ── */}
        <div className={styles['assigned-modal-footer']}>
          {/* Total assigned students count pill */}
          <div className={styles['assigned-count-pill']}>
            <User size={16} /> {students.length} student(s) assigned
          </div>
          {/* Modal band karne ka Close button */}
          <button className={styles['assigned-close-btn']} onClick={onClose}>Close</button>
        </div>
      </div>
      
      {/* Nested ViewAnswersModal */}
      {selectedStudentForAnswers && (
        <ViewAnswersModal 
          studentTestId={selectedStudentForAnswers.student_test_id}
          studentName={selectedStudentForAnswers.name}
          currentScore={selectedStudentForAnswers.score}
          onClose={() => setSelectedStudentForAnswers(null)}
          onGradeSaved={() => {
            fetchAssignedStudents();
            if (onUpdate) onUpdate();
          }}
        />
      )}
    </div>
  );
}
