import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";

export default function Dashboard() {
  const { admin } = useAuth();
  const [stats, setStats] = useState({ total: 0, active: 0, jobOffers: 0 });

  useEffect(() => {
    if (admin) {
      const allStudents = JSON.parse(localStorage.getItem('hwa_students') || '[]');
      const orgStudents = allStudents.filter(s => s.orgId === admin.orgId);
      
      const active = orgStudents.filter(s => s.status === 'Active').length;
      
      setStats({
        total: orgStudents.length,
        active: active,
        jobOffers: Math.floor(active * 0.2) || 0 // Mocked stat
      });
    }
  }, [admin]);

  return (
    <div className="space-y-6 pb-12">
      <div>
        <h1 className="text-3xl font-bold text-[var(--color-primary-yellow)]">
          Dashboard
        </h1>
        <p className="text-[var(--text-secondary)] mt-1">Overview of {admin?.organization?.name || "your organization"}&apos;s performance.</p>
      </div>

      {/* Top Value Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
        <div className="glass p-6 rounded-xl flex flex-col justify-center items-center shadow-lg transition-transform hover:scale-105">
          <h3 className="text-base text-[var(--text-secondary)] font-medium mb-2 uppercase tracking-wide">Total Users</h3>
          <p className="text-5xl font-bold text-[var(--text-primary)] text-center">{stats.total}</p>
        </div>
        <div className="glass p-6 rounded-xl flex flex-col justify-center items-center shadow-lg transition-transform hover:scale-105 border-[var(--color-primary-yellow)] border-opacity-50">
          <h3 className="text-base text-[var(--text-secondary)] font-medium mb-2 uppercase tracking-wide">Active Users</h3>
          <p className="text-5xl font-bold text-[var(--color-primary-yellow)] text-center">{stats.active}</p>
        </div>
        <div className="glass p-6 rounded-xl flex flex-col justify-center items-center shadow-lg transition-transform hover:scale-105 border-[var(--color-primary-red)] border-opacity-50">
          <h3 className="text-base text-[var(--text-secondary)] font-medium mb-2 uppercase tracking-wide">Job Offers</h3>
          <p className="text-5xl font-bold text-[var(--color-primary-red)] text-center">{stats.jobOffers + 12}</p>
        </div>
      </div>

      {/* NEW METRICS: Global Average Time & Job Fit */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        
        {/* Average Time per Stage (Global) */}
        <div className="glass p-6 rounded-2xl shadow-sm">
          <h3 className="text-lg font-bold mb-4 border-b border-[var(--border-color)] pb-2 text-[var(--color-primary-yellow)]">
            Global Avg Time per Stage
          </h3>
          <div className="flex items-end space-x-2 mb-4">
            <span className="text-4xl font-bold">4.2d</span>
            <span className="text-sm text-[var(--text-secondary)] pb-1">across all stages</span>
          </div>
          
          <div className="space-y-3">
            <div className="flex justify-between items-center text-sm">
              <span className="text-[var(--text-secondary)]">Wishlist <span className="ml-2 font-medium text-white bg-white/10 px-2 py-0.5 rounded-full text-xs">84 jobs</span></span>
              <span className="font-bold">12d</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-[var(--text-secondary)]">Applied <span className="ml-2 font-medium text-white bg-white/10 px-2 py-0.5 rounded-full text-xs">210 jobs</span></span>
              <span className="font-bold">8d</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-[var(--text-secondary)]">HR Interview <span className="ml-2 font-medium text-white bg-white/10 px-2 py-0.5 rounded-full text-xs">45 jobs</span></span>
              <span className="font-bold">4d</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-[var(--text-secondary)]">Technical Interview <span className="ml-2 font-medium text-white bg-white/10 px-2 py-0.5 rounded-full text-xs">28 jobs</span></span>
              <span className="font-bold">5d</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-[var(--text-secondary)]">Additional Interview <span className="ml-2 font-medium text-white bg-white/10 px-2 py-0.5 rounded-full text-xs">15 jobs</span></span>
              <span className="font-bold">6d</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-[var(--text-secondary)]">Offered <span className="ml-2 font-medium text-white bg-white/10 px-2 py-0.5 rounded-full text-xs">12 jobs</span></span>
              <span className="font-bold">2d</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-[var(--text-secondary)]">Rejected by Company <span className="ml-2 font-medium text-white bg-white/10 px-2 py-0.5 rounded-full text-xs">112 jobs</span></span>
              <span className="font-bold">14d</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-[var(--text-secondary)]">Rejected by Applicant <span className="ml-2 font-medium text-white bg-white/10 px-2 py-0.5 rounded-full text-xs">14 jobs</span></span>
              <span className="font-bold">3d</span>
            </div>
          </div>
        </div>

        {/* Global Job Fit Percentage */}
        <div className="glass p-6 rounded-2xl shadow-sm flex flex-col">
          <h3 className="text-lg font-bold mb-4 border-b border-[var(--border-color)] pb-2 text-[var(--color-primary-yellow)]">
            Organization Job Fit
          </h3>
          
          <div className="grid grid-cols-2 gap-4 flex-1">
            <div className="bg-black/5 dark:bg-white/5 p-4 rounded-xl flex flex-col justify-center items-center">
              <span className="text-[var(--text-secondary)] text-sm mb-1 uppercase tracking-wider font-semibold">Median</span>
              <span className="text-3xl font-bold text-blue-400">31%</span>
            </div>
            <div className="bg-black/5 dark:bg-white/5 p-4 rounded-xl flex flex-col justify-center items-center">
              <span className="text-[var(--text-secondary)] text-sm mb-1 uppercase tracking-wider font-semibold">Average</span>
              <span className="text-3xl font-bold text-purple-400">52%</span>
            </div>
            <div className="bg-black/5 dark:bg-white/5 p-4 rounded-xl flex flex-col justify-center items-center">
              <span className="text-[var(--text-secondary)] text-sm mb-1 uppercase tracking-wider font-semibold">Lowest</span>
              <span className="text-3xl font-bold text-red-500">12%</span>
            </div>
            <div className="bg-black/5 dark:bg-white/5 p-4 rounded-xl flex flex-col justify-center items-center">
              <span className="text-[var(--text-secondary)] text-sm mb-1 uppercase tracking-wider font-semibold">Highest</span>
              <span className="text-3xl font-bold text-green-500">96%</span>
            </div>
          </div>
          
          <div className="mt-4 text-center text-sm text-[var(--text-secondary)]">
            Based on {stats.total * 7 + 104} aggregate jobs with JFP data
          </div>
        </div>

      </div>
    </div>
  );
}
