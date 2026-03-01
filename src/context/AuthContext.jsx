import { createContext, useContext, useState, useEffect } from "react";
import api from "../utils/api";
import { toast } from "sonner";

/* eslint-disable react/prop-types */

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing session
    const session = localStorage.getItem('hwa_admin_session');
    if (session) {
      setAdmin(JSON.parse(session));
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      const { user, token } = response.data.data;
      
      const sessionData = { 
        ...user, 
        token,
        isSuperadmin: user.role === 'SUPERADMIN',
        organization: user.organization 
      };
      
      setAdmin(sessionData);
      localStorage.setItem('hwa_admin_session', JSON.stringify(sessionData));
      toast.success('Logged in successfully!');
      return true;
    } catch (error) {
      console.error('Login failed:', error);
      toast.error(error.response?.data?.error?.message || 'Login failed');
      return false;
    }
  };

  const logout = () => {
    setAdmin(null);
    localStorage.removeItem('hwa_admin_session');
    toast.info('Logged out');
  };

  const updateProfile = async (updatedFields) => {
    if (!admin) return;
    
    try {
      // NOTE: We'll assume a /profile endpoint exists on the backend
      const response = await api.patch('/profile', updatedFields);
      // Update active session locally
      const newSession = { ...admin, ...response.data.data, token: admin.token };
      setAdmin(newSession);
      localStorage.setItem('hwa_admin_session', JSON.stringify(newSession));
      toast.success('Profile updated successfully');
    } catch (error) {
      console.error('Profile update failed', error);
      toast.error(error.response?.data?.error?.message || 'Failed to update profile');
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ admin, login, logout, updateProfile, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
