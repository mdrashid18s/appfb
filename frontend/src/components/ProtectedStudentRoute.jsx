/**
 * @file ProtectedStudentRoute.jsx
 * @description Route Security Guard: Student Portal Routes ko unauthorized access se protect karna.
 *
 * Yeh component React Router ke andar ek security wrapper ki tarah kaam karta hai:
 *   1. Check karta hai ki localStorage me `userRole === 'student'` hai ya nahi.
 *   2. Check karta hai ki valid `studentToken` aur `student` JSON data maujood hai ya nahi.
 *   3. Agar student logged-in nahi hai ya token invalid/corrupted hai, toh localStorage clear karke home page (`/`) par redirect kar deta hai.
 *   4. Agar session valid hai, toh `<Outlet />` render karta hai taaki student dashboard/pages access ho sakein.
 */

import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

export default function ProtectedStudentRoute() {
  // localStorage se authentication data nikalna
  const userRole = localStorage.getItem('userRole');
  const studentToken = localStorage.getItem('studentToken');
  const studentData = localStorage.getItem('student');

  // Strict Security Check: Role student hona chahiye aur student session data hona zaroori hai
  if (userRole !== 'student' || (!studentToken && !studentData) || !studentData) {
    // Purane stale data ko clean karo
    localStorage.clear();
    // Unauthorized user ko Home / Login page par redirect karo
    return <Navigate to="/" replace />;
  }

  // Corrupted JSON parse error safety check
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

  // Validation successful hone par child routes (Student pages) load hone do
  return <Outlet />;
}
