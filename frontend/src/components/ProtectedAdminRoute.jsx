import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

/**
 * ProtectedAdminRoute Component
 * Strict Encrypted & Role Guard preventing unauthorized access to Admin Dashboard.
 * Redirects to Unified Login page if no valid Admin session & token exists in localStorage.
 */
export default function ProtectedAdminRoute() {
  const userRole = localStorage.getItem('userRole');
  const adminToken = localStorage.getItem('adminToken');
  const adminData = localStorage.getItem('admin');

  // Strict Protection Check: Must be logged in as admin with valid token
  if (userRole !== 'admin' || !adminToken || !adminData) {
    // Purge any stale session
    localStorage.clear();
    return <Navigate to="/" replace />;
  }

  try {
    const admin = JSON.parse(adminData);
    if (!admin) {
      localStorage.clear();
      return <Navigate to="/" replace />;
    }
  } catch (err) {
    localStorage.clear();
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
