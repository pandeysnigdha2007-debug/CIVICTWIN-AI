import React, { useState, useEffect } from "react";
import { CivicReport, NeighborhoodHealthScore, Insight } from "./types";
import MapWidget from "./components/MapWidget";
import ReportForm from "./components/ReportForm";
import StatsPanel from "./components/StatsPanel";
import PredictiveIntelligence from "./components/PredictiveIntelligence";
import AIChatbot from "./components/AIChatbot";
import { 
  Building2, 
  User, 
  Plus, 
  Clock, 
  MapPin, 
  Activity, 
  FileText, 
  Sparkles, 
  ChevronRight, 
  CheckCircle, 
  Wrench, 
  AlertTriangle,
  Flame,
  Search,
  Filter,
  BarChart2,
  Trash2,
  ShieldCheck,
  Droplet
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export default function App() {
  const [role, setRole] = useState<"Citizen" | "Admin">("Citizen");
  const [reports, setReports] = useState<CivicReport[]>([]);
  const [healthScore, setHealthScore] = useState<NeighborhoodHealthScore | null>(null);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filtering states
  const [selectedWardFilter, setSelectedWardFilter] = useState("all");
  const [selectedSeverityFilter, setSelectedSeverityFilter] = useState("all");
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  // Admin Sorting and Pagination States
  const [adminSortField, setAdminSortField] = useState<"createdAt" | "severity" | "status" | "title" | "ward">("createdAt");
  const [adminSortOrder, setAdminSortOrder] = useState<"asc" | "desc">("desc");
  const [adminCurrentPage, setAdminCurrentPage] = useState(1);
  const adminItemsPerPage = 5;

  // UI States
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const [showSubmissionSuccess, setShowSubmissionSuccess] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Clock Update
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch initial dashboard data
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [repRes, healthRes, insRes] = await Promise.all([
        fetch("/api/reports"),
        fetch("/api/health-score"),
        fetch("/api/insights")
      ]);

      if (repRes.ok && healthRes.ok && insRes.ok) {
        const repData = await repRes.json();
        const healthData = await healthRes.json();
        const insData = await insRes.json();
        setReports(repData);
        setHealthScore(healthData);
        setInsights(insData);
      }
    } catch (error) {
      console.error("Failed to load full-stack dashboard data", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Triggered when citizen files a new report
  const handleNewReportSubmitted = (newReport: CivicReport) => {
    setShowSubmissionSuccess(true);
    setTimeout(() => setShowSubmissionSuccess(false), 4000);
    
    // Refresh all data dynamically from DB so charts & scores are synchronous
    fetchDashboardData();
  };

  // Triggered when admin updates ticket status
  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/reports/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus })
      });
      if (response.ok) {
        // Dynamic re-fetch updates charts and scores instantly
        fetchDashboardData();
      }
    } catch (e) {
      console.error("Failed to update status", e);
    }
  };

  // Triggered when admin toggles ticket urgency
  const handleToggleUrgent = async (id: string, isUrgent: boolean) => {
    try {
      const response = await fetch(`/api/reports/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isUrgent })
      });
      if (response.ok) {
        fetchDashboardData();
      }
    } catch (e) {
      console.error("Failed to toggle urgency", e);
    }
  };

  // Get matching icon for insight cards
  const getInsightIcon = (iconName: string) => {
    switch (iconName) {
      case "Trash2": return <Trash2 className="w-4 h-4 text-orange-400" />;
      case "Activity": return <Activity className="w-4 h-4 text-cyan-400" />;
      case "ShieldAlert": return <AlertTriangle className="w-4 h-4 text-red-400" />;
      case "Droplet": return <Droplet className="w-4 h-4 text-blue-400" />;
      default: return <Activity className="w-4 h-4 text-cyan-400" />;
    }
  };

  // Filtered reports list for UI rendering
  const filteredReportsList = reports.filter(r => {
    const matchesSearch = (r.title || "").toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (r.description || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (r.id || "").toLowerCase().includes(searchTerm.toLowerCase());
    const matchesWard = selectedWardFilter === "all" || r.location?.ward === selectedWardFilter;
    const matchesSeverity = selectedSeverityFilter === "all" || r.severity === selectedSeverityFilter;
    const matchesCategory = selectedCategoryFilter === "all" || (r.category || "").toLowerCase() === selectedCategoryFilter.toLowerCase();
    
    return matchesSearch && matchesWard && matchesSeverity && matchesCategory;
  });

  // Admin table sorting weights
  const getSeverityWeight = (sev: string) => {
    switch (sev) {
      case "Critical": return 4;
      case "High": return 3;
      case "Medium": return 2;
      case "Low": return 1;
      default: return 0;
    }
  };

  const getStatusWeight = (st: string) => {
    switch (st) {
      case "Pending": return 3;
      case "In_Progress": return 2;
      case "Resolved": return 1;
      default: return 0;
    }
  };

  // Sort reports for Admin Portal view
  const sortedAdminReports = [...reports].sort((a, b) => {
    let comparison = 0;
    if (adminSortField === "createdAt") {
      comparison = new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
    } else if (adminSortField === "severity") {
      comparison = getSeverityWeight(a.severity) - getSeverityWeight(b.severity);
    } else if (adminSortField === "status") {
      comparison = getStatusWeight(a.status) - getStatusWeight(b.status);
    } else if (adminSortField === "title") {
      comparison = (a.title || "").localeCompare(b.title || "");
    } else if (adminSortField === "ward") {
      comparison = (a.location?.ward || "").localeCompare(b.location?.ward || "");
    }
    return adminSortOrder === "desc" ? -comparison : comparison;
  });

  const totalAdminPages = Math.ceil(sortedAdminReports.length / adminItemsPerPage) || 1;
  const paginatedAdminReports = sortedAdminReports.slice(
    (adminCurrentPage - 1) * adminItemsPerPage,
    adminCurrentPage * adminItemsPerPage
  );

  const selectedReportDetails = reports.find(r => r.id === selectedReportId);

  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 flex flex-col font-sans relative overflow-x-hidden select-none selection:bg-cyan-500 selection:text-slate-950">
      
      {/* Background Neon Gradients */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-500/5 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-10 right-10 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[150px] pointer-events-none"></div>

      {/* Main Grid Header HUD */}
      <header className="border-b border-slate-800 bg-slate-950/60 backdrop-blur-md sticky top-0 z-40 px-6 py-4 flex flex-wrap items-center justify-between gap-4">
        
        {/* Brand details */}
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl shadow-lg shadow-cyan-950/40 border border-cyan-400/20">
            <Building2 className="w-6 h-6 text-slate-950 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-extrabold tracking-wider bg-gradient-to-r from-slate-100 via-cyan-100 to-cyan-400 bg-clip-text text-transparent font-mono uppercase">
                CivicTwin AI
              </h1>
              <span className="text-[10px] font-mono px-2 py-0.5 bg-cyan-950 text-cyan-400 rounded-full border border-cyan-800/40 uppercase tracking-widest animate-pulse">
                MVP Grid
              </span>
            </div>
            <p className="text-[10px] font-mono text-slate-400 tracking-wider uppercase">Hyperlocal Civic Digital Twin Network</p>
          </div>
        </div>

        {/* Live Ticker banner */}
        {healthScore && (
          <div className="hidden xl:flex items-center gap-3 bg-slate-900/60 border border-slate-800 py-1.5 px-4 rounded-xl max-w-xl overflow-hidden font-mono text-[10px]">
            <span className="flex items-center gap-1 text-red-400 font-bold tracking-wider shrink-0 uppercase">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping"></span>
              Live Alert Ticker:
            </span>
            <div className="text-slate-400 truncate">
              Currently tracking {healthScore.activeIssuesCount} active issues. Dynamic Health score sits at {healthScore.score}% ({healthScore.status} status).
            </div>
          </div>
        )}

        {/* UTC Time Clock & Role Switcher */}
        <div className="flex items-center gap-4 ml-auto">
          <div className="hidden sm:flex flex-col items-end font-mono text-[10px] text-slate-400">
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-cyan-400" />
              <span>{currentTime.toLocaleTimeString()}</span>
            </div>
            <span>{currentTime.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}</span>
          </div>

          {/* Role selector Switch */}
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => {
                setRole("Citizen");
                setSelectedReportId(null);
              }}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-mono font-bold rounded-lg uppercase tracking-wide transition cursor-pointer ${
                role === "Citizen" ? "bg-cyan-500 text-slate-950 font-extrabold" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <User className="w-3.5 h-3.5" />
              Citizen Hub
            </button>
            <button
              onClick={() => {
                setRole("Admin");
                setSelectedReportId(null);
              }}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-mono font-bold rounded-lg uppercase tracking-wide transition cursor-pointer ${
                role === "Admin" ? "bg-cyan-500 text-slate-950 font-extrabold" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              Admin Portal
            </button>
          </div>
        </div>

      </header>

      {/* Main Container */}
      <main className="flex-1 p-6 space-y-6 max-w-7xl mx-auto w-full">

        {/* Dynamic Warning Alert on Successful Report */}
        <AnimatePresence>
          {showSubmissionSuccess && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 p-4 rounded-xl flex items-center justify-between font-mono text-xs shadow-lg shadow-emerald-950/20"
            >
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-emerald-400 animate-bounce" />
                <div>
                  <strong className="block text-slate-200 uppercase tracking-wide text-[10px]">REPORT LOGGED SUCCESSFULLY</strong>
                  Gemini has completed visual diagnostics. The digital twin map has updated and re-allocated ward resources.
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ---------------------------------------------------- */}
        {/* CITIZEN VIEW */}
        {/* ---------------------------------------------------- */}
        {role === "Citizen" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left and Middle column: Map & Live Lists */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Grid filters HUD */}
              <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800 p-4 rounded-2xl flex flex-wrap gap-3 items-center">
                <div className="flex items-center gap-1.5 text-slate-400 font-mono text-xs uppercase mr-2">
                  <Filter className="w-3.5 h-3.5 text-cyan-400" />
                  Twin Filters:
                </div>
                
                <select
                  value={selectedWardFilter}
                  onChange={(e) => setSelectedWardFilter(e.target.value)}
                  className="bg-slate-950 border border-slate-800 text-xs font-mono text-slate-300 rounded-lg py-1.5 px-3 focus:outline-none focus:border-cyan-500 transition cursor-pointer"
                >
                  <option value="all">All Wards</option>
                  <option value="Ward 1 (Metro-East)">Ward 1 (Metro-East)</option>
                  <option value="Ward 2 (Lakeview)">Ward 2 (Lakeview)</option>
                  <option value="Ward 3 (Green Hills)">Ward 3 (Green Hills)</option>
                  <option value="Ward 4 (Downtown)">Ward 4 (Downtown)</option>
                </select>

                <select
                  value={selectedSeverityFilter}
                  onChange={(e) => setSelectedSeverityFilter(e.target.value)}
                  className="bg-slate-950 border border-slate-800 text-xs font-mono text-slate-300 rounded-lg py-1.5 px-3 focus:outline-none focus:border-cyan-500 transition cursor-pointer"
                >
                  <option value="all">All Severities</option>
                  <option value="Critical">Critical</option>
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>

                <select
                  value={selectedCategoryFilter}
                  onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                  className="bg-slate-950 border border-slate-800 text-xs font-mono text-slate-300 rounded-lg py-1.5 px-3 focus:outline-none focus:border-cyan-500 transition cursor-pointer"
                >
                  <option value="all">All Categories</option>
                  <option value="damaged roads">damaged roads</option>
                  <option value="pothole">pothole</option>
                  <option value="garbage">garbage</option>
                  <option value="illegal dumping">illegal dumping</option>
                  <option value="flooding">flooding</option>
                  <option value="broken streetlight">broken streetlight</option>
                  <option value="fallen trees">fallen tree</option>
                  <option value="water leakage">water leakage</option>
                  <option value="blocked drains">blocked drains</option>
                  <option value="stray animal issue">stray animal issue</option>
                  <option value="public safety issue">public safety issue</option>
                </select>

                {/* Reset button */}
                {(selectedWardFilter !== "all" || selectedSeverityFilter !== "all" || selectedCategoryFilter !== "all") && (
                  <button
                    onClick={() => {
                      setSelectedWardFilter("all");
                      setSelectedSeverityFilter("all");
                      setSelectedCategoryFilter("all");
                    }}
                    className="text-[10px] font-mono text-cyan-400 hover:text-cyan-300 underline cursor-pointer border-none bg-transparent"
                  >
                    Clear Filters
                  </button>
                )}
              </div>

              {/* Map widget */}
              <div className="h-[460px]">
                <MapWidget
                  reports={reports}
                  selectedReportId={selectedReportId}
                  onSelectReport={(id) => setSelectedReportId(id)}
                  selectedWardFilter={selectedWardFilter}
                  setSelectedWardFilter={setSelectedWardFilter}
                  selectedSeverityFilter={selectedSeverityFilter}
                  setSelectedSeverityFilter={setSelectedSeverityFilter}
                  selectedCategoryFilter={selectedCategoryFilter}
                  setSelectedCategoryFilter={setSelectedCategoryFilter}
                />
              </div>

              {/* Dynamic Health Metric Overview & Insights for Citizen HUD */}
              {healthScore && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Health index card */}
                  <div className="bg-slate-900/60 border border-slate-800/80 p-4 rounded-xl flex items-center justify-between shadow-md">
                    <div className="space-y-1">
                      <span className="text-[9px] font-mono uppercase text-slate-500 block">Health Index</span>
                      <span className="text-3xl font-bold font-mono tracking-tighter text-slate-100">{healthScore.score}%</span>
                    </div>
                    <div className="text-right font-mono text-xs">
                      <span className="text-emerald-400 font-bold block">{healthScore.status}</span>
                      <span className="text-slate-500 block">Twin Quality</span>
                    </div>
                  </div>

                  {/* Active tickets */}
                  <div className="bg-slate-900/60 border border-slate-800/80 p-4 rounded-xl flex items-center justify-between shadow-md">
                    <div className="space-y-1">
                      <span className="text-[9px] font-mono uppercase text-slate-500 block">Pending Clearance</span>
                      <span className="text-3xl font-bold font-mono tracking-tighter text-amber-400">
                        {healthScore.activeIssuesCount}
                      </span>
                    </div>
                    <div className="text-right font-mono text-xs">
                      <span className="text-amber-400 font-bold block">Active</span>
                      <span className="text-slate-500 block">Grid Logs</span>
                    </div>
                  </div>

                  {/* Resolved tickets */}
                  <div className="bg-slate-900/60 border border-slate-800/80 p-4 rounded-xl flex items-center justify-between shadow-md">
                    <div className="space-y-1">
                      <span className="text-[9px] font-mono uppercase text-slate-500 block">Resolved Cases</span>
                      <span className="text-3xl font-bold font-mono tracking-tighter text-emerald-400">
                        {healthScore.resolvedIssuesCount}
                      </span>
                    </div>
                    <div className="text-right font-mono text-xs">
                      <span className="text-emerald-400 font-bold block">Success</span>
                      <span className="text-slate-500 block">Dispatched</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Active list section */}
              <div className="bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/60 pb-3">
                  <div>
                    <h3 className="font-bold text-slate-100 text-sm font-mono tracking-wide">ACTIVE COMMUNITY REPORTS</h3>
                    <p className="text-[10px] font-mono text-slate-500">Live feed of reported issues across San Francisco districts</p>
                  </div>
                  
                  {/* Search */}
                  <div className="relative max-w-xs w-full">
                    <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      placeholder="Search tickets..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 text-xs font-mono text-slate-300 rounded-lg p-2 pl-9 focus:outline-none focus:border-cyan-500 transition"
                    />
                  </div>
                </div>

                {filteredReportsList.length > 0 ? (
                  <div className="space-y-3 max-h-[350px] overflow-y-auto pr-2">
                    {filteredReportsList.map((report) => (
                      <div
                        key={report.id}
                        onClick={() => setSelectedReportId(report.id === selectedReportId ? null : report.id)}
                        className={`p-3.5 rounded-xl border transition cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-3 ${
                          selectedReportId === report.id ? "bg-slate-950 border-cyan-500" : "bg-slate-950/40 border-slate-850 hover:bg-slate-950"
                        }`}
                      >
                        <div className="flex items-start gap-3 min-w-0 flex-1">
                          {/* Left indicator bar based on severity */}
                          <div 
                            className="w-1.5 h-10 shrink-0 rounded"
                            style={{
                              backgroundColor: report.severity === "Critical" ? "#ef4444" : report.severity === "High" ? "#f97316" : report.severity === "Medium" ? "#eab308" : "#10b981"
                            }}
                          ></div>
                          
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                              <span className="font-mono text-[9px] uppercase tracking-wider text-slate-500">{report.id}</span>
                              <span className="font-mono text-[9px] uppercase text-cyan-400 bg-cyan-950 px-1.5 py-0.5 rounded-md border border-cyan-900/30">
                                {report.category}
                              </span>
                              <span className="text-[10px] text-slate-500 font-mono flex items-center gap-1">
                                <MapPin className="w-3 h-3 text-slate-600" />
                                {report.location.ward}
                              </span>
                              {report.isUrgent && (
                                <span className="font-mono text-[11px] font-black uppercase text-red-500 bg-red-950/80 border border-red-500 px-2.5 py-0.5 rounded-md animate-[pulse_1s_infinite] tracking-widest shadow-[0_0_12px_rgba(239,68,68,0.5)] flex items-center gap-1">
                                  🚨 URGENT
                                </span>
                              )}
                            </div>
                            <h4 className="font-bold text-slate-200 text-xs truncate">{report.title}</h4>
                            <p className="text-slate-400 text-[11px] line-clamp-1">{report.description}</p>
                          </div>
                        </div>

                        {/* Status label */}
                        <div className="flex items-center gap-3 shrink-0 font-mono text-[10px] uppercase justify-end">
                          <span className="text-[10px] text-slate-500">
                            {new Date(report.createdAt).toLocaleDateString()}
                          </span>
                          {report.status === "Resolved" ? (
                            <span className="text-emerald-400 bg-emerald-950/40 border border-emerald-900/30 px-2 py-1 rounded font-bold">✓ SOLVED</span>
                          ) : report.status === "In_Progress" ? (
                            <span className="text-blue-400 bg-blue-950/40 border border-blue-900/30 px-2 py-1 rounded font-bold">⚙ REPAIRING</span>
                          ) : (
                            <span className="text-amber-400 bg-amber-950/40 border border-amber-900/30 px-2 py-1 rounded font-bold">● PENDING</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center text-slate-500 font-mono text-xs">No reports found matching your selected twin filters.</div>
                )}
              </div>

            </div>

            {/* Right column: Ticket Form & Sidebar Inspection details */}
            <div className="space-y-6">
              
              {/* Submission panel */}
              <ReportForm onSubmitSuccess={handleNewReportSubmitted} />

              {/* Inspection Details sidebar drawer */}
              <AnimatePresence>
                {selectedReportDetails && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl font-mono text-xs space-y-4"
                  >
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                      <div className="flex items-center gap-2">
                        <span className="text-cyan-400 font-bold uppercase tracking-widest text-[10px]">📋 twin asset file</span>
                        {selectedReportDetails.isUrgent && (
                          <span className="font-mono text-[11px] font-black uppercase text-red-400 animate-[pulse_1s_infinite] tracking-widest">
                            [🚨 URGENT]
                          </span>
                        )}
                      </div>
                      <button 
                        onClick={() => setSelectedReportId(null)}
                        className="text-slate-500 hover:text-slate-300 text-[10px] uppercase font-bold"
                      >
                        [Close]
                      </button>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 text-[9px] text-slate-500 uppercase">
                        <MapPin className="w-3.5 h-3.5 text-slate-600" />
                        <span>Address Coordinates:</span>
                      </div>
                      <p className="text-slate-200 font-sans font-bold leading-tight">{selectedReportDetails.title}</p>
                      <span className="text-[10px] text-slate-400 block">{selectedReportDetails.location.address}</span>
                    </div>

                    <div className="border-t border-b border-slate-900 py-3 grid grid-cols-2 gap-3 text-[10px]">
                      <div>
                        <span className="text-slate-500 block uppercase">Incident ID</span>
                        <span className="text-slate-200 font-bold">{selectedReportDetails.id}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block uppercase">Severity Priority</span>
                        <span className="text-red-400 font-bold">{selectedReportDetails.severity}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block uppercase">Current Status</span>
                        <span className="text-slate-200 font-bold uppercase">{selectedReportDetails.status}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block uppercase">Ward Boundary</span>
                        <span className="text-slate-200 font-bold">{selectedReportDetails.location.ward}</span>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <span className="text-slate-500 uppercase text-[9px]">Description:</span>
                      <p className="text-slate-300 font-sans text-xs leading-relaxed leading-normal bg-slate-950 p-2.5 rounded-lg border border-slate-850">
                        {selectedReportDetails.description}
                      </p>
                    </div>

                    {selectedReportDetails.imageUrl && (
                      <div className="space-y-1.5">
                        <span className="text-slate-500 uppercase text-[9px]">Attachment:</span>
                        <div className="rounded-xl overflow-hidden border border-slate-850 h-32">
                          <img referrerPolicy="no-referrer" src={selectedReportDetails.imageUrl} className="w-full h-full object-cover" alt="civic attachment" />
                        </div>
                      </div>
                    )}

                    {selectedReportDetails.analysis && (
                      <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 space-y-2">
                        <div className="flex items-center justify-between text-[9px] border-b border-slate-900 pb-1.5">
                          <span className="text-cyan-400 font-bold">GEMINI INTELLIGENCE CARD</span>
                          <span className="text-slate-400">{(selectedReportDetails.analysis.confidenceScore * 100).toFixed(0)}% MATCH</span>
                        </div>
                        <div className="space-y-1 text-[11px] leading-relaxed">
                          <p><strong className="text-slate-400">Department:</strong> {selectedReportDetails.analysis.suggestedDepartment}</p>
                          <p><strong className="text-slate-400">Authority:</strong> {selectedReportDetails.analysis.suggestedAuthority}</p>
                          <p><strong className="text-slate-400">Response Plan:</strong> {selectedReportDetails.analysis.recommendedResponseTime}</p>
                          <p className="text-slate-300 italic pt-1 border-t border-slate-900 mt-1">"{selectedReportDetails.analysis.explanation}"</p>
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

            </div>

          </div>
        )}

        {/* ---------------------------------------------------- */}
        {/* ADMINISTRATOR VIEW */}
        {/* ---------------------------------------------------- */}
        {role === "Admin" && (
          <div className="space-y-6">
            
            {/* Dynamic visual charts HUD panel */}
            {healthScore && (
              <StatsPanel reports={reports} healthScore={healthScore} />
            )}

            {/* Middle grids: Predictions on Left, Ticket List Controller on Right */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Predictions column */}
              <div className="lg:col-span-1 bg-slate-900/80 backdrop-blur-md border border-slate-800 p-5 rounded-2xl shadow-xl h-full flex flex-col">
                <PredictiveIntelligence />
              </div>

              {/* Active list table controller on Right */}
              <div className="lg:col-span-2 bg-slate-900/80 backdrop-blur-md border border-slate-800 p-5 rounded-2xl shadow-xl h-full flex flex-col justify-between">
                <div>
                  <div className="border-b border-slate-800 pb-3 mb-4 flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h3 className="font-bold text-slate-100 text-sm font-mono tracking-wide">DIGITAL TWIN OPERATIONS GRID</h3>
                      <p className="text-[10px] font-mono text-slate-500">Dispatch, triage, and close active civic tickets to restore neighborhood health</p>
                    </div>
                    <span className="font-mono text-[10px] text-slate-400 bg-slate-950 border border-slate-800 px-2.5 py-1 rounded">
                      TOTAL TICKETS: {reports.length}
                    </span>
                  </div>

                  {reports.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-xs font-mono">
                        <thead>
                          <tr className="border-b border-slate-800 text-slate-500 uppercase text-[9px]">
                            <th 
                              className="py-2.5 px-3 cursor-pointer select-none hover:text-slate-300"
                              onClick={() => {
                                if (adminSortField === "title") {
                                  setAdminSortOrder(adminSortOrder === "asc" ? "desc" : "asc");
                                } else {
                                  setAdminSortField("title");
                                  setAdminSortOrder("asc");
                                }
                              }}
                            >
                              Ticket {adminSortField === "title" ? (adminSortOrder === "asc" ? "▲" : "▼") : ""}
                            </th>
                            <th 
                              className="py-2.5 px-3 cursor-pointer select-none hover:text-slate-300"
                              onClick={() => {
                                if (adminSortField === "ward") {
                                  setAdminSortOrder(adminSortOrder === "asc" ? "desc" : "asc");
                                } else {
                                  setAdminSortField("ward");
                                  setAdminSortOrder("asc");
                                }
                              }}
                            >
                              Ward {adminSortField === "ward" ? (adminSortOrder === "asc" ? "▲" : "▼") : ""}
                            </th>
                            <th 
                              className="py-2.5 px-3 cursor-pointer select-none hover:text-slate-300"
                              onClick={() => {
                                if (adminSortField === "severity") {
                                  setAdminSortOrder(adminSortOrder === "asc" ? "desc" : "asc");
                                } else {
                                  setAdminSortField("severity");
                                  setAdminSortOrder("desc");
                                }
                              }}
                            >
                              Priority {adminSortField === "severity" ? (adminSortOrder === "asc" ? "▲" : "▼") : ""}
                            </th>
                            <th className="py-2.5 px-3">Department</th>
                            <th 
                              className="py-2.5 px-3 cursor-pointer select-none hover:text-slate-300"
                              onClick={() => {
                                if (adminSortField === "status") {
                                  setAdminSortOrder(adminSortOrder === "asc" ? "desc" : "asc");
                                } else {
                                  setAdminSortField("status");
                                  setAdminSortOrder("desc");
                                }
                              }}
                            >
                              Status {adminSortField === "status" ? (adminSortOrder === "asc" ? "▲" : "▼") : ""}
                            </th>
                            <th className="py-2.5 px-3 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-850">
                          {paginatedAdminReports.map((report) => (
                            <tr key={report.id} className="hover:bg-slate-950/40 transition">
                              <td className="py-3.5 px-3 max-w-[180px]">
                                <div className="flex items-center gap-1.5 min-w-0">
                                  <div className="font-bold text-slate-200 truncate">{report.title}</div>
                                  {report.isUrgent && (
                                    <span className="font-mono text-[11px] font-black uppercase text-red-500 animate-[pulse_1s_infinite] shrink-0 bg-red-950/60 border border-red-500/50 px-1.5 py-0.5 rounded tracking-widest">
                                      🚨 URGENT
                                    </span>
                                  )}
                                </div>
                                <div className="text-[10px] text-slate-500 truncate">{report.category} ({report.id})</div>
                              </td>
                              <td className="py-3.5 px-3 text-slate-400">{(report.location?.ward || "Ward 1").split(" ")[0]}</td>
                              <td className="py-3.5 px-3">
                                <span 
                                  className="font-bold"
                                  style={{
                                    color: report.severity === "Critical" ? "#ef4444" : report.severity === "High" ? "#f97316" : "#eab308"
                                  }}
                                >
                                  {report.severity}
                                </span>
                              </td>
                              <td className="py-3.5 px-3 text-slate-400 truncate max-w-[130px]">
                                {report.analysis?.suggestedDepartment || "General Works"}
                              </td>
                              <td className="py-3.5 px-3">
                                {report.status === "Resolved" ? (
                                  <span className="text-emerald-400 font-bold">✓ SOLVED</span>
                                ) : report.status === "In_Progress" ? (
                                  <span className="text-blue-400 font-bold">⚙ REPAIR</span>
                                ) : (
                                  <span className="text-amber-400 font-bold">● PEND</span>
                                )}
                              </td>
                              <td className="py-3.5 px-3 text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  {/* Mark/Unmark Urgent Toggle */}
                                  <button
                                    onClick={() => handleToggleUrgent(report.id, !report.isUrgent)}
                                    className={`px-2 py-1 text-[10px] font-mono rounded cursor-pointer transition border uppercase font-extrabold tracking-wider ${
                                      report.isUrgent
                                        ? "bg-red-950/80 hover:bg-red-900 border-red-500 text-red-400 animate-[pulse_1.2s_infinite] shadow-[0_0_8px_rgba(239,68,68,0.3)]"
                                        : "bg-slate-950 hover:bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200"
                                    }`}
                                    title={report.isUrgent ? "Unmark as Urgent" : "Mark as Urgent"}
                                  >
                                    {report.isUrgent ? "★ Urgent" : "☆ Urgent"}
                                  </button>
                                  {report.status === "Pending" && (
                                    <button
                                      onClick={() => handleUpdateStatus(report.id, "In_Progress")}
                                      className="px-2.5 py-1 bg-blue-950 hover:bg-blue-900 border border-blue-800 text-blue-300 text-[10px] font-mono rounded cursor-pointer transition"
                                    >
                                      Repair
                                    </button>
                                  )}
                                  {report.status !== "Resolved" && (
                                    <button
                                      onClick={() => handleUpdateStatus(report.id, "Resolved")}
                                      className="px-2.5 py-1 bg-emerald-950 hover:bg-emerald-900 border border-emerald-800 text-emerald-300 text-[10px] font-mono rounded cursor-pointer transition"
                                    >
                                      Solve
                                    </button>
                                  )}
                                  {report.status === "Resolved" && (
                                    <span className="text-slate-500 text-[10px] pr-2">Cleared</span>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="p-12 text-center text-slate-500 font-mono text-xs">No active tickets registered in the Digital Twin.</div>
                  )}
                </div>

                {/* Pagination Controls Footer */}
                {reports.length > adminItemsPerPage && (
                  <div className="flex items-center justify-between border-t border-slate-800/80 pt-4 mt-4 font-mono text-[11px]">
                    <span className="text-slate-500">
                      Showing Page <strong className="text-slate-300">{adminCurrentPage}</strong> of <strong className="text-slate-300">{totalAdminPages}</strong>
                    </span>
                    <div className="flex gap-1.5">
                      <button
                        disabled={adminCurrentPage === 1}
                        onClick={() => setAdminCurrentPage(prev => Math.max(1, prev - 1))}
                        className="px-3 py-1 bg-slate-950 hover:bg-slate-900 border border-slate-850 rounded text-slate-400 hover:text-slate-200 disabled:opacity-40 disabled:cursor-not-allowed transition"
                      >
                        [Prev]
                      </button>
                      <button
                        disabled={adminCurrentPage === totalAdminPages}
                        onClick={() => setAdminCurrentPage(prev => Math.min(totalAdminPages, prev + 1))}
                        className="px-3 py-1 bg-slate-950 hover:bg-slate-900 border border-slate-850 rounded text-slate-400 hover:text-slate-200 disabled:opacity-40 disabled:cursor-not-allowed transition"
                      >
                        [Next]
                      </button>
                    </div>
                  </div>
                )}
              </div>

            </div>

          </div>
        )}

        {/* ---------------------------------------------------- */}
        {/* GEMINI INSIGHTS HUD ROW */}
        {/* ---------------------------------------------------- */}
        <div className="space-y-3.5">
          <h3 className="font-mono text-xs uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-cyan-400 animate-pulse" />
            AI GEMINI INSIGHTS HUD
          </h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {loading ? (
              [1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-slate-900/40 border border-slate-800 rounded-xl p-4 animate-pulse h-20"></div>
              ))
            ) : insights.length > 0 ? (
              insights.map((insight) => (
                <div 
                  key={insight.id}
                  className="bg-slate-900/60 border border-slate-800/80 p-4 rounded-xl flex items-start gap-3 shadow-md relative overflow-hidden"
                >
                  <div className="p-2 bg-slate-950 border border-slate-850 rounded-lg shrink-0">
                    {getInsightIcon(insight.iconName)}
                  </div>
                  <div className="min-w-0">
                    <span className="text-[9px] font-mono uppercase text-slate-500 block mb-0.5">{insight.category}</span>
                    <p className="text-slate-300 text-xs leading-snug">{insight.text}</p>
                  </div>
                  <div className="absolute right-3 top-3 font-mono font-bold text-[10px] text-cyan-500">
                    {insight.percentage}%
                  </div>
                </div>
              ))
            ) : (
              <div className="p-4 bg-slate-900/30 border border-slate-800 text-center font-mono text-xs text-slate-500 col-span-4">
                No active neural insights generated.
              </div>
            )}
          </div>
        </div>

      </main>

      {/* Futuristic Floating Chat Widget */}
      <AIChatbot />

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 p-6 text-center text-[10px] font-mono text-slate-500 tracking-wider uppercase mt-12">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <span>CivicTwin AI // National Hackathon MVP Demo Platform</span>
          <span>© 2026 Smart City Governance Grid</span>
        </div>
      </footer>

    </div>
  );
}
