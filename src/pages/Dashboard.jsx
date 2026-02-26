import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";

export default function Dashboard() {
  const { admin } = useAuth();
  const [stats, setStats] = useState({ total: 0, active: 0, testOrgs: 0 });

  useEffect(() => {
    if (admin) {
      const allStudents = JSON.parse(localStorage.getItem('hwa_students') || '[]');
      const orgStudents = allStudents.filter(s => s.orgId === admin.orgId);
      
      const active = orgStudents.filter(s => s.status === 'Active').length;
      
      setStats({
        total: orgStudents.length,
        active: active,
        jobOffers: Math.floor(active * 0.2) // Mocked stat
      });
    }
  }, [admin]);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-[var(--color-primary-yellow)]">
        Dashboard
      </h1>
      <p className="text-[var(--text-secondary)]">Overview of your organization&apos;s performance.</p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
        <div className="glass p-6 rounded-xl flex flex-col justify-center items-center shadow-lg hover:scale-105 transition-transform">
          <h3 className="text-base text-[var(--text-secondary)] font-medium mb-2 uppercase tracking-wide">Total Students</h3>
          <p className="text-5xl font-bold text-[var(--text-primary)] text-center">{stats.total}</p>
        </div>
        <div className="glass p-6 rounded-xl flex flex-col justify-center items-center shadow-lg hover:scale-105 transition-transform border-[var(--color-primary-yellow)] border-opacity-50">
          <h3 className="text-base text-[var(--text-secondary)] font-medium mb-2 uppercase tracking-wide">Active Students</h3>
          <p className="text-5xl font-bold text-[var(--color-primary-yellow)] text-center">{stats.active}</p>
        </div>
        <div className="glass p-6 rounded-xl flex flex-col justify-center items-center shadow-lg hover:scale-105 transition-transform border-[var(--color-primary-red)] border-opacity-50">
          <h3 className="text-base text-[var(--text-secondary)] font-medium mb-2 uppercase tracking-wide">Job Offers</h3>
          <p className="text-5xl font-bold text-[var(--color-primary-red)] text-center">{stats.jobOffers}</p>
        </div>
      </div>
    </div>
  );
}

