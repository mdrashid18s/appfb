/**
 * @file NoticeboardView.jsx
 * @description Academic Noticeboard & Announcements View with Course-wise Filtering & Targeting.
 */

import React, { useState, useEffect } from 'react';
import styles from './NoticeboardView.module.css';
import { Bell, Plus, Calendar, Trash2, Megaphone, Tag, AlertTriangle, CheckCircle, GraduationCap, Filter } from 'lucide-react';
import { useToast } from '../contexts/ToastContext';

export default function NoticeboardView({ embedded = true, student = null }) {
  const toast = useToast();
  
  const [notices, setNotices] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedFilterCourse, setSelectedFilterCourse] = useState(student?.course_id ? String(student.course_id) : 'all');
  
  const [form, setForm] = useState({
    title: '',
    category: 'Exam Notice',
    course_id: 'all',
    content: ''
  });

  useEffect(() => {
    fetchCourses();
  }, []);

  useEffect(() => {
    fetchNotices();
  }, [selectedFilterCourse]);

  const fetchCourses = async () => {
    try {
      const res = await fetch('/api/admin/courses', { headers: { Accept: 'application/json' } });
      const data = await res.json();
      if (data.success && data.courses) {
        setCourses(data.courses);
      }
    } catch (err) {
      console.error('Failed to fetch courses:', err);
    }
  };

  const fetchNotices = async () => {
    setLoading(true);
    try {
      const url = selectedFilterCourse !== 'all' 
        ? `/api/admin/notices?course_id=${selectedFilterCourse}`
        : '/api/admin/notices';

      const res = await fetch(url, { headers: { Accept: 'application/json' } });
      const data = await res.json();
      if (data.success && data.notices) {
        setNotices(data.notices);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load notices');
    }
    setLoading(false);
  };

  const handleCreateNotice = async (e) => {
    e.preventDefault();
    if (!form.title || !form.content) {
      toast.error('Title and Notice content are required');
      return;
    }

    try {
      const res = await fetch('/api/admin/notices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Notice published successfully!');
        setShowModal(false);
        setForm({ title: '', category: 'Exam Notice', course_id: 'all', content: '' });
        fetchNotices();
      } else {
        toast.error(data.message || 'Failed to publish notice');
      }
    } catch (err) {
      console.error(err);
      toast.error('Network error publishing notice');
    }
  };

  const handleDeleteNotice = async (id) => {
    if (!window.confirm('Delete this notice?')) return;
    try {
      const res = await fetch(`/api/admin/notices/${id}`, {
        method: 'DELETE',
        headers: { Accept: 'application/json' }
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Notice removed');
        fetchNotices();
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to delete notice');
    }
  };

  return (
    <div className={styles.container}>
      {/* Action Header */}
      <div className={styles.headerBar} style={{ flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 className={styles.title}>Academic Noticeboard & Announcements</h2>
          <p className={styles.sub}>Publish exam schedules, holiday alerts, and course-targeted campus notices</p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          {/* Course Filter Dropdown */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: '#ffffff', border: '1px solid #cbd5e1', padding: '0.35rem 0.75rem', borderRadius: '0.5rem', boxShadow: '0 1px 2px rgba(0,0,0,0.04)' }}>
            <Filter size={14} color="#64748b" />
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569' }}>Target Course:</span>
            <select
              value={selectedFilterCourse}
              onChange={e => setSelectedFilterCourse(e.target.value)}
              style={{ border: 'none', background: 'transparent', fontSize: '0.825rem', fontWeight: 700, color: '#0f172a', outline: 'none', cursor: 'pointer' }}
            >
              <option value="all">All Courses (General)</option>
              {(Array.isArray(courses) ? courses : []).map(c => (
                <option key={c.id} value={c.id}>{c.code || c.name}</option>
              ))}
            </select>
          </div>

          <button className={styles.publishBtn} onClick={() => setShowModal(true)}>
            <Plus size={16} /> Publish Notice
          </button>
        </div>
      </div>

      {/* Notice Cards List */}
      {loading ? (
        <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>Loading notices...</div>
      ) : notices.length === 0 ? (
        <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b', background: '#ffffff', borderRadius: '0.75rem', border: '1px solid #e2e8f0' }}>
          No announcements found for the selected course filter.
        </div>
      ) : (
        <div className={styles.noticeGrid}>
          {notices.map(n => (
            <div key={n.id} className={styles.noticeCard}>
              <div className={styles.cardHeader}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                  <span className={`${styles.catBadge} ${n.category === 'Exam Notice' ? styles.examBadge : n.category === 'Holiday' ? styles.holidayBadge : styles.generalBadge}`}>
                    {n.category}
                  </span>

                  {/* Course Target Badge */}
                  <span style={{
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    padding: '0.2rem 0.55rem',
                    borderRadius: '0.25rem',
                    background: n.course_id ? '#e0f2fe' : '#f1f5f9',
                    color: n.course_id ? '#0369a1' : '#475569',
                    border: '1px solid ' + (n.course_id ? '#bae6fd' : '#cbd5e1'),
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.25rem'
                  }}>
                    <GraduationCap size={12} />
                    {n.target_course || (n.course_id ? 'Course #' + n.course_id : 'All Courses')}
                  </span>
                </div>

                <span className={styles.dateText}>
                  <Calendar size={13} /> {n.date}
                </span>
              </div>

              <h3 className={styles.cardTitle}>{n.title}</h3>
              <p className={styles.cardContent}>{n.content}</p>

              <div className={styles.cardFooter}>
                <span className={styles.authorText}>Posted by: {n.author}</span>
                <button className={styles.delBtn} onClick={() => handleDeleteNotice(n.id)} title="Delete Notice">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Notice Modal */}
      {showModal && (
        <div className={styles.modalOverlay} onClick={() => setShowModal(false)}>
          <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>Publish New Notice</h2>
              <button className={styles.closeBtn} onClick={() => setShowModal(false)}>✕</button>
            </div>

            <form onSubmit={handleCreateNotice}>
              <div className={styles.modalBody}>
                <div className={styles.formGroup}>
                  <label>NOTICE TITLE *</label>
                  <input 
                    type="text" 
                    placeholder="e.g. BCA 3rd Sem Mid-Term Exam Schedule"
                    value={form.title}
                    onChange={e => setForm({ ...form, title: e.target.value })}
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>TARGET COURSE *</label>
                  <select 
                    value={form.course_id}
                    onChange={e => setForm({ ...form, course_id: e.target.value })}
                    style={{ width: '100%', padding: '0.6rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                  >
                    <option value="all">🌐 All Courses / Everyone</option>
                    {(Array.isArray(courses) ? courses : []).map(c => (
                      <option key={c.id} value={c.id}>
                        🎓 {c.code || c.name} — {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label>CATEGORY *</label>
                  <select 
                    value={form.category}
                    onChange={e => setForm({ ...form, category: e.target.value })}
                  >
                    <option value="Exam Notice">Exam Notice</option>
                    <option value="Holiday">Holiday Alert</option>
                    <option value="General Notice">General Notice</option>
                    <option value="Urgent Alert">Urgent Alert</option>
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label>NOTICE CONTENT *</label>
                  <textarea 
                    rows="4"
                    placeholder="Write announcement details..."
                    value={form.content}
                    onChange={e => setForm({ ...form, content: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className={styles.modalFooter}>
                <button type="button" className={styles.cancelBtn} onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className={styles.saveBtn}>Publish Notice</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
