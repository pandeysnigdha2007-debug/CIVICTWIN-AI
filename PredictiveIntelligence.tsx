import React, { useEffect, useState } from "react";
import { Hotspot, PredictiveAlert } from "../types";
import { AlertCircle, TrendingUp, TrendingDown, Clock, ShieldCheck, Flame, Loader2, Sparkles } from "lucide-react";
import { motion } from "motion/react";

export default function PredictiveIntelligence() {
  const [predictions, setPredictions] = useState<PredictiveAlert[]>([]);
  const [hotspots, setHotspots] = useState<Hotspot[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAIIntelligence = async () => {
    try {
      setLoading(true);
      const [predRes, hotRes] = await Promise.all([
        fetch("/api/predictions"),
        fetch("/api/hotspots")
      ]);
      if (predRes.ok && hotRes.ok) {
        const predData = await predRes.json();
        const hotData = await hotRes.json();
        setPredictions(predData);
        setHotspots(hotData);
      }
    } catch (e) {
      console.error("Failed to load predictions & hotspots", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAIIntelligence();
  }, []);

  const getUrgencyBg = (urgency: string) => {
    switch (urgency) {
      case "Immediate": return "bg-red-950/40 text-red-400 border border-red-900/50";
      case "Action Required": return "bg-orange-950/40 text-orange-400 border border-orange-900/40";
      default: return "bg-slate-950/60 text-slate-400 border border-slate-800/80";
    }
  };

  const getTrendIcon = (trend: string) => {
    if (trend === "Increasing") return <TrendingUp className="w-4 h-4 text-red-400 animate-bounce" />;
    return <TrendingDown className="w-4 h-4 text-emerald-400" />;
  };

  return (
    <div className="space-y-6">
      
      {/* Hotspots Section */}
      <div>
        <h3 className="font-mono text-xs uppercase tracking-wider text-slate-400 mb-3.5 flex items-center gap-1.5">
          <Flame className="w-4 h-4 text-orange-500 animate-pulse" />
          ACTIVE CLUSTER HOTSPOTS
        </h3>

        {loading ? (
          <div className="flex items-center justify-center p-8 bg-slate-900/30 border border-slate-800/50 rounded-xl">
            <Loader2 className="w-5 h-5 animate-spin text-cyan-400" />
            <span className="ml-2 font-mono text-xs text-slate-500">Scanning clustering nodes...</span>
          </div>
        ) : hotspots.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {hotspots.map((hotspot) => (
              <motion.div
                key={hotspot.id}
                whileHover={{ y: -2 }}
                className="bg-slate-950 border border-slate-800/80 rounded-xl p-4 flex items-start gap-3 shadow-md relative overflow-hidden group"
              >
                {/* Neon vertical status rail */}
                <div 
                  className="absolute left-0 top-0 bottom-0 w-1" 
                  style={{ 
                    backgroundColor: hotspot.severity === "Critical" ? "#ef4444" : hotspot.severity === "High" ? "#f97316" : "#eab308" 
                  }}
                ></div>
                
                <div className="p-2 bg-slate-900 border border-slate-800 rounded-lg group-hover:border-orange-500/50 transition">
                  <AlertCircle className="w-4 h-4 text-orange-400" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono text-[10px] text-slate-500 uppercase">{hotspot.ward}</span>
                    <span className="text-[10px] font-mono font-bold text-orange-400 bg-orange-950/40 px-1.5 py-0.5 rounded border border-orange-900/30">
                      {hotspot.count} INCIDENTS
                    </span>
                  </div>
                  <h4 className="font-semibold text-slate-200 text-xs mb-1 truncate capitalize">
                    Active {hotspot.issueType} Hotspot
                  </h4>
                  <p className="text-slate-400 text-xs leading-relaxed font-mono">
                    {hotspot.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="p-6 bg-slate-900/20 border border-slate-800/40 rounded-xl text-center">
            <ShieldCheck className="w-6 h-6 text-emerald-400 mx-auto mb-2 opacity-80" />
            <p className="font-mono text-xs text-slate-500">No dense geographic issue hotspots detected this week.</p>
          </div>
        )}
      </div>

      {/* AI Historical Predictions Section */}
      <div>
        <div className="flex items-center justify-between mb-3.5">
          <h3 className="font-mono text-xs uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-cyan-400 animate-pulse" />
            AI TREND FORECASTS & RISK METRICS
          </h3>
          <button 
            onClick={fetchAIIntelligence}
            className="text-[10px] font-mono text-cyan-400 hover:text-cyan-300 underline bg-transparent border-none cursor-pointer"
          >
            Refresh Diagnostics
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center p-12 bg-slate-900/30 border border-slate-800/50 rounded-xl">
            <Loader2 className="w-6 h-6 animate-spin text-cyan-400" />
            <span className="ml-2.5 font-mono text-xs text-slate-500">Running Gemini historical pattern analysis...</span>
          </div>
        ) : (
          <div className="space-y-4">
            {predictions.map((alert) => (
              <motion.div
                key={alert.id}
                className="bg-slate-900/40 border border-slate-800/80 rounded-xl p-5 shadow-lg relative overflow-hidden"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3 pb-2 border-b border-slate-800/50">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-xs text-slate-500 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                      {alert.id}
                    </span>
                    <h4 className="font-bold text-slate-200 text-sm tracking-wide">{alert.title}</h4>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="flex items-center gap-1 bg-slate-950 px-2 py-1 rounded border border-slate-850">
                      {getTrendIcon(alert.trend)}
                      <span className="font-mono text-[9px] uppercase text-slate-400">{alert.trend} Trend</span>
                    </div>
                    
                    <span className={`text-[9px] font-mono font-bold uppercase tracking-wider px-2 py-1 rounded-md ${getUrgencyBg(alert.urgency)}`}>
                      URGENCY: {alert.urgency}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  <div className="lg:col-span-2 space-y-2">
                    <p className="text-slate-300 text-xs leading-relaxed">{alert.description}</p>
                    <div className="text-[11px] font-mono text-slate-500 bg-slate-950/40 p-2.5 rounded-lg border border-slate-850">
                      <strong className="text-cyan-400 uppercase text-[10px] block mb-0.5">AI Forecasting Logic:</strong>
                      {alert.reasoning}
                    </div>
                  </div>
                  
                  {/* Department Assignment Info */}
                  <div className="bg-slate-950/60 border border-slate-850/80 rounded-xl p-3 flex flex-col justify-between font-mono text-[10px]">
                    <div>
                      <span className="text-slate-500 block uppercase mb-1">Target Department</span>
                      <span className="text-slate-300 font-bold block truncate">{alert.department}</span>
                    </div>
                    <div className="border-t border-slate-900 mt-2 pt-2 flex items-center justify-between text-slate-500">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>Issued: {new Date(alert.createdAt).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-red-500 inline-block"></span>
                        <span className="text-red-400 font-bold">{alert.severity}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
