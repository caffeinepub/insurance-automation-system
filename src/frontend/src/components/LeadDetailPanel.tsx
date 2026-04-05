import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Bell,
  ExternalLink,
  Link2,
  MessageCircle,
  Phone,
  User,
  UserCheck,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { AGENTS, useApp } from "../context/AppContext";
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

const NCB_OPTIONS = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50];

function getStatusMessage(status: WorkflowStatus): string {
  switch (status) {
    case "Quotation Ready":
      return "Hello, your quotation is ready. Please check and confirm.";
    case "Payment Sent":
      return "Hello, please complete your payment to proceed with your insurance.";
    case "Completed":
      return "Hello, your policy has been issued successfully. Thank you!";
    default:
      return "Hello, your insurance quotation is ready. Please check and confirm.";
  }
}

function buildWhatsAppUrl(
  mobileRaw: string,
  status: WorkflowStatus,
): string | null {
  const digits = mobileRaw.replace(/\D/g, "");
  if (!digits) return null;
  const phone = digits.length === 10 ? `91${digits}` : digits;
  const message = encodeURIComponent(getStatusMessage(status));
  return `https://wa.me/${phone}?text=${message}`;
}

function buildFollowUpUrl(mobileRaw: string): string | null {
  const digits = mobileRaw.replace(/\D/g, "");
  if (!digits) return null;
  const phone = digits.length === 10 ? `91${digits}` : digits;
  return `https://wa.me/${phone}?text=${encodeURIComponent("Reminder: Please complete your insurance process.")}`;
}

