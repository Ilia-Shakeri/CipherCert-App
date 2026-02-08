import { useState } from "react";
import { Search, Scan, Shield, AlertTriangle, TrendingUp } from "lucide-react";
import { StatusCard } from "./StatusCard";
import { toast } from "sonner"; // حذف ورژن @2.0.3 برای ایمنی import
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

// تعریف اینترفیس مطابق با خروجی API پایتون
interface DomainResult {
  id: string;
  status: "secure" | "warning" | "expired";
  domain: string;
  issuer: string;
  expiryDate: string;
  grade: string;
  score?: number;
}

interface DashboardPageProps {
  isDark: boolean;
}

export function DashboardPage({ isDark }: DashboardPageProps) {
  const [domainInput, setDomainInput] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [scannedDomains, setScannedDomains] = useState<DomainResult[]>([]);

  // دیتای چارت فعلاً استاتیک است (می‌توانید بعداً از هیستوری بگیرید)
  const chartData = [
    { month: "Jan", score: 85 },
    { month: "Feb", score: 88 },
    { month: "Mar", score: 82 },
    { month: "Apr", score: 90 },
    { month: "May", score: 87 },
    { month: "Jun", score: 92 },
    { month: "Jul", score: 95 }
  ];

  const handleScan = async () => {
    if (!domainInput.trim()) {
      toast.error("Please enter a domain or IP address");
      return;
    }
    
    setIsScanning(true);
    const toastId = toast.loading("Scanning domain...");

    try {
      // اتصال به API پایتون
      const response = await fetch("http://127.0.0.1:8000/api/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain: domainInput }),
      });

      if (!response.ok) throw new Error("Scan failed");

      const result: DomainResult = await response.json();
      
      setScannedDomains(prev => [result, ...prev]);
      setDomainInput("");
      toast.success(`Successfully scanned ${result.domain}`, { id: toastId });
      
    } catch (error) {
      console.error(error);
      toast.error("Error connecting to scan engine", { id: toastId });
    } finally {
      setIsScanning(false);
    }
  };

  const secureDomains = scannedDomains.filter(d => d.status === "secure").length;
  const expiredDomains = scannedDomains.filter(d => d.status === "expired").length;
  // محاسبه میانگین واقعی
  const avgScore = scannedDomains.length > 0 
    ? Math.round(scannedDomains.reduce((acc, curr) => acc + (curr.score || 0), 0) / scannedDomains.length)
    : 0;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "secure":
        return (
          <span className="px-3 py-1 rounded-full text-xs font-semibold" style={{ backgroundColor: "rgba(34, 211, 238, 0.2)", color: "#22D3EE", border: "1px solid rgba(34, 211, 238, 0.3)" }}>
            ● Secure
          </span>
        );
      case "warning":
        return (
          <span className="px-3 py-1 rounded-full text-xs font-semibold" style={{ backgroundColor: "rgba(251, 191, 36, 0.2)", color: "#FBBf24", border: "1px solid rgba(251, 191, 36, 0.3)" }}>
            ● Warning
          </span>
        );
      case "expired":
        return (
          <span className="px-3 py-1 rounded-full text-xs font-semibold" style={{ backgroundColor: "rgba(239, 68, 68, 0.2)", color: "#EF4444", border: "1px solid rgba(239, 68, 68, 0.3)" }}>
            ● Expired
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="p-8 space-y-8">
      {/* Header with Search */}
      <div className="space-y-6">
        <div>
          <h1 className="mb-2" style={{ color: isDark ? "#FFFFFF" : "#0F172A", fontSize: "36px", fontWeight: "bold", fontFamily: "'JetBrains Mono', monospace" }}>
            Dashboard
          </h1>
          <p style={{ color: isDark ? "#64748B" : "#94A3B8" }}>
            Real-time SSL certificate monitoring and domain intelligence
          </p>
        </div>

        {/* Search Bar */}
        <div className="flex items-center gap-3 px-6 py-4 rounded-2xl border relative overflow-hidden group"
             style={{ background: isDark ? "rgba(15, 23, 42, 0.5)" : "rgba(255, 255, 255, 0.5)", backdropFilter: "blur(20px)", borderColor: isDark ? "rgba(34, 211, 238, 0.2)" : "rgba(8, 145, 178, 0.2)" }}>
          <Search className="w-5 h-5 relative z-10" style={{ color: "#22D3EE" }} />
          <input
            type="text"
            placeholder="Enter Domain (e.g. google.com)..."
            value={domainInput}
            onChange={(e) => setDomainInput(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleScan()}
            disabled={isScanning}
            className="flex-1 bg-transparent outline-none border-none relative z-10"
            style={{ color: isDark ? "#FFFFFF" : "#0F172A", fontFamily: "'JetBrains Mono', monospace" }}
          />
          <button
            onClick={handleScan}
            disabled={isScanning}
            className="px-6 py-2 rounded-xl font-semibold transition-all duration-300 flex items-center gap-2 relative z-10 hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
            style={{ background: "linear-gradient(135deg, #22D3EE, #06B6D4)", color: "#0F172A", boxShadow: "0 0 20px rgba(34, 211, 238, 0.3)" }}
          >
            <Scan className={`w-4 h-4 ${isScanning ? "animate-spin" : ""}`} /> 
            {isScanning ? "SCANNING..." : "SCAN"}
          </button>
        </div>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-3 gap-6">
        <StatusCard title="Secure Domains" value={secureDomains} percentage={scannedDomains.length ? Math.round((secureDomains / scannedDomains.length) * 100) : 0} icon={Shield} color="#22D3EE" isDark={isDark} />
        <StatusCard title="Expired / Critical" value={expiredDomains} percentage={scannedDomains.length ? Math.round((expiredDomains / scannedDomains.length) * 100) : 0} icon={AlertTriangle} color="#EF4444" isDark={isDark} />
        <StatusCard title="Avg. Security Score" value={avgScore} percentage={avgScore} icon={TrendingUp} color="#10B981" isDark={isDark} />
      </div>

      {/* Chart & Table Area */}
      <div className="rounded-2xl p-6 border" style={{ background: isDark ? "rgba(15, 23, 42, 0.5)" : "rgba(255, 255, 255, 0.5)", backdropFilter: "blur(20px)", borderColor: isDark ? "rgba(34, 211, 238, 0.2)" : "rgba(8, 145, 178, 0.2)" }}>
        <h3 className="mb-4 font-bold" style={{ color: isDark ? "#FFFFFF" : "#0F172A", fontSize: "20px" }}>Security Score Trend</h3>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#22D3EE" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#22D3EE" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#1E293B" : "#E2E8F0"} />
            <XAxis dataKey="month" stroke={isDark ? "#64748B" : "#94A3B8"} />
            <YAxis stroke={isDark ? "#64748B" : "#94A3B8"} />
            <Tooltip contentStyle={{ backgroundColor: isDark ? "#0F172A" : "#FFFFFF", border: `1px solid ${isDark ? "#334155" : "#E2E8F0"}`, borderRadius: "12px", color: isDark ? "#FFFFFF" : "#0F172A" }} />
            <Area type="monotone" dataKey="score" stroke="#22D3EE" strokeWidth={3} fill="url(#colorScore)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Data Table */}
      <div className="rounded-2xl border overflow-hidden" style={{ background: isDark ? "rgba(15, 23, 42, 0.5)" : "rgba(255, 255, 255, 0.5)", backdropFilter: "blur(20px)", borderColor: isDark ? "rgba(34, 211, 238, 0.2)" : "rgba(8, 145, 178, 0.2)" }}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ backgroundColor: isDark ? "rgba(15, 23, 42, 0.8)" : "rgba(248, 250, 252, 0.8)", borderBottom: isDark ? "1px solid #1E293B" : "1px solid #E2E8F0" }}>
                <th className="px-6 py-4 text-left text-sm font-semibold" style={{ color: isDark ? "#94A3B8" : "#64748B" }}>Status</th>
                <th className="px-6 py-4 text-left text-sm font-semibold" style={{ color: isDark ? "#94A3B8" : "#64748B" }}>Domain Name</th>
                <th className="px-6 py-4 text-left text-sm font-semibold" style={{ color: isDark ? "#94A3B8" : "#64748B" }}>Issuer</th>
                <th className="px-6 py-4 text-left text-sm font-semibold" style={{ color: isDark ? "#94A3B8" : "#64748B" }}>Expiry Date</th>
                <th className="px-6 py-4 text-left text-sm font-semibold" style={{ color: isDark ? "#94A3B8" : "#64748B" }}>Grade</th>
              </tr>
            </thead>
            <tbody>
              {scannedDomains.map((domain, index) => (
                <tr key={index} className="transition-all duration-200 hover:bg-opacity-50" style={{ backgroundColor: index % 2 === 0 ? (isDark ? "rgba(15, 23, 42, 0.3)" : "rgba(248, 250, 252, 0.3)") : "transparent", borderBottom: isDark ? "1px solid #1E293B" : "1px solid #E2E8F0" }}>
                  <td className="px-6 py-4">{getStatusBadge(domain.status)}</td>
                  <td className="px-6 py-4 font-medium" style={{ color: isDark ? "#FFFFFF" : "#0F172A" }}>{domain.domain}</td>
                  <td className="px-6 py-4" style={{ color: isDark ? "#CBD5E1" : "#475569" }}>{domain.issuer}</td>
                  <td className="px-6 py-4" style={{ color: isDark ? "#CBD5E1" : "#475569" }}>{domain.expiryDate}</td>
                  <td className="px-6 py-4 font-bold" style={{ color: ["A", "A+"].includes(domain.grade) ? "#10B981" : ["B", "C"].includes(domain.grade) ? "#FBBF24" : "#EF4444" }}>{domain.grade}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {scannedDomains.length === 0 && (
            <div className="p-8 text-center" style={{ color: isDark ? "#64748B" : "#94A3B8" }}>
              No scans yet. Enter a domain to start.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}