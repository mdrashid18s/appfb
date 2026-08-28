/**
 * @file StudentSubmissionModal.jsx
 * @description Student Portal Modal: Submit kiye gaye test ke results, answers, score aur question paper ka complete review dekhna.
 *
 * Yeh modal Student ko allow karta hai:
 *   1. Test ka Final Score & Evaluation Status (Pass / Fail / Pending Evaluation) dekhna.
 *   2. MCQ Answer Key: Kaunsa option student ne select kiya aur kaunsa sahi/galat tha (Green/Red highlights ke sath).
 *   3. Uploaded Answer Sheets: Agar student ne written paper upload kiya tha toh un sheets ki photos dekhna.
 *   4. Question Paper PDF: Test paper ki PDF ko secure viewer me dekhna aur download karna.
 *
 * @param {number|string} studentTestId - student_tests table ka record ID.
 * @param {string}        testName      - Test ka title / name.
 * @param {Function}      onClose       - Modal band karne ka callback.
 */

import React, { useState, useEffect } from 'react';
import styles from './StudentSubmissionModal.module.css';
import { X, CheckCircle2, XCircle, FileText, Image as ImageIcon, Check, Award, AlertCircle, HelpCircle } from 'lucide-react';
import SecurePdfViewer from './SecurePdfViewer';
import { useToast } from '../contexts/ToastContext';

