import { useState, useEffect } from "react";
import { RefreshCw, FileDown, FileSpreadsheet, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface HistoryItem {
  id: string;
  timestamp: string;
  domain: string;
  status: "secure" | "warning" | "expired";
  grade: string;
  issuer: string;
  expiryDate: string;
}

interface HistoryPageProps {
  isDark: boolean;
}

export function HistoryPage({ isDark }: HistoryPageProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(false);

  // --- Fetch Data ---
  const fetchHistory = async (showToast = false) => {
    setLoading(true);
    try {
      const response = await fetch("http://127.0.0.1:8000/api/history");
      if (response.ok) {
        const data = await response.json();
        setHistory(data);
        // Only show toast if explicitly requested (e.g., manual refresh), not on initial load
        if (showToast) {
            toast.success("History updated");
        }
      } else {
        toast.error("Failed to load history");
      }
    } catch (error) {
      console.error("History fetch error:", error);
      toast.error("Could not connect to backend");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory(false); // Pass false so it doesn't pop up on page load
  }, []);

  const handleRefresh = () => {
    fetchHistory(true); // Pass true to show "History Updated" on manual click
  };

  // --- Clear History ---
  const handleClearHistory = async () => {
    if (!confirm("Are you sure you want to delete ALL scan history? This cannot be undone.")) return;

    try {
      const response = await fetch("http://127.0.0.1:8000/api/history", {
        method: "DELETE"
      });
      if (response.ok) {
        setHistory([]);
        toast.success("History cleared successfully");
      } else {
        toast.error("Failed to clear history");
      }
    } catch (error) {
      toast.error("Error connecting to server");
    }
  };

  // --- Export Excel (CSV) ---
  const handleExportExcel = () => {
    if (history.length === 0) {
      toast.error("No data to export");
      return;
    }

    const headers = ["ID", "Domain", "Status", "Grade", "Issuer", "Expiry Date", "Timestamp"];
    const csvContent = [
      headers.join(","),
      ...history.map(item => [
        item.id,
        item.domain,
        item.status,
        item.grade,
        `"${item.issuer}"`, 
        item.expiryDate,
        item.timestamp
      ].join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `scan_history_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Exported to Excel (CSV)");
  };

  // --- Export PDF (Print) ---
  const handleExportPDF = () => {
    window.print();
  };

  const filteredHistory = history.filter(item =>
    (item.domain?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
    (item.issuer?.toLowerCase() || "").includes(searchQuery.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "secure":
        return <span className="px-3 py-1 rounded-full text-xs font-semibold" style={{ backgroundColor: "rgba(34, 211, 238, 0.2)", color: "#22D3EE", border: "1px solid rgba(34, 211, 238, 0.3)" }}>✓ Secure</span>;
      case "warning":
        return <span className="px-3 py-1 rounded-full text-xs font-semibold" style={{ backgroundColor: "rgba(251, 191, 36, 0.2)", color: "#FBBf24", border: "1px solid rgba(251, 191, 36, 0.3)" }}>⚠ Warning</span>;
      case "expired":
        return <span className="px-3 py-1 rounded-full text-xs font-semibold" style={{ backgroundColor: "rgba(239, 68, 68, 0.2)", color: "#EF4444", border: "1px solid rgba(239, 68, 68, 0.3)" }}>✕ Expired</span>;
      default:
        return <span className="px-3 py-1 rounded-full text-xs font-semibold bg-gray-500/20 text-gray-400 border border-gray-500/30">? Unknown</span>;
    }
  };

  return (
    <div className="p-8 space-y-8">
      {/* Styles for Printing */}
      <style>
        {`
          @media print {
            .no-print, aside, button, input { display: none !important; }
            .printable-table { width: 100% !important; overflow: visible !important; }
            body, div, table, th, td { 
              background-color: white !important; 
              color: black !important; 
              border-color: #ddd !important;
            }
            .fixed.inset-0 { display: none !important; }
          }
        `}
      </style>

      {/* Header */}
      <div className="flex items-start justify-between no-print">
        <div>
          <h1 className="mb-2" style={{ color: isDark ? "#FFFFFF" : "#0F172A", fontSize: "36px", fontWeight: "bold", fontFamily: "'JetBrains Mono', monospace" }}>
            Scan History
          </h1>
          <p style={{ color: isDark ? "#64748B" : "#94A3B8" }}>
            View all previously scanned domains and certificates
          </p>
        </div>
        
        <div className="flex gap-3">
          <button
            onClick={handleExportExcel}
            className="px-4 py-2 rounded-xl font-semibold transition-all duration-300 hover:scale-105 flex items-center gap-2"
            style={{
              background: isDark ? "rgba(34, 211, 238, 0.1)" : "rgba(8, 145, 178, 0.1)",
              color: "#22D3EE",
              border: "1px solid rgba(34, 211, 238, 0.3)"
            }}
          >
            <FileSpreadsheet className="w-4 h-4" />
            Excel
          </button>

          <button
            onClick={handleExportPDF}
            className="px-4 py-2 rounded-xl font-semibold transition-all duration-300 hover:scale-105 flex items-center gap-2"
            style={{
              background: isDark ? "rgba(34, 211, 238, 0.1)" : "rgba(8, 145, 178, 0.1)",
              color: "#22D3EE",
              border: "1px solid rgba(34, 211, 238, 0.3)"
            }}
          >
            <FileDown className="w-4 h-4" />
            PDF
          </button>

          <button
            onClick={handleClearHistory}
            className="px-4 py-2 rounded-xl font-semibold transition-all duration-300 hover:scale-105 flex items-center gap-2"
            style={{
              background: "rgba(239, 68, 68, 0.1)",
              color: "#EF4444",
              border: "1px solid rgba(239, 68, 68, 0.3)"
            }}
          >
            <Trash2 className="w-4 h-4" />
            Clear
          </button>

          <button
            onClick={handleRefresh}
            disabled={loading}
            className="px-4 py-2 rounded-xl font-semibold transition-all duration-300 hover:scale-105 flex items-center gap-2"
            style={{
              background: isDark ? "rgba(34, 211, 238, 0.1)" : "rgba(8, 145, 178, 0.1)",
              color: "#22D3EE",
              border: "1px solid rgba(34, 211, 238, 0.3)",
              opacity: loading ? 0.7 : 1
            }}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            {loading ? "Refreshing..." : "Refresh"}
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="flex items-center gap-3 px-6 py-4 rounded-2xl border no-print" style={{ background: isDark ?
        "rgba(15, 23, 42, 0.5)" : "rgba(255, 255, 255, 0.5)", backdropFilter: "blur(20px)", borderColor: isDark ?
        "rgba(34, 211, 238, 0.2)" : "rgba(8, 145, 178, 0.2)" }}>
        <Search className="w-5 h-5" style={{ color: "#22D3EE" }} />
        <input
          type="text"
          placeholder="Search by domain or issuer..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1 bg-transparent outline-none border-none"
          style={{ color: isDark ? "#FFFFFF" : "#0F172A", fontFamily: "'JetBrains Mono', monospace" }}
        />
      </div>

      {/* History Table */}
      <div className="printable-table rounded-2xl border overflow-hidden" style={{ background: isDark ?
        "rgba(15, 23, 42, 0.5)" : "rgba(255, 255, 255, 0.5)", backdropFilter: "blur(20px)", borderColor: isDark ?
        "rgba(34, 211, 238, 0.2)" : "rgba(8, 145, 178, 0.2)" }}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ backgroundColor: isDark ?
                "rgba(15, 23, 42, 0.8)" : "rgba(248, 250, 252, 0.8)", borderBottom: isDark ?
                "1px solid #1E293B" : "1px solid #E2E8F0" }}>
                <th className="px-6 py-4 text-left text-sm font-semibold" style={{ color: isDark ?
                  "#94A3B8" : "#64748B" }}>Timestamp</th>
                <th className="px-6 py-4 text-left text-sm font-semibold" style={{ color: isDark ?
                  "#94A3B8" : "#64748B" }}>Domain</th>
                <th className="px-6 py-4 text-left text-sm font-semibold" style={{ color: isDark ?
                  "#94A3B8" : "#64748B" }}>Status</th>
                <th className="px-6 py-4 text-left text-sm font-semibold" style={{ color: isDark ?
                  "#94A3B8" : "#64748B" }}>Grade</th>
                <th className="px-6 py-4 text-left text-sm font-semibold" style={{ color: isDark ?
                  "#94A3B8" : "#64748B" }}>Issuer</th>
                <th className="px-6 py-4 text-left text-sm font-semibold" style={{ color: isDark ?
                  "#94A3B8" : "#64748B" }}>Expiry Date</th>
              </tr>
            </thead>
            <tbody>
              {filteredHistory.length === 0 ?
                (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center" style={{ color: isDark ? "#64748B" : "#94A3B8" }}>
                      {loading ? "Loading history..." : "No scan history found."}
                    </td>
                  </tr>
                ) : (
                  filteredHistory.map((item, index) => (
                    <tr key={item.id || index} className="transition-all duration-200 hover:bg-opacity-50" style={{ backgroundColor: index % 2 === 0 ? (isDark ? "rgba(15, 23, 42, 0.3)" : "rgba(248, 250, 252, 0.3)") : "transparent", borderBottom: isDark ? "1px solid #1E293B" : "1px solid #E2E8F0" }}>
                      <td className="px-6 py-4 font-mono text-sm" style={{ color: isDark ? "#64748B" : "#94A3B8" }}>{item.timestamp}</td>
                      <td className="px-6 py-4 font-medium" style={{ color: isDark ? "#FFFFFF" : "#0F172A", fontFamily: "'JetBrains Mono', monospace" }}>{item.domain}</td>
                      <td className="px-6 py-4">{getStatusBadge(item.status)}</td>
                      <td className="px-6 py-4">
                        <span className="px-3 py-1 rounded-lg font-bold" style={{ backgroundColor: (item.grade ||
                          "").includes("A") ? "rgba(34, 211, 238, 0.2)" : "rgba(239, 68, 68, 0.2)", color: (item.grade || "").includes("A") ?
                          "#22D3EE" : "#EF4444" }}>
                          {item.grade}
                        </span>
                      </td>
                      <td className="px-6 py-4" style={{ color: isDark ?
                        "#94A3B8" : "#64748B" }}>{item.issuer}</td>
                      <td className="px-6 py-4" style={{ color: isDark ?
                        "#94A3B8" : "#64748B" }}>{item.expiryDate}</td>
                    </tr>
                  ))
                )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}