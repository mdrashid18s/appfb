/**
 * @file ProtectedAdminRoute.jsx
 * @description Route Security Guard: Admin Control Panel Routes ko unauthorized access se protect karna.
 *
 * Yeh component React Router ke andar ek security wrapper ki tarah kaam karta hai:
 *   1. Check karta hai ki localStorage me `userRole === 'admin'` hai ya nahi.
 *   2. Check karta hai ki valid `adminToken` aur `admin` JSON session data maujood hai ya nahi.
 *   3. Agar user admin logged in nahi hai, toh session data clear karke home page (`/`) par redirect karta hai.
 *   4. Agar session valid hai, toh `<Outlet />` render karta hai taaki Admin Portal aur Faculty Management load ho sakein.
 */

import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

export default function ProtectedAdminRoute() {
  // localStorage se Admin authentication data nikalna
  const userRole = localStorage.getItem('userRole');
  const adminToken = localStorage.getItem('adminToken');
  const adminData = localStorage.getItem('admin');

  // Strict Protection Check: User role admin hona zaroori hai aur admin token maujood hona chahiye
  if (userRole !== 'admin' || !adminToken || !adminData) {
    // Kisi bhi unauthorized user ka data clean karo
    localStorage.clear();
    // Login / Home page par redirect karo
    return <Navigate to="/" replace />;
  }

  // Corrupted JSON parse error safety check
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

  // Validation successful hone par child admin routes load hone do
  return <Outlet />;
}
