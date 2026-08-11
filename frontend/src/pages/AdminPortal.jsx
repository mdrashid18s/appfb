/**
 * @file AdminPortal.jsx
 * @description Admin Authentication Guard Component.
 * Verifies admin session credentials in localStorage before rendering AdminDashboard.
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminDashboard from './AdminDashboard';

/**
 * AdminPortal wrapper component enforcing authentication guards.
 * @returns {JSX.Element|null} AdminDashboard component or null if unauthenticated
 */
export default function AdminPortal() {
  const navigate = useNavigate();
  
  /** Admin session user object stored in localStorage */
  const [admin, setAdmin] = useState(null);

  /**
   * Effect hook: Verify admin user session on mount.
   */
  useEffect(() => {
    const storedAdmin = localStorage.getItem('admin');
    if (storedAdmin) {
      setAdmin(JSON.parse(storedAdmin));
    } else {
      navigate('/admin/login');
    }
  }, [navigate]);

  /**
   * Clears admin session data and redirects user back to the login page.
   */
  const handleLogout = () => {
    localStorage.clear();
    setAdmin(null);
    navigate('/');
  };


  if (!admin) return null; // Avoid rendering dashboard before auth check completes

  return <AdminDashboard admin={admin} onLogout={handleLogout} />;
}
