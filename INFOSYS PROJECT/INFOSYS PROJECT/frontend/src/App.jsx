import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate
} from "react-router-dom";

import { Toaster } from "react-hot-toast";

import LandingPage    from "./pages/LandingPage";
import Login          from "./pages/login";
import Register       from "./pages/register";
import ForgotPassword from "./pages/ForgotPassword";
import Dashboard      from "./pages/dashboard";
import Profile        from "./pages/profile";
import OAuthSuccess   from "./pages/OAuthSuccess";
import ReportIssue    from "./pages/reportissue";
import Complaints     from "./pages/Complaints";
import AdminDashboard from "./pages/AdminDashboard";
import AdminUsers     from "./pages/AdminUsers";
import AdminReports   from "./pages/AdminReports";

/* ================= AUTH CHECK ================= */

const RequireAuth = ({ children }) => {

  const token = localStorage.getItem("token");

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return children;
};


/* ================= ADMIN ROUTE ================= */

const AdminRoute = ({ children }) => {

  const token = localStorage.getItem("token");
  const role  = localStorage.getItem("role");

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (role !== "admin") {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};


/* ================= CITIZEN ROUTE ================= */

const CitizenRoute = ({ children }) => {

  const token = localStorage.getItem("token");
  const role  = localStorage.getItem("role");

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (role === "admin") {
    return <Navigate to="/admin" replace />;
  }

  return children;
};


/* ================= AUTH REDIRECT ================= */

const AuthRedirect = ({ children }) => {

  const token = localStorage.getItem("token");
  const role  = localStorage.getItem("role");

  if (!token) return children;

  return role === "admin"
    ? <Navigate to="/admin"     replace />
    : <Navigate to="/dashboard" replace />;
};


/* ================= APP ================= */

function App() {

  return (

    <Router>

      <Toaster position="top-right" />

      <Routes>

        {/* ================= PUBLIC ================= */}

        <Route path="/" element={<LandingPage />} />


        {/* ================= AUTH ================= */}

        <Route
          path="/login"
          element={
            <AuthRedirect>
              <Login />
            </AuthRedirect>
          }
        />

        <Route
          path="/register"
          element={
            <AuthRedirect>
              <Register />
            </AuthRedirect>
          }
        />

        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/oauth-success"   element={<OAuthSuccess />} />


        {/* ================= CITIZEN ================= */}

        <Route
          path="/dashboard"
          element={
            <CitizenRoute>
              <Dashboard />
            </CitizenRoute>
          }
        />

        <Route
          path="/reportissue"
          element={
            <CitizenRoute>
              <ReportIssue />
            </CitizenRoute>
          }
        />


        {/* ================= BOTH ADMIN + CITIZEN ================= */}

        <Route
          path="/complaints"
          element={
            <RequireAuth>
              <Complaints />
            </RequireAuth>
          }
        />


        {/* ================= COMMON AUTH ================= */}

        <Route
          path="/profile"
          element={
            <RequireAuth>
              <Profile />
            </RequireAuth>
          }
        />


        {/* ================= ADMIN ================= */}

        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AdminDashboard />
            </AdminRoute>
          }
        />

        <Route
          path="/admin/users"
          element={
            <AdminRoute>
              <AdminUsers />
            </AdminRoute>
          }
        />

        <Route
          path="/admin/reports"
          element={
            <AdminRoute>
              <AdminReports />
            </AdminRoute>
          }
        />


        {/* ================= FALLBACK ================= */}

        <Route path="*" element={<Navigate to="/" replace />} />

      </Routes>

    </Router>

  );
}

export default App;