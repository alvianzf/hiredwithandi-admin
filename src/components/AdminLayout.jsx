import { useState, useEffect } from "react";
import { Outlet, Link, useLocation } from "react-router-dom";
import { FiMenu, FiMoon, FiSun, FiUsers, FiPieChart, FiLogOut } from "react-icons/fi";
import { useAuth } from "../context/AuthContext";

export default function AdminLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(true); // Default dark matching learnwithandi
  const location = useLocation();
  const { admin, logout } = useAuth();

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const navLinks = [
    { name: "Dashboard", path: "/", icon: <FiPieChart size={20} /> },
    { name: "Students & Members", path: "/students", icon: <FiUsers size={20} /> },
  ];

  const adminInitials = admin?.name ? admin.name.substring(0, 2).toUpperCase() : "AD";

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--bg-color)] text-[var(--text-primary)] transition-colors duration-300">
      
      {/* Sidebar */}
      <aside 
        className={`${isSidebarOpen ? 'w-64' : 'w-20'} glass flex flex-col transition-all duration-300 relative z-20`}
      >
        <div className="h-16 flex items-center justify-center border-b border-[var(--border-color)]">
          <span className="font-bold text-xl tracking-tight text-[var(--color-primary-yellow)] truncate px-4">
            {isSidebarOpen ? "HiredWithAndi" : "HWA"}
          </span>
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
              <div className="w-8 h-8 rounded-full bg-[var(--color-primary-red)] flex items-center justify-center text-white font-bold text-sm shadow-md">
                {adminInitials}
              </div>
              <span className="font-medium hidden sm:block truncate max-w-[150px]">{admin?.organization?.name}</span>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto p-6 bg-transparent">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
