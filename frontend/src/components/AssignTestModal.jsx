/**
 * @file AssignTestModal.jsx
 * @description Admin Modal: Students ko Test Assign Karna aur Test Settings Configure Karna.
 *
 * Yeh component Admin ko kisi specific test ko students par assign karne ki suvidha deta hai:
 *   1. Test Content Check: PDF paper upload karna ya MCQs questions manage karna.
 *   2. Delivery Mode: Online (Web Browser) ya Offline (Paper based) mode chunna.
 *   3. Schedule & Timings: Start date/time aur Expiry date/time (auto-lock) set karna (DatePicker se).
 *   4. Department Filtering: Dynamic departments ke hisaab se filter karna (Year 3 - Year 11, GCSE, A-Level etc.).
 *   5. Search & Selection: Student name ya roll number se search karna, individual ya "Select All" chunna.
 *   6. API Assignment: Selected students ko test assign karna (/api/admin/assign).
 *
 * @param {Object}   test            - Test object jise assign kiya ja raha hai (id, name, code, question_pdf, actual_questions_count).
 * @param {Function} onClose         - Modal band karne ka callback function.
 * @param {Function} onAssignSuccess - Successful test assign hone ke baad parent component refresh karne ka callback.
 */

import React, { useState, useEffect } from 'react';
import styles from './AssignTestModal.module.css'; // CSS Modules styling

// Lucide React Icons: UI elements aur visual indicators ke liye
import { 
  Plus, Search, Check, AlertCircle, X, ChevronRight, Clock, Calendar, 
  Shield, Settings, Copy, BarChart2, Zap, AlertTriangle, CheckSquare, 
  GraduationCap, User, ArrowRight, Upload, FileText, CheckCircle 
} from 'lucide-react';

// Global Toast Context: Success aur Error alert notifications dikhane ke liye
import { useToast } from '../contexts/ToastContext';

// React Datepicker & date-fns: Date aur Time select karne ke liye
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { format } from 'date-fns';

// Manage Questions Modal: Test ke andar MCQs add/edit/delete karne ke liye sub-modal
import ManageQuestionsModal from './ManageQuestionsModal';

/**
 * AssignTestModal Component
 * Modal Structure:
 *   - Header: Test Code, Name aur Close (X) button.
 *   - Mobile Tabs: Mobile screen par 'Students' aur 'Schedule' panels ke beech switch karne ke tabs.
 *   - Left Panel: Delivery Mode, Test Content (PDF/MCQ), Start Time & Expiry Time (React DatePicker).
 *   - Right Panel: Department Filter Tabs, Search Bar, Select All Checkbox aur Students List.
 *   - Footer: Live Selected Count, Cancel Button, Assign Button.
 */
