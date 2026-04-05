import type { WorkflowStatus } from "../types";

const badgeClasses: Record<string, string> = {
  // Workflow statuses - dark glass neon-accent
  "Docs Pending":
    "bg-orange-500/20 text-orange-300 border border-orange-500/30",
  "Docs Received": "bg-blue-500/20 text-blue-300 border border-blue-500/30",
  "Details Completed": "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30",
  "Quotation Ready": "bg-teal-500/20 text-teal-300 border border-teal-500/30",
  "PB Action Required": "bg-red-500/20 text-red-300 border border-red-500/30",
  "KYC Pending": "bg-yellow-500/20 text-yellow-300 border border-yellow-500/30",
  "KYC Completed": "bg-green-500/20 text-green-300 border border-green-500/30",
  "Payment Sent":
    "bg-purple-500/20 text-purple-300 border border-purple-500/30",
  Completed: "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30",
  // Legacy/other statuses
  "Quote Pending":
    "bg-yellow-500/20 text-yellow-300 border border-yellow-500/30",
  "Quote Ready": "bg-teal-500/20 text-teal-300 border border-teal-500/30",
  "KYC In Progress": "bg-blue-500/20 text-blue-300 border border-blue-500/30",
  "Payment Pending":
    "bg-orange-500/20 text-orange-300 border border-orange-500/30",
  "Payment Done": "bg-green-500/20 text-green-300 border border-green-500/30",
  "Policy Pending": "bg-slate-500/20 text-slate-300 border border-slate-500/30",
  Pending: "bg-yellow-500/20 text-yellow-300 border border-yellow-500/30",
  Confirmed: "bg-green-500/20 text-green-300 border border-green-500/30",
  "Details Pending":
    "bg-orange-500/20 text-orange-300 border border-orange-500/30",
  Active: "bg-teal-500/20 text-teal-300 border border-teal-500/30",
};

export default function StatusBadge({ status }: { status: string }) {
  const classes =
    badgeClasses[status] ??
    "bg-slate-500/20 text-slate-300 border border-slate-500/30";
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold whitespace-nowrap ${classes}`}
    >
      {status}
    </span>
  );
}

export type { WorkflowStatus };
