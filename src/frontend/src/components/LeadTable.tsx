import { Button } from "@/components/ui/button";
import { Inbox } from "lucide-react";
import { useApp } from "../context/AppContext";
import { type Lead, WORKFLOW_STATUSES, type WorkflowStatus } from "../types";
import StatusBadge from "./StatusBadge";

interface LeadTableProps {
  leads: Lead[];
  onOpenLead: (lead: Lead) => void;
  onOpenDetail: (lead: Lead) => void;
}

const workflowStatusColors: Record<WorkflowStatus, string> = {
  "Docs Pending": "text-orange-700 border-orange-200 bg-orange-50",
  "Docs Received": "text-blue-700 border-blue-200 bg-blue-50",
  "Details Completed": "text-cyan-700 border-cyan-200 bg-cyan-50",
  "Quotation Ready": "text-teal-700 border-teal-200 bg-teal-50",
  "PB Action Required": "text-red-700 border-red-200 bg-red-50",
  "KYC Pending": "text-yellow-700 border-yellow-200 bg-yellow-50",
  "KYC Completed": "text-green-700 border-green-200 bg-green-50",
  "Payment Sent": "text-purple-700 border-purple-200 bg-purple-50",
  Completed: "text-emerald-700 border-emerald-200 bg-emerald-50",
};

export default function LeadTable({
  leads,
  onOpenLead,
  onOpenDetail,
}: LeadTableProps) {
  const { updateLead, addToast } = useApp();

  const handleStatusChange = (leadId: string, status: WorkflowStatus) => {
    updateLead(leadId, { workflowStatus: status });
    addToast("success", `Status updated to "${status}"`);
  };

  if (leads.length === 0) {
    return (
      <div
        className="flex flex-col items-center justify-center py-16"
        data-ocid="leads.empty_state"
      >
        <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center mb-3">
          <Inbox className="w-6 h-6 text-gray-400" />
        </div>
        <p className="text-sm font-medium text-gray-600">No leads found</p>
        <p className="text-xs text-gray-400 mt-1">
          Create a new lead using the button above.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto" data-ocid="leads.table">
      <table className="w-full text-sm min-w-[1100px]">
        <thead>
          <tr className="border-b border-gray-100">
            {[
              "Mobile",
              "Name",
              "Workflow Status",
              "RC Status",
              "Claim",
              "NCB %",
              "Owner Change",
              "Quote Status",
              "KYC Status",
              "Payment",
              "Policy",
              "Step",
              "Actions",
            ].map((h) => (
              <th
                key={h}
                className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3 bg-gray-50/70"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {leads.map((lead, idx) => (
            // biome-ignore lint/a11y/useKeyWithClickEvents: table row click is supplementary
            <tr
              key={lead.id}
              className="hover:bg-blue-50/40 cursor-pointer transition-colors"
              onClick={() => onOpenDetail(lead)}
              data-ocid={`leads.item.${idx + 1}`}
            >
              <td className="px-4 py-3 font-medium text-gray-900 whitespace-nowrap">
                {lead.mobileNumber}
              </td>
              <td className="px-4 py-3 text-gray-700 whitespace-nowrap">
                {lead.name || (
                  <span className="text-gray-300 italic">\u2014</span>
                )}
              </td>
              {/* biome-ignore lint/a11y/useKeyWithClickEvents: stop propagation only */}
              <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                <select
                  value={lead.workflowStatus}
                  onChange={(e) =>
                    handleStatusChange(
                      lead.id,
                      e.target.value as WorkflowStatus,
                    )
                  }
                  className={`text-xs font-medium px-2 py-1 rounded-md border cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-300 transition-colors ${
                    workflowStatusColors[lead.workflowStatus] ??
                    "text-gray-700 border-gray-200 bg-gray-50"
                  }`}
                  data-ocid={`leads.workflow_status.${idx + 1}`}
                >
                  {WORKFLOW_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </td>
              <td className="px-4 py-3">
                <StatusBadge status={lead.rcStatus} />
              </td>
              <td className="px-4 py-3 text-gray-600">
                {lead.claim === null ? "\u2014" : lead.claim ? "Yes" : "No"}
              </td>
              <td className="px-4 py-3 text-gray-600">{lead.ncb}%</td>
              <td className="px-4 py-3 text-gray-600">
                {lead.ownerChange === null
                  ? "\u2014"
                  : lead.ownerChange
                    ? "Yes"
                    : "No"}
              </td>
              <td className="px-4 py-3">
                <StatusBadge status={lead.quoteStatus} />
              </td>
              <td className="px-4 py-3">
                <StatusBadge status={lead.kycStatus} />
              </td>
              <td className="px-4 py-3">
                <StatusBadge status={lead.paymentStatus} />
              </td>
              <td className="px-4 py-3">
                <StatusBadge status={lead.policyStatus} />
              </td>
              <td className="px-4 py-3">
                <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                  Step {lead.currentStep}/10
                </span>
              </td>
              {/* biome-ignore lint/a11y/useKeyWithClickEvents: stop propagation only */}
              <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onOpenLead(lead)}
                  className="text-xs h-7 px-3 border-gray-300 hover:border-blue-400 hover:text-blue-600"
                  data-ocid={`leads.edit_button.${idx + 1}`}
                >
                  Workflow
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
