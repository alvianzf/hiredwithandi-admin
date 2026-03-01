import { useState, useEffect } from "react";
import { Outlet, Link, useLocation } from "react-router-dom";
import { FiMenu, FiMoon, FiSun, FiUsers, FiPieChart, FiLogOut, FiBriefcase, FiSettings, FiX, FiCheck, FiEye, FiEyeOff, FiKey } from "react-icons/fi";
import { useAuth } from "../context/AuthContext";
import api from "../utils/api";

export default function AdminLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(true); // Default dark matching learnwithandi
  const location = useLocation();
  const { admin, logout, updateProfile } = useAuth();
  
  // Profile Modal State
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  
  // Password Change State
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordStatus, setPasswordStatus] = useState({ type: '', message: '' });

  // Password Visibility States
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    if (admin) {
      setEditName(admin.name);
      setEditEmail(admin.email);
    }
  }, [admin]);

  useEffect(() => {
    if (!isProfileModalOpen) {
      setIsChangingPassword(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setPasswordStatus({ type: '', message: '' });
      setShowCurrentPassword(false);
      setShowNewPassword(false);
      setShowConfirmPassword(false);
    }
  }, [isProfileModalOpen]);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const navLinks = admin?.isSuperadmin 
    ? [
        { name: "System Overview", path: "/", icon: <FiPieChart size={20} /> },
        { name: "Organizations", path: "/organizations", icon: <FiBriefcase size={20} /> },
        { name: "Platform Users", path: "/platform-users", icon: <FiUsers size={20} /> },
      ]
    : [
        { name: "Dashboard", path: "/", icon: <FiPieChart size={20} /> },
        { name: "Students & Members", path: "/students", icon: <FiUsers size={20} /> },
      ];

  const adminInitials = admin?.name ? admin.name.substring(0, 2).toUpperCase() : "AD";

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setPasswordStatus({ type: 'error', message: 'Passwords do not match' });
      return;
    }
    if (newPassword.length < 6) {
      setPasswordStatus({ type: 'error', message: 'New password must be at least 6 characters' });
      return;
    }

    try {
      setPasswordStatus({ type: 'loading', message: 'Changing password...' });
      await api.post('/auth/change-password', {
        currentPassword,
        newPassword
      });
      setPasswordStatus({ type: 'success', message: 'Password changed successfully!' });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => setIsChangingPassword(false), 2000);
    } catch (err) {
      const msg = err.response?.data?.error?.message || 'Failed to change password';
      setPasswordStatus({ type: 'error', message: msg });
    }
  };

  const handleProfileUpdate = (e) => {
    e.preventDefault();
    if (!editName || !editEmail) return;
    
    updateProfile({ name: editName, email: editEmail });
    setIsProfileModalOpen(false);
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--bg-color)] bg-doodle text-[var(--text-primary)] transition-colors duration-300">
      
      {/* Sidebar */}
      <aside 
        className={`${isSidebarOpen ? 'w-64' : 'w-20'} glass flex flex-col transition-all duration-300 relative z-20`}
      >
        <div className="h-16 flex items-center justify-center border-b border-[var(--border-color)] gap-2 px-4">
          <img src="/lwa-logo.png" alt="LWA" className="h-8 w-8 object-contain" />
          {isSidebarOpen && <span className="font-bold text-xl tracking-tight text-[var(--color-primary-yellow)] truncate">HiredWithAndi</span>}
        </div>

        <nav className="flex-1 overflow-y-auto py-4">
          <ul className="space-y-2 px-3">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.path || (link.path !== '/' && location.pathname.startsWith(link.path));
              return (
                <li key={link.name}>
                  <Link 
                    to={link.path}
                    className={`flex items-center p-3 rounded-lg transition-colors ${
                      isActive 
                        ? 'bg-[var(--color-primary-red)] text-white shadow-md' 
                        : 'hover:bg-black/10 dark:hover:bg-white/10'
                    }`}
                    title={!isSidebarOpen ? link.name : ''}
                  >
                    <span className="flex-shrink-0">{link.icon}</span>
                    {isSidebarOpen && <span className="ml-3 font-medium">{link.name}</span>}
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>

        <div className="p-4 border-t border-[var(--border-color)]">
          <button onClick={logout} className="flex items-center w-full p-2 text-red-500 hover:bg-black/5 dark:hover:bg-white/5 rounded-lg transition-colors">
            <FiLogOut size={20} />
            {isSidebarOpen && <span className="ml-3 font-medium">Logout {admin?.name}</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        
        {/* Header */}
        <header className="h-16 glass flex items-center justify-between px-6 z-10 sticky top-0">
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 rounded-lg hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
          >
            <FiMenu size={24} />
          </button>

          <div className="flex items-center space-x-4">
            <button 
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-2 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-colors text-[var(--color-primary-yellow)]"
            >
              {isDarkMode ? <FiSun size={20} /> : <FiMoon size={20} />}
            </button>
            
            <div className="flex items-center space-x-2 border-l border-[var(--border-color)] pl-4">
              <button 
                onClick={() => setIsProfileModalOpen(true)}
                className="flex items-center gap-2 hover:bg-black/5 dark:hover:bg-white/5 py-1 px-2 rounded-xl transition-colors text-left"
                title="Manage Profile"
              >
                <div className="w-8 h-8 rounded-full bg-[var(--color-primary-red)] flex items-center justify-center text-white font-bold text-sm shadow-md">
                  {adminInitials}
                </div>
                <div className="hidden sm:block">
                  <span className="font-bold text-sm block leading-tight">{admin?.name}</span>
                  <span className="text-xs text-[var(--text-secondary)] block truncate max-w-[120px]">{admin?.organization?.name || 'System Admin'}</span>
                </div>
              </button>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto p-6 bg-transparent">
          <Outlet />
        </main>
      </div>

      {/* Admin Personal Settings Modal */}
      {isProfileModalOpen && (
        <div onClick={() => setIsProfileModalOpen(false)} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in transition-all">
          <div onClick={(e) => e.stopPropagation()} className="glass w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 fade-in duration-200">
            <div className="px-6 py-4 border-b border-[var(--border-color)] flex justify-between items-center bg-black/20 dark:bg-white/5">
              <h3 className="text-xl font-bold text-[var(--text-primary)] flex items-center gap-2"><FiSettings className="text-[var(--color-primary-yellow)]" /> My Profile Settings</h3>
              <button 
                onClick={() => setIsProfileModalOpen(false)}
                className="text-[var(--text-secondary)] hover:text-red-500 transition-colors bg-white/5 p-2 rounded-full"
              >
                <FiX size={20} />
              </button>
            </div>
            
            <form onSubmit={handleProfileUpdate} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-[var(--text-secondary)] mb-2 uppercase tracking-wide">Display Name</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-[var(--border-color)] bg-black/5 dark:bg-white/5 text-[var(--text-primary)] focus:ring-2 focus:ring-[var(--color-primary-yellow)] focus:border-transparent transition-all"
                  placeholder="Your Name"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--text-secondary)] mb-2 uppercase tracking-wide">Email Address</label>
                <input
                  type="email"
                  required
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-[var(--border-color)] bg-black/5 dark:bg-white/5 text-[var(--text-primary)] focus:ring-2 focus:ring-[var(--color-primary-yellow)] focus:border-transparent transition-all"
                  placeholder="your.email@example.com"
                />
              </div>

              <div className="pt-4 border-t border-[var(--border-color)]">
                {!isChangingPassword ? (
                  <button 
                    type="button"
                    onClick={() => setIsChangingPassword(true)}
                    className="text-xs font-bold text-[var(--color-primary-yellow)] hover:underline uppercase tracking-wide flex items-center gap-2"
                  >
                    <FiSettings size={14} /> Change Password
                  </button>
                ) : (
                  <div className="space-y-4 animate-in slide-in-from-top-4 duration-300">
                    <div className="flex justify-between items-center">
                      <h4 className="text-xs font-bold text-[var(--color-primary-yellow)] uppercase tracking-wide">Security Update</h4>
                      <button 
                        type="button"
                        onClick={() => setIsChangingPassword(false)}
                        className="text-xs text-[var(--text-secondary)] hover:text-white"
                      >
                        Cancel
                      </button>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-[var(--text-secondary)] mb-1 uppercase tracking-wide">Current Password</label>
                      <div className="relative">
                        <input
                          type={showCurrentPassword ? "text" : "password"}
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          className="w-full px-3 py-2 rounded-lg border border-[var(--border-color)] bg-black/10 dark:bg-white/5 text-[var(--text-primary)] text-sm focus:ring-2 focus:ring-[var(--color-primary-yellow)] focus:border-transparent transition-all pr-10"
                          placeholder="••••••••"
                        />
                        <button
                          type="button"
                          onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] hover:text-[var(--color-primary-yellow)] transition-colors"
                        >
                          {showCurrentPassword ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-[var(--text-secondary)] mb-1 uppercase tracking-wide">New Password</label>
                        <div className="relative">
                          <input
                            type={showNewPassword ? "text" : "password"}
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className="w-full px-3 py-2 rounded-lg border border-[var(--border-color)] bg-black/10 dark:bg-white/5 text-[var(--text-primary)] text-sm focus:ring-2 focus:ring-[var(--color-primary-yellow)] focus:border-transparent transition-all pr-10"
                            placeholder="••••••••"
                          />
                          <button
                            type="button"
                            onClick={() => setShowNewPassword(!showNewPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] hover:text-[var(--color-primary-yellow)] transition-colors"
                          >
                            {showNewPassword ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                          </button>
                        </div>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-[var(--text-secondary)] mb-1 uppercase tracking-wide">Confirm New</label>
                        <div className="relative">
                          <input
                            type={showConfirmPassword ? "text" : "password"}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="w-full px-3 py-2 rounded-lg border border-[var(--border-color)] bg-black/10 dark:bg-white/5 text-[var(--text-primary)] text-sm focus:ring-2 focus:ring-[var(--color-primary-yellow)] focus:border-transparent transition-all pr-10"
                            placeholder="••••••••"
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] hover:text-[var(--color-primary-yellow)] transition-colors"
                          >
                            {showConfirmPassword ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                          </button>
                        </div>
                      </div>
                    </div>

                    {passwordStatus.message && (
                      <div className={`p-2 rounded-lg text-xs font-medium border ${
                        passwordStatus.type === 'error' ? 'bg-red-500/10 border-red-500/20 text-red-400' : 
                        passwordStatus.type === 'success' ? 'bg-green-500/10 border-green-500/20 text-green-400' :
                        'bg-blue-500/10 border-blue-500/20 text-blue-400'
                      }`}>
                        {passwordStatus.message}
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={handlePasswordChange}
                      disabled={passwordStatus.type === 'loading'}
                      className="w-full py-2.5 rounded-xl font-bold bg-[var(--color-primary-red)] text-white hover:bg-[#c82333] transition-all text-sm disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg"
                    >
                      {passwordStatus.type === 'loading' ? 'Processing...' : <><FiKey /> Update Password Securely</>}
                    </button>
                  </div>
                )}
              </div>

              <div className="pt-6 flex justify-end gap-3 border-t border-[var(--border-color)]">
                <button
                  type="button"
                  onClick={() => setIsProfileModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl font-medium text-[var(--text-secondary)] hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl font-bold bg-[var(--color-primary-yellow)] text-black hover:bg-[#e6a600] flex items-center gap-2 shadow-lg transition-transform hover:scale-105"
                >
                  <FiCheck /> Save Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