export default function LeadDetailPanel({
  lead,
  isOpen,
  onClose,
}: LeadDetailPanelProps) {
  const { updateLead, addToast, leads, currentUser, setPbPortalOpen } =
    useApp();

  const liveLead = lead ? (leads.find((l) => l.id === lead.id) ?? lead) : null;

  const isAdmin = currentUser?.role === "admin";

  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [claim, setClaim] = useState<YesNoNull>("");
  const [ncb, setNcb] = useState<number>(0);
  const [ownerChange, setOwnerChange] = useState<YesNoNull>("");
  const [paymentLink, setPaymentLink] = useState("");
  const [workflowStatus, setWorkflowStatus] =
    useState<WorkflowStatus>("Docs Pending");
  const [assignedAgent, setAssignedAgent] = useState("");
  const [policyAmount, setPolicyAmount] = useState<number>(0);
  const [commissionPercent, setCommissionPercent] = useState<number>(0);

  const initializedIdRef = useRef<string | null>(null);

  if (liveLead && initializedIdRef.current !== liveLead.id) {
    initializedIdRef.current = liveLead.id;
    setName(liveLead.name ?? "");
    setMobile(liveLead.mobileNumber);
    setClaim(boolToYesNo(liveLead.claim));
    setNcb(liveLead.ncb);
    setOwnerChange(boolToYesNo(liveLead.ownerChange));
    setPaymentLink(liveLead.paymentLink);
    setWorkflowStatus(liveLead.workflowStatus);
    setAssignedAgent(liveLead.assignedAgent ?? "");
    setPolicyAmount(liveLead.policyAmount ?? 0);
    setCommissionPercent(liveLead.commissionPercent ?? 0);
  }

  useEffect(() => {
    if (!isOpen) {
      initializedIdRef.current = null;
    }
  }, [isOpen]);

  if (!liveLead) return null;

  const handleStatusChange = (status: WorkflowStatus) => {
    setWorkflowStatus(status);
    updateLead(liveLead.id, { workflowStatus: status });
    addToast("success", `Status updated to "${status}"`);
  };

  const handleSave = () => {
    updateLead(liveLead.id, {
      name,
      mobileNumber: mobile,
      claim: yesNoToBool(claim),
      ncb,
      ownerChange: yesNoToBool(ownerChange),
      paymentLink,
      workflowStatus,
      assignedAgent,
      policyAmount,
      commissionPercent,
    });
    addToast("success", "Lead details saved.");
    onClose();
  };

  const handleFollowUpClick = () => {
    const followUpUrl = buildFollowUpUrl(mobile);
    if (followUpUrl) {
      window.open(followUpUrl, "_blank", "noopener,noreferrer");
    }
    updateLead(liveLead.id, {
      reminderCount: (liveLead.reminderCount || 0) + 1,
    });
    addToast("success", "Follow-up reminder sent!");
  };

  const whatsappUrl = buildWhatsAppUrl(mobile, workflowStatus);
  const previewMessage = getStatusMessage(workflowStatus);
  const followUpUrl = buildFollowUpUrl(mobile);

  const isFollowUpDue =
    workflowStatus !== "Completed" &&
    Date.now() - new Date(liveLead.createdAt).getTime() > 86400000;
  const reminderCount = liveLead.reminderCount || 0;

  const assignedAgentName =
    AGENTS.find((a) => a.email === assignedAgent)?.name ?? assignedAgent;

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

          {/* Assigned Agent */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-gray-700">
              Assigned Agent
            </Label>
            {isAdmin ? (
              <Select value={assignedAgent} onValueChange={setAssignedAgent}>
                <SelectTrigger
                  className="w-full text-sm"
                  data-ocid="lead.detail.agent.select"
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
            ) : (
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-gray-50 border border-gray-100">
                <UserCheck className="w-4 h-4 text-indigo-500 flex-shrink-0" />
                <span className="text-sm font-medium text-gray-700">
                  {assignedAgentName}
                </span>
              </div>
            )}
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
            <Select
              value={claim}
              onValueChange={(val) => setClaim(val as YesNoNull)}
            >
              <SelectTrigger
                className="w-full text-sm"
                data-ocid="lead.detail.claim.select"
              >
                <SelectValue placeholder="Select..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Select...</SelectItem>
                <SelectItem value="yes">Yes</SelectItem>
                <SelectItem value="no">No</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* NCB % */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-gray-700">NCB %</Label>
            <Select
              value={String(ncb)}
              onValueChange={(val) => setNcb(Number(val))}
            >
              <SelectTrigger
                className="w-full text-sm"
                data-ocid="lead.detail.ncb.select"
              >
                <SelectValue placeholder="Select NCB %" />
              </SelectTrigger>
              <SelectContent>
                {NCB_OPTIONS.map((pct) => (
                  <SelectItem key={pct} value={String(pct)}>
                    {pct}%
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Owner Change */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-gray-700">
              Owner Change
            </Label>
            <Select
              value={ownerChange}
              onValueChange={(val) => setOwnerChange(val as YesNoNull)}
            >
              <SelectTrigger
                className="w-full text-sm"
                data-ocid="lead.detail.owner_change.select"
              >
                <SelectValue placeholder="Select..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Select...</SelectItem>
                <SelectItem value="yes">Yes</SelectItem>
                <SelectItem value="no">No</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Business Tracking - only for Completed leads */}
          {workflowStatus === "Completed" && (
            <div className="space-y-3 p-3 rounded-xl bg-emerald-50 border border-emerald-200">
              <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-600">
                Business Tracking
              </p>
              <div className="space-y-1.5">
                <Label
                  htmlFor="panel-policy-amount"
                  className="text-sm font-semibold text-gray-700"
                >
                  Policy Amount (₹)
                </Label>
                <Input
                  id="panel-policy-amount"
                  type="number"
                  min={0}
                  value={policyAmount === 0 ? "" : policyAmount}
                  onChange={(e) => setPolicyAmount(Number(e.target.value) || 0)}
                  placeholder="e.g. 15000"
                  className="h-10"
                />
              </div>
              <div className="space-y-1.5">
                <Label
                  htmlFor="panel-commission"
                  className="text-sm font-semibold text-gray-700"
                >
                  Commission (%)
                </Label>
                <Input
                  id="panel-commission"
                  type="number"
                  min={0}
                  max={100}
                  value={commissionPercent === 0 ? "" : commissionPercent}
                  onChange={(e) =>
                    setCommissionPercent(Number(e.target.value) || 0)
                  }
                  placeholder="e.g. 15"
                  className="h-10"
                />
              </div>
              {policyAmount > 0 && commissionPercent > 0 && (
                <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-white border border-emerald-200">
                  <span className="text-xs font-semibold text-emerald-700">
                    Commission Amount
                  </span>
                  <span className="text-sm font-bold text-emerald-800">
                    ₹
                    {Math.round(
                      (policyAmount * commissionPercent) / 100,
                    ).toLocaleString("en-IN")}
                  </span>
                </div>
              )}
            </div>
          )}

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

        {/* Follow-up reminder banner */}
        {isFollowUpDue && (
          <div
            className="mt-6 flex items-start gap-3 px-3 py-3 rounded-xl bg-amber-50 border border-amber-200"
            data-ocid="lead.followup.panel"
          >
            <Bell className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-amber-800">
                Follow-up due
              </p>
              <p className="text-xs text-amber-600 mt-0.5">
                {reminderCount > 0
                  ? `Reminder sent ${reminderCount} time(s)`
                  : "No reminder sent yet"}
              </p>
            </div>
            <button
              type="button"
              onClick={handleFollowUpClick}
              disabled={!followUpUrl}
              data-ocid="lead.followup.button"
              className="flex-shrink-0 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold transition-colors"
            >
              Send Follow-up
            </button>
          </div>
        )}

        {/* Open PB Portal button */}
        <div className="mt-6">
          <a
            href="https://www.pbpartners.com"
            target="_blank"
            rel="noopener noreferrer"
            data-ocid="lead.detail.pb_portal.button"
            className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors shadow-sm"
            onClick={() => setPbPortalOpen(true)}
          >
            <ExternalLink className="w-4 h-4" />
            Open PB Portal
          </a>
        </div>

        {/* Message preview */}
        <div className="mt-3 space-y-1">
          <p className="text-[11px] text-gray-400 font-medium">
            Message Preview
          </p>
          <div className="bg-green-50 border border-green-200 text-green-900 text-xs px-3 py-2 rounded-lg">
            {previewMessage}
          </div>
        </div>

        {/* WhatsApp Customer button */}
        <div className="mt-3">
          {whatsappUrl ? (
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              data-ocid="lead.detail.whatsapp.button"
              className="flex items-center justify-center gap-2 w-full h-11 px-4 rounded-lg bg-green-500 hover:bg-green-600 text-white text-sm font-bold transition-colors shadow-sm"
            >
              <MessageCircle className="w-4 h-4" />
              WhatsApp Customer
            </a>
          ) : (
            <button
              type="button"
              disabled
              data-ocid="lead.detail.whatsapp.button"
              title="No mobile number saved"
              className="flex items-center justify-center gap-2 w-full h-11 px-4 rounded-lg bg-green-200 text-green-600 text-sm font-bold cursor-not-allowed opacity-60"
            >
              <MessageCircle className="w-4 h-4" />
              WhatsApp Customer
            </button>
          )}
        </div>

        <div className="mt-3 flex gap-2">
          <Button
            onClick={handleSave}
            className="flex-1 bg-gray-900 hover:bg-gray-800 text-white"
            data-ocid="lead.detail.save_button"
          >
            Save Changes
          </Button>
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1"
            data-ocid="lead.detail.cancel_button"
          >
            Cancel
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
