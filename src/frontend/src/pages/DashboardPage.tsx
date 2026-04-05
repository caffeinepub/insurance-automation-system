import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Award,
  BarChart3,
  CheckCircle2,
  Clock,
  DollarSign,
  ExternalLink,
  FileText,
  LogOut,
  Plus,
  Shield,
  Star,
  TrendingUp,
  Users,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import LeadCard from "../components/LeadCard";
import LeadDetailPage from "../components/LeadDetailPage";
import Sidebar from "../components/Sidebar";
import { AGENTS, useApp } from "../context/AppContext";
import type { Lead } from "../types";

type Page = "dashboard" | "leads" | "reports" | "settings";
type DashboardView = "list" | "detail";
type PerfFilter = "today" | "month";

export default function DashboardPage() {
  const { currentUser, leads, addLead, logout } = useApp();
  const [currentPage, setCurrentPage] = useState<Page>("dashboard");
  const [view, setView] = useState<DashboardView>("list");
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [showNewLeadDialog, setShowNewLeadDialog] = useState(false);
  const [newLeadAgent, setNewLeadAgent] = useState(AGENTS[0].email);
  const [perfFilter, setPerfFilter] = useState<PerfFilter>("month");

  const isAdmin = currentUser?.role === "admin";

  const visibleLeads = useMemo(() => {
    if (isAdmin) return leads;
    return leads.filter((l) => l.assignedAgent === currentUser?.email);
  }, [leads, currentUser, isAdmin]);

  const stats = useMemo(() => {
    const totalLeads = visibleLeads.length;
    const totalPolicies = visibleLeads.filter(
      (l) => l.policyStatus === "Completed",
    ).length;
    const pending = visibleLeads.filter(
      (l) =>
        l.policyStatus !== "Completed" &&
        (l.rcStatus === "Docs Pending" ||
          l.paymentStatus === "Payment Pending" ||
          l.kycStatus !== "KYC Completed"),
    ).length;
    const completed = visibleLeads.filter(
      (l) => l.workflowStatus === "Completed",
    ).length;
    const completedLeads = visibleLeads.filter(
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
    const ratedLeads = visibleLeads.filter((l) => l.rating !== null);
    const avgRating =
      ratedLeads.length > 0
        ? (
            ratedLeads.reduce((sum, l) => sum + (l.rating ?? 0), 0) /
            ratedLeads.length
          ).toFixed(1)
        : null;
    return {
      totalLeads,
      totalPolicies,
      pending,
      completed,
      totalBusiness,
      totalCommission,
      avgRating,
    };
  }, [visibleLeads]);

  // Per-agent breakdown (admin only)
  const agentBreakdown = useMemo(() => {
    if (!isAdmin) return [];
    return AGENTS.map((agent) => {
      const agentLeads = leads.filter(
        (l) =>
          l.assignedAgent === agent.email && l.workflowStatus === "Completed",
      );
      const business = agentLeads.reduce(
        (sum, l) => sum + (l.policyAmount || 0),
        0,
      );
      const commission = agentLeads.reduce(
        (sum, l) =>
          sum +
          Math.round(
            ((l.policyAmount || 0) * (l.commissionPercent || 0)) / 100,
          ),
        0,
      );
      return {
        name: agent.name,
        email: agent.email,
        policies: agentLeads.length,
        business,
        commission,
      };
    }).filter((a) => a.policies > 0 || true); // show all agents
  }, [leads, isAdmin]);

  // Performance filter helper
  const perfLeads = useMemo(() => {
    const now = new Date();
    return leads.filter((lead) => {
      const createdAt = new Date(lead.createdAt);
      if (perfFilter === "today") {
        return createdAt.toDateString() === now.toDateString();
      }
      // month
      return (
        createdAt.getFullYear() === now.getFullYear() &&
        createdAt.getMonth() === now.getMonth()
      );
    });
  }, [leads, perfFilter]);

  // Agent performance KPIs
  const agentPerfKpis = useMemo(() => {
    if (isAdmin) return null;
    const myLeads = perfLeads.filter(
      (l) => l.assignedAgent === currentUser?.email,
    );
    const completed = myLeads.filter((l) => l.workflowStatus === "Completed");
    const totalBusiness = completed.reduce(
      (sum, l) => sum + (l.policyAmount || 0),
      0,
    );
    const commissionEarned = completed.reduce(
      (sum, l) =>
        sum +
        Math.round(((l.policyAmount || 0) * (l.commissionPercent || 0)) / 100),
      0,
    );
    return {
      leadsHandled: myLeads.length,
      completedPolicies: completed.length,
      totalBusiness,
      commissionEarned,
    };
  }, [perfLeads, currentUser, isAdmin]);

  // Admin agent performance table
  const adminPerfTable = useMemo(() => {
    if (!isAdmin) return [];
    return AGENTS.map((agent) => {
      const agentLeads = perfLeads.filter(
        (l) => l.assignedAgent === agent.email,
      );
      const completed = agentLeads.filter(
        (l) => l.workflowStatus === "Completed",
      );
      const totalBusiness = completed.reduce(
        (sum, l) => sum + (l.policyAmount || 0),
        0,
      );
      const commissionEarned = completed.reduce(
        (sum, l) =>
          sum +
          Math.round(
            ((l.policyAmount || 0) * (l.commissionPercent || 0)) / 100,
          ),
        0,
      );
      return {
        name: agent.name,
        email: agent.email,
        leadsHandled: agentLeads.length,
        completedPolicies: completed.length,
        totalBusiness,
        commissionEarned,
      };
    });
  }, [perfLeads, isAdmin]);

  const handleOpenLead = (lead: Lead) => {
    setSelectedLeadId(lead.id);
    setView("detail");
  };

  const handleBack = () => {
    setView("list");
    setSelectedLeadId(null);
  };

  const handleAddLead = () => {
    if (isAdmin) {
      setNewLeadAgent(AGENTS[0].email);
      setShowNewLeadDialog(true);
    } else {
      const agentEmail = currentUser?.email ?? "agent1@insurance.com";
      addLead(agentEmail);
      toast.success("New lead created!");
    }
  };

  const handleCreateLead = () => {
    addLead(newLeadAgent);
    toast.success("New lead created!");
    setShowNewLeadDialog(false);
  };

  const summaryCards = [
    {
      label: "Total Leads",
      value: stats.totalLeads,
      icon: TrendingUp,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      label: "Policies",
      value: stats.totalPolicies,
      icon: FileText,
      color: "text-purple-600",
      bg: "bg-purple-50",
    },
    {
      label: "Pending",
      value: stats.pending,
      icon: Clock,
      color: "text-orange-600",
      bg: "bg-orange-50",
    },
    {
      label: "Completed",
      value: stats.completed,
      icon: CheckCircle2,
      color: "text-green-600",
      bg: "bg-green-50",
    },
    {
      label: "Business",
      value: `\u20b9${stats.totalBusiness.toLocaleString("en-IN")}`,
      icon: DollarSign,
      color: "text-teal-600",
      bg: "bg-teal-50",
    },
    {
      label: "Commission",
      value: `\u20b9${stats.totalCommission.toLocaleString("en-IN")}`,
      icon: Award,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
    },
  ];

  const perfKpiCards = [
    {
      label: "Leads Handled",
      value: agentPerfKpis?.leadsHandled ?? 0,
      icon: Users,
      color: "text-blue-600",
      bg: "bg-blue-50",
      border: "border-blue-100",
      valueColor: "text-blue-700",
    },
    {
      label: "Completed Policies",
      value: agentPerfKpis?.completedPolicies ?? 0,
      icon: CheckCircle2,
      color: "text-green-600",
      bg: "bg-green-50",
      border: "border-green-100",
      valueColor: "text-green-700",
    },
    {
      label: "Total Business",
      value: `\u20b9${(agentPerfKpis?.totalBusiness ?? 0).toLocaleString("en-IN")}`,
      icon: TrendingUp,
      color: "text-teal-600",
      bg: "bg-teal-50",
      border: "border-teal-100",
      valueColor: "text-teal-700",
    },
    {
      label: "Commission Earned",
      value: `\u20b9${(agentPerfKpis?.commissionEarned ?? 0).toLocaleString("en-IN")}`,
      icon: Award,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
      border: "border-emerald-100",
      valueColor: "text-emerald-700",
    },
  ];

  // Detail view
  if (view === "detail" && selectedLeadId) {
    return (
      <div className="flex h-screen bg-background overflow-hidden">
        <div className="hidden md:block">
          <Sidebar currentPage={currentPage} onNavigate={setCurrentPage} />
        </div>
        <main className="flex-1 md:ml-[240px] overflow-y-auto">
          <LeadDetailPage leadId={selectedLeadId} onBack={handleBack} />
        </main>
      </div>
    );
  }

  // List view
  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <div className="hidden md:block">
        <Sidebar currentPage={currentPage} onNavigate={setCurrentPage} />
      </div>

      <div className="flex-1 md:ml-[240px] flex flex-col overflow-hidden">
        {/* Mobile top nav bar */}
        <header className="md:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-gray-200 shadow-xs flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
              <Shield className="w-4 h-4 text-white" />
            </div>
            <span className="text-sm font-bold text-gray-900">InsureFlow</span>
          </div>
          <div className="flex items-center gap-2">
            <a
              href="https://www.pbpartners.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-colors"
              data-ocid="header.pb_portal.button"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              PB Portal
            </a>
            <button
              type="button"
              onClick={logout}
              className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-gray-200 transition-colors"
              data-ocid="mobile.logout.button"
              aria-label="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">
          {currentPage !== "dashboard" && currentPage !== "leads" ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center p-8">
                <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
                  <Clock className="w-8 h-8 text-gray-400" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  Coming Soon
                </h2>
                <p className="text-gray-500 text-sm">
                  This feature is under development.
                </p>
                <Button
                  onClick={() => setCurrentPage("dashboard")}
                  className="mt-4 bg-gray-900 hover:bg-gray-800 text-white"
                >
                  Back to Dashboard
                </Button>
              </div>
            </div>
          ) : (
            <div className="p-4 md:p-6 space-y-4 md:space-y-6">
              {/* Desktop page header */}
              <div className="hidden md:flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold mb-0.5">
                    {isAdmin ? "Admin Dashboard" : "Agent Dashboard"}
                  </p>
                  <h1 className="text-2xl font-bold text-gray-900">
                    Good day, {currentUser?.name}! &#128075;
                  </h1>
                  <p className="text-sm text-gray-500 mt-0.5">
                    {isAdmin
                      ? "Viewing all leads across all agents."
                      : "Viewing your assigned leads."}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <a
                    href="https://www.pbpartners.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors shadow-xs"
                    data-ocid="header.pb_portal.button"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Open PB Portal
                  </a>
                  <div className="flex items-center gap-2.5 bg-white border border-gray-200 rounded-lg px-3 py-2 shadow-xs">
                    <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold">
                      {currentUser?.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-900">
                        {currentUser?.name}
                      </p>
                      <p className="text-[10px] text-gray-400 capitalize">
                        {currentUser?.role}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Mobile greeting */}
              <div className="md:hidden">
                <h1 className="text-lg font-bold text-gray-900">
                  Hi, {currentUser?.name?.split(" ")[0]}! &#128075;
                </h1>
                <p className="text-xs text-gray-500">
                  {isAdmin ? "All leads" : "Your leads"}
                </p>
              </div>

              {/* Stats grid */}
              <div className="grid grid-cols-3 md:grid-cols-6 gap-2.5 md:gap-4">
                {summaryCards.map((card, i) => (
                  <div
                    key={card.label}
                    className="bg-white rounded-xl border border-gray-200 shadow-xs p-3 md:p-4 flex flex-col gap-1.5"
                    data-ocid={`dashboard.card.${i + 1}`}
                  >
                    <div
                      className={`w-7 h-7 rounded-lg ${card.bg} flex items-center justify-center`}
                    >
                      <card.icon className={`w-3.5 h-3.5 ${card.color}`} />
                    </div>
                    <p className="text-lg md:text-2xl font-bold text-gray-900 leading-none">
                      {card.value}
                    </p>
                    <span className="text-[10px] md:text-xs text-gray-500 font-medium">
                      {card.label}
                    </span>
                  </div>
                ))}
              </div>

              {/* ── Agent Performance Dashboard ── */}
              <div
                className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden"
                data-ocid="perf.section"
              >
                {/* Section header with filter toggle */}
                <div className="flex items-center justify-between px-4 py-3.5 border-b border-gray-100">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-indigo-500" />
                    <h2 className="text-sm font-bold text-gray-900">
                      Agent Performance
                    </h2>
                  </div>
                  {/* Filter pill toggle */}
                  <fieldset
                    className="flex items-center gap-1 bg-gray-100 rounded-full p-1 border-none m-0"
                    aria-label="Performance filter"
                  >
                    <legend className="sr-only">Performance filter</legend>
                    <button
                      type="button"
                      onClick={() => setPerfFilter("today")}
                      className={`px-3 py-1 rounded-full text-xs font-semibold transition-all duration-150 ${
                        perfFilter === "today"
                          ? "bg-gray-900 text-white shadow-sm"
                          : "text-gray-500 hover:text-gray-800"
                      }`}
                      data-ocid="perf.filter.tab"
                      aria-pressed={perfFilter === "today"}
                    >
                      Today
                    </button>
                    <button
                      type="button"
                      onClick={() => setPerfFilter("month")}
                      className={`px-3 py-1 rounded-full text-xs font-semibold transition-all duration-150 ${
                        perfFilter === "month"
                          ? "bg-gray-900 text-white shadow-sm"
                          : "text-gray-500 hover:text-gray-800"
                      }`}
                      data-ocid="perf.filter.tab"
                      aria-pressed={perfFilter === "month"}
                    >
                      This Month
                    </button>
                  </fieldset>
                </div>

                <div className="p-4">
                  {/* ── Agent view: 4 KPI cards ── */}
                  {!isAdmin && agentPerfKpis && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {perfKpiCards.map((card, idx) => (
                        <div
                          key={card.label}
                          className={`rounded-xl border ${card.border} p-3.5 flex flex-col gap-2`}
                          data-ocid={`perf.card.${idx + 1}`}
                        >
                          <div
                            className={`w-8 h-8 rounded-lg ${card.bg} flex items-center justify-center`}
                          >
                            <card.icon className={`w-4 h-4 ${card.color}`} />
                          </div>
                          <p
                            className={`text-xl md:text-2xl font-bold leading-none ${card.valueColor}`}
                          >
                            {card.value}
                          </p>
                          <span className="text-[11px] text-gray-500 font-medium leading-tight">
                            {card.label}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* ── Admin view: per-agent table ── */}
                  {isAdmin && (
                    <div className="overflow-x-auto -mx-4 px-4">
                      <table className="w-full text-sm min-w-[520px]">
                        <thead>
                          <tr className="border-b border-gray-100">
                            <th className="text-left pb-2.5 pt-0 text-xs font-semibold text-gray-400 uppercase tracking-wide">
                              Agent
                            </th>
                            <th className="text-center pb-2.5 pt-0 text-xs font-semibold text-gray-400 uppercase tracking-wide">
                              Leads Handled
                            </th>
                            <th className="text-center pb-2.5 pt-0 text-xs font-semibold text-gray-400 uppercase tracking-wide">
                              Completed Policies
                            </th>
                            <th className="text-right pb-2.5 pt-0 text-xs font-semibold text-gray-400 uppercase tracking-wide">
                              Total Business
                            </th>
                            <th className="text-right pb-2.5 pt-0 text-xs font-semibold text-gray-400 uppercase tracking-wide">
                              Commission Earned
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {adminPerfTable.map((agent, idx) => (
                            <tr
                              key={agent.email}
                              className={`border-b border-gray-50 ${
                                idx % 2 === 0 ? "" : "bg-gray-50/30"
                              }`}
                              data-ocid={`perf.row.${idx + 1}`}
                            >
                              <td className="py-3">
                                <div className="flex items-center gap-2.5">
                                  <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 text-xs font-bold flex-shrink-0">
                                    {agent.name.charAt(0)}
                                  </div>
                                  <span className="font-medium text-gray-800">
                                    {agent.name}
                                  </span>
                                </div>
                              </td>
                              <td className="py-3 text-center">
                                {agent.leadsHandled > 0 ? (
                                  <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-blue-100 text-blue-700 text-xs font-bold">
                                    {agent.leadsHandled}
                                  </span>
                                ) : (
                                  <span className="text-gray-300 text-sm">
                                    —
                                  </span>
                                )}
                              </td>
                              <td className="py-3 text-center">
                                {agent.completedPolicies > 0 ? (
                                  <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-green-100 text-green-700 text-xs font-bold">
                                    {agent.completedPolicies}
                                  </span>
                                ) : (
                                  <span className="text-gray-300 text-sm">
                                    —
                                  </span>
                                )}
                              </td>
                              <td className="py-3 text-right font-mono font-semibold text-gray-800">
                                {agent.totalBusiness > 0 ? (
                                  `\u20b9${agent.totalBusiness.toLocaleString("en-IN")}`
                                ) : (
                                  <span className="text-gray-300 font-normal">
                                    —
                                  </span>
                                )}
                              </td>
                              <td className="py-3 text-right">
                                {agent.commissionEarned > 0 ? (
                                  <span className="inline-block px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-bold font-mono text-xs border border-emerald-100">
                                    \u20b9
                                    {agent.commissionEarned.toLocaleString(
                                      "en-IN",
                                    )}
                                  </span>
                                ) : (
                                  <span className="text-gray-300">—</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {adminPerfTable.every((a) => a.leadsHandled === 0) && (
                        <div
                          className="text-center py-6"
                          data-ocid="perf.empty_state"
                        >
                          <p className="text-xs text-gray-400">
                            No leads in this period.
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Agent Commission Breakdown (Admin only) */}
              {isAdmin && (
                <div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
                  <div className="flex items-center gap-2 px-4 py-3.5 border-b border-gray-100">
                    <Award className="w-4 h-4 text-emerald-500" />
                    <h2 className="text-sm font-bold text-gray-900">
                      Commission by Agent
                    </h2>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-100">
                          <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                            Agent
                          </th>
                          <th className="text-center px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                            Policies
                          </th>
                          <th className="text-right px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                            Business (₹)
                          </th>
                          <th className="text-right px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                            Commission (₹)
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {agentBreakdown.map((agent, idx) => (
                          <tr
                            key={agent.email}
                            className={`border-b border-gray-50 ${idx % 2 === 0 ? "bg-white" : "bg-gray-50/40"}`}
                          >
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2.5">
                                <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 text-xs font-bold flex-shrink-0">
                                  {agent.name.charAt(0)}
                                </div>
                                <span className="font-medium text-gray-800 text-sm">
                                  {agent.name}
                                </span>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span
                                className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                                  agent.policies > 0
                                    ? "bg-green-100 text-green-700"
                                    : "bg-gray-100 text-gray-400"
                                }`}
                              >
                                {agent.policies}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right font-mono font-semibold text-gray-800">
                              {agent.business > 0 ? (
                                `\u20b9${agent.business.toLocaleString("en-IN")}`
                              ) : (
                                <span className="text-gray-300 font-normal">
                                  —
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-right">
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
                          <td className="px-4 py-3 text-xs font-bold text-gray-600 uppercase tracking-wide">
                            Total
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className="text-xs font-bold text-gray-700">
                              {agentBreakdown.reduce(
                                (s, a) => s + a.policies,
                                0,
                              )}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right font-mono font-bold text-gray-900">
                            ₹
                            {agentBreakdown
                              .reduce((s, a) => s + a.business, 0)
                              .toLocaleString("en-IN")}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span className="inline-block px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-bold font-mono text-xs border border-emerald-200">
                              ₹
                              {agentBreakdown
                                .reduce((s, a) => s + a.commission, 0)
                                .toLocaleString("en-IN")}
                            </span>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Lead List */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-xs">
                <div className="flex items-center justify-between px-4 py-3.5 border-b border-gray-100">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-gray-400" />
                    <h2 className="text-sm font-bold text-gray-900">Leads</h2>
                    <span className="text-xs text-gray-400 font-medium">
                      ({visibleLeads.length})
                    </span>
                    {isAdmin && (
                      <span className="text-[10px] bg-blue-50 text-blue-600 font-semibold px-2 py-0.5 rounded-full border border-blue-100">
                        All Agents
                      </span>
                    )}
                  </div>
                  <Button
                    onClick={handleAddLead}
                    className="bg-gray-900 hover:bg-gray-800 text-white text-xs h-8 px-3 flex items-center gap-1.5 rounded-lg"
                    data-ocid="leads.add_button"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    New Lead
                  </Button>
                </div>

                <div className="p-3 space-y-2">
                  {visibleLeads.length === 0 ? (
                    <div
                      className="flex flex-col items-center justify-center py-12 text-center"
                      data-ocid="leads.empty_state"
                    >
                      <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center mb-3">
                        <Users className="w-6 h-6 text-gray-400" />
                      </div>
                      <p className="text-sm font-semibold text-gray-600">
                        No leads yet
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        Tap "New Lead" to get started
                      </p>
                    </div>
                  ) : (
                    visibleLeads.map((lead, idx) => (
                      <LeadCard
                        key={lead.id}
                        lead={lead}
                        index={idx}
                        onClick={handleOpenLead}
                        showAgent={isAdmin}
                      />
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Footer */}
          <footer className="px-4 py-4 text-center text-xs text-gray-400 border-t border-gray-100 mt-2">
            &copy; {new Date().getFullYear()}. Built with &#10084;&#65039; using{" "}
            <a
              href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 hover:underline"
            >
              caffeine.ai
            </a>
          </footer>
        </main>
      </div>

      {/* New Lead Dialog (Admin only) */}
      <Dialog open={showNewLeadDialog} onOpenChange={setShowNewLeadDialog}>
        <DialogContent className="sm:max-w-sm" data-ocid="new_lead.dialog">
          <DialogHeader>
            <DialogTitle>Assign New Lead</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="agent-select">Assign to Agent</Label>
              <Select value={newLeadAgent} onValueChange={setNewLeadAgent}>
                <SelectTrigger
                  id="agent-select"
                  className="h-11"
                  data-ocid="new_lead.select"
                >
                  <SelectValue placeholder="Select agent" />
                </SelectTrigger>
                <SelectContent>
                  {AGENTS.map((agent) => (
                    <SelectItem key={agent.email} value={agent.email}>
                      {agent.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setShowNewLeadDialog(false)}
              className="flex-1"
              data-ocid="new_lead.cancel_button"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateLead}
              className="flex-1 bg-gray-900 hover:bg-gray-800 text-white"
              data-ocid="new_lead.confirm_button"
            >
              Create Lead
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
