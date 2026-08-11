/**
 * @file ManageQuestionsModal.jsx
 * @description Admin ka MCQ Questions Management Modal Component.
 *
 * Yeh component admin ko kisi specific test ke MCQ questions manage karne deta hai.
 * Features:
 *   - Test ke existing questions ki list display karna
 *   - Naya question add karna (question text + 4 options + correct answer + marks)
 *   - Kisi bhi question ko delete karna
 *
 * @param {Object}   test     - Test object jiske questions manage ho rahe hain (id, name zaroor chahiye)
 * @param {Function} onClose  - Modal band karne ka callback
 * @param {Function} onUpdate - Question add/delete hone par parent AdminDashboard ko refresh karne ka callback
 */

import React, { useState, useEffect } from 'react';
import styles from './ManageQuestionsModal.module.css'; // CSS Modules styling

// Icons: X=Close, Plus=Add button, Trash2=Delete button, HelpCircle=Header icon
import { X, Plus, Trash2, HelpCircle } from 'lucide-react';

// Global toast notification hook
import { useToast } from '../contexts/ToastContext';

/**
 * ManageQuestionsModal Component
 * Modal ke do main sections hain:
 *   1. Existing Questions List (upar) - current questions display + delete option
 *   2. Add New Question Form (neeche) - naya MCQ question add karne ka form
 */
