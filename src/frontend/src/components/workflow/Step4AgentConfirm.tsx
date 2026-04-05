import { Button } from "@/components/ui/button";
import { CheckCircle2, UserCheck } from "lucide-react";
import { toast } from "sonner";
import { useApp } from "../../context/AppContext";
import type { Lead } from "../../types";

interface Props {
  lead: Lead;
  onNext: () => void;
}

export default function Step4AgentConfirm({ lead, onNext }: Props) {
  const { updateLead } = useApp();
  const isConfirmed = lead.agentConfirmStatus === "Confirmed";

  const handleConfirm = () => {
    updateLead(lead.id, {
      agentConfirmStatus: "Confirmed",
      currentStep: Math.max(lead.currentStep, 5),
    });
    toast.success("Agent confirmed! Proceeding to KYC.");
    onNext();
  };

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-base font-semibold text-gray-900">
          Step 4 &mdash; Agent Confirmation
        </h3>
        <p className="text-sm text-gray-500 mt-1">
          Review lead details and confirm to proceed to KYC.
        </p>
      </div>

      <div className="bg-gray-50 rounded-xl border border-gray-200 p-4 space-y-3">
        <h4 className="text-sm font-semibold text-gray-700">Lead Summary</h4>
        <div className="grid grid-cols-2 gap-3">
          {(
            [
              ["Mobile", lead.mobileNumber],
              [
                "Claim Last Year",
                lead.claim === null ? "\u2014" : lead.claim ? "Yes" : "No",
              ],
              ["NCB %", `${lead.ncb}%`],
              [
                "Owner Change",
                lead.ownerChange === null
                  ? "\u2014"
                  : lead.ownerChange
                    ? "Yes"
                    : "No",
              ],
              [
                "Quote Amount",
                lead.quoteAmount > 0
                  ? `₹${lead.quoteAmount.toLocaleString("en-IN")}`
                  : "Not set",
              ],
              ["RC Status", lead.rcStatus],
            ] as [string, string][]
          ).map(([label, value]) => (
            <div
              key={label}
              className="bg-white rounded-lg border border-gray-100 px-3 py-2.5"
            >
              <p className="text-xs text-gray-400 mb-0.5">{label}</p>
              <p className="text-sm font-semibold text-gray-800">{value}</p>
            </div>
          ))}
        </div>
      </div>

      {isConfirmed ? (
        <div className="flex items-center gap-2 bg-green-50 text-green-800 rounded-lg px-4 py-3 text-sm font-medium">
          <CheckCircle2 className="w-4 h-4" />
          Agent has confirmed this lead. Ready for KYC.
        </div>
      ) : (
        <Button
          onClick={handleConfirm}
          className="w-full bg-gray-900 hover:bg-gray-800 text-white h-10 flex items-center justify-center gap-2"
          data-ocid="lead.confirm_button"
        >
          <UserCheck className="w-4 h-4" />
          Agent Confirm
        </Button>
      )}
    </div>
  );
}
