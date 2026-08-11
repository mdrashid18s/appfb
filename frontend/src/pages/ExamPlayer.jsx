import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import styles from './ExamPlayer.module.css';
import { Clock, Home, CheckSquare, ChevronLeft, ChevronRight } from 'lucide-react';
import { useToast } from '../contexts/ToastContext';
import SecurePdfViewer from '../components/SecurePdfViewer';

export default function ExamPlayer() {
  const { testId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  
  const studentTestId = location.state?.studentTestId;
  const examMode = location.state?.examMode || 'normal';
  const pdfUrl = location.state?.pdfUrl;
  const hasPdf = !!pdfUrl;

  const [loading, setLoading] = useState(true);
  const [testDetails, setTestDetails] = useState(null);
  
  // MCQ state
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  
  // PDF state
  const [selectedPhotos, setSelectedPhotos] = useState([]);

  const [timeLeft, setTimeLeft] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const timerRef = useRef(null);

  useEffect(() => {
    if (!studentTestId) {
      toast.error('Invalid test session');
      navigate('/student');
      return;
    }
    fetchTestDetails();
    return () => clearInterval(timerRef.current);
  }, []);

  useEffect(() => {
    if (timeLeft > 0 && !result && !loading) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            handleAutoSubmit();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [loading, result]);

  const fetchTestDetails = async () => {
    try {
      const token = localStorage.getItem('token');
      const queryParams = new URLSearchParams({ student_test_id: studentTestId, mode: examMode }).toString();
      const res = await fetch(`/api/student/tests/${testId}/start?${queryParams}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setQuestions(data.questions || []);
        setTestDetails(data.test);
        const durationSeconds = (parseInt(data.test.duration) || 60) * 60;
        
        let remainingSeconds = durationSeconds;
        if (data.started_at) {
          // Parse started_at as UTC (append Z if missing)
          const dateStr = data.started_at.endsWith('Z') ? data.started_at : data.started_at + 'Z';
          const startTime = new Date(dateStr).getTime();
          const currentTime = new Date().getTime();
          const elapsedSeconds = Math.floor((currentTime - startTime) / 1000);
          remainingSeconds = Math.max(0, durationSeconds - elapsedSeconds);
        }
        
        setTimeLeft(remainingSeconds);
        if (remainingSeconds === 0) {
          toast.error('Test time has already expired.');
          navigate('/student');
        }
      } else {
        toast.error(data.message || 'Failed to load test');
        navigate('/student');
      }
    } catch (err) {
      toast.error('Network error');
      navigate('/student');
    }
    setLoading(false);
  };

  const handleSelectOption = (questionId, option) => {
    setAnswers(prev => ({ ...prev, [questionId]: option }));
  };

  const formatTime = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleAutoSubmit = () => {
    toast.error('Time is up! Auto-submitting test...');
    submitTest();
  };

  const submitTest = async () => {
    if (hasPdf && selectedPhotos.length === 0) {
      toast.error('Please upload at least one photo of your answers before submitting.');
      return;
    }
    
    setIsSubmitting(true);
    clearInterval(timerRef.current);
    try {
      const token = localStorage.getItem('token');
      
      let endpoint = `/api/student/tests/${testId}/submit`;
      let options = {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      };

      if (hasPdf) {
        endpoint = `/api/student/tests/${testId}/upload-answers`;
        const formData = new FormData();
        formData.append('student_test_id', studentTestId);
        selectedPhotos.forEach((photo, idx) => {
          formData.append(`answers[${idx}]`, photo);
        });
        options.body = formData;
      } else {
        options.headers['Content-Type'] = 'application/json';
        options.body = JSON.stringify({
          student_test_id: studentTestId,
          answers: answers
        });
      }

      const res = await fetch(endpoint, options);
      const data = await res.json();
      if (data.success) {
        setResult(data.score !== undefined ? data.score : 100);
        toast.success('Test completed successfully!');
      } else {
        toast.error(data.message || 'Failed to submit test');
      }
    } catch (err) {
      toast.error('Network error while submitting');
    }
    setIsSubmitting(false);
  };

  const handlePhotoSelection = (e) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setSelectedPhotos(prev => [...prev, ...newFiles]);
    }
  };

  const removePhoto = (indexToRemove) => {
    setSelectedPhotos(prev => prev.filter((_, index) => index !== indexToRemove));
  };

  if (loading) return <div className={styles.loadingState}>Loading test...</div>;

  if (result !== null) {
    return (
      <div className={styles.playerContainer}>
        <div className={styles.scoreCard}>
          {hasPdf ? (
            <>
              <div style={{
                width: '120px', height: '120px', margin: '0 auto 1.5rem', background: '#ecfdf5', 
                borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981'
              }}>
                <CheckSquare size={64} />
              </div>
              <h2 style={{color: '#1e293b'}}>Thank You!</h2>
              <p style={{color: '#64748b', marginBottom: '2rem'}}>Your answer sheets have been successfully uploaded and submitted for manual grading.</p>
            </>
          ) : (
            <>
              <div className={styles.scoreCircle}>
                <div className={styles.scoreValue}>{result}%</div>
                <div className={styles.scoreLabel}>Final Score</div>
              </div>
              <h2 style={{color: '#1e293b'}}>Test Completed!</h2>
              <p style={{color: '#64748b', marginBottom: '2rem'}}>Your responses have been successfully recorded and graded.</p>
            </>
          )}
          <button className={styles.homeButton} onClick={() => navigate('/student')}>
            <Home size={20} /> Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const currentQ = questions[currentIndex];

  return (
    <div className={styles.playerContainer}>
      <header className={styles.header}>
        <div className={styles.testInfo}>
          <h1>{testDetails?.name}</h1>
          <p>{testDetails?.code} • {testDetails?.duration} mins</p>
        </div>
        <div className={`${styles.timer} ${timeLeft < 300 ? styles.warning : styles.safe}`}>
          <Clock size={20} />
          {formatTime(timeLeft)}
        </div>
      </header>

      <main className={styles.mainContent} style={hasPdf ? { maxWidth: '100%', width: '100%', padding: '2rem 4rem' } : {}}>
        {hasPdf ? (
          /* PDF Test Layout */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {/* Inline PDF Viewer */}
            <div className={styles.questionCard} style={{ padding: '0', height: '85vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <SecurePdfViewer pdfUrl={`/api/pdf/${pdfUrl}`} inline={true} />
            </div>

            {/* Photo Upload Area */}
            <div className={styles.questionCard} style={{ padding: '2rem' }}>
              <div className={styles.questionHeader} style={{ marginBottom: '1.5rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '1rem' }}>
                <h2 className={styles.questionNumber} style={{ margin: 0, fontSize: '1.5rem', color: '#0f172a' }}>Submit Your Answers</h2>
                <p style={{ margin: '0.5rem 0 0 0', color: '#64748b' }}>Scan and upload clear photos of your answer sheets here.</p>
              </div>
              
              <div style={{ marginBottom: '2rem' }}>
                <label 
                  style={{
                    display: 'block', padding: '3rem 2rem', border: '2px dashed #cbd5e1', 
                    borderRadius: '0.5rem', textAlign: 'center', cursor: 'pointer',
                    background: '#f8fafc', transition: 'all 0.2s ease'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.borderColor = '#3b82f6'}
                  onMouseOut={(e) => e.currentTarget.style.borderColor = '#cbd5e1'}
                >
                  <div style={{ marginBottom: '1rem', color: '#64748b' }}>
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ margin: '0 auto' }}>
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                      <polyline points="17 8 12 3 7 8"></polyline>
                      <line x1="12" y1="3" x2="12" y2="15"></line>
                    </svg>
                  </div>
                  <span style={{ color: '#3b82f6', fontWeight: 600 }}>Click to browse</span> or drag and drop photos here
                  <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.85rem', color: '#94a3b8' }}>PNG, JPG up to 10MB each</p>
                  <input 
                    type="file" multiple accept="image/*" capture="environment"
                    onChange={handlePhotoSelection} style={{ display: 'none' }} 
                  />
                </label>
              </div>

              {selectedPhotos.length > 0 && (
                <div style={{ marginBottom: '2rem' }}>
                  <h3 style={{ fontSize: '1.1rem', color: '#1e293b', marginBottom: '1rem' }}>Selected Photos ({selectedPhotos.length})</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '1rem' }}>
                    {selectedPhotos.map((photo, idx) => (
                      <div key={idx} style={{ position: 'relative', borderRadius: '0.5rem', overflow: 'hidden', border: '1px solid #e2e8f0', aspectRatio: '1/1' }}>
                        <img src={URL.createObjectURL(photo)} alt={`Answer sheet ${idx + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        <button onClick={() => removePhoto(idx)} style={{ position: 'absolute', top: '4px', right: '4px', background: 'rgba(220, 38, 38, 0.9)', color: 'white', border: 'none', borderRadius: '50%', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '14px' }}>&times;</button>
                        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(0,0,0,0.6)', color: 'white', fontSize: '0.75rem', padding: '4px', textAlign: 'center', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{photo.name}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className={styles.navigation} style={{ justifyContent: 'center', marginTop: '2rem' }}>
                <button className={styles.submitButton} onClick={submitTest} disabled={isSubmitting || selectedPhotos.length === 0} style={{ width: '100%', maxWidth: '300px', padding: '1rem', fontSize: '1.1rem' }}>
                  <CheckSquare size={20} />
                  {isSubmitting ? 'Uploading...' : 'Submit Answers'}
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* MCQ Test Layout */
          <div className={styles.questionCard}>
            {currentQ ? (
              <>
                <div className={styles.questionHeader}>
                  <span className={styles.questionNumber}>Question {currentIndex + 1} of {questions.length}</span>
                  <span className={styles.marksBadge}>{currentQ.marks || 1} marks</span>
                </div>
                
                <h2 className={styles.questionText}>{currentQ.question_text}</h2>
                
                <div className={styles.optionsList}>
                  {['A', 'B', 'C', 'D'].map(opt => (
                    <button
                      key={opt}
                      className={`${styles.optionBtn} ${answers[currentQ.id] === opt ? styles.selected : ''}`}
                      onClick={() => handleSelectOption(currentQ.id, opt)}
                    >
                      <span className={styles.optionLetter}>{opt}</span>
                      <span className={styles.optionText}>{currentQ[`option_${opt.toLowerCase()}`]}</span>
                    </button>
                  ))}
                </div>
                
                <div className={styles.navigation}>
                  <button 
                    className={styles.navButton} 
                    onClick={() => setCurrentIndex(prev => prev - 1)}
                    disabled={currentIndex === 0}
                  >
                    <ChevronLeft size={20} /> Previous
                  </button>
                  
                  {currentIndex === questions.length - 1 ? (
                    <button 
                      className={styles.submitButton}
                      onClick={submitTest}
                      disabled={isSubmitting}
                    >
                      <CheckSquare size={20} /> 
                      {isSubmitting ? 'Submitting...' : 'Submit Test'}
                    </button>
                  ) : (
                    <button 
                      className={styles.navButton}
                      onClick={() => setCurrentIndex(prev => prev + 1)}
                    >
                      Next <ChevronRight size={20} />
                    </button>
                  )}
                </div>
              </>
            ) : (
              <div style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                No questions found for this test.
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
