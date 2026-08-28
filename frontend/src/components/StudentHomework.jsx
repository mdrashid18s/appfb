/**
 * @file StudentHomework.jsx
 * @description Student Dashboard Weekly Homework View.
 * Seamlessly styled to match the Student Dashboard card & paper-row theme.
 */

import React, { useState, useEffect } from 'react';
import styles from './StudentHomework.module.css';
import { 
  Calendar, 
  ChevronLeft, 
  ChevronRight, 
  CheckCircle2, 
  Clock, 
  BookOpen, 
  RotateCcw,
  CheckSquare,
  Square,
  FileText,
  Camera,
  Upload,
  Award,
  X
} from 'lucide-react';
import { format, addDays, subDays, startOfWeek, endOfWeek, parseISO } from 'date-fns';
import { useToast } from '../contexts/ToastContext';

const DAY_BADGES = {
  Monday:    { bg: '#e0f2fe', color: '#0369a1' },
  Tuesday:   { bg: '#fce7f3', color: '#be185d' },
  Wednesday: { bg: '#e0e7ff', color: '#4338ca' },
  Thursday:  { bg: '#fef3c7', color: '#b45309' },
  Friday:    { bg: '#dcfce7', color: '#15803d' },
  Saturday:  { bg: '#f3e8ff', color: '#6b21a8' },
  Sunday:    { bg: '#ffe4e6', color: '#be123c' },
};

