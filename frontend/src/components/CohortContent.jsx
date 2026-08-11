/**
 * @file CohortContent.jsx
 * @description Student Dashboard Content Renderer Component.
 * Displays category filter pills, active test cards, missed test alerts, 
 * test history tables (with sweep & retake actions), and transitional test papers.
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  AlertTriangle, 
  Info, 
  FileText, 
  Shuffle, 
  RotateCcw
} from 'lucide-react';
import StudentSubmissionModal from './StudentSubmissionModal';
import styles from '../App.module.css';

/**
 * CohortContent component rendering student test lists and tables.
 * @param {Object} props - Component props
 * @param {string} props.activeFilter - Active selected category filter ('All', 'Mock', etc.)
 * @param {Function} props.setActiveFilter - State setter for active category filter
 * @param {string} props.viewMode - Current dashboard view mode ('default', 'missed', 'history')
 * @param {Array} props.tests - Array of assigned test objects
 * @param {boolean} props.loading - Loading state indicator
 * @param {boolean} [props.isTransitional=false] - Flag indicating transitional test view
 * @returns {JSX.Element} Rendered test cards and tables layout
 */
export default function CohortContent({ activeFilter, setActiveFilter, viewMode, tests = [], loading, isTransitional = false }) {
  const navigate = useNavigate();

  const [historyFilter, setHistoryFilter] = useState('All');
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const filterChips = ['All', 'Weekly', 'Mock', 'Creative Writing', 'Milestone'];



  /**
   * Helper generating heading text for empty test states.
   * @returns {string} Empty state heading text
   */
  const getCardHeading = () => {
    if (isTransitional) return 'No Transitional Tests Assigned Yet';
    if (activeFilter === 'All') return 'No Tests Assigned Yet';
    return `No ${activeFilter} Tests Assigned Yet`;
  };

  /**
   * Helper generating descriptive text for empty test states.
   * @returns {string} Empty state paragraph text
   */
  const getCardParagraph = () => {
    if (isTransitional) return 'You currently have no active transitional test papers assigned. As soon as an admin or teacher assigns test templates to your roll number, your papers will appear here automatically.';
    if (activeFilter === 'All') {
      return "Once admin assigns tests to your roll number, they'll appear here automatically.";
    }
    return `You currently have no active ${activeFilter.toLowerCase()} test papers assigned. As soon as an admin or teacher assigns test templates to your roll number, your papers will appear here automatically.`;
  };

  const now = new Date();
  
  /** Filtered active tests: not expired OR completed */
  const activeTests = tests.filter(t => t.status === 'completed' || (!t.expiry_datetime || new Date(t.expiry_datetime) >= now));
  
  /** Filtered expired tests: not completed but past expiry datetime */
  const expiredTests = tests.filter(t => t.status !== 'completed' && (t.expiry_datetime && new Date(t.expiry_datetime) < now));
  
  /** Filtered completed tests */
  const completedTests = tests.filter(t => t.status === 'completed');

  /**
   * Render function mapping test objects into assigned test card UI elements.
   * @param {Array} testList - Array of test objects to render
   * @param {boolean} [isMissed=false] - Flag indicating rendering for missed tests view
   * @returns {JSX.Element} Grid of test cards or empty state card
   */
  const renderTestCards = (testList, isMissed = false) => {
    const filteredList = activeFilter === 'All' 
      ? testList 
      : testList.filter(t => t.category && t.category.toLowerCase().includes(activeFilter.toLowerCase()));
      
    if (filteredList.length === 0) {
      if (isMissed) {
        return (
          <div className={styles['missed-tests-card']}>
            <div className={styles['missed-tests-header']}>
              <AlertTriangle size={20} />
              Missed Tests
            </div>
            <div className={styles['missed-tests-content']}>
              <h2>🎉 No Missed Tests!</h2>
              <p>Great attendance! You haven't missed any scheduled tests.</p>
            </div>
          </div>
        );
      }
      return (
        <div className={styles['main-card']}>
          <div className={styles['empty-icon-wrapper']}>
            <FileText size={32} />
          </div>
          <h2>{getCardHeading()}</h2>
          <p>{getCardParagraph()}</p>
          <div className={styles['status-badge']}>
            <div className={styles['dot']}></div>
            Status: Waiting for Admin Assignment
          </div>
        </div>
      );
    }

    return (
      <div className={styles['assigned-tests-grid']}>
        {filteredList.map((test, idx) => (
          isTransitional ? (
            /* Flat card layout for Transitional test papers */
            <div key={idx} className={styles['flat-test-card']}>
               <div className={styles['flat-test-info']}>
                 <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
                    <h4 style={{ margin: 0, textTransform: 'uppercase', color: '#0f172a' }}>
                      {test.category || 'Transitional'}
                    </h4>
                    <span className={styles['code-tag']} style={{ background: '#e0f2fe', color: '#0284c7', fontSize: '0.75rem', padding: '0.15rem 0.4rem', borderRadius: '0.25rem', fontFamily: 'monospace' }}>
                      Code: {test.code}
                    </span>
                 </div>
                 <p style={{ margin: '0 0 0.5rem 0', color: '#64748b', fontSize: '0.95rem', fontWeight: '500' }}>{test.name}</p>
                 <div className={styles['flat-test-stats']}>
                   <span>◆ {test.questions || 80} Qs</span>
                   <span>⏱ {test.duration || 60} min</span>
                 </div>
               </div>
               <div className={styles['flat-test-datetime']}>
                 {test.start_datetime ? new Date(test.start_datetime).toLocaleDateString('en-GB', {day: '2-digit', month: 'short'}) : '20 Jul'} - {test.expiry_datetime ? new Date(test.expiry_datetime).toLocaleDateString('en-GB', {day: '2-digit', month: 'short'}) : '27 Jul'}, 
                 {' '}{test.start_datetime ? new Date(test.start_datetime).toLocaleTimeString('en-US', {hour: 'numeric', minute:'2-digit'}) : '9:00 AM'} - {test.expiry_datetime ? new Date(test.expiry_datetime).toLocaleTimeString('en-US', {hour: 'numeric', minute:'2-digit'}) : '9:00 PM'}
               </div>
               <div className={styles['flat-test-action']} style={{ display: 'flex', gap: '8px' }}>
                 <button 
                  className={styles['start-test-btn']} 
                  style={{padding: '0.5rem 1.25rem', background: '#f97316', borderRadius: '0.375rem'}} 
                  onClick={() => navigate(`/test-player/${test.id}`, { state: { studentTestId: test.student_test_id, pdfUrl: test.question_pdf } })}
                >
                   Start →
                 </button>
               </div>
            </div>
          ) : (
            /* Standard assigned test card layout */
            <div key={idx} className={styles['assigned-test-card']}>
              <div className={styles['test-card-header']}>
                <h3 className={styles['test-card-title']}>{test.name}</h3>
                <div className={styles['test-card-meta']}>
                  <span className={styles['category-tag']}>{test.category ? test.category.toUpperCase() : 'TEST'}</span>
                  <span className={styles['papers-tag']}>· {test.papers || 1} paper(s)</span>
                  <span className={styles['code-tag']}>Code: {test.code}</span>
                  {test.start_datetime && (
                    <span style={{marginLeft: 'auto', fontWeight: 'bold', color: '#0f172a'}}>
                      Starts: {new Date(test.start_datetime).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>
            
            <div className={styles['papers-list']}>
              {Array.from({ length: test.papers || 1 }).map((_, i) => (
                <div key={i} className={styles['paper-row']} style={{ alignItems: 'center' }}>
                  <div style={{ display: 'flex', gap: '1rem', flex: 1, minWidth: '30%' }}>
                    <div className={styles['paper-badge']}>P{i + 1}</div>
                    <div className={styles['paper-content']}>
                      <h4 className={styles['paper-title']}>Paper {i + 1}</h4>
                      <div style={{fontSize: '0.8rem', color: '#64748b', fontWeight: '600', marginBottom: '0.5rem', letterSpacing: '0.02em'}}>
                        Name: {test.name}
                      </div>
                      <div className={styles['paper-stats']}>
                        <span>&#10067; {Math.floor((parseInt(test.questions) || 40) / (test.papers || 1))} Q</span>
                        <span>&#127919; {Math.floor((parseInt(test.marks) || 40) / (test.papers || 1))} marks</span>
                        <span>&#9201;&#65039; {Math.floor((parseInt(test.duration) || 50) / (test.papers || 1))} min</span>
                      </div>
                      <div className={styles["active-test-label"]} style={test.status === 'completed' ? {color: '#10b981'} : isMissed ? {color: '#ef4444'} : {}}>
                        {test.status === 'completed' ? "Completed Test" : isMissed ? "Expired Test" : "Active Test"}
                      </div>
                    </div>
                  </div>
                  
                  <div style={{ flex: 1.5, textAlign: 'center', padding: '0 1rem' }}>
                    <p className={styles['paper-subtitle']} style={{ margin: 0 }}>
                      {test.descr || 'Bridge course test for advancing semesters'}
                    </p>
                  </div>

                  <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end', minWidth: '20%', gap: '8px' }}>
                    {test.status === 'completed' ? (
                      <button 
                        className={styles['start-test-btn']} 
                        style={{background: '#10b981', cursor: 'default', color: 'white'}}
                        disabled
                      >
                        Completed
                      </button>
                    ) : test.start_datetime && new Date(test.start_datetime) > new Date() ? (
                      <button 
                        className={styles['start-test-btn']} 
                        style={{background: '#cbd5e1', cursor: 'not-allowed', color: '#475569'}}
                        disabled
                      >
                        Starts at {new Date(test.start_datetime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </button>
                    ) : (
                      <button 
                        className={styles['start-test-btn']} 
                        style={isMissed ? {background: '#ef4444'} : {}}
                        onClick={() => navigate(`/test-player/${test.id}`, { state: { studentTestId: test.student_test_id, pdfUrl: test.question_pdf } })}
                      >
                        {isMissed ? "Reattempt" : "Start →"}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
          )
        ))}
      </div>
    );
  };

  return (
    <>
      {/* Category Filter Chips Bar */}
      {!isTransitional && (
        <div className={styles['filters']}>
          {filterChips.map(filter => (
            <button 
              key={filter}
              className={`${styles['filter-chip']} ${activeFilter === filter ? styles['active'] : ''}`}
              onClick={() => setActiveFilter(filter)}
            >
              {filter}
            </button>
          ))}
        </div>

      )}

      {/* Info Accommodations Banner */}
      <div className={styles['info-alert']}>
        <Info className={styles['info-icon']} size={20} />
        <div>
          Students with an <strong>extra time</strong> accommodation enabled by a parent or tutor will see a second start option with the adjusted duration.
        </div>
      </div>

      {/* Main View Router based on viewMode */}
      {viewMode === 'missed' ? (
        renderTestCards(expiredTests, true)
      ) : viewMode === 'history' ? (
        /* Test History Table View */
        <div className={styles['history-tests-card']}>
          <div className={styles['history-header']}>
            <h2>Test History</h2>
          </div>
          
          <div className={styles['history-filters']}>
            {['All', 'Cohort', 'Mock', 'Weekly', 'Milestone', 'Transitional'].map(filter => (
              <button 
                key={filter}
                className={`${styles['history-filter-chip']} ${historyFilter === filter ? styles['active'] : ''}`}
                onClick={() => setHistoryFilter(filter)}
              >
                {filter}
              </button>
            ))}
          </div>

          <div className={styles['table-container']}>
            <table className={styles['completed-tests-table']}>
              <thead>
                <tr>
                  <th>DATE</th>
                  <th>TEST NAME</th>
                  <th>1ST ATTEMPT</th>
                  <th>SWEEP</th>
                  <th>RETAKE</th>
                  <th>MODE</th>
                  <th>PAPERS</th>
                </tr>
              </thead>
              <tbody>
                {completedTests.length === 0 ? (
                  <tr>
                    <td colSpan="7" className={styles['empty-table-text']}>
                      No test history found.
                    </td>
                  </tr>
                ) : (
                  completedTests.map((t, idx) => {
                    const hasScore = t.score !== null && t.score !== undefined;
                    const formattedDate = t.assigned_at ? new Date(t.assigned_at).toLocaleDateString('en-GB').replace(/\//g, '-') : '05-07-2026';

                    return (
                      <tr key={idx}>
                        <td style={{fontFamily: 'monospace', fontSize: '0.9rem', color: '#475569'}}>{formattedDate}</td>
                        <td style={{fontWeight: '700', color: '#1e293b'}}>{t.code || t.name}</td>
                        <td>
                          {hasScore ? (
                            <span className={styles['score-pill']} style={t.score >= 50 ? { background: '#dcfce7', color: '#166534' } : { background: '#fee2e2', color: '#dc2626' }}>
                              {t.score}%
                            </span>
                          ) : (
                            <span className={styles['score-pill']} style={{ background: '#fef3c7', color: '#d97706' }}>
                              Pending
                            </span>
                          )}
                        </td>
                        <td>
                          {/* Sweep Action Button */}
                          <div className={styles['action-icons-group']}>
                            {[...Array(parseInt(t.papers) || 1)].map((_, i) => (
                              <Shuffle 
                                key={i} 
                                size={14} 
                                className={styles['action-icon']} 
                                title="Sweep (Re-attempt wrong answers)"
                                onClick={() => navigate(`/test-player/${t.id}`, { state: { studentTestId: t.student_test_id, examMode: 'sweep' } })}
                              />
                            ))}
                          </div>
                        </td>
                        <td>
                          {/* Retake Action Button */}
                          <div className={styles['action-icons-group']} style={{borderColor: '#e2e8f0'}}>
                            {[...Array(parseInt(t.papers) || 1)].map((_, i) => (
                              <RotateCcw 
                                key={i} 
                                size={14} 
                                className={styles['action-icon']} 
                                title="Retake Paper"
                                onClick={() => navigate(`/test-player/${t.id}`, { state: { studentTestId: t.student_test_id, examMode: 'retake' } })}
                              />
                            ))}
                          </div>
                        </td>
                        <td>
                          <span className={`${styles['mode-pill']} ${t.mode === 'online' || t.mode === 'Online' ? styles['mode-pill-online'] : styles['mode-pill-offline']}`}>
                            {t.mode === 'online' || t.mode === 'Online' ? '• Online' : '• Offline'}
                          </span>
                        </td>
                        <td>
                          <button 
                            className={styles['paper-doc-btn']} 
                            title="View Submission & Answers" 
                            onClick={() => setSelectedSubmission({ studentTestId: t.student_test_id || t.id, testName: t.name || t.code })}
                            style={{border: '1px solid #cbd5e1', background: 'transparent', padding: '0.4rem 0.6rem', borderRadius: '4px', cursor: 'pointer', color: '#334155'}}
                          >
                            <FileText size={18} />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        loading ? (
          <div className={styles['main-card']}>
            <div className={styles['empty-icon-wrapper']} style={{background: '#f1f5f9', color: '#94a3b8'}}>
              <FileText size={32} />
            </div>
            <h2>Loading your tests...</h2>
          </div>
        ) : (
          <>
            {renderTestCards(activeTests, false)}
            
            {/* Completed Transitional Tests Section */}
            {isTransitional && (
              <div id="completed-tests-section" className={styles['completed-tests-section']}>
                <h3>Completed Tests</h3>
                <div className={styles['table-container']}>
                  <table className={styles['completed-tests-table']}>
                    <thead>
                      <tr>
                        <th>TEST NAME</th>
                        <th>1ST ATTEMPT</th>
                        <th>TOTAL QUESTIONS</th>
                        <th>DURATION</th>
                        <th>MODE</th>
                        <th>SCORE</th>
                        <th>ACTIONS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {completedTests.length === 0 ? (
                        <tr>
                          <td colSpan="7" className={styles['empty-table-text']} style={{textAlign: 'center', padding: '2rem', color: '#64748b'}}>
                            No completed transitional tests found.
                          </td>
                        </tr>
                      ) : (
                        completedTests.map((t, idx) => {
                          const hasScore = t.score !== null && t.score !== undefined;
                          const pct = hasScore ? t.score : null;
                          let badgeClass = 'average';
                          if (hasScore) {
                            if (pct >= 85) badgeClass = 'excellent';
                            else if (pct >= 75) badgeClass = 'good';
                            else if (pct < 50) badgeClass = 'poor';
                          }

                          return (
                            <tr key={idx}>
                              <td><strong>{t.name}</strong></td>
                              <td>
                                {hasScore ? (
                                  <span className={`${styles['score-badge']} ${styles[badgeClass]}`}>{pct}%</span>
                                ) : (
                                  <span className={styles['score-badge']} style={{ background: '#fef3c7', color: '#d97706' }}>Pending</span>
                                )}
                              </td>
                              <td><strong>{t.questions || 10}</strong></td>
                              <td style={{color: '#94a3b8'}}>{t.duration || 40}</td>
                              <td>
                                {t.mode === 'online' || t.mode === 'Online' ? (
                                  <span className={styles['mode-online']}>• Online</span>
                                ) : (
                                  <span className={styles['mode-offline']}>• Offline</span>
                                )}
                              </td>
                              <td>
                                <button 
                                  className={styles['paper-doc-btn']} 
                                  title="View Submission & Answers"
                                  onClick={() => setSelectedSubmission({ studentTestId: t.student_test_id || t.id, testName: t.name || t.code })}
                                >
                                  <FileText size={16} />
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )
      )}

      {/* Student Submission Review Modal Overlay */}
      {selectedSubmission && (
        <StudentSubmissionModal 
          studentTestId={selectedSubmission.studentTestId}
          testName={selectedSubmission.testName}
          onClose={() => setSelectedSubmission(null)}
        />
      )}

      <footer className={styles['footer']}>
        All papers open on schedule • times shown in local timezone
      </footer>
    </>
  );

}
