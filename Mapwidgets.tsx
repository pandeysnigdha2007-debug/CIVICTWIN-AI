import React, { useState } from "react";
import { CivicReport, SeverityLevel } from "../types";
import { Filter, Eye, AlertTriangle, ShieldCheck, Clock, MapPin } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface MapWidgetProps {
  reports: CivicReport[];
  selectedReportId: string | null;
  onSelectReport: (id: string | null) => void;
  selectedWardFilter: string;
  setSelectedWardFilter: (ward: string) => void;
  selectedSeverityFilter: string;
  setSelectedSeverityFilter: (severity: string) => void;
  selectedCategoryFilter: string;
  setSelectedCategoryFilter: (category: string) => void;
}

// Fixed Ward Boundaries & Features for our Simulated Smart City (San Francisco Center)
const WARDS_DATA = [
  { id: "Ward 1 (Metro-East)", name: "Ward 1 (Metro-East)", color: "rgba(6, 182, 212, 0.08)", border: "#06b6d4", center: { x: 700, y: 150 } },
  { id: "Ward 2 (Lakeview)", name: "Ward 2 (Lakeview)", color: "rgba(59, 130, 246, 0.08)", border: "#3b82f6", center: { x: 250, y: 450 } },
  { id: "Ward 3 (Green Hills)", name: "Ward 3 (Green Hills)", color: "rgba(16, 185, 129, 0.08)", border: "#10b981", center: { x: 300, y: 180 } },
  { id: "Ward 4 (Downtown)", name: "Ward 4 (Downtown)", color: "rgba(245, 158, 11, 0.08)", border: "#f59e0b", center: { x: 550, y: 320 } },
];

