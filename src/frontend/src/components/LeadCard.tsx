import { ChevronRight, Phone, User, UserCheck } from "lucide-react";
import { AGENTS } from "../context/AppContext";
import type { Lead, WorkflowStatus } from "../types";

const statusConfig: Record<
  WorkflowStatus,
  { dot: string; label: string; bg: string; text: string }
> = {
  "Docs Pending": {
    dot: "bg-orange-400",
    label: "Docs Pending",
    bg: "bg-orange-500/15",
    text: "text-orange-300",
  },
  "Docs Received": {
    dot: "bg-blue-400",
    label: "Docs Received",
    bg: "bg-blue-500/15",
    text: "text-blue-300",
  },
  "Details Completed": {
    dot: "bg-cyan-400",
    label: "Details Completed",
    bg: "bg-cyan-500/15",
    text: "text-cyan-300",
  },
  "Quotation Ready": {
    dot: "bg-teal-400",
    label: "Quotation Ready",
    bg: "bg-teal-500/15",
    text: "text-teal-300",
  },
  "PB Action Required": {
    dot: "bg-red-400",
    label: "PB Action Required",
    bg: "bg-red-500/15",
    text: "text-red-300",
  },
  "KYC Pending": {
    dot: "bg-yellow-400",
    label: "KYC Pending",
    bg: "bg-yellow-500/15",
    text: "text-yellow-300",
  },
  "KYC Completed": {
    dot: "bg-green-400",
    label: "KYC Completed",
    bg: "bg-green-500/15",
    text: "text-green-300",
  },
  "Payment Sent": {
    dot: "bg-purple-400",
    label: "Payment Sent",
    bg: "bg-purple-500/15",
    text: "text-purple-300",
  },
  Completed: {
    dot: "bg-emerald-400",
    label: "Completed",
    bg: "bg-emerald-500/15",
    text: "text-emerald-300",
  },
};

interface LeadCardProps {
  lead: Lead;
  index: number;
  onClick: (lead: Lead) => void;
  showAgent?: boolean;
}

export default function LeadCard({
  lead,
  index,
  onClick,
  showAgent = false,
}: LeadCardProps) {
  const config = statusConfig[lead.workflowStatus];
  const agentName =
    AGENTS.find((a) => a.email === lead.assignedAgent)?.name ??
    lead.assignedAgent;

  return (
    <button
      type="button"
      onClick={() => onClick(lead)}
      className="w-full text-left rounded-2xl shadow-lg transition-all duration-200 active:scale-[0.99] animate-fadeInUp"
      style={{
        animationDelay: `${index * 50}ms`,
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.08)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLButtonElement).style.background =
          "rgba(255,255,255,0.07)";
        (e.currentTarget as HTMLButtonElement).style.borderColor =
          "rgba(255,255,255,0.14)";
        (e.currentTarget as HTMLButtonElement).style.boxShadow =
          "0 8px 32px rgba(0,0,0,0.3)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLButtonElement).style.background =
          "rgba(255,255,255,0.04)";
        (e.currentTarget as HTMLButtonElement).style.borderColor =
          "rgba(255,255,255,0.08)";
        (e.currentTarget as HTMLButtonElement).style.boxShadow = "";
      }}
      data-ocid={`leads.item.${index + 1}`}
    >
      <div className="flex items-center gap-3 px-4 py-3.5">
        {/* Avatar */}
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ background: "linear-gradient(135deg, #1d4ed8, #4f46e5)" }}
        >
          {lead.name ? (
            <span className="text-sm font-bold text-white">
              {lead.name.charAt(0).toUpperCase()}
            </span>
          ) : (
            <User className="w-4 h-4 text-blue-200" />
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <Phone className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
            <span className="text-sm font-semibold text-white font-mono tracking-wide">
              {lead.mobileNumber}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5 truncate">
            {lead.name || (
              <span className="italic text-slate-600">No name</span>
            )}
          </p>
          {showAgent && (
            <div className="flex items-center gap-1 mt-0.5">
              <UserCheck className="w-3 h-3 text-indigo-400 flex-shrink-0" />
              <span className="text-[11px] text-indigo-300 font-medium truncate">
                {agentName}
              </span>
            </div>
          )}
        </div>

        {/* Status badge */}
        <div
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full ${config.bg} flex-shrink-0`}
          style={{ border: "1px solid rgba(255,255,255,0.06)" }}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${config.dot} flex-shrink-0`}
          />
          <span
            className={`text-[11px] font-semibold ${config.text} whitespace-nowrap`}
          >
            {config.label}
          </span>
        </div>

        {/* Arrow */}
        <ChevronRight className="w-4 h-4 text-slate-600 flex-shrink-0 ml-1 group-hover:text-slate-300" />
      </div>
    </button>
  );
}

export { statusConfig };
