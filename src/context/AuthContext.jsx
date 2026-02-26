import { createContext, useContext, useState, useEffect } from "react";

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

  const login = (email, password) => {
    // 1. Try to login as a standard Organizational Admin
    const admins = JSON.parse(localStorage.getItem('hwa_admins') || '[]');
    const foundAdmin = admins.find(a => a.email === email && a.password === password);
    
    if (foundAdmin) {
      const orgs = JSON.parse(localStorage.getItem('hwa_organizations') || '[]');
      const org = orgs.find(o => o.id === foundAdmin.orgId);
      
      const sessionData = { ...foundAdmin, organization: org, isSuperadmin: false };
      setAdmin(sessionData);
      localStorage.setItem('hwa_admin_session', JSON.stringify(sessionData));
      return true;
    }

    // 2. Try to login as a global Superadmin
    const superadmins = JSON.parse(localStorage.getItem('hwa_superadmins') || '[]');
    const foundSuperadmin = superadmins.find(s => s.email === email && s.password === password);

    if (foundSuperadmin) {
      const sessionData = { ...foundSuperadmin, isSuperadmin: true };
      setAdmin(sessionData);
      localStorage.setItem('hwa_admin_session', JSON.stringify(sessionData));
      return true;
    }

    return false;
  };

  const logout = () => {
    setAdmin(null);
    localStorage.removeItem('hwa_admin_session');
  };

  const updateProfile = (updatedFields) => {
    if (!admin) return;
    
    // Update active session locally
    const newSession = { ...admin, ...updatedFields };
    setAdmin(newSession);
    localStorage.setItem('hwa_admin_session', JSON.stringify(newSession));
    
    // Sync with the Mock DB Array
    if (admin.isSuperadmin) {
      const superadmins = JSON.parse(localStorage.getItem('hwa_superadmins') || '[]');
      const updatedList = superadmins.map(s => s.id === admin.id ? { ...s, ...updatedFields } : s);
      localStorage.setItem('hwa_superadmins', JSON.stringify(updatedList));
    } else {
      const admins = JSON.parse(localStorage.getItem('hwa_admins') || '[]');
      const updatedList = admins.map(a => a.id === admin.id ? { ...a, ...updatedFields } : a);
      localStorage.setItem('hwa_admins', JSON.stringify(updatedList));
    }
  };

  return (
    <AuthContext.Provider value={{ admin, login, logout, updateProfile, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
