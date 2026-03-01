import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../utils/api";

export default function SuperDashboard() {
  const [stats, setStats] = useState({ 
    totalOrgs: 0, 
    totalActiveAdmins: 0, 
    totalPlatformUsers: 0
  });

  useEffect(() => {
    async function fetchStats() {
      try {
        const [orgRes, usersRes] = await Promise.all([
          api.get('/organizations'),
          api.get('/users')
        ]);
        
        const orgs = orgRes.data.data;
        const users = usersRes.data.data;
        
        const admins = users.filter((u) => u.role === 'ADMIN');
        const members = users.filter((u) => u.role === 'MEMBER');

        setStats({
          totalOrgs: orgs.length,
          totalActiveAdmins: admins.length,
          totalPlatformUsers: members.length
        });
      } catch (error) {
        console.error("Failed to load super dashboard stats", error);
      }
    }
    fetchStats();
  }, []);

  return (
    <div className="space-y-6 pb-12">
      <div>
        <h1 className="text-3xl font-bold text-[var(--color-primary-yellow)]">
          System Overview
        </h1>
        <p className="text-[var(--text-secondary)] mt-1">Global HiredWithAndi platform metrics.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
        <div className="glass p-6 rounded-xl flex flex-col justify-center items-center shadow-lg transition-transform hover:scale-105 border-[var(--color-primary-yellow)] border-opacity-50">
          <h3 className="text-xs text-[var(--text-secondary)] font-bold mb-2 uppercase tracking-widest">Active Orgs</h3>
          <p className="text-5xl font-black text-[var(--color-primary-yellow)] text-center">{stats.totalOrgs}</p>
        </div>
        <div className="glass p-6 rounded-xl flex flex-col justify-center items-center shadow-lg transition-transform hover:scale-105">
          <h3 className="text-xs text-[var(--text-secondary)] font-bold mb-2 uppercase tracking-widest">Org Admins</h3>
          <p className="text-5xl font-black text-[var(--text-primary)] text-center">{stats.totalActiveAdmins}</p>
        </div>
        <div className="glass p-6 rounded-xl flex flex-col justify-center items-center shadow-lg transition-transform hover:scale-105 border-white/10 dark:border-white/5">
          <h3 className="text-xs text-[var(--text-secondary)] font-bold mb-2 uppercase tracking-widest">Platform Users</h3>
          <p className="text-5xl font-black text-blue-500 text-center">{stats.totalPlatformUsers}</p>
        </div>
      </div>

      <div className="mt-8 glass p-8 rounded-2xl shadow-sm">
        <h3 className="text-xl font-bold mb-6 text-[var(--text-primary)] border-b border-[var(--border-color)] pb-4">
          Quick Actions
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link to="/organizations" className="p-6 rounded-xl bg-black/5 dark:bg-white/5 hover:bg-[var(--color-primary-yellow)] hover:text-black transition-all group flex flex-col justify-center items-center cursor-pointer border border-transparent hover:border-yellow-400">
            <span className="text-2xl font-bold mb-2 group-hover:scale-110 transition-transform">🏢</span>
            <span className="font-semibold uppercase tracking-wide text-sm">Manage Organizations</span>
          </Link>
          <Link to="/platform-users" className="p-6 rounded-xl bg-black/5 dark:bg-white/5 hover:bg-[var(--color-primary-red)] hover:text-white transition-all group flex flex-col justify-center items-center cursor-pointer border border-transparent hover:border-red-400">
            <span className="text-2xl font-bold mb-2 group-hover:scale-110 transition-transform">🧑‍💻</span>
            <span className="font-semibold uppercase tracking-wide text-sm">Manage All Users</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
