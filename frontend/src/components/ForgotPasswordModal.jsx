/**
 * @file ForgotPasswordModal.jsx
 * @description Student "Forgot Password" Recovery Flow Modal - 3-Step OTP Process.
 *
 * Yeh component student ko password bhool jane par account access wapas dilata hai.
 * 3-step process hai:
 *   STEP 1: Roll Number enter karo → OTP request bhejo
 *   STEP 2: OTP verify karo (6-digit code)
 *   STEP 3: Naya password set karo
 *
 * Har step ke baad automatically agla step dikhta hai (sequential flow).
 * Error aur success messages har step mein prominently display hote hain.
 *
 * @param {Function} onClose - Modal band karne ka callback function
 */

import React, { useState } from 'react';
import styles from './ForgotPasswordModal.module.css'; // CSS Modules styling

// Icons: X=Close button, KeyRound=Header password icon,
// MailCheck=OTP sent success icon, ShieldCheck=Error icon
import { X, KeyRound, MailCheck, ShieldCheck } from 'lucide-react';

// Global toast notification hook (sirf final success message ke liye)
import { useToast } from '../contexts/ToastContext';

/**
 * ForgotPasswordModal Component
 * State-based step machine:
 *   step=1 → Roll Number form dikhta hai
 *   step=2 → OTP verification form dikhta hai
 *   step=3 → New + Confirm Password form dikhta hai
 */
