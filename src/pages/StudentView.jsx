import { useState, useEffect, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { FiArrowLeft, FiDownload } from "react-icons/fi";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";

export default function StudentView() {
  const { id } = useParams();
  const [student, setStudent] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const reportRef = useRef(null);

  useEffect(() => {
    const allStudents = JSON.parse(localStorage.getItem('hwa_students') || '[]');
    const found = allStudents.find(s => s.id === id);
    setStudent(found);
  }, [id]);

  const generatePDF = async () => {
    if (!reportRef.current) return;
    setIsGenerating(true);
    
    try {
      // Small timeout to allow UI update before capture if needed
      await new Promise(r => setTimeout(r, 100));
      
      const canvas = await html2canvas(reportRef.current, {
        scale: 2,
        backgroundColor: document.documentElement.classList.contains('dark') ? '#0f172a' : '#f8fafc',
        windowWidth: reportRef.current.scrollWidth,
        windowHeight: reportRef.current.scrollHeight
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'pica',
        format: [canvas.width, canvas.height] 
      });
      
      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
      pdf.save(`${student?.name || 'Student'}_Report.pdf`);
    } catch (error) {
      console.error("PDF generation failed", error);
    } finally {
      setIsGenerating(false);
    }
  };

  if (!student) {
    return <div className="p-8 text-center text-xl">Loading student data...</div>;
  }

  const initials = student.name ? student.name.substring(0, 2).toUpperCase() : "ST";

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
        
        <button 
          onClick={generatePDF}
          disabled={isGenerating}
          className={`${isGenerating ? 'opacity-50 cursor-not-allowed' : ''} flex items-center space-x-2 bg-[var(--color-primary-yellow)] text-black px-5 py-2.5 rounded-lg font-bold hover:bg-yellow-500 transition-colors shadow-md`}
        >
          <FiDownload size={18} />
          <span>{isGenerating ? "Generating..." : "Download PDF Report"}</span>
        </button>
      </div>

      {/* Wrapping the content we want in the PDF with a div ref */}
      <div ref={reportRef} className="space-y-6 pt-4 pb-8 pl-2 pr-2">
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
              <span className="text-4xl font-bold">0d</span>
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span className="text-[var(--text-secondary)]">Wishlist <span className="ml-2 font-medium text-white bg-white/10 px-2 py-0.5 rounded-full text-xs">1 jobs</span></span>
                <span className="font-bold">0d</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-[var(--text-secondary)]">Applied <span className="ml-2 font-medium text-white bg-white/10 px-2 py-0.5 rounded-full text-xs">0 jobs</span></span>
                <span className="font-bold">0d</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-[var(--text-secondary)]">HR Interview <span className="ml-2 font-medium text-white bg-white/10 px-2 py-0.5 rounded-full text-xs">1 jobs</span></span>
                <span className="font-bold">0d</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-[var(--text-secondary)]">Technical Interview <span className="ml-2 font-medium text-white bg-white/10 px-2 py-0.5 rounded-full text-xs">0 jobs</span></span>
                <span className="font-bold">0d</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-[var(--text-secondary)]">Additional Interview <span className="ml-2 font-medium text-white bg-white/10 px-2 py-0.5 rounded-full text-xs">0 jobs</span></span>
                <span className="font-bold">0d</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-[var(--text-secondary)]">Offered <span className="ml-2 font-medium text-white bg-white/10 px-2 py-0.5 rounded-full text-xs">1 jobs</span></span>
                <span className="font-bold">0d</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-[var(--text-secondary)]">Rejected by Company <span className="ml-2 font-medium text-white bg-white/10 px-2 py-0.5 rounded-full text-xs">0 jobs</span></span>
                <span className="font-bold">0d</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-[var(--text-secondary)]">Rejected by Applicant <span className="ml-2 font-medium text-white bg-white/10 px-2 py-0.5 rounded-full text-xs">0 jobs</span></span>
                <span className="font-bold">0d</span>
              </div>
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
                <span className="text-3xl font-bold text-blue-400">23%</span>
              </div>
              <div className="bg-black/5 dark:bg-white/5 p-4 rounded-xl flex flex-col justify-center items-center">
                <span className="text-[var(--text-secondary)] text-sm mb-1 uppercase tracking-wider font-semibold">Average</span>
                <span className="text-3xl font-bold text-purple-400">45%</span>
              </div>
              <div className="bg-black/5 dark:bg-white/5 p-4 rounded-xl flex flex-col justify-center items-center">
                <span className="text-[var(--text-secondary)] text-sm mb-1 uppercase tracking-wider font-semibold">Lowest</span>
                <span className="text-3xl font-bold text-red-500">22%</span>
              </div>
              <div className="bg-black/5 dark:bg-white/5 p-4 rounded-xl flex flex-col justify-center items-center">
                <span className="text-[var(--text-secondary)] text-sm mb-1 uppercase tracking-wider font-semibold">Highest</span>
                <span className="text-3xl font-bold text-green-500">90%</span>
              </div>
            </div>
            
            <div className="mt-4 text-center text-sm text-[var(--text-secondary)]">
              Based on 3 jobs with JFP data
            </div>
          </div>

        </div>

        {/* --- 2. KANBAN BOARD (Updated Columns) --- */}
        <div className="glass p-6 rounded-2xl min-h-[400px]">
          <h3 className="text-xl font-bold mb-6 border-b border-[var(--border-color)] pb-3 text-[var(--color-primary-yellow)]">
            Job Tracker Pipeline 
          </h3>
          
          <div className="flex overflow-x-auto space-x-6 pb-4 kanban-scroll scrollbar-thin scrollbar-thumb-[var(--border-color)] scrollbar-track-transparent">
            
            <div className="glass bg-black/5 dark:bg-white/5 p-4 rounded-xl border-t-4 border-gray-400 min-w-[300px] flex-shrink-0">
              <h4 className="font-bold flex justify-between items-center mb-4">
                Wishlist <span className="text-xs bg-gray-500 text-white px-2 py-1 rounded-full">1</span>
              </h4>
               <div className="bg-[var(--bg-color)] p-3 rounded-lg border border-[var(--border-color)] shadow-sm">
                  <p className="font-medium">Product Manager</p>
                  <p className="text-xs text-[var(--text-secondary)]">StartupX</p>
                </div>
            </div>

            <div className="glass bg-black/5 dark:bg-white/5 p-4 rounded-xl border-t-4 border-blue-500 min-w-[300px] flex-shrink-0">
              <h4 className="font-bold flex justify-between items-center mb-4">
                Applied <span className="text-xs bg-blue-500 text-white px-2 py-1 rounded-full">0</span>
              </h4>
              <div className="p-4 text-center text-sm text-[var(--text-secondary)] italic">Empty</div>
            </div>

            <div className="glass bg-black/5 dark:bg-white/5 p-4 rounded-xl border-t-4 border-indigo-500 min-w-[300px] flex-shrink-0">
              <h4 className="font-bold flex justify-between items-center mb-4">
                HR Interview <span className="text-xs bg-indigo-500 text-white px-2 py-1 rounded-full">1</span>
              </h4>
               <div className="bg-[var(--bg-color)] p-3 rounded-lg border border-indigo-500/30 shadow-sm">
                  <p className="font-medium">Software Engineer</p>
                  <p className="text-xs text-[var(--text-secondary)]">InnovateTech</p>
                </div>
            </div>

            <div className="glass bg-black/5 dark:bg-white/5 p-4 rounded-xl border-t-4 border-yellow-500 min-w-[300px] flex-shrink-0">
              <h4 className="font-bold flex justify-between items-center mb-4">
                Technical Interview <span className="text-xs bg-yellow-500 text-black px-2 py-1 rounded-full">0</span>
              </h4>
              <div className="p-4 text-center text-sm text-[var(--text-secondary)] italic">Empty</div>
            </div>

            <div className="glass bg-black/5 dark:bg-white/5 p-4 rounded-xl border-t-4 border-orange-500 min-w-[300px] flex-shrink-0">
              <h4 className="font-bold flex justify-between items-center mb-4">
                Additional Interview <span className="text-xs bg-orange-500 text-white px-2 py-1 rounded-full">0</span>
              </h4>
              <div className="p-4 text-center text-sm text-[var(--text-secondary)] italic">Empty</div>
            </div>

            <div className="glass bg-black/5 dark:bg-white/5 p-4 rounded-xl border-t-4 border-green-500 min-w-[300px] flex-shrink-0">
              <h4 className="font-bold flex justify-between items-center mb-4">
                Offered <span className="text-xs bg-green-500 text-white px-2 py-1 rounded-full">1</span>
              </h4>
              <div className="bg-[var(--bg-color)] p-3 rounded-lg border border-green-500/30 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-8 h-8 bg-green-500/20 rounded-bl-full flex items-center justify-center pl-2 pb-2">🎉</div>
                <p className="font-medium">UI Developer</p>
                <p className="text-xs text-[var(--text-secondary)]">DesignStudio</p>
              </div>
            </div>

            <div className="glass bg-black/5 dark:bg-white/5 p-4 rounded-xl border-t-4 border-red-500 min-w-[300px] flex-shrink-0">
              <h4 className="font-bold flex justify-between items-center mb-4">
                Rejected by Company <span className="text-xs bg-red-500 text-white px-2 py-1 rounded-full">0</span>
              </h4>
              <div className="p-4 text-center text-sm text-[var(--text-secondary)] italic">Empty</div>
            </div>

            <div className="glass bg-black/5 dark:bg-white/5 p-4 rounded-xl border-t-4 border-red-900 min-w-[300px] flex-shrink-0">
              <h4 className="font-bold flex justify-between items-center mb-4">
                Rejected by Applicant <span className="text-xs bg-red-900 text-white px-2 py-1 rounded-full">0</span>
              </h4>
              <div className="p-4 text-center text-sm text-[var(--text-secondary)] italic">Empty</div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
