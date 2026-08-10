import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';

// Page Imports
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import WriteLetter from './pages/WriteLetter';
import Inbox from './pages/Inbox';
import OpenLetter from './pages/OpenLetter';
import Sent from './pages/Sent';
import Profile from './pages/Profile';
import PublicProfile from './pages/PublicProfile';

function AppRoutes() {
  const { user } = useAuth(); // Retrieve current user from Auth Context

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/user/:username" element={<PublicProfile />} />

      {/* Protected Routes */}
      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/inbox" element={<Inbox currentUserId={user?.id} />} />
        <Route path="/write" element={<WriteLetter currentUserId={user?.id} />} />
        <Route path="/sent" element={<Sent currentUserId={user?.id} />} />
        <Route path="/letter/:id" element={<OpenLetter currentUserId={user?.id} />} />
        <Route path="/profile" element={<Profile />} />
      </Route>

      {/* Fallback Catch-All */}
      <Route path="*" element={<Navigate to={user ? "/dashboard" : "/"} replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-paper flex flex-col font-sans">
          <Navbar />
          <main className="flex-1 pb-20">
            <AppRoutes />
          </main>
        </div>
      </Router>
    </AuthProvider>
  );
}