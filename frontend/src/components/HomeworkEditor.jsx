/**
 * @file HomeworkEditor.jsx
 * @description Admin Weekly Homework Manager component.
 * Single unified card form that supports assigning multiple subject homework tasks per day for an entire week.
 */

import React, { useState, useEffect } from 'react';
import styles from './HomeworkEditor.module.css';
import { 
  BookOpen, 
  Calendar, 
  UserCheck, 
  GraduationCap, 
  Save, 
  RotateCcw, 
  Trash2, 
  Edit3, 
  Sparkles, 
  Plus,
  FileText,
  Clock,
  Layers,
  AlertCircle,
  Camera,
  Eye,
  Award,
  Check,
  X,
  CheckCircle2
} from 'lucide-react';
import { useToast } from '../contexts/ToastContext';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

function getMondayOfCurrentWeek() {
  const d = new Date();
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
  const monday = new Date(d.setDate(diff));
  return monday.toISOString().split('T')[0];
}

function createInitialWeeklyItems() {
  return DAYS.map((day, idx) => ({
    id: `init_${idx}_${Date.now()}`,
    day_of_week: day,
    subject_id: '',
    subject_name: '',
    title: '',
    description: '',
    due_date: ''
  }));
}

export default function HomeworkEditor() {
  const toast = useToast();

  /** Master state for courses and subjects */
  const [courses, setCourses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  
  /** Target configuration state */
  const [targetType, setTargetType] = useState('course'); // 'course' or 'student'
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [studentRollNo, setStudentRollNo] = useState('');
  const [weekStartDate, setWeekStartDate] = useState(getMondayOfCurrentWeek());

  /** Dynamic weekly items list (allows multiple tasks per day) */
  const [weeklyItems, setWeeklyItems] = useState(createInitialWeeklyItems);

  /** Published batches history state */
  const [publishedBatches, setPublishedBatches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  /** Submissions tracking state */
  const [adminViewTab, setAdminViewTab] = useState('editor'); // 'editor' or 'submissions'
  const [studentSubmissions, setStudentSubmissions] = useState([]);
  const [studentProgress, setStudentProgress] = useState([]);
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);
  const [previewPhotoUrl, setPreviewPhotoUrl] = useState(null);
  const [selectedViewBatchKey, setSelectedViewBatchKey] = useState(null);
  const selectedViewBatch = (Array.isArray(publishedBatches) ? publishedBatches : []).find(b => b.key === selectedViewBatchKey) || null;

  /** Teacher Grading State */
  const [activeGradeSubmission, setActiveGradeSubmission] = useState(null);
  const [gradeValue, setGradeValue] = useState('Good');
  const [teacherRemarks, setTeacherRemarks] = useState('');
  const [submittingGrade, setSubmittingGrade] = useState(false);

  const openGradingModal = (sub) => {
    setActiveGradeSubmission(sub);
    setGradeValue(sub.teacher_grade || 'Good');
    setTeacherRemarks(sub.teacher_remarks || '');
  };

  const handleSaveGrade = async (submissionId) => {
    if (!gradeValue) {
      toast.error('Grade select karo pehle');
      return;
    }
    if (!submissionId) {
      toast.error('Submission ID nahi mila — page refresh karo');
      return;
    }
    setSubmittingGrade(true);
    try {
      const payload = { teacher_grade: gradeValue, teacher_remarks: teacherRemarks };
      const res = await fetch(`/api/admin/homework/submissions/${submissionId}/grade`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(payload)
      });
      let data;
      try { data = await res.json(); } catch { data = {}; }
      if (!res.ok) {
        const errMsg = data?.message || data?.error || JSON.stringify(data?.errors || {});
        toast.error(`Error ${res.status}: ${errMsg}`);
        setSubmittingGrade(false);
        return;
      }
      if (data.success) {
        toast.success(`Grade "${gradeValue}" aur remarks save ho gaye!`);
        setActiveGradeSubmission(null);
        fetchSubmissions();
      } else {
        toast.error(data.message || 'Grade save nahi hua');
      }
    } catch (err) {
      toast.error('Network error: ' + err.message);
    }
    setSubmittingGrade(false);
  };

  useEffect(() => {
    fetchMasterData();
    fetchPublishedHomework();
  }, []);

  const fetchSubmissions = async () => {
    setLoadingSubmissions(true);
    try {
      const res = await fetch('/api/admin/homework/submissions', {
        headers: { Accept: 'application/json' }
      });
      const data = await res.json();
      if (data.success) {
        setStudentSubmissions(data.submissions || []);
        setStudentProgress(data.student_progress || []);
      }
    } catch (err) {
      console.error('Error fetching submissions:', err);
    }
    setLoadingSubmissions(false);
  };

  const fetchMasterData = async () => {
    try {
      const [courseRes, subRes] = await Promise.all([
        fetch('/api/admin/courses', { headers: { Accept: 'application/json' } }),
        fetch('/api/admin/subjects', { headers: { Accept: 'application/json' } })
      ]);
      const courseData = await courseRes.json();
      const subData = await subRes.json();

      if (courseData.success && courseData.courses) {
        setCourses(courseData.courses);
        if (courseData.courses.length > 0) {
          setSelectedCourseId(courseData.courses[0].id);
        }
      }
      if (subData.success && subData.subjects) {
        setSubjects(subData.subjects);
      }
    } catch (err) {
      console.error('Error loading courses/subjects:', err);
    }
  };

  const fetchPublishedHomework = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/homework', { headers: { Accept: 'application/json' } });
      const data = await res.json();
      if (data.success) {
        setPublishedBatches(data.batches || []);
      }
    } catch (err) {
      console.error('Error fetching homework batches:', err);
    }
    setLoading(false);
  };

  const handleItemChange = (index, field, value) => {
    const updated = [...weeklyItems];
    updated[index] = { ...updated[index], [field]: value };

    if (field === 'subject_id' && value) {
      const subj = (Array.isArray(subjects) ? subjects : []).find(s => String(s.id) === String(value));
      if (subj) {
        updated[index].subject_name = subj.name;
      }
    }

    setWeeklyItems(updated);
  };

  const handleAddTaskForDay = (day) => {
    const newTask = {
      id: `task_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      day_of_week: day,
      subject_id: '',
      subject_name: '',
      title: '',
      description: '',
      due_date: ''
    };
    setWeeklyItems(prev => [...prev, newTask]);
    toast.info(`Added new subject task slot for ${day}`);
  };

  const handleRemoveTask = (indexToRemove) => {
    if (weeklyItems.length <= 1) {
      toast.warning('At least one task row must remain in the schedule');
      return;
    }
    setWeeklyItems(prev => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleResetForm = () => {
    setWeeklyItems(createInitialWeeklyItems());
    toast.info('Form reset to default 7 days');
  };

  const handleSaveWeeklyHomework = async (e) => {
    e.preventDefault();
    if (targetType === 'course' && !selectedCourseId) {
      toast.error('Please select a course to assign homework');
      return;
    }
    if (targetType === 'student' && !studentRollNo.trim()) {
      toast.error('Please enter a student Roll Number');
      return;
    }

    // Filter valid items that have at least title, description, or subject
    const validItems = weeklyItems.filter(
      item => (item.title && item.title.trim()) || (item.description && item.description.trim()) || item.subject_id || (item.subject_name && item.subject_name.trim())
    );

    if (validItems.length === 0) {
      toast.error('Please fill in at least one subject homework task');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/admin/homework/save-weekly', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          target_type: targetType,
          course_id: targetType === 'course' ? selectedCourseId : null,
          roll_no: targetType === 'student' ? studentRollNo.trim() : null,
          week_start_date: weekStartDate,
          items: validItems
        })
      });

      const data = await res.json();
      if (data.success) {
        toast.success(data.message || 'Weekly homework saved successfully!');
        fetchPublishedHomework();
      } else {
        toast.error('Failed to save homework: ' + (data.message || 'Validation error'));
      }
    } catch (err) {
      console.error(err);
      toast.error('Network error saving weekly homework');
    }
    setSaving(false);
  };

  const handleLoadBatchForEdit = (batch) => {
    setTargetType(batch.target_type);
    if (batch.target_type === 'course') {
      setSelectedCourseId(batch.course_id);
    } else {
      setStudentRollNo(batch.roll_no || '');
    }
    setWeekStartDate(batch.week_start_date);

    if (batch.items && batch.items.length > 0) {
      const loadedItems = batch.items.map((i, idx) => ({
        id: `edit_${i.id || idx}_${Date.now()}`,
        day_of_week: i.day_of_week,
        subject_id: i.subject_id || '',
        subject_name: i.subject_name || '',
        title: i.title || '',
        description: i.description || '',
        due_date: i.due_date || ''
      }));
      setWeeklyItems(loadedItems);
    } else {
      setWeeklyItems(createInitialWeeklyItems());
    }

    toast.info(`Loaded batch for ${batch.course_code || batch.roll_no} (${batch.week_start_date})`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteBatch = async (batch) => {
    if (!window.confirm(`Are you sure you want to delete homework for ${batch.course_code || batch.roll_no} (${batch.week_start_date})?`)) {
      return;
    }

    try {
      const res = await fetch('/api/admin/homework/weekly', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          target_type: batch.target_type,
          course_id: batch.course_id,
          roll_no: batch.roll_no,
          week_start_date: batch.week_start_date
        })
      });

      const data = await res.json();
      if (data.success) {
        toast.success('Weekly homework batch deleted');
        fetchPublishedHomework();
      } else {
        toast.error('Failed to delete homework');
      }
    } catch (err) {
      console.error(err);
      toast.error('Network error deleting homework');
    }
  };

  return (
    <div className={styles.homeworkContainer}>
      {/* Page Header */}
      <div className={styles.pageHeader}>
        <div>
          <h2 className={styles.pageTitle}>
            <FileText className={styles.titleIcon} />
            Weekly Homework Manager
          </h2>
          <p className={styles.pageSubtitle}>
            Assign weekly course tasks and track student homework progress & uploaded notebook photos.
          </p>
        </div>

        {/* Sub-Tab Navigation Bar */}
        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
          <button
            type="button"
            className={`${styles.targetPill} ${adminViewTab === 'editor' ? styles.targetPillActive : ''}`}
            onClick={() => setAdminViewTab('editor')}
          >
            <Edit3 size={15} />
            <span>Homework Assigner Form</span>
          </button>
          <button
            type="button"
            className={`${styles.targetPill} ${adminViewTab === 'submissions' ? styles.targetPillActive : ''}`}
            onClick={() => { setAdminViewTab('submissions'); fetchSubmissions(); }}
          >
            <Camera size={15} />
            <span>Student Submissions & Notebook Photos ({studentSubmissions.length})</span>
          </button>
        </div>
      </div>

      {adminViewTab === 'submissions' ? (
        /* ── STUDENT HOMEWORK SUBMISSIONS & PROGRESS TRACKER CARD ── */
        <div className={styles.singleUnifiedCard}>
          <div className={styles.cardHeader}>
            <div className={styles.cardHeaderTitle}>
              <Camera className={styles.sparkleIcon} />
              <h3>Student Homework Submissions & Notebook Photos</h3>
            </div>
            <button className={styles.secondaryBtn} onClick={fetchSubmissions} style={{ padding: '0.4rem 0.85rem' }}>
              <RotateCcw size={14} /> Refresh Submissions
            </button>
          </div>

          {/* Student Progress Summary */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
            <div className={styles.fieldItem} style={{ background: '#f8fafc', padding: '1rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0' }}>
              <span className={styles.miniLabel}>Total Uploaded Proofs</span>
              <strong style={{ fontSize: '1.4rem', color: '#0f172a' }}>{studentSubmissions.length} Photos</strong>
            </div>
            <div className={styles.fieldItem} style={{ background: '#f8fafc', padding: '1rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0' }}>
              <span className={styles.miniLabel}>Students Progress Tracked</span>
              <strong style={{ fontSize: '1.4rem', color: '#10b981' }}>{studentProgress.length} Students</strong>
            </div>
          </div>

          {loadingSubmissions ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
              <Clock className={styles.spinIcon} size={24} />
              <p>Loading student homework submissions...</p>
            </div>
          ) : studentSubmissions.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b', background: '#fafafa', borderRadius: '0.5rem' }}>
              <CheckCircle2 size={36} color="#10b981" style={{ margin: '0 auto 0.5rem' }} />
              <h4>No Homework Photos Uploaded Yet</h4>
              <p>When students submit notebook photos of completed homework, they will appear here automatically.</p>
            </div>
          ) : (
            <div className={styles.tableResponsive} style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0', color: '#475569' }}>
                    <th style={{ padding: '0.75rem 1rem' }}>Student Name</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Roll No</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Subject & Task Title</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Submitted Proof</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Grade & Evaluation</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Submitted At</th>
                    <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {(Array.isArray(studentSubmissions) ? studentSubmissions : []).map((sub, sIdx) => {
                    const photoSrc = sub.attachment_photo 
                      ? (sub.attachment_photo.startsWith('/') ? sub.attachment_photo : `/${sub.attachment_photo}`)
                      : null;

                    return (
                      <tr key={sub.id || sIdx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '0.75rem 1rem', fontWeight: 600, color: '#0f172a' }}>{sub.student_name || 'Student'}</td>
                        <td style={{ padding: '0.75rem 1rem', fontFamily: 'monospace', color: '#0369a1' }}>{sub.roll_no}</td>
                        <td style={{ padding: '0.75rem 1rem' }}>
                          <div style={{ fontWeight: 600, color: '#0f172a' }}>{sub.homework?.subject?.name || sub.homework?.subject_name || 'Subject'}</div>
                          <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{sub.homework?.title || 'Homework Task'}</div>
                        </td>
                        <td style={{ padding: '0.75rem 1rem' }}>
                          {photoSrc ? (
                            <div 
                              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', background: '#f8fafc', padding: '0.25rem 0.5rem', borderRadius: '0.375rem', border: '1px solid #e2e8f0' }}
                              onClick={() => setPreviewPhotoUrl(photoSrc)}
                              title="Click to inspect full notebook photo"
                            >
                              <img 
                                src={photoSrc} 
                                alt="Notebook Proof" 
                                style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '0.25rem', border: '1px solid #cbd5e1' }} 
                              />
                              <span style={{ fontSize: '0.75rem', color: '#0284c7', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                                <Eye size={12} /> View Photo
                              </span>
                            </div>
                          ) : (
                            <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>No Photo</span>
                          )}
                        </td>
                        <td style={{ padding: '0.75rem 1rem' }}>
                          {sub.teacher_grade ? (
                            <span style={{ 
                              display: 'inline-flex', 
                              alignItems: 'center', 
                              gap: '0.3rem', 
                              background: sub.teacher_grade === 'Wrong' ? '#fef2f2' : (sub.teacher_grade === 'Excellent' ? '#f0fdf4' : '#f0f9ff'),
                              color: sub.teacher_grade === 'Wrong' ? '#ef4444' : (sub.teacher_grade === 'Excellent' ? '#16a34a' : '#0284c7'),
                              border: '1px solid ' + (sub.teacher_grade === 'Wrong' ? '#fecaca' : (sub.teacher_grade === 'Excellent' ? '#bbf7d0' : '#bae6fd')),
                              padding: '0.25rem 0.6rem', 
                              borderRadius: '0.375rem', 
                              fontSize: '0.775rem', 
                              fontWeight: 800 
                            }}>
                              {sub.teacher_grade === 'Wrong' && '❌ '}
                              {sub.teacher_grade === 'Good' && '👍 '}
                              {sub.teacher_grade === 'Very Good' && '⭐ '}
                              {sub.teacher_grade === 'Excellent' && '🏆 '}
                              {sub.teacher_grade}
                            </span>
                          ) : (
                            <span style={{ color: '#94a3b8', fontSize: '0.775rem', fontStyle: 'italic' }}>-- Not Graded --</span>
                          )}
                        </td>
                        <td style={{ padding: '0.75rem 1rem', fontSize: '0.825rem', color: '#64748b' }}>
                          {sub.submitted_at ? new Date(sub.submitted_at).toLocaleString() : 'Recently'}
                        </td>
                        <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>
                          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.4rem' }}>
                            {photoSrc && (
                              <button
                                type="button"
                                style={{ padding: '0.35rem 0.65rem', fontSize: '0.775rem', background: '#0284c7', color: 'white', border: 'none', borderRadius: '0.375rem', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontWeight: 600 }}
                                onClick={() => setPreviewPhotoUrl(photoSrc)}
                              >
                                <Eye size={13} /> Photo
                              </button>
                            )}
                            <button
                              type="button"
                              style={{ padding: '0.35rem 0.65rem', fontSize: '0.775rem', background: '#4f46e5', color: 'white', border: 'none', borderRadius: '0.375rem', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontWeight: 600 }}
                              onClick={() => openGradingModal(sub)}
                            >
                              <Award size={13} /> Grade
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        /* ── SINGLE UNIFIED CARD FOR FULL WEEK'S HOMEWORK ── */
        <div className={styles.singleUnifiedCard}>
          <div className={styles.cardHeader}>
            <div className={styles.cardHeaderTitle}>
              <Sparkles className={styles.sparkleIcon} />
              <h3>Unified Weekly Homework Form</h3>
            </div>
            <span className={styles.singleFormBadge}>Single Card Assigner</span>
          </div>

        <form onSubmit={handleSaveWeeklyHomework}>
          {/* Target Assignment Header Controls */}
          <div className={styles.controlsRow}>
            {/* Target Type Toggle */}
            <div className={styles.controlGroup}>
              <label className={styles.label}>Assign Homework To:</label>
              <div className={styles.targetPillGroup}>
                <button
                  type="button"
                  className={`${styles.targetPill} ${targetType === 'course' ? styles.targetPillActive : ''}`}
                  onClick={() => setTargetType('course')}
                >
                  <GraduationCap size={15} />
                  Course / Class
                </button>
                <button
                  type="button"
                  className={`${styles.targetPill} ${targetType === 'student' ? styles.targetPillActive : ''}`}
                  onClick={() => setTargetType('student')}
                >
                  <UserCheck size={15} />
                  Specific Student
                </button>
              </div>
            </div>

            {/* Course or Roll No Selector */}
            {targetType === 'course' ? (
              <div className={styles.controlGroup}>
                <label className={styles.label}>Select Course / Department <span className={styles.required}>*</span></label>
                <select
                  className={styles.selectInput}
                  value={selectedCourseId}
                  onChange={(e) => setSelectedCourseId(e.target.value)}
                  required
                >
                  {(Array.isArray(courses) ? courses : []).map(c => (
                    <option key={c.id} value={c.id}>
                      {c.code || c.name} — {c.name}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className={styles.controlGroup}>
                <label className={styles.label}>Student Roll Number <span className={styles.required}>*</span></label>
                <input
                  type="text"
                  className={styles.textInput}
                  placeholder="e.g. BCA2026-001"
                  value={studentRollNo}
                  onChange={(e) => setStudentRollNo(e.target.value)}
                  required
                />
              </div>
            )}

            {/* Week Selector */}
            <div className={styles.controlGroup}>
              <label className={styles.label}>Week Starting Date (Monday)</label>
              <div className={styles.dateInputWrapper}>
                <Calendar size={16} className={styles.inputIcon} />
                <input
                  type="date"
                  className={styles.dateInput}
                  value={weekStartDate}
                  onChange={(e) => setWeekStartDate(e.target.value)}
                  required
                />
              </div>
            </div>
          </div>

          {/* ── 7-DAY BLOCKS INSIDE THE SINGLE CARD (MULTIPLE SUBJECTS PER DAY) ── */}
          <div className={styles.daysContainer}>
            {DAYS.map((day) => {
              // Find all task indices for this day
              const dayTasksWithIndex = weeklyItems
                .map((item, originalIndex) => ({ ...item, originalIndex }))
                .filter(item => item.day_of_week === day);

              return (
                <div key={day} className={styles.dayBlock}>
                  {/* Day Block Header */}
                  <div className={styles.dayBlockHeader}>
                    <div className={styles.dayTitleBox}>
                      <span className={styles.dayBadge}>{day.slice(0, 3).toUpperCase()}</span>
                      <h4 className={styles.dayNameText}>{day}</h4>
                      <span className={styles.dayTaskCountBadge}>
                        {dayTasksWithIndex.length} Subject Task{dayTasksWithIndex.length !== 1 ? 's' : ''}
                      </span>
                    </div>

                    <button
                      type="button"
                      className={styles.addSubjectBtn}
                      onClick={() => handleAddTaskForDay(day)}
                    >
                      <Plus size={14} />
                      Add Subject Task for {day}
                    </button>
                  </div>

                  {/* Tasks List for this Day */}
                  {dayTasksWithIndex.length === 0 ? (
                    <div className={styles.noDayTasksText}>
                      No subjects added for {day} yet. Click "+ Add Subject Task" above to add one.
                    </div>
                  ) : (
                    <div className={styles.taskListForDay}>
                      {dayTasksWithIndex.map(({ originalIndex, id }, subIdx) => {
                        const item = weeklyItems[originalIndex];
                        if (!item) return null;
                        return (
                          <div key={id || originalIndex} className={styles.taskCardRow}>
                            <div className={styles.taskCardNumber}>#{subIdx + 1}</div>

                            <div className={styles.taskGridFields}>
                              {/* Subject Selector */}
                              <div className={styles.fieldItem}>
                                <label className={styles.miniLabel}>Subject</label>
                                <select
                                  className={styles.cellSelect}
                                  value={item.subject_id}
                                  onChange={(e) => handleItemChange(originalIndex, 'subject_id', e.target.value)}
                                >
                                  <option value="">-- Select Subject --</option>
                                  {(Array.isArray(subjects) ? subjects : []).map(s => (
                                    <option key={s.id} value={s.id}>{s.name}</option>
                                  ))}
                                </select>
                              </div>

                              {/* Title */}
                              <div className={styles.fieldItem}>
                                <label className={styles.miniLabel}>Homework Title</label>
                                <input
                                  type="text"
                                  className={styles.cellInput}
                                  placeholder="e.g. Chapter 4 Exercises"
                                  value={item.title}
                                  onChange={(e) => handleItemChange(originalIndex, 'title', e.target.value)}
                                />
                              </div>

                              {/* Description */}
                              <div className={`${styles.fieldItem} ${styles.fieldSpan2}`}>
                                <label className={styles.miniLabel}>Task Instructions / Details</label>
                                <textarea
                                  className={styles.cellTextarea}
                                  rows={2}
                                  placeholder="Detailed instructions for students..."
                                  value={item.description}
                                  onChange={(e) => handleItemChange(originalIndex, 'description', e.target.value)}
                                />
                              </div>

                              {/* Due Date */}
                              <div className={styles.fieldItem}>
                                <label className={styles.miniLabel}>Due Date</label>
                                <input
                                  type="date"
                                  className={styles.cellInput}
                                  value={item.due_date}
                                  onChange={(e) => handleItemChange(originalIndex, 'due_date', e.target.value)}
                                />
                              </div>
                            </div>

                            {/* Remove button ONLY for manually added extra tasks (subIdx > 0) */}
                            {subIdx > 0 && (
                              <button
                                type="button"
                                onClick={() => handleRemoveTask(originalIndex)}
                                title="Remove this subject task"
                                style={{
                                  background: '#fff1f2',
                                  color: '#e11d48',
                                  border: '1px solid #fecdd3',
                                  borderRadius: '0.375rem',
                                  padding: '0.35rem 0.6rem',
                                  fontSize: '0.75rem',
                                  fontWeight: 600,
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '0.25rem',
                                  alignSelf: 'center',
                                  flexShrink: 0
                                }}
                              >
                                <Trash2 size={13} />
                                Remove
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Form Actions Footer inside the Single Card */}
          <div className={styles.cardFooterActions}>
            <button
              type="button"
              className={styles.resetBtn}
              onClick={handleResetForm}
            >
              <RotateCcw size={16} />
              Reset Schedule Form
            </button>

            <button
              type="submit"
              className={styles.saveSubmitBtn}
              disabled={saving}
            >
              <Save size={18} />
              {saving ? 'Saving Full Week Homework...' : 'Save Full Week Homework'}
            </button>
          </div>
        </form>
      </div>
      )}

      {/* ── PUBLISHED BATCHES HISTORY ── */}
      <div className={styles.publishedSection}>
        <div className={styles.sectionHeader}>
          <h3>
            <Layers size={18} />
            Published Weekly Homeworks
          </h3>
          <span className={styles.batchCountBadge}>{publishedBatches.length} Batches Published</span>
        </div>

        {loading ? (
          <div className={styles.loadingState}>
            <Clock className={styles.spinIcon} size={24} />
            <span>Loading published homework list...</span>
          </div>
        ) : publishedBatches.length === 0 ? (
          <div className={styles.emptyState}>
            <AlertCircle size={32} color="#94a3b8" />
            <h4>No Weekly Homework Published Yet</h4>
            <p>Use the unified form above to set homework for all course subjects for the week.</p>
          </div>
        ) : (
          <div className={styles.batchesTableWrapper}>
            <table className={styles.batchesTable}>
              <thead>
                <tr>
                  <th>Assigned Target</th>
                  <th>Target Type</th>
                  <th>Week Starting</th>
                  <th>Total Tasks</th>
                  <th>Subjects Included</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {(Array.isArray(publishedBatches) ? publishedBatches : []).map((batch, bIdx) => (
                  <tr key={batch.key || bIdx}>
                    <td>
                      <span className={styles.targetTitle}>
                        {batch.target_type === 'course' 
                          ? (batch.course_name || batch.course_code || 'Course')
                          : `Roll No: ${batch.roll_no}`}
                      </span>
                    </td>
                    <td>
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
                        color: batch.target_type === 'course' ? '#4f46e5' : '#b45309',
                        fontSize: '0.8rem', fontWeight: 700,
                        border: '1px solid ' + (batch.target_type === 'course' ? '#c7d2fe' : '#fde68a'),
                        padding: '0.25rem 0.65rem',
                        borderRadius: '6px'
                      }}>
                        {batch.target_type === 'course' ? 'Course' : 'Student'}
                      </span>
                    </td>
                    <td>
                      <div style={{ display:'flex', alignItems:'center', gap:'0.4rem', color:'#475569', fontSize:'0.875rem' }}>
                        <Calendar size={14} color="#94a3b8" />
                        <span style={{ color:'#334155', fontWeight:600 }}>{batch.week_start_date}</span>
                      </div>
                    </td>
                    <td>
                      <span style={{
                        color: '#059669',
                        fontSize: '0.85rem', fontWeight: 700,
                        border: '1px solid #a7f3d0',
                        padding: '0.25rem 0.65rem',
                        borderRadius: '6px',
                        display: 'inline-block'
                      }}>
                        {batch.total_tasks} Tasks
                      </span>
                    </td>
                    <td>
                      <div className={styles.dayTagsRow}>
                        {batch.items && batch.items.map((i, idx) => (
                          <span key={i.id || idx} className={styles.miniDayTag} title={`${i.day_of_week || 'Day'}: ${i.subject_name || i.title || ''}`} style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', padding: '0.2rem 0.5rem', borderRadius: '0.25rem', fontSize: '0.75rem', fontWeight: 600, color: '#334155', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                            <strong style={{ color: '#0369a1' }}>{(i.day_of_week || 'Day').slice(0, 3)}:</strong> {i.subject_name || i.title || 'Task'}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div className={styles.actionBtnsGroup}>
                        <button
                          className={styles.editBatchBtn}
                          style={{ background: '#e0f2fe', color: '#0284c7', borderColor: '#bae6fd' }}
                          onClick={() => setSelectedViewBatchKey(batch.key)}
                          title="View Full Assigned Homework Details"
                        >
                          <Eye size={15} />
                          View
                        </button>
                        <button
                          className={styles.editBatchBtn}
                          onClick={() => handleLoadBatchForEdit(batch)}
                          title="Load into Form to Edit"
                        >
                          <Edit3 size={15} />
                          Edit
                        </button>
                        <button
                          className={styles.deleteBatchBtn}
                          onClick={() => handleDeleteBatch(batch)}
                          title="Delete Batch"
                        >
                          <Trash2 size={15} />
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Admin Photo Inspector Lightbox Modal */}
      {previewPhotoUrl && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15,23,42,0.85)', backdropFilter: 'blur(4px)', zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }} onClick={() => setPreviewPhotoUrl(null)}>
          <div style={{ background: '#ffffff', borderRadius: '0.85rem', maxWidth: '750px', width: '100%', maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.25rem', background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
              <h4 style={{ margin: 0, fontSize: '1rem', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Camera size={16} color="#0284c7" /> Student Submitted Notebook Photo Proof
              </h4>
              <button onClick={() => setPreviewPhotoUrl(null)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748b' }}><X size={18} /></button>
            </div>
            <div style={{ padding: '1rem', background: '#0f172a', display: 'flex', justifyContent: 'center', overflowY: 'auto' }}>
              <img src={previewPhotoUrl} alt="Notebook Proof" style={{ maxWidth: '100%', maxHeight: '75vh', objectFit: 'contain', borderRadius: '0.375rem' }} />
            </div>
          </div>
        </div>
      )}

      {/* Full Assigned Homework Details Lightbox Modal */}
      {selectedViewBatch && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15,23,42,0.85)', backdropFilter: 'blur(4px)', zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }} onClick={() => setSelectedViewBatchKey(null)}>
          <div style={{ background: '#ffffff', borderRadius: '1rem', maxWidth: '800px', width: '100%', maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }} onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div style={{ padding: '1.25rem 1.5rem', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <FileText size={18} color="#4f46e5" />
                  Assigned Weekly Homework Details
                </h3>
                <span style={{ fontSize: '0.825rem', color: '#64748b', marginTop: '0.2rem', display: 'block' }}>
                  Target: <strong style={{ color: '#0369a1' }}>{selectedViewBatch.target_type === 'course' ? (selectedViewBatch.course_name || selectedViewBatch.course_code || 'Course') : `Roll No: ${selectedViewBatch.roll_no}`}</strong> · Week of <strong>{selectedViewBatch.week_start_date}</strong> ({selectedViewBatch.total_tasks} Tasks)
                </span>
              </div>
              <button onClick={() => setSelectedViewBatchKey(null)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748b', padding: '0.25rem' }}><X size={20} /></button>
            </div>

            {/* Modal Body - Day-wise Grouped Schedule */}
            <div style={{ padding: '1.25rem 1.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem', background: '#f8fafc' }}>
              {selectedViewBatch.items && (() => {
                const DAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
                // Group tasks by day
                const grouped = {};
                selectedViewBatch.items.forEach(task => {
                  const day = task.day_of_week || 'Other';
                  if (!grouped[day]) grouped[day] = [];
                  grouped[day].push(task);
                });
                // Render in order
                return DAYS.filter(d => grouped[d]).map(day => (
                  <div key={day}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                      <span style={{ background: '#e0e7ff', color: '#3730a3', fontSize: '0.72rem', fontWeight: 800, padding: '0.2rem 0.7rem', borderRadius: '0.25rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        {day}
                      </span>
                      <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{grouped[day].length} subject{grouped[day].length > 1 ? 's' : ''}</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {grouped[day].map((task, idx) => (
                        <div key={task.id || idx} style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '0.5rem', padding: '0.75rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.4rem', boxShadow: '0 1px 3px rgba(0,0,0,0.03)', marginLeft: '0.5rem' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                              <BookOpen size={14} color="#4f46e5" />
                              <strong style={{ fontSize: '0.9rem', color: '#0f172a' }}>{task.subject_name || 'General Subject'}</strong>
                            </div>
                            {task.due_date && (
                              <span style={{ fontSize: '0.75rem', color: '#d97706', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                <Clock size={12} /> Due: {task.due_date}
                              </span>
                            )}
                          </div>
                          {task.title && (
                            <h4 style={{ margin: 0, fontSize: '0.85rem', color: '#1e293b', fontWeight: 700 }}>{task.title}</h4>
                          )}
                          {task.description && (
                            <p style={{ margin: 0, fontSize: '0.82rem', color: '#475569', background: '#f8fafc', padding: '0.45rem 0.7rem', borderRadius: '0.375rem', lineHeight: '1.4', borderLeft: '3px solid #c7d2fe' }}>
                              {task.description}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ));
              })()}
            </div>

            {/* Modal Footer */}
            <div style={{ padding: '1rem 1.5rem', background: '#ffffff', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button
                onClick={() => {
                  const b = selectedViewBatch;
                  setSelectedViewBatchKey(null);
                  handleLoadBatchForEdit(b);
                }}
                style={{ background: '#4f46e5', color: '#ffffff', border: 'none', padding: '0.5rem 1rem', borderRadius: '0.375rem', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
              >
                <Edit3 size={15} /> Edit in Form
              </button>
              <button
                onClick={() => setSelectedViewBatchKey(null)}
                style={{ background: '#f1f5f9', color: '#334155', border: '1px solid #cbd5e1', padding: '0.5rem 1rem', borderRadius: '0.375rem', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer' }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      {activeGradeSubmission && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15,23,42,0.85)', backdropFilter: 'blur(4px)', zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }} onClick={() => setActiveGradeSubmission(null)}>
          <div style={{ background: '#ffffff', borderRadius: '1rem', maxWidth: '520px', width: '100%', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ padding: '1.25rem 1.5rem', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Award size={18} color="#4f46e5" /> Grade & Review Homework
                </h3>
                <span style={{ fontSize: '0.825rem', color: '#64748b', marginTop: '0.15rem', display: 'block' }}>
                  Student: <strong>{activeGradeSubmission.student_name}</strong> (Roll #{activeGradeSubmission.roll_no})
                </span>
              </div>
              <button onClick={() => setActiveGradeSubmission(null)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748b' }}><X size={20} /></button>
            </div>

            <div style={{ padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* Submitted Notebook Photo Display */}
              {activeGradeSubmission.attachment_photo && (
                <div>
                  <label style={{ fontSize: '0.825rem', fontWeight: 700, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Camera size={14} color="#0284c7" /> Student Submitted Notebook Photo:
                  </label>
                  <div 
                    style={{ background: '#0f172a', borderRadius: '0.5rem', padding: '0.65rem', display: 'flex', justifyContent: 'center', cursor: 'pointer' }}
                    onClick={() => {
                      const photo = activeGradeSubmission.attachment_photo;
                      const src = photo.startsWith('/') ? photo : `/${photo}`;
                      setPreviewPhotoUrl(src);
                    }}
                    title="Click to view full screen photo inspector"
                  >
                    <img 
                      src={activeGradeSubmission.attachment_photo.startsWith('/') ? activeGradeSubmission.attachment_photo : `/${activeGradeSubmission.attachment_photo}`}
                      alt="Notebook Proof" 
                      style={{ maxWidth: '100%', maxHeight: '200px', objectFit: 'contain', borderRadius: '0.375rem' }} 
                    />
                  </div>
                </div>
              )}

              {/* Select Grade */}
              <div>
                <label style={{ fontSize: '0.825rem', fontWeight: 700, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.5rem', display: 'block' }}>
                  Select Grade Performance:
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.6rem' }}>
                  {[
                    { value: 'Wrong', label: '❌ Wrong / Revision Required', bg: '#fef2f2', color: '#ef4444', border: '#fecaca' },
                    { value: 'Good', label: '👍 Good', bg: '#f0f9ff', color: '#0284c7', border: '#bae6fd' },
                    { value: 'Very Good', label: '⭐ Very Good', bg: '#fef3c7', color: '#b45309', border: '#fde68a' },
                    { value: 'Excellent', label: '🏆 Excellent', bg: '#f0fdf4', color: '#16a34a', border: '#bbf7d0' },
                  ].map(g => (
                    <button
                      key={g.value}
                      type="button"
                      onClick={() => setGradeValue(g.value)}
                      style={{
                        padding: '0.6rem 0.75rem',
                        borderRadius: '0.5rem',
                        fontSize: '0.825rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        textAlign: 'left',
                        background: gradeValue === g.value ? g.bg : '#ffffff',
                        color: gradeValue === g.value ? g.color : '#475569',
                        border: gradeValue === g.value ? `2px solid ${g.color}` : '1px solid #e2e8f0',
                        boxShadow: gradeValue === g.value ? '0 2px 4px rgba(0,0,0,0.05)' : 'none',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      {g.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Teacher Remarks Input */}
              <div>
                <label style={{ fontSize: '0.825rem', fontWeight: 700, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.4rem', display: 'block' }}>
                  Teacher Remarks / Feedback for Student:
                </label>
                <textarea
                  rows={3}
                  placeholder="e.g. Good effort! Please review question #3 calculation again."
                  value={teacherRemarks}
                  onChange={(e) => setTeacherRemarks(e.target.value)}
                  style={{ width: '100%', padding: '0.65rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1', fontSize: '0.85rem', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>
            </div>

            <div style={{ padding: '1rem 1.5rem', background: '#f8fafc', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button
                type="button"
                onClick={() => setActiveGradeSubmission(null)}
                style={{ background: '#ffffff', color: '#475569', border: '1px solid #cbd5e1', padding: '0.5rem 1rem', borderRadius: '0.375rem', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={submittingGrade}
                onClick={() => handleSaveGrade(activeGradeSubmission.id)}
                style={{ background: '#4f46e5', color: '#ffffff', border: 'none', padding: '0.5rem 1.25rem', borderRadius: '0.375rem', fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
              >
                <Check size={16} />
                {submittingGrade ? 'Saving Grade...' : 'Save Grade & Feedback'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