export default function AssignTestModal({ test, onClose, onAssignSuccess }) {

  // ─────────────────────────────────────────────
  // 1. STATE VARIABLES (Component ki Memory)
  // ─────────────────────────────────────────────

  /** students: Backend se aane wale sabhi registered students ka array */
  const [students, setStudents] = useState([]);

  /** toast: Notification popup helper (toast.success, toast.error) */
  const toast = useToast();

  /** localTest: Test details ki local copy (PDF upload ya MCQ count update hone par instant sync hoti hai) */
  const [localTest, setLocalTest] = useState(test);

  /** showManageQuestions: True hone par MCQ Manage Questions ka popup modal open hota hai */
  const [showManageQuestions, setShowManageQuestions] = useState(false);

  /** isUploadingPdf: PDF file upload process chalne ke dauran loading spinner/status ke liye */
  const [isUploadingPdf, setIsUploadingPdf] = useState(false);

  /** loading: Backend se students aur departments load hote waqt loading message dikhane ke liye */
  const [loading, setLoading] = useState(true);

  /** masterDepts: Database se fetch kiye gaye dynamic departments ki list (Default: Year 3 - A-Level) */
  const [masterDepts, setMasterDepts] = useState([
    'Year 3', 'Year 4', 'Year 5', 'Year 6', 'Year 7', 
    'Year 8', 'Year 9', 'Year 10', 'Year 11', 'GCSE', 'A-Level'
  ]);

  /** filterDept: Department filter tab jo user ne click kiya hai ('All' ya specific department) */
  const [filterDept, setFilterDept] = useState('All');

  /** searchQuery: Search bar me student name ya roll number jo type kiya gaya hai */
  const [searchQuery, setSearchQuery] = useState('');

  /**
   * selectedStudents: Chune gaye students ke roll numbers ka JavaScript Set.
   * Set use karne ke fayde:
   *   - Duplicate roll numbers allow nahi hote.
   *   - has() method se O(1) instant checking hoti hai.
   *   - Add aur delete fast perform hota hai.
   */
  const [selectedStudents, setSelectedStudents] = useState(new Set());

  /** submitting: API call chalte waqt 'Assign Test Now' button ko disable karne ke liye */
  const [submitting, setSubmitting] = useState(false);

  /** mobileTab: Mobile view par kaunsa section dikhana hai - 'students' ya 'schedule' */
  const [mobileTab, setMobileTab] = useState('students');

  /**
   * config: Test assignment ke schedule aur delivery mode settings ka object:
   *   - mode: Online (Web Browser) ya Offline (Paper based)
   *   - startDate: Test shuru hone ki date (YYYY-MM-DD)
   *   - startTime: Test shuru hone ka time (HH:MM)
   *   - expiryDate: Test band/auto-lock hone ki date (YYYY-MM-DD)
   *   - expiryTime: Test band hone ka time (HH:MM)
   */
  const [config, setConfig] = useState({
    mode: 'Online (Web Browser)',
    startDate: '',
    startTime: '',
    expiryDate: '',
    expiryTime: ''
  });

  // ─────────────────────────────────────────────
  // 2. LIFECYCLE HOOKS (Page Load par Data Fetching)
  // ─────────────────────────────────────────────

  /**
   * useEffect: Modal khulte hi ek baar chalega aur database se:
   *   1. Saare Students fetch karega
   *   2. Saare Master Departments fetch karega
   */
  useEffect(() => {
    fetchStudents();
    fetchDepartments();
  }, []);

  /**
   * fetchDepartments: Backend API (/api/admin/departments) se dynamic department list lata hai.
   */
  const fetchDepartments = async () => {
    try {
      const res = await fetch('/api/admin/departments', { 
        headers: { Accept: 'application/json' } 
      });
      const data = await res.json();
      if (data.success && data.departments && data.departments.length > 0) {
        setMasterDepts(data.departments);
      }
    } catch (err) {
      console.error('Failed to fetch departments', err);
    }
  };

  /**
   * fetchStudents: Backend API (/api/admin/students) se sabhi registered students ki list lata hai.
   */
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
  // 3. FILTERING & SEARCH LOGIC (Computed Values)
  // ─────────────────────────────────────────────

  /**
   * filteredStudents: Selected Department aur Search Query ke hisaab se live filtered students list.
   * Logic:
   *   - Department match: Agar 'All' hai ya student ka department match karta ho.
   *   - Search match: Student name ya roll number me search query match karti ho.
   */
  const filteredStudents = students.filter(s => {
    const matchDept = filterDept === 'All' || (s.department && s.department.toUpperCase() === filterDept.toUpperCase());
    
    const nameStr = s.name ? String(s.name).toLowerCase() : '';
    const rollStr = s.roll_no ? String(s.roll_no).toLowerCase() : '';
    const searchStr = searchQuery ? String(searchQuery).toLowerCase() : '';
    
    const matchSearch = nameStr.includes(searchStr) || rollStr.includes(searchStr);
    
    return matchDept && matchSearch;
  });

  /**
   * isAllSelected: Check karta hai ki kya screen par dikh rahe saare filtered students select ho chuke hain.
   * "SELECT ALL VISIBLE STUDENTS" checkbox ko auto-check/uncheck karne ke liye use hota hai.
   */
  const isAllSelected = filteredStudents.length > 0 && filteredStudents.every(s => selectedStudents.has(s.roll_no));

  // ─────────────────────────────────────────────
  // 4. EVENT HANDLERS (User Actions)
  // ─────────────────────────────────────────────

  /**
   * toggleSelectAll: "SELECT ALL VISIBLE STUDENTS" checkbox par click hone par chalega.
   * - Agar pehle se sabhi visible students select hain -> Sabhi ko Deselect karega.
   * - Agar kuch ya koi select nahi hai -> Sabhi visible students ko ek sath Select karega.
   */
  const toggleSelectAll = () => {
    const newSelected = new Set(selectedStudents);
    if (isAllSelected) {
      filteredStudents.forEach(s => newSelected.delete(s.roll_no));
    } else {
      filteredStudents.forEach(s => newSelected.add(s.roll_no));
    }
    setSelectedStudents(newSelected);
  };

  /**
   * toggleStudent: Kisi single student ke checkbox click hone par chalega.
   * @param {string} roll_no - Student ka roll number
   */
  const toggleStudent = (roll_no) => {
    const newSelected = new Set(selectedStudents);
    if (newSelected.has(roll_no)) {
      newSelected.delete(roll_no); // Agar pehle se checked hai toh hata do
    } else {
      newSelected.add(roll_no);    // Agar checked nahi hai toh add karo
    }
    setSelectedStudents(newSelected);
  };

  /**
   * handleUploadPdf: Test ke liye question paper PDF upload karne ka handler.
   * File type validate karke FormData ke zariye /api/admin/tests/{id}/upload-pdf par POST karta hai.
   */
  const handleUploadPdf = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Sirf PDF file allow karna
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
        // Local state me PDF path update karo taaki UI turant update ho sake
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
   * handleAssign: "Assign Test Now" button click hone par final assignment perform karta hai.
   * 
   * Strict Validations:
   *   1. Kam se kam 1 student select hona chahiye.
   *   2. Start Date/Time aur Expiry Date/Time dono configure honi chahiye.
   *   3. Test me ya toh PDF uploaded ho YA kam se kam 1 MCQ question add kiya gaya ho.
   * 
   * POST Request: /api/admin/assign
   */
  const handleAssign = async () => {
    // Validation 1: Student selection check
    if (selectedStudents.size === 0) return;
    
    // Validation 2: Complete Schedule check
    if (!config.startDate || !config.startTime || !config.expiryDate || !config.expiryTime) {
      toast.error("Please configure the complete start and expiry schedule before assigning the test.");
      return;
    }

    // Validation 3: Test Content check (PDF ya MCQs hona mandatory hai)
    const hasPdf = !!localTest.question_pdf;
    const hasQuestions = localTest.actual_questions_count > 0;
    if (!hasPdf && !hasQuestions) {
      toast.error("You must either upload a PDF or add options-based questions before assigning this test.");
      return;
    }
    
    setSubmitting(true); // Double submit rokne ke liye button disable karo
    
    try {
      const res = await fetch('/api/admin/assign', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          test_id: test.id,
          roll_nos: Array.from(selectedStudents), // Set ko JSON array me badla
          config
        })
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message || `Test assigned to ${selectedStudents.size} student(s) successfully!`);
        onAssignSuccess(); // Parent dashboard refresh karo
        onClose();         // Modal band karo
      } else {
        toast.error(data.message || 'Assignment failed');
      }
    } catch (err) {
      console.error('Assignment error', err);
      toast.error('Unable to assign test.');
    }
    setSubmitting(false);
  };

  /**
   * getDeptCounts: Har department me kitne students hain unki count nikalta hai.
   * Isse department filter tabs par "Year 10 (12)" jaisa badge count dikhta hai.
   * @returns {Object} Example: { All: 50, 'YEAR 10': 12, ... }
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
  
  const counts = getDeptCounts();

  // ─────────────────────────────────────────────
  // 5. JSX RENDERING (UI Structure)
  // ─────────────────────────────────────────────

  return (
    // Background Overlay
    <div className={styles['assign-modal-overlay']}>
      
      {/* Main Modal Container */}
      <div className={styles['assign-modal-container']}>
        
        {/* ── Section A: Modal Header ── */}
        <div className={styles['assign-modal-header']}>
          <div className={styles['header-left-content']}>
            <div className={styles['header-title-row']}>
              <CheckSquare size={20} />
              <h2>Assign Test:</h2>
              <span className={styles['header-test-code']}>{test.code}</span>
            </div>
            <p className={styles['header-subtitle']}>{test.name} — Select students to assign</p>
          </div>
          {/* Close (X) Button */}
          <button className={styles['modal-close-btn']} onClick={onClose} title="Close Modal">
            <X size={20} />
          </button>
        </div>

        {/* ── Section B: Mobile Tab Switcher (Visible on Mobile Only) ── */}
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

        {/* ── Section C: Dual Panel Body (Left: Schedule/Content, Right: Students) ── */}
        <div className={styles['assign-modal-body']}>
          
          {/* ═══════════════════════════════════════════════
              LEFT PANEL: Test Configuration & Timings
              ═══════════════════════════════════════════════ */}
          <div className={`${styles['assign-panel-left']} ${mobileTab === 'schedule' ? styles['mobile-active'] : ''}`}>
            
            {/* Panel Title */}
            <div className={styles['panel-header-section']}>
              <div className={styles['panel-icon']}><Clock size={24} /></div>
              <div className={styles['panel-title']}>
                <h3>Schedule & Mode</h3>
                <p>Set test delivery & access timing</p>
              </div>
            </div>

            {/* Block 1: Delivery Mode (Online vs Offline) */}
            <div className={styles['config-box']}>
              <div className={styles['box-title']}><Zap size={14} /> DELIVERY MODE</div>
              <select value={config.mode} onChange={e => setConfig({...config, mode: e.target.value})}>
                <option value="Online (Web Browser)">Online (Web Browser)</option>
                <option value="Offline (Paper based)">Offline (Paper based)</option>
              </select>
            </div>

            {/* Block 2: Test Content Status & Actions (PDF Upload / MCQ Management) */}
            <div className={`${styles['config-box']} ${styles['green-box']}`}>
              <div className={styles['box-title']}><FileText size={14} /> TEST CONTENT</div>
              <p style={{ fontSize: '0.8rem', color: '#475569', margin: '0 0 0.5rem 0' }}>
                You must configure questions or upload a PDF paper before assigning.
              </p>
              
              {/* Badges: PDF Status & MCQ Count */}
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
                {localTest.question_pdf ? (
                  <span className={`${styles['test-status-badge']} ${styles['status-ok']}`}>
                    <CheckCircle size={10} style={{marginRight: '2px'}}/> PDF Uploaded
                  </span>
                ) : (
                  <span className={`${styles['test-status-badge']} ${styles['status-error']}`}>No PDF</span>
                )}
                {localTest.actual_questions_count > 0 ? (
                  <span className={`${styles['test-status-badge']} ${styles['status-ok']}`}>
                    <CheckCircle size={10} style={{marginRight: '2px'}}/> {localTest.actual_questions_count} MCQs
                  </span>
                ) : (
                  <span className={`${styles['test-status-badge']} ${styles['status-error']}`}>0 MCQs</span>
                )}
              </div>

              {/* Action Buttons: Upload PDF / Add MCQs */}
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
                  type="button"
                >
                  <Settings size={14} /> Add MCQs
                </button>
              </div>
            </div>

            {/* Block 3: Live Start Window (DatePicker + Time Select) */}
            <div className={`${styles['config-box']} ${styles['blue-box']}`}>
              <div className={styles['box-title']}><Calendar size={14} /> LIVE START WINDOW</div>
              <div className={styles['datetime-row']} style={{ display: 'block' }}>
                <div className={styles['datetime-group']} style={{ width: '100%', marginBottom: '10px' }}>
                  <label>START DATE & TIME</label>
                  <DatePicker
                    selected={config.startDate && config.startTime ? new Date(`${config.startDate}T${config.startTime}`) : null}
                    onChange={date => {
                      if (date) {
                        setConfig({
                          ...config, 
                          startDate: format(date, 'yyyy-MM-dd'), 
                          startTime: format(date, 'HH:mm')
                        });
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

            {/* Block 4: Expiry / Auto-Lock Window (DatePicker + Time Select) */}
            <div className={`${styles['config-box']} ${styles['orange-box']}`}>
              <div className={styles['box-title']}><Clock size={14} /> EXPIRY / AUTO-LOCK</div>
              <div className={styles['datetime-row']} style={{ display: 'block' }}>
                <div className={styles['datetime-group']} style={{ width: '100%' }}>
                  <label>EXPIRY DATE & TIME</label>
                  <DatePicker
                    selected={config.expiryDate && config.expiryTime ? new Date(`${config.expiryDate}T${config.expiryTime}`) : null}
                    onChange={date => {
                      if (date) {
                        setConfig({
                          ...config, 
                          expiryDate: format(date, 'yyyy-MM-dd'), 
                          expiryTime: format(date, 'HH:mm')
                        });
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

          {/* ═══════════════════════════════════════════════
              RIGHT PANEL: Students Filter & Selection List
              ═══════════════════════════════════════════════ */}
          <div className={`${styles['assign-panel-right']} ${mobileTab === 'students' ? styles['mobile-active'] : ''}`}>
            
            {/* Department Filter Label */}
            <div className={styles['filter-header']}>
              <GraduationCap size={16} /> FILTER STUDENTS BY DEPARTMENT
            </div>
            
            {/* Dynamic Department Filter Tabs */}
            <div className={styles['filter-tabs']}>
              {['All', ...masterDepts].map(dept => (
                <button 
                  key={dept}
                  className={`${styles['filter-tab']} ${filterDept === dept ? styles['active'] : ''}`}
                  onClick={() => setFilterDept(dept)}
                  type="button"
                >
                  {dept} ({counts[dept.toUpperCase()] !== undefined ? counts[dept.toUpperCase()] : (counts[dept] || 0)})
                </button>
              ))}
            </div>

            {/* Select All & Search Row */}
            <div className={styles['select-all-row']}>
              
              {/* Select All Checkbox */}
              <label className={styles['select-all-label']}>
                <input 
                  type="checkbox" 
                  checked={isAllSelected}
                  onChange={toggleSelectAll}
                />
                SELECT ALL VISIBLE STUDENTS
              </label>
              
              {/* Search Bar Input */}
              <div className={styles['search-input-wrapper']}>
                <Search className={styles['search-icon']} size={14} />
                <input 
                  type="text" 
                  placeholder="Search student name, roll..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            {/* Checkable Students List */}
            <div className={styles['student-list']}>
              {loading ? (
                <div style={{textAlign: 'center', padding: '2rem', color: '#64748b'}}>Loading students...</div>
              ) : filteredStudents.length === 0 ? (
                <div style={{textAlign: 'center', padding: '2rem', color: '#64748b'}}>No students found matching your criteria.</div>
              ) : (
                filteredStudents.map(student => (
                  <label 
                    key={student.roll_no} 
                    className={`${styles['student-item']} ${selectedStudents.has(student.roll_no) ? styles['selected'] : ''}`}
                  >
                    {/* Individual Student Checkbox */}
                    <input 
                      type="checkbox" 
                      checked={selectedStudents.has(student.roll_no)}
                      onChange={() => toggleStudent(student.roll_no)}
                    />
                    
                    {/* Avatar Letter */}
                    <div className={styles['student-avatar']}>
                      {student.name ? student.name.charAt(0).toUpperCase() : 'S'}
                    </div>
                    
                    {/* Student Info */}
                    <div className={styles['student-info']}>
                      <h4 className={styles['student-name']}>{student.name}</h4>
                      <p className={styles['student-meta']}>Roll: {student.roll_no} • {student.email}</p>
                    </div>
                    
                    {/* Department Badge */}
                    <span className={`${styles['dept-badge']} ${styles[student.department?.toLowerCase()] || ''}`}>
                      {student.department?.toUpperCase()}
                    </span>
                  </label>
                ))
              )}
            </div>
          </div>
        </div>

        {/* ── Section D: Modal Footer ── */}
        <div className={styles['assign-modal-footer']}>
          
          {/* Live Selected Students Counter */}
          <div className={styles['selection-count']}>
            <User size={16} /> {selectedStudents.size} student(s) selected
          </div>
          
          {/* Footer Action Buttons */}
          <div className={styles['footer-actions']}>
            <button className={styles['cancel-btn']} onClick={onClose} type="button">
              Cancel
            </button>
            
            <button 
              className={styles['confirm-btn']} 
              onClick={handleAssign}
              disabled={submitting || selectedStudents.size === 0}
              type="button"
            >
              {submitting ? 'Assigning...' : 'Assign Test Now'} <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* ── Manage Questions Modal Sub-Popup ── */}
      {showManageQuestions && (
        <ManageQuestionsModal 
          test={localTest}
          onClose={() => setShowManageQuestions(false)}
          onUpdate={(newCount) => {
            // Local state me question count update karo taaki badge par number refresh ho jaye
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
