import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../utils/api";

export default function Dashboard() {
  const { admin } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      if (admin && admin.organization) {
        try {
          const res = await api.get(`/organizations/${admin.organization.id}/stats`);
          setStats(res.data.data);
        } catch (error) {
          console.error("Failed to load dashboard stats", error);
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    }
    fetchStats();
  }, [admin]);

  if (loading) return <div className="p-8 text-center text-[var(--text-secondary)]">Loading analytics...</div>;
  if (!stats) return <div className="p-8 text-center text-red-500">Failed to load analytics data.</div>;

  return (
    <div className="space-y-6 pb-12">
      <div>
        <h1 className="text-3xl font-bold text-[var(--color-primary-yellow)]">
          Dashboard
        </h1>
        <p className="text-[var(--text-secondary)] mt-1">Overview of {admin?.organization?.name || "your organization"}&apos;s performance.</p>
      </div>

      {/* Top Value Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-8">
        <div className="glass p-6 rounded-xl flex flex-col justify-center items-center shadow-lg transition-transform hover:scale-105">
          <h3 className="text-base text-[var(--text-secondary)] font-medium mb-2 uppercase tracking-wide">Total Users</h3>
          <p className="text-5xl font-bold text-[var(--text-primary)] text-center">{stats.studentCount || 0}</p>
        </div>
        <div className="glass p-6 rounded-xl flex flex-col justify-center items-center shadow-lg transition-transform hover:scale-105 border-[var(--color-primary-yellow)] border-opacity-50">
          <h3 className="text-base text-[var(--text-secondary)] font-medium mb-2 uppercase tracking-wide">Tracked Jobs</h3>
          <p className="text-5xl font-bold text-[var(--color-primary-yellow)] text-center">{stats.overview?.all || 0}</p>
        </div>
        <div className="glass p-6 rounded-xl flex flex-col justify-center items-center shadow-lg transition-transform hover:scale-105 border-[var(--color-primary-yellow)] border-opacity-50">
          <h3 className="text-base text-[var(--text-secondary)] font-medium mb-2 uppercase tracking-wide">Interview Rate</h3>
          <p className="text-5xl font-bold text-[var(--color-primary-yellow)] text-center">{stats.activityInsights?.interviewRate || '0%'}</p>
        </div>
        <div className="glass p-6 rounded-xl flex flex-col justify-center items-center shadow-lg transition-transform hover:scale-105 border-[var(--color-primary-red)] border-opacity-50">
          <h3 className="text-base text-[var(--text-secondary)] font-medium mb-2 uppercase tracking-wide">Job Offers</h3>
          <p className="text-5xl font-bold text-[var(--color-primary-red)] text-center">{stats.overview?.offered?.count || 0}</p>
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
            <span className="text-4xl font-bold">{stats.overview?.avgDaysInPipeline?.split(' ')[0] || '0'}d</span>
            <span className="text-sm text-[var(--text-secondary)] pb-1">across all stages</span>
          </div>
          
          <div className="space-y-3">
            {stats.averageTimePerStage?.map((stage, i) => (
              <div key={i} className="flex justify-between items-center text-sm">
                <span className="text-[var(--text-secondary)]">{stage.name} <span className="ml-2 font-medium text-white bg-white/10 px-2 py-0.5 rounded-full text-xs">{stage.jobsCount}</span></span>
                <span className="font-bold">{stage.averageDays}</span>
              </div>
            ))}
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
              <span className="text-3xl font-bold text-blue-400">{stats.jobFitPercentage?.median || 'N/A'}</span>
            </div>
            <div className="bg-black/5 dark:bg-white/5 p-4 rounded-xl flex flex-col justify-center items-center">
              <span className="text-[var(--text-secondary)] text-sm mb-1 uppercase tracking-wider font-semibold">Average</span>
              <span className="text-3xl font-bold text-purple-400">{stats.jobFitPercentage?.average || 'N/A'}</span>
            </div>
            <div className="bg-black/5 dark:bg-white/5 p-4 rounded-xl flex flex-col justify-center items-center">
              <span className="text-[var(--text-secondary)] text-sm mb-1 uppercase tracking-wider font-semibold">Lowest</span>
              <span className="text-3xl font-bold text-red-500">{stats.jobFitPercentage?.lowest || 'N/A'}</span>
            </div>
            <div className="bg-black/5 dark:bg-white/5 p-4 rounded-xl flex flex-col justify-center items-center">
              <span className="text-[var(--text-secondary)] text-sm mb-1 uppercase tracking-wider font-semibold">Highest</span>
              <span className="text-3xl font-bold text-green-500">{stats.jobFitPercentage?.highest || 'N/A'}</span>
            </div>
          </div>
          
          <div className="mt-4 text-center text-sm text-[var(--text-secondary)]">
            Based on {stats.jobFitPercentage?.basedOn || 0} aggregate jobs with JFP data
          </div>
        </div>

      </div>
    </div>
  );
}
