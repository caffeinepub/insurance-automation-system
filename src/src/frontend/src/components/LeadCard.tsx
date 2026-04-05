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
    bg: "bg-orange-50",
    text: "text-orange-700",
  },
  "Docs Received": {
    dot: "bg-blue-400",
    label: "Docs Received",
    bg: "bg-blue-50",
    text: "text-blue-700",
  },
  "Details Completed": {
    dot: "bg-cyan-400",
    label: "Details Completed",
    bg: "bg-cyan-50",
    text: "text-cyan-700",
  },
  "Quotation Ready": {
    dot: "bg-teal-400",
    label: "Quotation Ready",
    bg: "bg-teal-50",
    text: "text-teal-700",
  },
  "PB Action Required": {
    dot: "bg-red-400",
    label: "PB Action Required",
    bg: "bg-red-50",
    text: "text-red-700",
  },
  "KYC Pending": {
    dot: "bg-yellow-400",
    label: "KYC Pending",
    bg: "bg-yellow-50",
    text: "text-yellow-700",
  },
  "KYC Completed": {
    dot: "bg-green-400",
    label: "KYC Completed",
    bg: "bg-green-50",
    text: "text-green-700",
  },
  "Payment Sent": {
    dot: "bg-purple-400",
    label: "Payment Sent",
    bg: "bg-purple-50",
    text: "text-purple-700",
  },
  Completed: {
    dot: "bg-emerald-400",
    label: "Completed",
    bg: "bg-emerald-50",
    text: "text-emerald-700",
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
      className="w-full text-left bg-white rounded-xl border border-gray-200 shadow-xs hover:shadow-card hover:border-blue-200 transition-all duration-150 active:scale-[0.99]"
      data-ocid={`leads.item.${index + 1}`}
    >
      <div className="flex items-center gap-3 px-4 py-3.5">
        {/* Avatar */}
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center flex-shrink-0">
          {lead.name ? (
            <span className="text-sm font-semibold text-blue-700">
              {lead.name.charAt(0).toUpperCase()}
            </span>
          ) : (
            <User className="w-4 h-4 text-blue-500" />
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <Phone className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
            <span className="text-sm font-semibold text-gray-900 font-mono tracking-wide">
              {lead.mobileNumber}
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-0.5 truncate">
            {lead.name || <span className="italic text-gray-300">No name</span>}
          </p>
          {showAgent && (
            <div className="flex items-center gap-1 mt-0.5">
              <UserCheck className="w-3 h-3 text-indigo-400 flex-shrink-0" />
              <span className="text-[11px] text-indigo-600 font-medium truncate">
                {agentName}
              </span>
            </div>
          )}
        </div>

        {/* Status badge */}
        <div
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full ${config.bg} flex-shrink-0`}
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
        <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0 ml-1" />
      </div>
    </button>
  );
}

export { statusConfig };
