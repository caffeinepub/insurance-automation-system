import { Button } from "@/components/ui/button";
import {
  Bell,
  CheckCircle2,
  Clock,
  DollarSign,
  ExternalLink,
  FileText,
  Plus,
  Star,
  TrendingUp,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import LeadDetailPanel from "../components/LeadDetailPanel";
import LeadTable from "../components/LeadTable";
import LeadWorkflowModal from "../components/LeadWorkflowModal";
import Sidebar from "../components/Sidebar";
import { useApp } from "../context/AppContext";
import type { Lead } from "../types";

type Page = "dashboard" | "leads" | "reports" | "settings";

export default function DashboardPage() {
  const { currentUser, leads, addLead } = useApp();
  const [currentPage, setCurrentPage] = useState<Page>("dashboard");
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [detailLead, setDetailLead] = useState<Lead | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const visibleLeads = useMemo(() => {
    if (currentUser?.role === "admin") return leads;
    return leads.filter((l) => l.assignedAgent === currentUser?.email);
  }, [leads, currentUser]);

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
      (l) => l.policyStatus === "Completed",
    ).length;
    const totalBusiness = visibleLeads
      .filter((l) => l.policyStatus === "Completed")
      .reduce((sum, l) => sum + l.quoteAmount, 0);
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
      avgRating,
    };
  }, [visibleLeads]);

  const openLead = (lead: Lead) => {
    setSelectedLead(lead);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setTimeout(() => setSelectedLead(null), 300);
  };

  const openDetail = (lead: Lead) => {
    setDetailLead(lead);
    setIsDetailOpen(true);
  };

  const closeDetail = () => {
    setIsDetailOpen(false);
    setTimeout(() => setDetailLead(null), 300);
  };

  const handleAddLead = () => {
    addLead();
    toast.success("New lead created!");
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
      label: "Total Policies",
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
      label: "Total Business",
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

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar currentPage={currentPage} onNavigate={setCurrentPage} />

      <main className="flex-1 ml-[240px] overflow-y-auto">
        {currentPage !== "dashboard" && currentPage !== "leads" ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
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
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wider font-medium mb-0.5">
                  Dashboard
                </p>
                <h1 className="text-2xl font-bold text-gray-900">
                  Good day, {currentUser?.name}! &#128075;
                </h1>
                <p className="text-sm text-gray-500 mt-0.5">
                  Here&apos;s your insurance pipeline at a glance.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <a
                  href="https://www.pbpartners.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors shadow-sm"
                  data-ocid="header.pb_portal.button"
                >
                  <ExternalLink className="w-4 h-4" />
                  Open PB Portal
                </a>
                <button
                  type="button"
                  className="relative p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-white border border-gray-200 transition-colors"
                >
                  <Bell className="w-5 h-5" />
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
                </button>
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

            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
              {summaryCards.map((card, i) => (
                <div
                  key={card.label}
                  className="bg-white rounded-xl border border-gray-200 shadow-xs p-4 flex flex-col gap-2"
                  data-ocid={`dashboard.card.${i + 1}`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500 font-medium">
                      {card.label}
                    </span>
                    <div
                      className={`w-8 h-8 rounded-lg ${card.bg} flex items-center justify-center`}
                    >
                      <card.icon className={`w-4 h-4 ${card.color}`} />
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-gray-900 leading-none">
                    {card.value}
                  </p>
                </div>
              ))}
            </div>

            <div className="bg-white rounded-xl border border-gray-200 shadow-xs">
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                <div>
                  <h2 className="text-base font-semibold text-gray-900">
                    Lead Management Table
                  </h2>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {visibleLeads.length} total leads &bull; Click a row to view
                    details
                  </p>
                </div>
                <Button
                  onClick={handleAddLead}
                  className="bg-gray-900 hover:bg-gray-800 text-white text-sm h-9 px-4 flex items-center gap-2"
                  data-ocid="leads.add_button"
                >
                  <Plus className="w-4 h-4" />
                  New Lead
                </Button>
              </div>
              <LeadTable
                leads={visibleLeads}
                onOpenLead={openLead}
                onOpenDetail={openDetail}
              />
            </div>
          </div>
        )}

        <footer className="px-6 py-4 text-center text-xs text-gray-400 border-t border-gray-100 mt-4">
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

      {selectedLead && (
        <LeadWorkflowModal
          lead={selectedLead}
          isOpen={isModalOpen}
          onClose={closeModal}
        />
      )}

      <LeadDetailPanel
        lead={detailLead}
        isOpen={isDetailOpen}
        onClose={closeDetail}
      />
    </div>
  );
}
