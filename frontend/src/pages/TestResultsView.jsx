/**
 * @file TestResultsView.jsx
 * @description Student Exam Results & Scorecard Reports View.
 * Displays completed student test attempts with score breakdown, percentage, pass/fail status,
 * automatic MCQ grading, top notification alert for photo-based written answer submissions,
 * and a manual grading panel for Admin.
 */

import React, { useState, useEffect } from 'react';
import styles from './TestResultsView.module.css';
import { Award, Search, CheckCircle, XCircle, Clock, Hash, GraduationCap, X, FileText, Eye, Check, AlertTriangle, Save } from 'lucide-react';
import { useToast } from '../contexts/ToastContext';

export default function TestResultsView({ embedded = true }) {
  const toast = useToast();
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDept, setSelectedDept] = useState('ALL');
  const [search, setSearch] = useState('');

  // Selected Submission Detail Modal State
  const [selectedSubmissionId, setSelectedSubmissionId] = useState(null);
  const [submissionDetails, setSubmissionDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // Manual Grading State inside Modal
  const [gradingScore, setGradingScore] = useState('');
  const [savingGrade, setSavingGrade] = useState(false);

  useEffect(() => {
    fetchResults();
  }, []);

  const fetchResults = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/test-results', {
        headers: { Accept: 'application/json' }
      });
      const data = await res.json();
      if (data.success && data.results) {
        setResults(data.results);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load test results');
    }
    setLoading(false);
  };

  const handleOpenSubmissionDetails = async (id, currentScore) => {
    setSelectedSubmissionId(id);
    setLoadingDetails(true);
    setSubmissionDetails(null);
    setGradingScore(currentScore || '');

    try {
      const res = await fetch(`/api/admin/student-tests/${id}/details`, {
        headers: { Accept: 'application/json' }
      });
      const data = await res.json();
      if (data.success && data.details) {
        setSubmissionDetails(data.details);
        setGradingScore(data.details.score || '');
      } else {
        toast.error(data.message || 'Failed to load paper details');
      }
    } catch (err) {
      console.error(err);
      toast.error('Network error fetching test answers');
    }
    setLoadingDetails(false);
  };

  const handleSaveGrade = async (e) => {
    e.preventDefault();
    if (gradingScore === '' || isNaN(gradingScore)) {
      toast.error('Please enter a valid numeric score');
      return;
    }

    setSavingGrade(true);
    try {
      const res = await fetch(`/api/admin/student-tests/${selectedSubmissionId}/grade`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ score: parseFloat(gradingScore) })
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Score updated to ${gradingScore} marks!`);
        fetchResults();
        if (submissionDetails) {
          setSubmissionDetails({ ...submissionDetails, score: parseFloat(gradingScore) });
        }
      } else {
        toast.error(data.message || 'Failed to save grade');
      }
    } catch (err) {
      console.error(err);
      toast.error('Network error saving grade');
    }
    setSavingGrade(false);
  };

  const pendingGradingCount = results.filter(r => r.is_pending_review).length;

  const filteredResults = results.filter(r => {
    const matchDept = selectedDept === 'ALL' || (r.department && r.department.toUpperCase() === selectedDept.toUpperCase());
    const query = search.toLowerCase().trim();
    const matchSearch = !query || 
      (r.student_name && r.student_name.toLowerCase().includes(query)) ||
      (r.roll_no && String(r.roll_no).toLowerCase().includes(query)) ||
      (r.test_title && r.test_title.toLowerCase().includes(query));
    return matchDept && matchSearch;
  });

  return (
    <div className={styles.container}>
      {/* Top Pending Alert Banner (if photo-based submissions require manual grading) */}
      {pendingGradingCount > 0 && (
        <div className={styles.alertBanner}>
          <div className={styles.alertLeft}>
            <AlertTriangle size={20} color="#ea580c" />
            <div>
              <h4>{pendingGradingCount} Written Answer Submission(s) Pending Manual Grading</h4>
              <p>Students have uploaded photo answer sheets. Open "View Paper" to inspect answers & assign marks.</p>
            </div>
          </div>
        </div>
      )}

      {/* Header Bar */}
      <div className={styles.embeddedHeader}>
        <div className={styles.statsRow}>
          <div className={styles.statCard}>
            <span className={styles.statVal}>{results.length}</span>
            <span className={styles.statLbl}>Total Submissions</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statVal} style={{ color: '#10b981' }}>
              {results.filter(r => r.percentage >= 40 && !r.is_pending_review).length}
            </span>
            <span className={styles.statLbl}>Passed Attempts</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statVal} style={{ color: '#f59e0b' }}>
              {pendingGradingCount}
            </span>
            <span className={styles.statLbl}>Grading Pending</span>
          </div>
        </div>
      </div>

      {/* Controls Bar */}
      <div className={styles.controlsBar}>
        <div className={styles.searchWrap}>
          <Search size={18} className={styles.searchIcon} />
          <input 
            type="text" 
            placeholder="Search student name, roll no, or test title..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={styles.searchInput}
          />
          {search && (
            <X size={16} className={styles.searchClear} onClick={() => setSearch('')} />
          )}
        </div>

        <div className={styles.deptChipContainer}>
          <button 
            className={`${styles.deptChip} ${selectedDept === 'ALL' ? styles.deptChipActive : ''}`}
            onClick={() => setSelectedDept('ALL')}
          >
            <span>All Classes</span>
          </button>
          {(Array.from(new Set(results.map(r => r.department).filter(Boolean))).length > 0
            ? Array.from(new Set(results.map(r => r.department).filter(Boolean)))
            : ['Year 3', 'Year 4', 'Year 5', 'Year 6', 'Year 7', 'Year 8', 'Year 9', 'Year 10', 'Year 11', 'GCSE', 'A-Level']
          ).map(dept => (
            <button 
              key={dept}
              className={`${styles.deptChip} ${selectedDept === dept ? styles.deptChipActive : ''}`}
              onClick={() => setSelectedDept(dept)}
            >
              <span>{dept}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Results Table */}
      {loading ? (
        <div className={styles.loadingBox}>Loading exam scorecards...</div>
      ) : filteredResults.length === 0 ? (
        <div className={styles.emptyBox}>
          <Award size={36} color="#94a3b8" />
          <h3>No test results available</h3>
          <p>No student test submissions match your search or department filter.</p>
        </div>
      ) : (
        <div className={styles.tableResponsive}>
          <table className={styles.resultsTable}>
            <thead>
              <tr>
                <th>ROLL NO</th>
                <th>STUDENT NAME</th>
                <th>DEPT</th>
                <th>TEST TITLE</th>
                <th>SCORE</th>
                <th>PERCENTAGE</th>
                <th>STATUS</th>
                <th>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {filteredResults.map(r => (
                <tr key={r.id}>
                  <td>
                    <span className={styles.rollBadge}>#{r.roll_no}</span>
                  </td>
                  <td>
                    <span className={styles.studentName}>{r.student_name}</span>
                  </td>
                  <td>
                    <span className={styles.deptBadge}>{r.department}</span>
                  </td>
                  <td>
                    <div className={styles.testInfo}>
                      <span className={styles.testTitle}>{r.test_title}</span>
                      <span className={styles.testCode}>{r.test_code}</span>
                    </div>
                  </td>
                  <td>
                    <span className={styles.scoreVal}>{r.score} / {r.total_marks}</span>
                  </td>
                  <td>
                    <div className={styles.progressWrap}>
                      <div className={styles.progressBar}>
                        <div 
                          className={styles.progressFill} 
                          style={{ 
                            width: `${Math.min(r.percentage, 100)}%`,
                            background: r.is_pending_review ? '#f59e0b' : (r.percentage >= 40 ? 'linear-gradient(90deg, #10b981, #059669)' : 'linear-gradient(90deg, #ef4444, #dc2626)')
                          }}
                        />
                      </div>
                      <span className={styles.pctText}>{r.percentage}%</span>
                    </div>
                  </td>
                  <td>
                    {r.is_pending_review ? (
                      <span className={styles.pendingPill}>
                        <Clock size={12} /> Grading Pending
                      </span>
                    ) : r.percentage >= 40 ? (
                      <span className={styles.passPill}>
                        <CheckCircle size={12} /> Passed
                      </span>
                    ) : (
                      <span className={styles.failPill}>
                        <XCircle size={12} /> Needs Imp.
                      </span>
                    )}
                  </td>
                  <td>
                    <button 
                      className={styles.viewPaperBtn}
                      onClick={() => handleOpenSubmissionDetails(r.id, r.score)}
                      title="View Student Answer Sheet"
                    >
                      <Eye size={14} /> View Paper
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Answer Sheet Modal */}
      {selectedSubmissionId && (
        <div className={styles.modalOverlay} onClick={() => setSelectedSubmissionId(null)}>
          <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div>
                <h2>Student Answer Sheet & Submission Breakdown</h2>
                <p>Detailed view of submitted answers and evaluation</p>
              </div>
              <button className={styles.closeBtn} onClick={() => setSelectedSubmissionId(null)}>
                <X size={20} />
              </button>
            </div>

            <div className={styles.modalBody}>
              {loadingDetails ? (
                <div className={styles.loadingBox}>Loading student answers & test paper...</div>
              ) : !submissionDetails ? (
                <div className={styles.emptyBox}>No submission details found.</div>
              ) : (
                <>
                  {/* Summary Banner */}
                  <div className={styles.detailSummaryBanner}>
                    <div className={styles.studentMeta}>
                      <div className={styles.avatarCircle}>
                        {submissionDetails.student_name ? submissionDetails.student_name.slice(0, 2).toUpperCase() : 'ST'}
                      </div>
                      <div>
                        <h3>{submissionDetails.student_name}</h3>
                        <p>Roll No: #{submissionDetails.roll_no} • {submissionDetails.department}</p>
                      </div>
                    </div>

                    <div className={styles.scoreMeta}>
                      <div className={styles.scoreBig}>
                        {submissionDetails.score} / {submissionDetails.total_marks}
                      </div>
                      <div className={styles.dateMeta}>Submitted: {submissionDetails.date}</div>
                    </div>
                  </div>

                  {/* Manual Grading Form for Admin */}
                  <form onSubmit={handleSaveGrade} className={styles.gradingFormCard}>
                    <div className={styles.gradingFormLeft}>
                      <Award size={20} color="#ea580c" />
                      <div>
                        <h4>Admin Manual Grading Panel</h4>
                        <p>Review the answer sheet photo below and enter marks for this submission.</p>
                      </div>
                    </div>

                    <div className={styles.gradingInputWrap}>
                      <input 
                        type="number"
                        min="0"
                        max={submissionDetails.total_marks || 100}
                        step="0.5"
                        placeholder="Marks"
                        value={gradingScore}
                        onChange={e => setGradingScore(e.target.value)}
                        className={styles.gradeInput}
                        required
                      />
                      <span className={styles.totalSlash}>/ {submissionDetails.total_marks || 100}</span>
                      <button type="submit" className={styles.saveGradeBtn} disabled={savingGrade}>
                        <Save size={14} /> {savingGrade ? 'Saving...' : 'Save Score'}
                      </button>
                    </div>
                  </form>

                  {/* Uploaded Answer Photos (for written/offline exams) */}
                  {submissionDetails.uploaded_answers && submissionDetails.uploaded_answers.length > 0 && (
                    <div className={styles.uploadedSection}>
                      <h4>Uploaded Answer Sheet Photos ({submissionDetails.uploaded_answers.length})</h4>
                      <div className={styles.imageGrid}>
                        {submissionDetails.uploaded_answers.map((img, idx) => (
                          <div key={img.id || idx} className={styles.imgCard}>
                            <a href={img.image_url || img.image_path} target="_blank" rel="noreferrer">
                              <img src={img.image_url || img.image_path} alt={`Answer Sheet ${idx + 1}`} />
                            </a>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Question Breakdown List (for Online MCQ Exams) */}
                  {submissionDetails.questions && submissionDetails.questions.length > 0 && (
                    <div className={styles.breakdownSection}>
                      <h4>Online MCQ Questions Breakdown ({submissionDetails.questions.length})</h4>
                      {submissionDetails.questions.map((q, idx) => (
                        <div key={q.id || idx} className={`${styles.paperQCard} ${q.is_correct ? styles.correctCard : styles.incorrectCard}`}>
                          <div className={styles.paperQHeader}>
                            <span className={styles.qNum}>Q{idx + 1}</span>
                            <span className={styles.paperQText}>{q.question_text}</span>
                            <span className={`${styles.statusBadge} ${q.is_correct ? styles.badgeSuccess : styles.badgeDanger}`}>
                              {q.is_correct ? '✓ Correct' : '✕ Incorrect'}
                            </span>
                          </div>

                          <div className={styles.paperOptionsGrid}>
                            <div className={`${styles.paperOpt} ${q.student_option === 'A' ? (q.is_correct ? styles.studentCorrect : styles.studentWrong) : (q.correct_option === 'A' ? styles.correctAnswerHighlight : '')}`}>
                              <strong>A.</strong> {q.option_a}
                              {q.student_option === 'A' && <span className={styles.userTag}> (Student Chosen)</span>}
                              {q.correct_option === 'A' && <span className={styles.correctTag}> (Correct Answer)</span>}
                            </div>
                            <div className={`${styles.paperOpt} ${q.student_option === 'B' ? (q.is_correct ? styles.studentCorrect : styles.studentWrong) : (q.correct_option === 'B' ? styles.correctAnswerHighlight : '')}`}>
                              <strong>B.</strong> {q.option_b}
                              {q.student_option === 'B' && <span className={styles.userTag}> (Student Chosen)</span>}
                              {q.correct_option === 'B' && <span className={styles.correctTag}> (Correct Answer)</span>}
                            </div>
                            <div className={`${styles.paperOpt} ${q.student_option === 'C' ? (q.is_correct ? styles.studentCorrect : styles.studentWrong) : (q.correct_option === 'C' ? styles.correctAnswerHighlight : '')}`}>
                              <strong>C.</strong> {q.option_c}
                              {q.student_option === 'C' && <span className={styles.userTag}> (Student Chosen)</span>}
                              {q.correct_option === 'C' && <span className={styles.correctTag}> (Correct Answer)</span>}
                            </div>
                            <div className={`${styles.paperOpt} ${q.student_option === 'D' ? (q.is_correct ? styles.studentCorrect : styles.studentWrong) : (q.correct_option === 'D' ? styles.correctAnswerHighlight : '')}`}>
                              <strong>D.</strong> {q.option_d}
                              {q.student_option === 'D' && <span className={styles.userTag}> (Student Chosen)</span>}
                              {q.correct_option === 'D' && <span className={styles.correctTag}> (Correct Answer)</span>}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
