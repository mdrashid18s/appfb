/**
 * @file StudentDashboard.jsx
 * @description Unified Student Dashboard with Modern Left Sidebar & Top Cohort/Pulse/Transitional Sub-Tabs.
 * Combines Left Sidebar Navigation with Cohort, Pulse, Transitional, Timetable, Missed Tests, History, and Profile.
 */

import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import styles from './StudentDashboard.module.css';
import { 
  ClipboardList, 
  Award, 
  CalendarDays, 
  Megaphone, 
  AlertTriangle, 
  Clock, 
  User, 
  LogOut, 
  ChevronRight, 
  Menu, 
  X,
  GraduationCap,
  Users,
  Activity,
  ArrowRightLeft,
  FileText
} from 'lucide-react';
import CohortContent from '../components/CohortContent';
import StudentTimetable from '../components/StudentTimetable';
import StudentHomework from '../components/StudentHomework';
import StudentAnalyticsBanner from '../components/StudentAnalyticsBanner';
import NotificationBell from '../components/NotificationBell';
import MyProfile from './MyProfile';
import NoticeboardView from './NoticeboardView';
import { useToast } from '../contexts/ToastContext';

export default function StudentDashboard() {
  const location = useLocation();
  const navigate = useNavigate();
  const toast = useToast();

  const [activeTab, setActiveTab] = useState('tests'); // 'tests', 'analytics', 'timetable', 'notices', 'missed', 'history', 'profile'
  const [subTab, setSubTab] = useState('cohort'); // 'cohort', 'pulse', 'transitional'
  const [activeFilter, setActiveFilter] = useState('All');
  const [viewMode, setViewMode] = useState('default');

  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [student, setStudent] = useState(null);
  const [assignedTests, setAssignedTests] = useState([]);
  const [loadingTests, setLoadingTests] = useState(true);

  // Mandatory Profile Modal
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileForm, setProfileForm] = useState({
    name: '', department: '', phone_no: '', dob: '', address: ''
  });
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileError, setProfileError] = useState('');

  useEffect(() => {
    const storedStudent = localStorage.getItem('student');
    if (storedStudent) {
      const parsedStudent = JSON.parse(storedStudent);
      setStudent(parsedStudent);
      
      // Show profile modal ONLY for brand new email users
      const isNew = localStorage.getItem('isNewUser') === 'true';
      if (isNew) {
        setShowProfileModal(true);
      } else {
        setShowProfileModal(false);
      }
      
      const rollNoToUse = parsedStudent['roll no'] || parsedStudent.roll_no || parsedStudent.login_id || parsedStudent.id;
      if (rollNoToUse) {
        fetchAssignedTests(rollNoToUse);
      } else {
        setLoadingTests(false);
      }
    } else {
      navigate('/login/student');
    }
  }, [navigate]);

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
        setAssignedTests(data.tests || []);
      }
    } catch (err) {
      console.error('Failed to fetch assigned tests', err);
    }
    setLoadingTests(false);
  };

  const handleUpdateStudent = (updatedStudent) => {
    setStudent(updatedStudent);
    localStorage.setItem('student', JSON.stringify(updatedStudent));
  };

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
        console.error(err);
      }
    }
    localStorage.clear();
    navigate('/');
  };

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
        handleUpdateStudent(data.student);
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

  if (!student) return null;

  const now = new Date();
  const missedTestsCount = assignedTests.filter(t => t.status !== 'completed' && t.expiry_datetime && new Date(t.expiry_datetime) < now).length;
  const studentInitial = student.name ? student.name.charAt(0).toUpperCase() : 'S';

  return (
    <div className={styles.appContainer}>
      {/* Sidebar Overlay for Mobile */}
      {mobileSidebarOpen && (
        <div 
          className={styles.sidebarBackdrop}
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* ── LEFT SIDEBAR ────────────────────────────────── */}
      <aside className={`${styles.sidebar} ${mobileSidebarOpen ? styles.sidebarMobileOpen : ''}`}>
        {/* Brand Header */}
        <div className={styles.sidebarHeader}>
          <div className={styles.brandIconBox}>
            <span className={styles.brandLogoText}>XL</span>
          </div>
          <div className={styles.brandTitleWrap}>
            <h2 className={styles.brandTitle}>XL Education</h2>
            <span className={styles.brandBadge}>Student Portal</span>
          </div>
          <button 
            className={styles.mobileCloseBtn} 
            onClick={() => setMobileSidebarOpen(false)}
          >
            <X size={20} />
          </button>
        </div>

        {/* Sidebar Nav Items */}
        <nav className={styles.sidebarNav}>
          <button
            className={`${styles.navItem} ${activeTab === 'tests' ? styles.navItemActive : ''}`}
            onClick={() => { setActiveTab('tests'); setMobileSidebarOpen(false); }}
          >
            <ClipboardList size={18} className={styles.navIcon} />
            <span>My Tests & Papers</span>
            <ChevronRight size={14} className={styles.navArrow} />
          </button>

          <button
            className={`${styles.navItem} ${activeTab === 'analytics' ? styles.navItemActive : ''}`}
            onClick={() => { setActiveTab('analytics'); setMobileSidebarOpen(false); }}
          >
            <Award size={18} className={styles.navIcon} />
            <span>Performance & Rank</span>
            <ChevronRight size={14} className={styles.navArrow} />
          </button>

          <button
            className={`${styles.navItem} ${activeTab === 'timetable' ? styles.navItemActive : ''}`}
            onClick={() => { setActiveTab('timetable'); setMobileSidebarOpen(false); }}
          >
            <CalendarDays size={18} className={styles.navIcon} />
            <span>Class Timetable</span>
            <ChevronRight size={14} className={styles.navArrow} />
          </button>

          <button
            className={`${styles.navItem} ${activeTab === 'homework' ? styles.navItemActive : ''}`}
            onClick={() => { setActiveTab('homework'); setMobileSidebarOpen(false); }}
          >
            <FileText size={18} className={styles.navIcon} />
            <span>Weekly Homework</span>
            <ChevronRight size={14} className={styles.navArrow} />
          </button>

          <button
            className={`${styles.navItem} ${activeTab === 'notices' ? styles.navItemActive : ''}`}
            onClick={() => { setActiveTab('notices'); setMobileSidebarOpen(false); }}
          >
            <Megaphone size={18} className={styles.navIcon} />
            <span>Noticeboard</span>
            <ChevronRight size={14} className={styles.navArrow} />
          </button>

          <button
            className={`${styles.navItem} ${activeTab === 'missed' ? styles.navItemActive : ''}`}
            onClick={() => { setActiveTab('missed'); setMobileSidebarOpen(false); }}
          >
            <AlertTriangle size={18} className={styles.navIcon} />
            <span>Missed Tests</span>
            {missedTestsCount > 0 && <span className={styles.navBadge}>{missedTestsCount}</span>}
            <ChevronRight size={14} className={styles.navArrow} />
          </button>

          <button
            className={`${styles.navItem} ${activeTab === 'history' ? styles.navItemActive : ''}`}
            onClick={() => { setActiveTab('history'); setMobileSidebarOpen(false); }}
          >
            <Clock size={18} className={styles.navIcon} />
            <span>Test History</span>
            <ChevronRight size={14} className={styles.navArrow} />
          </button>

          <button
            className={`${styles.navItem} ${activeTab === 'profile' ? styles.navItemActive : ''}`}
            onClick={() => { setActiveTab('profile'); setMobileSidebarOpen(false); }}
          >
            <User size={18} className={styles.navIcon} />
            <span>My Profile</span>
            <ChevronRight size={14} className={styles.navArrow} />
          </button>
        </nav>

        {/* Sidebar Footer User Card */}
        <div className={styles.sidebarFooter}>
          <div className={styles.userCard}>
            <div className={styles.userAvatar}>
              {student.dp ? (
                <img src={`/${student.dp}`} alt="DP" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
              ) : (
                studentInitial
              )}
            </div>
            <div className={styles.userInfo}>
              <span className={styles.userName}>{student.name}</span>
              <span className={styles.userRole}>Roll #{student['roll no'] || student.roll_no || 'STU'}</span>
            </div>
          </div>

          <button className={styles.logoutBtn} onClick={handleLogout} title="Logout">
            <LogOut size={16} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* ── MAIN CONTENT WRAPPER ───────────────────────────── */}
      <main className={styles.mainWrapper}>
        {/* Top Navbar */}
        <header className={styles.topNavbar}>
          <div className={styles.topNavLeft}>
            <button 
              className={styles.hamburgerBtn} 
              onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
            >
              <Menu size={22} />
            </button>

            <div className={styles.breadcrumbArea}>
              <span className={styles.breadcrumbRoot}>Student Portal</span>
              <span className={styles.breadcrumbSlash}>/</span>
              <h1 className={styles.breadcrumbCurrent}>
                {activeTab === 'tests' && 'Assigned Test Papers & Tasks'}
                {activeTab === 'analytics' && 'Batch Rank & Performance Analytics'}
                {activeTab === 'timetable' && 'Class & Exam Schedule Timetable'}
                {activeTab === 'homework' && 'Weekly Course Homework & Tasks'}
                {activeTab === 'notices' && 'Academic Noticeboard Announcements'}
                {activeTab === 'missed' && 'Missed Exam Attempt Recovery'}
                {activeTab === 'history' && 'Past Scorecards & Detailed Solutions'}
                {activeTab === 'profile' && 'Student Profile & Personal Information'}
              </h1>
            </div>
          </div>

          <div className={styles.topNavRight}>
            <NotificationBell role="student" student={student} onSelectTab={(tab) => setActiveTab(tab)} />
            <div className={styles.deptBadgePill}>
              <GraduationCap size={14} color="#ea580c" />
              <span>{student.department || 'BCA'}</span>
            </div>
          </div>
        </header>

        {/* Page Content Body */}
        <div className={styles.pageBody}>
          {/* My Tests Tab (Includes Cohort, Homework, Pulse, Transitional Top Sub-Tabs) */}
          {activeTab === 'tests' && (
            <div className={styles.testsContainer}>
              {/* Top Sub-Nav Bar (Cohort, Pulse, Transitional Sub-Tabs) */}
              <div className={styles.topSubNav}>
                <div className={styles.subTabs}>
                  <button 
                    className={`${styles.subTabBtn} ${subTab === 'cohort' ? styles.subTabActive : ''}`}
                    onClick={() => { setSubTab('cohort'); setViewMode('default'); }}
                  >
                    <Users size={16} /> Cohort
                  </button>
                  <button 
                    className={`${styles.subTabBtn} ${subTab === 'pulse' ? styles.subTabActive : ''}`}
                    onClick={() => { setSubTab('pulse'); setViewMode('default'); }}
                  >
                    <Activity size={16} /> Pulse
                  </button>
                  <button 
                    className={`${styles.subTabBtn} ${subTab === 'transitional' ? styles.subTabActive : ''}`}
                    onClick={() => { setSubTab('transitional'); setViewMode('default'); }}
                  >
                    <ArrowRightLeft size={16} /> Transitional
                  </button>
                </div>
              </div>

              {/* Sub-Tab Content Rendering */}
              {subTab === 'cohort' && (
                <CohortContent 
                  activeFilter={activeFilter} 
                  setActiveFilter={setActiveFilter} 
                  viewMode={viewMode}
                  tests={assignedTests.filter(t => t.category !== 'Transitional')}
                  loading={loadingTests}
                />
              )}

              {subTab === 'pulse' && (
                <div className={styles.contentCard}>
                  <h3>Pulse Practice Tests</h3>
                  <p>Daily micro-practice tests and instant skill checks.</p>
                  <CohortContent 
                    activeFilter={activeFilter} 
                    setActiveFilter={setActiveFilter} 
                    viewMode={viewMode}
                    tests={assignedTests.filter(t => t.category === 'Pulse' || t.category === 'Weekly')}
                    loading={loadingTests}
                  />
                </div>
              )}

              {subTab === 'transitional' && (
                <CohortContent 
                  activeFilter="All"
                  setActiveFilter={() => {}}
                  viewMode={viewMode}
                  tests={assignedTests.filter(t => t.category === 'Transitional')}
                  loading={loadingTests}
                  isTransitional={true}
                />
              )}
            </div>
          )}

          {/* Analytics & Rank Tab */}
          {activeTab === 'analytics' && (
            <div className={styles.contentCard}>
              <StudentAnalyticsBanner student={student} />
            </div>
          )}

          {/* Timetable Tab */}
          {activeTab === 'timetable' && (
            <div className={styles.contentCard}>
              <StudentTimetable student={student} />
            </div>
          )}

          {/* Weekly Homework Tab */}
          {activeTab === 'homework' && (
            <div className={styles.contentCard}>
              <StudentHomework student={student} />
            </div>
          )}

          {/* Noticeboard Tab */}
          {activeTab === 'notices' && (
            <div className={styles.contentCard}>
              <NoticeboardView embedded={true} student={student} />
            </div>
          )}

          {/* Missed Tests Tab */}
          {activeTab === 'missed' && (
            <CohortContent 
              activeFilter="All" 
              setActiveFilter={() => {}} 
              viewMode="missed" 
              tests={assignedTests} 
              loading={loadingTests} 
            />
          )}

          {/* Test History Tab */}
          {activeTab === 'history' && (
            <CohortContent 
              activeFilter="All" 
              setActiveFilter={() => {}} 
              viewMode="history" 
              tests={assignedTests} 
              loading={loadingTests} 
            />
          )}

          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <MyProfile student={student} onUpdateStudent={handleUpdateStudent} />
          )}
        </div>
      </main>

      {/* Mandatory Profile Completion Modal */}
      {showProfileModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <h2>Complete Your Student Profile</h2>
            <p>Please provide your academic details to access your portal.</p>
            
            {profileError && (
              <div className={styles.errorBox}>{profileError}</div>
            )}
            
            <form onSubmit={handleProfileSubmit} className={styles.profileModalForm}>
              <div className={styles.formGroup}>
                <label>FULL NAME *</label>
                <input 
                  type="text" 
                  value={profileForm.name} 
                  onChange={e => setProfileForm({ ...profileForm, name: e.target.value })} 
                  placeholder="Enter full name"
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label>DEPARTMENT / COURSE *</label>
                <select 
                  value={profileForm.department} 
                  onChange={e => setProfileForm({ ...profileForm, department: e.target.value })}
                  required
                >
                  <option value="">Select Department</option>
                  <option value="BCA">BCA - Computer Applications</option>
                  <option value="BBA">BBA - Business Administration</option>
                  <option value="BCOM">BCOM - Commerce</option>
                </select>
              </div>

              <div className={styles.formGroup}>
                <label>PHONE NUMBER *</label>
                <input 
                  type="tel" 
                  value={profileForm.phone_no} 
                  onChange={e => setProfileForm({ ...profileForm, phone_no: e.target.value })} 
                  placeholder="Phone number"
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label>DATE OF BIRTH *</label>
                <input 
                  type="date" 
                  value={profileForm.dob} 
                  onChange={e => setProfileForm({ ...profileForm, dob: e.target.value })} 
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label>ADDRESS *</label>
                <input 
                  type="text" 
                  value={profileForm.address} 
                  onChange={e => setProfileForm({ ...profileForm, address: e.target.value })} 
                  placeholder="Residential Address"
                  required
                />
              </div>

              <button type="submit" className={styles.submitProfileBtn} disabled={savingProfile}>
                {savingProfile ? 'Saving Profile...' : 'Save & Continue'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
