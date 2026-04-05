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

export default function DashboardPage() {
  const { currentUser, leads, addLead, logout } = useApp();
  const [currentPage, setCurrentPage] = useState<Page>("dashboard");
  const [view, setView] = useState<DashboardView>("list");
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [showNewLeadDialog, setShowNewLeadDialog] = useState(false);
  const [newLeadAgent, setNewLeadAgent] = useState(AGENTS[0].email);

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
      label: "Avg Rating",
      value: stats.avgRating ? `${stats.avgRating} \u2b50` : "N/A",
      icon: Star,
      color: "text-yellow-600",
      bg: "bg-yellow-50",
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
