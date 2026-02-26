import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import AdminLayout from "./components/AdminLayout";
import Dashboard from "./pages/Dashboard";
import StudentsMgmt from "./pages/StudentsMgmt";
import StudentView from "./pages/StudentView";
import Login from "./pages/Login";

/* eslint-disable react/prop-types */
const ProtectedRoute = ({ children }) => {
  const { admin, loading } = useAuth();
  if (loading) return null; // or a spinner
  if (!admin) return <Navigate to="/login" replace />;
  return children;
};

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={
        <ProtectedRoute>
          <AdminLayout />
        </ProtectedRoute>
      }>
        <Route index element={<Dashboard />} />
        <Route path="students" element={<StudentsMgmt />} />
        <Route path="students/:id" element={<StudentView />} />
      </Route>
    </Routes>
  );
}

export default App;

