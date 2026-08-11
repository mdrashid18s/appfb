/**
 * @file QuestionBankModal.jsx
 * @description MCQ Question Bank Manager Modal for Test Templates.
 * Allows Admin to view, add, and delete MCQ questions for online tests.
 */

import React, { useState, useEffect } from 'react';
import styles from './QuestionBankModal.module.css';
import { X, Plus, Trash2, HelpCircle, CheckCircle, Award } from 'lucide-react';
import { useToast } from '../contexts/ToastContext';

export default function QuestionBankModal({ test, onClose }) {
  const toast = useToast();
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form state for adding new question
  const [qForm, setQForm] = useState({
    question_text: '',
    option_a: '',
    option_b: '',
    option_c: '',
    option_d: '',
    correct_option: 'A',
    marks: '1'
  });

  useEffect(() => {
    if (test && test.id) {
      fetchQuestions();
    }
  }, [test]);

  const fetchQuestions = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/tests/${test.id}/questions`, {
        headers: { Accept: 'application/json' }
      });
      const data = await res.json();
      if (data.success && data.questions) {
        setQuestions(data.questions);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load test questions');
    }
    setLoading(false);
  };

  const handleAddQuestion = async (e) => {
    e.preventDefault();
    if (!qForm.question_text || !qForm.option_a || !qForm.option_b) {
      toast.error('Question text and options are required');
      return;
    }

    try {
      const res = await fetch(`/api/admin/tests/${test.id}/questions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(qForm)
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Question added!');
        setQForm({
          question_text: '',
          option_a: '',
          option_b: '',
          option_c: '',
          option_d: '',
          correct_option: 'A',
          marks: '1'
        });
        fetchQuestions();
      } else {
        toast.error(data.message || 'Failed to add question');
      }
    } catch (err) {
      console.error(err);
      toast.error('Network error saving question');
    }
  };

  const handleDeleteQuestion = async (qId) => {
    if (!window.confirm('Delete this question?')) return;
    try {
      const res = await fetch(`/api/admin/questions/${qId}`, {
        method: 'DELETE',
        headers: { Accept: 'application/json' }
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Question deleted');
        fetchQuestions();
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to delete question');
    }
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.modalHeader}>
          <div>
            <span className={styles.badge}>{test.code || 'TEST'}</span>
            <h2>MCQ Question Bank: {test.name}</h2>
            <p>Manage online multiple choice questions & correct answers for this template</p>
          </div>
          <button className={styles.closeBtn} onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className={styles.modalBody}>
          {/* Form: Add Question */}
          <form onSubmit={handleAddQuestion} className={styles.addCard}>
            <h3>+ Add New MCQ Question</h3>
            <div className={styles.formGroup}>
              <label>QUESTION TEXT *</label>
              <textarea 
                rows="2"
                placeholder="Enter question prompt here..."
                value={qForm.question_text}
                onChange={e => setQForm({ ...qForm, question_text: e.target.value })}
                required
              />
            </div>

            <div className={styles.optionsGrid}>
              <div className={styles.formGroup}>
                <label>OPTION A *</label>
                <input 
                  type="text" 
                  placeholder="Option A text"
                  value={qForm.option_a}
                  onChange={e => setQForm({ ...qForm, option_a: e.target.value })}
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label>OPTION B *</label>
                <input 
                  type="text" 
                  placeholder="Option B text"
                  value={qForm.option_b}
                  onChange={e => setQForm({ ...qForm, option_b: e.target.value })}
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label>OPTION C *</label>
                <input 
                  type="text" 
                  placeholder="Option C text"
                  value={qForm.option_c}
                  onChange={e => setQForm({ ...qForm, option_c: e.target.value })}
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label>OPTION D *</label>
                <input 
                  type="text" 
                  placeholder="Option D text"
                  value={qForm.option_d}
                  onChange={e => setQForm({ ...qForm, option_d: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className={styles.metaRow}>
              <div className={styles.formGroup}>
                <label>CORRECT OPTION *</label>
                <select 
                  value={qForm.correct_option}
                  onChange={e => setQForm({ ...qForm, correct_option: e.target.value })}
                >
                  <option value="A">Option A</option>
                  <option value="B">Option B</option>
                  <option value="C">Option C</option>
                  <option value="D">Option D</option>
                </select>
              </div>

              <div className={styles.formGroup}>
                <label>MARKS</label>
                <input 
                  type="number" 
                  value={qForm.marks}
                  onChange={e => setQForm({ ...qForm, marks: e.target.value })}
                  min="1"
                />
              </div>

              <button type="submit" className={styles.addQBtn}>
                <Plus size={16} /> Save Question
              </button>
            </div>
          </form>

          {/* Existing Questions List */}
          <div className={styles.questionsList}>
            <h3>Questions Added ({questions.length})</h3>
            {loading ? (
              <p className={styles.loadingText}>Loading questions...</p>
            ) : questions.length === 0 ? (
              <div className={styles.emptyBox}>
                <HelpCircle size={32} color="#94a3b8" />
                <p>No questions added yet. Use the form above to add MCQ questions.</p>
              </div>
            ) : (
              questions.map((q, idx) => (
                <div key={q.id} className={styles.qCard}>
                  <div className={styles.qHeader}>
                    <span className={styles.qNum}>Q{idx + 1}</span>
                    <span className={styles.qText}>{q.question_text}</span>
                    <span className={styles.marksBadge}>{q.marks || 1} Marks</span>
                    <button 
                      className={styles.delQBtn} 
                      onClick={() => handleDeleteQuestion(q.id)}
                      title="Delete Question"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>

                  <div className={styles.optionsList}>
                    <div className={`${styles.optItem} ${q.correct_option === 'A' ? styles.correctOpt : ''}`}>
                      <strong>A.</strong> {q.option_a}
                    </div>
                    <div className={`${styles.optItem} ${q.correct_option === 'B' ? styles.correctOpt : ''}`}>
                      <strong>B.</strong> {q.option_b}
                    </div>
                    <div className={`${styles.optItem} ${q.correct_option === 'C' ? styles.correctOpt : ''}`}>
                      <strong>C.</strong> {q.option_c}
                    </div>
                    <div className={`${styles.optItem} ${q.correct_option === 'D' ? styles.correctOpt : ''}`}>
                      <strong>D.</strong> {q.option_d}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
