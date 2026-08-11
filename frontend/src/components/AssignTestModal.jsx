/**
 * @file AssignTestModal.jsx
 * @description Admin Modal: Students ko Test Assign Karna.
 *
 * Yeh component admin ko kisi specific test ko students ke roll numbers par assign karne deta hai.
 * Admin yahan se:
 *   - Test delivery mode set kar sakta hai (Online Web Browser / Offline Paper)
 *   - Test ka start date & time set kar sakta hai
 *   - Test ka expiry date & time set kar sakta hai (auto-lock)
 *   - Department ke hisab se students filter kar sakta hai
 *   - Name ya roll se search kar sakta hai
 *   - Individual ya sare visible students select kar sakta hai (Select All)
 *   - Selected students ko test assign kar sakta hai
 *
 * @param {Object}   test            - Test object jo assign karna hai (id, name, code)
 * @param {Function} onClose         - Modal band karne ka callback
 * @param {Function} onAssignSuccess - Successful assignment ke baad parent ko refresh karne ka callback
 */

import React, { useState, useEffect } from 'react';
import styles from './AssignTestModal.module.css'; // CSS Modules styling

// Icons: X=Close, Clock=Schedule header, Zap=Mode icon, Calendar=Start window,
// Search=Search input, User=Footer count, ArrowRight=Assign button,
// CheckSquare=Header icon, GraduationCap=Filter header
import { Plus, Search, Check, AlertCircle, X, ChevronRight, Clock, Calendar, Shield, Settings, Copy, BarChart2, Zap, AlertTriangle, CheckSquare, GraduationCap, User, ArrowRight, Upload, FileText, CheckCircle } from 'lucide-react';
import { useToast } from '../contexts/ToastContext';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { format } from 'date-fns';
import ManageQuestionsModal from './ManageQuestionsModal';

/**
 * AssignTestModal Component
 * Modal ka layout do panels mein bata gaya hai:
 *   LEFT PANEL:  Schedule & Mode configuration (time, dates, delivery mode)
 *   RIGHT PANEL: Students list with filter + search + checkbox selection
 *   FOOTER:      Selection count + Cancel + Assign button
 */
