import type { WorkflowStatus } from "../types";

const badgeClasses: Record<string, string> = {
  // Workflow statuses
  "Docs Pending": "bg-orange-100 text-orange-800",
  "Docs Received": "bg-blue-100 text-blue-800",
  "Details Completed": "bg-cyan-100 text-cyan-800",
  "Quotation Ready": "bg-teal-100 text-teal-800",
  "PB Action Required": "bg-red-100 text-red-800",
  "KYC Pending": "bg-yellow-100 text-yellow-800",
  "KYC Completed": "bg-green-100 text-green-800",
  "Payment Sent": "bg-purple-100 text-purple-800",
  Completed: "bg-emerald-100 text-emerald-800",
  // Legacy/other statuses
  "Quote Pending": "bg-yellow-100 text-yellow-800",
  "Quote Ready": "bg-teal-100 text-teal-800",
  "KYC In Progress": "bg-blue-100 text-blue-800",
  "Payment Pending": "bg-orange-100 text-orange-800",
  "Payment Done": "bg-green-100 text-green-800",
  "Policy Pending": "bg-gray-100 text-gray-800",
  Pending: "bg-yellow-100 text-yellow-800",
  Confirmed: "bg-green-100 text-green-800",
  "Details Pending": "bg-orange-100 text-orange-800",
  Active: "bg-teal-100 text-teal-800",
};

export default function StatusBadge({ status }: { status: string }) {
  const classes = badgeClasses[status] ?? "bg-gray-100 text-gray-700";
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium whitespace-nowrap ${classes}`}
    >
      {status}
    </span>
  );
}

export type { WorkflowStatus };
