/**
 * @file AdminSettingsView.jsx
 * @description Admin Profile & Security Settings Control Panel with Edit Icons & Backend API integration.
 * Fields are locked by default with Pencil edit icons. Clicking the edit icon unlocks fields and shows Save buttons.
 */

import React, { useState } from 'react';
import styles from './AdminSettingsView.module.css';
import { User, Lock, KeyRound, Save, Edit2, Check, X, ShieldCheck, Mail } from 'lucide-react';
import { useToast } from '../contexts/ToastContext';

export default function AdminSettingsView({ admin, embedded = true }) {
  const toast = useToast();

  // Edit Mode Toggle States
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isEditingPassword, setIsEditingPassword] = useState(false);

  // Form States
  const [profileForm, setProfileForm] = useState({
    name: admin?.name || 'Administrator',
    email: admin?.email || 'rashid@example.com'
  });

  const [passForm, setPassForm] = useState({
    newPassword: '',
    confirmPassword: ''
  });

  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

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

  const handleSavePassword = async (e) => {
    e.preventDefault();
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
        body: JSON.stringify({ new_password: passForm.newPassword })
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Security password updated!');
        setPassForm({ newPassword: '', confirmPassword: '' });
        setIsEditingPassword(false);
      } else {
        toast.error(data.message || 'Failed to update password');
      }
    } catch (err) {
      console.error(err);
      toast.error('Network error updating password');
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

        {/* Card 2: Security Password */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <div className={styles.headerLeft}>
              <Lock size={20} color="#ea580c" />
              <div>
                <h3>Security Password</h3>
                <p>Change your admin account login password</p>
              </div>
            </div>

            <button 
              className={`${styles.editToggleBtn} ${isEditingPassword ? styles.activeEditBtn : ''}`}
              onClick={() => setIsEditingPassword(!isEditingPassword)}
              title={isEditingPassword ? 'Cancel Editing' : 'Edit Password'}
            >
              {isEditingPassword ? <X size={16} /> : <Edit2 size={16} />}
              <span>{isEditingPassword ? 'Cancel' : 'Edit'}</span>
            </button>
          </div>

          <form onSubmit={handleSavePassword} className={styles.cardBody}>
            {!isEditingPassword ? (
              <div className={styles.lockedStateBox}>
                <ShieldCheck size={28} color="#10b981" />
                <div>
                  <h4 className={styles.lockedTitle}>Password Protected</h4>
                  <p className={styles.lockedSub}>Click the Edit icon above to change your password.</p>
                </div>
              </div>
            ) : (
              <>
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

                <button type="submit" className={styles.saveBtn} disabled={savingPassword}>
                  <KeyRound size={16} /> {savingPassword ? 'Updating Password...' : 'Save Password'}
                </button>
              </>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