export default function ForgotPasswordModal({ onClose }) {

  // ─────────────────────────────────────────────
  // STATE VARIABLES
  // ─────────────────────────────────────────────

  /**
   * step: Current step number (1, 2, ya 3).
   * Yeh decide karta hai kaun sa form dikhega.
   * Default 1 se shuru hota hai (Roll Number step).
   */
  const [step, setStep] = useState(1);

  /** toast: Final password reset success message ke liye */
  const toast = useToast();

  /** loading: API call ho rahi ho tab buttons disable aur loading text show hota hai */
  const [loading, setLoading] = useState(false);

  /** error: Error message string - red banner mein display hota hai */
  const [error, setError] = useState('');

  /** successMsg: Success message string - green banner mein display hota hai */
  const [successMsg, setSuccessMsg] = useState('');

  /** rollNo: Step 1 mein student ka entered roll number */
  const [rollNo, setRollNo] = useState('');

  /** otp: Step 2 mein student ka entered 6-digit OTP */
  const [otp, setOtp] = useState('');

  /** newPassword: Step 3 mein student ka naya password */
  const [newPassword, setNewPassword] = useState('');

  /** confirmPassword: Step 3 mein confirmation ke liye doosri baar entered password */
  const [confirmPassword, setConfirmPassword] = useState('');

  // ─────────────────────────────────────────────
  // EVENT HANDLERS (Step by Step)
  // ─────────────────────────────────────────────

  /**
   * handleSendOtp: STEP 1 form submit hone par chalta hai.
   * Student ke roll number par OTP bhejta hai.
   * Endpoint: POST /api/forgot-password/send-otp
   * Body: { identifier: rollNo }
   *
   * Note: Development mein mock_otp response mein aata hai testing ke liye
   * (real production mein yeh display nahi hoga).
   *
   * Success hone par step 2 par move karta hai.
   * @param {React.FormEvent} e - Form submit event
   */
  const handleSendOtp = async (e) => {
    e.preventDefault(); // Page reload rokna
    setError('');        // Purani errors clear karo
    setLoading(true);   // Loading state on

    try {
      const res = await fetch('/api/forgot-password/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ identifier: rollNo }) // Roll number bhejo
      });
      const data = await res.json();
      if (data.success) {
        setStep(2); // Step 2 par jao (OTP verification)
        // Development mein mock OTP dikhao - production mein yeh nahi hoga
        setSuccessMsg('OTP sent successfully!');
      } else {
        setError(data.message || 'Failed to send OTP');
      }
    } catch (err) {
      setError('Connection error'); // Network error
    }
    setLoading(false); // Loading off
  };

  /**
   * handleVerifyOtp: STEP 2 form submit hone par chalta hai.
   * Student ka entered OTP verify karta hai.
   * Endpoint: POST /api/forgot-password/verify-otp
   * Body: { roll_no, otp }
   *
   * Success hone par step 3 par move karta hai (password reset form).
   * @param {React.FormEvent} e - Form submit event
   */
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');        // Purana error clear karo
    setSuccessMsg('');   // Purana success message bhi clear karo
    setLoading(true);

    try {
      const res = await fetch('/api/forgot-password/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ roll_no: rollNo, otp }) // Roll number + entered OTP bhejo
      });
      const data = await res.json();
      if (data.success) {
        setStep(3); // Step 3 par jao (new password form)
        setSuccessMsg('OTP Verified! You can now reset your password.');
      } else {
        setError(data.message || 'Invalid OTP'); // Wrong OTP error
      }
    } catch (err) {
      setError('Connection error');
    }
    setLoading(false);
  };

  /**
   * handleResetPassword: STEP 3 form submit hone par chalta hai.
   * Pehle frontend validation:
   *   - newPassword === confirmPassword (dono same hone chahiye)
   *   - newPassword.length >= 4 (minimum length)
   * Phir backend ko new password bhejta hai.
   * Endpoint: POST /api/forgot-password/reset
   * Body: { roll_no, otp, new_password }
   *
   * Success hone par:
   *   - Toast success message dikhata hai
   *   - 1.5 seconds baad modal band karta hai (user toast padh sake)
   *
   * @param {React.FormEvent} e - Form submit event
   */
  const handleResetPassword = async (e) => {
    e.preventDefault();
    
    // Frontend Validation 1: Dono passwords match kare
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return; // Aage mat jao
    }
    
    // Frontend Validation 2: Minimum 4 characters
    if (newPassword.length < 4) {
      setError('Password must be at least 4 characters');
      return;
    }
    
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/forgot-password/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ 
          roll_no: rollNo,           // Kaun ka account reset ho raha hai
          otp,                       // OTP verify ki proof (backend dobara check karta hai)
          new_password: newPassword  // Naya password
        })
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Password reset successfully! You can now login with your new password.');
        // 1.5 seconds baad modal band karo (user success toast dekh sake)
        setTimeout(() => onClose(), 1500);
      } else {
        setError(data.message || 'Failed to reset password');
      }
    } catch (err) {
      setError('Connection error');
    }
    setLoading(false);
  };

  // ─────────────────────────────────────────────
  // JSX RENDER
  // ─────────────────────────────────────────────

  return (
    /*
      Modal Overlay:
      - onClick={onClose}: Background click karne par modal band hoga
      - style: Fixed positioning, full screen, semi-transparent dark background + blur
      - zIndex: 9999 - sab components ke upar
    */
    <div 
      className={styles['modal-overlay']} 
      onClick={onClose} 
      style={{ zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(4px)', position: 'fixed', inset: 0 }}
    >
      {/*
        Modal Content Card:
        - onClick={e => e.stopPropagation()}: Content click karne par modal BAND NAHI HOGA
          (event overlay tak nahi pahunchega)
        - maxWidth: 420px - compact readable width
      */}
      <div 
        className={styles['modal-content']} 
        onClick={e => e.stopPropagation()} 
        style={{ maxWidth: '420px', width: '90%', borderRadius: '1rem', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', backgroundColor: '#ffffff' }}
      >
        
        {/* ── Modal Header ── */}
        <div className={styles['modal-header']} style={{ padding: '1.5rem', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f8fafc' }}>
          {/* Title: KeyRound icon + "Forgot Password" */}
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', margin: 0, fontSize: '1.25rem', color: '#0f172a', fontWeight: '700' }}>
            {/* Orange rounded icon background */}
            <div style={{ background: '#ffedd5', padding: '0.5rem', borderRadius: '0.5rem', display: 'flex' }}>
              <KeyRound size={20} color="#ea580c" />
            </div>
            Forgot Password
          </h2>
          {/* X button: Modal band karo */}
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: '0.25rem' }}>
            <X size={20} />
          </button>
        </div>

        {/* ── Modal Body ── */}
        <div className={styles['modal-body']} style={{ padding: '2rem' }}>
          
          {/* ── Error Banner ── */}
          {/* Conditional render: error state mein kuch ho tab hi dikhao */}
          {error && (
            <div style={{ backgroundColor: '#fef2f2', color: '#ef4444', padding: '0.75rem 1rem', borderRadius: '0.5rem', fontSize: '0.85rem', marginBottom: '1.25rem', border: '1px solid #fecaca', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ShieldCheck size={16} /> {error} {/* ShieldCheck icon (warning) + error text */}
            </div>
          )}
          
          {/* ── Success Banner ── */}
          {/* Conditional render: success message hone par green banner */}
          {successMsg && (
            <div style={{ backgroundColor: '#f0fdf4', color: '#16a34a', padding: '0.75rem 1rem', borderRadius: '0.5rem', fontSize: '0.85rem', marginBottom: '1.25rem', border: '1px solid #bbf7d0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
               <MailCheck size={16} /> {successMsg} {/* MailCheck icon + success text */}
            </div>
          )}

          {/* ══════════════════════════════════
              STEP 1: Roll Number Form
              ══════════════════════════════════ */}
          {step === 1 && (
            /* slide-in-right: Animation class - form left se right mein slide karta hai */
            <form onSubmit={handleSendOtp} className={styles['slide-in-right']}>
              <p style={{ marginBottom: '1.5rem', color: '#64748b', fontSize: '0.9rem', lineHeight: '1.5' }}>
                Enter your registered <strong>Roll Number</strong> below. We'll send a secure One-Time Password to verify your identity.
              </p>
              
              {/* Roll Number Input */}
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#334155', marginBottom: '0.5rem' }}>Roll Number</label>
                <input 
                  type="text" 
                  value={rollNo} 
                  onChange={e => setRollNo(e.target.value)} // Har keystroke par rollNo state update
                  placeholder="e.g. 20240001" 
                  required 
                  style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1', fontSize: '0.95rem', backgroundColor: '#f8fafc', transition: 'border-color 0.2s', outline: 'none' }}
                  onFocus={e => e.target.style.borderColor = '#ea580c'} // Focus hone par orange border
                  onBlur={e => e.target.style.borderColor = '#cbd5e1'}  // Focus hatne par grey border
                />
              </div>
              
              {/* Submit Button */}
              <button type="submit" className={styles['orange-btn']} disabled={loading} style={{ width: '100%', padding: '0.875rem', borderRadius: '0.5rem', fontSize: '1rem', fontWeight: '600', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}>
                {loading ? 'Sending OTP...' : 'Send OTP securely'}
              </button>
            </form>
          )}

          {/* ══════════════════════════════════
              STEP 2: OTP Verification Form
              ══════════════════════════════════ */}
          {step === 2 && (
            <form onSubmit={handleVerifyOtp} className={styles['slide-in-right']}>
              <p style={{ marginBottom: '1.5rem', color: '#64748b', fontSize: '0.9rem', lineHeight: '1.5' }}>
                We've sent a 6-digit code. Please enter it below to securely access the reset form.
              </p>
              
              {/* OTP Input Field */}
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#334155', marginBottom: '0.5rem', textAlign: 'center' }}>Enter OTP</label>
                <input 
                  type="text" 
                  value={otp} 
                  onChange={e => setOtp(e.target.value)} // Har keystroke par otp state update
                  placeholder="------" 
                  required 
                  maxLength={6}  // Maximum 6 characters (OTP length)
                  style={{ 
                    width: '100%', 
                    padding: '1rem', 
                    borderRadius: '0.5rem', 
                    border: '2px solid #e2e8f0', 
                    fontSize: '1.5rem',          // Bada font - clearly readable
                    letterSpacing: '0.75rem',    // Spacing between digits (PIN style)
                    textAlign: 'center',         // Center aligned
                    backgroundColor: '#f8fafc', 
                    outline: 'none', 
                    transition: 'all 0.2s', 
                    fontWeight: '700', 
                    color: '#0f172a' 
                  }}
                  onFocus={e => { e.target.style.borderColor = '#ea580c'; e.target.style.backgroundColor = '#fff'; }}
                  onBlur={e => { e.target.style.borderColor = '#e2e8f0'; e.target.style.backgroundColor = '#f8fafc'; }}
                />
              </div>
              
              {/* Verify OTP Submit Button */}
              <button type="submit" className={styles['orange-btn']} disabled={loading} style={{ width: '100%', padding: '0.875rem', borderRadius: '0.5rem', fontSize: '1rem', fontWeight: '600' }}>
                {loading ? 'Verifying...' : 'Verify OTP'}
              </button>
            </form>
          )}

          {/* ══════════════════════════════════
              STEP 3: New Password Form
              ══════════════════════════════════ */}
          {step === 3 && (
            <form onSubmit={handleResetPassword} className={styles['slide-in-right']}>
              <p style={{ marginBottom: '1.5rem', color: '#64748b', fontSize: '0.9rem', lineHeight: '1.5' }}>
                Great! Your identity is verified. You can now set a new secure password.
              </p>
              
              {/* New Password Input */}
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#334155', marginBottom: '0.5rem' }}>New Password</label>
                <input 
                  type="password"               // Password type: characters hide hote hain
                  value={newPassword} 
                  onChange={e => setNewPassword(e.target.value)} // Har keystroke par newPassword update
                  placeholder="••••••••" 
                  required 
                  style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1', fontSize: '0.95rem', backgroundColor: '#f8fafc', transition: 'border-color 0.2s', outline: 'none' }}
                  onFocus={e => e.target.style.borderColor = '#ea580c'}
                  onBlur={e => e.target.style.borderColor = '#cbd5e1'}
                />
              </div>
              
              {/* Confirm Password Input */}
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#334155', marginBottom: '0.5rem' }}>Confirm Password</label>
                <input 
                  type="password"               // Password type: characters hide hote hain
                  value={confirmPassword} 
                  onChange={e => setConfirmPassword(e.target.value)} // confirmPassword update
                  placeholder="••••••••" 
                  required 
                  style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1', fontSize: '0.95rem', backgroundColor: '#f8fafc', transition: 'border-color 0.2s', outline: 'none' }}
                  onFocus={e => e.target.style.borderColor = '#ea580c'}
                  onBlur={e => e.target.style.borderColor = '#cbd5e1'}
                />
              </div>
              
              {/* Reset Password Submit Button */}
              <button type="submit" className={styles['orange-btn']} disabled={loading} style={{ width: '100%', padding: '0.875rem', borderRadius: '0.5rem', fontSize: '1rem', fontWeight: '600' }}>
                {loading ? 'Resetting...' : 'Reset Password'}
              </button>
            </form>
          )}

        </div>
      </div>
    </div>
  );
}
