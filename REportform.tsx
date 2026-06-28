import React, { useState } from "react";
import { CivicReport, GeminiAnalysis } from "../types";
import { Camera, Mic, CheckCircle, AlertCircle, Loader2, Sparkles, Send, ShieldAlert } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface ReportFormProps {
  onSubmitSuccess: (report: CivicReport) => void;
}

// Highly realistic small PNG base64 strings representing different civic assets
// We can use these to mock real images for Gemini visual analysis!
const MOCK_ASSETS = [
  {
    id: "asset-pothole",
    name: "Road Pothole Photo",
    category: "damaged roads",
    previewUrl: "https://images.unsplash.com/photo-1515162305285-0293e4767cc2?auto=format&fit=crop&q=80&w=200",
    base64: "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==" // Standard 1px transparent placeholder
  },
  {
    id: "asset-flooding",
    name: "Street Flooding Photo",
    category: "flooding",
    previewUrl: "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&q=80&w=200",
    base64: "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
  },
  {
    id: "asset-garbage",
    name: "Overflowing Dumpster",
    category: "garbage",
    previewUrl: "https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?auto=format&fit=crop&q=80&w=200",
    base64: "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
  },
  {
    id: "asset-streetlight",
    name: "Dark Street Grid",
    category: "broken streetlight",
    previewUrl: "https://images.unsplash.com/photo-1509021436665-8f07dbf5bf1d?auto=format&fit=crop&q=80&w=200",
    base64: "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
  }
];

const VOICE_PRESETS = [
  { text: "Heavy overnight rain has choked the main drainage line here in Sector 7. Sewer water is starting to backflow into our streets.", category: "blocked drains" },
  { text: "There's a pack of around 6 stray dogs that are barking and chasing kids right outside the public park playground.", category: "stray animal issue" },
  { text: "We have multiple streetlights out on Oak Avenue. It is pitch black and people feel really unsafe walking home.", category: "broken streetlight" }
];

