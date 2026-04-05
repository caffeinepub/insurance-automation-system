import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ExternalLink, Link2, Phone, User } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useApp } from "../context/AppContext";
import { type Lead, WORKFLOW_STATUSES, type WorkflowStatus } from "../types";

interface LeadDetailPanelProps {
  lead: Lead | null;
  isOpen: boolean;
  onClose: () => void;
}

type YesNoNull = "yes" | "no" | "";

function boolToYesNo(val: boolean | null): YesNoNull {
  if (val === null) return "";
  return val ? "yes" : "no";
}

function yesNoToBool(val: YesNoNull): boolean | null {
  if (val === "") return null;
  return val === "yes";
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

export default function LeadDetailPanel({
  lead,
  isOpen,
  onClose,
}: LeadDetailPanelProps) {
  const { updateLead, addToast, leads } = useApp();

  // Always read the live lead from context so status reflects latest changes
  const liveLead = lead ? (leads.find((l) => l.id === lead.id) ?? lead) : null;

  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [claim, setClaim] = useState<YesNoNull>("");
  const [ncb, setNcb] = useState("");
  const [ownerChange, setOwnerChange] = useState<YesNoNull>("");
  const [paymentLink, setPaymentLink] = useState("");
  const [workflowStatus, setWorkflowStatus] =
    useState<WorkflowStatus>("Docs Pending");

  // Track last initialized lead ID to only reset form when a different lead opens
  const initializedIdRef = useRef<string | null>(null);

  if (liveLead && initializedIdRef.current !== liveLead.id) {
    initializedIdRef.current = liveLead.id;
    setName(liveLead.name ?? "");
    setMobile(liveLead.mobileNumber);
    setClaim(boolToYesNo(liveLead.claim));
    setNcb(liveLead.ncb.toString());
    setOwnerChange(boolToYesNo(liveLead.ownerChange));
    setPaymentLink(liveLead.paymentLink);
    setWorkflowStatus(liveLead.workflowStatus);
  }

  // Reset initialized ID when panel closes so reopening same lead re-reads values
  // biome-ignore lint/correctness/useExhaustiveDependencies: intentional reset on close
  useEffect(() => {
    if (!isOpen) {
      initializedIdRef.current = null;
    }
  }, [isOpen]);

  if (!liveLead) return null;

  const handleStatusChange = (status: WorkflowStatus) => {
    setWorkflowStatus(status);
    // Immediately persist so table updates live
    updateLead(liveLead.id, { workflowStatus: status });
    addToast("success", `Status updated to "${status}"`);
  };

  const handleSave = () => {
    const ncbNum = Number.parseFloat(ncb);
    updateLead(liveLead.id, {
      name,
      mobileNumber: mobile,
      claim: yesNoToBool(claim),
      ncb: Number.isNaN(ncbNum) ? 0 : ncbNum,
      ownerChange: yesNoToBool(ownerChange),
      paymentLink,
      workflowStatus,
    });
    addToast("success", "Lead details saved.");
    onClose();
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader className="mb-4">
          <SheetTitle className="flex items-center gap-2 text-lg font-semibold">
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
              <User className="w-4 h-4 text-blue-600" />
            </div>
            Lead Details
          </SheetTitle>
          <p className="text-xs text-gray-400">
            ID: {liveLead.id} &bull; Created{" "}
            {new Date(liveLead.createdAt).toLocaleDateString("en-IN")}
          </p>
        </SheetHeader>

        <div className="space-y-5">
          {/* Workflow Status */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-gray-700">
              Workflow Status
            </Label>
            <select
              value={workflowStatus}
              onChange={(e) =>
                handleStatusChange(e.target.value as WorkflowStatus)
              }
              className={`w-full text-sm font-medium px-3 py-2 rounded-lg border cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-300 transition-colors ${
                workflowStatusColors[workflowStatus] ??
                "text-gray-700 border-gray-200 bg-gray-50"
              }`}
              data-ocid="lead.detail.workflow_status"
            >
              {WORKFLOW_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          {/* Mobile */}
          <div className="space-y-1.5">
            <Label
              htmlFor="detail-mobile"
              className="text-sm font-medium text-gray-700"
            >
              <Phone className="inline w-3.5 h-3.5 mr-1 text-gray-400" />
              Mobile
            </Label>
            <Input
              id="detail-mobile"
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
              placeholder="10-digit mobile number"
              maxLength={10}
              className="font-mono"
            />
          </div>

          {/* Name */}
          <div className="space-y-1.5">
            <Label
              htmlFor="detail-name"
              className="text-sm font-medium text-gray-700"
            >
              <User className="inline w-3.5 h-3.5 mr-1 text-gray-400" />
              Name
            </Label>
            <Input
              id="detail-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Customer name"
            />
          </div>

          {/* Claim */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-gray-700">Claim</Label>
            <div className="flex gap-2">
              {(["yes", "no", ""] as YesNoNull[]).map((opt) => (
                <button
                  key={opt === "" ? "na" : opt}
                  type="button"
                  onClick={() => setClaim(opt)}
                  className={`flex-1 py-1.5 text-sm rounded-lg border font-medium transition-colors ${
                    claim === opt
                      ? opt === "yes"
                        ? "bg-green-600 border-green-600 text-white"
                        : opt === "no"
                          ? "bg-red-500 border-red-500 text-white"
                          : "bg-gray-200 border-gray-300 text-gray-700"
                      : "bg-white border-gray-200 text-gray-500 hover:bg-gray-50"
                  }`}
                >
                  {opt === "" ? "N/A" : opt === "yes" ? "Yes" : "No"}
                </button>
              ))}
            </div>
          </div>

          {/* NCB % */}
          <div className="space-y-1.5">
            <Label
              htmlFor="detail-ncb"
              className="text-sm font-medium text-gray-700"
            >
              NCB %
            </Label>
            <div className="relative">
              <Input
                id="detail-ncb"
                type="number"
                min={0}
                max={100}
                value={ncb}
                onChange={(e) => setNcb(e.target.value)}
                placeholder="0"
                className="pr-8"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                %
              </span>
            </div>
          </div>

          {/* Owner Change */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-gray-700">
              Owner Change
            </Label>
            <div className="flex gap-2">
              {(["yes", "no", ""] as YesNoNull[]).map((opt) => (
                <button
                  key={opt === "" ? "na" : opt}
                  type="button"
                  onClick={() => setOwnerChange(opt)}
                  className={`flex-1 py-1.5 text-sm rounded-lg border font-medium transition-colors ${
                    ownerChange === opt
                      ? opt === "yes"
                        ? "bg-blue-600 border-blue-600 text-white"
                        : opt === "no"
                          ? "bg-gray-600 border-gray-600 text-white"
                          : "bg-gray-200 border-gray-300 text-gray-700"
                      : "bg-white border-gray-200 text-gray-500 hover:bg-gray-50"
                  }`}
                >
                  {opt === "" ? "N/A" : opt === "yes" ? "Yes" : "No"}
                </button>
              ))}
            </div>
          </div>

          {/* Payment Link */}
          <div className="space-y-1.5" id="detail-payment">
            <Label
              htmlFor="detail-payment-input"
              className="text-sm font-medium text-gray-700"
            >
              <Link2 className="inline w-3.5 h-3.5 mr-1 text-gray-400" />
              Paste Payment Link
            </Label>
            <Input
              id="detail-payment-input"
              data-ocid="lead.payment_link.input"
              value={paymentLink}
              onChange={(e) => setPaymentLink(e.target.value)}
              placeholder="Paste link here..."
            />
            {liveLead.paymentLink && (
              <div className="flex items-center gap-2 mt-1 px-3 py-2 rounded-lg bg-blue-50 border border-blue-100">
                <ExternalLink className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                <span className="text-xs font-medium text-blue-600 shrink-0">
                  Saved link:
                </span>
                <a
                  href={liveLead.paymentLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-ocid="lead.payment_link.button"
                  className="text-xs text-blue-700 hover:underline truncate min-w-0 flex-1"
                  title={liveLead.paymentLink}
                >
                  {liveLead.paymentLink.length > 40
                    ? `${liveLead.paymentLink.slice(0, 40)}…`
                    : liveLead.paymentLink}
                </a>
                <a
                  href={liveLead.paymentLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-semibold text-blue-600 hover:text-blue-800 shrink-0 underline"
                >
                  Open
                </a>
              </div>
            )}
          </div>
        </div>

        {/* Open PB Portal button */}
        <div className="mt-6">
          <a
            href="https://www.pbpartners.com"
            target="_blank"
            rel="noopener noreferrer"
            data-ocid="lead.detail.pb_portal.button"
            className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors shadow-sm"
          >
            <ExternalLink className="w-4 h-4" />
            Open PB Portal
          </a>
        </div>

        <div className="mt-3 flex gap-2">
          <Button
            onClick={handleSave}
            className="flex-1 bg-gray-900 hover:bg-gray-800 text-white"
          >
            Save Changes
          </Button>
          <Button variant="outline" onClick={onClose} className="flex-1">
            Cancel
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
