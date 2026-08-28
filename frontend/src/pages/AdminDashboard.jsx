/**
 * @file AdminDashboard.jsx
 * @description Modern Administrator Control Center & Dashboard with Left Sidebar Navigation.
 * Provides sidebar navigation for Test Templates, Timetable Manager, Faculty Directory, and Student Management.
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './AdminDashboard.module.css';
import { 
  LogOut, 
  Plus, 
  UserPlus, 
  Trash2, 
  GraduationCap, 
  CalendarDays, 
  ClipboardList,
  Menu,
  X,
  Users,
  ShieldCheck,
  ChevronRight,
  BookOpen,
  Sparkles,
  Bell,
  Search,
  CheckCircle2,
  HelpCircle,
  Award,
  Megaphone,
  Settings,
  FileText,
  ShoppingBag,
  Building2,
  MessageSquare,
  UserCheck,
  ChevronDown,
  Layers,
  School
} from 'lucide-react';
import AssignTestModal from '../components/AssignTestModal';
import AssignedStudentsModal from '../components/AssignedStudentsModal';
import TimetableEditor from '../components/TimetableEditor';
import HomeworkEditor from '../components/HomeworkEditor';
import ErrorBoundary from '../components/ErrorBoundary';
import FacultyDirectory from './FacultyDirectory';
import StudentDirectory from './StudentDirectory';
import TestResultsView from './TestResultsView';
import NoticeboardView from './NoticeboardView';
import AdminSettingsView from './AdminSettingsView';
import AdminStoreView from './AdminStoreView';
import AdminBranchesView from './AdminBranchesView';
import AdminParentMessagesView from './AdminParentMessagesView';
import SiteFooter from '../components/SiteFooter';
import SubjectDirectory from './SubjectDirectory';
import NotificationBell from '../components/NotificationBell';
import { useToast } from '../contexts/ToastContext';

export default function AdminDashboard({ admin, onLogout }) {
  const navigate = useNavigate();
  const toast = useToast();

  /** Active tab view */
  const [activeTab, setActiveTab] = useState('tests');

  /** Collapsible Navigation Groups state */
  const [openGroups, setOpenGroups] = useState({
    academics: true,
    operations: false,
    admissions: false,
  });

  const toggleGroup = (groupKey) => {
    setOpenGroups(prev => ({
      ...prev,
      [groupKey]: !prev[groupKey]
    }));
  };

  // Auto-expand group if active tab belongs to it
  useEffect(() => {
    if (['tests', 'results', 'homework', 'subjects'].includes(activeTab)) {
      setOpenGroups(p => ({ ...p, academics: true }));
    } else if (['branches', 'timetable', 'notices', 'store'].includes(activeTab)) {
      setOpenGroups(p => ({ ...p, operations: true }));
    } else if (['parent_messages', 'students', 'faculty'].includes(activeTab)) {
      setOpenGroups(p => ({ ...p, admissions: true }));
    }
  }, [activeTab]);

  /** Mobile sidebar open drawer state */
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  /** Array of saved test templates fetched from the backend API */
  const [tests, setTests] = useState([]);

  /** Loading state for saving or fetching operations */
  const [loading, setLoading] = useState(false);

  /** Currently selected test object for the Assign Test modal overlay */
  const [selectedTestToAssign, setSelectedTestToAssign] = useState(null);

  /** Currently selected test object for viewing assigned students modal */
  const [selectedTestForView, setSelectedTestForView] = useState(null);

  /** Form state holding field values for creating a new test template */
  const [form, setForm] = useState({
    category: 'Weekly Test',
    code: '',
    name: '',
    description: '',
    questions_count: '',
    total_marks: '',
    duration: '',
    papers_count: '1',
    question_pdf: null
  });

  const [masterCourses, setMasterCourses] = useState([]);
  const [totalStudentsCount, setTotalStudentsCount] = useState(454);
  const [totalFacultyCount, setTotalFacultyCount] = useState(18);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    fetchTests();
    fetchCourses();
    fetchDashboardStats();
  }, [activeTab]);

  const fetchDashboardStats = async () => {
    try {
      const [stdRes, facRes] = await Promise.all([
        fetch('/api/admin/students', { headers: { Accept: 'application/json' } }),
        fetch('/api/admin/teachers', { headers: { Accept: 'application/json' } })
      ]);
      const stdData = await stdRes.json();
      const facData = await facRes.json();
      if (stdData.success && stdData.students) {
        setTotalStudentsCount(stdData.students.length);
      }
      if (facData.success && facData.teachers) {
        setTotalFacultyCount(facData.teachers.length);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchCourses = async () => {
    try {
      const res = await fetch('/api/admin/courses', { headers: { Accept: 'application/json' } });
      const data = await res.json();
      if (data.success && data.courses) {
        setMasterCourses(data.courses);
      }
    } catch (err) {
      console.error('Failed to fetch courses', err);
    }
  };

  const fetchTests = async () => {
    try {
      const res = await fetch('/api/admin/tests', {
        headers: { 'Accept': 'application/json' }
      });
      const data = await res.json();
      if (data.success) {
        setTests(data.tests);
      }
    } catch (err) {
      console.error('Failed to fetch tests', err);
    }
  };

  const handleChange = (e) => {
    if (e.target.name === 'question_pdf') {
      setForm({ ...form, question_pdf: e.target.files[0] });
    } else {
      setForm({ ...form, [e.target.name]: e.target.value });
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.code || !form.name || !form.questions_count || !form.total_marks || !form.duration) {
      toast.error('Please fill in all required test fields');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('category', form.category);
      formData.append('code', form.code);
      formData.append('name', form.name);
      formData.append('description', form.description || '');
      formData.append('questions_count', form.questions_count);
      formData.append('total_marks', form.total_marks);
      formData.append('duration', form.duration);
      formData.append('papers_count', form.papers_count);
      if (form.question_pdf) {
        formData.append('question_pdf', form.question_pdf);
      }

      const res = await fetch('/api/admin/tests', {
        method: 'POST',
        headers: { 'Accept': 'application/json' },
        body: formData
      });
      const data = await res.json();

      if (data.success) {
        toast.success('Test Template created successfully!');
        setForm({
          category: 'Weekly Test',
          code: '',
          name: '',
          description: '',
          questions_count: '',
          total_marks: '',
          duration: '',
          papers_count: '1',
          question_pdf: null
        });
        fetchTests();
      } else {
        toast.error('Failed to create test: ' + (data.message || 'Validation error'));
      }
    } catch (err) {
      console.error(err);
      toast.error('Network error creating test');
    }
    setLoading(false);
  };

  const handleDeleteTest = async (testId) => {
    if (!window.confirm('Are you sure you want to delete this test template?')) return;
    try {
      const res = await fetch(`/api/admin/tests/${testId}`, {
        method: 'DELETE',
        headers: { 'Accept': 'application/json' }
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Test deleted successfully');
        fetchTests();
      } else {
        toast.error('Error deleting test: ' + (data.message || 'Unknown error'));
      }
    } catch (err) {
      console.error(err);
      toast.error('Network error while deleting test');
    }
  };

  const getInitials = (name) => {
    if (!name) return 'AD';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <div className={styles.appContainer}>
      {/* Mobile Backdrop Overlay */}
      {mobileSidebarOpen && (
        <div 
          className={styles.sidebarOverlay} 
          onClick={() => setMobileSidebarOpen(false)} 
        />
      )}

      {/* ── LEFT SIDEBAR NAVIGATION ── */}
      <aside className={`${styles.sidebar} ${mobileSidebarOpen ? styles.sidebarOpen : ''}`}>
        {/* Sidebar Brand Header */}
        <div className={styles.sidebarHeader}>
          <img src="/logo.svg" alt="XL Education" className={styles.brandLogoImg} />
          <div className={styles.brandTitleWrap}>
            <h2 className={styles.brandTitle}>XL Education</h2>
            <span className={styles.brandBadge}>Super Admin</span>
          </div>
          <button 
            className={styles.mobileCloseBtn} 
            onClick={() => setMobileSidebarOpen(false)}
          >
            <X size={20} />
          </button>
        </div>

        {/* Sidebar Navigation Menu */}
        <nav className={styles.sidebarNav}>
          <button
            className={`${styles.navItem} ${activeTab === 'tests' ? styles.navItemActive : ''}`}
            onClick={() => { setActiveTab('tests'); setMobileSidebarOpen(false); }}
            title="Test Templates"
          >
            <ClipboardList size={18} className={styles.navIcon} />
            <span>Test Templates</span>
            <ChevronRight size={14} className={styles.navArrow} />
          </button>

          <button
            className={`${styles.navItem} ${activeTab === 'results' ? styles.navItemActive : ''}`}
            onClick={() => { setActiveTab('results'); setMobileSidebarOpen(false); }}
            title="Test Results"
          >
            <Award size={18} className={styles.navIcon} />
            <span>Test Results</span>
            <ChevronRight size={14} className={styles.navArrow} />
          </button>

          <button
            className={`${styles.navItem} ${activeTab === 'homework' ? styles.navItemActive : ''}`}
            onClick={() => { setActiveTab('homework'); setMobileSidebarOpen(false); }}
            title="Homework Manager"
          >
            <FileText size={18} className={styles.navIcon} />
            <span>Homework Manager</span>
            <ChevronRight size={14} className={styles.navArrow} />
          </button>

          <button
            className={`${styles.navItem} ${activeTab === 'timetable' ? styles.navItemActive : ''}`}
            onClick={() => { setActiveTab('timetable'); setMobileSidebarOpen(false); }}
            title="Timetable Manager"
          >
            <CalendarDays size={18} className={styles.navIcon} />
            <span>Timetable Manager</span>
            <ChevronRight size={14} className={styles.navArrow} />
          </button>

          <button
            className={`${styles.navItem} ${activeTab === 'branches' ? styles.navItemActive : ''}`}
            onClick={() => { setActiveTab('branches'); setMobileSidebarOpen(false); }}
            title="Branches & Locations"
          >
            <Building2 size={18} className={styles.navIcon} />
            <span>Branches & Locations</span>
            <ChevronRight size={14} className={styles.navArrow} />
          </button>

          <button
            className={`${styles.navItem} ${activeTab === 'parent_messages' ? styles.navItemActive : ''}`}
            onClick={() => { setActiveTab('parent_messages'); setMobileSidebarOpen(false); }}
            title="Parent Messages"
          >
            <MessageSquare size={18} className={styles.navIcon} />
            <span>Parent Messages</span>
            <ChevronRight size={14} className={styles.navArrow} />
          </button>

          <button
            className={`${styles.navItem} ${activeTab === 'store' ? styles.navItemActive : ''}`}
            onClick={() => { setActiveTab('store'); setMobileSidebarOpen(false); }}
            title="Product Catalog"
          >
            <ShoppingBag size={18} className={styles.navIcon} />
            <span>Product Store</span>
            <ChevronRight size={14} className={styles.navArrow} />
          </button>

          <button
            className={`${styles.navItem} ${activeTab === 'students' ? styles.navItemActive : ''}`}
            onClick={() => { setActiveTab('students'); setMobileSidebarOpen(false); }}
            title="Student Directory"
          >
            <Users size={18} className={styles.navIcon} />
            <span>Students Directory</span>
            <ChevronRight size={14} className={styles.navArrow} />
          </button>

          <button
            className={`${styles.navItem} ${activeTab === 'faculty' ? styles.navItemActive : ''}`}
            onClick={() => { setActiveTab('faculty'); setMobileSidebarOpen(false); }}
            title="Faculty Directory"
          >
            <GraduationCap size={18} className={styles.navIcon} />
            <span>Faculty Directory</span>
            <ChevronRight size={14} className={styles.navArrow} />
          </button>

          <button
            className={`${styles.navItem} ${activeTab === 'subjects' ? styles.navItemActive : ''}`}
            onClick={() => { setActiveTab('subjects'); setMobileSidebarOpen(false); }}
            title="Subject Directory"
          >
            <BookOpen size={18} className={styles.navIcon} />
            <span>Subject Directory</span>
            <ChevronRight size={14} className={styles.navArrow} />
          </button>

          <button
            className={`${styles.navItem} ${activeTab === 'notices' ? styles.navItemActive : ''}`}
            onClick={() => { setActiveTab('notices'); setMobileSidebarOpen(false); }}
            title="Noticeboard"
          >
            <Megaphone size={18} className={styles.navIcon} />
            <span>Noticeboard</span>
            <ChevronRight size={14} className={styles.navArrow} />
          </button>

          <button
            className={`${styles.navItem} ${activeTab === 'settings' ? styles.navItemActive : ''}`}
            onClick={() => { setActiveTab('settings'); setMobileSidebarOpen(false); }}
            title="Settings"
          >
            <Settings size={18} className={styles.navIcon} />
            <span>Settings</span>
            <ChevronRight size={14} className={styles.navArrow} />
          </button>
        </nav>

        {/* Sidebar Footer User Card */}
        <div className={styles.sidebarFooter}>
          <div className={styles.userCard}>
            <div className={styles.userAvatar}>{getInitials(admin.name)}</div>
            <div className={styles.userInfo}>
              <span className={styles.userName}>{admin.name}</span>
              <span className={styles.userRole}>Administrator</span>
            </div>
          </div>

          <button className={styles.logoutBtn} onClick={onLogout} title="Log Out">
            <LogOut size={16} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* ── MAIN CONTENT AREA ── */}
      <main className={styles.mainLayout}>
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
              <span className={styles.breadcrumbRoot}>Admin Control Center</span>
              <span className={styles.breadcrumbSlash}>/</span>
              <h1 className={styles.breadcrumbCurrent}>
                {activeTab === 'tests' && 'Test Templates & Student Assignments'}
                {activeTab === 'timetable' && 'Timetable Schedule Manager'}
                {activeTab === 'homework' && 'Weekly Homework Schedule & Assignment'}
                {activeTab === 'faculty' && 'Faculty & Academic Directory'}
                {activeTab === 'students' && 'Master Student Directory & Records'}
                {activeTab === 'subjects' && 'Subject Master Directory & Curriculum'}
                {activeTab === 'results' && 'Student Exam Scorecards & Reports'}
                {activeTab === 'notices' && 'Academic Noticeboard & Announcements'}
                {activeTab === 'settings' && 'Admin Settings & Security Preferences'}
              </h1>
            </div>
          </div>

          <div className={styles.topNavRight}>
            <NotificationBell role="admin" />

            <div className={styles.adminPill}>
              <Sparkles size={14} color="#10b981" />
              <span>Admin Online</span>
            </div>
          </div>
        </header>

        {/* Page Content Body */}
        <div className={styles.pageBody}>
          {/* KPI Summary Cards Grid */}
          <div className={styles.kpiGrid}>
            <div className={styles.kpiCard}>
              <div className={`${styles.kpiIconBox} ${styles.kpiOrange}`}>
                <GraduationCap size={22} />
              </div>
              <div className={styles.kpiInfo}>
                <span className={styles.kpiValue}>{totalStudentsCount}</span>
                <span className={styles.kpiLabel}>Enrolled Students</span>
              </div>
            </div>

            <div className={styles.kpiCard}>
              <div className={`${styles.kpiIconBox} ${styles.kpiBlue}`}>
                <Users size={22} />
              </div>
              <div className={styles.kpiInfo}>
                <span className={styles.kpiValue}>{totalFacultyCount || 18}</span>
                <span className={styles.kpiLabel}>Faculty Members</span>
              </div>
            </div>

            <div className={styles.kpiCard}>
              <div className={`${styles.kpiIconBox} ${styles.kpiGreen}`}>
                <ClipboardList size={22} />
              </div>
              <div className={styles.kpiInfo}>
                <span className={styles.kpiValue}>{tests.length}</span>
                <span className={styles.kpiLabel}>Test Templates</span>
              </div>
            </div>

            <div className={styles.kpiCard}>
              <div className={`${styles.kpiIconBox} ${styles.kpiPurple}`}>
                <BookOpen size={22} />
              </div>
              <div className={styles.kpiInfo}>
                <span className={styles.kpiValue}>{masterCourses.length}</span>
                <span className={styles.kpiLabel}>Academic Courses</span>
              </div>
            </div>
          </div>
          {/* ── Timetable Tab ── */}
          {activeTab === 'timetable' && (
            <div className={styles.contentCard}>
              <TimetableEditor onOpenFaculty={() => setActiveTab('faculty')} />
            </div>
          )}

          {/* ── Homework Tab ── */}
          {activeTab === 'homework' && (
            <ErrorBoundary title="Homework Manager">
              <HomeworkEditor />
            </ErrorBoundary>
          )}

          {/* ── Faculty Directory Tab ── */}
          {activeTab === 'faculty' && (
            <div className={styles.contentCard}>
              <FacultyDirectory embedded={true} />
            </div>
          )}

          {/* ── Student Directory Tab ── */}
          {activeTab === 'students' && (
            <div className={styles.contentCard}>
              <StudentDirectory embedded={true} />
            </div>
          )}

          {/* ── Subject Directory Tab ── */}
          {activeTab === 'subjects' && (
            <div className={styles.contentCard}>
              <SubjectDirectory embedded={true} />
            </div>
          )}

          {/* ── Test Results Tab ── */}
          {activeTab === 'results' && (
            <div className={styles.contentCard}>
              <TestResultsView embedded={true} />
            </div>
          )}

          {/* ── Noticeboard Tab ── */}
          {activeTab === 'notices' && (
            <div className={styles.contentCard}>
              <NoticeboardView embedded={true} />
            </div>
          )}

          {/* ── Store & Orders Tab ── */}
          {activeTab === 'store' && (
            <div className={styles.contentCard}>
              <AdminStoreView />
            </div>
          )}

          {/* ── Branches & Locations Tab ── */}
          {activeTab === 'branches' && (
            <div className={styles.contentCard} style={{ padding: 0, overflow: 'hidden' }}>
              <AdminBranchesView />
            </div>
          )}

          {/* ── Parent Messages & Enquiries Tab ── */}
          {activeTab === 'parent_messages' && (
            <div className={styles.contentCard} style={{ padding: 0, overflow: 'hidden' }}>
              <AdminParentMessagesView />
            </div>
          )}

          {/* ── Settings Tab ── */}
          {activeTab === 'settings' && (
            <div className={styles.contentCard}>
              <AdminSettingsView admin={admin} embedded={true} />
            </div>
          )}

          {/* ── Tests Tab ── */}
          {activeTab === 'tests' && (
            <>
              {/* Card 1: Create Test Template Form */}
              <div className={styles.contentCard}>
                <div className={styles.cardHeader}>
                  <h2>Create Test Template</h2>
                  <p>Fill in test details to save a test template in database. Saved tests will not be assigned to students until you click "Assign Test".</p>
                </div>
                
                <form className={styles['create-test-form']} onSubmit={handleSave}>
                  <div className={styles['form-row-3']}>
                    {/* Category Select */}
                    <div className={styles['form-group']}>
                      <label>TEST CATEGORY</label>
                      <select name="category" value={form.category} onChange={handleChange}>
                        <option value="Weekly Test">Weekly Test</option>
                        <option value="Mock Test">Mock Test</option>
                        <option value="Milestone">Milestone</option>
                        <option value="Creative Writing">Creative Writing</option>
                        <option value="Chapter Test">Chapter Test</option>
                        <option value="Full Length Test">Full Length Test</option>
                      </select>
                    </div>

                    {/* Test Code */}
                    <div className={styles['form-group']}>
                      <label>TEST CODE (UNIQUE IDENTIFIER)</label>
                      <input 
                        type="text" 
                        name="code" 
                        placeholder="e.g. MTF-01" 
                        value={form.code} 
                        onChange={handleChange} 
                        required 
                      />
                    </div>

                    {/* Test Name */}
                    <div className={styles['form-group']}>
                      <label>TEST NAME / TITLE</label>
                      <input 
                        type="text" 
                        name="name" 
                        placeholder="e.g. Mathematics Foundations Test" 
                        value={form.name} 
                        onChange={handleChange} 
                        required 
                      />
                    </div>
                  </div>

                  {/* Description */}
                  <div className={styles['form-group']}>
                    <label>DESCRIPTION (OPTIONAL)</label>
                    <input 
                      type="text" 
                      name="description" 
                      placeholder="e.g. Covers Linear Algebra and Differential Calculus" 
                      value={form.description} 
                      onChange={handleChange} 
                    />
                  </div>

                  <div className={styles['form-row-4']}>
                    {/* Questions Count */}
                    <div className={styles['form-group']}>
                      <label>TOTAL QUESTIONS</label>
                      <input 
                        type="number" 
                        name="questions_count" 
                        placeholder="e.g. 50" 
                        value={form.questions_count} 
                        onChange={handleChange} 
                        required 
                      />
                    </div>

                    {/* Total Marks */}
                    <div className={styles['form-group']}>
                      <label>TOTAL MARKS</label>
                      <input 
                        type="number" 
                        name="total_marks" 
                        placeholder="e.g. 200" 
                        value={form.total_marks} 
                        onChange={handleChange} 
                        required 
                      />
                    </div>

                    {/* Duration in Minutes */}
                    <div className={styles['form-group']}>
                      <label>DURATION (MINUTES)</label>
                      <input 
                        type="number" 
                        name="duration" 
                        placeholder="e.g. 60" 
                        value={form.duration} 
                        onChange={handleChange} 
                        required 
                      />
                    </div>

                    {/* Papers Count */}
                    <div className={styles['form-group']}>
                      <label>PAPERS COUNT</label>
                      <input 
                        type="number" 
                        name="papers_count" 
                        placeholder="1" 
                        value={form.papers_count} 
                        onChange={handleChange} 
                      />
                    </div>
                  </div>

                  <button 
                    type="submit" 
                    className={styles['submit-btn']} 
                    disabled={loading}
                  >
                    <Plus size={18} /> {loading ? 'Saving Template...' : 'Save Test Template'}
                  </button>
                </form>
              </div>

              {/* Card 2: Test Templates Table */}
              <div className={styles.contentCard} style={{ marginTop: '24px' }}>
                <div className={styles['card-header']}>
                  <h2>Saved Test Templates ({tests.length})</h2>
                  <p>All test templates stored in system. Assign tests to specific students using the "Assign Test" button.</p>
                </div>

                <div className={styles['table-responsive']}>
                  <table className={styles['tests-table']}>
                    <thead>
                      <tr>
                        <th>CATEGORY</th>
                        <th>TEST CODE</th>
                        <th>TEST NAME</th>
                        <th>QUESTIONS</th>
                        <th>MARKS</th>
                        <th>DURATION</th>
                        <th>PAPERS</th>
                        <th>ASSIGNED COUNT</th>
                        <th>ACTIONS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tests.length === 0 ? (
                        <tr>
                          <td colSpan="9" className={styles['empty-state']}>
                            No test templates created yet. Fill out the form above to create one.
                          </td>
                        </tr>
                      ) : (
                        tests.map((test) => (
                          <tr key={test.id}>
                            <td>
                              <span className={`${styles['badge']} ${styles['badge-category']}`}>
                                {test.category}
                              </span>
                            </td>
                            <td><strong>{test.code}</strong></td>
                            <td>{test.name}</td>
                            <td>{test.questions} Q</td>
                            <td>{test.marks} Marks</td>
                            <td>{test.duration} min</td>
                            <td>{test.papers}</td>
                            <td>
                              <button 
                                className={styles['assigned-count-btn']} 
                                onClick={() => setSelectedTestForView(test)}
                                title="View assigned students"
                              >
                                <GraduationCap size={14} style={{ marginRight: '4px' }} />
                                {test.assigned_count || 0} Students
                              </button>
                            </td>
                            <td>
                              <div className={styles['action-btn-group']}>
                                <button 
                                  className={styles['assign-btn']}
                                  onClick={() => setSelectedTestToAssign(test)}
                                >
                                  <UserPlus size={14} /> Assign Test
                                </button>
                                <button 
                                  className={styles['delete-btn']}
                                  onClick={() => handleDeleteTest(test.id)}
                                  title="Delete Template"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>

                  {/* Mobile Stacked Card View */}
                  <div className={styles['mobile-card-list']}>
                    {tests.length === 0 ? (
                      <div className={styles['empty-state']}>
                        No test templates created yet. Fill out the form above to create one.
                      </div>
                    ) : (
                      tests.map((test) => (
                        <div key={test.id} className={styles['mobile-test-card']}>
                          <div className={styles['mobile-card-header']}>
                            <span className={`${styles['badge']} ${styles['badge-category']}`}>
                              {test.category}
                            </span>
                          </div>
                          <div className={styles['mobile-card-code']}>{test.code}</div>
                          <div className={styles['mobile-card-name']}>{test.name}</div>
                          <div className={styles['mobile-card-stats']}>
                            <span className={styles['mobile-card-stat']}>📝 {test.questions} Q</span>
                            <span className={styles['mobile-card-stat']}>⏱ {test.duration} min</span>
                            <span className={styles['mobile-card-stat']}>📄 {test.papers} Papers</span>
                          </div>
                          <div className={styles['mobile-card-actions']}>
                            <button className={styles['assign-btn']} onClick={() => setSelectedTestToAssign(test)}>
                              <UserPlus size={14} /> Assign Test
                            </button>
                            <div 
                              className={styles['assigned-pill']}
                              onClick={() => setSelectedTestForView(test)}
                            >
                              <GraduationCap size={14} style={{ marginRight: '3px' }} /> {test.assigned_count || 0}
                            </div>
                            <button className={styles['delete-btn']} onClick={() => handleDeleteTest(test.id)}>
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Unified Site Footer */}
          <div style={{ marginTop: '3rem', margin: '3rem -2rem -2rem', overflow: 'hidden', borderRadius: '0 0 1rem 1rem' }}>
            <SiteFooter showFloatingWa={false} />
          </div>
        </div>
      </main>

      {/* Assign Test Overlay Modal */}
      {selectedTestToAssign && (
        <AssignTestModal 
          test={selectedTestToAssign} 
          onClose={() => setSelectedTestToAssign(null)} 
          onAssignSuccess={() => {
            fetchTests();
          }} 
        />
      )}

      {/* View & Unassign Students Modal Overlay */}
      {selectedTestForView && (
        <AssignedStudentsModal
          test={selectedTestForView}
          onClose={() => setSelectedTestForView(null)}
          onUpdate={() => {
            fetchTests();
          }}
        />
      )}
    </div>
  );
}