export default function StudentHomework({ student }) {
  const toast = useToast();
  const [currentWeekStart, setCurrentWeekStart] = useState(() => {
    return startOfWeek(new Date(), { weekStartsOn: 1 }); // Monday start
  });

  const [schedule, setSchedule] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploadingTaskId, setUploadingTaskId] = useState(null);
  const [previewPhotoUrl, setPreviewPhotoUrl] = useState(null);
  const [completedTaskIds, setCompletedTaskIds] = useState(() => {
    try {
      const saved = localStorage.getItem(`homework_done_${student?.id}`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const handleUploadPhoto = async (taskId, file) => {
    if (!file) return;
    setUploadingTaskId(taskId);
    try {
      const formData = new FormData();
      const rollNo = student?.['roll no'] || student?.roll_no || student?.login_id || '';
      formData.append('roll_no', rollNo);
      formData.append('photo', file);

      const token = localStorage.getItem('token');
      const res = await fetch(`/api/student/homework/${taskId}/submit`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Notebook photo proof submitted successfully! Marked as completed.');
        if (!completedTaskIds.includes(taskId)) {
          setCompletedTaskIds(prev => {
            const updated = [...prev, taskId];
            localStorage.setItem(`homework_done_${student?.id}`, JSON.stringify(updated));
            return updated;
          });
        }
        fetchWeeklyHomework();
      } else {
        toast.error(data.message || 'Failed to submit notebook photo.');
      }
    } catch (err) {
      console.error('Photo upload failed:', err);
      toast.error('Network error uploading notebook photo.');
    }
    setUploadingTaskId(null);
  };

  useEffect(() => {
    fetchWeeklyHomework();
  }, [currentWeekStart, student]);

  const fetchWeeklyHomework = async () => {
    setLoading(true);
    try {
      const formattedDate = format(currentWeekStart, 'yyyy-MM-dd');
      const token = localStorage.getItem('token');
      
      const rollNo = student?.['roll no'] || student?.roll_no || student?.login_id || '';
      const courseId = student?.course_id || '';

      const queryParams = new URLSearchParams({
        week_start_date: formattedDate,
        roll_no: rollNo,
        course_id: courseId
      });

      const res = await fetch(`/api/student/homework?${queryParams.toString()}`, {
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await res.json();
      if (data.success) {
        setSchedule(data.schedule || []);
      }
    } catch (err) {
      console.error('Failed to fetch homework:', err);
    }
    setLoading(false);
  };

  const handlePrevWeek = () => setCurrentWeekStart(prev => subDays(prev, 7));
  const handleNextWeek = () => setCurrentWeekStart(prev => addDays(prev, 7));
  const handleResetToCurrentWeek = () => setCurrentWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }));

  const toggleTaskCompletion = async (taskId) => {
    const isCurrentlyDone = completedTaskIds.includes(taskId);
    const newDoneState = !isCurrentlyDone;

    const updated = newDoneState
      ? [...completedTaskIds, taskId]
      : completedTaskIds.filter(id => id !== taskId);

    setCompletedTaskIds(updated);
    try {
      localStorage.setItem(`homework_done_${student?.id}`, JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }

    if (newDoneState) {
      toast.success('Homework task marked as completed! ✅');
    }

    // Sync completion status with server
    try {
      const rollNo = student?.['roll no'] || student?.roll_no || student?.login_id || '';
      const token = localStorage.getItem('token');
      await fetch(`/api/student/homework/${taskId}/toggle-complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        },
        body: JSON.stringify({
          roll_no: rollNo,
          status: newDoneState ? 'completed' : 'pending'
        })
      });
    } catch (err) {
      console.error('Failed to sync homework completion with server:', err);
    }
  };

  // Compute stats
  const allTasks = schedule.flatMap(d => d.tasks);
  const totalTasksCount = allTasks.length;
  const completedCount = allTasks.filter(t => completedTaskIds.includes(t.id)).length;
  const pendingCount = totalTasksCount - completedCount;
  const progressPercent = totalTasksCount > 0 ? Math.round((completedCount / totalTasksCount) * 100) : 0;
  const weekEnd = endOfWeek(currentWeekStart, { weekStartsOn: 1 });

  return (
    <div className={styles.homeworkCardSection}>
      {/* ── CARD HEADER (MATCHES COMPLETED TESTS & ASSIGNED CARDS) ── */}
      <div className={styles.cardHeaderRow}>
        <div className={styles.headerTitleBox}>
          <div className={styles.iconCircle}>
            <FileText size={20} />
          </div>
          <div>
            <h3 className={styles.sectionHeading}>Weekly Homework Schedule</h3>
            <p className={styles.sectionSubheading}>
              Track your course homework assignments and mark tasks complete.
            </p>
          </div>
        </div>

        {/* Week Navigator */}
        <div className={styles.weekControlBar}>
          <button className={styles.navArrowBtn} onClick={handlePrevWeek} title="Previous Week">
            <ChevronLeft size={16} />
          </button>
          <div className={styles.weekDateBadge}>
            <Calendar size={14} />
            <span>{format(currentWeekStart, 'dd MMM')} – {format(weekEnd, 'dd MMM yyyy')}</span>
          </div>
          <button className={styles.navArrowBtn} onClick={handleNextWeek} title="Next Week">
            <ChevronRight size={16} />
          </button>
          <button className={styles.todayPillBtn} onClick={handleResetToCurrentWeek}>
            <RotateCcw size={13} />
            This Week
          </button>
        </div>
      </div>

      {/* ── STATS BAR (MATCHES PORTAL PILLS & METRICS) ── */}
      <div className={styles.metricsRow}>
        <div className={styles.metricItem}>
          <span className={styles.metricLabel}>Total Tasks</span>
          <span className={styles.metricVal}>{totalTasksCount}</span>
        </div>
        <div className={styles.metricItem}>
          <span className={styles.metricLabel}>Completed</span>
          <span className={`${styles.metricVal} ${styles.valGreen}`}>{completedCount}</span>
        </div>
        <div className={styles.metricItem}>
          <span className={styles.metricLabel}>Pending</span>
          <span className={`${styles.metricVal} ${styles.valOrange}`}>{pendingCount}</span>
        </div>
        <div className={styles.progressMetric}>
          <div className={styles.progressText}>
            <span>Weekly Progress</span>
            <span className={styles.percentText}>{progressPercent}%</span>
          </div>
          <div className={styles.barBg}>
            <div className={styles.barFill} style={{ width: `${progressPercent}%` }} />
          </div>
        </div>
      </div>

      {/* ── TASKS LIST (MATCHES ASSIGNED-TEST-CARD & PAPER-ROW DESIGN) ── */}
      {loading ? (
        <div className={styles.loadingBox}>
          <Clock className={styles.spinIcon} size={24} />
          <span>Loading weekly homework schedule...</span>
        </div>
      ) : totalTasksCount === 0 ? (
        <div className={styles.emptyCard}>
          <CheckCircle2 size={36} color="#10b981" />
          <h4>No Homework Assigned for This Week</h4>
          <p>Great job! You have no pending homework tasks assigned for the week of {format(currentWeekStart, 'dd MMM yyyy')}.</p>
        </div>
      ) : (
        <div className={styles.tasksListContainer}>
          {schedule.map((dayGroup) => {
            if (dayGroup.tasks.length === 0) return null;

            const badgeStyle = DAY_BADGES[dayGroup.day_of_week] || { bg: '#f1f5f9', color: '#475569' };
            const formattedDayDate = dayGroup.date ? format(parseISO(dayGroup.date), 'dd MMM') : '';

            return (
              <div key={dayGroup.day_of_week} className={styles.daySectionGroup}>
                <div className={styles.daySectionHeader}>
                  <span className={styles.dayTagPill} style={{ background: badgeStyle.bg, color: badgeStyle.color }}>
                    {dayGroup.day_of_week.toUpperCase()} · {formattedDayDate}
                  </span>
                  <span className={styles.dayTasksCount}>{dayGroup.tasks.length} Task(s)</span>
                </div>

                <div className={styles.dayTaskRows}>
                  {dayGroup.tasks.map((task) => {
                    const hasPhoto = Boolean(task.submission && task.submission.attachment_photo);
                    const isDone = completedTaskIds.includes(task.id) || hasPhoto;
                    const rawPhotoUrl = task.submission?.attachment_photo || '';
                    const photoSrc = rawPhotoUrl ? (rawPhotoUrl.startsWith('/') ? rawPhotoUrl : `/${rawPhotoUrl}`) : null;

                    return (
                      <div 
                        key={task.id} 
                        className={`${styles.paperLikeRow} ${isDone ? styles.paperRowCompleted : ''}`}
                      >
                        {/* Subject Badge */}
                        <div className={styles.subjectBox}>
                          <span className={styles.subjectCodeTag}>
                            <BookOpen size={12} />
                            {task.subject}
                          </span>
                        </div>

                        {/* Details */}
                        <div className={styles.taskContentBox}>
                          <h4 className={`${styles.taskTitleText} ${isDone ? styles.strike : ''}`}>
                            {task.title}
                          </h4>
                          {task.description && (
                            <p className={`${styles.taskDescText} ${isDone ? styles.strike : ''}`}>
                              {task.description}
                            </p>
                          )}

                          {/* Teacher Evaluation & Remarks Feedback Card */}
                          {task.submission && (task.submission.teacher_grade || task.submission.teacher_remarks) && (
                            <div style={{ marginTop: '0.65rem', padding: '0.65rem 0.85rem', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.35rem', width: '100%', boxSizing: 'border-box' }}>
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#4f46e5', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                  <Award size={13} /> Teacher Evaluation
                                </span>
                                {task.submission.teacher_grade && (
                                  <span style={{ 
                                    fontWeight: 800, 
                                    fontSize: '0.775rem', 
                                    padding: '0.15rem 0.55rem', 
                                    borderRadius: '0.25rem',
                                    background: task.submission.teacher_grade === 'Wrong' ? '#fef2f2' : (task.submission.teacher_grade === 'Excellent' ? '#f0fdf4' : '#f0f9ff'),
                                    color: task.submission.teacher_grade === 'Wrong' ? '#ef4444' : (task.submission.teacher_grade === 'Excellent' ? '#16a34a' : '#0284c7'),
                                    border: '1px solid ' + (task.submission.teacher_grade === 'Wrong' ? '#fecaca' : (task.submission.teacher_grade === 'Excellent' ? '#bbf7d0' : '#bae6fd'))
                                  }}>
                                    {task.submission.teacher_grade === 'Wrong' && '❌ '}
                                    {task.submission.teacher_grade === 'Good' && '👍 '}
                                    {task.submission.teacher_grade === 'Very Good' && '⭐ '}
                                    {task.submission.teacher_grade === 'Excellent' && '🏆 '}
                                    {task.submission.teacher_grade}
                                  </span>
                                )}
                              </div>
                              {task.submission.teacher_remarks && (
                                <p style={{ margin: 0, fontSize: '0.825rem', color: '#334155', background: '#ffffff', padding: '0.45rem 0.65rem', borderRadius: '0.375rem', borderLeft: '3px solid #4f46e5', fontStyle: 'italic' }}>
                                  <strong>Teacher Remarks:</strong> "{task.submission.teacher_remarks}"
                                </p>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Due Date */}
                        <div className={styles.dueDateCol}>
                          {task.due_date ? (
                            <span className={styles.duePill}>
                              <Clock size={12} />
                              Due: {format(parseISO(task.due_date), 'dd MMM')}
                            </span>
                          ) : (
                            <span className={styles.endOfWeekPill}>End of Week</span>
                          )}
                        </div>

                        {/* Completion Checkmark Toggle Action */}
                        <div className={styles.actionCol} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                          <button
                            type="button"
                            onClick={() => toggleTaskCompletion(task.id)}
                            style={{ 
                              background: isDone ? '#dcfce7' : '#4f46e5', 
                              color: isDone ? '#15803d' : '#ffffff', 
                              border: isDone ? '1px solid #bbf7d0' : 'none',
                              padding: '0.45rem 0.9rem',
                              borderRadius: '0.5rem',
                              fontSize: '0.825rem',
                              fontWeight: 700,
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.4rem',
                              transition: 'all 0.2s ease',
                              boxShadow: isDone ? 'none' : '0 2px 4px rgba(79, 70, 229, 0.2)'
                            }}
                            title={isDone ? "Click to mark as pending" : "Click to mark homework completed"}
                          >
                            {isDone ? <CheckSquare size={16} /> : <Square size={16} />}
                            <span>{isDone ? 'Completed' : 'Mark Completed'}</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Full Photo Lightbox Preview Modal */}
      {previewPhotoUrl && (
        <div className={styles.modalBackdrop} onClick={() => setPreviewPhotoUrl(null)}>
          <div className={styles.modalPhotoCard} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalPhotoHeader}>
              <h4><Camera size={16} /> Submitted Homework Photo Proof</h4>
              <button onClick={() => setPreviewPhotoUrl(null)} className={styles.closeBtn}><X size={18} /></button>
            </div>
            <div className={styles.modalPhotoBody}>
              <img src={previewPhotoUrl} alt="Homework Proof" className={styles.fullImage} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
