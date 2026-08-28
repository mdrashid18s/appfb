/**
 * @file ViewAnswersModal.jsx
 * @description Admin Modal: Student dwara submit kiye gaye answers/images dekhna aur marks/grading dena.
 *
 * Yeh modal Admin ko allow karta hai:
 *   1. Student dwara upload kiye gaye hand-written answer page images dekhna.
 *   2. Har page ki image ko full-size me preview karna.
 *   3. Student ko 0-100% ke beech grade/score assign karna aur save karna (/api/admin/student-tests/{id}/grade).
 *
 * @param {number|string} studentTestId - student_tests table ka primary ID.
 * @param {string}        studentName   - Student ka full name.
 * @param {number|string} currentScore  - Pehle se diya gaya score (agar graded hai).
 * @param {Function}      onClose       - Modal band karne ka callback.
 * @param {Function}      onGradeSaved  - Grade successfully save hone par parent table refresh karne ka callback.
 */

import React, { useState, useEffect } from 'react';
import { X, Image as ImageIcon } from 'lucide-react';
import { useToast } from '../contexts/ToastContext';

export default function ViewAnswersModal({ studentTestId, studentName, currentScore, onClose, onGradeSaved }) {
  
  // ─────────────────────────────────────────────
  // STATE VARIABLES
  // ─────────────────────────────────────────────

  /** answers: Backend se fetch kiye gaye student ke uploaded answer sheets ka array */
  const [answers, setAnswers] = useState([]);

  /** score: Admin dwara enter kiya gaya grade/score (0-100) */
  const [score, setScore] = useState(currentScore !== null && currentScore !== undefined ? currentScore : '');

  /** savingScore: Score save hone ke dauran button disable karne ke liye */
  const [savingScore, setSavingScore] = useState(false);

  /** loading: Answer images load hote waqt indicator */
  const [loading, setLoading] = useState(true);

  /** toast: Notification alerts (success/error) */
  const toast = useToast();

  // ─────────────────────────────────────────────
  // LIFECYCLE HOOKS
  // ─────────────────────────────────────────────

  /**
   * useEffect: studentTestId badalne par ya modal khulte par answers fetch karta hai
   */
  useEffect(() => {
    fetchAnswers();
  }, [studentTestId]);

  /**
   * fetchAnswers: Student dwara submit kiye gaye answers/photos ko API se fetch karta hai
   */
  const fetchAnswers = async () => {
    try {
      const res = await fetch(`/api/admin/student-tests/${studentTestId}/answers`, {
        headers: { 'Accept': 'application/json' }
      });
      const data = await res.json();
      if (data.success) {
        setAnswers(data.answers);
      } else {
        toast.error(data.message || 'Failed to load answers');
      }
    } catch (err) {
      console.error(err);
      toast.error('Network error while loading answers');
    }
    setLoading(false);
  };

  /**
   * handleSaveScore: Admin dwara dale gaye score ko validate karke backend API me save karta hai
   */
  const handleSaveScore = async () => {
    // Score validation (0 - 100 range)
    if (score === '' || isNaN(score) || score < 0 || score > 100) {
      toast.error('Please enter a valid score between 0 and 100');
      return;
    }
    setSavingScore(true);
    try {
      const res = await fetch(`/api/admin/student-tests/${studentTestId}/grade`, {
        method: 'POST',
        headers: { 
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken') || localStorage.getItem('token')}`
        },
        body: JSON.stringify({ score: parseInt(score) })
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Score saved successfully!');
        if (onGradeSaved) onGradeSaved();
        onClose();
      } else {
        toast.error(data.message || 'Failed to save score');
      }
    } catch (err) {
      console.error(err);
      toast.error('Network error while saving score');
    }
    setSavingScore(false);
  };

  // ─────────────────────────────────────────────
  // JSX RENDER
  // ─────────────────────────────────────────────

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
      backgroundColor: 'rgba(15, 23, 42, 0.85)', zIndex: 9999,
      display: 'flex', alignItems: 'center', justifyContent: 'center'
    }}>
      <div style={{
        background: 'white', borderRadius: '12px', width: '90%', maxWidth: '800px',
        maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden'
      }}>
        
        {/* Modal Header */}
        <div style={{
          padding: '16px 20px', borderBottom: '1px solid #e2e8f0', 
          display: 'flex', justifyContent: 'space-between', alignItems: 'center'
        }}>
          <div>
            <h3 style={{ margin: 0, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ImageIcon size={20} color="#3b82f6" /> 
              Answers submitted by: {studentName}
            </h3>
          </div>
          {/* Close Button */}
          <button 
            onClick={onClose}
            style={{
              background: '#f1f5f9', border: 'none', borderRadius: '50%',
              width: '32px', height: '32px', display: 'flex', alignItems: 'center', 
              justifyContent: 'center', cursor: 'pointer', color: '#64748b'
            }}
          >
            <X size={18} />
          </button>
        </div>
        
        {/* Grading Section: Score input aur Save button */}
        <div style={{ padding: '12px 20px', background: '#f1f5f9', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ fontWeight: 600, color: '#475569' }}>Grade Test:</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input 
              type="number" 
              placeholder="Score (0-100)" 
              value={score}
              onChange={(e) => setScore(e.target.value)}
              min="0" max="100"
              style={{ padding: '8px', border: '1px solid #cbd5e1', borderRadius: '6px', width: '120px' }}
            />
            <span style={{ color: '#64748b', fontSize: '0.9rem' }}>%</span>
          </div>
          <button 
            onClick={handleSaveScore}
            disabled={savingScore}
            style={{
              padding: '8px 16px', background: '#10b981', color: 'white', border: 'none', 
              borderRadius: '6px', fontWeight: 600, cursor: savingScore ? 'not-allowed' : 'pointer',
              opacity: savingScore ? 0.7 : 1
            }}
          >
            {savingScore ? 'Saving...' : 'Save Score'}
          </button>
        </div>
        
        {/* Body: Uploaded Answer Images Gallery */}
        <div style={{ padding: '20px', overflowY: 'auto', flex: 1, background: '#f8fafc' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>Loading answers...</div>
          ) : answers.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
              No answer photos uploaded yet for this test.
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '20px' }}>
              {answers.map((ans, idx) => (
                <div key={ans.id} style={{
                  background: 'white', borderRadius: '8px', overflow: 'hidden',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)', border: '1px solid #e2e8f0'
                }}>
                  <div style={{ padding: '8px 12px', borderBottom: '1px solid #e2e8f0', background: '#f1f5f9', fontWeight: 600, fontSize: '0.85rem', color: '#475569' }}>
                    Page {idx + 1}
                  </div>
                  <img 
                    src={`/storage/${ans.image_path}`} 
                    alt={`Answer Page ${idx + 1}`}
                    style={{ width: '100%', display: 'block' }} 
                  />
                  <div style={{ padding: '12px', display: 'flex', justifyContent: 'center' }}>
                     <a 
                       href={`/storage/${ans.image_path}`} 
                       target="_blank" rel="noreferrer"
                       style={{ color: '#3b82f6', textDecoration: 'none', fontSize: '0.9rem', fontWeight: 500 }}
                     >
                       View Full Size
                     </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
