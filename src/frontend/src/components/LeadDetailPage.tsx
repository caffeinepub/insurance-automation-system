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
  ArrowLeft,
  Bell,
  ChevronLeft,
  ChevronRight,
  Download,
  ExternalLink,
  Eye,
  FileImage,
  Link2,
  MessageCircle,
  UserCheck,
  X,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { AGENTS, useApp } from "../context/AppContext";
import { WORKFLOW_STATUSES, type WorkflowStatus } from "../types";
import { statusConfig } from "./LeadCard";

interface LeadDetailPageProps {
  leadId: string;
  onBack: () => void;
}

type YesNoEmpty = "yes" | "no" | "";

function boolToYesNo(val: boolean | null): YesNoEmpty {
  if (val === null) return "";
  return val ? "yes" : "no";
}

function yesNoToBool(val: YesNoEmpty): boolean | null {
  if (val === "") return null;
  return val === "yes";
}

const NCB_OPTIONS = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50];

const workflowStatusBg: Record<WorkflowStatus, string> = {
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

function isPdf(url: string): boolean {
  return (
    url.startsWith("data:application/pdf") || url.toLowerCase().endsWith(".pdf")
  );
}

function downloadDoc(url: string, label: string) {
  const filename = label.replace(/\s+/g, "_") + (isPdf(url) ? ".pdf" : ".jpg");
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

// ─── Document Viewer Modal ────────────────────────────────────────────────────
interface DocViewerProps {
  docs: { label: string; url: string }[];
  initialIndex: number;
  onClose: () => void;
}

function DocViewerModal({ docs, initialIndex, onClose }: DocViewerProps) {
  const [current, setCurrent] = useState(initialIndex);
  const doc = docs[current];
  const total = docs.length;

  const goPrev = useCallback(
    () => setCurrent((i) => (i - 1 + total) % total),
    [total],
  );
  const goNext = useCallback(() => setCurrent((i) => (i + 1) % total), [total]);

  // Keyboard navigation + escape to close
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowLeft") goPrev();
      else if (e.key === "ArrowRight") goNext();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose, goPrev, goNext]);

  // Prevent body scroll while modal is open
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      data-ocid="lead.docs.modal"
    >
      {/* Backdrop */}
      <div
        role="button"
        tabIndex={-1}
        className="absolute inset-0 bg-black/80 backdrop-blur-sm cursor-default"
        onClick={onClose}
        onKeyDown={(e) => e.key === "Escape" && onClose()}
        aria-label="Close document viewer"
      />

      {/* Panel */}
      <div className="relative z-10 w-full sm:max-w-lg sm:mx-4 bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl flex flex-col max-h-[92dvh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-gray-100">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
              Document
            </p>
            <h2 className="text-base font-bold text-gray-900 truncate">
              {doc.label}
            </h2>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => downloadDoc(doc.url, doc.label)}
            className="w-9 h-9 text-blue-600 hover:bg-blue-50"
            title={`Download ${doc.label}`}
            data-ocid="lead.docs.modal.download_button"
          >
            <Download className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="w-9 h-9 text-gray-500 hover:bg-gray-100"
            aria-label="Close viewer"
            data-ocid="lead.docs.modal.close_button"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Document display */}
        <div className="flex-1 overflow-hidden bg-gray-950 flex items-center justify-center">
          {isPdf(doc.url) ? (
            <iframe
              src={doc.url}
              title={doc.label}
              className="w-full h-full min-h-[50dvh]"
              style={{ border: "none" }}
            />
          ) : (
            <img
              src={doc.url}
              alt={doc.label}
              className="max-w-full max-h-[65dvh] object-contain"
            />
          )}
        </div>

        {/* Navigation footer */}
        {total > 1 && (
          <div className="flex items-center gap-3 px-4 py-3 border-t border-gray-100 bg-white">
            <Button
              variant="outline"
              size="icon"
              onClick={goPrev}
              className="w-9 h-9 flex-shrink-0"
              aria-label="Previous document"
              data-ocid="lead.docs.modal.pagination_prev"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>

            {/* Dot indicators */}
            <div className="flex-1 flex items-center justify-center gap-1.5">
              {docs.map((d, i) => (
                <button
                  key={d.label}
                  type="button"
                  onClick={() => setCurrent(i)}
                  className={`rounded-full transition-all ${
                    i === current
                      ? "w-5 h-2 bg-gray-900"
                      : "w-2 h-2 bg-gray-300 hover:bg-gray-400"
                  }`}
                  aria-label={`View ${d.label}`}
                />
              ))}
            </div>

            <Button
              variant="outline"
              size="icon"
              onClick={goNext}
              className="w-9 h-9 flex-shrink-0"
              aria-label="Next document"
              data-ocid="lead.docs.modal.pagination_next"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        )}

        {/* Single doc — count label */}
        {total === 1 && (
          <div className="px-4 py-2 border-t border-gray-100 bg-white text-center">
            <p className="text-xs text-gray-400">1 of 1 document</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function LeadDetailPage({
  leadId,
  onBack,
}: LeadDetailPageProps) {
  const { leads, updateLead, currentUser } = useApp();
  const lead = leads.find((l) => l.id === leadId);

  const initializedIdRef = useRef<string | null>(null);
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [claim, setClaim] = useState<YesNoEmpty>("");
  const [ncb, setNcb] = useState<number>(0);
  const [ownerChange, setOwnerChange] = useState<YesNoEmpty>("");
  const [paymentLink, setPaymentLink] = useState("");
  const [workflowStatus, setWorkflowStatus] =
    useState<WorkflowStatus>("Docs Pending");
  const [assignedAgent, setAssignedAgent] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [policyAmount, setPolicyAmount] = useState<number>(0);
  const [commissionPercent, setCommissionPercent] = useState<number>(0);

  // Document viewer state
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(0);

  // Initialize form fields when lead loads or changes
  if (lead && initializedIdRef.current !== lead.id) {
    initializedIdRef.current = lead.id;
    setName(lead.name ?? "");
    setMobile(lead.mobileNumber);
    setClaim(boolToYesNo(lead.claim));
    setNcb(lead.ncb);
    setOwnerChange(boolToYesNo(lead.ownerChange));
    setPaymentLink(lead.paymentLink);
    setWorkflowStatus(lead.workflowStatus);
    setAssignedAgent(lead.assignedAgent ?? "");
    setPolicyAmount(lead.policyAmount ?? 0);
    setCommissionPercent(lead.commissionPercent ?? 0);
  }

  if (!lead) {
    return (
      <div className="flex items-center justify-center h-full py-20">
        <p className="text-gray-400 text-sm">Lead not found.</p>
      </div>
    );
  }

  const isAdmin = currentUser?.role === "admin";

  const handleStatusChange = (status: WorkflowStatus) => {
    setWorkflowStatus(status);
    updateLead(lead.id, { workflowStatus: status });
    toast.success(`Status updated to "${status}"`);
  };

  const handleSave = () => {
    setIsSaving(true);
    updateLead(lead.id, {
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
    setTimeout(() => {
      setIsSaving(false);
      toast.success("Lead details saved!");
    }, 300);
  };

  const handleFollowUpClick = () => {
    const followUpUrl = buildFollowUpUrl(mobile);
    if (followUpUrl) {
      window.open(followUpUrl, "_blank", "noopener,noreferrer");
    }
    updateLead(lead.id, { reminderCount: (lead.reminderCount || 0) + 1 });
    toast.success("Follow-up reminder sent!");
  };

  const savedLink = lead.paymentLink;
  const config = statusConfig[workflowStatus];
  const whatsappUrl = buildWhatsAppUrl(mobile, workflowStatus);
  const previewMessage = getStatusMessage(workflowStatus);

  const isFollowUpDue =
    workflowStatus !== "Completed" &&
    Date.now() - new Date(lead.createdAt).getTime() > 86400000;
  const reminderCount = lead.reminderCount || 0;
  const followUpUrl = buildFollowUpUrl(mobile);

  const assignedAgentName =
    AGENTS.find((a) => a.email === assignedAgent)?.name ?? assignedAgent;

  const docItems = [
    { label: "RC Front", url: lead.rcFrontUrl },
    { label: "RC Back", url: lead.rcBackUrl },
    { label: "Old Policy", url: lead.oldPolicyUrl },
    { label: "PAN Card", url: lead.panUrl },
    { label: "Aadhaar Front", url: lead.aadhaarFrontUrl },
    { label: "Aadhaar Back", url: lead.aadhaarBackUrl },
  ].filter((d): d is { label: string; url: string } => !!d.url);

  const openViewer = (index: number) => {
    setViewerIndex(index);
    setViewerOpen(true);
  };

  return (
    <div className="min-h-full bg-background">
      {/* Header bar */}
      <header className="sticky top-0 z-10 bg-white border-b border-gray-200 shadow-xs">
        <div className="flex items-center gap-3 px-4 py-3 max-w-lg mx-auto">
          <button
            type="button"
            onClick={onBack}
            className="flex items-center justify-center w-9 h-9 rounded-lg hover:bg-gray-100 transition-colors"
            data-ocid="lead.detail.back_button"
            aria-label="Go back"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <h1 className="flex-1 text-base font-bold text-gray-900 text-center">
            Lead Details
          </h1>
          <div className="w-9" />
        </div>
      </header>

      {/* Content */}
      <div className="px-4 py-5 max-w-lg mx-auto space-y-4 pb-32">
        {/* IDENTITY section */}
        <section className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
          <div className="px-4 py-2.5 border-b border-gray-100 bg-gray-50">
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
              Identity
            </p>
          </div>
          <div className="p-4 space-y-4">
            <div className="space-y-1.5">
              <Label
                htmlFor="detail-mobile"
                className="text-sm font-semibold text-gray-700"
              >
                Mobile Number
              </Label>
              <Input
                id="detail-mobile"
                data-ocid="lead.detail.mobile.input"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                placeholder="10-digit mobile number"
                maxLength={10}
                inputMode="numeric"
                className="h-11 font-mono text-base"
              />
            </div>
            <div className="space-y-1.5">
              <Label
                htmlFor="detail-name"
                className="text-sm font-semibold text-gray-700"
              >
                Name
              </Label>
              <Input
                id="detail-name"
                data-ocid="lead.detail.name.input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Customer name"
                className="h-11"
              />
            </div>
          </div>
        </section>

        {/* ASSIGNED AGENT section */}
        <section className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
          <div className="px-4 py-2.5 border-b border-gray-100 bg-gray-50">
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
              Assigned Agent
            </p>
          </div>
          <div className="p-4">
            {isAdmin ? (
              <div className="space-y-1.5">
                <Label className="text-sm font-semibold text-gray-700">
                  Assign to Agent
                </Label>
                <Select value={assignedAgent} onValueChange={setAssignedAgent}>
                  <SelectTrigger
                    className="h-11 text-sm"
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
              </div>
            ) : (
              <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg bg-gray-50 border border-gray-100">
                <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                  <UserCheck className="w-4 h-4 text-indigo-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-800">
                    {assignedAgentName}
                  </p>
                  <p className="text-[11px] text-gray-400">{assignedAgent}</p>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* STATUS section */}
        <section className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
          <div className="px-4 py-2.5 border-b border-gray-100 bg-gray-50">
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
              Status
            </p>
          </div>
          <div className="p-4">
            <Label className="text-sm font-semibold text-gray-700 mb-2 block">
              Workflow Status
            </Label>
            <select
              value={workflowStatus}
              onChange={(e) =>
                handleStatusChange(e.target.value as WorkflowStatus)
              }
              className={`w-full h-11 text-sm font-semibold px-3 rounded-lg border-2 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-300 transition-colors appearance-none ${workflowStatusBg[workflowStatus]}`}
              data-ocid="lead.detail.status.select"
            >
              {WORKFLOW_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <div
              className={`mt-2.5 flex items-center gap-2 px-3 py-2 rounded-lg ${config.bg}`}
            >
              <span
                className={`w-2 h-2 rounded-full ${config.dot} flex-shrink-0`}
              />
              <span className={`text-xs font-semibold ${config.text}`}>
                {workflowStatus}
              </span>
            </div>
          </div>
        </section>

        {/* DETAILS section */}
        <section className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
          <div className="px-4 py-2.5 border-b border-gray-100 bg-gray-50">
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
              Details
            </p>
          </div>
          <div className="p-4 space-y-4">
            <div className="space-y-1.5">
              <Label className="text-sm font-semibold text-gray-700">
                Claim
              </Label>
              <Select
                value={claim}
                onValueChange={(val) => setClaim(val as YesNoEmpty)}
              >
                <SelectTrigger
                  className="h-11 text-sm"
                  data-ocid="lead.detail.claim.select"
                >
                  <SelectValue placeholder="Select claim status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Not specified</SelectItem>
                  <SelectItem value="yes">Yes</SelectItem>
                  <SelectItem value="no">No</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm font-semibold text-gray-700">
                NCB %
              </Label>
              <Select
                value={String(ncb)}
                onValueChange={(val) => setNcb(Number(val))}
              >
                <SelectTrigger
                  className="h-11 text-sm"
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

            <div className="space-y-1.5">
              <Label className="text-sm font-semibold text-gray-700">
                Owner Change
              </Label>
              <Select
                value={ownerChange}
                onValueChange={(val) => setOwnerChange(val as YesNoEmpty)}
              >
                <SelectTrigger
                  className="h-11 text-sm"
                  data-ocid="lead.detail.owner_change.select"
                >
                  <SelectValue placeholder="Select owner change" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Not specified</SelectItem>
                  <SelectItem value="yes">Yes</SelectItem>
                  <SelectItem value="no">No</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </section>

        {/* BUSINESS TRACKING section - only for Completed leads */}
        {workflowStatus === "Completed" && (
          <section className="bg-white rounded-xl border border-emerald-200 shadow-xs overflow-hidden">
            <div className="px-4 py-2.5 border-b border-emerald-100 bg-emerald-50">
              <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-600">
                Business Tracking
              </p>
            </div>
            <div className="p-4 space-y-4">
              <div className="space-y-1.5">
                <Label
                  htmlFor="detail-policy-amount"
                  className="text-sm font-semibold text-gray-700"
                >
                  Policy Amount (₹)
                </Label>
                <Input
                  id="detail-policy-amount"
                  data-ocid="lead.detail.policy_amount.input"
                  type="number"
                  min={0}
                  value={policyAmount === 0 ? "" : policyAmount}
                  onChange={(e) => setPolicyAmount(Number(e.target.value) || 0)}
                  placeholder="e.g. 15000"
                  className="h-11"
                />
              </div>
              <div className="space-y-1.5">
                <Label
                  htmlFor="detail-commission"
                  className="text-sm font-semibold text-gray-700"
                >
                  Commission (%)
                </Label>
                <Input
                  id="detail-commission"
                  data-ocid="lead.detail.commission.input"
                  type="number"
                  min={0}
                  max={100}
                  value={commissionPercent === 0 ? "" : commissionPercent}
                  onChange={(e) =>
                    setCommissionPercent(Number(e.target.value) || 0)
                  }
                  placeholder="e.g. 15"
                  className="h-11"
                />
              </div>
              {policyAmount > 0 && commissionPercent > 0 && (
                <div className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-emerald-50 border border-emerald-200">
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
          </section>
        )}

        {/* PAYMENT LINK section */}
        <section className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
          <div className="px-4 py-2.5 border-b border-gray-100 bg-gray-50">
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
              Payment Link
            </p>
          </div>
          <div className="p-4 space-y-3">
            <div className="space-y-1.5">
              <Label
                htmlFor="detail-payment-link"
                className="text-sm font-semibold text-gray-700"
              >
                Paste Payment Link
              </Label>
              <div className="flex gap-2">
                <Input
                  id="detail-payment-link"
                  data-ocid="lead.payment_link.input"
                  value={paymentLink}
                  onChange={(e) => setPaymentLink(e.target.value)}
                  placeholder="https://pay.example.com/link..."
                  className="h-11 flex-1"
                />
              </div>
            </div>

            {savedLink && (
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-blue-50 border border-blue-100">
                <Link2 className="w-4 h-4 text-blue-500 flex-shrink-0" />
                <span className="text-xs font-semibold text-blue-600 flex-shrink-0">
                  Saved:
                </span>
                <a
                  href={savedLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-ocid="lead.payment_link.button"
                  className="text-xs text-blue-700 hover:underline truncate flex-1 min-w-0"
                  title={savedLink}
                >
                  {savedLink.length > 38
                    ? `${savedLink.slice(0, 38)}\u2026`
                    : savedLink}
                </a>
                <a
                  href={savedLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-bold text-blue-600 hover:text-blue-800 flex-shrink-0 underline"
                >
                  Open
                </a>
              </div>
            )}
          </div>
        </section>

        {/* UPLOADED DOCUMENTS section */}
        {docItems.length > 0 && (
          <section
            className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden"
            data-ocid="lead.docs.section"
          >
            <div className="px-4 py-2.5 border-b border-gray-100 bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileImage className="w-3.5 h-3.5 text-blue-500" />
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                    Uploaded Documents
                  </p>
                </div>
                <span className="text-[10px] font-semibold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                  {docItems.length} file{docItems.length !== 1 ? "s" : ""}
                </span>
              </div>
            </div>
            <div className="p-4">
              <div className="grid grid-cols-2 gap-3">
                {docItems.map((doc, idx) => (
                  <div
                    key={doc.label}
                    className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-xs hover:shadow-sm transition-shadow"
                    data-ocid={`lead.docs.item.${idx + 1}`}
                  >
                    {/* Label */}
                    <div className="px-2.5 pt-2.5 pb-1">
                      <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wide truncate">
                        {doc.label}
                      </p>
                    </div>

                    {/* Thumbnail — clickable to open viewer */}
                    <button
                      type="button"
                      onClick={() => openViewer(idx)}
                      className="w-full block group relative"
                      aria-label={`View ${doc.label}`}
                    >
                      {isPdf(doc.url) ? (
                        <div className="w-full h-24 flex flex-col items-center justify-center bg-red-50 border-y border-gray-100 gap-1">
                          <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center">
                            <span className="text-[9px] font-bold text-red-600 uppercase">
                              PDF
                            </span>
                          </div>
                          <span className="text-[10px] text-red-500 font-medium">
                            PDF Document
                          </span>
                        </div>
                      ) : (
                        <div className="relative">
                          <img
                            src={doc.url}
                            alt={doc.label}
                            className="w-full h-24 object-cover border-y border-gray-100"
                          />
                          {/* Hover overlay */}
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                            <Eye className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow" />
                          </div>
                        </div>
                      )}
                    </button>

                    {/* Action buttons */}
                    <div className="flex gap-1.5 p-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openViewer(idx)}
                        className="flex-1 h-8 text-xs font-semibold gap-1 text-blue-700 border-blue-200 hover:bg-blue-50"
                        data-ocid={`lead.docs.view_button.${idx + 1}`}
                      >
                        <Eye className="w-3.5 h-3.5" />
                        View
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => downloadDoc(doc.url, doc.label)}
                        className="flex-1 h-8 text-xs font-semibold gap-1 text-gray-700 border-gray-200 hover:bg-gray-50"
                        data-ocid={`lead.docs.download_button.${idx + 1}`}
                      >
                        <Download className="w-3.5 h-3.5" />
                        Save
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ACTIONS section */}
        <section className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
          <div className="px-4 py-2.5 border-b border-gray-100 bg-gray-50">
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
              Quick Actions
            </p>
          </div>
          <div className="p-4 space-y-3">
            {isFollowUpDue && (
              <div
                className="flex items-start gap-3 px-3 py-3 rounded-xl bg-amber-50 border border-amber-200"
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

            <a
              href="https://www.pbpartners.com"
              target="_blank"
              rel="noopener noreferrer"
              data-ocid="lead.detail.pb_portal.button"
              className="flex items-center justify-center gap-2 w-full h-11 px-4 rounded-lg border-2 border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-700 text-sm font-bold transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              Open PB Portal
            </a>

            <div className="space-y-1">
              <p className="text-[11px] text-gray-400 font-medium">
                Message Preview
              </p>
              <div className="bg-green-50 border border-green-200 text-green-900 text-xs px-3 py-2 rounded-lg">
                {previewMessage}
              </div>
            </div>

            {whatsappUrl ? (
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                data-ocid="lead.detail.whatsapp.button"
                className="flex items-center justify-center gap-2 w-full h-11 px-4 rounded-lg bg-green-500 hover:bg-green-600 text-white text-sm font-bold transition-colors"
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
        </section>

        <p className="text-[11px] text-gray-400 text-center">
          Lead ID: {lead.id} · Created{" "}
          {new Date(lead.createdAt).toLocaleDateString("en-IN")}
        </p>
      </div>

      {/* Sticky Save Button */}
      <div className="fixed bottom-0 left-0 right-0 z-20 p-4 bg-white/95 backdrop-blur-sm border-t border-gray-200 max-w-lg mx-auto">
        <Button
          onClick={handleSave}
          disabled={isSaving}
          className="w-full h-12 text-base font-bold bg-gray-900 hover:bg-gray-800 text-white rounded-xl shadow-sm"
          data-ocid="lead.detail.save_button"
        >
          {isSaving ? "Saving\u2026" : "Save Changes"}
        </Button>
      </div>

      {/* Document Viewer Modal */}
      {viewerOpen && docItems.length > 0 && (
        <DocViewerModal
          docs={docItems}
          initialIndex={viewerIndex}
          onClose={() => setViewerOpen(false)}
        />
      )}
    </div>
  );
}