export default function ManageQuestionsModal({ test, onClose, onUpdate }) {

  // ─────────────────────────────────────────────
  // STATE VARIABLES
  // ─────────────────────────────────────────────

  /** questions: Backend se fetch hue test ke sare questions ki array */
  const [questions, setQuestions] = useState([]);

  /** loading: true hone par questions fetch ho rahi hain - loading state dikhta hai */
  const [loading, setLoading] = useState(true);

  /** toast: Global toast notification helper (success/error messages) */
  const toast = useToast();
  
  /**
   * form: Naya question add karne ke form ka state.
   * Fields:
   *   - question_text: Question ka text/sentence
   *   - option_a/b/c/d: Char MCQ options
   *   - correct_option: Sahi jawab kaun sa hai (A/B/C/D)
   *   - marks: Is question ke kitne marks hain (default: 1)
   */
  const [form, setForm] = useState({
    question_text: '',
    option_a: '',
    option_b: '',
    option_c: '',
    option_d: '',
    correct_option: 'A',  // Default sahi answer 'A' hota hai
    marks: 1              // Default 1 mark
  });
  
  /** isSubmitting: true hone par "Add Question" button disabled ho jata hai (double submit rokne ke liye) */
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ─────────────────────────────────────────────
  // LIFECYCLE - Component Mount hone par
  // ─────────────────────────────────────────────

  /**
   * useEffect: Component pehli baar render hone par (mount par) questions fetch karta hai.
   * [] dependency array ka matlab = sirf ek baar chalega (mount par)
   */
  useEffect(() => {
    fetchQuestions(); // Component open hote hi questions load karo
  }, []);

  // ─────────────────────────────────────────────
  // DATA FETCHING
  // ─────────────────────────────────────────────

  /**
   * fetchQuestions: Backend se is test ke sare questions fetch karta hai.
   * Endpoint: GET /api/admin/tests/:testId/questions
   * Success hone par questions state update hoti hai.
   */
  const fetchQuestions = async () => {
    try {
      const res = await fetch(`/api/admin/tests/${test.id}/questions`);
      const data = await res.json();
      if (data.success) {
        setQuestions(data.questions); // Questions array state mein store karo
      }
    } catch (err) {
      toast.error('Failed to load questions'); // Network error hone par toast dikhaao
    }
    setLoading(false); // Loading khatam (success ya failure dono mein)
  };

  // ─────────────────────────────────────────────
  // EVENT HANDLERS
  // ─────────────────────────────────────────────

  /**
   * handleAddQuestion: "Add Question" form submit hone par chalta hai.
   * Backend API ko POST request bhejta hai form data ke sath.
   * Success hone par:
   *   - Form reset hota hai (empty ho jata hai)
   *   - Questions list refresh hoti hai
   *   - Parent component ko update signal milta hai
   *
   * @param {React.FormEvent} e - Form submit event
   */
  const handleAddQuestion = async (e) => {
    e.preventDefault(); // Browser ka default form submit (page reload) rokta hai
    setIsSubmitting(true); // Button disable karo (double submit roko)

    try {
      const res = await fetch(`/api/admin/tests/${test.id}/questions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }, // JSON data bhej rahe hain
        body: JSON.stringify(form) // Form state ko JSON string mein convert karo
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Question added successfully!');
        
        // Form ko reset karo (sare fields empty + defaults)
        setForm({
          question_text: '', option_a: '', option_b: '', option_c: '', option_d: '',
          correct_option: 'A', marks: 1
        });
        
        fetchQuestions();    // Questions list refresh karo (naya question dikhane ke liye)
        if (onUpdate) onUpdate(data.count); // Parent (AdminDashboard/AssignTestModal) ko bhi refresh karo
      } else {
        toast.error(data.message || 'Failed to add question');
      }
    } catch (err) {
      toast.error('Network error while adding question');
    }
    setIsSubmitting(false); // Button dobara enable karo
  };

  /**
   * handleDelete: Kisi specific question ko delete karne ka handler.
   * Pehle window.confirm se user se confirmation leta hai.
   * Backend API ko DELETE request bhejta hai.
   *
   * @param {number} questionId - Delete hone wale question ka database ID
   */
  const handleDelete = async (questionId) => {
    // Browser ka native confirmation dialog
    if (!window.confirm('Are you sure you want to delete this question?')) return;

    try {
      const res = await fetch(`/api/admin/tests/${test.id}/questions/${questionId}`, {
        method: 'DELETE' // HTTP DELETE method se question delete hota hai
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Question deleted');
        fetchQuestions();    // Updated list fetch karo
        if (onUpdate) onUpdate(data.count); // Parent refresh karo
      } else {
        toast.error('Failed to delete');
      }
    } catch (err) {
      toast.error('Network error');
    }
  };

  // ─────────────────────────────────────────────
  // JSX RENDER
  // ─────────────────────────────────────────────

  return (
    // Modal background overlay (poori screen ke upar)
    <div className={styles.modalOverlay}>
      
      {/* Main modal container */}
      <div className={styles.modalContent}>
        
        {/* ── Modal Header ── */}
        <div className={styles.modalHeader}>
          {/* Header mein test ka naam aur HelpCircle icon */}
          <h2><HelpCircle size={24} color="#3b82f6" /> Manage Questions - {test.name}</h2>
          {/* X button se modal band hota hai */}
          <button className={styles.closeButton} onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* ── Modal Body ── */}
        <div className={styles.modalBody}>
          
          {/* ── Section 1: Existing Questions List ── */}
          {loading ? (
            /* Loading state: Questions fetch ho rahi hain */
            <p>Loading questions...</p>
          ) : (
            <div className={styles.questionList}>
              {questions.length === 0 ? (
                /* Empty state: Koi question nahi hai abhi */
                <p style={{textAlign: 'center', color: '#94a3b8'}}>No questions added yet.</p>
              ) : (
                /* Questions map karo - har question ka card banao */
                questions.map((q, index) => (
                  <div key={q.id} className={styles.questionCard}>
                    {/* Delete button (trash icon) - question remove karta hai */}
                    <button className={styles.deleteButton} onClick={() => handleDelete(q.id)}>
                      <Trash2 size={16} />
                    </button>
                    
                    {/* Question text aur marks */}
                    <div className={styles.questionText}>
                      {index + 1}. {q.question_text} (Marks: {q.marks})
                    </div>
                    
                    {/* 4 options grid - correct option highlight hoti hai */}
                    <div className={styles.optionsGrid}>
                      {/* 
                        Har option ke liye check: agar yeh sahi answer hai to correctOption class lagao.
                        CSS mein correctOption class green background/border add karta hai.
                      */}
                      <div className={`${styles.optionItem} ${q.correct_option === 'A' ? styles.correctOption : ''}`}>A) {q.option_a}</div>
                      <div className={`${styles.optionItem} ${q.correct_option === 'B' ? styles.correctOption : ''}`}>B) {q.option_b}</div>
                      <div className={`${styles.optionItem} ${q.correct_option === 'C' ? styles.correctOption : ''}`}>C) {q.option_c}</div>
                      <div className={`${styles.optionItem} ${q.correct_option === 'D' ? styles.correctOption : ''}`}>D) {q.option_d}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* ── Section 2: Add New Question Form ── */}
          <div className={styles.addForm}>
            <h3>Add New Question</h3>
            
            {/* 
              onSubmit={handleAddQuestion}: Form submit hone par handler call hoga.
              required: HTML5 validation - fields khali nahi chhod sakte
            */}
            <form onSubmit={handleAddQuestion}>
              
              {/* Question Text Textarea */}
              <div className={styles.formGroup}>
                <label>Question Text</label>
                <textarea 
                  required 
                  rows="3"
                  value={form.question_text}
                  onChange={e => setForm({...form, question_text: e.target.value})} // Sirf question_text update karo, baaki sab same rakho
                  placeholder="Enter the question here..."
                ></textarea>
              </div>
              
              {/* 4 Options Input Fields (2x2 grid layout) */}
              <div className={styles.optionsGrid} style={{marginBottom: '1rem'}}>
                
                {/* Option A */}
                <div className={styles.formGroup}>
                  <label>Option A</label>
                  <input required type="text" value={form.option_a} onChange={e => setForm({...form, option_a: e.target.value})} />
                </div>
                
                {/* Option B */}
                <div className={styles.formGroup}>
                  <label>Option B</label>
                  <input required type="text" value={form.option_b} onChange={e => setForm({...form, option_b: e.target.value})} />
                </div>
                
                {/* Option C */}
                <div className={styles.formGroup}>
                  <label>Option C</label>
                  <input required type="text" value={form.option_c} onChange={e => setForm({...form, option_c: e.target.value})} />
                </div>
                
                {/* Option D */}
                <div className={styles.formGroup}>
                  <label>Option D</label>
                  <input required type="text" value={form.option_d} onChange={e => setForm({...form, option_d: e.target.value})} />
                </div>
              </div>

              {/* Correct Option Selector + Marks Input */}
              <div className={styles.optionsGrid} style={{marginBottom: '1.5rem'}}>
                
                {/* Correct Option Dropdown: A/B/C/D mein se sahi answer select karo */}
                <div className={styles.formGroup}>
                  <label>Correct Option</label>
                  <select value={form.correct_option} onChange={e => setForm({...form, correct_option: e.target.value})}>
                    <option value="A">A</option>
                    <option value="B">B</option>
                    <option value="C">C</option>
                    <option value="D">D</option>
                  </select>
                </div>
                
                {/* Marks Input: Kitne marks milenge is question ke (min=1) */}
                <div className={styles.formGroup}>
                  <label>Marks</label>
                  <input required type="number" min="1" value={form.marks} onChange={e => setForm({...form, marks: e.target.value})} />
                </div>
              </div>

              {/* 
                Submit Button:
                - isSubmitting=true hone par disabled hota hai (double submit roko)
                - Text dynamically change hota hai ("Add Question" ↔ "Adding...")
              */}
              <button type="submit" className={styles.submitButton} disabled={isSubmitting}>
                <Plus size={20} />
                {isSubmitting ? 'Adding...' : 'Add Question'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
