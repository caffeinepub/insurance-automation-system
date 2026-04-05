import { Button } from "@/components/ui/button";
import {
  Award,
  BarChart3,
  CheckCircle2,
  Clock,
  ExternalLink,
  LogOut,
  MessageCircle,
  Plus,
  Search,
  Shield,
  TrendingUp,
  Users,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";
import { FormErrorBoundary } from "../App";
import LeadCard from "../components/LeadCard";
import LeadDetailPage from "../components/LeadDetailPage";
import NewLeadFullForm from "../components/NewLeadFullForm";
import PriyaAssistant from "../components/PriyaAssistant";
import Sidebar from "../components/Sidebar";
import WhatsAppLeadModal from "../components/WhatsAppLeadModal";
import { AGENTS, useApp } from "../context/AppContext";
import type { Lead, WorkflowStatus } from "../types";
import { WORKFLOW_STATUSES } from "../types";
import { formatINR } from "../utils/formatCurrency";

type Page = "dashboard" | "leads" | "reports" | "settings";
type DashboardView = "list" | "detail";
type PerfFilter = "today" | "month" | "all";

const STATUS_ALL = "All";

interface DashboardPageProps {
  onAdminPanel?: () => void;
}

const glassCard: React.CSSProperties = {
  backdropFilter: "blur(4px)",
  WebkitBackdropFilter: "blur(4px)",
  background: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(255,255,255,0.12)",
};

export default function DashboardPage({ onAdminPanel }: DashboardPageProps) {
  const { currentUser, leads, logout } = useApp();
  const [currentPage, setCurrentPage] = useState<Page>("dashboard");
  const [view, setView] = useState<DashboardView>("list");
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [showFullForm, setShowFullForm] = useState(false);
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  const [perfFilter, setPerfFilter] = useState<PerfFilter>("month");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    WorkflowStatus | typeof STATUS_ALL
  >(STATUS_ALL);

  const isAdmin = currentUser?.role === "admin";

  const visibleLeads = useMemo(() => {
    if (isAdmin) return leads;
    return leads.filter((l) => l.assignedAgent === currentUser?.email);
  }, [leads, currentUser, isAdmin]);

  const filteredLeads = useMemo(() => {
    let result = visibleLeads;
    if (statusFilter !== STATUS_ALL) {
      result = result.filter((l) => l.workflowStatus === statusFilter);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (l) =>
          l.name.toLowerCase().includes(q) ||
          l.mobileNumber.includes(q) ||
          (l.email ?? "").toLowerCase().includes(q),
      );
    }
    return result;
  }, [visibleLeads, statusFilter, searchQuery]);

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
    }).filter((_a) => true);
  }, [leads, isAdmin]);

  const perfLeads = useMemo(() => {
    if (perfFilter === "all") return leads;
    const now = new Date();
    return leads.filter((lead) => {
      const createdAt = new Date(lead.createdAt);
      if (perfFilter === "today") {
        return createdAt.toDateString() === now.toDateString();
      }
      return (
        createdAt.getFullYear() === now.getFullYear() &&
        createdAt.getMonth() === now.getMonth()
      );
    });
  }, [leads, perfFilter]);

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
    setShowFullForm(true);
  };

  // Conversion % = completed / total * 100
  const conversionPct = Math.round(
    (stats.completed / (stats.totalLeads || 1)) * 100,
  );

  // Premium KPI cards (4 large cards) — using formatINR for currency
  const kpiCards = [
    {
      label: "Total Leads",
      value: String(stats.totalLeads),
      icon: Users,
      gradientFrom: "#3b82f6",
      gradientTo: "#22d3ee",
      accentColor: "rgba(59,130,246,0.3)",
    },
    {
      label: "Business ₹",
      value: formatINR(stats.totalBusiness),
      icon: TrendingUp,
      gradientFrom: "#10b981",
      gradientTo: "#14b8a6",
      accentColor: "rgba(16,185,129,0.3)",
    },
    {
      label: "Commission ₹",
      value: formatINR(stats.totalCommission),
      icon: Award,
      gradientFrom: "#8b5cf6",
      gradientTo: "#a855f7",
      accentColor: "rgba(139,92,246,0.3)",
    },
    {
      label: "Conversion %",
      value: `${conversionPct}%`,
      icon: BarChart3,
      gradientFrom: "#f97316",
      gradientTo: "#f59e0b",
      accentColor: "rgba(249,115,22,0.3)",
    },
  ];

  // Agent perf KPI cards — using formatINR for currency
  const perfKpiCards = [
    {
      label: "Leads Handled",
      value: String(agentPerfKpis?.leadsHandled ?? 0),
      icon: Users,
      gradientFrom: "#3b82f6",
      gradientTo: "#22d3ee",
    },
    {
      label: "Completed Policies",
      value: String(agentPerfKpis?.completedPolicies ?? 0),
      icon: CheckCircle2,
      gradientFrom: "#10b981",
      gradientTo: "#14b8a6",
    },
    {
      label: "Total Business",
      value: formatINR(agentPerfKpis?.totalBusiness ?? 0),
      icon: TrendingUp,
      gradientFrom: "#8b5cf6",
      gradientTo: "#a855f7",
    },
    {
      label: "Commission Earned",
      value: formatINR(agentPerfKpis?.commissionEarned ?? 0),
      icon: Award,
      gradientFrom: "#f97316",
      gradientTo: "#f59e0b",
    },
  ];

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { All: visibleLeads.length };
    for (const s of WORKFLOW_STATUSES) {
      counts[s] = visibleLeads.filter((l) => l.workflowStatus === s).length;
    }
    return counts;
  }, [visibleLeads]);

  // Detail view
  if (view === "detail" && selectedLeadId) {
    return (
      <div
        className="flex h-screen overflow-hidden"
        style={{ background: "transparent" }}
      >
        <div className="hidden md:block">
          <Sidebar
            currentPage={currentPage}
            onNavigate={setCurrentPage}
            onAdminPanel={isAdmin ? onAdminPanel : undefined}
          />
        </div>
        <main className="flex-1 md:ml-[240px] overflow-y-auto">
          <LeadDetailPage leadId={selectedLeadId} onBack={handleBack} />
        </main>
      </div>
    );
  }

  return (
    <div
      className="flex h-screen overflow-hidden"
      style={{ background: "transparent" }}
    >
      <div className="hidden md:block">
        <Sidebar
          currentPage={currentPage}
          onNavigate={setCurrentPage}
          onAdminPanel={isAdmin ? onAdminPanel : undefined}
        />
      </div>

      <div className="flex-1 md:ml-[240px] flex flex-col overflow-hidden">
        {/* Mobile top nav bar */}
        <header
          className="md:hidden flex items-center justify-between px-4 py-3 flex-shrink-0"
          style={{
            background: "rgba(10,14,26,0.95)",
            backdropFilter: "blur(4px)",
            WebkitBackdropFilter: "blur(4px)",
            borderBottom: "1px solid rgba(255,255,255,0.10)",
          }}
        >
          <div className="flex items-center gap-2.5">
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0"
              style={{
                background: "#ffffff",
                borderRadius: 8,
                boxShadow:
                  "0 0 12px rgba(99,102,241,0.5), 0 2px 8px rgba(0,0,0,0.4)",
              }}
            >
              <img
                src="/assets/generated/pb-logo.png"
                alt="PB Insurance Logo"
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "contain",
                  display: "block",
                }}
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).style.display = "none";
                }}
              />
            </div>
            <div>
              <span className="text-sm font-bold text-white">
                PB Insurance AI
              </span>
              <p
                className="text-[10px] font-semibold leading-tight"
                style={{
                  background: "linear-gradient(90deg, #3b82f6, #8b5cf6)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                Priya Insurance AI Employee
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <a
              href="https://www.pbpartners.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-white text-xs font-semibold transition-colors"
              style={{
                background: "linear-gradient(135deg, #3b82f6, #8b5cf6)",
              }}
              data-ocid="header.pb_portal.button"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              PB Portal
            </a>
            <button
              type="button"
              onClick={logout}
              className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-white transition-colors"
              style={{ background: "rgba(255,255,255,0.08)" }}
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
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
                  style={glassCard}
                >
                  <Clock className="w-8 h-8 text-slate-400" />
                </div>
                <h2 className="text-xl font-semibold text-white mb-2">
                  Coming Soon
                </h2>
                <p className="text-slate-400 text-sm">
                  This feature is under development.
                </p>
                <Button
                  onClick={() => setCurrentPage("dashboard")}
                  className="mt-4 text-white"
                  style={{
                    background: "linear-gradient(135deg, #3b82f6, #8b5cf6)",
                  }}
                >
                  Back to Dashboard
                </Button>
              </div>
            </div>
          ) : (
            <div className="p-4 md:p-6 space-y-4 md:space-y-6">
              {/* ── Desktop page header ── */}
              <div className="hidden md:flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-0.5">
                    AI Insurance Trainer 🚀
                  </p>
                  <h1 className="text-2xl font-black text-white">
                    Welcome back! Priya is ready to help you close more deals 💰
                  </h1>
                  <p className="text-sm text-slate-400 mt-0.5">
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
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-semibold transition-all"
                    style={{
                      background: "linear-gradient(135deg, #3b82f6, #8b5cf6)",
                      boxShadow: "0 0 15px rgba(99,102,241,0.35)",
                    }}
                    data-ocid="header.pb_portal.button"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Open PB Portal
                  </a>
                  <div
                    className="flex items-center gap-2.5 px-3 py-2 rounded-xl"
                    style={glassCard}
                  >
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold"
                      style={{
                        background: "linear-gradient(135deg, #3b82f6, #8b5cf6)",
                      }}
                    >
                      {currentUser?.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-white">
                        {currentUser?.name}
                      </p>
                      <p className="text-[10px] text-slate-400 capitalize">
                        {currentUser?.role}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Mobile greeting */}
              <div className="md:hidden">
                <h1 className="text-lg font-black text-white">
                  Hi, {currentUser?.name?.split(" ")[0]}! 👋
                </h1>
                <p className="text-xs text-slate-400">
                  {isAdmin ? "All leads" : "Your leads"}
                </p>
              </div>

              {/* ── Premium KPI Cards ── */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                {kpiCards.map((card, i) => (
                  <div
                    key={card.label}
                    className="rounded-2xl p-5 md:p-6 shadow-xl relative overflow-hidden"
                    style={{
                      backdropFilter: "blur(4px)",
                      WebkitBackdropFilter: "blur(4px)",
                      background: "rgba(255,255,255,0.05)",
                      border: "1px solid rgba(255,255,255,0.13)",
                    }}
                    data-ocid={`dashboard.card.${i + 1}`}
                  >
                    {/* Ambient glow */}
                    <div
                      className="absolute top-0 right-0 w-24 h-24 rounded-full pointer-events-none"
                      style={{
                        background: `radial-gradient(circle, ${card.accentColor} 0%, transparent 70%)`,
                        filter: "blur(15px)",
                        transform: "translate(30%, -30%)",
                      }}
                    />
                    {/* Icon */}
                    <div
                      className="w-12 h-12 md:w-14 md:h-14 rounded-xl flex items-center justify-center mb-4 shadow-lg"
                      style={{
                        background: `linear-gradient(135deg, ${card.gradientFrom}, ${card.gradientTo})`,
                        boxShadow: `0 4px 16px ${card.accentColor}`,
                      }}
                    >
                      <card.icon className="w-6 h-6 md:w-7 md:h-7 text-white" />
                    </div>
                    {/* Value */}
                    <p
                      className="text-2xl md:text-4xl font-black text-white leading-none mb-1.5"
                      style={{ textShadow: "0 2px 8px rgba(0,0,0,0.3)" }}
                    >
                      {card.value}
                    </p>
                    {/* Label */}
                    <p className="text-xs md:text-sm font-semibold text-slate-300">
                      {card.label}
                    </p>
                    {/* Bottom accent line */}
                    <div
                      className="absolute bottom-0 left-0 right-0 h-0.5"
                      style={{
                        background: `linear-gradient(90deg, ${card.gradientFrom}60, ${card.gradientTo}60)`,
                      }}
                    />
                  </div>
                ))}
              </div>

              {/* ── Priya AI — Inline Unified Chat + Voice Interface ── */}
              <PriyaAssistant
                inline
                onOpenNewLead={() => setShowFullForm(true)}
              />

              {/* ── Agent Performance Dashboard ── */}
              <div
                className="rounded-2xl overflow-hidden shadow-xl"
                style={{
                  backdropFilter: "blur(4px)",
                  WebkitBackdropFilter: "blur(4px)",
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.11)",
                }}
                data-ocid="perf.section"
              >
                {/* Section header */}
                <div
                  className="flex items-center justify-between px-4 py-3.5"
                  style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}
                >
                  <div className="flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-indigo-400" />
                    <h2 className="text-sm font-bold text-white">
                      Agent Performance
                    </h2>
                  </div>
                  {/* Filter toggle */}
                  <div
                    className="flex rounded-lg p-0.5"
                    style={{ background: "rgba(255,255,255,0.07)" }}
                  >
                    {(["today", "month", "all"] as PerfFilter[]).map((f) => (
                      <button
                        key={f}
                        type="button"
                        onClick={() => setPerfFilter(f)}
                        className="px-2.5 py-1 rounded-md text-[11px] font-semibold capitalize transition-all"
                        style={
                          perfFilter === f
                            ? {
                                background:
                                  "linear-gradient(135deg, #3b82f6, #8b5cf6)",
                                color: "#fff",
                                boxShadow: "0 2px 8px rgba(99,102,241,0.3)",
                              }
                            : { color: "#94a3b8" }
                        }
                        data-ocid={`perf.filter.${f}.tab`}
                      >
                        {f === "month"
                          ? "Month"
                          : f === "today"
                            ? "Today"
                            : "All Time"}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Agent view: KPI cards */}
                {!isAdmin && agentPerfKpis && (
                  <div className="p-4 grid grid-cols-2 gap-3">
                    {perfKpiCards.map((card) => (
                      <div
                        key={card.label}
                        className="rounded-xl p-3 space-y-2"
                        style={{
                          background: "rgba(255,255,255,0.05)",
                          border: "1px solid rgba(255,255,255,0.10)",
                        }}
                      >
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center"
                          style={{
                            background: `linear-gradient(135deg, ${card.gradientFrom}, ${card.gradientTo})`,
                          }}
                        >
                          <card.icon className="w-4 h-4 text-white" />
                        </div>
                        <p className="text-base font-black text-white leading-tight">
                          {card.value}
                        </p>
                        <p className="text-[10px] text-slate-300 font-semibold">
                          {card.label}
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Admin view: per-agent table */}
                {isAdmin && (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[400px]">
                      <thead>
                        <tr
                          style={{
                            borderBottom: "1px solid rgba(255,255,255,0.08)",
                            background: "rgba(255,255,255,0.03)",
                          }}
                        >
                          <th className="px-4 py-2.5 text-left text-[11px] font-bold text-slate-400 uppercase tracking-wide">
                            Agent
                          </th>
                          <th className="px-4 py-2.5 text-center text-[11px] font-bold text-slate-400 uppercase tracking-wide">
                            Leads
                          </th>
                          <th className="px-4 py-2.5 text-center text-[11px] font-bold text-slate-400 uppercase tracking-wide">
                            Policies
                          </th>
                          <th className="px-4 py-2.5 text-right text-[11px] font-bold text-slate-400 uppercase tracking-wide">
                            Business
                          </th>
                          <th className="px-4 py-2.5 text-right text-[11px] font-bold text-slate-400 uppercase tracking-wide">
                            Commission
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {adminPerfTable.map((agent, idx) => (
                          <tr
                            key={agent.email}
                            style={{
                              borderBottom: "1px solid rgba(255,255,255,0.05)",
                              background:
                                idx % 2 === 0
                                  ? "transparent"
                                  : "rgba(255,255,255,0.02)",
                            }}
                          >
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2.5">
                                <div
                                  className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                                  style={{
                                    background:
                                      "linear-gradient(135deg, #4f46e5, #7c3aed)",
                                  }}
                                >
                                  {agent.name.charAt(0)}
                                </div>
                                <span className="font-semibold text-white text-sm">
                                  {agent.name}
                                </span>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span className="text-xs font-bold text-white">
                                {agent.leadsHandled}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span
                                className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                                  agent.completedPolicies > 0
                                    ? "text-green-300"
                                    : "text-slate-500"
                                }`}
                                style={{
                                  background:
                                    agent.completedPolicies > 0
                                      ? "rgba(16,185,129,0.20)"
                                      : "rgba(255,255,255,0.05)",
                                }}
                              >
                                {agent.completedPolicies}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right font-mono font-semibold text-white">
                              {agent.totalBusiness > 0 ? (
                                formatINR(agent.totalBusiness)
                              ) : (
                                <span className="text-slate-500">&mdash;</span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-right">
                              {agent.commissionEarned > 0 ? (
                                <span
                                  className="inline-block px-2 py-0.5 rounded-md font-bold font-mono text-xs text-emerald-300"
                                  style={{
                                    background: "rgba(16,185,129,0.15)",
                                    border: "1px solid rgba(16,185,129,0.30)",
                                  }}
                                >
                                  {formatINR(agent.commissionEarned)}
                                </span>
                              ) : (
                                <span className="text-slate-500">&mdash;</span>
                              )}
                            </td>
                          </tr>
                        ))}
                        {/* Totals row */}
                        <tr
                          style={{
                            borderTop: "2px solid rgba(255,255,255,0.12)",
                            background: "rgba(255,255,255,0.04)",
                          }}
                        >
                          <td className="px-4 py-3 text-xs font-bold text-slate-300 uppercase tracking-wide">
                            Total
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className="text-xs font-bold text-white">
                              {adminPerfTable.reduce(
                                (s, a) => s + a.leadsHandled,
                                0,
                              )}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className="text-xs font-bold text-white">
                              {agentBreakdown.reduce(
                                (s, a) => s + a.policies,
                                0,
                              )}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right font-mono font-bold text-white">
                            {formatINR(
                              agentBreakdown.reduce(
                                (s, a) => s + a.business,
                                0,
                              ),
                            )}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span
                              className="inline-block px-2 py-0.5 rounded-md font-bold font-mono text-xs text-emerald-300"
                              style={{
                                background: "rgba(16,185,129,0.20)",
                                border: "1px solid rgba(16,185,129,0.40)",
                              }}
                            >
                              {formatINR(
                                agentBreakdown.reduce(
                                  (s, a) => s + a.commission,
                                  0,
                                ),
                              )}
                            </span>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* ── Lead List ── */}
              <div
                className="rounded-2xl shadow-xl overflow-hidden"
                style={{
                  backdropFilter: "blur(4px)",
                  WebkitBackdropFilter: "blur(4px)",
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.11)",
                }}
              >
                <div
                  className="flex items-center justify-between px-4 py-3.5"
                  style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}
                >
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-slate-300" />
                    <h2 className="text-sm font-bold text-white">Leads</h2>
                    <span className="text-xs text-slate-400 font-medium">
                      ({filteredLeads.length}
                      {filteredLeads.length !== visibleLeads.length
                        ? `/${visibleLeads.length}`
                        : ""}
                      )
                    </span>
                    {isAdmin && (
                      <span
                        className="text-[10px] font-semibold px-2 py-0.5 rounded-full text-blue-300"
                        style={{
                          background: "rgba(59,130,246,0.15)",
                          border: "1px solid rgba(59,130,246,0.30)",
                        }}
                      >
                        All Agents
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={() => setShowWhatsAppModal(true)}
                      variant="outline"
                      className="text-xs h-8 px-3 flex items-center gap-1.5 rounded-xl border-0 text-white font-semibold"
                      style={{
                        background: "linear-gradient(135deg, #16a34a, #059669)",
                        boxShadow: "0 0 12px rgba(16,185,129,0.25)",
                      }}
                      data-ocid="leads.whatsapp_create.button"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">From WhatsApp</span>
                    </Button>
                    <Button
                      onClick={handleAddLead}
                      className="text-xs h-8 px-3 flex items-center gap-1.5 rounded-xl border-0 text-white font-semibold"
                      style={{
                        background: "linear-gradient(135deg, #3b82f6, #6366f1)",
                        boxShadow: "0 0 15px rgba(99,102,241,0.4)",
                      }}
                      data-ocid="leads.add_button"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      New Lead
                    </Button>
                  </div>
                </div>

                {/* Search bar */}
                <div className="px-4 pt-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search by name, mobile or email\u2026"
                      className="w-full pl-9 pr-9 py-2 text-sm rounded-xl focus:outline-none font-medium"
                      style={{
                        background: "rgba(255,255,255,0.12)",
                        border: "1px solid rgba(139,92,246,0.35)",
                        color: "#ffffff",
                      }}
                      data-ocid="leads.search_input"
                    />
                    {searchQuery && (
                      <button
                        type="button"
                        onClick={() => setSearchQuery("")}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors"
                        aria-label="Clear search"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Status filter chips */}
                <div className="px-4 py-2.5 overflow-x-auto">
                  <div className="flex items-center gap-1.5 min-w-max">
                    <button
                      type="button"
                      onClick={() => setStatusFilter(STATUS_ALL)}
                      className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all"
                      style={
                        statusFilter === STATUS_ALL
                          ? {
                              background:
                                "linear-gradient(135deg, #3b82f6, #6366f1)",
                              color: "#fff",
                              boxShadow: "0 0 10px rgba(99,102,241,0.30)",
                              border: "1px solid transparent",
                            }
                          : {
                              background: "rgba(255,255,255,0.06)",
                              border: "1px solid rgba(255,255,255,0.13)",
                              color: "#cbd5e1",
                            }
                      }
                      data-ocid="leads.status_filter.all.toggle"
                    >
                      All
                      <span
                        className="px-1.5 py-0.5 rounded-full text-[10px] font-bold ml-0.5"
                        style={{
                          background:
                            statusFilter === STATUS_ALL
                              ? "rgba(255,255,255,0.20)"
                              : "rgba(255,255,255,0.10)",
                        }}
                      >
                        {statusCounts.All}
                      </span>
                    </button>

                    {WORKFLOW_STATUSES.map((status) => {
                      const isActive = statusFilter === status;
                      const count = statusCounts[status] ?? 0;
                      return (
                        <button
                          key={status}
                          type="button"
                          onClick={() =>
                            setStatusFilter(isActive ? STATUS_ALL : status)
                          }
                          className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all"
                          style={
                            isActive
                              ? {
                                  background:
                                    "linear-gradient(135deg, #3b82f6, #6366f1)",
                                  color: "#fff",
                                  boxShadow: "0 0 10px rgba(99,102,241,0.30)",
                                  border: "1px solid transparent",
                                }
                              : {
                                  background: "rgba(255,255,255,0.05)",
                                  border: "1px solid rgba(255,255,255,0.11)",
                                  color: "#cbd5e1",
                                }
                          }
                          data-ocid={`leads.status_filter.${status
                            .toLowerCase()
                            .replace(/\s+/g, "_")}.toggle`}
                        >
                          {status}
                          <span
                            className="px-1.5 py-0.5 rounded-full text-[10px] font-bold ml-0.5"
                            style={{
                              background: isActive
                                ? "rgba(255,255,255,0.20)"
                                : count > 0
                                  ? "rgba(59,130,246,0.25)"
                                  : "rgba(255,255,255,0.07)",
                              color: isActive
                                ? "#fff"
                                : count > 0
                                  ? "#93c5fd"
                                  : "#64748b",
                            }}
                          >
                            {count}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="p-3 space-y-2">
                  {filteredLeads.length === 0 ? (
                    <div
                      className="flex flex-col items-center justify-center py-12 text-center"
                      data-ocid="leads.empty_state"
                    >
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center mb-3"
                        style={glassCard}
                      >
                        <Users className="w-6 h-6 text-slate-400" />
                      </div>
                      <p className="text-sm font-semibold text-white">
                        {searchQuery || statusFilter !== STATUS_ALL
                          ? "No leads match your filter"
                          : "No leads yet"}
                      </p>
                      <p className="text-xs text-slate-400 mt-1">
                        {searchQuery || statusFilter !== STATUS_ALL
                          ? "Try clearing the search or status filter"
                          : 'Tap "New Lead" to get started'}
                      </p>
                    </div>
                  ) : (
                    filteredLeads.map((lead, idx) => (
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
          <footer
            className="px-4 py-4 text-center text-xs text-slate-400 mt-2"
            style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}
          >
            Powered by Prashant Chandratre | 7709446589
          </footer>
        </main>
      </div>

      {/* New Lead Full Form — wrapped in FormErrorBoundary */}
      {showFullForm && (
        <FormErrorBoundary>
          <NewLeadFullForm
            isAdmin={isAdmin}
            defaultAgent={isAdmin ? AGENTS[0].email : currentUser?.email}
            onSave={(id) => {
              setShowFullForm(false);
              setSelectedLeadId(id);
              setView("detail");
              setCurrentPage("leads");
            }}
            onCancel={() => setShowFullForm(false)}
          />
        </FormErrorBoundary>
      )}

      {/* WhatsApp Lead Modal */}
      {showWhatsAppModal && (
        <WhatsAppLeadModal
          isAdmin={isAdmin}
          onClose={() => setShowWhatsAppModal(false)}
          onLeadCreated={(id) => {
            setShowWhatsAppModal(false);
            setSelectedLeadId(id);
            setView("detail");
          }}
        />
      )}
    </div>
  );
}