export default function MapWidget({
  reports,
  selectedReportId,
  onSelectReport,
  selectedWardFilter,
  setSelectedWardFilter,
  selectedSeverityFilter,
  setSelectedSeverityFilter,
  selectedCategoryFilter,
  setSelectedCategoryFilter,
}: MapWidgetProps) {
  const [hoveredReport, setHoveredReport] = useState<CivicReport | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Get color for report severity
  const getSeverityColor = (severity: SeverityLevel) => {
    switch (severity) {
      case "Critical":
        return "#ef4444"; // Red
      case "High":
        return "#f97316"; // Orange
      case "Medium":
        return "#eab308"; // Yellow
      case "Low":
        return "#10b981"; // Green
      default:
        return "#06b6d4"; // Cyan
    }
  };

  // Maps physical coordinates (lat, lng of SF) onto our SVG canvas (800x600)
  // SF Bounds approx: lat 37.73 to 37.79, lng -122.46 to -122.39
  const mapCoords = (lat: number, lng: number) => {
    const minLat = 37.73;
    const maxLat = 37.795;
    const minLng = -122.46;
    const maxLng = -122.39;

    // Convert to 0 - 1 percentage
    const xPct = (lng - minLng) / (maxLng - minLng);
    const yPct = 1 - (lat - minLat) / (maxLat - minLat); // Lat is inverted in screen space

    // Scale to our SVG dimensions (800x600)
    const x = 50 + xPct * 700;
    const y = 50 + yPct * 500;

    return { x, y };
  };

  // Filtered reports to show on map
  const filteredReports = reports.filter((report) => {
    const matchWard = selectedWardFilter === "all" || report.location.ward === selectedWardFilter;
    const matchSeverity = selectedSeverityFilter === "all" || report.severity === selectedSeverityFilter;
    const matchCategory = selectedCategoryFilter === "all" || report.category.toLowerCase() === selectedCategoryFilter.toLowerCase();
    return matchWard && matchSeverity && matchCategory;
  });

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const resetMap = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  return (
    <div id="interactive-community-map" className="relative bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-2xl overflow-hidden h-full flex flex-col min-h-[500px]">
      {/* Header and Controls */}
      <div className="p-4 border-b border-slate-800/80 bg-slate-950/40 flex flex-wrap gap-3 items-center justify-between">
        <div className="flex items-center gap-2">
          <MapPin className="text-cyan-400 w-5 h-5 animate-pulse" />
          <h3 className="font-semibold text-slate-100 text-sm tracking-wide uppercase font-mono">Digital Twin Community Map</h3>
        </div>
        
        {/* Quick Map Controls */}
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setZoom(prev => Math.min(prev + 0.25, 2.5))}
            className="px-2.5 py-1 text-xs font-mono bg-slate-800 border border-slate-700 hover:border-cyan-500 hover:text-cyan-400 rounded text-slate-300 transition"
          >
            Zoom +
          </button>
          <button 
            onClick={() => setZoom(prev => Math.max(prev - 0.25, 0.75))}
            className="px-2.5 py-1 text-xs font-mono bg-slate-800 border border-slate-700 hover:border-cyan-500 hover:text-cyan-400 rounded text-slate-300 transition"
          >
            Zoom -
          </button>
          <button 
            onClick={resetMap}
            className="px-2.5 py-1 text-xs font-mono bg-slate-800 border border-slate-700 hover:border-cyan-500 hover:text-cyan-400 rounded text-slate-300 transition"
          >
            Reset
          </button>
          <span className="text-slate-500 font-mono text-xs hidden sm:inline">Active Pins: {filteredReports.length}</span>
        </div>
      </div>

      {/* Map Canvas */}
      <div 
        className="flex-1 relative bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px] cursor-grab active:cursor-grabbing overflow-hidden"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <svg 
          className="w-full h-full select-none absolute top-0 left-0"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: "center center",
            transition: isDragging ? "none" : "transform 0.2s ease-out"
          }}
          viewBox="0 0 800 600"
          width="800"
          height="600"
        >
          {/* Futuristic Grid street background patterns */}
          <g stroke="#334155" strokeWidth="0.5" opacity="0.3">
            {/* Grid Lines */}
            <line x1="50" y1="50" x2="750" y2="50" />
            <line x1="50" y1="150" x2="750" y2="150" />
            <line x1="50" y1="250" x2="750" y2="250" />
            <line x1="50" y1="350" x2="750" y2="350" />
            <line x1="50" y1="450" x2="750" y2="450" />
            <line x1="50" y1="550" x2="750" y2="550" />

            <line x1="50" y1="50" x2="50" y2="550" />
            <line x1="150" y1="50" x2="150" y2="550" />
            <line x1="250" y1="50" x2="250" y2="550" />
            <line x1="350" y1="50" x2="350" y2="550" />
            <line x1="450" y1="50" x2="450" y2="550" />
            <line x1="550" y1="50" x2="550" y2="550" />
            <line x1="650" y1="50" x2="650" y2="550" />
            <line x1="750" y1="50" x2="750" y2="550" />
          </g>

          {/* Ward Outlines / Boundaries */}
          {WARDS_DATA.map((ward) => (
            <g key={ward.id}>
              {/* Custom SVG path boundaries for Ward shapes to look smart */}
              <polygon
                points={
                  ward.id.includes("1") ? "450,50 750,50 750,280 500,280" :
                  ward.id.includes("2") ? "50,300 400,300 400,550 50,550" :
                  ward.id.includes("3") ? "50,50 420,50 420,280 50,280" :
                  "420,300 750,300 750,550 420,550"
                }
                fill={selectedWardFilter === "all" || selectedWardFilter === ward.id ? ward.color : "rgba(30, 41, 59, 0.15)"}
                stroke={ward.border}
                strokeWidth={selectedWardFilter === ward.id ? "2" : "0.75"}
                strokeDasharray="4,4"
                className="transition-colors duration-300"
              />
              <text
                x={ward.center.x}
                y={ward.center.y}
                fill="#94a3b8"
                fontSize="10"
                fontFamily="monospace"
                textAnchor="middle"
                opacity="0.6"
              >
                {ward.name}
              </text>
            </g>
          ))}

          {/* Street Roads Simulation Lines */}
          <g stroke="#1e293b" strokeWidth="4" opacity="0.4" strokeLinecap="round">
            {/* Main Highways (Blue neon lines) */}
            <path d="M 50,150 L 750,150" />
            <path d="M 50,380 L 750,380" />
            <path d="M 350,50 L 350,550" />
            <path d="M 580,50 L 580,550" />
            {/* Diagonals */}
            <path d="M 50,50 L 750,550" />
          </g>
          <g stroke="#06b6d4" strokeWidth="1" opacity="0.2" strokeLinecap="round" strokeDasharray="3,3">
            <path d="M 50,150 L 750,150" />
            <path d="M 50,380 L 750,380" />
            <path d="M 350,50 L 350,550" />
            <path d="M 580,50 L 580,550" />
            <path d="M 50,50 L 750,550" />
          </g>

          {/* Active Hotspot Warning Rings */}
          {filteredReports.filter(r => r.severity === "Critical" && r.status !== "Resolved").map((report, i) => {
            const { x, y } = mapCoords(report.location.lat, report.location.lng);
            return (
              <g key={`hot-ring-${report.id}`}>
                <circle
                  cx={x}
                  cy={y}
                  r="24"
                  fill="none"
                  stroke="#ef4444"
                  strokeWidth="0.5"
                  opacity="0.6"
                >
                  <animate
                    attributeName="r"
                    values="10;45"
                    dur="3s"
                    repeatCount="indefinite"
                  />
                  <animate
                    attributeName="opacity"
                    values="0.8;0"
                    dur="3s"
                    repeatCount="indefinite"
                  />
                </circle>
              </g>
            );
          })}

          {/* Interactive Report Pins */}
          {filteredReports.map((report) => {
            const { x, y } = mapCoords(report.location.lat, report.location.lng);
            const isSelected = selectedReportId === report.id;
            const isHovered = hoveredReport?.id === report.id;
            const markerColor = getSeverityColor(report.severity);

            return (
              <g
                key={report.id}
                transform={`translate(${x}, ${y})`}
                className="cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectReport(isSelected ? null : report.id);
                }}
                onMouseEnter={() => setHoveredReport(report)}
                onMouseLeave={() => setHoveredReport(null)}
              >
                {/* Glowing Background Radial */}
                <circle
                  r={isSelected ? "14" : isHovered ? "11" : "8"}
                  fill={markerColor}
                  opacity={isSelected ? "0.4" : isHovered ? "0.3" : "0.15"}
                  className="transition-all duration-200"
                />

                {/* Inner Coordinate dot */}
                <circle
                  r={isSelected ? "6" : isHovered ? "5" : "4"}
                  fill={markerColor}
                  stroke="#0f172a"
                  strokeWidth="1.5"
                  className="transition-all duration-200"
                />

                {/* Ring border for solved issues */}
                {report.status === "Resolved" && (
                  <circle
                    r={isSelected ? "9" : isHovered ? "7" : "6"}
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="1.5"
                  />
                )}
              </g>
            );
          })}
        </svg>

        {/* Dynamic Map HUD Tooltip */}
        <AnimatePresence>
          {hoveredReport && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="absolute pointer-events-none bg-slate-950/95 border border-slate-800 p-3.5 rounded-xl shadow-2xl max-w-xs z-50 bottom-4 left-4 backdrop-blur-md"
            >
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <span className="text-[10px] font-mono uppercase tracking-wider text-cyan-400 bg-cyan-950/50 border border-cyan-800/40 px-1.5 py-0.5 rounded">
                  {hoveredReport.category}
                </span>
                <span 
                  className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded"
                  style={{
                    backgroundColor: hoveredReport.severity === "Critical" ? "rgba(239, 68, 68, 0.2)" : hoveredReport.severity === "High" ? "rgba(249, 115, 22, 0.2)" : "rgba(234, 179, 8, 0.2)",
                    color: getSeverityColor(hoveredReport.severity)
                  }}
                >
                  {hoveredReport.severity}
                </span>
              </div>
              <h4 className="font-semibold text-slate-100 text-xs mb-1 truncate">{hoveredReport.title}</h4>
              <p className="text-slate-400 text-[11px] leading-relaxed line-clamp-2 mb-2">{hoveredReport.description}</p>
              
              <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 border-t border-slate-900 pt-2">
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span>{new Date(hoveredReport.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-1">
                  {hoveredReport.status === "Resolved" ? (
                    <span className="text-emerald-400 font-bold">● RESOLVED</span>
                  ) : hoveredReport.status === "In_Progress" ? (
                    <span className="text-blue-400 font-bold">● REPAIRING</span>
                  ) : (
                    <span className="text-amber-400 font-bold">● PENDING</span>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Map Legend Hud */}
      <div className="p-3 bg-slate-950/60 border-t border-slate-800/80 flex flex-wrap justify-between items-center text-xs gap-3">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block animate-pulse"></span>
            <span className="text-slate-400 font-mono text-[11px]">Critical</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-orange-500 inline-block"></span>
            <span className="text-slate-400 font-mono text-[11px]">High</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-yellow-500 inline-block"></span>
            <span className="text-slate-400 font-mono text-[11px]">Medium</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span>
            <span className="text-slate-400 font-mono text-[11px]">Low</span>
          </div>
        </div>
        <div className="text-slate-500 font-mono text-[10px]">
          Click pins to view full reports inside the sidebar
        </div>
      </div>
    </div>
  );
}
