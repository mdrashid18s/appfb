/**
 * @file Reportcard.jsx
 * @description Master Academic Report Card & Marksheet Component.
 * 
 * Yeh component student ke sabhi assessments, test scores, grades, aur performance badges
 * ko do clean interactive views mein display karta hai:
 *   1. List View: Subject-wise Test Cards with Search, Subject filter chips, aur summary statistics.
 *   2. Dedicated Marksheet View: Official A4 Academic Marksheet with Verified Seal, Grading breakdown,
 *      Faculty evaluation remarks, aur 100% Blank-Page Free Direct PDF Print capability.
 * 
 * Dual Device Optimized: Mobile, Tablet aur Laptop sabhi screen sizes par perfectly responsive layout.
 */

import React, { useState, useEffect } from 'react';
import styles from './Reportcard.module.css';
import { 
  Award, 
  GraduationCap, 
  CheckCircle, 
  Clock, 
  FileText, 
  Printer, 
  Hash, 
  Calendar, 
  Building2, 
  ShieldCheck, 
  Sparkles, 
  AlertCircle, 
  ArrowLeft,
  ChevronRight,
  BookOpen,
  Search,
  CheckCircle2,
  X
} from 'lucide-react';

/**
 * Main Reportcard Component
 * 
 * @param {Object} props.student - Logged in student details (agar parent se pass kiya ho)
 */
