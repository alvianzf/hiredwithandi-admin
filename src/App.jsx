import React, { Suspense } from 'react';
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import AdminLayout from "./components/AdminLayout";
import { Toaster } from 'sonner';

// Lazy loaded pages to chunk the bundle size down
const Dashboard = React.lazy(() => import("./pages/Dashboard"));
const MembersMgmt = React.lazy(() => import("./pages/MembersMgmt"));
const MemberView = React.lazy(() => import("./pages/MemberView"));
const Login = React.lazy(() => import("./pages/Login"));
const SuperDashboard = React.lazy(() => import("./pages/SuperDashboard"));
const OrganizationsMgmt = React.lazy(() => import("./pages/OrganizationsMgmt"));
const PlatformUsers = React.lazy(() => import("./pages/PlatformUsers"));
const NotFound = React.lazy(() => import("./pages/NotFound"));

/* eslint-disable react/prop-types */
const ProtectedRoute = ({ children }) => {
  const { admin, loading } = useAuth();
  if (loading) return null; // or a spinner
  if (!admin) return <Navigate to="/login" replace />;
  return children;
};

// Sub-component for conditionally routing the index based on role
const DashboardRouter = () => {
  const { admin } = useAuth();
  return admin?.isSuperadmin ? <SuperDashboard /> : <Dashboard />;
};

function App() {
  const { admin } = useAuth();

  return (
    <>
      <Toaster position="top-right" richColors theme="dark" />
      <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-[var(--bg-color)] text-[var(--text-secondary)]">Loading...</div>}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={
            <ProtectedRoute>
              <AdminLayout />
            </ProtectedRoute>
          }>
            <Route index element={<DashboardRouter />} />
            
            {/* Org Admin Routes */}
            <Route path="members" element={admin?.isSuperadmin ? <Navigate to="/platform-users" replace /> : <MembersMgmt />} />
            <Route path="members/:id" element={<MemberView />} />

            {/* Superadmin Routes */}
            <Route path="organizations" element={admin?.isSuperadmin ? <OrganizationsMgmt /> : <Navigate to="/" replace />} />
            <Route path="platform-users" element={admin?.isSuperadmin ? <PlatformUsers /> : <Navigate to="/" replace />} />
          </Route>
          {/* 404 Catch All */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </>
  );
}

export default App;