export default function StudentSubmissionModal({ studentTestId, testName, onClose }) {

  // ─────────────────────────────────────────────
  // 1. STATE VARIABLES
  // ─────────────────────────────────────────────

  /** loading: Backend se submission data load hote waqt loading spinner ke liye */
  const [loading, setLoading] = useState(true);

  /** submission: Backend se aaya pura submission data (score, mcq_review, uploaded_answers, pdf_url) */
  const [submission, setSubmission] = useState(null);

  /** activeTab: Active review tab - 'mcq' (MCQs key), 'photos' (Answer sheets), ya 'pdf' (Question paper) */
  const [activeTab, setActiveTab] = useState('mcq');

  /** selectedPhoto: Kisi uploaded image ko full-screen popup me preview karne ke liye image URL */
  const [selectedPhoto, setSelectedPhoto] = useState(null);

  /** toast: Notification alert helper */
  const toast = useToast();

  // ─────────────────────────────────────────────
  // 2. LIFECYCLE HOOKS
  // ─────────────────────────────────────────────

  /**
   * useEffect: Modal open hone par ya studentTestId badalne par submission data fetch karta hai
   */
  useEffect(() => {
    fetchSubmission();
  }, [studentTestId]);

  /**
   * fetchSubmission: /api/student/tests/{id}/submission se student ka result aur answers fetch karta hai
   */
  const fetchSubmission = async () => {
    try {
      const res = await fetch(`/api/student/tests/${studentTestId}/submission`, {
        headers: { 'Accept': 'application/json' }
      });
      const data = await res.json();
      if (data.success) {
        setSubmission(data);
        
        // Auto-select initial tab based on available data
        if (data.mcq_review && data.mcq_review.length > 0) {
          setActiveTab('mcq');
        } else if (data.uploaded_answers && data.uploaded_answers.length > 0) {
          setActiveTab('photos');
        } else if (data.pdf_url) {
          setActiveTab('pdf');
        }
      } else {
        toast.error(data.message || 'Failed to load test submission details');
      }
    } catch (err) {
      console.error(err);
      toast.error('Network error while loading submission review');
    } finally {
      setLoading(false);
    }
  };

  // ─────────────────────────────────────────────
  // 3. EXTRACTED VALUES FOR UI
  // ─────────────────────────────────────────────

  const studentTest = submission?.student_test;
  const testInfo = submission?.test;
  const mcqReview = submission?.mcq_review || [];
  const uploadedAnswers = submission?.uploaded_answers || [];
  const pdfUrl = submission?.pdf_url;

  const scorePct = studentTest?.score;
  const hasScore = scorePct !== null && scorePct !== undefined;

  // ─────────────────────────────────────────────
  // 4. JSX RENDERING
  // ─────────────────────────────────────────────

  return (
    // Background Overlay: Bahar click karne par modal close hota hai
    <div className={styles.overlay} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      
      {/* Modal Main Box */}
      <div className={styles.modalBox}>
        
        {/* ── Section A: Header (Test Title + Score Badge + Close Button) ── */}
        <div className={styles.modalHeader}>
          <div className={styles.headerTitleGroup}>
            <span className={styles.headerSubtitle}>Submission & Answer Key Review</span>
            <h2 className={styles.headerTitle}>{testName || testInfo?.name || 'Test Submission'}</h2>
          </div>

          <div className={styles.headerRight}>
            {/* Score Badge: Graded hai toh Pass/Fail score dikhata hai, warna 'Evaluation Pending' */}
            {hasScore ? (
              <div className={`${styles.scoreBadge} ${scorePct >= 50 ? styles.scorePass : styles.scoreFail}`}>
                <Award size={16} />
                <span>Score: <strong>{scorePct}%</strong></span>
              </div>
            ) : (
              <div className={styles.scorePending}>
                <AlertCircle size={15} />
                <span>Evaluation Pending</span>
              </div>
            )}
            {/* Close Button */}
            <button className={styles.closeBtn} onClick={onClose} title="Close Modal">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* ── Section B: Tab Navigation (MCQ / Photos / PDF) ── */}
        {!loading && (
          <div className={styles.tabNav}>
            {/* Tab 1: MCQ Answer Key Tab */}
            {mcqReview.length > 0 && (
              <button 
                className={`${styles.tabBtn} ${activeTab === 'mcq' ? styles.activeTab : ''}`}
                onClick={() => setActiveTab('mcq')}
              >
                <CheckCircle2 size={16} />
                <span>MCQ Answer Key ({mcqReview.length} Qs)</span>
              </button>
            )}

            {/* Tab 2: Uploaded Written Sheets Tab */}
            {uploadedAnswers.length > 0 && (
              <button 
                className={`${styles.tabBtn} ${activeTab === 'photos' ? styles.activeTab : ''}`}
                onClick={() => setActiveTab('photos')}
              >
                <ImageIcon size={16} />
                <span>Submitted Answer Sheets ({uploadedAnswers.length})</span>
              </button>
            )}

            {/* Tab 3: Question Paper PDF Tab */}
            {pdfUrl && (
              <button 
                className={`${styles.tabBtn} ${activeTab === 'pdf' ? styles.activeTab : ''}`}
                onClick={() => setActiveTab('pdf')}
              >
                <FileText size={16} />
                <span>Question Paper PDF</span>
              </button>
            )}

            {/* Download PDF Button */}
            {pdfUrl && (
              <a
                href={pdfUrl}
                download
                target="_blank"
                rel="noreferrer"
                className={styles.downloadPdfBtn}
                title="Download Question Paper PDF"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                <span>Download PDF</span>
              </a>
            )}
          </div>
        )}

        {/* ── Section C: Modal Body Content ── */}
        <div className={styles.modalBody}>
          {loading ? (
            <div className={styles.loadingBox}>
              <div className={styles.spinner} />
              <span>Loading submission review...</span>
            </div>
          ) : (
            <>
              {/* TAB 1 CONTENT: MCQ Answer Key with Color Coding */}
              {activeTab === 'mcq' && (
                <div className={styles.mcqContainer}>
                  {mcqReview.length === 0 ? (
                    <div className={styles.emptyBox}>
                      <HelpCircle size={32} color="#94a3b8" />
                      <p>No MCQ questions found for this test paper.</p>
                    </div>
                  ) : (
                    mcqReview.map((q, idx) => {
                      const isAttempted = q.selected_option !== null && q.selected_option !== undefined;
                      const isCorrect = q.is_correct;

                      return (
                        <div key={q.id || idx} className={styles.questionCard}>
                          {/* Question Header: Number, Marks & Correct/Incorrect/Skipped Status */}
                          <div className={styles.questionHeader}>
                            <span className={styles.qNum}>Question {idx + 1}</span>
                            <span className={styles.qMarks}>{q.marks || 1} Marks</span>
                            <div className={styles.qStatusBadge}>
                              {!isAttempted ? (
                                <span className={styles.statusSkipped}>Skipped</span>
                              ) : isCorrect ? (
                                <span className={styles.statusCorrect}><Check size={14} /> Correct (+{q.marks || 1})</span>
                              ) : (
                                <span className={styles.statusWrong}><X size={14} /> Incorrect (0)</span>
                              )}
                            </div>
                          </div>

                          {/* Question Text */}
                          <h4 className={styles.qText}>{q.question_text}</h4>

                          {/* Options List (A, B, C, D) with User Selection & Correct Answer highlights */}
                          <div className={styles.optionsList}>
                            {['A', 'B', 'C', 'D'].map(opt => {
                              const optionVal = q[`option_${opt.toLowerCase()}`];
                              if (!optionVal) return null;

                              const isSelected = q.selected_option === opt;
                              const isCorrectOpt = q.correct_option === opt;

                              // Highlight styling classes
                              let optionClass = styles.optionItem;
                              if (isSelected && isCorrectOpt) optionClass = `${styles.optionItem} ${styles.optCorrectSelected}`;
                              else if (isSelected && !isCorrectOpt) optionClass = `${styles.optionItem} ${styles.optWrongSelected}`;
                              else if (!isSelected && isCorrectOpt) optionClass = `${styles.optionItem} ${styles.optCorrectShow}`;

                              return (
                                <div key={opt} className={optionClass}>
                                  <div className={styles.optLetter}>{opt}</div>
                                  <div className={styles.optContent}>{optionVal}</div>
                                  <div className={styles.optTag}>
                                    {isSelected && isCorrectOpt && <span className={styles.tagYourCorrect}>Your Answer (Correct)</span>}
                                    {isSelected && !isCorrectOpt && <span className={styles.tagYourWrong}>Your Answer (Wrong)</span>}
                                    {!isSelected && isCorrectOpt && <span className={styles.tagRightAns}>Correct Answer</span>}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}

              {/* TAB 2 CONTENT: Uploaded Answer Sheet Photos */}
              {activeTab === 'photos' && (
                <div className={styles.photosContainer}>
                  {uploadedAnswers.length === 0 ? (
                    <div className={styles.emptyBox}>
                      <ImageIcon size={32} color="#94a3b8" />
                      <p>No written answer sheet photos were uploaded for this test.</p>
                    </div>
                  ) : (
                    <div className={styles.photoGrid}>
                      {uploadedAnswers.map((item, index) => (
                        <div key={item.id || index} className={styles.photoCard}>
                          <div className={styles.photoHeader}>
                            <span>Page {index + 1}</span>
                          </div>
                          <div className={styles.imgWrap} onClick={() => setSelectedPhoto(`/storage/${item.image_path}`)}>
                            <img src={`/storage/${item.image_path}`} alt={`Page ${index + 1}`} />
                          </div>
                          <a 
                            href={`/storage/${item.image_path}`} 
                            target="_blank" 
                            rel="noreferrer" 
                            className={styles.viewFullBtn}
                          >
                            View Full Screen ↗
                          </a>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3 CONTENT: Question Paper PDF Viewer */}
              {activeTab === 'pdf' && (
                <div className={styles.pdfViewerContainer}>
                  {pdfUrl ? (
                    <SecurePdfViewer pdfUrl={pdfUrl} inline={true} />
                  ) : (
                    <div className={styles.emptyBox}>
                      <FileText size={32} color="#94a3b8" />
                      <p>No PDF file attached to this test paper.</p>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* ── Section D: Full Photo Preview Modal ── */}
      {selectedPhoto && (
        <div className={styles.photoModalOverlay} onClick={() => setSelectedPhoto(null)}>
          <div className={styles.photoModalBox}>
            <button className={styles.photoCloseBtn} onClick={() => setSelectedPhoto(null)}>
              <X size={24} />
            </button>
            <img src={selectedPhoto} alt="Submitted Answer Sheet Full View" />
          </div>
        </div>
      )}
    </div>
  );
}
