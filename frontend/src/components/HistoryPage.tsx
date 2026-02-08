import { useState } from "react";
import { RefreshCw, FileDown, FileSpreadsheet, Search } from "lucide-react";
import { toast } from "sonner@2.0.3";

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
  const [history] = useState<HistoryItem[]>([
    {
      id: "1",
      timestamp: "2026-02-08 14:32:15",
      domain: "example.com",
      status: "secure",
      grade: "A+",
      issuer: "Let's Encrypt",
      expiryDate: "Mar 15, 2026"
    },
    {
      id: "2",
      timestamp: "2026-02-08 14:30:42",
      domain: "testsite.io",
      status: "secure",
      grade: "A",
      issuer: "DigiCert Inc",
      expiryDate: "Apr 22, 2026"
    },
    {
      id: "3",
      timestamp: "2026-02-08 14:28:19",
      domain: "oldsite.net",
      status: "warning",
      grade: "B",
      issuer: "Comodo RSA",
      expiryDate: "Feb 28, 2026"
    },
    {
      id: "4",
      timestamp: "2026-02-08 14:25:03",
      domain: "expired-domain.com",
      status: "expired",
      grade: "F",
      issuer: "GlobalSign",
      expiryDate: "Jan 10, 2026"
    },
    {
      id: "5",
      timestamp: "2026-02-08 14:20:37",
      domain: "secureshop.com",
      status: "secure",
      grade: "A+",
      issuer: "Amazon Trust Services",
      expiryDate: "Jun 30, 2026"
    },
    {
      id: "6",
      timestamp: "2026-02-08 13:45:22",
      domain: "myapp.dev",
      status: "secure",
      grade: "A",
      issuer: "Let's Encrypt",
      expiryDate: "May 18, 2026"
    },
    {
      id: "7",
      timestamp: "2026-02-08 13:30:11",
      domain: "legacy-site.org",
      status: "warning",
      grade: "C",
      issuer: "GeoTrust",
      expiryDate: "Feb 20, 2026"
    },
    {
      id: "8",
      timestamp: "2026-02-08 12:15:44",
      domain: "secure-api.com",
      status: "secure",
      grade: "A+",
      issuer: "DigiCert Inc",
      expiryDate: "Jul 30, 2026"
    }
  ]);

  const handleRefresh = () => {
    toast.success("History refreshed");
    // In a real app, this would fetch fresh data from the server
  };

  const handleExportPDF = () => {
    // Mock PDF export
    const csvContent = filteredHistory.map(item => 
      `${item.timestamp},${item.domain},${item.status},${item.grade},${item.issuer},${item.expiryDate}`
    ).join('\n');
    
    toast.success("Exporting to PDF...");
    setTimeout(() => {
      toast.success(`PDF report exported successfully! (${filteredHistory.length} records)`);
    }, 1500);
  };

  const handleExportExcel = () => {
    // Mock Excel export
    const csvContent = "Timestamp,Domain,Status,Grade,Issuer,Expiry Date\n" + 
      filteredHistory.map(item => 
        `${item.timestamp},${item.domain},${item.status},${item.grade},${item.issuer},${item.expiryDate}`
      ).join('\n');
    
    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ciphercert-history-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    
    toast.success(`Excel file exported successfully! (${filteredHistory.length} records)`);
  };

  const filteredHistory = history.filter(item =>
    item.domain.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.issuer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "secure":
        return (
          <span 
            className="px-3 py-1 rounded-full text-xs font-semibold"
            style={{
              backgroundColor: "rgba(34, 211, 238, 0.2)",
              color: "#22D3EE",
              border: "1px solid rgba(34, 211, 238, 0.3)"
            }}
          >
            ✓ Secure
          </span>
        );
      case "warning":
        return (
          <span 
            className="px-3 py-1 rounded-full text-xs font-semibold"
            style={{
              backgroundColor: "rgba(251, 191, 36, 0.2)",
              color: "#FBBf24",
              border: "1px solid rgba(251, 191, 36, 0.3)"
            }}
          >
            ⚠ Warning
          </span>
        );
      case "expired":
        return (
          <span 
            className="px-3 py-1 rounded-full text-xs font-semibold"
            style={{
              backgroundColor: "rgba(239, 68, 68, 0.2)",
              color: "#EF4444",
              border: "1px solid rgba(239, 68, 68, 0.3)"
            }}
          >
            ✕ Expired
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
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
            Scan History
          </h1>
          <p style={{ color: isDark ? "#64748B" : "#94A3B8" }}>
            View all previously scanned domains and certificates
          </p>
        </div>
        
        <div className="flex gap-3">
          <button
            onClick={handleRefresh}
            className="px-4 py-2 rounded-xl font-semibold transition-all duration-300 hover:scale-105 flex items-center gap-2"
            style={{
              background: isDark 
                ? "rgba(34, 211, 238, 0.1)" 
                : "rgba(8, 145, 178, 0.1)",
              color: "#22D3EE",
              border: "1px solid rgba(34, 211, 238, 0.3)"
            }}
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
          <button
            onClick={handleExportExcel}
            className="px-4 py-2 rounded-xl font-semibold transition-all duration-300 hover:scale-105 flex items-center gap-2"
            style={{
              background: "linear-gradient(135deg, #10B981, #059669)",
              color: "#FFFFFF",
              boxShadow: "0 0 20px rgba(16, 185, 129, 0.3)"
            }}
          >
            <FileSpreadsheet className="w-4 h-4" />
            Excel
          </button>
          <button
            onClick={handleExportPDF}
            className="px-4 py-2 rounded-xl font-semibold transition-all duration-300 hover:scale-105 flex items-center gap-2"
            style={{
              background: "linear-gradient(135deg, #EF4444, #DC2626)",
              color: "#FFFFFF",
              boxShadow: "0 0 20px rgba(239, 68, 68, 0.3)"
            }}
          >
            <FileDown className="w-4 h-4" />
            PDF
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div 
        className="flex items-center gap-3 px-6 py-4 rounded-2xl border"
        style={{
          background: isDark 
            ? "rgba(15, 23, 42, 0.5)" 
            : "rgba(255, 255, 255, 0.5)",
          backdropFilter: "blur(20px)",
          borderColor: isDark ? "rgba(34, 211, 238, 0.2)" : "rgba(8, 145, 178, 0.2)"
        }}
      >
        <Search className="w-5 h-5" style={{ color: "#22D3EE" }} />
        <input
          type="text"
          placeholder="Search by domain or issuer..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1 bg-transparent outline-none border-none"
          style={{ 
            color: isDark ? "#FFFFFF" : "#0F172A",
            fontFamily: "'JetBrains Mono', monospace"
          }}
        />
      </div>

      {/* History Table */}
      <div 
        className="rounded-2xl border overflow-hidden"
        style={{
          background: isDark 
            ? "rgba(15, 23, 42, 0.5)" 
            : "rgba(255, 255, 255, 0.5)",
          backdropFilter: "blur(20px)",
          borderColor: isDark ? "rgba(34, 211, 238, 0.2)" : "rgba(8, 145, 178, 0.2)"
        }}
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr 
                style={{
                  backgroundColor: isDark ? "rgba(15, 23, 42, 0.8)" : "rgba(248, 250, 252, 0.8)",
                  borderBottom: isDark ? "1px solid #1E293B" : "1px solid #E2E8F0"
                }}
              >
                <th className="px-6 py-4 text-left text-sm font-semibold" style={{ color: isDark ? "#94A3B8" : "#64748B" }}>
                  Timestamp
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold" style={{ color: isDark ? "#94A3B8" : "#64748B" }}>
                  Domain
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold" style={{ color: isDark ? "#94A3B8" : "#64748B" }}>
                  Status
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold" style={{ color: isDark ? "#94A3B8" : "#64748B" }}>
                  Grade
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold" style={{ color: isDark ? "#94A3B8" : "#64748B" }}>
                  Issuer
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold" style={{ color: isDark ? "#94A3B8" : "#64748B" }}>
                  Expiry Date
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredHistory.map((item, index) => (
                <tr 
                  key={item.id}
                  className="transition-all duration-200 hover:bg-opacity-50"
                  style={{
                    backgroundColor: index % 2 === 0 
                      ? (isDark ? "rgba(15, 23, 42, 0.3)" : "rgba(248, 250, 252, 0.3)")
                      : "transparent",
                    borderBottom: isDark ? "1px solid #1E293B" : "1px solid #E2E8F0"
                  }}
                >
                  <td className="px-6 py-4 font-mono text-sm" style={{ color: isDark ? "#64748B" : "#94A3B8" }}>
                    {item.timestamp}
                  </td>
                  <td className="px-6 py-4 font-medium" style={{ 
                    color: isDark ? "#FFFFFF" : "#0F172A",
                    fontFamily: "'JetBrains Mono', monospace"
                  }}>
                    {item.domain}
                  </td>
                  <td className="px-6 py-4">
                    {getStatusBadge(item.status)}
                  </td>
                  <td className="px-6 py-4">
                    <span 
                      className="px-3 py-1 rounded-lg font-bold"
                      style={{
                        backgroundColor: item.grade.includes("A") ? "rgba(34, 211, 238, 0.2)" : "rgba(239, 68, 68, 0.2)",
                        color: item.grade.includes("A") ? "#22D3EE" : "#EF4444"
                      }}
                    >
                      {item.grade}
                    </span>
                  </td>
                  <td className="px-6 py-4" style={{ color: isDark ? "#94A3B8" : "#64748B" }}>
                    {item.issuer}
                  </td>
                  <td className="px-6 py-4" style={{ color: isDark ? "#94A3B8" : "#64748B" }}>
                    {item.expiryDate}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination or Stats */}
        <div 
          className="px-6 py-4 flex items-center justify-between"
          style={{
            backgroundColor: isDark ? "rgba(15, 23, 42, 0.8)" : "rgba(248, 250, 252, 0.8)",
            borderTop: isDark ? "1px solid #1E293B" : "1px solid #E2E8F0"
          }}
        >
          <p className="text-sm" style={{ color: isDark ? "#64748B" : "#94A3B8" }}>
            Showing {filteredHistory.length} of {history.length} scans
          </p>
          <div className="flex gap-2">
            {[1, 2, 3].map(page => (
              <button
                key={page}
                className="w-8 h-8 rounded-lg transition-all duration-200"
                style={{
                  backgroundColor: page === 1 
                    ? "rgba(34, 211, 238, 0.2)"
                    : (isDark ? "rgba(30, 41, 59, 0.5)" : "rgba(226, 232, 240, 0.5)"),
                  color: page === 1 ? "#22D3EE" : (isDark ? "#94A3B8" : "#64748B"),
                  border: page === 1 ? "1px solid rgba(34, 211, 238, 0.3)" : "none"
                }}
              >
                {page}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}