import React from "react";
import { CivicReport, NeighborhoodHealthScore } from "../types";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend } from "recharts";
import { ShieldCheck, Activity, AlertTriangle, FileSpreadsheet, Percent, HeartPulse } from "lucide-react";

interface StatsPanelProps {
  reports: CivicReport[];
  healthScore: NeighborhoodHealthScore;
}

export default function StatsPanel({ reports, healthScore }: StatsPanelProps) {
  // 1. Process Category Distribution data
  const categoryCounts: { [key: string]: number } = {};
  reports.forEach(r => {
    const cat = r.category || "General";
    categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
  });

  const barChartData = Object.keys(categoryCounts).map(cat => ({
    name: cat,
    reports: categoryCounts[cat]
  })).sort((a, b) => b.reports - a.reports);

  // 2. Process Severity Pie Chart data
  const severityCounts = { Critical: 0, High: 0, Medium: 0, Low: 0 };
  reports.forEach(r => {
    if (r.severity in severityCounts) {
      severityCounts[r.severity as keyof typeof severityCounts]++;
    }
  });

  const pieChartData = [
    { name: "Critical", value: severityCounts.Critical, color: "#ef4444" },
    { name: "High", value: severityCounts.High, color: "#f97316" },
    { name: "Medium", value: severityCounts.Medium, color: "#eab308" },
    { name: "Low", value: severityCounts.Low, color: "#10b981" }
  ].filter(d => d.value > 0);

  // 3. Process resolution/timeline trend data
  // We will build a simulated daily timeline of resolved vs pending issues for the last 5 days
  const trendData = [
    { day: "Mon", pending: Math.max(1, reports.filter(r => r.status !== "Resolved").length - 3), resolved: Math.max(0, reports.filter(r => r.status === "Resolved").length - 1) },
    { day: "Tue", pending: Math.max(1, reports.filter(r => r.status !== "Resolved").length - 2), resolved: Math.max(1, reports.filter(r => r.status === "Resolved").length - 1) },
    { day: "Wed", pending: Math.max(1, reports.filter(r => r.status !== "Resolved").length - 1), resolved: Math.max(1, reports.filter(r => r.status === "Resolved").length) },
    { day: "Thu", pending: Math.max(1, reports.filter(r => r.status !== "Resolved").length), resolved: Math.max(1, reports.filter(r => r.status === "Resolved").length) },
    { day: "Today", pending: reports.filter(r => r.status !== "Resolved").length, resolved: reports.filter(r => r.status === "Resolved").length }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Excellent": return "text-emerald-400";
      case "Good": return "text-cyan-400";
      case "Average": return "text-yellow-400";
      case "Poor": return "text-orange-400";
      default: return "text-red-400";
    }
  };

  return (
    <div className="space-y-6">
      {/* Dynamic Health Score overview & breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Dynamic Health Score Dial */}
        <div className="bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-2xl p-6 flex flex-col items-center justify-center text-center shadow-xl min-h-[250px]">
          <h3 className="font-mono text-xs uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-1.5">
            <HeartPulse className="w-3.5 h-3.5 text-cyan-400" />
            Neighborhood Health Index
          </h3>
          <div className="relative flex items-center justify-center w-36 h-36">
            {/* Simple CSS-based Circular progress */}
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="72"
                cy="72"
                r="64"
                stroke="#1e293b"
                strokeWidth="10"
                fill="none"
              />
              <circle
                cx="72"
                cy="72"
                r="64"
                stroke="url(#healthGradient)"
                strokeWidth="10"
                fill="none"
                strokeDasharray="402"
                strokeDashoffset={402 - (402 * healthScore.score) / 100}
                strokeLinecap="round"
                className="transition-all duration-1000 ease-out"
              />
              <defs>
                <linearGradient id="healthGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#10b981" />
                  <stop offset="50%" stopColor="#06b6d4" />
                  <stop offset="100%" stopColor="#3b82f6" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute flex flex-col items-center justify-center">
              <span className="text-4xl font-extrabold font-mono text-slate-100 tracking-tighter">
                {healthScore.score}
              </span>
              <span className="text-[10px] text-slate-400 font-mono">/ 100</span>
            </div>
          </div>
          <div className="mt-4">
            <span className={`text-sm font-bold font-mono tracking-widest uppercase ${getStatusColor(healthScore.status)}`}>
              STATUS: {healthScore.status}
            </span>
          </div>
        </div>

        {/* Health Breakdown Dimensions */}
        <div className="bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-2xl p-6 shadow-xl lg:col-span-2 flex flex-col justify-between">
          <div>
            <h3 className="font-mono text-xs uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-cyan-400" />
              Intelligence Metric Breakdown
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Cleanliness */}
              <div className="bg-slate-950/50 border border-slate-850 p-3 rounded-xl">
                <div className="flex items-center justify-between text-xs font-mono text-slate-400 mb-1.5">
                  <span>🧹 SANITATION & CLEANLINESS</span>
                  <span className="font-bold text-slate-200">{healthScore.breakdown.cleanliness}%</span>
                </div>
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div className="bg-emerald-500 h-full rounded-full transition-all duration-1000" style={{ width: `${healthScore.breakdown.cleanliness}%` }}></div>
                </div>
              </div>

              {/* Road Quality */}
              <div className="bg-slate-950/50 border border-slate-850 p-3 rounded-xl">
                <div className="flex items-center justify-between text-xs font-mono text-slate-400 mb-1.5">
                  <span>🛣️ ROAD & PAVEMENT QUALITY</span>
                  <span className="font-bold text-slate-200">{healthScore.breakdown.roadQuality}%</span>
                </div>
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div className="bg-cyan-500 h-full rounded-full transition-all duration-1000" style={{ width: `${healthScore.breakdown.roadQuality}%` }}></div>
                </div>
              </div>

              {/* Safety */}
              <div className="bg-slate-950/50 border border-slate-850 p-3 rounded-xl">
                <div className="flex items-center justify-between text-xs font-mono text-slate-400 mb-1.5">
                  <span>🛡️ PEDESTRIAN & DARK ZONE SAFETY</span>
                  <span className="font-bold text-slate-200">{healthScore.breakdown.safety}%</span>
                </div>
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div className="bg-blue-500 h-full rounded-full transition-all duration-1000" style={{ width: `${healthScore.breakdown.safety}%` }}></div>
                </div>
              </div>

              {/* Infrastructure */}
              <div className="bg-slate-950/50 border border-slate-850 p-3 rounded-xl">
                <div className="flex items-center justify-between text-xs font-mono text-slate-400 mb-1.5">
                  <span>💧 UTILITIES & SEWER AGE FLOW</span>
                  <span className="font-bold text-slate-200">{healthScore.breakdown.infrastructure}%</span>
                </div>
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div className="bg-purple-500 h-full rounded-full transition-all duration-1000" style={{ width: `${healthScore.breakdown.infrastructure}%` }}></div>
                </div>
              </div>
            </div>
          </div>
          <p className="text-[11px] text-slate-500 leading-relaxed font-mono mt-4 border-t border-slate-850/80 pt-3">
            Health index dynamically decreases with active high-severity reports and chokes. Resolving issues instantly restores structural health metrics.
          </p>
        </div>
      </div>

      {/* Recharts Widgets Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Category Bar Chart */}
        <div className="bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-2xl p-5 shadow-xl">
          <h3 className="font-mono text-xs uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-1.5">
            <FileSpreadsheet className="w-3.5 h-3.5 text-cyan-400" />
            Issue Category Distribution
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barChartData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="name" stroke="#64748b" fontSize={10} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={10} tickLine={false} allowDecimals={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: "#020617", borderColor: "#1e293b", borderRadius: "8px" }}
                  labelStyle={{ color: "#94a3b8", fontFamily: "monospace", fontSize: "11px" }}
                  itemStyle={{ color: "#22d3ee", fontFamily: "monospace", fontSize: "11px" }}
                />
                <Bar dataKey="reports" fill="#06b6d4" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Severity Doughnut & Resolution Trends */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Pie Chart */}
          <div className="bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
            <h3 className="font-mono text-xs uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-cyan-400" />
              Severity Breakdown
            </h3>
            {pieChartData.length > 0 ? (
              <div className="h-44 relative flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={65}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {pieChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ backgroundColor: "#020617", borderColor: "#1e293b", borderRadius: "8px" }}
                      itemStyle={{ color: "#f8fafc", fontFamily: "monospace", fontSize: "11px" }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                {/* Labels legend in center */}
                <div className="absolute flex flex-col items-center">
                  <span className="text-xl font-bold font-mono text-slate-300">
                    {reports.length}
                  </span>
                  <span className="text-[9px] text-slate-500 font-mono uppercase tracking-widest">Total</span>
                </div>
              </div>
            ) : (
              <div className="h-44 flex items-center justify-center text-xs text-slate-500 font-mono">No active incidents</div>
            )}
            
            {/* Color Legend list */}
            <div className="grid grid-cols-2 gap-1.5 text-[9px] font-mono uppercase text-slate-400 mt-2">
              {pieChartData.map((d, i) => (
                <div key={i} className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ backgroundColor: d.color }}></span>
                  <span>{d.name}: {d.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Timeline trend graph */}
          <div className="bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
            <h3 className="font-mono text-xs uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
              Resolution Trends
            </h3>
            <div className="h-44">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData} margin={{ top: 10, right: 10, left: -30, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="day" stroke="#64748b" fontSize={9} />
                  <YAxis stroke="#64748b" fontSize={9} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#020617", borderColor: "#1e293b", borderRadius: "8px" }}
                    labelStyle={{ color: "#94a3b8", fontFamily: "monospace", fontSize: "10px" }}
                    itemStyle={{ fontFamily: "monospace", fontSize: "10px" }}
                  />
                  <Line type="monotone" dataKey="pending" stroke="#f59e0b" strokeWidth={1.5} dot={{ r: 2 }} activeDot={{ r: 4 }} name="Pending" />
                  <Line type="monotone" dataKey="resolved" stroke="#10b981" strokeWidth={1.5} dot={{ r: 2 }} activeDot={{ r: 4 }} name="Resolved" />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="text-[10px] text-center text-slate-500 font-mono mt-1">
              Active Pending vs Solved Tickets (5-day timeline)
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
