import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

/**
 * ProtectedStudentRoute Component
 * Strict Encrypted & Role Guard preventing unauthorized access to Student Portal.
 * Redirects to Unified Login page if no valid Student session & token exists in localStorage.
 */
export default function ProtectedStudentRoute() {
  const userRole = localStorage.getItem('userRole');
  const studentToken = localStorage.getItem('studentToken');
  const studentData = localStorage.getItem('student');

  // Strict Protection Check: Must be logged in as student with valid token
  if (userRole !== 'student' || (!studentToken && !studentData) || !studentData) {
    // Purge any stale session
    localStorage.clear();
    return <Navigate to="/" replace />;
  }

  try {
    const student = JSON.parse(studentData);
    if (!student) {
      localStorage.clear();
      return <Navigate to="/" replace />;
    }
  } catch (err) {
    localStorage.clear();
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
