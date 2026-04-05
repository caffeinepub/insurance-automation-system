import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  BarChart3,
  CheckCircle2,
  DollarSign,
  Plus,
  Shield,
  Trash2,
  TrendingUp,
  UserPlus,
  Users,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useApp } from "../context/AppContext";
import type { AppUser } from "../types";

interface AdminControlPanelProps {
  onBack: () => void;
}

function generateAgentEmail(name: string): string {
  return `${name.toLowerCase().replace(/\s+/g, ".")}@insurance.com`;
}

export default function AdminControlPanel({ onBack }: AdminControlPanelProps) {
  const { agentList, leads, addAgent, removeAgent, addToast } = useApp();

  // Add agent form state
  const [newName, setNewName] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newWhatsapp, setNewWhatsapp] = useState("");
  const [addError, setAddError] = useState("");

  const handleAddAgent = () => {
    setAddError("");
    if (!newName.trim()) {
      setAddError("Name is required");
      return;
    }
    if (newPassword.length < 6) {
      setAddError("Password must be at least 6 characters");
      return;
    }
    const email = generateAgentEmail(newName);
    const newAgent: AppUser = {
      email,
      password: newPassword,
      name: newName.trim(),
      role: "agent",
      whatsapp_number: newWhatsapp.trim() || undefined,
    };
    addAgent(newAgent);
    addToast("success", `Agent "${newName}" added successfully`);
    setNewName("");
    setNewPassword("");
    setNewWhatsapp("");
  };

  const handleRemoveAgent = (email: string, name: string) => {
    removeAgent(email);
    addToast("info", `Agent "${name}" removed`);
  };

  // Business stats
  const businessStats = useMemo(() => {
    const totalLeads = leads.length;
    const completedLeads = leads.filter(
      (l) => l.workflowStatus === "Completed",
    );
    const totalBusiness = completedLeads.reduce(
      (sum, l) => sum + (l.policyAmount || 0),
      0,
    );
    const totalCommission = completedLeads.reduce(
      (sum, l) =>
        sum +
        Math.round(((l.policyAmount || 0) * (l.commissionPercent || 0)) / 100),
      0,
    );
    return {
      totalLeads,
      completedPolicies: completedLeads.length,
      totalBusiness,
      totalCommission,
    };
  }, [leads]);

  // Per-agent breakdown
  const agentBreakdown = useMemo(() => {
    return agentList.map((agent) => {
      const agentLeads = leads.filter((l) => l.assignedAgent === agent.email);
      const completed = agentLeads.filter(
        (l) => l.workflowStatus === "Completed",
      );
      const business = completed.reduce(
        (sum, l) => sum + (l.policyAmount || 0),
        0,
      );
      const commission = completed.reduce(
        (sum, l) =>
          sum +
          Math.round(
            ((l.policyAmount || 0) * (l.commissionPercent || 0)) / 100,
          ),
        0,
      );
      return {
        ...agent,
        totalLeads: agentLeads.length,
        completedPolicies: completed.length,
        business,
        commission,
      };
    });
  }, [agentList, leads]);

  const statCards = [
    {
      label: "Total Leads",
      value: businessStats.totalLeads,
      icon: TrendingUp,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      label: "Completed Policies",
      value: businessStats.completedPolicies,
      icon: CheckCircle2,
      color: "text-green-600",
      bg: "bg-green-50",
    },
    {
      label: "Total Business",
      value: `₹${businessStats.totalBusiness.toLocaleString("en-IN")}`,
      icon: DollarSign,
      color: "text-teal-600",
      bg: "bg-teal-50",
    },
    {
      label: "Total Commission",
      value: `₹${businessStats.totalCommission.toLocaleString("en-IN")}`,
      icon: BarChart3,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-xs sticky top-0 z-20">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
          <button
            type="button"
            onClick={onBack}
            className="w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
            data-ocid="admin_panel.back_button"
          >
            <ArrowLeft className="w-4 h-4 text-gray-700" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-base font-bold text-gray-900">
                Admin Control Panel
              </h1>
              <p className="text-xs text-gray-500">
                Manage agents &amp; view business overview
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        <Tabs defaultValue="agents" className="space-y-6">
          <TabsList className="bg-white border border-gray-200 shadow-xs rounded-xl p-1">
            <TabsTrigger
              value="agents"
              className="flex items-center gap-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white rounded-lg"
              data-ocid="admin_panel.agents.tab"
            >
              <Users className="w-4 h-4" />
              Agents
            </TabsTrigger>
            <TabsTrigger
              value="business"
              className="flex items-center gap-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white rounded-lg"
              data-ocid="admin_panel.business.tab"
            >
              <BarChart3 className="w-4 h-4" />
              Business
            </TabsTrigger>
          </TabsList>

          {/* ── Agents Tab ── */}
          <TabsContent
            value="agents"
            className="space-y-5"
            data-ocid="admin_panel.agents.panel"
          >
            {/* Current agents list */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-gray-400" />
                  <h2 className="font-bold text-gray-900 text-sm">
                    Agent List
                  </h2>
                  <Badge variant="secondary" className="text-xs">
                    {agentList.length} agents
                  </Badge>
                </div>
              </div>

              <div className="divide-y divide-gray-100">
                {agentList.length === 0 ? (
                  <div
                    className="py-12 text-center"
                    data-ocid="admin_panel.agents.empty_state"
                  >
                    <Users className="w-8 h-8 text-gray-300 mx-auto mb-3" />
                    <p className="text-sm text-gray-500">No agents yet</p>
                  </div>
                ) : (
                  agentList.map((agent, idx) => (
                    <div
                      key={agent.email}
                      className="flex items-center justify-between px-5 py-3.5"
                      data-ocid={`admin_panel.agents.item.${idx + 1}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 text-sm font-bold flex-shrink-0">
                          {agent.name.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900">
                            {agent.name}
                          </p>
                          <p className="text-xs text-gray-400">{agent.email}</p>
                          {agent.whatsapp_number && (
                            <p className="text-xs text-green-600">
                              WhatsApp: {agent.whatsapp_number}
                            </p>
                          )}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          handleRemoveAgent(agent.email, agent.name)
                        }
                        className="w-8 h-8 rounded-full bg-red-50 hover:bg-red-100 flex items-center justify-center text-red-500 hover:text-red-700 transition-colors"
                        title={`Remove ${agent.name}`}
                        data-ocid={`admin_panel.agents.delete_button.${idx + 1}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Add agent form */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
              <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-100">
                <UserPlus className="w-4 h-4 text-green-500" />
                <h2 className="font-bold text-gray-900 text-sm">
                  Add New Agent
                </h2>
              </div>

              <div className="p-5 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label
                      htmlFor="new-agent-name"
                      className="text-xs font-semibold text-gray-700"
                    >
                      Full Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="new-agent-name"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      placeholder="e.g. Rohan Sharma"
                      className="text-sm"
                      data-ocid="admin_panel.add_agent.name_input"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label
                      htmlFor="new-agent-password"
                      className="text-xs font-semibold text-gray-700"
                    >
                      Password <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="new-agent-password"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Min 6 characters"
                      className="text-sm"
                      data-ocid="admin_panel.add_agent.input"
                    />
                  </div>
                  <div className="space-y-1.5 md:col-span-2">
                    <Label
                      htmlFor="new-agent-whatsapp"
                      className="text-xs font-semibold text-gray-700"
                    >
                      WhatsApp Number (optional)
                    </Label>
                    <Input
                      id="new-agent-whatsapp"
                      value={newWhatsapp}
                      onChange={(e) => setNewWhatsapp(e.target.value)}
                      placeholder="10-digit mobile number"
                      className="text-sm"
                      data-ocid="admin_panel.add_agent.whatsapp_input"
                    />
                  </div>
                </div>

                {/* Email preview */}
                {newName.trim() && (
                  <div className="text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-2">
                    Login email will be:{" "}
                    <span className="font-mono text-blue-600">
                      {generateAgentEmail(newName)}
                    </span>
                  </div>
                )}

                {addError && (
                  <p
                    className="text-xs text-red-500"
                    data-ocid="admin_panel.add_agent.error_state"
                  >
                    {addError}
                  </p>
                )}

                <Button
                  type="button"
                  onClick={handleAddAgent}
                  className="w-full bg-green-600 hover:bg-green-700 text-white"
                  data-ocid="admin_panel.add_agent.submit_button"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Agent
                </Button>
              </div>
            </div>
          </TabsContent>

          {/* ── Business Tab ── */}
          <TabsContent
            value="business"
            className="space-y-5"
            data-ocid="admin_panel.business.panel"
          >
            {/* Summary cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {statCards.map((card, i) => (
                <div
                  key={card.label}
                  className="bg-white rounded-xl border border-gray-200 shadow-xs p-4 flex flex-col gap-2"
                  data-ocid={`admin_panel.business.card.${i + 1}`}
                >
                  <div
                    className={`w-8 h-8 rounded-lg ${card.bg} flex items-center justify-center`}
                  >
                    <card.icon className={`w-4 h-4 ${card.color}`} />
                  </div>
                  <p className="text-xl font-bold text-gray-900">
                    {card.value}
                  </p>
                  <span className="text-xs text-gray-500">{card.label}</span>
                </div>
              ))}
            </div>

            {/* Per-agent table */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
              <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-100">
                <BarChart3 className="w-4 h-4 text-indigo-500" />
                <h2 className="font-bold text-gray-900 text-sm">
                  Per-Agent Business
                </h2>
              </div>
              <div className="overflow-x-auto">
                <table
                  className="w-full"
                  data-ocid="admin_panel.business.table"
                >
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50/60">
                      <th className="px-5 py-2.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wide">
                        Agent
                      </th>
                      <th className="px-5 py-2.5 text-center text-xs font-bold text-gray-500 uppercase tracking-wide">
                        Leads
                      </th>
                      <th className="px-5 py-2.5 text-center text-xs font-bold text-gray-500 uppercase tracking-wide">
                        Policies
                      </th>
                      <th className="px-5 py-2.5 text-right text-xs font-bold text-gray-500 uppercase tracking-wide">
                        Business
                      </th>
                      <th className="px-5 py-2.5 text-right text-xs font-bold text-gray-500 uppercase tracking-wide">
                        Commission
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {agentBreakdown.map((agent, idx) => (
                      <tr
                        key={agent.email}
                        className={idx % 2 === 0 ? "bg-white" : "bg-gray-50/40"}
                        data-ocid={`admin_panel.business.row.${idx + 1}`}
                      >
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 text-xs font-bold flex-shrink-0">
                              {agent.name.charAt(0)}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-800">
                                {agent.name}
                              </p>
                              <p className="text-xs text-gray-400">
                                {agent.email}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3 text-center">
                          <span className="text-sm font-bold text-gray-700">
                            {agent.totalLeads}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-center">
                          <span
                            className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                              agent.completedPolicies > 0
                                ? "bg-green-100 text-green-700"
                                : "bg-gray-100 text-gray-400"
                            }`}
                          >
                            {agent.completedPolicies}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-right font-mono font-semibold text-gray-800">
                          {agent.business > 0 ? (
                            `₹${agent.business.toLocaleString("en-IN")}`
                          ) : (
                            <span className="text-gray-300 font-normal">—</span>
                          )}
                        </td>
                        <td className="px-5 py-3 text-right">
                          {agent.commission > 0 ? (
                            <span className="inline-block px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-bold font-mono text-xs border border-emerald-100">
                              ₹{agent.commission.toLocaleString("en-IN")}
                            </span>
                          ) : (
                            <span className="text-gray-300">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                    {/* Totals row */}
                    <tr className="bg-gray-50 border-t-2 border-gray-200">
                      <td className="px-5 py-3 text-xs font-bold text-gray-600 uppercase tracking-wide">
                        Total
                      </td>
                      <td className="px-5 py-3 text-center">
                        <span className="text-sm font-bold text-gray-700">
                          {businessStats.totalLeads}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-center">
                        <span className="text-sm font-bold text-gray-700">
                          {businessStats.completedPolicies}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right font-mono font-bold text-gray-900">
                        ₹{businessStats.totalBusiness.toLocaleString("en-IN")}
                      </td>
                      <td className="px-5 py-3 text-right">
                        <span className="inline-block px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-bold font-mono text-xs border border-emerald-200">
                          ₹
                          {businessStats.totalCommission.toLocaleString(
                            "en-IN",
                          )}
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </main>

      {/* Footer */}
      <footer className="py-6 text-center text-xs text-gray-400 border-t border-gray-100 mt-4">
        © {new Date().getFullYear()}. Powered by Prashant Chandratre |
        7709446589
      </footer>
    </div>
  );
}
