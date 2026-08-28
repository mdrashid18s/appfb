/**
 * @file StudentPortal.jsx
 * @description Main Student Portal Layout & Sub-router Component.
 * Fetches assigned test papers for the logged-in student, manages student session/logout,
 * and renders top navigation tabs (Cohort, Pulse, Transitional, Missed Tests, History).
 */

import React, { useState, useEffect } from 'react';
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { 
  ChevronDown, 
  Users, 
  Activity, 
  ArrowRightLeft, 
  AlertTriangle, 
  ClipboardList,
  CalendarDays,
  FileText,
  ShoppingBag
} from 'lucide-react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { format } from 'date-fns';
import MyProfile from './MyProfile';
import CohortContent from '../components/CohortContent';
import StudentTimetable from '../components/StudentTimetable';
import StudentHomework from '../components/StudentHomework';
import StudentAnalyticsBanner from '../components/StudentAnalyticsBanner';
import StudentStore from '../components/StudentStore';
import styles from '../App.module.css';

/**
 * Main Student Portal page layout component.
 * @returns {JSX.Element|null} Student dashboard layout or null if unauthenticated
 */
export default function StudentPortal() {
  const location = useLocation();
  const navigate = useNavigate();
  
  /** Category filter selection state ('All', 'Mock', 'Weekly', 'Milestone', etc.) */
  const [activeFilter, setActiveFilter] = useState('All');

  /** Active view mode state ('default', 'missed', 'history') */
  const [viewMode, setViewMode] = useState('default');

  /** Logged-in student user object loaded from localStorage */
  const [student, setStudent] = useState(null);

  /** Visibility toggle state for the Profile dropdown */
  const [showAccountDropdown, setShowAccountDropdown] = useState(false);

  /** Array of test papers assigned to the current student from the API */
  const [assignedTests, setAssignedTests] = useState([]);

  /** Loading indicator state for the test fetching API request */
  const [loadingTests, setLoadingTests] = useState(true);

  /** State for Mandatory Profile Completion Modal */
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileForm, setProfileForm] = useState({
    name: '', department: '', phone_no: '', dob: '', address: ''
  });
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileError, setProfileError] = useState('');

  /**
   * Effect hook: Verify student session on component mount and fetch assigned tests.
   */
  useEffect(() => {
    const storedStudent = localStorage.getItem('student');
    if (storedStudent) {
      const parsedStudent = JSON.parse(storedStudent);
      setStudent(parsedStudent);

      // Fetch fresh enriched student profile from database
      if (parsedStudent.id) {
        fetch(`/api/student/${parsedStudent.id}/profile`)
          .then(res => res.json())
          .then(data => {
            if (data.success && data.student) {
              setStudent(data.student);
              localStorage.setItem('student', JSON.stringify(data.student));
            }
          })
          .catch(err => console.error("Error loading student profile:", err));
      }
      
      // Show profile completion modal ONLY for new email users
      const isNew = localStorage.getItem('isNewUser') === 'true';

      if (isNew) {
        setShowProfileModal(true);
      } else {
        setShowProfileModal(false);
      }
      
      const rollNoToUse = parsedStudent['roll no'] || parsedStudent.roll_no || parsedStudent.login_id;
      if (rollNoToUse) {
        fetchAssignedTests(rollNoToUse);
      } else {
        setLoadingTests(false);
      }
    } else {
      // Redirect to login if no student session exists
      navigate('/login/student');
    }
  }, [navigate]);

  /**
   * Fetches tests assigned to the student's roll number from backend API.
   * @param {string} rollNo - Student's roll number identifier
   */
  const fetchAssignedTests = async (rollNo) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/student/${rollNo}/tests`, {
        headers: { 
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}` 
        }
      });
      if (res.status === 401) {
        handleLogout();
        return;
      }
      const data = await res.json();
      if (data.success) {
        setAssignedTests(data.tests);
      }
    } catch (err) {
      console.error('Failed to fetch assigned tests', err);
    }
    setLoadingTests(false);
  };

  /** Current URL pathname used for tab active highlighting */
  const currentPath = location.pathname;
  const now = new Date();
  
  /** Number of expired tests that the student missed (uncompleted and past expiry) */
  const missedTestsCount = assignedTests.filter(t => t.status !== 'completed' && t.expiry_datetime && new Date(t.expiry_datetime) < now).length;


  /** First letter of student name for fallback avatar display */
  const studentInitial = student?.name ? student.name.charAt(0).toUpperCase() : 'S';
  const studentName = student?.name || 'Account';

  /**
   * Handler to update student profile data in local state and localStorage.
   * @param {Object} updatedStudent - Updated student object
   */
  const handleUpdateStudent = (updatedStudent) => {
    setStudent(updatedStudent);
    localStorage.setItem('student', JSON.stringify(updatedStudent));
  };

  /**
   * Logs out the student by invalidating Sanctum token and clearing localStorage.
   */
  const handleLogout = async () => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        await fetch('/api/logout', {
          method: 'POST',
          headers: {
            'Accept': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });
      } catch (err) {
        console.error('Logout error', err);
      }
    }
    localStorage.clear();
    setShowAccountDropdown(false);
    navigate('/');
  };


  if (!student) return null; // Avoid rendering content before redirect checks

  const isProfilePage = currentPath.includes('/student/profile');

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setProfileError('');
    if (!profileForm.name || !profileForm.phone_no || !profileForm.department || !profileForm.dob || !profileForm.address) {
      setProfileError('All fields are required.');
      return;
    }
    setSavingProfile(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/student/${student.id}/update`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(profileForm)
      });
      const data = await res.json();
      if (data.success) {
        const updatedStudentObj = {
          ...student,
          ...data.student,
          name: profileForm.name || data.student?.name || student?.name,
          department: profileForm.department || data.student?.department || student?.department
        };
        handleUpdateStudent(updatedStudentObj);
        localStorage.removeItem('isNewUser');
        setShowProfileModal(false);
      } else {
        setProfileError(data.message || 'Failed to update profile');
      }
    } catch (err) {
      console.error(err);
      setProfileError('Network error while saving profile');
    }
    setSavingProfile(false);
  };

  return (
    <div className={styles['container']}>
      {/* Mandatory Profile Completion Modal */}
      {showProfileModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(15,23,42,0.95)', zIndex: 99999,
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <div style={{
            background: 'white', borderRadius: '12px', padding: '30px',
            width: '90%', maxWidth: '500px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)'
          }}>
            <h2 style={{ margin: '0 0 10px 0', color: '#0f172a' }}>Complete Your Profile</h2>
            <p style={{ margin: '0 0 20px 0', color: '#64748b' }}>Please provide your details to continue.</p>
            
            {profileError && (
              <div style={{ background: '#fef2f2', color: '#ef4444', padding: '10px', borderRadius: '6px', marginBottom: '16px', fontSize: '14px' }}>
                {profileError}
              </div>
            )}
            
            <form onSubmit={handleProfileSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, marginBottom: '6px' }}>Roll Number (Auto-assigned)</label>
                <input type="text" value={student['roll no'] || student.roll_no || student.login_id || ''} style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '6px', boxSizing: 'border-box', backgroundColor: '#e2e8f0', color: '#64748b', cursor: 'not-allowed' }} readOnly disabled />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, marginBottom: '6px' }}>Full Name <span style={{color: '#ef4444'}}>*</span></label>
                <input type="text" value={profileForm.name} onChange={e => setProfileForm({...profileForm, name: e.target.value})} style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '6px', boxSizing: 'border-box' }} required />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, marginBottom: '6px' }}>Class / Year <span style={{color: '#ef4444'}}>*</span></label>
                  <input type="text" value={profileForm.department} onChange={e => setProfileForm({...profileForm, department: e.target.value})} placeholder="e.g. Year 5 (11+ Prep)" style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '6px', boxSizing: 'border-box' }} required />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, marginBottom: '6px' }}>Phone Number <span style={{color: '#ef4444'}}>*</span></label>
                  <input type="text" value={profileForm.phone_no} onChange={e => setProfileForm({...profileForm, phone_no: e.target.value})} style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '6px', boxSizing: 'border-box' }} required />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, marginBottom: '6px' }}>Date of Birth <span style={{color: '#ef4444'}}>*</span></label>
                  <DatePicker 
                    selected={profileForm.dob ? new Date(profileForm.dob) : null} 
                    onChange={date => setProfileForm({...profileForm, dob: date ? format(date, 'yyyy-MM-dd') : ''})} 
                    dateFormat="dd MMM yyyy"
                    showYearDropdown
                    scrollableYearDropdown
                    yearDropdownItemNumber={100}
                    customInput={<input style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '6px', boxSizing: 'border-box' }} required />}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, marginBottom: '6px' }}>Address <span style={{color: '#ef4444'}}>*</span></label>
                  <input type="text" value={profileForm.address} onChange={e => setProfileForm({...profileForm, address: e.target.value})} style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '6px', boxSizing: 'border-box' }} required />
                </div>
              </div>
              <button type="submit" disabled={savingProfile} style={{
                marginTop: '10px', width: '100%', padding: '12px', background: '#f97316', color: 'white',
                border: 'none', borderRadius: '6px', fontWeight: 600, cursor: savingProfile ? 'not-allowed' : 'pointer'
              }}>
                {savingProfile ? 'Saving...' : 'Save & Continue'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Student Portal Top Header */}
      {!isProfilePage && (
      <header className={styles['header']}>
        <div className={styles['header-left']}>
          <span className={styles['overline']}>
            {currentPath.includes('/homework') ? 'Assigned Homework' : currentPath.includes('/timetable') ? 'Weekly Schedule' : 'Assigned to you'}
          </span>
          <h1>
            {currentPath.includes('/homework') ? 'Weekly Homework' : currentPath.includes('/timetable') ? 'Class Timetable' : 'Practice tests'}
          </h1>
          <p>
            {currentPath.includes('/homework') 
              ? 'View your course homework assignments and track daily task progress.' 
              : currentPath.includes('/timetable')
              ? 'View your department weekly lecture timetable and faculty schedule.'
              : 'Track every assigned paper and jump back in where you left off.'}
          </p>
        </div>
        
        {/* Profile Avatar / Account Button */}
        <div style={{position: 'relative'}}>
          <button className={styles['account-btn']} onClick={() => setShowAccountDropdown(!showAccountDropdown)} title="View Account">
          <div className={styles['account-avatar']}>
            {student.dp && (
              <img 
                src={`/${student.dp}`} 
                alt="DP" 
                style={{width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover'}} 
                onError={(e) => {
                  e.target.style.display = 'none';
                  if (e.target.nextElementSibling) {
                    e.target.nextElementSibling.style.display = 'flex';
                  }
                }}
              />
            )}
            <span style={{ display: student.dp ? 'none' : 'flex', width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' }}>
              {studentInitial}
            </span>
          </div>
          {studentName}
          <ChevronDown size={16} color="#64748b" />
        </button>

        {/* Account Dropdown Menu */}
        {showAccountDropdown && (
          <div style={{
            position: 'absolute',
            top: '100%',
            right: 0,
            marginTop: '0.5rem',
            background: 'white',
            borderRadius: '0.5rem',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
            border: '1px solid #e2e8f0',
            width: '200px',
            zIndex: 50,
            overflow: 'hidden'
          }}>
            <button 
              onClick={() => { setShowAccountDropdown(false); navigate('/student/profile'); }}
              style={{
                width: '100%', padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem',
                border: 'none', background: 'transparent', cursor: 'pointer', textAlign: 'left',
                borderBottom: '1px solid #f1f5f9', color: '#0f172a', fontSize: '0.9rem'
              }}
              onMouseOver={(e) => e.currentTarget.style.background = '#f8fafc'}
              onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
            >
              My Profile
            </button>
            <button 
              onClick={() => { setShowAccountDropdown(false); handleLogout(); }}
              style={{
                width: '100%', padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem',
                border: 'none', background: 'transparent', cursor: 'pointer', textAlign: 'left',
                color: '#ef4444', fontSize: '0.9rem'
              }}
              onMouseOver={(e) => e.currentTarget.style.background = '#fef2f2'}
              onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
            >
              Logout
            </button>
          </div>
        )}
        </div>
      </header>
      )}



      {/* Student Analytics & Noticeboard Ticker Banner */}
      {!isProfilePage && <StudentAnalyticsBanner student={student} />}

      {/* Navigation Tabs & Action Buttons */}
      {!isProfilePage && (
      <div className={styles['nav-actions']}>
        {/* Navigation Category Tabs */}
        <div className={styles['tabs']}>
          <button 
            className={`${styles['tab']} ${currentPath === '/student' || currentPath === '/student/' ? styles['active'] : ''}`}
            onClick={() => { setViewMode('default'); navigate('/student'); }}
          >
            <Users size={16} />
            Cohort
          </button>
          <button 
            className={`${styles['tab']} ${currentPath === '/student/homework' ? styles['active'] : ''}`}
            onClick={() => { setViewMode('default'); navigate('/student/homework'); }}
          >
            <FileText size={16} />
            Homework
          </button>
          <button 
            className={`${styles['tab']} ${currentPath === '/student/pulse' ? styles['active'] : ''}`}
            onClick={() => { setViewMode('default'); navigate('/student/pulse'); }}
          >
            <Activity size={16} />
            Pulse
          </button>
          <button 
            className={`${styles['tab']} ${currentPath === '/student/transitional' ? styles['active'] : ''}`}
            onClick={() => { setViewMode('default'); navigate('/student/transitional'); }}
          >
            <ArrowRightLeft size={16} />
            Transitional
          </button>
          <button 
            className={`${styles['tab']} ${currentPath === '/student/store' ? styles['active'] : ''}`}
            onClick={() => { setViewMode('default'); navigate('/student/store'); }}
            style={{ background: currentPath === '/student/store' ? 'linear-gradient(135deg, #4f46e5 0%, #4338ca 100%)' : undefined, color: currentPath === '/student/store' ? '#ffffff' : undefined }}
          >
            <ShoppingBag size={16} />
            Product Catalog
          </button>
        </div>

        {/* Action Toggle Buttons (Homework, Timetable, Missed Tests & Test History) */}
        <div className={styles['action-buttons']}>
          {/* Homework Button */}
          <button
            className={`${styles['timetable-btn']} ${currentPath === '/student/homework' ? styles['timetable-btn-active'] : ''}`}
            onClick={() => navigate('/student/homework')}
            style={{ background: currentPath === '/student/homework' ? '#4f46e5' : undefined, color: currentPath === '/student/homework' ? '#ffffff' : undefined }}
          >
            <FileText size={15} />
            Homework
          </button>

          {/* Timetable Button — Placed next to Homework */}
          <button
            className={`${styles['timetable-btn']} ${currentPath === '/student/timetable' ? styles['timetable-btn-active'] : ''}`}
            onClick={() => navigate('/student/timetable')}
          >
            <CalendarDays size={15} />
            Timetable
          </button>

          {currentPath === '/student/transitional' ? (
            <button 
              className={`${styles['btn']} ${styles['transitional-header-btn']}`} 
              onClick={() => {
                const el = document.getElementById('completed-tests-section');
                if (el) {
                  el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
              }}
            >
              <ClipboardList size={16} />
              <span>Completed Tests</span>
              <span className={styles['header-badge-count']}>↓</span>
            </button>
          ) : (
            <>
              {/* Missed Tests Toggle */}
              <button 
                className={`${styles['btn']} ${viewMode === 'missed' ? styles['active-dark'] : styles['btn-danger']}`}
                onClick={() => setViewMode(viewMode === 'missed' ? 'default' : 'missed')}
              >
                <AlertTriangle size={16} />
                Missed Tests
                {missedTestsCount > 0 && (
                  <span style={{
                    background: viewMode === 'missed' ? '#ef4444' : 'white', 
                    color: viewMode === 'missed' ? 'white' : '#ef4444', 
                    borderRadius: '50%', 
                    minWidth: '20px',
                    height: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.75rem', 
                    fontWeight: 'bold',
                    marginLeft: '4px'
                  }}>
                    {missedTestsCount}
                  </span>
                )}
              </button>
              
              {/* Test History Toggle */}
              <button 
                className={`${styles['btn']} ${viewMode === 'history' ? styles['active-dark'] : ''}`}
                onClick={() => setViewMode(viewMode === 'history' ? 'default' : 'history')}
              >
                <ClipboardList size={16} />
                Test History
              </button>
            </>
          )}
        </div>
      </div>
      )}

      {/* Sub-Routes for Student Dashboard Sections */}
      <Routes>
        <Route path="/" element={
          <CohortContent 
            activeFilter={activeFilter} 
            setActiveFilter={setActiveFilter} 
            viewMode={viewMode}
            tests={assignedTests.filter(t => t.category !== 'Transitional')}
            loading={loadingTests}
          />
        } />
        <Route path="/pulse" element={<div>Pulse tests go here</div>} />
        <Route path="/transitional" element={
          <CohortContent 
            activeFilter="All"
            setActiveFilter={() => {}}
            viewMode={viewMode}
            tests={assignedTests.filter(t => t.category === 'Transitional')}
            loading={loadingTests}
            isTransitional={true}
          />
        } />
        <Route path="/profile" element={
          <MyProfile 
            student={student} 
            onUpdateStudent={handleUpdateStudent} 
          />
        } />
        <Route path="/timetable" element={
          <StudentTimetable student={student} />
        } />
        <Route path="/homework" element={
          <StudentHomework student={student} />
        } />
        <Route path="/store" element={
          <StudentStore student={student} />
        } />
      </Routes>
    </div>
  );
}
