/**
 * @file App.jsx
 * @description Top-Level Application Component & Main Router.
 * Configures all top-level URL routes for Student Login, Student Dashboard,
 * Online Exam Player, and Admin Control Panel with Strict Security Guards.
 */

import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import UnifiedLogin from './pages/UnifiedLogin';
import ExamPlayer from './pages/ExamPlayer';
import StudentDashboard from './pages/StudentDashboard';
import AdminPortal from './pages/AdminPortal';
import NotFound from './pages/NotFound';
import RegistrationPage from './pages/RegistrationPage';
import FacultyDirectory from './pages/FacultyDirectory';
import ProtectedAdminRoute from './components/ProtectedAdminRoute';
import ProtectedStudentRoute from './components/ProtectedStudentRoute';
import Reportcard from './pages/Reportcard';
import './index.css';

/**
 * Main App Component rendering top-level route switches.
 * @returns {JSX.Element} React Router Routes element
 */
function App() {
  return (
    <Routes>
      {/* Official Landing Page with Auto-Sliding Course Carousel */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/home" element={<LandingPage />} />

      {/* Public Authentication & Registration Routes */}
      <Route path="/login" element={<UnifiedLogin />} />
      <Route path="/register" element={<RegistrationPage />} />
      
      {/* Legacy Redirects */}
      <Route path="/login/student" element={<Navigate to="/login" replace />} />
      <Route path="/admin/login" element={<Navigate to="/login" replace />} />
      
      {/* PROTECTED STUDENT ROUTES */}
      <Route element={<ProtectedStudentRoute />}>
        <Route path="/student/*" element={<StudentDashboard />} />
        <Route path="/student/profile" element={<StudentDashboard />} />
        <Route path="/profile" element={<StudentDashboard />} />
        <Route path="/test-player/:testId" element={<ExamPlayer />} />
        <Route path="/student/reportcard" element={<StudentDashboard />} />
      </Route>
      
      {/* PROTECTED ADMIN ROUTES */}
      <Route element={<ProtectedAdminRoute />}>
        <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="/admin/dashboard" element={<AdminPortal />} />
        <Route path="/admin/faculty" element={<FacultyDirectory />} />
      </Route>
      
      {/* Catch-all Fallback: Displays 404 Error Page */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default App;
