import { useState, useCallback } from "react";
import { Upload, FileText, X, Scan } from "lucide-react";
import { toast } from "sonner@2.0.3";

interface BulkScanPageProps {
  isDark: boolean;
}

export function BulkScanPage({ isDark }: BulkScanPageProps) {
  const [dragActive, setDragActive] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [scanning, setScanning] = useState(false);

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
        setUploadedFile(file);
        toast.success(`File "${file.name}" uploaded successfully`);
      } else {
        toast.error("Please upload a .txt file");
      }
    }
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setUploadedFile(file);
      toast.success(`File "${file.name}" uploaded successfully`);
    }
  };

  const handleRemoveFile = () => {
    setUploadedFile(null);
    toast.info("File removed");
  };

  const handleBulkScan = () => {
    if (!uploadedFile) {
      toast.error("Please upload a file first");
      return;
    }

    setScanning(true);
    toast.info("Starting bulk scan...");

    // Simulate scanning
    setTimeout(() => {
      setScanning(false);
      toast.success("Bulk scan completed! Check the History page for results.");
    }, 3000);
  };

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 
          className="mb-2"
          style={{ 
            color: isDark ? "#FFFFFF" : "#0F172A",
            fontSize: "36px",
            fontWeight: "bold",
            fontFamily: "'JetBrains Mono', monospace"
          }}
        >
          Bulk Scan
        </h1>
        <p style={{ color: isDark ? "#64748B" : "#94A3B8" }}>
          Upload a .txt file with domains or IP addresses (one per line) for batch scanning
        </p>
      </div>

      {/* Upload Area */}
      <div 
        className="rounded-2xl p-12 border-2 border-dashed transition-all duration-300 relative overflow-hidden"
        style={{
          background: dragActive
            ? (isDark ? "rgba(34, 211, 238, 0.1)" : "rgba(8, 145, 178, 0.1)")
            : (isDark ? "rgba(15, 23, 42, 0.5)" : "rgba(255, 255, 255, 0.5)"),
          backdropFilter: "blur(20px)",
          borderColor: dragActive 
            ? "#22D3EE"
            : (isDark ? "rgba(34, 211, 238, 0.2)" : "rgba(8, 145, 178, 0.2)")
        }}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        {!uploadedFile ? (
          <div className="text-center">
            <div 
              className="w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center"
              style={{
                background: "linear-gradient(135deg, rgba(34, 211, 238, 0.2), rgba(6, 182, 212, 0.2))",
                border: "2px solid rgba(34, 211, 238, 0.3)"
              }}
            >
              <Upload className="w-10 h-10" style={{ color: "#22D3EE" }} />
            </div>
            <h3 
              className="mb-2 font-bold"
              style={{ 
                color: isDark ? "#FFFFFF" : "#0F172A",
                fontSize: "20px"
              }}
            >
              Drop your file here
            </h3>
            <p className="mb-6" style={{ color: isDark ? "#64748B" : "#94A3B8" }}>
              or click to browse
            </p>
            <label>
              <input
                type="file"
                accept=".txt"
                onChange={handleFileInput}
                className="hidden"
              />
              <span 
                className="px-6 py-3 rounded-xl font-semibold cursor-pointer inline-block transition-all duration-300 hover:scale-105"
                style={{
                  background: "linear-gradient(135deg, #22D3EE, #06B6D4)",
                  color: "#0F172A",
                  boxShadow: "0 0 20px rgba(34, 211, 238, 0.3)"
                }}
              >
                Browse Files
              </span>
            </label>
            <p className="mt-4 text-sm" style={{ color: isDark ? "#64748B" : "#94A3B8" }}>
              Supported format: .txt (one domain per line)
            </p>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div 
                className="w-14 h-14 rounded-xl flex items-center justify-center"
                style={{
                  background: "rgba(34, 211, 238, 0.2)",
                  border: "1px solid rgba(34, 211, 238, 0.3)"
                }}
              >
                <FileText className="w-7 h-7" style={{ color: "#22D3EE" }} />
              </div>
              <div>
                <h4 
                  className="font-semibold"
                  style={{ color: isDark ? "#FFFFFF" : "#0F172A" }}
                >
                  {uploadedFile.name}
                </h4>
                <p className="text-sm" style={{ color: isDark ? "#64748B" : "#94A3B8" }}>
                  {(uploadedFile.size / 1024).toFixed(2)} KB
                </p>
              </div>
            </div>
            <button
              onClick={handleRemoveFile}
              className="p-2 rounded-lg transition-all duration-200"
              style={{
                backgroundColor: "rgba(239, 68, 68, 0.1)",
                color: "#EF4444"
              }}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>

      {/* Scan Button */}
      {uploadedFile && (
        <div className="flex justify-center">
          <button
            onClick={handleBulkScan}
            disabled={scanning}
            className="px-8 py-4 rounded-xl font-bold text-lg transition-all duration-300 hover:scale-105 flex items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              background: scanning 
                ? "linear-gradient(135deg, #64748B, #475569)"
                : "linear-gradient(135deg, #22D3EE, #06B6D4)",
              color: "#0F172A",
              boxShadow: "0 0 30px rgba(34, 211, 238, 0.4)"
            }}
          >
            <Scan className={`w-6 h-6 ${scanning ? "animate-spin" : ""}`} />
            {scanning ? "Scanning..." : "Start Bulk Scan"}
          </button>
        </div>
      )}

      {/* Instructions */}
      <div 
        className="rounded-2xl p-6 border"
        style={{
          background: isDark 
            ? "rgba(15, 23, 42, 0.5)" 
            : "rgba(255, 255, 255, 0.5)",
          backdropFilter: "blur(20px)",
          borderColor: isDark ? "rgba(34, 211, 238, 0.2)" : "rgba(8, 145, 178, 0.2)"
        }}
      >
        <h3 
          className="mb-4 font-bold"
          style={{ 
            color: isDark ? "#FFFFFF" : "#0F172A",
            fontSize: "18px"
          }}
        >
          File Format Instructions
        </h3>
        <div className="space-y-2">
          <div className="flex items-start gap-3">
            <span className="text-cyan-400">•</span>
            <p style={{ color: isDark ? "#94A3B8" : "#64748B" }}>
              Create a plain text file (.txt) with one domain or IP address per line
            </p>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-cyan-400">•</span>
            <p style={{ color: isDark ? "#94A3B8" : "#64748B" }}>
              Maximum file size: 10 MB
            </p>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-cyan-400">•</span>
            <p style={{ color: isDark ? "#94A3B8" : "#64748B" }}>
              Recommended: Up to 1000 domains per file for optimal performance
            </p>
          </div>
        </div>

        <div 
          className="mt-6 p-4 rounded-xl font-mono text-sm"
          style={{
            backgroundColor: isDark ? "#0F172A" : "#F8FAFC",
            color: isDark ? "#22D3EE" : "#0891B2",
            border: `1px solid ${isDark ? "#1E293B" : "#E2E8F0"}`
          }}
        >
          <div>example.com</div>
          <div>testsite.io</div>
          <div>192.168.1.1</div>
          <div>secureshop.com</div>
        </div>
      </div>
    </div>
  );
}