export default function Reportcard({ student: propStudent }) {
  // State: API se aane wala complete report card data (student profile, summary, marksheet list)
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  
  // State: Selected Test for On-Screen Individual Official Marksheet Card
  const [selectedTest, setSelectedTest] = useState(null);
  
  // State: Filter & Search controls
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  // Prop change ya component mount par report data fetch karna
  useEffect(() => {
    fetchReportCards();
  }, [propStudent]);

  /**
   * Fetch Report Cards API:
   * Student roll number identify karta hai aur backend se calculated marksheet data lata hai.
   */
  const fetchReportCards = async () => {
    setLoading(true);
    setFetchError(null);

    try {
      let rollNo = null;

      // 1. Check passed prop
      if (propStudent) {
        rollNo = propStudent['roll no'] || propStudent.roll_no || propStudent.login_id || propStudent.id;
      }

      // 2. Fallback: LocalStorage student object
      if (!rollNo) {
        const stored = localStorage.getItem('student');
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            rollNo = parsed['roll no'] || parsed.roll_no || parsed.login_id || parsed.id;
          } catch (e) {
            // ignore parse error
          }
        }
      }

      // 3. Fallback: LocalStorage user object
      if (!rollNo) {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          try {
            const parsedUser = JSON.parse(storedUser);
            rollNo = parsedUser.login_id || parsedUser.student_id || parsedUser.id;
          } catch (e) {
            // ignore parse error
          }
        }
      }

      const token = localStorage.getItem('token');
      const headers = { 
        Accept: 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      };

      const url = rollNo 
        ? `/api/student/reportcards?roll_no=${encodeURIComponent(rollNo)}` 
        : '/api/student/reportcards';

      const res = await fetch(url, { headers });
      const data = await res.json();

      if (data && data.success) {
        setReportData(data);
      } else {
        setFetchError(data?.message || 'Unable to fetch report card records.');
      }
    } catch (err) {
      setFetchError('Connection error while loading report card records.');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Guaranteed 100% Blank-Free Print Engine:
   * Opens an isolated, beautifully styled A4 print document directly in a printable window.
   */
  const handlePrintTestMarksheet = (test) => {
    if (!reportData || !test) return;
    const { student } = reportData;

    const printWin = window.open('', '_blank', 'width=950,height=1000');
    if (!printWin) {
      alert('Please allow popups to print / save your marksheet PDF.');
      return;
    }

    const campusName = typeof student.centre === 'object' 
      ? (student.centre?.centre_name || 'Main Campus') 
      : (student.centre || 'XL Education Examination Campus');

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <title>Academic Marksheet - ${test.test_name} (${student.name})</title>
        <style>
          @page {
            size: A4 portrait;
            margin: 10mm 14mm;
          }
          * {
            box-sizing: border-box;
            font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, Helvetica, Arial, sans-serif;
          }
          body {
            margin: 0;
            padding: 8px;
            background: #ffffff;
            color: #0f172a;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .sheet-box {
            border: 2px solid #0f172a;
            border-radius: 12px;
            padding: 22px;
            background: #ffffff;
            position: relative;
          }
          .header-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 2.5px solid #ea580c;
            padding-bottom: 14px;
            margin-bottom: 14px;
          }
          .brand-col {
            display: flex;
            align-items: center;
            gap: 14px;
          }
          .logo-img {
            height: 52px;
            width: auto;
          }
          .inst-title {
            font-size: 19px;
            font-weight: 900;
            color: #0f172a;
            margin: 0;
            letter-spacing: -0.5px;
          }
          .inst-sub {
            font-size: 10.5px;
            color: #64748b;
            font-weight: 600;
            margin: 2px 0 0;
          }
          .inst-campus {
            font-size: 10.5px;
            color: #ea580c;
            font-weight: 700;
            margin: 2px 0 0;
          }
          .seal-col {
            text-align: center;
            border: 1.5px dashed #f59e0b;
            background: #fffbeb;
            border-radius: 10px;
            padding: 7px 13px;
          }
          .seal-top {
            font-size: 8.5px;
            font-weight: 800;
            color: #92400e;
            display: block;
          }
          .seal-mid {
            font-size: 11.5px;
            font-weight: 900;
            color: #78350f;
            display: block;
          }
          .seal-bot {
            font-size: 8.5px;
            font-weight: 800;
            color: #16a34a;
            display: block;
          }
          .test-banner {
            background: #fff7ed;
            border: 1.5px solid #fed7aa;
            border-radius: 10px;
            padding: 11px 16px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 14px;
          }
          .category-tag {
            font-size: 9.5px;
            font-weight: 800;
            color: #ea580c;
            background: #ffedd5;
            padding: 2px 7px;
            border-radius: 4px;
            display: inline-block;
            margin-bottom: 3px;
          }
          .test-title {
            font-size: 16px;
            font-weight: 800;
            color: #0f172a;
            margin: 0 0 2px;
          }
          .test-meta {
            font-size: 10.5px;
            color: #64748b;
          }
          .grade-box {
            text-align: center;
            border: 2px solid ${test.grade_color};
            background: #ffffff;
            border-radius: 10px;
            padding: 5px 14px;
            min-width: 90px;
          }
          .grade-box-label {
            font-size: 8.5px;
            font-weight: 800;
            color: #64748b;
            display: block;
          }
          .grade-box-letter {
            font-size: 22px;
            font-weight: 900;
            color: ${test.grade_color};
            line-height: 1.1;
            display: block;
          }
          .grade-box-pct {
            font-size: 10.5px;
            font-weight: 800;
            color: ${test.grade_color};
          }
          .matrix-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 9px;
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 10px;
            padding: 10px 14px;
            margin-bottom: 14px;
          }
          .matrix-item {
            display: flex;
            flex-direction: column;
            gap: 2px;
          }
          .matrix-label {
            font-size: 8.5px;
            font-weight: 700;
            color: #64748b;
          }
          .matrix-val {
            font-size: 12.5px;
            font-weight: 800;
            color: #0f172a;
          }
          .marks-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 14px;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            overflow: hidden;
          }
          .marks-table th {
            background: #f8fafc;
            padding: 8px 11px;
            font-size: 9.5px;
            font-weight: 800;
            color: #475569;
            text-align: left;
            border-bottom: 1px solid #e2e8f0;
          }
          .marks-table td {
            padding: 10px 11px;
            font-size: 11.5px;
            border-bottom: 1px solid #f1f5f9;
            vertical-align: middle;
          }
          .remarks-card {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 10px;
            padding: 10px 14px;
            margin-bottom: 14px;
          }
          .remarks-title {
            font-size: 9.5px;
            font-weight: 800;
            color: #ea580c;
            margin-bottom: 3px;
          }
          .remarks-text {
            font-size: 11px;
            color: #334155;
            margin: 0;
            line-height: 1.35;
          }
          .legend-row {
            display: flex;
            justify-content: space-between;
            background: #ffffff;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 6px 10px;
            font-size: 9px;
            color: #475569;
            margin-bottom: 16px;
          }
          .footer-row {
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
            border-top: 1.5px solid #0f172a;
            padding-top: 12px;
          }
          .verify-box {
            font-size: 9.5px;
            color: #64748b;
            max-width: 360px;
          }
          .verify-box strong {
            color: #0f172a;
            display: block;
            margin-bottom: 2px;
          }
          .sign-col {
            text-align: right;
          }
          .sign-line {
            width: 130px;
            height: 1.5px;
            background: #0f172a;
            margin-bottom: 3px;
          }
          .sign-title {
            font-size: 10.5px;
            font-weight: 800;
            color: #0f172a;
            display: block;
          }
          .sign-sub {
            font-size: 9px;
            color: #64748b;
          }
        </style>
      </head>
      <body>
        <div class="sheet-box">
          <div class="header-row">
            <div class="brand-col">
              <img src="${window.location.origin}/logo.svg" class="logo-img" alt="XL Education" />
              <div>
                <h1 class="inst-title">XL EDUCATION ACADEMIC PORTAL</h1>
                <div class="inst-sub">Approved Assessment &amp; Examination Directorate • United Kingdom</div>
                <div class="inst-campus">Campus: ${campusName}</div>
              </div>
            </div>
            <div class="seal-col">
              <span class="seal-top">OFFICIAL</span>
              <span class="seal-mid">VERIFIED RESULT</span>
              <span class="seal-bot">TRANSCRIPT</span>
            </div>
          </div>

          <div class="test-banner">
            <div>
              <span class="category-tag">${test.category}</span>
              <h2 class="test-title">${test.test_name}</h2>
              <div class="test-meta">
                Test Code: <strong>${test.test_code}</strong> &bull; 
                Exam Date: <strong>${test.exam_date}</strong> &bull; 
                Duration: <strong>${test.duration_minutes} Mins</strong>
              </div>
            </div>
            <div class="grade-box">
              <span class="grade-box-label">GRADE</span>
              <span class="grade-box-letter">${test.grade}</span>
              <span class="grade-box-pct">${test.percentage !== null ? test.percentage + '%' : '0%'}</span>
            </div>
          </div>

          <div class="matrix-grid">
            <div class="matrix-item">
              <span class="matrix-label">CANDIDATE NAME</span>
              <span class="matrix-val">${student.name}</span>
            </div>
            <div class="matrix-item">
              <span class="matrix-label">ROLL NUMBER</span>
              <span class="matrix-val"># ${student.roll_no}</span>
            </div>
            <div class="matrix-item">
              <span class="matrix-label">CLASS / YEAR</span>
              <span class="matrix-val">${student.department}</span>
            </div>
            <div class="matrix-item">
              <span class="matrix-label">EXAM DATE</span>
              <span class="matrix-val" style="color: #ea580c;">${test.exam_date}</span>
            </div>
            <div class="matrix-item">
              <span class="matrix-label">ACADEMIC SESSION</span>
              <span class="matrix-val">${student.academic_session}</span>
            </div>
            <div class="matrix-item">
              <span class="matrix-label">PERFORMANCE STANDING</span>
              <span class="matrix-val" style="color: ${test.grade_color};">${test.performance_badge}</span>
            </div>
          </div>

          <table class="marks-table">
            <thead>
              <tr>
                <th>ASSESSMENT MODULE / PAPER</th>
                <th style="text-align: center;">QUESTIONS</th>
                <th style="text-align: center;">MAX MARKS</th>
                <th style="text-align: center;">SCORED</th>
                <th style="text-align: center;">PERCENTAGE</th>
                <th style="text-align: center;">GRADE</th>
                <th style="text-align: center;">STATUS</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>${test.test_name}</strong><br><small style="color: #64748b;">${test.category} (${test.test_code})</small></td>
                <td style="text-align: center;">${test.total_questions} Q</td>
                <td style="text-align: center;">${test.total_marks}</td>
                <td style="text-align: center; font-weight: 800; font-size: 13px;">${test.score_obtained !== null ? test.score_obtained : '0'}</td>
                <td style="text-align: center; font-weight: 800; color: ${test.grade_color}; font-size: 13px;">${test.percentage !== null ? test.percentage + '%' : '0%'}</td>
                <td style="text-align: center;"><span style="display:inline-block; padding: 2px 7px; border-radius: 4px; font-weight: 900; background: ${test.grade_color}18; color: ${test.grade_color};">${test.grade}</span></td>
                <td style="text-align: center; font-weight: 700; color: ${test.grade_color};">${test.performance_badge}</td>
              </tr>
            </tbody>
          </table>

          <div class="remarks-card">
            <div class="remarks-title">&#10024; ACADEMIC EVALUATION &amp; FACULTY REMARKS</div>
            <p class="remarks-text">${test.remarks}</p>
          </div>

          <div class="legend-row">
            <span><strong>CRITERIA:</strong></span>
            <span><strong>A*</strong> (90%+) Distinction</span>
            <span><strong>A</strong> (80-89%) Merit</span>
            <span><strong>B</strong> (70-79%) Credit</span>
            <span><strong>C</strong> (60-69%) Pass</span>
            <span><strong>D/E</strong> (&lt;60%) Needs Practice</span>
          </div>

          <div class="footer-row">
            <div class="verify-box">
              <strong>OFFICIAL ACADEMIC TRANSCRIPT</strong>
              Issued under the authority of the XL Education Board. Authenticated electronic document.
            </div>
            <div class="sign-col">
              <div class="sign-line"></div>
              <span class="sign-title">Controller of Examinations</span>
              <span class="sign-sub">XL Education Assessment Directorate UK</span>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    printWin.document.open();
    printWin.document.write(htmlContent);
    printWin.document.close();
    printWin.focus();

    setTimeout(() => {
      printWin.print();
    }, 400);
  };

  // Loading State
  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <h3>Loading Assessment Records...</h3>
        <p>Fetching your test attempts and generating academic performance report...</p>
      </div>
    );
  }

  // Error State or Empty Records State
  if (!reportData || !reportData.student || !reportData.marksheets || reportData.marksheets.length === 0) {
    return (
      <div className={styles.emptyContainer}>
        <AlertCircle size={48} color="#ea580c" />
        <h3>No Assessment Records Found</h3>
        <p>
          {fetchError || "You haven't completed any assessments yet. Once you take a test, your individual official marksheet will appear here automatically."}
        </p>
      </div>
    );
  }

  const { student, summary, marksheets } = reportData;

  // Unique categories for filter chips
  const categories = ['ALL', ...new Set(marksheets.map(m => m.category).filter(Boolean))];

  // Filtered test list according to category filter and search query
  const filteredTests = marksheets.filter(test => {
    const matchCat = categoryFilter === 'ALL' || test.category === categoryFilter;
    const query = searchTerm.toLowerCase().trim();
    const matchSearch = !query || 
      test.test_name?.toLowerCase().includes(query) || 
      test.test_code?.toLowerCase().includes(query) || 
      test.category?.toLowerCase().includes(query);
    return matchCat && matchSearch;
  });

  return (
    <div className={styles.container}>
      {/* ══════════════════════════════════════════════════════════════════════
          VIEW 1: LIST OF ALL ASSESSMENTS TAKEN (When no single test is selected)
         ══════════════════════════════════════════════════════════════════════ */}
      {!selectedTest ? (
        <div className={styles.listViewContainer}>
          {/* Header Summary Banner: Clean, Vibrant Orange & White Theme */}
          <div className={styles.summaryBanner}>
            <div className={styles.bannerLeft}>
              <div className={styles.studentAvatar}>
                {student.name ? student.name.slice(0, 2).toUpperCase() : 'ST'}
              </div>
              <div>
                <span className={styles.bannerSmallTag}>STUDENT PERFORMANCE TRANSCRIPT</span>
                <h2 className={styles.studentNameTitle}>{student.name}'s Report Cards</h2>
                <div className={styles.bannerMetaRow}>
                  <span className={styles.metaPill}><Hash size={13} color="#ea580c" /> Roll No: <strong>{student.roll_no}</strong></span>
                  <span className={styles.metaPill}><GraduationCap size={13} color="#ea580c" /> Class: <strong>{student.department}</strong></span>
                  <span className={styles.metaPill}><Calendar size={13} color="#ea580c" /> Session: <strong>{student.academic_session}</strong></span>
                </div>
              </div>
            </div>

            <div className={styles.bannerRightGrade}>
              <span className={styles.gradeHeaderLabel}>OVERALL PERFORMANCE</span>
              <div className={styles.gradeHighlightRow}>
                <span className={styles.bigGradeLetter}>{summary.overall_grade}</span>
                <div className={styles.gradePercentSub}>
                  <strong>{summary.overall_percentage}%</strong>
                  <span>Average Score</span>
                </div>
              </div>
              <span className={styles.standingBadge}>{summary.academic_standing}</span>
            </div>
          </div>

          {/* Controls Bar: Search Box & Category Filter Chips */}
          <div className={styles.controlsBar}>
            <div className={styles.searchBox}>
              <Search size={16} className={styles.searchIcon} />
              <input 
                type="text" 
                placeholder="Search by test name, code or subject..." 
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className={styles.searchInput}
              />
              {searchTerm && (
                <button 
                  onClick={() => setSearchTerm('')} 
                  className={styles.clearSearchBtn}
                  title="Clear Search"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            <div className={styles.categoryChips}>
              {categories.map(cat => (
                <button
                  key={cat}
                  className={`${styles.chipBtn} ${categoryFilter === cat ? styles.activeChip : ''}`}
                  onClick={() => setCategoryFilter(cat)}
                >
                  {cat === 'ALL' ? 'All Subjects' : cat}
                </button>
              ))}
            </div>
          </div>

          {/* Test Cards Grid Header */}
          <div className={styles.testGridHeader}>
            <h3>
              <BookOpen size={18} color="#ea580c" />
              Completed Tests &amp; Examinations ({filteredTests.length})
            </h3>
            <span className={styles.gridHint}>Click on any test to view or print its official marksheet</span>
          </div>

          {/* Test Cards Grid */}
          <div className={styles.testCardGrid}>
            {filteredTests.length === 0 ? (
              <div className={styles.noMatchBox}>
                <FileText size={32} color="#94a3b8" />
                <p>No tests found matching your search filter.</p>
                {searchTerm && (
                  <button onClick={() => { setSearchTerm(''); setCategoryFilter('ALL'); }} className={styles.resetFilterBtn}>
                    Reset Filters
                  </button>
                )}
              </div>
            ) : (
              filteredTests.map((test, index) => (
                <div key={test.student_test_id || index} className={styles.testCard}>
                  <div className={styles.testCardTop}>
                    <span className={styles.categoryTag}>{test.category}</span>
                    <span 
                      className={styles.cardGradeBadge}
                      style={{ background: `${test.grade_color}18`, color: test.grade_color, borderColor: `${test.grade_color}40` }}
                    >
                      Grade {test.grade}
                    </span>
                  </div>

                  <h4 className={styles.cardTestName}>{test.test_name}</h4>
                  <span className={styles.cardTestCode}>Code: {test.test_code}</span>

                  <div className={styles.cardScoreRow}>
                    <div className={styles.scoreBlock}>
                      <span className={styles.scoreNum}>
                        {test.score_obtained !== null ? test.score_obtained : '0'}
                      </span>
                      <span className={styles.scoreDenom}> / {test.total_marks} Marks</span>
                    </div>

                    <div className={styles.percentBlock} style={{ color: test.grade_color }}>
                      {test.percentage !== null ? `${test.percentage}%` : '0%'}
                    </div>
                  </div>

                  <div className={styles.cardMetaRow}>
                    <span style={{ color: '#ea580c', fontWeight: '700' }}><Calendar size={13} /> Date: {test.exam_date}</span>
                    <span><Clock size={12} /> {test.duration_minutes} mins</span>
                    <span><CheckCircle size={12} /> {test.total_questions} Questions</span>
                  </div>

                  <p className={styles.cardRemarks}>{test.remarks}</p>

                  <div className={styles.cardBtnGroup}>
                    <button 
                      onClick={() => {
                        setSelectedTest(test);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className={styles.openMarksheetBtn}
                    >
                      <span>View Marksheet</span>
                      <ChevronRight size={16} />
                    </button>

                    <button 
                      onClick={() => handlePrintTestMarksheet(test)}
                      className={styles.quickPrintIconBtn}
                      title="Direct Print Marksheet"
                    >
                      <Printer size={16} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      ) : (
        /* ══════════════════════════════════════════════════════════════════════
           VIEW 2: DEDICATED INDIVIDUAL TEST OFFICIAL MARKSHEET (On-Screen + Print)
           ══════════════════════════════════════════════════════════════════════ */
        <div className={styles.singleReportWrapper}>
          {/* Navigation Bar */}
          <div className={styles.navBackBar}>
            <button onClick={() => setSelectedTest(null)} className={styles.backBtn}>
              <ArrowLeft size={16} />
              <span>Back to Tests List</span>
            </button>

            <div className={styles.actionBtnGroup}>
              <button onClick={() => handlePrintTestMarksheet(selectedTest)} className={styles.printBtn}>
                <Printer size={16} />
                <span>Print / Download PDF Marksheet</span>
              </button>
            </div>
          </div>

          {/* Official Marksheet Document Container */}
          <div className={styles.officialA4Sheet}>
            {/* Header: Official Logo & Accreditation */}
            <div className={styles.sheetHeader}>
              <div className={styles.sheetHeaderLeft}>
                <img src="/logo.svg" alt="XL Education" className={styles.sheetLogo} />
                <div className={styles.sheetInstitutionText}>
                  <h1 className={styles.sheetTitle}>XL EDUCATION ACADEMIC PORTAL</h1>
                  <p className={styles.sheetSub}>Approved Examination Directorate • United Kingdom</p>
                  <p className={styles.sheetCampus}>
                    <Building2 size={12} style={{ display: 'inline', marginRight: '4px' }} />
                    {typeof student.centre === 'object' ? student.centre?.centre_name : (student.centre || 'Main Examination Campus')}
                  </p>
                </div>
              </div>

              <div className={styles.sheetHeaderRight}>
                <div className={styles.officialSealPill}>
                  <Award size={28} className={styles.sealGoldIcon} />
                  <div>
                    <span className={styles.sealTop}>OFFICIAL TRANSCRIPT</span>
                    <strong className={styles.sealMid}>VERIFIED RESULT</strong>
                    <small className={styles.sealBottom}>ACCREDITED</small>
                  </div>
                </div>
              </div>
            </div>

            <div className={styles.sheetDivider}></div>

            {/* Test Subject Banner */}
            <div className={styles.testSubjectBanner}>
              <div className={styles.testSubjectLeft}>
                <span className={styles.bannerCategoryBadge}>{selectedTest.category}</span>
                <h2 className={styles.bannerTestTitle}>{selectedTest.test_name}</h2>
                <div className={styles.bannerCodeDate}>
                  <span>Assessment Code: <strong>{selectedTest.test_code}</strong></span>
                  <span>•</span>
                  <span>Exam Date: <strong style={{ color: '#ea580c' }}>{selectedTest.exam_date}</strong></span>
                  <span>•</span>
                  <span>Duration: <strong>{selectedTest.duration_minutes} Minutes</strong></span>
                </div>
              </div>

              <div className={styles.testGradeBox} style={{ borderColor: selectedTest.grade_color }}>
                <span className={styles.testGradeLabel}>ACADEMIC GRADE</span>
                <span className={styles.testGradeLetter} style={{ color: selectedTest.grade_color }}>
                  {selectedTest.grade}
                </span>
                <span className={styles.testGradePercent} style={{ color: selectedTest.grade_color }}>
                  {selectedTest.percentage !== null ? selectedTest.percentage + '%' : '0%'}
                </span>
              </div>
            </div>

            {/* Candidate Information Matrix */}
            <div className={styles.candidateMatrix}>
              <div className={styles.matrixItem}>
                <span className={styles.matrixLabel}>CANDIDATE NAME</span>
                <strong className={styles.matrixValue}>{student.name}</strong>
              </div>

              <div className={styles.matrixItem}>
                <span className={styles.matrixLabel}>CANDIDATE ROLL NUMBER</span>
                <strong className={styles.matrixValue}>
                  <Hash size={13} style={{ display: 'inline', color: '#ea580c' }} />
                  {student.roll_no}
                </strong>
              </div>

              <div className={styles.matrixItem}>
                <span className={styles.matrixLabel}>YEAR / CLASS GROUP</span>
                <strong className={styles.matrixValue}>{student.department}</strong>
              </div>

              <div className={styles.matrixItem}>
                <span className={styles.matrixLabel}>ACADEMIC SESSION</span>
                <strong className={styles.matrixValue}>{student.academic_session}</strong>
              </div>

              <div className={styles.matrixItem}>
                <span className={styles.matrixLabel}>EXAM DATE</span>
                <strong className={styles.matrixValue} style={{ color: '#ea580c' }}>{selectedTest.exam_date}</strong>
              </div>

              <div className={styles.matrixItem}>
                <span className={styles.matrixLabel}>EVALUATION STANDING</span>
                <span className={styles.matrixStatusBadge}>
                  <CheckCircle2 size={12} /> {selectedTest.performance_badge}
                </span>
              </div>
            </div>

            {/* Score & Paper Breakdown Table */}
            <div className={styles.breakdownTableWrap}>
              <table className={styles.breakdownTable}>
                <thead>
                  <tr>
                    <th>SUBJECT / PAPER MODULE</th>
                    <th style={{ textAlign: 'center' }}>TOTAL QUESTIONS</th>
                    <th style={{ textAlign: 'center' }}>MAX MARKS</th>
                    <th style={{ textAlign: 'center' }}>MARKS SCORED</th>
                    <th style={{ textAlign: 'center' }}>PERCENTAGE</th>
                    <th style={{ textAlign: 'center' }}>GRADE</th>
                    <th style={{ textAlign: 'center' }}>PERFORMANCE STANDING</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>
                      <strong>{selectedTest.test_name}</strong>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{selectedTest.category} Assessment • {selectedTest.test_code}</div>
                    </td>
                    <td style={{ textAlign: 'center', fontWeight: '600' }}>{selectedTest.total_questions} Questions</td>
                    <td style={{ textAlign: 'center', fontWeight: '700' }}>{selectedTest.total_marks}</td>
                    <td style={{ textAlign: 'center' }}>
                      <strong style={{ fontSize: '1.05rem', color: '#0f172a' }}>
                        {selectedTest.score_obtained !== null ? selectedTest.score_obtained : '0'}
                      </strong>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <strong style={{ color: selectedTest.grade_color, fontSize: '1.05rem' }}>
                        {selectedTest.percentage !== null ? `${selectedTest.percentage}%` : '0%'}
                      </strong>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <span 
                        className={styles.tableGradePill}
                        style={{ background: `${selectedTest.grade_color}18`, color: selectedTest.grade_color, borderColor: `${selectedTest.grade_color}40` }}
                      >
                        {selectedTest.grade}
                      </span>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <span style={{ fontWeight: '700', color: selectedTest.grade_color, fontSize: '0.84rem' }}>
                        {selectedTest.performance_badge}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Faculty & Academic Evaluation Remarks */}
            <div className={styles.remarksBox}>
              <div className={styles.remarksTitle}>
                <Sparkles size={16} color="#ea580c" />
                <h4>ACADEMIC EVALUATION &amp; FACULTY REMARKS</h4>
              </div>
              <p className={styles.remarksContent}>{selectedTest.remarks}</p>
            </div>

            {/* Grading Scale Reference */}
            <div className={styles.sheetGradingScale}>
              <span className={styles.scaleHeading}>GRADING CRITERIA:</span>
              <span><strong>A*</strong> (90%+) Outstanding</span>
              <span><strong>A</strong> (80-89%) Distinction</span>
              <span><strong>B</strong> (70-79%) Merit</span>
              <span><strong>C</strong> (60-69%) Credit</span>
              <span><strong>D</strong> (50-59%) Pass</span>
              <span><strong>E</strong> (&lt;50%) Needs Practice</span>
            </div>

            {/* Official Seal & Signature Footer */}
            <div className={styles.sheetFooter}>
              <div className={styles.securityVerifyBox}>
                <ShieldCheck size={22} color="#16a34a" />
                <div>
                  <strong>OFFICIAL EXAMINATION CERTIFICATE</strong>
                  <p>Certified by XL Education Examination Board. Valid without physical stamp when barcode/seal matches.</p>
                </div>
              </div>

              <div className={styles.signatureBlock}>
                <div className={styles.signatureLine}></div>
                <strong>Controller of Examinations</strong>
                <span>XL Education Assessment Directorate UK</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
