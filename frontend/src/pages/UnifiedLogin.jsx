/**
 * @file UnifiedLogin.jsx
 * @description Unified Authentication Page for both Students and Administrators.
 * Handles Email OTP request, OTP verification, and new Profile Registration.
 */

import React, { useState, useEffect, useRef } from 'react';
import styles from './UnifiedLogin.module.css';
import { useNavigate } from 'react-router-dom';
import '../index.css';

export default function UnifiedLogin() {
  const navigate = useNavigate();

  // step: 1 = Email Input, 2 = OTP Input, 3 = Register Profile
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
  const [mockOtp, setMockOtp] = useState('');
  const otpRefs = [useRef(), useRef(), useRef(), useRef(), useRef(), useRef()];

  // No register form state needed

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
      if(otpRefs[nextFocus] && otpRefs[nextFocus].current) {
         otpRefs[nextFocus].current.focus();
      }
    }
  };

  // Removed handleRegisterChange

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
        setOtp(['', '', '', '', '', '']);
        setMockOtp('');
        setMessage('OTP sent successfully to your email! Please check your inbox (or Spam folder).');
        setStep(2);
        setCountdown(30);
        setCanResend(false);
      } else {
        setError(data.message);
      }
    } catch (err) {
      console.error(err);
      setError('Could not connect to the server.');
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP Logic
  const handleResendOtp = async () => {
    if (!canResend) return;
    
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
        setOtp(['', '', '', '', '', '']);
        setMockOtp('');
        setMessage('OTP resent successfully! Please check your email inbox.');
        setCountdown(30);
        setCanResend(false);
      } else {
        setError(data.message);
      }
    } catch (err) {
      console.error(err);
      setError('Could not connect to the server.');
    } finally {
      setLoading(false);
    }
  };

  // Admin Login Logic
  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);
    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ id: adminId, password: adminPassword })
      });
      const data = await response.json();
      
      if (data.success) {
        localStorage.clear();
        localStorage.setItem('userRole', 'admin');
        localStorage.setItem('adminToken', btoa(JSON.stringify({ role: 'admin', id: data.admin?.id || 'admin', time: Date.now() })));
        localStorage.setItem('admin', JSON.stringify(data.admin));
        navigate('/admin/dashboard');
      } else {
        setError(data.message || 'Invalid admin credentials');
      }
    } catch (err) {
      console.error(err);
      setError('Could not connect to the server.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP and Login
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    const otpString = otp.join('');
    if (otpString.length !== 6) {
      setError('Please enter a valid 6-digit OTP');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/login/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ email, otp: otpString })
      });
      const data = await response.json();
      
      if (data.success) {
        const isNew = data.is_new_user ? 'true' : 'false';
        localStorage.clear();
        
        if (data.access_token) {
          localStorage.setItem('token', data.access_token);
        }
        
        if (isNew === 'true') {
          localStorage.setItem('isNewUser', 'true');
        }

        if (data.user.role === 'admin') {
          localStorage.setItem('userRole', 'admin');
          localStorage.setItem('adminToken', data.access_token || btoa(JSON.stringify({ role: 'admin', time: Date.now() })));
          localStorage.setItem('admin', JSON.stringify(data.user));
          navigate('/admin/dashboard');
        } else {
          localStorage.setItem('userRole', 'student');
          localStorage.setItem('studentToken', data.access_token || btoa(JSON.stringify({ role: 'student', time: Date.now() })));
          localStorage.setItem('student', JSON.stringify(data.student || data.user));
          navigate('/student');
        }
      } else {
        setError(data.message || 'Invalid OTP');
      }

    } catch (err) {
      console.error(err);
      setError('Could not connect to the server.');
    } finally {
      setLoading(false);
    }
  };

  // Removed handleRegister

  return (
    <div className={styles['unified-login-wrapper']}>
      <div className={styles['unified-login-card']}>
        
        <div className={styles['unified-hero-section']}>
          <img src="/student-hero.png" alt="Student Reading" className={styles['hero-img']} />
          <div className={styles['hero-overlay-text']}>
            <h2>Welcome to XL Education</h2>
            <p>Your complete assessment portal</p>
          </div>
        </div>

        <div className={styles['unified-form-section']}>
          <div className={styles['form-brand']}>
            <div className={styles['brand-logo-small']}>XL</div>
            <span>XL Education</span>
          </div>

          <div className={styles['form-header']} style={{ marginBottom: '1rem' }}>
            <h1>
              {loginType === 'admin' ? "Admin Access" : (
                <>
                  {step === 1 && "Sign In"}
                  {step === 2 && "Verify OTP"}
                </>
              )}
            </h1>
            <p>
              {loginType === 'admin' ? "Enter your admin credentials" : (
                <>
                  {step === 1 && "Enter your email to receive an OTP"}
                  {step === 2 && "Enter the 6-digit code sent to your email"}
                </>
              )}
            </p>
          </div>

          <div className={styles['toggle-container']}>
            <div 
              className={`${styles['toggle-btn']} ${loginType === 'student' ? styles['active'] : ''}`}
              onClick={() => { setLoginType('student'); setError(''); setMessage(''); }}
            >
              Student
            </div>
            <div 
              className={`${styles['toggle-btn']} ${loginType === 'admin' ? styles['active'] : ''}`}
              onClick={() => { setLoginType('admin'); setError(''); setMessage(''); }}
            >
              Admin
            </div>
            <div className={`${styles['toggle-slider']} ${loginType === 'admin' ? styles['admin-mode'] : ''}`}></div>
          </div>

          {error && <div className={styles['login-error-alert']}>{error}</div>}
          {message && <div className={styles['login-error-alert']} style={{backgroundColor: '#e6ffe6', color: '#006600', borderColor: '#b3ffb3'}}>{message}</div>}

          <div className={styles['forms-area']}>
            {/* ADMIN LOGIN FORM */}
            {loginType === 'admin' && (
              <form onSubmit={handleAdminLogin} className={`${styles['login-form-container']} ${styles['slide-in-left']}`}>
                <div className={styles['input-group']}>
                  <label>Admin ID</label>
                  <input 
                    type="text" 
                    value={adminId} 
                    onChange={(e) => setAdminId(e.target.value)} 
                    placeholder="e.g. rashid" 
                    required 
                  />
                </div>
                <div className={styles['input-group']}>
                  <label>Password</label>
                  <input 
                    type="password" 
                    value={adminPassword} 
                    onChange={(e) => setAdminPassword(e.target.value)} 
                    placeholder="••••••••" 
                    required 
                  />
                </div>
                <button type="submit" className={`${styles['submit-btn']} ${styles['orange-btn']}`} disabled={loading} style={{ marginTop: '1rem' }}>
                  {loading ? 'Logging in...' : 'Login as Admin'}
                </button>
              </form>
            )}

            {/* STEP 1: REQUEST OTP */}
            {loginType === 'student' && step === 1 && (
              <form onSubmit={handleRequestOtp} className={`${styles['login-form-container']} ${styles['slide-in-left']}`}>
                <div className={styles['input-group']}>
                  <label>Email Address</label>
                  <input 
                    type="email" 
                    name="email" 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)} 
                    placeholder="e.g. name@example.com" 
                    required 
                  />
                </div>
                <button type="submit" className={`${styles['submit-btn']} ${styles['orange-btn']}`} disabled={loading} style={{ marginTop: '1rem' }}>
                  {loading ? 'Sending OTP...' : 'Send OTP'}
                </button>
              </form>
            )}

            {/* STEP 2: VERIFY OTP */}
            {loginType === 'student' && step === 2 && (
              <form onSubmit={handleVerifyOtp} className={`${styles['login-form-container']} ${styles['slide-in-left']}`}>
                <div className={styles['input-group']}>
                  <label>OTP Code</label>
                  <div className={styles['otp-container']}>
                    {otp.map((digit, index) => (
                      <input
                        key={index}
                        ref={otpRefs[index]}
                        type="text"
                        className={styles['otp-box']}
                        value={digit}
                        onChange={(e) => handleOtpChange(index, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(index, e)}
                        onPaste={handleOtpPaste}
                        maxLength={1}
                        required
                      />
                    ))}
                  </div>
                  {mockOtp && (
                    <div style={{ marginTop: '0.8rem', padding: '0.5rem 0.8rem', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', color: '#166534', fontSize: '0.85rem', fontWeight: '600', textAlign: 'center' }}>
                      🔑 Your OTP Code: <span style={{ fontSize: '1rem', letterSpacing: '2px', color: '#15803d' }}>{mockOtp}</span> (Auto-filled)
                    </div>
                  )}
                </div>
                <button type="submit" className={`${styles['submit-btn']} ${styles['orange-btn']}`} disabled={loading} style={{ marginTop: '1rem' }}>
                  {loading ? 'Verifying...' : 'Login'}
                </button>
                <div style={{marginTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                  <a href="#" onClick={(e) => { e.preventDefault(); setStep(1); }} style={{color: '#ff6b35', fontSize: '0.9rem', fontWeight: '500'}}>
                    Change Email
                  </a>
                  
                  <button 
                    type="button" 
                    onClick={handleResendOtp}
                    disabled={!canResend || loading}
                    style={{
                      background: 'none', 
                      border: 'none', 
                      color: canResend ? '#ea580c' : '#94a3b8', 
                      fontSize: '0.9rem',
                      fontWeight: '600',
                      cursor: canResend ? 'pointer' : 'not-allowed',
                      textDecoration: canResend ? 'underline' : 'none'
                    }}
                  >
                    {canResend ? 'Resend OTP' : `Resend in ${countdown}s`}
                  </button>
                </div>
              </form>
            )}

          </div>
          {/* Signup prompt removed since auto-registration via OTP is active */}
        </div>
      </div>

      <div className={styles['unified-footer']}>
        © 2026 All rights reserved <strong>educationpro</strong>
      </div>
    </div>
  );
}
