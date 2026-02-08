import { useState } from "react";
import { Plus, Trash2, Bell, Mail, Zap, Clock } from "lucide-react";
import { toast } from "sonner@2.0.3";

interface AutomationRule {
  id: string;
  name: string;
  trigger: string;
  action: string;
  enabled: boolean;
  schedule?: string;
}

interface AutomationPageProps {
  isDark: boolean;
}

export function AutomationPage({ isDark }: AutomationPageProps) {
  const [rules, setRules] = useState<AutomationRule[]>([
    {
      id: "1",
      name: "Certificate Expiry Alert",
      trigger: "Certificate expires in 30 days",
      action: "Send email notification",
      enabled: true,
      schedule: "Daily at 9:00 AM"
    },
    {
      id: "2",
      name: "Weekly Domain Scan",
      trigger: "Every Monday",
      action: "Scan all domains",
      enabled: true,
      schedule: "Weekly on Monday"
    },
    {
      id: "3",
      name: "Grade Drop Alert",
      trigger: "Security grade drops below B",
      action: "Send Slack notification",
      enabled: false,
      schedule: "Real-time"
    }
  ]);

  const [showNewRuleForm, setShowNewRuleForm] = useState(false);
  const [newRule, setNewRule] = useState({
    name: "",
    trigger: "",
    action: "",
    schedule: ""
  });

  const handleToggleRule = (id: string) => {
    setRules(rules.map(rule => 
      rule.id === id ? { ...rule, enabled: !rule.enabled } : rule
    ));
    const rule = rules.find(r => r.id === id);
    toast.success(`${rule?.name} ${rule?.enabled ? 'disabled' : 'enabled'}`);
  };

  const handleDeleteRule = (id: string) => {
    const rule = rules.find(r => r.id === id);
    setRules(rules.filter(rule => rule.id !== id));
    toast.success(`${rule?.name} deleted`);
  };

  const handleAddRule = () => {
    if (!newRule.name || !newRule.trigger || !newRule.action) {
      toast.error("Please fill in all fields");
      return;
    }

    const rule: AutomationRule = {
      id: Date.now().toString(),
      name: newRule.name,
      trigger: newRule.trigger,
      action: newRule.action,
      enabled: true,
      schedule: newRule.schedule || "Manual"
    };

    setRules([...rules, rule]);
    setNewRule({ name: "", trigger: "", action: "", schedule: "" });
    setShowNewRuleForm(false);
    toast.success("Automation rule created");
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
            Automation & Alerts
          </h1>
          <p style={{ color: isDark ? "#64748B" : "#94A3B8" }}>
            Set up automated scans and notifications for your domains
          </p>
        </div>
        
        <button
          onClick={() => setShowNewRuleForm(!showNewRuleForm)}
          className="px-6 py-3 rounded-xl font-semibold transition-all duration-300 hover:scale-105 flex items-center gap-2"
          style={{
            background: "linear-gradient(135deg, #22D3EE, #06B6D4)",
            color: "#0F172A",
            boxShadow: "0 0 20px rgba(34, 211, 238, 0.3)"
          }}
        >
          <Plus className="w-5 h-5" />
          New Rule
        </button>
      </div>

      {/* New Rule Form */}
      {showNewRuleForm && (
        <div 
          className="rounded-2xl p-6 border space-y-4"
          style={{
            background: isDark 
              ? "rgba(15, 23, 42, 0.5)" 
              : "rgba(255, 255, 255, 0.5)",
            backdropFilter: "blur(20px)",
            borderColor: isDark ? "rgba(34, 211, 238, 0.2)" : "rgba(8, 145, 178, 0.2)"
          }}
        >
          <h3 
            className="font-bold mb-4"
            style={{ 
              color: isDark ? "#FFFFFF" : "#0F172A",
              fontSize: "20px"
            }}
          >
            Create New Automation Rule
          </h3>
          
          <div>
            <label 
              className="block mb-2 text-sm font-semibold"
              style={{ color: isDark ? "#94A3B8" : "#64748B" }}
            >
              Rule Name
            </label>
            <input
              type="text"
              value={newRule.name}
              onChange={(e) => setNewRule({ ...newRule, name: e.target.value })}
              placeholder="e.g., SSL Expiry Warning"
              className="w-full px-4 py-3 rounded-xl border bg-transparent outline-none"
              style={{
                borderColor: isDark ? "rgba(34, 211, 238, 0.2)" : "rgba(8, 145, 178, 0.2)",
                color: isDark ? "#FFFFFF" : "#0F172A"
              }}
            />
          </div>

          <div>
            <label 
              className="block mb-2 text-sm font-semibold"
              style={{ color: isDark ? "#94A3B8" : "#64748B" }}
            >
              Trigger Condition
            </label>
            <select
              value={newRule.trigger}
              onChange={(e) => setNewRule({ ...newRule, trigger: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border bg-transparent outline-none"
              style={{
                borderColor: isDark ? "rgba(34, 211, 238, 0.2)" : "rgba(8, 145, 178, 0.2)",
                color: isDark ? "#FFFFFF" : "#0F172A",
                backgroundColor: isDark ? "#0F172A" : "#FFFFFF"
              }}
            >
              <option value="">Select trigger...</option>
              <option value="Certificate expires in 7 days">Certificate expires in 7 days</option>
              <option value="Certificate expires in 30 days">Certificate expires in 30 days</option>
              <option value="Certificate expires in 90 days">Certificate expires in 90 days</option>
              <option value="Security grade drops below A">Security grade drops below A</option>
              <option value="Security grade drops below B">Security grade drops below B</option>
              <option value="New domain added">New domain added</option>
            </select>
          </div>

          <div>
            <label 
              className="block mb-2 text-sm font-semibold"
              style={{ color: isDark ? "#94A3B8" : "#64748B" }}
            >
              Action
            </label>
            <select
              value={newRule.action}
              onChange={(e) => setNewRule({ ...newRule, action: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border bg-transparent outline-none"
              style={{
                borderColor: isDark ? "rgba(34, 211, 238, 0.2)" : "rgba(8, 145, 178, 0.2)",
                color: isDark ? "#FFFFFF" : "#0F172A",
                backgroundColor: isDark ? "#0F172A" : "#FFFFFF"
              }}
            >
              <option value="">Select action...</option>
              <option value="Send email notification">Send email notification</option>
              <option value="Send Slack notification">Send Slack notification</option>
              <option value="Send webhook">Send webhook</option>
              <option value="Generate report">Generate report</option>
              <option value="Scan domain">Scan domain</option>
            </select>
          </div>

          <div>
            <label 
              className="block mb-2 text-sm font-semibold"
              style={{ color: isDark ? "#94A3B8" : "#64748B" }}
            >
              Schedule (Optional)
            </label>
            <input
              type="text"
              value={newRule.schedule}
              onChange={(e) => setNewRule({ ...newRule, schedule: e.target.value })}
              placeholder="e.g., Daily at 9:00 AM"
              className="w-full px-4 py-3 rounded-xl border bg-transparent outline-none"
              style={{
                borderColor: isDark ? "rgba(34, 211, 238, 0.2)" : "rgba(8, 145, 178, 0.2)",
                color: isDark ? "#FFFFFF" : "#0F172A"
              }}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={handleAddRule}
              className="px-6 py-3 rounded-xl font-semibold transition-all duration-300 hover:scale-105"
              style={{
                background: "linear-gradient(135deg, #22D3EE, #06B6D4)",
                color: "#0F172A"
              }}
            >
              Create Rule
            </button>
            <button
              onClick={() => setShowNewRuleForm(false)}
              className="px-6 py-3 rounded-xl font-semibold transition-all duration-300"
              style={{
                backgroundColor: isDark ? "rgba(30, 41, 59, 0.5)" : "rgba(226, 232, 240, 0.5)",
                color: isDark ? "#94A3B8" : "#64748B"
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Rules List */}
      <div className="space-y-4">
        {rules.map((rule) => (
          <div 
            key={rule.id}
            className="rounded-2xl p-6 border transition-all duration-300 hover:scale-[1.02]"
            style={{
              background: isDark 
                ? "rgba(15, 23, 42, 0.5)" 
                : "rgba(255, 255, 255, 0.5)",
              backdropFilter: "blur(20px)",
              borderColor: rule.enabled 
                ? (isDark ? "rgba(34, 211, 238, 0.3)" : "rgba(8, 145, 178, 0.3)")
                : (isDark ? "rgba(100, 116, 139, 0.2)" : "rgba(203, 213, 225, 0.2)"),
              opacity: rule.enabled ? 1 : 0.6
            }}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <div 
                    className="w-10 h-10 rounded-lg flex items-center justify-center"
                    style={{
                      background: rule.enabled 
                        ? "rgba(34, 211, 238, 0.2)"
                        : "rgba(100, 116, 139, 0.2)",
                      border: `1px solid ${rule.enabled ? "rgba(34, 211, 238, 0.3)" : "rgba(100, 116, 139, 0.3)"}`
                    }}
                  >
                    <Zap className="w-5 h-5" style={{ color: rule.enabled ? "#22D3EE" : "#64748B" }} />
                  </div>
                  <div>
                    <h3 
                      className="font-bold"
                      style={{ 
                        color: isDark ? "#FFFFFF" : "#0F172A",
                        fontSize: "18px"
                      }}
                    >
                      {rule.name}
                    </h3>
                    <p className="text-sm" style={{ color: isDark ? "#64748B" : "#94A3B8" }}>
                      {rule.schedule}
                    </p>
                  </div>
                </div>

                <div className="space-y-2 ml-13">
                  <div className="flex items-center gap-2">
                    <Bell className="w-4 h-4" style={{ color: "#22D3EE" }} />
                    <span className="text-sm" style={{ color: isDark ? "#94A3B8" : "#64748B" }}>
                      <span style={{ color: isDark ? "#FFFFFF" : "#0F172A" }}>Trigger:</span> {rule.trigger}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4" style={{ color: "#22D3EE" }} />
                    <span className="text-sm" style={{ color: isDark ? "#94A3B8" : "#64748B" }}>
                      <span style={{ color: isDark ? "#FFFFFF" : "#0F172A" }}>Action:</span> {rule.action}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {/* Toggle Switch */}
                <button
                  onClick={() => handleToggleRule(rule.id)}
                  className="relative w-14 h-7 rounded-full transition-all duration-300"
                  style={{
                    backgroundColor: rule.enabled ? "#22D3EE" : (isDark ? "#334155" : "#CBD5E1")
                  }}
                >
                  <div 
                    className="absolute top-0.5 w-6 h-6 rounded-full bg-white shadow-md transition-all duration-300"
                    style={{
                      left: rule.enabled ? "calc(100% - 26px)" : "2px"
                    }}
                  />
                </button>

                {/* Delete Button */}
                <button
                  onClick={() => handleDeleteRule(rule.id)}
                  className="p-2 rounded-lg transition-all duration-200 hover:scale-110"
                  style={{
                    backgroundColor: "rgba(239, 68, 68, 0.1)",
                    color: "#EF4444"
                  }}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Info Card */}
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
        <div className="flex items-start gap-4">
          <div 
            className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
            style={{
              background: "rgba(34, 211, 238, 0.2)",
              border: "1px solid rgba(34, 211, 238, 0.3)"
            }}
          >
            <Clock className="w-6 h-6" style={{ color: "#22D3EE" }} />
          </div>
          <div>
            <h4 
              className="font-bold mb-2"
              style={{ color: isDark ? "#FFFFFF" : "#0F172A" }}
            >
              Automation Tips
            </h4>
            <ul className="space-y-2">
              <li className="flex items-start gap-2">
                <span className="text-cyan-400">•</span>
                <p className="text-sm" style={{ color: isDark ? "#94A3B8" : "#64748B" }}>
                  Set up alerts for certificates expiring in 30 days to ensure timely renewal
                </p>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-cyan-400">•</span>
                <p className="text-sm" style={{ color: isDark ? "#94A3B8" : "#64748B" }}>
                  Configure weekly scans to monitor your domain portfolio automatically
                </p>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-cyan-400">•</span>
                <p className="text-sm" style={{ color: isDark ? "#94A3B8" : "#64748B" }}>
                  Use webhooks to integrate with your existing DevOps workflows
                </p>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
