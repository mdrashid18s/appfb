/**
 * @file ToastContext.jsx
 * @description Global Toast Notification Context & Provider.
 * Provides application-wide alert messages (success, error, info) with auto-dismissal.
 */

import React, { createContext, useContext, useState, useCallback } from 'react';
import styles from './Toast.module.css';

/**
 * React Context instance holding the toast dispatch helper functions.
 */
const ToastContext = createContext(null);

/**
 * ToastProvider component wrapping the app tree.
 * @param {Object} props - Component props containing children elements
 * @returns {JSX.Element} Provider component rendering active toast notifications
 */
export const ToastProvider = ({ children }) => {
  /** Array of active toast objects currently displayed on screen */
  const [toasts, setToasts] = useState([]);

  /**
   * Helper function to enqueue a new toast notification.
   * @param {string} message - Notification text message
   * @param {string} [type='info'] - Toast category ('success', 'error', 'info')
   */
  const addToast = useCallback((message, type = 'info') => {
    const id = Date.now() + Math.random().toString();
    setToasts((prev) => [...prev, { id, message, type }]);
    
    // Automatically remove the notification banner after 3 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, 3000);
  }, []);

  /**
   * Helper API object exposed via context
   */
  const toast = {
    success: (msg) => addToast(msg, 'success'),
    error: (msg) => addToast(msg, 'error'),
    info: (msg) => addToast(msg, 'info'),
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      {/* Floating container holding active toast alert banners */}
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
 * Custom hook to consume the Toast Context inside any component.
 * @returns {{ success: Function, error: Function, info: Function }} Toast helper object
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
