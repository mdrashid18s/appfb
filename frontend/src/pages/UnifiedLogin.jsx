/**
 * @file UnifiedLogin.jsx
 * @description State-of-the-Art Unified Authentication Portal for XL Education.
 * Supports Email OTP authentication for students and secure credential auth for administrators.
 */

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Mail, Lock, User, ArrowRight, ShieldCheck, 
  CheckCircle2, AlertCircle, Sparkles, Building2, 
  GraduationCap, Award, ArrowLeft, RefreshCw, Key
} from 'lucide-react';
import styles from './UnifiedLogin.module.css';

export default function UnifiedLogin() {
  const navigate = useNavigate();

  // step: 1 = Email Input, 2 = OTP Input
  const [step, setStep] = useState(1);
  const [loginType, setLoginType] = useState('student'); // 'student' or 'admin'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  
  // Resend OTP state
  const [countdown, setCountdown] = useState(0);
  const [canResend, setCanResend] = useState(false);

  useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    } else if (step === 2) {
      setCanResend(true);
    }
    return () => clearInterval(timer);
  }, [countdown, step]);

  // Form states
  const [email, setEmail] = useState('');
  const [adminId, setAdminId] = useState('');
  const [adminPassword, setAdminPassword] = useState('');

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const otpRefs = [useRef(), useRef(), useRef(), useRef(), useRef(), useRef()];

  const handleOtpChange = (index, value) => {
    if (isNaN(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.substring(value.length - 1);
    setOtp(newOtp);

    // Auto focus next input
    if (value && index < 5) {
      otpRefs[index + 1].current.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs[index - 1].current.focus();
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').trim();
    if (/^\d{6}$/.test(pastedData)) {
      const digits = pastedData.split('');
      const newOtp = [...otp];
      digits.forEach((digit, i) => {
        if (i < 6) newOtp[i] = digit;
      });
      setOtp(newOtp);
      const nextFocus = Math.min(digits.length, 5);
      if (otpRefs[nextFocus] && otpRefs[nextFocus].current) {
        otpRefs[nextFocus].current.focus();
      }
    }
  };

  // Step 1: Request OTP
  const handleRequestOtp = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);
    try {
      const response = await fetch('/api/login/request-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await response.json();
      
      if (data.success) {
        setMessage('Verification code sent to your email! Please check your inbox.');
        setOtp(['', '', '', '', '', '']);
        setStep(2);
        setCountdown(30);
        setCanResend(false);
      } else {
        setError(data.message || 'Failed to send OTP. Please try again.');
      }
    } catch (err) {
      setError('Server connection error. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP
  const handleResendOtp = async () => {
    if (!canResend || loading) return;
    setError('');
    setMessage('');
    setLoading(true);
    try {
      const response = await fetch('/api/login/request-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await response.json();
      if (data.success) {
        setMessage('A fresh verification code has been sent to your email.');
        setOtp(['', '', '', '', '', '']);
        setCountdown(30);
        setCanResend(false);
      } else {
        setError(data.message || 'Failed to resend OTP.');
      }
    } catch (err) {
      setError('Error resending OTP.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    const enteredOtp = otp.join('');
    if (enteredOtp.length < 6) {
      setError('Please enter the complete 6-digit verification code.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const response = await fetch('/api/login/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ email, otp: enteredOtp })
      });
      const data = await response.json();
      
      if (data.success) {
        localStorage.setItem('studentToken', data.access_token);
        localStorage.setItem('token', data.access_token);
        localStorage.setItem('userRole', 'student');
        localStorage.setItem('user', JSON.stringify(data.user));
        
        if (data.student) {
          localStorage.setItem('student', JSON.stringify(data.student));
        }

        if (data.is_new_user) {
          localStorage.setItem('isNewUser', 'true');
        } else {
          localStorage.removeItem('isNewUser');
        }

        navigate('/student');
      } else {
        setError(data.message || 'Invalid verification code. Please check and try again.');
      }
    } catch (err) {
      setError('Authentication failed. Please verify your internet connection.');
    } finally {
      setLoading(false);
    }
  };

  // Admin Login
  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ login_id: adminId, id: adminId, password: adminPassword })
      });
      const data = await response.json();
      
      if (data.success) {
        const adminObj = data.admin || data.user || { id: adminId, name: 'Admin' };
        const token = data.token || 'admin-session-token-' + Date.now();
        localStorage.setItem('adminToken', token);
        localStorage.setItem('token', token);
        localStorage.setItem('userRole', 'admin');
        localStorage.setItem('admin', JSON.stringify(adminObj));
        localStorage.setItem('adminUser', JSON.stringify(adminObj));
        navigate('/admin/dashboard');
      } else {
        setError(data.message || 'Invalid administrator credentials.');
      }
    } catch (err) {
      setError('Server connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.pageWrapper}>
      <div className={styles.bgGlow1} />
      <div className={styles.bgGlow2} />

      {/* ── 1. MINIMALIST TOP HEADER ──────────────────────────── */}
      <header className={styles.topNav}>
        <div className={styles.brandLogo} onClick={() => navigate('/')}>
          <img src="/logo.svg" alt="XL Education" className={styles.brandLogoImg} />
          <span className={styles.brandText}>XL Education</span>
          <span className={styles.brandBadge}>UK Portal</span>
        </div>

        <button className={styles.navActionBtn} onClick={() => navigate('/')}>
          <ArrowLeft size={14} /> Back to Home
        </button>
      </header>

      {/* ── 2. MAIN CENTERED AUTH CARD ────────────────────────── */}
      <main className={styles.mainContainer}>
        <div className={styles.authCard}>
          
          {/* 🌟 LEFT SHOWCASE PANEL */}
          <div className={styles.leftShowcase}>
            <div>
              <div className={styles.showcaseTopTag}>
                <Sparkles size={14} />
                <span>Premier 11+ &amp; GCSE Tuition</span>
              </div>

              <div className={styles.showcaseContent}>
                <h2>Excellence in Grammar School Preparation</h2>
                <p>
                  Access your interactive learning timetable, online mock tests, progress analytics, and assigned tuition centre schedule.
                </p>

                <div className={styles.statsPillsGrid}>
                  <div className={styles.statPillItem}>
                    <div className={styles.statIconBox}>
                      <Award size={18} />
                    </div>
                    <div>
                      <h4 className={styles.statTitle}>98.4% Success Rate</h4>
                      <p className={styles.statSubtitle}>UK Grammar &amp; Independent School Admissions</p>
                    </div>
                  </div>

                  <div className={styles.statPillItem}>
                    <div className={styles.statIconBox}>
                      <Building2 size={18} />
                    </div>
                    <div>
                      <h4 className={styles.statTitle}>5 Premier Centres</h4>
                      <p className={styles.statSubtitle}>Reading, Slough, Sutton, Basingstoke, Manchester</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className={styles.showcaseFooterNote}>
              <ShieldCheck size={16} color="#10b981" />
              <span>Encrypted Student &amp; Parent Data Protection</span>
            </div>
          </div>

          {/* 📝 RIGHT AUTH FORM SECTION */}
          <div className={styles.rightFormSection}>
            
            {/* Segmented Role Switcher */}
            <div className={styles.roleSwitcherWrap}>
              <button
                type="button"
                className={`${styles.roleSwitchBtn} ${loginType === 'student' ? styles.roleSwitchBtnActive : ''}`}
                onClick={() => { setLoginType('student'); setError(''); setMessage(''); setStep(1); }}
              >
                <GraduationCap size={16} /> Student Portal
              </button>
              <button
                type="button"
                className={`${styles.roleSwitchBtn} ${loginType === 'admin' ? styles.roleSwitchBtnActive : ''}`}
                onClick={() => { setLoginType('admin'); setError(''); setMessage(''); }}
              >
                <ShieldCheck size={16} /> Admin Access
              </button>
            </div>

            {/* Form Header */}
            <div className={styles.formHeader}>
              <h1 className={styles.formTitle}>
                {loginType === 'admin' 
                  ? 'Administrator Login' 
                  : step === 1 
                  ? 'Welcome to XL Education' 
                  : 'Verify Security Code'}
              </h1>
              <p className={styles.formSubtitle}>
                {loginType === 'admin'
                  ? 'Enter your administrative credentials to manage portal data.'
                  : step === 1
                  ? 'Enter your registered email address to receive an instant login code.'
                  : `Enter the 6-digit verification code sent to ${email}`}
              </p>
            </div>

            {/* Alerts */}
            {message && (
              <div className={styles.alertSuccess}>
                <CheckCircle2 size={16} />
                <span>{message}</span>
              </div>
            )}

            {error && (
              <div className={styles.alertError}>
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            {/* 🛡️ ADMIN LOGIN FORM */}
            {loginType === 'admin' && (
              <form onSubmit={handleAdminLogin}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Admin ID / Username</label>
                  <div className={styles.inputWrapper}>
                    <User size={18} className={styles.inputIcon} />
                    <input 
                      type="text" 
                      className={styles.formInput}
                      value={adminId} 
                      onChange={(e) => setAdminId(e.target.value)} 
                      placeholder="e.g. admin" 
                      required 
                    />
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Password</label>
                  <div className={styles.inputWrapper}>
                    <Lock size={18} className={styles.inputIcon} />
                    <input 
                      type="password" 
                      className={styles.formInput}
                      value={adminPassword} 
                      onChange={(e) => setAdminPassword(e.target.value)} 
                      placeholder="••••••••" 
                      required 
                    />
                  </div>
                </div>

                <button 
                  type="submit" 
                  className={styles.submitBtn} 
                  disabled={loading}
                >
                  {loading ? 'Authenticating...' : 'Sign In as Administrator'}
                  <ArrowRight size={16} />
                </button>
              </form>
            )}

            {/* 👨‍🎓 STUDENT STEP 1: REQUEST EMAIL OTP */}
            {loginType === 'student' && step === 1 && (
              <form onSubmit={handleRequestOtp}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Student or Parent Email</label>
                  <div className={styles.inputWrapper}>
                    <Mail size={18} className={styles.inputIcon} />
                    <input 
                      type="email" 
                      name="email" 
                      className={styles.formInput}
                      value={email} 
                      onChange={(e) => setEmail(e.target.value)} 
                      placeholder="name@example.com" 
                      required 
                      autoFocus
                    />
                  </div>
                </div>

                <button 
                  type="submit" 
                  className={styles.submitBtn} 
                  disabled={loading}
                >
                  {loading ? 'Sending Code...' : 'Send Verification Code'}
                  <ArrowRight size={16} />
                </button>

                <div className={styles.registerPromptWrap}>
                  <span>New to XL Education?</span>
                  <a 
                    href="#" 
                    className={styles.registerLink}
                    onClick={(e) => { e.preventDefault(); navigate('/register'); }}
                  >
                    Register for 2026/27 Admission →
                  </a>
                </div>
              </form>
            )}

            {/* 👨‍🎓 STUDENT STEP 2: VERIFY OTP */}
            {loginType === 'student' && step === 2 && (
              <form onSubmit={handleVerifyOtp}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>6-Digit Verification Code</label>
                  
                  <div className={styles.otpBoxGrid}>
                    {otp.map((digit, index) => (
                      <input
                        key={index}
                        ref={otpRefs[index]}
                        type="text"
                        className={styles.otpInputBox}
                        value={digit}
                        onChange={(e) => handleOtpChange(index, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(index, e)}
                        onPaste={handleOtpPaste}
                        maxLength={1}
                        required
                        autoFocus={index === 0}
                      />
                    ))}
                  </div>
                </div>

                <button 
                  type="submit" 
                  className={styles.submitBtn} 
                  disabled={loading}
                >
                  {loading ? 'Verifying & Accessing Portal...' : 'Verify & Enter Portal'}
                  <ArrowRight size={16} />
                </button>

                <div className={styles.subActionsRow}>
                  <button 
                    type="button" 
                    className={styles.textBtn}
                    onClick={() => { setStep(1); setError(''); }}
                  >
                    ← Change Email
                  </button>

                  <button 
                    type="button" 
                    onClick={handleResendOtp}
                    disabled={!canResend || loading}
                    className={`${styles.resendBtn} ${canResend ? styles.resendActive : styles.resendDisabled}`}
                  >
                    {canResend ? 'Resend Code' : `Resend in ${countdown}s`}
                  </button>
                </div>
              </form>
            )}

          </div>
        </div>
      </main>

      {/* ── 3. CLEAN SINGLE-LINE AUTH FOOTER ─────────────────── */}
      <footer className={styles.authFooter}>
        <div>&copy; {new Date().getFullYear()} XL Education Ltd. All rights reserved. Registered UK Tuition Provider.</div>
        <div className={styles.authFooterLinks}>
          <a href="#" onClick={(e) => { e.preventDefault(); navigate('/'); }}>Home</a>
          <a href="#" onClick={(e) => { e.preventDefault(); navigate('/register'); }}>Registration</a>
          <a href="#">Privacy Policy</a>
          <a href="#">Terms of Service</a>
          <a href="#">Security &amp; GDPR</a>
        </div>
      </footer>

    </div>
  );
}