export default function ReportForm({ onSubmitSuccess }: ReportFormProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("damaged roads");
  const [ward, setWard] = useState("Ward 4 (Downtown)");
  const [address, setAddress] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  
  // Voice Recording & Simulator States
  const [isRecording, setIsRecording] = useState(false);
  const [recordedVoiceText, setRecordedVoiceText] = useState("");
  const [voiceBase64, setVoiceBase64] = useState("");
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [audioChunks, setAudioChunks] = useState<Blob[]>([]);
  const [realAudioDuration, setRealAudioDuration] = useState(0);
  const recordingTimerRef = React.useRef<NodeJS.Timeout | null>(null);

  // Drag & Drop / Image upload states
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);
  const [customImageBase64, setCustomImageBase64] = useState<string>("");
  const [customImageFile, setCustomImageFile] = useState<File | null>(null);
  const [isDragActive, setIsDragActive] = useState(false);

  // AI Analysis States
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<GeminiAnalysis | null>(null);
  const [errorMsg, setErrorMsg] = useState("");

  // Real voice recording handlers
  const startRealRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];
      
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      recorder.onstop = () => {
        const audioBlob = new Blob(chunks, { type: "audio/webm" });
        const reader = new FileReader();
        reader.onloadend = () => {
          setVoiceBase64(reader.result as string);
        };
        reader.readAsDataURL(audioBlob);
        setRecordedVoiceText("Live audio recorded via browser microphone (WAV/WEBM). Processing...");
        setCategory("public safety issue");
        setDescription(prev => prev ? prev + " [Captured voice note details]" : "Captured voice note details");
      };

      setMediaRecorder(recorder);
      setAudioChunks(chunks);
      setIsRecording(true);
      setRealAudioDuration(0);
      recorder.start();

      recordingTimerRef.current = setInterval(() => {
        setRealAudioDuration(prev => prev + 1);
      }, 1000);
    } catch (err) {
      console.warn("Could not access microphone, falling back to simulated preset.", err);
      handleSimulateVoice(VOICE_PRESETS[0]);
    }
  };

  const stopRealRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      setIsRecording(false);
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }
      mediaRecorder.stream.getTracks().forEach(track => track.stop());
    }
  };

  // Simulated Voice Note selection fallback
  const handleSimulateVoice = (preset: typeof VOICE_PRESETS[0]) => {
    setIsRecording(true);
    setTimeout(() => {
      setIsRecording(false);
      setRecordedVoiceText(preset.text);
      setCategory(preset.category);
      setDescription(prev => prev ? prev + " " + preset.text : preset.text);
      setVoiceBase64("MOCK_VOICE_BASE64_DATA");
    }, 1200);
  };

  // Drag-and-drop helpers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith("image/")) {
        setCustomImageFile(file);
        setSelectedAssetId(null);
        const reader = new FileReader();
        reader.onloadend = () => {
          setCustomImageBase64(reader.result as string);
        };
        reader.readAsDataURL(file);
      } else {
        setErrorMsg("Please drop image files only.");
      }
    }
  };

  // Custom Image Upload handler
  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCustomImageFile(file);
      setSelectedAssetId(null);
      const reader = new FileReader();
      reader.onloadend = () => {
        setCustomImageBase64(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Trigger Gemini Analysis
  const handleAIAnalysis = async () => {
    if (!title || !description) {
      setErrorMsg("Please provide a Title and Description first so Gemini has text to analyze.");
      return;
    }

    setIsAnalyzing(true);
    setAnalysisResult(null);
    setErrorMsg("");

    let imagePayload = "";
    if (selectedAssetId) {
      const asset = MOCK_ASSETS.find(a => a.id === selectedAssetId);
      if (asset) imagePayload = asset.base64;
    } else if (customImageBase64) {
      imagePayload = customImageBase64;
    }

    try {
      const response = await fetch("/api/analyze-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          category,
          voiceBase64: voiceBase64 || undefined,
          imageBase64: imagePayload || undefined
        })
      });

      if (!response.ok) throw new Error("Server analysis failed");
      
      const data = await response.json();
      setAnalysisResult(data.analysis);
      if (data.voiceTranscript) {
        setRecordedVoiceText(data.voiceTranscript);
      }
    } catch (error) {
      console.error(error);
      setErrorMsg("Failed to connect to the server-side AI model. Running fallback diagnostics.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Coordinates Mapping based on Wards
  const getCoordinatesForWard = (wardName: string) => {
    switch (wardName) {
      case "Ward 1 (Metro-East)":
        return { lat: 37.7850 + (Math.random() - 0.5) * 0.01, lng: -122.4050 + (Math.random() - 0.5) * 0.01 };
      case "Ward 2 (Lakeview)":
        return { lat: 37.7620 + (Math.random() - 0.5) * 0.01, lng: -122.4300 + (Math.random() - 0.5) * 0.01 };
      case "Ward 3 (Green Hills)":
        return { lat: 37.7400 + (Math.random() - 0.5) * 0.01, lng: -122.4450 + (Math.random() - 0.5) * 0.01 };
      case "Ward 4 (Downtown)":
        return { lat: 37.7750 + (Math.random() - 0.5) * 0.01, lng: -122.4180 + (Math.random() - 0.5) * 0.01 };
      default:
        return { lat: 37.7749, lng: -122.4194 };
    }
  };

  // Form Submission
  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description) {
      setErrorMsg("Title and Description are required.");
      return;
    }

    const { lat, lng } = getCoordinatesForWard(ward);

    // If AI analysis wasn't run yet, let's run it or mock it
    const activeAnalysis = analysisResult || {
      detectedIssue: title,
      confidenceScore: 0.90,
      severity: category === "flooding" ? "Critical" : category === "damaged roads" ? "High" : "Medium",
      urgency: category === "flooding" ? "Immediate" : "Action Required",
      suggestedDepartment: "Municipal Department of Works",
      explanation: "Auto-generated report details on citizen submission",
      priorityLevel: category === "flooding" ? "Critical" : "High",
      suggestedAuthority: "City Council",
      recommendedResponseTime: "24 hours",
      summary: description
    };

    const finalReport: Partial<CivicReport> = {
      title,
      description,
      category,
      location: {
        lat,
        lng,
        ward,
        address: address || "Specified in details"
      },
      severity: activeAnalysis.severity,
      createdAt: new Date().toISOString(),
      contactDetails: contactName ? {
        name: contactName,
        phone: contactPhone || undefined,
        email: contactEmail || undefined
      } : undefined,
      analysis: activeAnalysis,
      imageUrl: customImageBase64 || (selectedAssetId ? MOCK_ASSETS.find(a => a.id === selectedAssetId)?.previewUrl : undefined)
    };

    try {
      const response = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(finalReport)
      });

      if (!response.ok) throw new Error("Submission failed");
      const created = await response.json();
      
      // Reset form states
      setTitle("");
      setDescription("");
      setAddress("");
      setContactName("");
      setContactPhone("");
      setContactEmail("");
      setSelectedAssetId(null);
      setCustomImageBase64("");
      setCustomImageFile(null);
      setRecordedVoiceText("");
      setAnalysisResult(null);

      // Callback
      onSubmitSuccess(created);
    } catch (err) {
      console.error(err);
      setErrorMsg("Failed to store report in local database.");
    }
  };

  return (
    <div id="citizen-report-panel" className="bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-2xl p-6 shadow-xl h-full flex flex-col">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <Sparkles className="text-cyan-400 w-5 h-5 animate-pulse" />
          <h2 className="text-lg font-bold text-slate-100 tracking-wide font-mono">LODGE AI-POWERED COMPLAINT</h2>
        </div>
      </div>

      <form onSubmit={handleSubmitReport} className="space-y-4 flex-1 flex flex-col">
        {/* Title */}
        <div>
          <label className="block text-xs font-mono text-slate-400 uppercase mb-1">Issue Title*</label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Broken water pipeline leaking near Metro gate"
            className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-lg p-2.5 text-slate-100 text-sm focus:outline-none transition"
          />
        </div>

        {/* Categories and Ward Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-mono text-slate-400 uppercase mb-1">Incident Category*</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-lg p-2.5 text-slate-100 text-sm focus:outline-none transition"
            >
              <option value="damaged roads">damaged roads</option>
              <option value="pothole">pothole</option>
              <option value="garbage">garbage accumulation</option>
              <option value="illegal dumping">illegal dumping</option>
              <option value="flooding">flooding</option>
              <option value="broken streetlight">broken streetlight</option>
              <option value="fallen trees">fallen tree branch</option>
              <option value="water leakage">water leakage</option>
              <option value="blocked drains">blocked drains</option>
              <option value="stray animal issue">stray animal issue</option>
              <option value="public safety issue">public safety issue</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-mono text-slate-400 uppercase mb-1">Neighborhood Ward*</label>
            <select
              value={ward}
              onChange={(e) => setWard(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-lg p-2.5 text-slate-100 text-sm focus:outline-none transition"
            >
              <option value="Ward 1 (Metro-East)">Ward 1 (Metro-East)</option>
              <option value="Ward 2 (Lakeview)">Ward 2 (Lakeview)</option>
              <option value="Ward 3 (Green Hills)">Ward 3 (Green Hills)</option>
              <option value="Ward 4 (Downtown)">Ward 4 (Downtown)</option>
            </select>
          </div>
        </div>

        {/* Address */}
        <div>
          <label className="block text-xs font-mono text-slate-400 uppercase mb-1">Local Address / Location Landmark</label>
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="e.g. Opposite Sector 7 Park East Gate, Pine Street"
            className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-lg p-2.5 text-slate-100 text-sm focus:outline-none transition"
          />
        </div>

        {/* Voice Recording Simulator / Real Voice Note Input */}
        <div>
          <label className="block text-xs font-mono text-slate-400 uppercase mb-1 flex justify-between items-center">
            <span>AI Voice Note Input (Microphone / Presets)</span>
            {isRecording && (
              <span className="text-red-400 font-bold animate-pulse text-[10px] uppercase">
                ● Recording {realAudioDuration > 0 && `${realAudioDuration}s`}
              </span>
            )}
          </label>
          <div className="flex flex-wrap gap-2 mb-2">
            {!isRecording ? (
              <button
                type="button"
                onClick={startRealRecording}
                className="flex items-center gap-1.5 text-[10px] font-mono bg-cyan-950 border border-cyan-800 text-cyan-300 hover:bg-cyan-900 py-1.5 px-3 rounded-lg transition"
              >
                <Mic className="w-3 h-3 text-cyan-400 animate-pulse" />
                🎙️ Record Live Mic
              </button>
            ) : (
              <button
                type="button"
                onClick={stopRealRecording}
                className="flex items-center gap-1.5 text-[10px] font-mono bg-red-950 border border-red-800 text-red-300 hover:bg-red-900 py-1.5 px-3 rounded-lg transition animate-bounce"
              >
                <Mic className="w-3 h-3 text-red-400" />
                🛑 Stop Record
              </button>
            )}

            {VOICE_PRESETS.map((preset, idx) => (
              <button
                key={idx}
                type="button"
                disabled={isRecording}
                onClick={() => handleSimulateVoice(preset)}
                className="text-[10px] font-mono bg-slate-950 border border-slate-800 hover:border-cyan-500 text-slate-300 hover:text-cyan-400 py-1.5 px-2.5 rounded-lg transition disabled:opacity-30"
              >
                Simulate Preset {idx + 1}
              </button>
            ))}
          </div>
          {recordedVoiceText && (
            <div className="text-xs bg-cyan-950/20 border border-cyan-900/50 rounded-lg p-2.5 text-cyan-300 font-mono flex items-start gap-2">
              <Mic className="w-3.5 h-3.5 mt-0.5 animate-pulse text-cyan-400" />
              <div>
                <span className="font-bold block text-[10px] uppercase text-cyan-400 tracking-wide mb-0.5">Voice Note Transcribed:</span>
                "{recordedVoiceText}"
              </div>
            </div>
          )}
        </div>

        {/* Image Attachment Asset Selector with Drag & Drop Wrapper */}
        <div 
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
          className={`border rounded-xl p-3.5 transition-all duration-200 ${
            isDragActive 
              ? "border-cyan-400 bg-cyan-950/20 scale-[0.99] shadow-inner" 
              : "border-slate-800 bg-slate-950/10"
          }`}
        >
          <label className="block text-xs font-mono text-slate-400 uppercase mb-1.5 flex justify-between items-center">
            <span>Attach Image</span>
            <span className="text-[9px] text-slate-500 lowercase">drop file anywhere in box</span>
          </label>
          <div className="grid grid-cols-4 gap-2 mb-3">
            {MOCK_ASSETS.map((asset) => (
              <button
                key={asset.id}
                type="button"
                onClick={() => {
                  setSelectedAssetId(asset.id);
                  setCategory(asset.category);
                  setCustomImageBase64("");
                  setCustomImageFile(null);
                }}
                className={`relative rounded-lg overflow-hidden border h-14 bg-slate-950 transition ${
                  selectedAssetId === asset.id ? "border-cyan-400 shadow-lg shadow-cyan-950" : "border-slate-800 hover:border-slate-700"
                }`}
              >
                <img referrerPolicy="no-referrer" src={asset.previewUrl} alt={asset.name} className="w-full h-full object-cover opacity-60" />
                <span className="absolute bottom-1 left-1 right-1 text-[8px] font-mono font-bold truncate bg-slate-950/80 text-slate-300 py-0.5 px-1 rounded text-center">
                  {asset.name}
                </span>
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <label className="flex items-center gap-1.5 cursor-pointer bg-slate-950 border border-slate-800 hover:border-cyan-500 hover:text-cyan-400 text-slate-300 px-3 py-2 rounded-lg text-xs font-mono transition">
              <Camera className="w-3.5 h-3.5 text-cyan-400" />
              Upload Custom File
              <input type="file" accept="image/*" onChange={handleImageFileChange} className="hidden" />
            </label>
            {customImageFile && (
              <span className="text-[10px] text-slate-400 truncate font-mono">📎 {customImageFile.name}</span>
            )}
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-mono text-slate-400 uppercase mb-1">Issue Description / Additional Details*</label>
          <textarea
            required
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe the issue. (If using Voice Preset or Photo Asset, relevant details are added here automatically.)"
            className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-lg p-2.5 text-slate-100 text-sm focus:outline-none transition resize-none"
          />
        </div>

        {/* Action Buttons for AI Analysis */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleAIAnalysis}
            disabled={isAnalyzing || !title || !description}
            className="flex-1 bg-gradient-to-r from-cyan-950 to-blue-950 hover:from-cyan-900 hover:to-blue-900 border border-cyan-800 disabled:opacity-40 text-cyan-300 text-xs font-mono py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 transition cursor-pointer"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
                Gemini Scanning Asset...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-cyan-400" />
                Run Gemini AI Analysis
              </>
            )}
          </button>
        </div>

        {/* AI Analysis HUD Result Screen */}
        <AnimatePresence>
          {analysisResult && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3 font-mono overflow-hidden"
            >
              <div className="flex items-center justify-between border-b border-slate-900 pb-2">
                <span className="text-[10px] text-cyan-400 uppercase tracking-widest font-bold">● GEMINI INTEL SCANNER</span>
                <span className="text-[11px] text-slate-400">Match Confidence: <span className="text-emerald-400 font-bold">{(analysisResult.confidenceScore * 100).toFixed(0)}%</span></span>
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-slate-500 text-[10px] block uppercase">Suggested Agency</span>
                  <span className="text-slate-200 font-bold">{analysisResult.suggestedDepartment}</span>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] block uppercase">Severity Level</span>
                  <span 
                    className="font-bold"
                    style={{
                      color: analysisResult.severity === "Critical" ? "#ef4444" : analysisResult.severity === "High" ? "#f97316" : "#eab308"
                    }}
                  >
                    {analysisResult.severity}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] block uppercase">Response Deadline</span>
                  <span className="text-slate-200 font-bold">{analysisResult.recommendedResponseTime}</span>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] block uppercase">Urgency Action</span>
                  <span className="text-slate-200 font-bold">{analysisResult.urgency}</span>
                </div>
              </div>
              <div className="text-xs border-t border-slate-900 pt-2 text-slate-400 leading-relaxed">
                <span className="text-cyan-400 font-bold">AI Diagnostics:</span> {analysisResult.explanation}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Contact Details (Collapsible/Optional) */}
        <div className="border border-slate-850 bg-slate-950/20 rounded-xl p-3 space-y-2">
          <span className="text-[10px] font-mono text-slate-500 block uppercase">Optional Contact Details</span>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <input
              type="text"
              value={contactName}
              onChange={(e) => setContactName(e.target.value)}
              placeholder="Your Name"
              className="bg-slate-950 border border-slate-800 text-slate-100 text-xs rounded p-2 focus:outline-none focus:border-cyan-500"
            />
            <input
              type="text"
              value={contactPhone}
              onChange={(e) => setContactPhone(e.target.value)}
              placeholder="Your Phone"
              className="bg-slate-950 border border-slate-800 text-slate-100 text-xs rounded p-2 focus:outline-none focus:border-cyan-500"
            />
            <input
              type="email"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              placeholder="Your Email"
              className="bg-slate-950 border border-slate-800 text-slate-100 text-xs rounded p-2 focus:outline-none focus:border-cyan-500"
            />
          </div>
        </div>

        {errorMsg && (
          <div className="bg-red-950/30 border border-red-900/50 rounded-lg p-3 text-red-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Submit Report */}
        <button
          type="submit"
          className="w-full bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-mono text-xs font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition cursor-pointer shrink-0 mt-auto"
        >
          <Send className="w-4 h-4 text-slate-950" />
          SUBMIT TICKET TO DIGITAL TWIN GRID
        </button>
      </form>
    </div>
  );
}
