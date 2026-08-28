/**
 * @file ToastContext.jsx
 * @description Global Toast Notification Context & Provider.
 *
 * Yeh Context poori Application me Alert Popups (Success / Error / Info) ko bina kisi
 * external library ke cleanly manage karta hai:
 *   1. `ToastProvider`: Pure app tree ko wrap karta hai aur screen ke upar floating alert banners render karta hai.
 *   2. `addToast`: Naya notification popup add karta hai aur 3 seconds baad auto-dismiss kar deta hai.
 *   3. `useToast()` Hook: Kisi bhi component me `const toast = useToast();` likh kar
 *      `toast.success('Saved!')` ya `toast.error('Failed!')` call karne ki suvidha deta hai.
 */

import React, { createContext, useContext, useState, useCallback } from 'react';
import styles from './Toast.module.css';

/**
 * Global Toast Context instance create kiya gaya hai
 */
const ToastContext = createContext(null);

/**
 * ToastProvider: App ko wrap karne wala component
 * 
 * @param {Object} props - { children }
 * @returns {JSX.Element}
 */
export const ToastProvider = ({ children }) => {
  /** toasts: Screen par active notifications ki list/array */
  const [toasts, setToasts] = useState([]);

  /**
   * addToast: Naya toast banner create karta hai aur 3 second baad auto-remove karta hai
   * 
   * @param {string} message - User ko dikhane wala message text
   * @param {string} type    - 'success' | 'error' | 'info'
   */
  const addToast = useCallback((message, type = 'info') => {
    const id = Date.now() + Math.random().toString();
    setToasts((prev) => [...prev, { id, message, type }]);
    
    // 3 Seconds baad notification banner automatically screen se hat jata hai
    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, 3000);
  }, []);

  /**
   * Global helper functions jo components me use hoti hain
   */
  const toast = {
    success: (msg) => addToast(msg, 'success'),
    error: (msg) => addToast(msg, 'error'),
    info: (msg) => addToast(msg, 'info'),
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      
      {/* Screen par float hone wala Alert Popups Container */}
      <div className={styles.toastContainer}>
        {toasts.map((t) => (
          <div key={t.id} className={`${styles.toast} ${styles[t.type]}`}>
            {t.type === 'success' && '✅ '}
            {t.type === 'error' && '❌ '}
            {t.type === 'info' && 'ℹ️ '}
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

/**
 * useToast: Custom React Hook taaki kisi bhi component me easily alert show kar sakein
 * 
 * Usage:
 *   const toast = useToast();
 *   toast.success("Assignment successful!");
 *   toast.error("Invalid credentials!");
 * 
 * @returns {{ success: Function, error: Function, info: Function }}
 */
export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    return {
      success: (msg) => console.log('Toast success:', msg),
      error: (msg) => console.error('Toast error:', msg),
      info: (msg) => console.log('Toast info:', msg),
    };
  }
  return context;
};
