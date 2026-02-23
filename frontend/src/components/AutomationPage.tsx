import { useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import { Plus, Trash2, Bell, Mail, Zap, Clock, Pencil } from 'lucide-react';
import { toast } from 'sonner';
import type { AutomationRule } from '../lib/automation';
import { TargetPicker } from './TargetPicker';
import { PageHeader } from './PageHeader';

interface AutomationPageProps {
  isDark: boolean;
  rules: AutomationRule[];
  setRules: Dispatch<SetStateAction<AutomationRule[]>>;
}

export function AutomationPage({
  isDark,
  rules,
  setRules,
}: AutomationPageProps) {
  const [showNewRuleForm, setShowNewRuleForm] = useState(false);
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null);
  const [newRule, setNewRule] = useState({
    name: '',
    trigger: '',
    action: '',
    schedule: '',
    targets: [] as string[],
  });

  const resetRuleForm = () => {
    setNewRule({
      name: '',
      trigger: '',
      action: '',
      schedule: '',
      targets: [],
    });
    setEditingRuleId(null);
  };

  const handleToggleRuleForm = () => {
    setShowNewRuleForm((prev) => {
      const next = !prev;
      if (!next) resetRuleForm();
      return next;
    });
  };

  const handleToggleRule = (id: string) => {
    setRules((prev) => {
      const next = prev.map((r) =>
        r.id === id ? { ...r, enabled: !r.enabled } : r
      );
      const changed = next.find((r) => r.id === id);
      toast.success(
        `${changed?.name} ${changed?.enabled ? 'enabled' : 'disabled'}`
      );
      return next;
    });
  };

  const handleDeleteRule = (id: string) => {
    if (editingRuleId === id) {
      setShowNewRuleForm(false);
      resetRuleForm();
    }

    setRules((prev) => {
      const rule = prev.find((r) => r.id === id);
      const next = prev.filter((r) => r.id !== id);
      toast.success(`${rule?.name ?? 'Rule'} deleted`);
      return next;
    });
  };

  const handleEditRule = (id: string) => {
    const rule = rules.find((r) => r.id === id);
    if (!rule) return;

    setEditingRuleId(id);
    setNewRule({
      name: rule.name ?? '',
      trigger: rule.trigger ?? '',
      action: rule.action ?? '',
      schedule: rule.schedule ?? '',
      targets: Array.isArray(rule.targets) ? rule.targets : [],
    });
    setShowNewRuleForm(true);
  };

  const handleSaveRule = () => {
    if (!newRule.name || !newRule.trigger || !newRule.action) {
      toast.error('Please fill in all fields');
      return;
    }

    if (!newRule.targets.length) {
      toast.error('Please select at least one target (domain/IP)');
      return;
    }

    if (editingRuleId) {
      setRules((prev) =>
        prev.map((rule) =>
          rule.id === editingRuleId
            ? {
                ...rule,
                name: newRule.name,
                trigger: newRule.trigger,
                action: newRule.action,
                schedule: newRule.schedule || 'Manual',
                targets: newRule.targets,
              }
            : rule
        )
      );
      toast.success('Automation rule updated');
    } else {
      const rule: AutomationRule = {
        id: Date.now().toString(),
        name: newRule.name,
        trigger: newRule.trigger,
        action: newRule.action,
        enabled: true,
        schedule: newRule.schedule || 'Manual',
        targets: newRule.targets,
      };

      setRules((prev) => [...prev, rule]);
      toast.success('Automation rule created');
    }

    resetRuleForm();
    setShowNewRuleForm(false);
  };

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <PageHeader
        title="Automation & Alerts"
        subtitle="Set up automated scans and notifications for your domains"
        isDark={isDark}
        pageKey="automation"
        actions={
          <button
            onClick={handleToggleRuleForm}
            className="px-6 py-3 rounded-xl font-semibold transition-all duration-300 hover:scale-105 flex items-center gap-2 cursor-pointer"
            style={{
              background: 'linear-gradient(135deg, #22D3EE, #06B6D4)',
              color: '#0F172A',
              boxShadow: '0 0 20px rgba(34, 211, 238, 0.3)',
            }}
          >
            <Plus className="w-5 h-5" />
            New Rule
          </button>
        }
      />

      {/* New Rule Form */}
      {showNewRuleForm && (
        <div
          className="rounded-2xl p-6 border space-y-4"
          style={{
            background: isDark
              ? 'rgba(15, 23, 42, 0.5)'
              : 'rgba(255, 255, 255, 0.5)',
            backdropFilter: 'blur(20px)',
            borderColor: isDark
              ? 'rgba(34, 211, 238, 0.2)'
              : 'rgba(8, 145, 178, 0.2)',
          }}
        >
          <h3
            className="font-bold mb-4"
            style={{ color: isDark ? '#FFFFFF' : '#0F172A', fontSize: '20px' }}
          >
            {editingRuleId ? 'Edit Automation Rule' : 'Create New Automation Rule'}
          </h3>

          <div>
            <label
              className="block mb-2 text-sm font-semibold"
              style={{ color: isDark ? '#94A3B8' : '#64748B' }}
            >
              Rule Name
            </label>
            <input
              type="text"
              value={newRule.name}
              onChange={(e) =>
                setNewRule((p) => ({ ...p, name: e.target.value }))
              }
              placeholder="e.g., SSL Expiry Warning"
              className="w-full px-4 py-3 rounded-xl border bg-transparent outline-none"
              style={{
                borderColor: isDark
                  ? 'rgba(34, 211, 238, 0.2)'
                  : 'rgba(8, 145, 178, 0.2)',
                color: isDark ? '#FFFFFF' : '#0F172A',
              }}
            />
          </div>

          <TargetPicker
            isDark={isDark}
            label="Targets (Domains / IPs)"
            helperText="Select which domains/IPs this rule should apply to."
            value={newRule.targets}
            onChange={(targets) => setNewRule((p) => ({ ...p, targets }))}
          />

          <div>
            <label
              className="block mb-2 text-sm font-semibold"
              style={{ color: isDark ? '#94A3B8' : '#64748B' }}
            >
              Trigger Condition
            </label>
            <select
              value={newRule.trigger}
              onChange={(e) =>
                setNewRule((p) => ({ ...p, trigger: e.target.value }))
              }
              className="w-full px-4 py-3 rounded-xl border bg-transparent outline-none"
              style={{
                borderColor: isDark
                  ? 'rgba(34, 211, 238, 0.2)'
                  : 'rgba(8, 145, 178, 0.2)',
                color: isDark ? '#FFFFFF' : '#0F172A',
                backgroundColor: isDark ? '#0F172A' : '#FFFFFF',
              }}
            >
              <option value="">Select trigger...</option>
              <option value="Certificate expires in 7 days">
                Certificate expires in 7 days
              </option>
              <option value="Certificate expires in 30 days">
                Certificate expires in 30 days
              </option>
              <option value="Certificate expires in 90 days">
                Certificate expires in 90 days
              </option>
              <option value="Security grade drops below A">
                Security grade drops below A
              </option>
              <option value="Security grade drops below B">
                Security grade drops below B
              </option>
              <option value="New domain added">New domain added</option>
            </select>
          </div>

          <div>
            <label
              className="block mb-2 text-sm font-semibold"
              style={{ color: isDark ? '#94A3B8' : '#64748B' }}
            >
              Action
            </label>
            <select
              value={newRule.action}
              onChange={(e) =>
                setNewRule((p) => ({ ...p, action: e.target.value }))
              }
              className="w-full px-4 py-3 rounded-xl border bg-transparent outline-none"
              style={{
                borderColor: isDark
                  ? 'rgba(34, 211, 238, 0.2)'
                  : 'rgba(8, 145, 178, 0.2)',
                color: isDark ? '#FFFFFF' : '#0F172A',
                backgroundColor: isDark ? '#0F172A' : '#FFFFFF',
              }}
            >
              <option value="">Select action...</option>
              <option value="Send email notification">
                Send email notification
              </option>
              <option value="Scan domain">Scan domain</option>
            </select>
          </div>

          <div>
            <label
              className="block mb-2 text-sm font-semibold"
              style={{ color: isDark ? '#94A3B8' : '#64748B' }}
            >
              Schedule (Optional)
            </label>
            <input
              type="text"
              value={newRule.schedule}
              onChange={(e) =>
                setNewRule((p) => ({ ...p, schedule: e.target.value }))
              }
              placeholder="e.g., Daily at 9:00 AM"
              className="w-full px-4 py-3 rounded-xl border bg-transparent outline-none"
              style={{
                borderColor: isDark
                  ? 'rgba(34, 211, 238, 0.2)'
                  : 'rgba(8, 145, 178, 0.2)',
                color: isDark ? '#FFFFFF' : '#0F172A',
              }}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={handleSaveRule}
              className="px-6 py-3 rounded-xl font-semibold transition-all duration-300 hover:scale-105"
              style={{
                background: 'linear-gradient(135deg, #22D3EE, #06B6D4)',
                color: '#0F172A',
              }}
            >
              {editingRuleId ? 'Save Changes' : 'Create Rule'}
            </button>
            <button
              onClick={() => {
                setShowNewRuleForm(false);
                resetRuleForm();
              }}
              className="px-6 py-3 rounded-xl font-semibold transition-all duration-300"
              style={{
                backgroundColor: isDark
                  ? 'rgba(30, 41, 59, 0.5)'
                  : 'rgba(226, 232, 240, 0.5)',
                color: isDark ? '#94A3B8' : '#64748B',
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Rules List */}
      <div className="space-y-4">
        {(Array.isArray(rules) ? rules : []).map((rule) => {
          const safeTargets = Array.isArray(rule.targets) ? rule.targets : [];
          return (
          <div
            key={rule.id}
            className="rounded-2xl p-6 border transition-all duration-300 hover:scale-[1.02]"
            style={{
              background: isDark
                ? 'rgba(15, 23, 42, 0.5)'
                : 'rgba(255, 255, 255, 0.5)',
              backdropFilter: 'blur(20px)',
              borderColor: rule.enabled
                ? isDark
                  ? 'rgba(34, 211, 238, 0.3)'
                  : 'rgba(8, 145, 178, 0.3)'
                : isDark
                  ? 'rgba(100, 116, 139, 0.2)'
                  : 'rgba(203, 213, 225, 0.2)',
              opacity: rule.enabled ? 1 : 0.6,
            }}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center"
                    style={{
                      background: rule.enabled
                        ? 'rgba(34, 211, 238, 0.2)'
                        : 'rgba(100, 116, 139, 0.2)',
                      border: `1px solid ${
                        rule.enabled
                          ? 'rgba(34, 211, 238, 0.3)'
                          : 'rgba(100, 116, 139, 0.3)'
                      }`,
                    }}
                  >
                    <Zap
                      className="w-5 h-5"
                      style={{ color: rule.enabled ? '#22D3EE' : '#64748B' }}
                    />
                  </div>
                  <div>
                    <h3
                      className="font-bold"
                      style={{
                        color: isDark ? '#FFFFFF' : '#0F172A',
                        fontSize: '18px',
                      }}
                    >
                      {rule.name}
                    </h3>
                    <p
                      className="text-sm"
                      style={{ color: isDark ? '#64748B' : '#94A3B8' }}
                    >
                      {rule.schedule} - {safeTargets.length} target(s)
                    </p>
                  </div>
                </div>

                <div className="space-y-2 ml-13">
                  <div className="flex items-center gap-2">
                    <Bell className="w-4 h-4" style={{ color: '#22D3EE' }} />
                    <span
                      className="text-sm"
                      style={{ color: isDark ? '#94A3B8' : '#64748B' }}
                    >
                      <span style={{ color: isDark ? '#FFFFFF' : '#0F172A' }}>
                        Trigger:
                      </span>{' '}
                      {rule.trigger}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4" style={{ color: '#22D3EE' }} />
                    <span
                      className="text-sm"
                      style={{ color: isDark ? '#94A3B8' : '#64748B' }}
                    >
                      <span style={{ color: isDark ? '#FFFFFF' : '#0F172A' }}>
                        Action:
                      </span>{' '}
                      {rule.action}
                    </span>
                  </div>

                  <div
                    className="text-xs"
                    style={{ color: isDark ? '#64748B' : '#94A3B8' }}
                  >
                    Targets: {safeTargets.join(', ')}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleToggleRule(rule.id)}
                  className="relative w-14 h-7 rounded-full transition-all duration-300"
                  style={{
                    backgroundColor: rule.enabled
                      ? '#22D3EE'
                      : isDark
                        ? '#334155'
                        : '#CBD5E1',
                  }}
                >
                  <div
                    className="absolute top-0.5 w-6 h-6 rounded-full bg-white shadow-md transition-all duration-300"
                    style={{ left: rule.enabled ? 'calc(100% - 26px)' : '2px' }}
                  />
                </button>

                <button
                  onClick={() => handleEditRule(rule.id)}
                  className="p-2 rounded-lg transition-all duration-200 hover:scale-110 cursor-pointer"
                  style={{
                    backgroundColor: isDark
                      ? 'rgba(34, 211, 238, 0.12)'
                      : 'rgba(8, 145, 178, 0.12)',
                    border: isDark
                      ? '1px solid rgba(34, 211, 238, 0.28)'
                      : '1px solid rgba(8, 145, 178, 0.28)',
                    color: isDark ? '#22D3EE' : '#0891B2',
                  }}
                  title="Edit rule"
                >
                  <Pencil className="w-4 h-4" />
                </button>

                <button
                  onClick={() => handleDeleteRule(rule.id)}
                  className="p-2 rounded-lg transition-all duration-200 hover:scale-110 cursor-pointer"
                  style={{
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    color: '#EF4444',
                  }}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="mt-4 flex items-start gap-4">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
                style={{
                  background: 'rgba(34, 211, 238, 0.2)',
                  border: '1px solid rgba(34, 211, 238, 0.3)',
                }}
              >
                <Clock className="w-6 h-6" style={{ color: '#22D3EE' }} />
              </div>
              <div>
                <h4
                  className="font-bold mb-1"
                  style={{ color: isDark ? '#FFFFFF' : '#0F172A' }}
                >
                  Tip
                </h4>
                <p
                  className="text-sm"
                  style={{ color: isDark ? '#94A3B8' : '#64748B' }}
                >
                  This UI stores rules locally. Next step is wiring a real
                  scheduler/runner (backend) to execute triggers.
                </p>
              </div>
            </div>
          </div>
          );
        })}
      </div>
    </div>
  );
}
