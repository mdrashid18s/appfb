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
  FileText,
  ShoppingBag
} from 'lucide-react';
import CohortContent from '../components/CohortContent';
import StudentTimetable from '../components/StudentTimetable';
import SiteFooter from '../components/SiteFooter';
import StudentHomework from '../components/StudentHomework';
import StudentAnalyticsBanner from '../components/StudentAnalyticsBanner';
import NotificationBell from '../components/NotificationBell';
import StudentStore from '../components/StudentStore';
import MyProfile from './MyProfile';
import NoticeboardView from './NoticeboardView';
import { useToast } from '../contexts/ToastContext';
import Reportcard from './Reportcard';

export default function StudentDashboard() {
  const location = useLocation();
  const navigate = useNavigate();
  const toast = useToast();

  const getInitialTab = () => {
    const p = window.location.pathname;
    if (p.includes('/profile')) return 'profile';
    if (p.includes('/store') || p.includes('/products')) return 'store';
    if (p.includes('/timetable')) return 'timetable';
    if (p.includes('/homework')) return 'homework';
    if (p.includes('/notices')) return 'notices';
    if (p.includes('/analytics')) return 'analytics';
    if (p.includes('/missed')) return 'missed';
    if (p.includes('/history')) return 'history';
    if (p.includes('/reportcard')) return 'reportcard';
    return 'tests';
  };

  const [activeTab, setActiveTab] = useState(getInitialTab);
  const [subTab, setSubTab] = useState('cohort'); // 'cohort', 'pulse', 'transitional'
  const [activeFilter, setActiveFilter] = useState('All');
  const [viewMode, setViewMode] = useState('default');

  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [student, setStudent] = useState(null);
  const [assignedTests, setAssignedTests] = useState([]);
  const [loadingTests, setLoadingTests] = useState(true);

  /** Real-time Cart Count for Top Navbar */
  const [cartCount, setCartCount] = useState(() => {
    try {
      const saved = localStorage.getItem('appfb_student_cart');
      return saved ? JSON.parse(saved).length : 0;
    } catch (e) {
      return 0;
    }
  });

  useEffect(() => {
    const updateCartCount = () => {
      try {
        const saved = localStorage.getItem('appfb_student_cart');
        setCartCount(saved ? JSON.parse(saved).length : 0);
      } catch (e) {
        setCartCount(0);
      }
    };

    window.addEventListener('cartUpdated', updateCartCount);
    window.addEventListener('storage', updateCartCount);
    return () => {
      window.removeEventListener('cartUpdated', updateCartCount);
      window.removeEventListener('storage', updateCartCount);
    };
  }, []);

  // Mandatory Profile Modal
  const [showProfileModal, setShowProfileModal] = useState(false);
  const SCHOOL_YEARS = [
    'Year 6', 'Year 7', 'Year 8', 'Year 9', 'Year 10',
    'Year 11', 'Year 12', 'Year 13', 'GCSE', 'A-Level'
  ];

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

      if (location.pathname.includes('/profile')) {
        setActiveTab('profile');
      } else if (location.pathname.includes('/store') || location.pathname.includes('/products')) {
        setActiveTab('store');
      } else if (location.pathname.includes('/timetable')) {
        setActiveTab('timetable');
      } else if (location.pathname.includes('/homework')) {
        setActiveTab('homework');
      } else if (location.pathname.includes('/notices')) {
        setActiveTab('notices');
      } else if (location.pathname.includes('/analytics')) {
        setActiveTab('analytics');
      } else if (location.pathname.includes('/missed')) {
        setActiveTab('missed');
      } else if (location.pathname.includes('/history')) {
        setActiveTab('history');
      } else if (location.pathname.includes('/reportcard')) {
        setActiveTab('reportcard');
      } else {
        setActiveTab('tests');
      }
    } else {
      navigate('/login/student');
    }
  }, [navigate, location.pathname]);

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
          <img src="/logo.svg" alt="XL Education" className={styles.brandLogoImg} />
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
            onClick={() => { setActiveTab('tests'); navigate('/student'); setMobileSidebarOpen(false); }}
          >
            <ClipboardList size={18} className={styles.navIcon} />
            <span>My Tests & Papers</span>
            <ChevronRight size={14} className={styles.navArrow} />
          </button>

          <button
            className={`${styles.navItem} ${activeTab === 'analytics' ? styles.navItemActive : ''}`}
            onClick={() => { setActiveTab('analytics'); navigate('/student/analytics'); setMobileSidebarOpen(false); }}
          >
            <Award size={18} className={styles.navIcon} />
            <span>Performance & Rank</span>
            <ChevronRight size={14} className={styles.navArrow} />
          </button>

          <button
            className={`${styles.navItem} ${activeTab === 'timetable' ? styles.navItemActive : ''}`}
            onClick={() => { setActiveTab('timetable'); navigate('/student/timetable'); setMobileSidebarOpen(false); }}
          >
            <CalendarDays size={18} className={styles.navIcon} />
            <span>Class Timetable</span>
            <ChevronRight size={14} className={styles.navArrow} />
          </button>

          <button
            className={`${styles.navItem} ${activeTab === 'homework' ? styles.navItemActive : ''}`}
            onClick={() => { setActiveTab('homework'); navigate('/student/homework'); setMobileSidebarOpen(false); }}
          >
            <FileText size={18} className={styles.navIcon} />
            <span>Weekly Homework</span>
            <ChevronRight size={14} className={styles.navArrow} />
          </button>

          <button
            className={`${styles.navItem} ${activeTab === 'store' ? styles.navItemActive : ''}`}
            onClick={() => { setActiveTab('store'); navigate('/student/store'); setMobileSidebarOpen(false); }}
            style={{
              background: activeTab === 'store' ? 'linear-gradient(135deg, #4f46e5 0%, #4338ca 100%)' : undefined,
              color: activeTab === 'store' ? '#ffffff' : undefined
            }}
          >
            <ShoppingBag size={18} className={styles.navIcon} />
            <span>Product Catalog</span>
            <ChevronRight size={14} className={styles.navArrow} />
          </button>

          <button
            className={`${styles.navItem} ${activeTab === 'notices' ? styles.navItemActive : ''}`}
            onClick={() => { setActiveTab('notices'); navigate('/student/notices'); setMobileSidebarOpen(false); }}
          >
            <Megaphone size={18} className={styles.navIcon} />
            <span>Noticeboard</span>
            <ChevronRight size={14} className={styles.navArrow} />
          </button>

          <button
            className={`${styles.navItem} ${activeTab === 'reportcard' ? styles.navItemActive : ''}`}
            onClick={() => { setActiveTab('reportcard'); navigate('/student/reportcard'); setMobileSidebarOpen(false); }}
          >
            <Award size={18} className={styles.navIcon} />
            <span>Report Card</span>
            <ChevronRight size={14} className={styles.navArrow} />
          </button>

          <button
            className={`${styles.navItem} ${activeTab === 'missed' ? styles.navItemActive : ''}`}
            onClick={() => { setActiveTab('missed'); navigate('/student/missed'); setMobileSidebarOpen(false); }}
          >
            <AlertTriangle size={18} className={styles.navIcon} />
            <span>Missed Tests</span>
            {missedTestsCount > 0 && <span className={styles.navBadge}>{missedTestsCount}</span>}
            <ChevronRight size={14} className={styles.navArrow} />
          </button>

          <button
            className={`${styles.navItem} ${activeTab === 'history' ? styles.navItemActive : ''}`}
            onClick={() => { setActiveTab('history'); navigate('/student/history'); setMobileSidebarOpen(false); }}
          >
            <Clock size={18} className={styles.navIcon} />
            <span>Test History</span>
            <ChevronRight size={14} className={styles.navArrow} />
          </button>

          <button
            className={`${styles.navItem} ${activeTab === 'profile' ? styles.navItemActive : ''}`}
            onClick={() => { setActiveTab('profile'); navigate('/student/profile'); setMobileSidebarOpen(false); }}
          >
            <User size={18} className={styles.navIcon} />
            <span>My Profile</span>
            <ChevronRight size={14} className={styles.navArrow} />
          </button>
        </nav>

        {/* Sidebar Footer User Card */}
        <div className={styles.sidebarFooter}>
          <div
            className={styles.userCard}
            onClick={() => { setActiveTab('profile'); navigate('/student/profile'); setMobileSidebarOpen(false); }}
            style={{ cursor: 'pointer' }}
            title="View My Profile"
          >
            <div className={styles.userAvatar}>
              {student.dp ? (
                <img src={`/${student.dp}`} alt="DP" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
              ) : (
                studentInitial
              )}
            </div>
            <div className={styles.userInfo}>
              <span className={styles.userName}>{student.name || 'Student'}</span>
              <span className={styles.userRole}>{student['roll no'] || student.roll_no || student.login_id || 'ID: Active'}</span>
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
                {activeTab === 'reportcard' && 'Academic Performance & Marksheets'}
                {activeTab === 'missed' && 'Missed Exam Attempt Recovery'}
                {activeTab === 'history' && 'Past Scorecards & Detailed Solutions'}
                {activeTab === 'profile' && 'Student Profile & Personal Information'}
              </h1>
            </div>
          </div>

          <div className={styles.topNavRight}>
            <button
              type="button"
              className={styles.topNavCartBtn}
              onClick={() => {
                setActiveTab('store');
                navigate('/student/dashboard?tab=store');
                setTimeout(() => {
                  window.dispatchEvent(new Event('openStoreCart'));
                }, 100);
              }}
              title="View Shopping Cart"
              aria-label={`Shopping Cart (${cartCount} items)`}
            >
              <ShoppingBag size={18} />
              {cartCount > 0 && <span className={styles.topNavCartBadge}>{cartCount}</span>}
            </button>

            <NotificationBell 
              role="student" 
              student={student} 
              onSelectTab={(tab) => {
                setActiveTab(tab);
                if (tab === 'tests') navigate('/student');
                else navigate(`/student/${tab}`);
              }} 
            />

            <div className={styles.deptBadgePill}>
              <GraduationCap size={14} color="#ea580c" />
              <span>{student.course_name || student.department || student.course?.name || student.course?.code || 'Year 5'}</span>
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
                  setActiveFilter={() => { }}
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
          {/* Report Card Tab */}
          {activeTab === 'reportcard' && (
            <div className={styles.contentCard} style={{ padding: 0, overflow: 'hidden' }}>
              <Reportcard student={student} />
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
              setActiveFilter={() => { }}
              viewMode="missed"
              tests={assignedTests}
              loading={loadingTests}
            />
          )}

          {/* Test History Tab */}
          {activeTab === 'history' && (
            <CohortContent
              activeFilter="All"
              setActiveFilter={() => { }}
              viewMode="history"
              tests={assignedTests}
              loading={loadingTests}
            />
          )}

          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <MyProfile
              student={student}
              onUpdateStudent={handleUpdateStudent}
              onBack={() => { setActiveTab('tests'); navigate('/student'); }}
            />
          )}

          {/* Store & Products Tab */}
          {activeTab === 'store' && (
            <StudentStore student={student} />
          )}

          {/* Unified Site Footer */}
          <div style={{ marginTop: '3rem', margin: '3rem -2rem -2rem', overflow: 'hidden', borderRadius: '0 0 1rem 1rem' }}>
            <SiteFooter showFloatingWa={false} />
          </div>
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
                <label>SCHOOL YEAR / CLASS *</label>
                <select
                  value={profileForm.department}
                  onChange={e => setProfileForm({ ...profileForm, department: e.target.value })}
                  required
                >
                  <option value="">Select Year / Class</option>
                  {SCHOOL_YEARS.map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
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