export default function AssignTestModal({ test, onClose, onAssignSuccess }) {

  // ─────────────────────────────────────────────
  // STATE VARIABLES
  // ─────────────────────────────────────────────

  /** students: Backend se aaye sare students ki list */
  const [students, setStudents] = useState([]);

  /** toast: Success/Error messages ke liye global toast helper */
  const toast = useToast();

  const [localTest, setLocalTest] = useState(test);
  const [showManageQuestions, setShowManageQuestions] = useState(false);
  const [isUploadingPdf, setIsUploadingPdf] = useState(false);

  /** loading: true hone par students fetch ho rahi hain */
  const [loading, setLoading] = useState(true);

  /** filterDept: Active department filter ('All', 'BCA', 'BBA', 'BCom') */
  const [filterDept, setFilterDept] = useState('All');

  /** searchQuery: Search input mein user ne kya type kiya hai */
  const [searchQuery, setSearchQuery] = useState('');

  /**
   * selectedStudents: Checked students ka Set (JavaScript Set data structure).
   * Set isliye use kiya kyunki:
   *   - Duplicate nahi hote (roll number unique hai)
   *   - O(1) lookup hoti hai has() se
   *   - Add/delete efficient hoti hai
   */
  const [selectedStudents, setSelectedStudents] = useState(new Set());

  /** submitting: true hone par "Assign Test Now" button disabled ho jata hai */
  const [submitting, setSubmitting] = useState(false);

  /** mobileTab: Mobile mein kaunsa panel active hai - 'students' (default) ya 'schedule' */
  const [mobileTab, setMobileTab] = useState('students');

  /**
   * config: Test assignment configuration object.
   * Fields:
   *   - mode: Online ya Offline delivery
   *   - startDate: Test shuru hone ki tarikh
   *   - startTime: Test shuru hone ka waqt
   *   - expiryDate: Test band hone ki tarikh (auto-lock)
   *   - expiryTime: Test band hone ka waqt
   */
  const [config, setConfig] = useState({
    mode: 'Online (Web Browser)',  // Default mode: Online
    startDate: '',                 // Format: YYYY-MM-DD (HTML date input)
    startTime: '',                 // Format: HH:MM (HTML time input)
    expiryDate: '',                // Format: YYYY-MM-DD
    expiryTime: ''                 // Format: HH:MM
  });

  // ─────────────────────────────────────────────
  // LIFECYCLE - Component Mount hone par
  // ─────────────────────────────────────────────

  /**
   * useEffect: Modal open hone par sare students fetch karta hai.
   * [] dependency = sirf ek baar chalega (mount par)
   */
  const [masterDepts, setMasterDepts] = useState(['BCA', 'BBA', 'BCOM', 'BSC', 'MCA']);

  useEffect(() => {
    fetchStudents();
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    try {
      const res = await fetch('/api/admin/departments', { headers: { Accept: 'application/json' } });
      const data = await res.json();
      if (data.success && data.departments && data.departments.length > 0) {
        setMasterDepts(data.departments);
      }
    } catch (err) {
      console.error('Failed to fetch departments', err);
    }
  };

  const fetchStudents = async () => {
    try {
      const res = await fetch('/api/admin/students', {
        headers: { 'Accept': 'application/json' }
      });
      const data = await res.json();
      if (data.success) {
        setStudents(data.students);
      }
    } catch (err) {
      console.error('Failed to fetch students', err);
    }
    setLoading(false);
  };


  // ─────────────────────────────────────────────
  // COMPUTED / DERIVED VALUES
  // ─────────────────────────────────────────────

  /**
   * filteredStudents: Active filter aur search query ke hisab se filtered students.
   * Do conditions dono satisfy honi chahiye (AND logic):
   *   1. matchDept: Department filter se match kare
   *   2. matchSearch: Name ya roll_no ki beginning se search query match kare (startsWith)
   *
   * Note: String() conversion isliye ki kuch fields null/undefined ho sakti hain
   */
  const filteredStudents = students.filter(s => {
    // Department match check (case-insensitive)
    const matchDept = filterDept === 'All' || (s.department && s.department.toUpperCase() === filterDept.toUpperCase());
    
    // String conversion + lowercase (null-safe)
    const nameStr = s.name ? String(s.name).toLowerCase() : '';
    const rollStr = s.roll_no ? String(s.roll_no).toLowerCase() : '';
    const searchStr = searchQuery ? String(searchQuery).toLowerCase() : '';
    
    // includes: "Rashid" ya "450" likhne par match hoga (flexible search)
    const matchSearch = nameStr.includes(searchStr) || rollStr.includes(searchStr);
    
    return matchDept && matchSearch;
  });

  /**
   * isAllSelected: Check karta hai ki kya sare visible (filtered) students selected hain.
   * "Select All" checkbox ke state ke liye use hota hai:
   *   - true  → checkbox checked dikhega
   *   - false → checkbox unchecked ya indeterminate
   */
  const isAllSelected = filteredStudents.length > 0 && filteredStudents.every(s => selectedStudents.has(s.roll_no));

  // ─────────────────────────────────────────────
  // EVENT HANDLERS
  // ─────────────────────────────────────────────

  /**
   * toggleSelectAll: "SELECT ALL VISIBLE STUDENTS" checkbox click hone par chalta hai.
   * - Agar sab selected hain → sab deselect karo (remove from Set)
   * - Agar koi bhi unselected hai → sab select karo (add to Set)
   *
   * Note: new Set(selectedStudents) se copy banate hain kyunki Set mutable hai
   * aur React state directly mutate nahi karni chahiye.
   */
  const toggleSelectAll = () => {
    const newSelected = new Set(selectedStudents); // Existing Set ki copy banao
    if (isAllSelected) {
      // Sab selected hain → sab visible students ko deselect karo
      filteredStudents.forEach(s => newSelected.delete(s.roll_no));
    } else {
      // Kuch unselected hain → sab visible students ko select karo
      filteredStudents.forEach(s => newSelected.add(s.roll_no));
    }
    setSelectedStudents(newSelected); // Updated Set state mein set karo
  };

  /**
   * toggleStudent: Individual student ke checkbox click hone par chalta hai.
   * - Agar already selected hai → deselect karo
   * - Agar selected nahi hai → select karo
   *
   * @param {string} roll_no - Toggle hone wale student ka roll number
   */
  const toggleStudent = (roll_no) => {
    const newSelected = new Set(selectedStudents); // Existing Set ki copy
    if (newSelected.has(roll_no)) {
      newSelected.delete(roll_no); // Already selected → remove karo
    } else {
      newSelected.add(roll_no);    // Not selected → add karo
    }
    setSelectedStudents(newSelected);
  };

  /**
   * handleAssign: "Assign Test Now" button click hone par chalta hai.
   * Validation karta hai pehle:
   *   - Kam se kam ek student select hona chahiye
   *   - Start date/time aur Expiry date/time dono fill hone chahiye
   * Phir backend API ko POST request bhejta hai:
   *   - test_id: Kaunsa test assign ho raha hai
   *   - roll_nos: Kaunse students ko (Array format)
   *   - config: Schedule aur mode configuration
   */
  const handleAssign = async () => {
    // Validation 1: Koi student select nahi hai
    if (selectedStudents.size === 0) return;
    
    // Validation 2: Schedule dates/times fill nahi hain
    if (!config.startDate || !config.startTime || !config.expiryDate || !config.expiryTime) {
      toast.error("Please configure the complete start and expiry schedule before assigning the test.");
      return;
    }

    // Validation 3: Check if test has either PDF uploaded OR questions added
    const hasPdf = !!localTest.question_pdf;
    const hasQuestions = localTest.actual_questions_count > 0;
    if (!hasPdf && !hasQuestions) {
      toast.error("You must either upload a PDF or add options-based questions before assigning this test.");
      return;
    }
    
    setSubmitting(true); // Button disable karo (double submit roko)
    
    try {
      const res = await fetch('/api/admin/assign', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          test_id: test.id,                        // Kaunsa test
          roll_nos: Array.from(selectedStudents),   // Set ko Array mein convert karo (JSON serializable nahi hai Set)
          config                                    // Schedule + mode config
        })
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message || `Test assigned to ${selectedStudents.size} student(s) successfully!`);
        onAssignSuccess(); // Parent AdminDashboard ko refresh karo
        onClose();         // Modal band karo
      } else {
        toast.error(data.message || 'Assignment failed');
      }
    } catch (err) {
      console.error('Assignment error', err);
      toast.error('Unable to assign test.');
    }
    setSubmitting(false); // Button wapas enable karo
  };

  const handleUploadPdf = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      toast.error('Only PDF files are allowed.');
      return;
    }

    setIsUploadingPdf(true);
    const formData = new FormData();
    formData.append('question_pdf', file);

    try {
      const res = await fetch(`/api/admin/tests/${localTest.id}/upload-pdf`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json'
        },
        body: formData
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message);
        setLocalTest({ ...localTest, question_pdf: data.question_pdf });
      } else {
        toast.error(data.message || 'PDF upload failed.');
      }
    } catch (err) {
      toast.error('Failed to upload PDF.');
    }
    setIsUploadingPdf(false);
  };

  /**
   * getDeptCounts: Har department ke kitne students hain yeh count karta hai.
   * Filter tabs par "(5)" jaise numbers dikhane ke liye use hota hai.
   * @returns {Object} { All: n, BCA: n, BBA: n, BCom: n }
   */
  const getDeptCounts = () => {
    const counts = { All: students.length };
    masterDepts.forEach(d => { counts[d.toUpperCase()] = 0; });
    students.forEach(s => {
      if (s.department) {
        const dept = s.department.toUpperCase();
        if (counts[dept] !== undefined) {
          counts[dept]++;
        } else {
          counts[dept] = 1;
        }
      }
    });
    return counts;
  };
  
  /** counts: getDeptCounts() ka result (department-wise student counts) */
  const counts = getDeptCounts();


  // ─────────────────────────────────────────────
  // JSX RENDER
  // ─────────────────────────────────────────────

  return (
    // Modal background overlay
    <div className={styles['assign-modal-overlay']}>
      
      {/* Main modal container */}
      <div className={styles['assign-modal-container']}>
        
        {/* ── Header ── */}
        <div className={styles['assign-modal-header']}>
          <div className={styles['header-left-content']}>
            {/* Title: CheckSquare icon + "Assign Test:" + test code */}
            <div className={styles['header-title-row']}>
              <CheckSquare size={20} />
              <h2>Assign Test:</h2>
              <span className={styles['header-test-code']}>{test.code}</span>
            </div>
            {/* Subtitle: Test ka full naam */}
            <p className={styles['header-subtitle']}>{test.name} — Select students to assign</p>
          </div>
          {/* X button: Modal band karo */}
          <button className={styles['modal-close-btn']} onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* ── Mobile Tab Switcher (shown only on mobile via CSS) ── */}
        <div className={styles['mobile-tab-bar']}>
          <button
            className={`${styles['mobile-tab-btn']} ${mobileTab === 'students' ? styles['mobile-tab-active'] : ''}`}
            onClick={() => setMobileTab('students')}
          >
            &#128101; Students ({selectedStudents.size} selected)
          </button>
          <button
            className={`${styles['mobile-tab-btn']} ${mobileTab === 'schedule' ? styles['mobile-tab-active'] : ''}`}
            onClick={() => setMobileTab('schedule')}
          >
            &#9881; Schedule
          </button>
        </div>

        {/* ── Body: Do panels side by side ── */}
        <div className={styles['assign-modal-body']}>
          
          {/* ════════════════════════════════════════
              LEFT PANEL: Schedule & Mode Configuration
              ════════════════════════════════════════ */}
          <div className={`${styles['assign-panel-left']} ${mobileTab === 'schedule' ? styles['mobile-active'] : ''}`}>
            
            {/* Panel Header */}
            <div className={styles['panel-header-section']}>
              <div className={styles['panel-icon']}><Clock size={24} /></div>
              <div className={styles['panel-title']}>
                <h3>Schedule & Mode</h3>
                <p>Set test delivery & access timing</p>
              </div>
            </div>

            {/* Config Box 1: Delivery Mode (Online/Offline) */}
            <div className={styles['config-box']}>
              <div className={styles['box-title']}><Zap size={14} /> DELIVERY MODE</div>
              {/* Select dropdown: Mode change karne par config.mode update hota hai */}
              <select value={config.mode} onChange={e => setConfig({...config, mode: e.target.value})}>
                <option value="Online (Web Browser)">Online (Web Browser)</option>
                <option value="Offline (Paper based)">Offline (Paper based)</option>
              </select>
            </div>

            {/* Config Box 1.5: Test Content (Questions & PDF) */}
            <div className={`${styles['config-box']} ${styles['green-box']}`}>
              <div className={styles['box-title']}><FileText size={14} /> TEST CONTENT</div>
              <p style={{ fontSize: '0.8rem', color: '#475569', margin: '0 0 0.5rem 0' }}>
                You must configure questions or upload a PDF paper before assigning.
              </p>
              
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
                {localTest.question_pdf ? (
                  <span className={`${styles['test-status-badge']} ${styles['status-ok']}`}><CheckCircle size={10} style={{marginRight: '2px'}}/> PDF Uploaded</span>
                ) : (
                  <span className={`${styles['test-status-badge']} ${styles['status-error']}`}>No PDF</span>
                )}
                {localTest.actual_questions_count > 0 ? (
                  <span className={`${styles['test-status-badge']} ${styles['status-ok']}`}><CheckCircle size={10} style={{marginRight: '2px'}}/> {localTest.actual_questions_count} MCQs</span>
                ) : (
                  <span className={`${styles['test-status-badge']} ${styles['status-error']}`}>0 MCQs</span>
                )}
              </div>

              <div className={styles['content-buttons-row']}>
                <label className={styles['upload-pdf-btn']}>
                  <input 
                    type="file" 
                    accept=".pdf" 
                    className={styles['hidden-file-input']} 
                    onChange={handleUploadPdf}
                    disabled={isUploadingPdf}
                  />
                  <Upload size={14} /> {isUploadingPdf ? 'Uploading...' : 'Upload PDF'}
                </label>
                
                <button 
                  className={styles['manage-questions-btn']}
                  onClick={() => setShowManageQuestions(true)}
                >
                  <Settings size={14} /> Add MCQs
                </button>
              </div>
            </div>

            {/* Config Box 2: Live Start Window (Start Date + Time) */}
            <div className={`${styles['config-box']} ${styles['blue-box']}`}>
              <div className={styles['box-title']}><Calendar size={14} /> LIVE START WINDOW</div>
              <div className={styles['datetime-row']} style={{ display: 'block' }}>
                <div className={styles['datetime-group']} style={{ width: '100%', marginBottom: '10px' }}>
                  <label>START DATE & TIME</label>
                  <DatePicker
                    selected={config.startDate && config.startTime ? new Date(`${config.startDate}T${config.startTime}`) : null}
                    onChange={date => {
                      if (date) {
                        setConfig({...config, startDate: format(date, 'yyyy-MM-dd'), startTime: format(date, 'HH:mm')});
                      } else {
                        setConfig({...config, startDate: '', startTime: ''});
                      }
                    }}
                    showTimeSelect
                    timeFormat="HH:mm"
                    timeIntervals={15}
                    timeCaption="Time"
                    dateFormat="MMMM d, yyyy h:mm aa"
                    customInput={<input style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '6px', boxSizing: 'border-box', marginTop: '4px' }} />}
                  />
                </div>
              </div>
            </div>

            {/* Config Box 3: Expiry / Auto-Lock (Expiry Date + Time) */}
            <div className={`${styles['config-box']} ${styles['orange-box']}`}>
              <div className={styles['box-title']}><Clock size={14} /> EXPIRY / AUTO-LOCK</div>
              <div className={styles['datetime-row']} style={{ display: 'block' }}>
                <div className={styles['datetime-group']} style={{ width: '100%' }}>
                  <label>EXPIRY DATE & TIME</label>
                  <DatePicker
                    selected={config.expiryDate && config.expiryTime ? new Date(`${config.expiryDate}T${config.expiryTime}`) : null}
                    onChange={date => {
                      if (date) {
                        setConfig({...config, expiryDate: format(date, 'yyyy-MM-dd'), expiryTime: format(date, 'HH:mm')});
                      } else {
                        setConfig({...config, expiryDate: '', expiryTime: ''});
                      }
                    }}
                    showTimeSelect
                    timeFormat="HH:mm"
                    timeIntervals={15}
                    timeCaption="Time"
                    dateFormat="MMMM d, yyyy h:mm aa"
                    customInput={<input style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '6px', boxSizing: 'border-box', marginTop: '4px' }} />}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* ════════════════════════════════════════
              RIGHT PANEL: Students Filter + List
              ════════════════════════════════════════ */}
          <div className={`${styles['assign-panel-right']} ${mobileTab === 'students' ? styles['mobile-active'] : ''}`}>
            
            {/* Filter Header label */}
            <div className={styles['filter-header']}>
              <GraduationCap size={16} /> FILTER STUDENTS BY DEPARTMENT
            </div>
            
            <div className={styles['filter-tabs']}>
              {['All', ...masterDepts].map(dept => (
                <button 
                  key={dept}
                  className={`${styles['filter-tab']} ${filterDept === dept ? styles['active'] : ''}`}
                  onClick={() => setFilterDept(dept)}
                >
                  {dept} ({counts[dept.toUpperCase()] !== undefined ? counts[dept.toUpperCase()] : (counts[dept] || 0)})
                </button>
              ))}
            </div>


            {/* Select All Row + Search Input */}
            <div className={styles['select-all-row']}>
              
              {/* "Select All Visible Students" checkbox */}
              <label className={styles['select-all-label']}>
                <input 
                  type="checkbox" 
                  checked={isAllSelected}     // Sab selected hain? (computed value)
                  onChange={toggleSelectAll}  // Toggle all visible students
                />
                SELECT ALL VISIBLE STUDENTS
              </label>
              
              {/* Search Input with magnifier icon */}
              <div className={styles['search-input-wrapper']}>
                <Search className={styles['search-icon']} size={14} />
                <input 
                  type="text" 
                  placeholder="Search student name, roll..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)} // Har keystroke par filter update
                />
              </div>
            </div>

            {/* ── Students Checkable List ── */}
            <div className={styles['student-list']}>
              {loading ? (
                /* Loading state */
                <div style={{textAlign: 'center', padding: '2rem', color: '#64748b'}}>Loading students...</div>
              ) : filteredStudents.length === 0 ? (
                /* Empty state: No results */
                <div style={{textAlign: 'center', padding: '2rem', color: '#64748b'}}>No students found matching your criteria.</div>
              ) : (
                /* 
                  Students list: har student ek clickable label hai (checkbox ke sath).
                  label element isliye use kiya kyunki checkbox aur label ko sath click kar sakte hain.
                */
                filteredStudents.map(student => (
                  <label 
                    key={student.roll_no} 
                    // Selected student ko highlighted 'selected' class milti hai
                    className={`${styles['student-item']} ${selectedStudents.has(student.roll_no) ? styles['selected'] : ''}`}
                  >
                    {/* Checkbox: Is student ka roll_no Set mein hai? → checked */}
                    <input 
                      type="checkbox" 
                      checked={selectedStudents.has(student.roll_no)}
                      onChange={() => toggleStudent(student.roll_no)} // Toggle is student
                    />
                    
                    {/* Student Avatar: Naam ka capital first letter */}
                    <div className={styles['student-avatar']}>
                      {student.name.charAt(0).toUpperCase()}
                    </div>
                    
                    {/* Student Info: Naam + Roll + Email */}
                    <div className={styles['student-info']}>
                      <h4 className={styles['student-name']}>{student.name}</h4>
                      <p className={styles['student-meta']}>Roll: {student.roll_no} • {student.email}</p>
                    </div>
                    
                    {/* Department Badge: BCA/BBA/BCom */}
                    <span className={`${styles['dept-badge']} ${styles[student.department.toLowerCase()] || ''}`}>
                      {student.department.toUpperCase()}
                    </span>
                  </label>
                ))
              )}
            </div>
          </div>
        </div>

        {/* ── Footer ── */}
        <div className={styles['assign-modal-footer']}>
          
          {/* Kitne students selected hain - live count */}
          <div className={styles['selection-count']}>
            <User size={16} /> {selectedStudents.size} student(s) selected
          </div>
          
          {/* Action Buttons */}
          <div className={styles['footer-actions']}>
            {/* Cancel: Modal band karo bina assign kiye */}
            <button className={styles['cancel-btn']} onClick={onClose}>Cancel</button>
            
            {/* 
              Assign Test Now:
              - submitting=true ya koi student select nahi → disabled
              - Text dynamically change hota hai ("Assign Test Now" ↔ "Assigning...")
            */}
            <button 
              className={styles['confirm-btn']} 
              onClick={handleAssign}
              disabled={submitting || selectedStudents.size === 0}
            >
              {submitting ? 'Assigning...' : 'Assign Test Now'} <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {showManageQuestions && (
        <ManageQuestionsModal 
          test={localTest}
          onClose={() => setShowManageQuestions(false)}
          onUpdate={(newCount) => {
            // Update the localTest question count so the badge updates immediately
            setLocalTest(prev => ({
              ...prev,
              actual_questions_count: newCount
            }));
          }}
        />
      )}
    </div>
  );
}
