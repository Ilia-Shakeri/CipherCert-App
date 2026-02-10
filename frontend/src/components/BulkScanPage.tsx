import { useState, useCallback } from "react";
import { Upload, FileText, X, Scan, CheckCircle2, Loader2, Check, XCircle } from "lucide-react";
import { toast } from "sonner";

interface BulkScanPageProps {
  isDark: boolean;
}

export function BulkScanPage({ isDark }: BulkScanPageProps) {
  const [dragActive, setDragActive] = useState(false);
  const [fileContent, setFileContent] = useState<string[]>([]);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  
  const [isScanning, setIsScanning] = useState(false);
  const [results, setResults] = useState<{ successful: string[], failed: string[] }>({ successful: [], failed: [] });
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [scanComplete, setScanComplete] = useState(false);

  // --- File Processing ---
  const processFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text
        .split(/\r?\n/)
        .map(line => line.trim())
        .filter(line => line.length > 0);

      if (lines.length === 0) {
        toast.error("File is empty or invalid!");
        return;
      }

      setFileContent(lines);
      setUploadedFile(file);
      setScanComplete(false);
      setResults({ successful: [], failed: [] });
      setProgress({ current: 0, total: lines.length });
      toast.success(`Found ${lines.length} targets in file.`);
    };
    reader.readAsText(file);
  };

  // --- Drag & Drop Handlers ---
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type === "text/plain" || file.name.endsWith(".txt")) {
        processFile(file);
      } else {
        toast.error("Please upload a .txt file");
      }
    }
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const handleRemoveFile = () => {
    setUploadedFile(null);
    setFileContent([]);
    setScanComplete(false);
    setResults({ successful: [], failed: [] });
    setProgress({ current: 0, total: 0 });
  };

  // --- Start Scan Logic ---
  const handleStartBulkScan = async () => {
    if (fileContent.length === 0) return;

    setIsScanning(true);
    setScanComplete(false);
    setResults({ successful: [], failed: [] });
    setProgress(prev => ({ ...prev, current: 0 }));

    toast.info("Starting bulk scan engine...");

    for (let i = 0; i < fileContent.length; i++) {
      const domain = fileContent[i];
      setProgress(prev => ({ ...prev, current: i + 1 }));

      try {
        const response = await fetch("http://127.0.0.1:8000/api/scan", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ domain: domain }),
        });

        if (response.ok) {
          setResults(prev => ({ ...prev, successful: [...prev.successful, domain] }));
        } else {
          setResults(prev => ({ ...prev, failed: [...prev.failed, domain] }));
        }
      } catch (error) {
        setResults(prev => ({ ...prev, failed: [...prev.failed, domain] }));
      }
    }

    setIsScanning(false);
    setScanComplete(true);
    toast.success(`Bulk scan finished!`);
  };

  const boxStyle = {
    background: isDark ? "rgba(15, 23, 42, 0.5)" : "rgba(255, 255, 255, 0.5)",
    backdropFilter: "blur(20px)",
    borderColor: isDark ? "rgba(34, 211, 238, 0.2)" : "rgba(8, 145, 178, 0.2)"
  };

  return (
    <div className="p-8 space-y-8 h-[calc(100vh-40px)] flex flex-col">
      <div>
        <h1 className="mb-2" style={{ color: isDark ? "#FFFFFF" : "#0F172A", fontSize: "36px", fontWeight: "bold", fontFamily: "'JetBrains Mono', monospace" }}>
          Bulk Scan
        </h1>
        <p style={{ color: isDark ? "#64748B" : "#94A3B8" }}>
          Upload a .txt file to scan multiple targets automatically.
        </p>
      </div>

      {/* --- Upload Section --- */}
      {!isScanning && !scanComplete && (
        <div 
          className="rounded-2xl p-12 border-2 border-dashed transition-all duration-300 relative overflow-hidden flex-1 flex flex-col justify-center"
          style={{
            ...boxStyle,
            background: dragActive
              ? (isDark ? "rgba(34, 211, 238, 0.1)" : "rgba(8, 145, 178, 0.1)")
              : boxStyle.background,
            borderColor: dragActive ? "#22D3EE" : boxStyle.borderColor
          }}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          {!uploadedFile ? (
            <div className="text-center">
              <div className="w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center"
                style={{ background: "linear-gradient(135deg, rgba(34, 211, 238, 0.2), rgba(6, 182, 212, 0.2))", border: "2px solid rgba(34, 211, 238, 0.3)" }}>
                <Upload className="w-10 h-10" style={{ color: "#22D3EE" }} />
              </div>
              <h3 className="mb-2 font-bold" style={{ color: isDark ? "#FFFFFF" : "#0F172A", fontSize: "20px" }}>
                Drop your list here
              </h3>
              <p className="mb-6" style={{ color: isDark ? "#64748B" : "#94A3B8" }}>
                .txt files only (one domain/IP per line)
              </p>
              <label>
                <input type="file" accept=".txt" onChange={handleFileInput} className="hidden" />
                <span className="px-6 py-3 rounded-xl font-semibold cursor-pointer inline-block transition-all duration-300 hover:scale-105"
                  style={{ background: "linear-gradient(135deg, #22D3EE, #06B6D4)", color: "#0F172A", boxShadow: "0 0 20px rgba(34, 211, 238, 0.3)" }}>
                  Browse Files
                </span>
              </label>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-6">
              <div className="flex items-center justify-between w-full max-w-md p-4 rounded-xl border" 
                   style={{ borderColor: isDark ? "rgba(34, 211, 238, 0.2)" : "rgba(8, 145, 178, 0.2)", background: isDark ? "rgba(15, 23, 42, 0.8)" : "white" }}>
                <div className="flex items-center gap-4">
                  <FileText className="w-8 h-8" style={{ color: "#22D3EE" }} />
                  <div>
                    <h4 className="font-semibold" style={{ color: isDark ? "#FFFFFF" : "#0F172A" }}>{uploadedFile.name}</h4>
                    <p className="text-sm" style={{ color: isDark ? "#64748B" : "#94A3B8" }}>{fileContent.length} targets found</p>
                  </div>
                </div>
                <button onClick={handleRemoveFile} className="p-2 rounded-lg hover:bg-red-500/10 text-red-500 transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Preview List */}
              <div className="w-full max-w-md max-h-60 overflow-y-auto p-4 rounded-xl text-sm font-mono border"
                   style={{ background: isDark ? "rgba(0,0,0,0.3)" : "#F1F5F9", borderColor: isDark ? "#334155" : "#E2E8F0", color: isDark ? "#94A3B8" : "#475569" }}>
                {fileContent.map((d, i) => (
                  <div key={i} className="py-1 border-b border-dashed last:border-0 border-gray-500/20 text-center">
                    {d}
                  </div>
                ))}
              </div>

              <button onClick={handleStartBulkScan} className="px-8 py-4 rounded-xl font-bold text-lg transition-all hover:scale-105 flex items-center gap-3"
                style={{ background: "linear-gradient(135deg, #22D3EE, #06B6D4)", color: "#0F172A", boxShadow: "0 0 30px rgba(34, 211, 238, 0.4)" }}>
                <Scan className="w-6 h-6" /> Confirm & Start Scan
              </button>
            </div>
          )}
        </div>
      )}

      {/* --- Scanning State --- */}
      {isScanning && (
        <div className="rounded-2xl p-12 border text-center space-y-8 flex-1 flex flex-col justify-center" style={boxStyle}>
          <div className="relative w-32 h-32 mx-auto flex items-center justify-center">
            <Loader2 className="w-16 h-16 animate-spin" style={{ color: "#22D3EE" }} />
          </div>

          <div>
            <h2 className="text-2xl font-bold mb-2" style={{ color: isDark ? "#FFFFFF" : "#0F172A", fontFamily: "'JetBrains Mono', monospace" }}>
              Processing Bulk Scan...
            </h2>
            <p className="text-lg font-mono" style={{ color: isDark ? "#94A3B8" : "#64748B" }}>
              {progress.current} of {progress.total} processed
            </p>
          </div>

          <div className="w-full max-w-2xl mx-auto h-4 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700/50">
            <div className="h-full transition-all duration-300 ease-out relative"
                 style={{ width: `${(progress.current / progress.total) * 100}%`, background: "linear-gradient(90deg, #22D3EE, #06B6D4)" }}>
                 <div className="absolute inset-0 bg-white/30 animate-pulse"></div>   
            </div>
          </div>
        </div>
      )}

      {/* --- Scan Complete State --- */}
      {scanComplete && (
        <div className="rounded-2xl p-12 border text-center space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 flex-1 flex flex-col" style={boxStyle}>
          
          {/* Big Green Check - No Box, Force Green Color */}
          <div className="flex justify-center mb-6">
             <CheckCircle2 
                className="w-80 h-80 !text-green-500" 
                style={{ 
                    color: "#22c55e",
                    filter: "drop-shadow(0 0 25px rgba(34, 197, 94, 0.8))"
                }} 
             />
          </div>

          <div>
            <h2 className="text-4xl font-bold mb-3" style={{ color: isDark ? "#FFFFFF" : "#0F172A", fontFamily: "'JetBrains Mono', monospace" }}>
              Scan Completed!
            </h2>
            <p className="text-lg" style={{ color: isDark ? "#94A3B8" : "#64748B" }}>
              Processed all {progress.total} targets.
            </p>
          </div>

          {/* Results Boxes */}
          <div className="flex flex-col md:flex-row justify-center gap-6 max-w-5xl mx-auto w-full flex-1 min-h-0">
             
             {/* Successful Box */}
             <div className="flex-1 rounded-xl border overflow-hidden flex flex-col"
                  style={{ background: isDark ? "rgba(16, 185, 129, 0.05)" : "#F0FDF4", borderColor: "rgba(16, 185, 129, 0.3)" }}>
                <div className="p-4 border-b flex items-center justify-between" style={{ borderColor: "rgba(16, 185, 129, 0.2)" }}>
                   <div className="flex items-center gap-2">
                      <Check className="w-6 h-6" style={{ color: "#10B981", filter: "drop-shadow(0 0 8px rgba(16, 185, 129, 0.6))" }} />
                      <span className="font-bold text-xl" 
                            style={{ 
                                color: "#10B981", 
                                textShadow: "0 0 10px rgba(16, 185, 129, 0.6)" 
                            }}>
                            Successful
                      </span>
                   </div>
                   <span className="px-4 py-1 rounded-md text-lg font-bold"
                         style={{ 
                             backgroundColor: "rgba(16, 185, 129, 0.1)", 
                             color: "#10B981",
                             textShadow: "0 0 10px rgba(16, 185, 129, 0.6)",
                             border: "1px solid rgba(16, 185, 129, 0.2)"
                         }}>
                     {results.successful.length}
                   </span>
                </div>
                <div className="p-4 overflow-y-auto font-mono text-sm flex-1 flex flex-col items-center">
                   {results.successful.length > 0 ? (
                     results.successful.map((d, i) => (
                       <div key={i}     className="py-2 w-full text-center truncate font-bold text-lg"
                          style={{ color: isDark ? "#FFFFFF" : "#000000" }}>
                         {d}
                       </div>
                     ))
                   ) : (
                     <p className="opacity-50 py-4" style={{ color: "#10B981" }}>No successful scans</p>
                   )}
                </div>
             </div>

             {/* Failed Box */}
             <div className="flex-1 rounded-xl border overflow-hidden flex flex-col"
                  style={{ background: isDark ? "rgba(239, 68, 68, 0.05)" : "#FEF2F2", borderColor: "rgba(239, 68, 68, 0.3)" }}>
                <div className="p-4 border-b flex items-center justify-between" style={{ borderColor: "rgba(239, 68, 68, 0.2)" }}>
                   <div className="flex items-center gap-2">
                      <XCircle className="w-6 h-6" style={{ color: "#EF4444", filter: "drop-shadow(0 0 8px rgba(239, 68, 68, 0.6))" }} />
                      <span className="font-bold text-xl"
                            style={{ 
                                color: "#EF4444", 
                                textShadow: "0 0 10px rgba(239, 68, 68, 0.6)" 
                            }}>
                            Failed
                      </span>
                   </div>
                   <span className="px-4 py-1 rounded-md text-lg font-bold"
                         style={{ 
                             backgroundColor: "rgba(239, 68, 68, 0.1)", 
                             color: "#EF4444",
                             textShadow: "0 0 10px rgba(239, 68, 68, 0.6)",
                             border: "1px solid rgba(239, 68, 68, 0.2)"
                         }}>
                     {results.failed.length}
                   </span>
                </div>
                <div className="p-4 overflow-y-auto font-mono text-sm flex-1 flex flex-col items-center">
                   {results.failed.length > 0 ? (
                     results.failed.map((d, i) => (
                       <div key={i} className={`py-2 w-full text-center truncate font-bold text-lg ${isDark ? "text-white" : "text-black"}`}>
                         {d}
                       </div>
                     ))
                   ) : (
                     <p className="opacity-50 py-4" style={{ color: "#EF4444" }}>No failed scans</p>
                   )}
                </div>
             </div>

          </div>

          <div className="pt-4 pb-2">
            <button onClick={() => { setScanComplete(false); setUploadedFile(null); setFileContent([]); }}
              className="px-8 py-3 rounded-xl border font-semibold transition-all hover:scale-105 flex items-center gap-2 mx-auto"
              style={{ 
                background: isDark ? "rgba(255,255,255,0.05)" : "white",
                borderColor: isDark ? "rgba(255,255,255,0.2)" : "#E2E8F0", 
                color: isDark ? "#FFFFFF" : "#0F172A" 
              }}>
              <Upload className="w-5 h-5" />
              Scan New File
            </button>
          </div>
        </div>
      )}
    </div>
  );
}