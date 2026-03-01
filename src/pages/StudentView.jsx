import { useState, useEffect, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { FiArrowLeft, FiDownload } from "react-icons/fi";
import { jsPDF } from "jspdf";
import domtoimage from "dom-to-image-more";
import { toast } from "sonner";
import api from "../utils/api";

export default function StudentView() {
  const { id } = useParams();
  const [student, setStudent] = useState(null);
  const [stats, setStats] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const reportRef = useRef(null);

  useEffect(() => {
    const fetchStudentData = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/students/${id}/dashboard`);
        const { student, stats, jobs } = res.data.data;
        
        setStudent(student);
        setStats(stats);
        setJobs(jobs);
      } catch (error) {
        console.error("Failed to load student dashboard data", error);
      } finally {
        setLoading(false);
      }
    };
    fetchStudentData();
  }, [id]);

  const generatePDF = async () => {
    if (!reportRef.current) return;
    setIsGenerating(true);
    const toastId = toast.loading("Preparing your report...");
    
    try {
      // Small timeout to allow UI update before capture if needed
      await new Promise(r => setTimeout(r, 500));
      
      const width = reportRef.current.scrollWidth;
      const height = reportRef.current.scrollHeight;
      
      // Use domtoimage instead of html2canvas to avoid oklch parsing issues
      const imgData = await domtoimage.toPng(reportRef.current, {
        width,
        height,
        bgcolor: document.documentElement.classList.contains('dark') ? '#0f172a' : '#ffffff',
        style: {
          transform: 'scale(1)',
          transformOrigin: 'top left'
        },
        cacheBust: true
      });
      
      // Calculate dimensions in points (pt)
      // Standard DPI is 96, jsPDF uses 72pt per inch.
      const pdfWidth = width * 0.75;
      const pdfHeight = height * 0.75;
      
      const pdf = new jsPDF({
        orientation: pdfWidth > pdfHeight ? 'l' : 'p',
        unit: 'pt',
        format: [pdfWidth, pdfHeight] 
      });
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`${student?.name || 'Student'}_Report.pdf`);
      toast.success("Report downloaded successfully!", { id: toastId });
    } catch (error) {
      console.error("PDF generation failed", error);
      toast.error("Failed to generate PDF. Please try again.", { id: toastId });
    } finally {
      setIsGenerating(false);
    }
  };

  if (loading && !student) {
    return <div className="p-12 text-center text-xl text-[var(--text-secondary)] flex flex-col items-center justify-center space-y-4">
      <div className="w-12 h-12 border-4 border-[var(--color-primary-yellow)] border-t-transparent rounded-full animate-spin"></div>
      <p className="font-bold tracking-widest uppercase">Fetching Records...</p>
    </div>;
  }

  if (!student) {
    return <div className="p-8 text-center text-xl text-red-500">
      <p>Student not found or access denied.</p>
      <Link to="/students" className="mt-4 inline-block text-[var(--color-primary-yellow)] hover:underline">Return to list</Link>
    </div>;
  }

  const initials = student.name ? student.name.substring(0, 2).toUpperCase() : "ST";
  
  const statsWithDefaults = stats || {
    overview: { avgDaysInPipeline: "0d" },
    averageTimePerStage: [],
    jobFitPercentage: { median: "N/A", average: "N/A", lowest: "N/A", highest: "N/A", basedOn: 0 }
  };

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center space-x-4">
          <Link to="/students" className="p-2 glass rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-colors">
            <FiArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-[var(--color-primary-yellow)]">
              Student Profile
            </h1>
            <p className="text-[var(--text-secondary)] mt-1">Viewing details for {student.name}</p>
          </div>
        </div>
        
        {/* <button 
          onClick={generatePDF}
          disabled={isGenerating}
          className={`${isGenerating ? 'opacity-50 cursor-not-allowed' : ''} flex items-center space-x-2 bg-[var(--color-primary-yellow)] text-black px-5 py-2.5 rounded-lg font-bold hover:bg-yellow-500 transition-colors shadow-md`}
        >
          <FiDownload size={18} />
          <span>{isGenerating ? "Generating..." : "Download PDF Report"}</span>
        </button> */}
      </div>

      {/* Wrapping the content we want in the PDF with a div ref */}
      <div ref={reportRef} data-report-canvas="true" className="space-y-6 pt-4 pb-8 pl-2 pr-2">
        {/* Profile Details */}
        <div className="glass p-6 sm:p-8 rounded-2xl flex flex-col md:flex-row items-center md:items-start space-y-4 md:space-y-0 md:space-x-8 shadow-sm">
          <div className="w-24 h-24 rounded-full bg-[var(--color-primary-red)] flex items-center justify-center text-white text-3xl font-bold shadow-lg flex-shrink-0">
            {initials}
          </div>
          <div className="text-center md:text-left flex-1">
            <h2 className="text-3xl font-bold">{student.name}</h2>
            <p className="text-lg text-[var(--text-secondary)] mt-1">{student.email}</p>
            <div className="mt-4 flex flex-wrap justify-center md:justify-start gap-2">
              <span className={`px-4 py-1.5 rounded-full text-sm font-bold ${
                student.status === 'Active' 
                  ? 'bg-green-500 text-white' 
                  : 'bg-gray-500 text-white'
              }`}>
                {student.status.toUpperCase()}
              </span>
              <span className="px-4 py-1.5 rounded-full text-sm font-medium bg-blue-500 text-white">
                Member ID: {student.id.substring(4, 12)}
              </span>
            </div>
          </div>
        </div>

        {/* --- 1. NEW TOP METRICS: Average Time per Stage & Job Fit --- */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Average Time per Stage */}
          <div className="glass p-6 rounded-2xl shadow-sm">
            <h3 className="text-lg font-bold mb-4 border-b border-[var(--border-color)] pb-2 text-[var(--color-primary-yellow)]">
              Average Time per Stage
            </h3>
            <div className="flex items-end space-x-2 mb-4">
              <span className="text-4xl font-bold">{statsWithDefaults.overview?.avgDaysInPipeline?.split(' ')[0] || '0'}d</span>
              <span className="text-sm text-[var(--text-secondary)] pb-1">avg. pipeline speed</span>
            </div>
            
            <div className="space-y-3">
              {statsWithDefaults.averageTimePerStage?.length > 0 ? statsWithDefaults.averageTimePerStage.map((stage, i) => (
                <div key={i} className="flex justify-between items-center text-sm">
                  <span className="text-[var(--text-secondary)]">{stage.name} <span className="ml-2 font-medium text-white bg-white/10 px-2 py-0.5 rounded-full text-xs">{stage.jobsCount}</span></span>
                  <span className="font-bold">{stage.averageDays}</span>
                </div>
              )) : (
                <div className="text-center py-4 text-xs text-[var(--text-secondary)] italic">No interview stage data available</div>
              )}
            </div>
          </div>

          {/* Job Fit Percentage */}
          <div className="glass p-6 rounded-2xl shadow-sm flex flex-col">
            <h3 className="text-lg font-bold mb-4 border-b border-[var(--border-color)] pb-2 text-[var(--color-primary-yellow)]">
              Job Fit Percentage
            </h3>
            
            <div className="grid grid-cols-2 gap-4 flex-1">
              <div className="bg-black/5 dark:bg-white/5 p-4 rounded-xl flex flex-col justify-center items-center">
                <span className="text-[var(--text-secondary)] text-sm mb-1 uppercase tracking-wider font-semibold">Median</span>
                <span className="text-3xl font-bold text-blue-400">{statsWithDefaults.jobFitPercentage?.median || 'N/A'}</span>
              </div>
              <div className="bg-black/5 dark:bg-white/5 p-4 rounded-xl flex flex-col justify-center items-center">
                <span className="text-[var(--text-secondary)] text-sm mb-1 uppercase tracking-wider font-semibold">Average</span>
                <span className="text-3xl font-bold text-purple-400">{statsWithDefaults.jobFitPercentage?.average || 'N/A'}</span>
              </div>
              <div className="bg-black/5 dark:bg-white/5 p-4 rounded-xl flex flex-col justify-center items-center">
                <span className="text-[var(--text-secondary)] text-sm mb-1 uppercase tracking-wider font-semibold">Lowest</span>
                <span className="text-3xl font-bold text-red-500">{statsWithDefaults.jobFitPercentage?.lowest || 'N/A'}</span>
              </div>
              <div className="bg-black/5 dark:bg-white/5 p-4 rounded-xl flex flex-col justify-center items-center">
                <span className="text-[var(--text-secondary)] text-sm mb-1 uppercase tracking-wider font-semibold">Highest</span>
                <span className="text-3xl font-bold text-green-500">{statsWithDefaults.jobFitPercentage?.highest || 'N/A'}</span>
              </div>
            </div>
            
            <div className="mt-4 text-center text-sm text-[var(--text-secondary)]">
              Based on {statsWithDefaults.jobFitPercentage?.basedOn || 0} jobs with JFP data
            </div>
          </div>

        </div>

        {/* --- 2. KANBAN BOARD (Updated Columns) --- */}
        <div className="glass p-6 rounded-2xl min-h-[400px]">
          <h3 className="text-xl font-bold mb-6 border-b border-[var(--border-color)] pb-3 text-[var(--color-primary-yellow)]">
            Job Tracker Pipeline 
          </h3>
          
          <div className="flex overflow-x-auto space-x-6 pb-4 kanban-scroll scrollbar-thin scrollbar-thumb-[var(--border-color)] scrollbar-track-transparent">
            
            {/* Wishlist */}
            <div className="glass bg-black/5 dark:bg-white/5 p-4 rounded-xl border-t-4 border-gray-400 min-w-[300px] flex-shrink-0">
              <h4 className="font-bold flex justify-between items-center mb-4">
                Wishlist <span className="text-xs bg-gray-500 text-white px-2 py-1 rounded-full">{jobs.filter(j => j.status === 'wishlist').length}</span>
              </h4>
              {jobs.filter(j => j.status === 'wishlist').length === 0 ? (
                <div className="p-4 text-center text-sm text-[var(--text-secondary)] italic">Empty</div>
              ) : (
                jobs.filter(j => j.status === 'wishlist').map(job => (
                  <div key={job.id} className="bg-[var(--bg-color)] p-3 rounded-lg border border-[var(--border-color)] shadow-sm mb-3">
                    <p className="font-medium">{job.position}</p>
                    <p className="text-xs text-[var(--text-secondary)]">{job.company}</p>
                  </div>
                ))
              )}
            </div>

            {/* Applied */}
            <div className="glass bg-black/5 dark:bg-white/5 p-4 rounded-xl border-t-4 border-blue-500 min-w-[300px] flex-shrink-0">
              <h4 className="font-bold flex justify-between items-center mb-4">
                Applied <span className="text-xs bg-blue-500 text-white px-2 py-1 rounded-full">{jobs.filter(j => j.status === 'applied').length}</span>
              </h4>
              {jobs.filter(j => j.status === 'applied').length === 0 ? (
                <div className="p-4 text-center text-sm text-[var(--text-secondary)] italic">Empty</div>
              ) : (
                jobs.filter(j => j.status === 'applied').map(job => (
                  <div key={job.id} className="bg-[var(--bg-color)] p-3 rounded-lg border border-blue-500/30 shadow-sm mb-3">
                    <p className="font-medium">{job.position}</p>
                    <p className="text-xs text-[var(--text-secondary)]">{job.company}</p>
                  </div>
                ))
              )}
            </div>

            {/* HR Interview */}
            <div className="glass bg-black/5 dark:bg-white/5 p-4 rounded-xl border-t-4 border-indigo-500 min-w-[300px] flex-shrink-0">
              <h4 className="font-bold flex justify-between items-center mb-4">
                HR Interview <span className="text-xs bg-indigo-500 text-white px-2 py-1 rounded-full">{jobs.filter(j => j.status === 'hr_interview').length}</span>
              </h4>
              {jobs.filter(j => j.status === 'hr_interview').length === 0 ? (
                <div className="p-4 text-center text-sm text-[var(--text-secondary)] italic">Empty</div>
              ) : (
                jobs.filter(j => j.status === 'hr_interview').map(job => (
                  <div key={job.id} className="bg-[var(--bg-color)] p-3 rounded-lg border border-indigo-500/30 shadow-sm mb-3">
                    <p className="font-medium">{job.position}</p>
                    <p className="text-xs text-[var(--text-secondary)]">{job.company}</p>
                  </div>
                ))
              )}
            </div>

            {/* Technical Interview */}
            <div className="glass bg-black/5 dark:bg-white/5 p-4 rounded-xl border-t-4 border-yellow-500 min-w-[300px] flex-shrink-0">
              <h4 className="font-bold flex justify-between items-center mb-4">
                Technical Interview <span className="text-xs bg-yellow-500 text-black px-2 py-1 rounded-full">{jobs.filter(j => j.status === 'technical_interview').length}</span>
              </h4>
              {jobs.filter(j => j.status === 'technical_interview').length === 0 ? (
                <div className="p-4 text-center text-sm text-[var(--text-secondary)] italic">Empty</div>
              ) : (
                jobs.filter(j => j.status === 'technical_interview').map(job => (
                  <div key={job.id} className="bg-[var(--bg-color)] p-3 rounded-lg border border-yellow-500/30 shadow-sm mb-3">
                    <p className="font-medium">{job.position}</p>
                    <p className="text-xs text-[var(--text-secondary)]">{job.company}</p>
                  </div>
                ))
              )}
            </div>

            {/* Additional Interview */}
            <div className="glass bg-black/5 dark:bg-white/5 p-4 rounded-xl border-t-4 border-orange-500 min-w-[300px] flex-shrink-0">
              <h4 className="font-bold flex justify-between items-center mb-4">
                Additional Interview <span className="text-xs bg-orange-500 text-white px-2 py-1 rounded-full">{jobs.filter(j => j.status === 'additional_interview').length}</span>
              </h4>
              {jobs.filter(j => j.status === 'additional_interview').length === 0 ? (
                <div className="p-4 text-center text-sm text-[var(--text-secondary)] italic">Empty</div>
              ) : (
                jobs.filter(j => j.status === 'additional_interview').map(job => (
                  <div key={job.id} className="bg-[var(--bg-color)] p-3 rounded-lg border border-orange-500/30 shadow-sm mb-3">
                    <p className="font-medium">{job.position}</p>
                    <p className="text-xs text-[var(--text-secondary)]">{job.company}</p>
                  </div>
                ))
              )}
            </div>

            {/* Offered */}
            <div className="glass bg-black/5 dark:bg-white/5 p-4 rounded-xl border-t-4 border-green-500 min-w-[300px] flex-shrink-0">
              <h4 className="font-bold flex justify-between items-center mb-4">
                Offered <span className="text-xs bg-green-500 text-white px-2 py-1 rounded-full">{jobs.filter(j => j.status === 'offered').length}</span>
              </h4>
              {jobs.filter(j => j.status === 'offered').length === 0 ? (
                <div className="p-4 text-center text-sm text-[var(--text-secondary)] italic">Empty</div>
              ) : (
                jobs.filter(j => j.status === 'offered').map(job => (
                  <div key={job.id} className="bg-[var(--bg-color)] p-3 rounded-lg border border-green-500/30 shadow-sm relative overflow-hidden mb-3">
                    <div className="absolute top-0 right-0 w-8 h-8 bg-green-500/20 rounded-bl-full flex items-center justify-center pl-2 pb-2">🎉</div>
                    <p className="font-medium">{job.position}</p>
                    <p className="text-xs text-[var(--text-secondary)]">{job.company}</p>
                  </div>
                ))
              )}
            </div>

            {/* Rejected by Company */}
            <div className="glass bg-black/5 dark:bg-white/5 p-4 rounded-xl border-t-4 border-red-500 min-w-[300px] flex-shrink-0">
              <h4 className="font-bold flex justify-between items-center mb-4">
                Rejected by Company <span className="text-xs bg-red-500 text-white px-2 py-1 rounded-full">{jobs.filter(j => j.status === 'rejected_by_company').length}</span>
              </h4>
              {jobs.filter(j => j.status === 'rejected_by_company').length === 0 ? (
                <div className="p-4 text-center text-sm text-[var(--text-secondary)] italic">Empty</div>
              ) : (
                jobs.filter(j => j.status === 'rejected_by_company').map(job => (
                  <div key={job.id} className="bg-[var(--bg-color)] p-3 rounded-lg border border-red-500/30 shadow-sm mb-3 opacity-75">
                    <p className="font-medium">{job.position}</p>
                    <p className="text-xs text-[var(--text-secondary)]">{job.company}</p>
                  </div>
                ))
              )}
            </div>

            {/* Rejected by Applicant */}
            <div className="glass bg-black/5 dark:bg-white/5 p-4 rounded-xl border-t-4 border-red-900 min-w-[300px] flex-shrink-0">
              <h4 className="font-bold flex justify-between items-center mb-4">
                Rejected by Applicant <span className="text-xs bg-red-900 text-white px-2 py-1 rounded-full">{jobs.filter(j => j.status === 'rejected_by_applicant').length}</span>
              </h4>
              {jobs.filter(j => j.status === 'rejected_by_applicant').length === 0 ? (
                <div className="p-4 text-center text-sm text-[var(--text-secondary)] italic">Empty</div>
              ) : (
                jobs.filter(j => j.status === 'rejected_by_applicant').map(job => (
                  <div key={job.id} className="bg-[var(--bg-color)] p-3 rounded-lg border border-red-900/40 shadow-sm mb-3 opacity-75">
                    <p className="font-medium">{job.position}</p>
                    <p className="text-xs text-[var(--text-secondary)]">{job.company}</p>
                  </div>
                ))
              )}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
