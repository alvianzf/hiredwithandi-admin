import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import AdminLayout from "./components/AdminLayout";
import Dashboard from "./pages/Dashboard";
import MembersMgmt from "./pages/MembersMgmt";
import MemberView from "./pages/MemberView";
import Login from "./pages/Login";
import SuperDashboard from "./pages/SuperDashboard";
import OrganizationsMgmt from "./pages/OrganizationsMgmt";
import PlatformUsers from "./pages/PlatformUsers";

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

import NotFound from "./pages/NotFound";
import { Toaster } from 'sonner';

function App() {
  const { admin } = useAuth();

  return (
    <>
      <Toaster position="top-right" richColors theme="dark" />
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
    </>
  );
}

export default App;

