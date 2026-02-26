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
    const admins = JSON.parse(localStorage.getItem('hwa_admins') || '[]');
    const foundAdmin = admins.find(a => a.email === email && a.password === password);
    
    if (foundAdmin) {
      const orgs = JSON.parse(localStorage.getItem('hwa_organizations') || '[]');
      const org = orgs.find(o => o.id === foundAdmin.orgId);
      
      const sessionData = { ...foundAdmin, organization: org };
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

  return (
    <AuthContext.Provider value={{ admin, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
