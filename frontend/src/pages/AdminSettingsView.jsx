/**
 * @file AdminSettingsView.jsx
 * @description Admin Profile & Security Settings Control Panel.
 * Supports:
 *   1. Account Profile (Name & Email) updates.
 *   2. Normal Password Change (Requires verifying Old Password).
 *   3. Forgot Password via Email OTP (with stylish 6-Box OTP Inputs).
 */

import React, { useState, useRef } from 'react';
import styles from './AdminSettingsView.module.css';
import { User, Lock, KeyRound, Save, Edit2, X, ShieldCheck, Mail, Send, RotateCcw, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useToast } from '../contexts/ToastContext';

export default function AdminSettingsView({ admin, embedded = true }) {
  const toast = useToast();

  // Edit Mode Toggle States
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isEditingPassword, setIsEditingPassword] = useState(false);

  // Mode: 'normal' (requires old password) OR 'forgot_otp' (reset via email OTP)
  const [passMode, setPassMode] = useState('normal'); 

  // Form States
  const [profileForm, setProfileForm] = useState({
    name: admin?.name || 'Administrator',
    email: admin?.email || 'admin@xleducation.co.uk'
  });

  // Normal Password Change Form
  const [passForm, setPassForm] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // 6-Digit OTP State & Refs for Login-style individual boxes
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const otpRefs = [useRef(), useRef(), useRef(), useRef(), useRef(), useRef()];

  const [otpNewPass, setOtpNewPass] = useState({
    newPassword: '',
    confirmPassword: ''
  });

  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [otpSentMessage, setOtpSentMessage] = useState('');

  // ── OTP 6-Box Handlers ──
  const handleOtpChange = (index, value) => {
    if (isNaN(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.substring(value.length - 1);
    setOtp(newOtp);

    // Auto-focus next input
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

  // 1. Save Profile (Name & Email)
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSavingProfile(true);

    try {
      const res = await fetch('/api/admin/update-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(profileForm)
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Admin Profile updated successfully!');
        setIsEditingProfile(false);
      } else {
        toast.error(data.message || 'Failed to update profile');
      }
    } catch (err) {
      console.error(err);
      toast.error('Network error updating profile');
    }
    setSavingProfile(false);
  };

  // 2. Normal Password Change (With Old Password Check)
  const handleSavePassword = async (e) => {
    e.preventDefault();
    if (!passForm.oldPassword) {
      toast.error('Please enter your current (old) password');
      return;
    }
    if (!passForm.newPassword || passForm.newPassword.length < 4) {
      toast.error('New password must be at least 4 characters');
      return;
    }
    if (passForm.newPassword !== passForm.confirmPassword) {
      toast.error('New password and confirm password do not match');
      return;
    }

    setSavingPassword(true);
    try {
      const res = await fetch('/api/admin/update-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          old_password: passForm.oldPassword,
          new_password: passForm.newPassword
        })
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Security password updated successfully!');
        setPassForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
        setIsEditingPassword(false);
      } else {
        toast.error(data.message || 'Current password incorrect');
      }
    } catch (err) {
      console.error(err);
      toast.error('Network error updating password');
    }
    setSavingPassword(false);
  };

  // 3. Request Forgot Password OTP
  const handleRequestOtp = async () => {
    setSendingOtp(true);
    try {
      const res = await fetch('/api/admin/forgot-password/request-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' }
      });
      const data = await res.json();
      if (data.success) {
        toast.success('6-Digit OTP sent to your admin email!');
        setOtpSentMessage(data.message);
        setOtp(['', '', '', '', '', '']);
        setTimeout(() => {
          if (otpRefs[0]?.current) otpRefs[0].current.focus();
        }, 100);
      } else {
        toast.error(data.message || 'Failed to send OTP');
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to request OTP');
    }
    setSendingOtp(false);
  };

  // 4. Verify OTP and Set New Password
  const handleResetWithOtp = async (e) => {
    e.preventDefault();
    const enteredOtp = otp.join('');
    if (enteredOtp.length !== 6) {
      toast.error('Please enter the complete 6-digit OTP code');
      return;
    }
    if (!otpNewPass.newPassword || otpNewPass.newPassword.length < 4) {
      toast.error('New password must be at least 4 characters');
      return;
    }
    if (otpNewPass.newPassword !== otpNewPass.confirmPassword) {
      toast.error('New password and confirm password do not match');
      return;
    }

    setSavingPassword(true);
    try {
      const res = await fetch('/api/admin/forgot-password/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          otp: enteredOtp,
          new_password: otpNewPass.newPassword
        })
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Password reset successfully with OTP!');
        setOtp(['', '', '', '', '', '']);
        setOtpNewPass({ newPassword: '', confirmPassword: '' });
        setPassMode('normal');
        setOtpSentMessage('');
        setIsEditingPassword(false);
      } else {
        toast.error(data.message || 'Invalid or expired OTP');
      }
    } catch (err) {
      console.error(err);
      toast.error('Error resetting password');
    }
    setSavingPassword(false);
  };

  return (
    <div className={styles.container}>
      <div className={styles.grid}>
        {/* Card 1: Account Profile & Email */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <div className={styles.headerLeft}>
              <User size={20} color="#ea580c" />
              <div>
                <h3>Account Email & Profile</h3>
                <p>Manage your account name and email address</p>
              </div>
            </div>

            <button 
              className={`${styles.editToggleBtn} ${isEditingProfile ? styles.activeEditBtn : ''}`}
              onClick={() => setIsEditingProfile(!isEditingProfile)}
              title={isEditingProfile ? 'Cancel Editing' : 'Edit Profile'}
            >
              {isEditingProfile ? <X size={16} /> : <Edit2 size={16} />}
              <span>{isEditingProfile ? 'Cancel' : 'Edit'}</span>
            </button>
          </div>

          <form onSubmit={handleSaveProfile} className={styles.cardBody}>
            <div className={styles.formGroup}>
              <label>ADMINISTRATOR NAME</label>
              <input 
                type="text" 
                value={profileForm.name}
                onChange={e => setProfileForm({ ...profileForm, name: e.target.value })}
                disabled={!isEditingProfile}
                className={!isEditingProfile ? styles.lockedInput : styles.activeInput}
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label>ACCOUNT EMAIL ADDRESS</label>
              <input 
                type="email" 
                value={profileForm.email}
                onChange={e => setProfileForm({ ...profileForm, email: e.target.value })}
                disabled={!isEditingProfile}
                className={!isEditingProfile ? styles.lockedInput : styles.activeInput}
                required
              />
            </div>

            {isEditingProfile && (
              <button type="submit" className={styles.saveBtn} disabled={savingProfile}>
                <Save size={16} /> {savingProfile ? 'Saving Changes...' : 'Save Profile'}
              </button>
            )}
          </form>
        </div>

        {/* Card 2: Security Password & OTP Reset */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <div className={styles.headerLeft}>
              <Lock size={20} color="#ea580c" />
              <div>
                <h3>Security Password</h3>
                <p>{passMode === 'normal' ? 'Change password with old password verification' : 'Reset password using 6-digit Email OTP'}</p>
              </div>
            </div>

            <button 
              className={`${styles.editToggleBtn} ${isEditingPassword ? styles.activeEditBtn : ''}`}
              onClick={() => {
                setIsEditingPassword(!isEditingPassword);
                setPassMode('normal');
                setOtpSentMessage('');
              }}
              title={isEditingPassword ? 'Cancel Editing' : 'Edit Password'}
            >
              {isEditingPassword ? <X size={16} /> : <Edit2 size={16} />}
              <span>{isEditingPassword ? 'Cancel' : 'Change Password'}</span>
            </button>
          </div>

          <div className={styles.cardBody}>
            {!isEditingPassword ? (
              <div className={styles.lockedStateBox}>
                <ShieldCheck size={28} color="#10b981" />
                <div>
                  <h4 className={styles.lockedTitle}>Password Protected</h4>
                  <p className={styles.lockedSub}>Click the Change Password button above to update or reset.</p>
                </div>
              </div>
            ) : (
              <>
                {/* ── MODE 1: NORMAL PASSWORD UPDATE (WITH OLD PASSWORD) ── */}
                {passMode === 'normal' && (
                  <form onSubmit={handleSavePassword} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <div className={styles.formGroup}>
                      <label>CURRENT (OLD) PASSWORD *</label>
                      <input 
                        type="password" 
                        placeholder="Enter your current password"
                        value={passForm.oldPassword}
                        onChange={e => setPassForm({ ...passForm, oldPassword: e.target.value })}
                        className={styles.activeInput}
                        required
                      />
                    </div>

                    <div className={styles.formGroup}>
                      <label>NEW PASSWORD *</label>
                      <input 
                        type="password" 
                        placeholder="Enter new password (min 4 chars)"
                        value={passForm.newPassword}
                        onChange={e => setPassForm({ ...passForm, newPassword: e.target.value })}
                        className={styles.activeInput}
                        required
                      />
                    </div>

                    <div className={styles.formGroup}>
                      <label>CONFIRM NEW PASSWORD *</label>
                      <input 
                        type="password" 
                        placeholder="Re-enter new password"
                        value={passForm.confirmPassword}
                        onChange={e => setPassForm({ ...passForm, confirmPassword: e.target.value })}
                        className={styles.activeInput}
                        required
                      />
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', marginTop: '4px' }}>
                      <button 
                        type="button" 
                        onClick={() => {
                          setPassMode('forgot_otp');
                          handleRequestOtp();
                        }}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#ea580c',
                          fontSize: '0.82rem',
                          fontWeight: '700',
                          cursor: 'pointer',
                          textDecoration: 'underline',
                          padding: 0
                        }}
                      >
                        Forgot Old Password? Reset with OTP
                      </button>

                      <button type="submit" className={styles.saveBtn} disabled={savingPassword}>
                        <KeyRound size={16} /> {savingPassword ? 'Verifying & Updating...' : 'Update Password'}
                      </button>
                    </div>
                  </form>
                )}

                {/* ── MODE 2: FORGOT PASSWORD VIA 6-BOX LOGIN-STYLE EMAIL OTP ── */}
                {passMode === 'forgot_otp' && (
                  <form onSubmit={handleResetWithOtp} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <div style={{
                      padding: '12px 14px',
                      background: '#fff7ed',
                      border: '1px solid #fed7aa',
                      borderRadius: '10px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      fontSize: '0.84rem',
                      color: '#c2410c'
                    }}>
                      <Mail size={18} color="#ea580c" />
                      <div>
                        <strong>Email OTP Verification</strong>
                        <div style={{ fontSize: '0.78rem', color: '#9a3412' }}>
                          {otpSentMessage || `OTP code has been sent to ${profileForm.email}`}
                        </div>
                      </div>
                    </div>

                    {/* 6-Box Login-Style Grid */}
                    <div className={styles.formGroup}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                        <label>6-DIGIT EMAIL OTP *</label>
                        <button 
                          type="button" 
                          onClick={handleRequestOtp} 
                          disabled={sendingOtp}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#0284c7',
                            fontSize: '0.78rem',
                            fontWeight: '700',
                            cursor: 'pointer',
                            padding: 0
                          }}
                        >
                          {sendingOtp ? 'Sending...' : 'Resend OTP'}
                        </button>
                      </div>

                      <div className={styles.otpBoxGrid}>
                        {otp.map((digit, index) => (
                          <input
                            key={index}
                            ref={otpRefs[index]}
                            type="text"
                            inputMode="numeric"
                            maxLength={1}
                            value={digit}
                            className={styles.otpInputBox}
                            onChange={(e) => handleOtpChange(index, e.target.value)}
                            onKeyDown={(e) => handleOtpKeyDown(index, e)}
                            onPaste={handleOtpPaste}
                            required
                          />
                        ))}
                      </div>
                    </div>

                    <div className={styles.formGroup}>
                      <label>NEW PASSWORD *</label>
                      <input 
                        type="password" 
                        placeholder="Enter new password (min 4 chars)"
                        value={otpNewPass.newPassword}
                        onChange={e => setOtpNewPass({ ...otpNewPass, newPassword: e.target.value })}
                        className={styles.activeInput}
                        required
                      />
                    </div>

                    <div className={styles.formGroup}>
                      <label>CONFIRM NEW PASSWORD *</label>
                      <input 
                        type="password" 
                        placeholder="Re-enter new password"
                        value={otpNewPass.confirmPassword}
                        onChange={e => setOtpNewPass({ ...otpNewPass, confirmPassword: e.target.value })}
                        className={styles.activeInput}
                        required
                      />
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', marginTop: '4px' }}>
                      <button 
                        type="button" 
                        onClick={() => setPassMode('normal')}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#64748b',
                          fontSize: '0.82rem',
                          fontWeight: '600',
                          cursor: 'pointer',
                          padding: 0
                        }}
                      >
                        ← Back to Normal Password Change
                      </button>

                      <button type="submit" className={styles.saveBtn} disabled={savingPassword}>
                        <KeyRound size={16} /> {savingPassword ? 'Resetting Password...' : 'Verify OTP & Reset'}
                      </button>
                    </div>
                  </form>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
