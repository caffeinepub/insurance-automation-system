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
  Maximize2,
  MessageCircle,
  Mic,
  Minimize2,
  UserCheck,
  X,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { AGENTS, useApp } from "../context/AppContext";
import { WORKFLOW_STATUSES, type WorkflowStatus } from "../types";
import { statusConfig } from "./LeadCard";
import VoiceAssistant from "./VoiceAssistant";

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

// \u2500\u2500\u2500 Document Viewer Modal (Premium, Fullscreen, Zoom) \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
interface DocViewerProps {
  docs: { label: string; url: string }[];
  initialIndex: number;
  onClose: () => void;
}

const ZOOM_STEPS = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2, 2.5, 3];

function DocViewerModal({ docs, initialIndex, onClose }: DocViewerProps) {
  const [current, setCurrent] = useState(initialIndex);
  const [zoomIndex, setZoomIndex] = useState(2); // default 1x
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const doc = docs[current];
  const total = docs.length;
  const zoom = ZOOM_STEPS[zoomIndex];

  const goPrev = useCallback(() => {
    setCurrent((i) => (i - 1 + total) % total);
    setZoomIndex(2);
  }, [total]);

  const goNext = useCallback(() => {
    setCurrent((i) => (i + 1) % total);
    setZoomIndex(2);
  }, [total]);

  const zoomIn = useCallback(
    () => setZoomIndex((z) => Math.min(z + 1, ZOOM_STEPS.length - 1)),
    [],
  );
  const zoomOut = useCallback(
    () => setZoomIndex((z) => Math.max(z - 1, 0)),
    [],
  );

  const toggleFullscreen = () => {
    if (!isFullscreen) {
      containerRef.current?.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
    setIsFullscreen(!isFullscreen);
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowLeft") goPrev();
      else if (e.key === "ArrowRight") goNext();
      else if (e.key === "+" || e.key === "=") zoomIn();
      else if (e.key === "-") zoomOut();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose, goPrev, goNext, zoomIn, zoomOut]);

  // Prevent body scroll
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-[80] flex items-center justify-center"
      data-ocid="lead.docs.modal"
    >
      {/* Dark backdrop */}
      <div
        role="button"
        tabIndex={-1}
        className="absolute inset-0 cursor-default"
        style={{ background: "rgba(0,0,0,0.92)" }}
        onClick={onClose}
        onKeyDown={(e) => e.key === "Escape" && onClose()}
        aria-label="Close document viewer"
      />

      {/* Viewer panel */}
      <div
        className="relative z-10 flex flex-col"
        style={{
          width: "min(700px, 97vw)",
          maxHeight: "96dvh",
          background: "#111827",
          border: "1.5px solid rgba(255,255,255,0.14)",
          borderRadius: 20,
          boxShadow: "0 32px 80px rgba(0,0,0,0.7)",
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div
          className="flex items-center gap-3 px-4 py-3 flex-shrink-0"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.10)" }}
        >
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              Document
            </p>
            <h2 className="text-base font-bold text-white truncate">
              {doc.label}
            </h2>
          </div>
          {/* Zoom controls */}
          {!isPdf(doc.url) && (
            <div
              className="flex items-center gap-1 px-2 py-1 rounded-lg"
              style={{
                background: "rgba(255,255,255,0.07)",
                border: "1px solid rgba(255,255,255,0.10)",
              }}
            >
              <button
                type="button"
                onClick={zoomOut}
                disabled={zoomIndex === 0}
                className="w-7 h-7 flex items-center justify-center rounded text-white disabled:opacity-30 hover:bg-white/10 transition-colors"
                title="Zoom Out (-)"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="text-xs font-bold text-white min-w-[36px] text-center">
                {Math.round(zoom * 100)}%
              </span>
              <button
                type="button"
                onClick={zoomIn}
                disabled={zoomIndex === ZOOM_STEPS.length - 1}
                className="w-7 h-7 flex items-center justify-center rounded text-white disabled:opacity-30 hover:bg-white/10 transition-colors"
                title="Zoom In (+)"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
          {/* Fullscreen */}
          <button
            type="button"
            onClick={toggleFullscreen}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
            title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
          >
            {isFullscreen ? (
              <Minimize2 className="w-4 h-4" />
            ) : (
              <Maximize2 className="w-4 h-4" />
            )}
          </button>
          {/* Download */}
          <button
            type="button"
            onClick={() => downloadDoc(doc.url, doc.label)}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 transition-colors"
            title={`Download ${doc.label}`}
            data-ocid="lead.docs.modal.download_button"
          >
            <Download className="w-4 h-4" />
          </button>
          {/* Close */}
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Close viewer"
            data-ocid="lead.docs.modal.close_button"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Document display */}
        <div
          className="flex-1 overflow-auto flex items-center justify-center"
          style={{
            background: "#0d1117",
            minHeight: 320,
            maxHeight: "calc(96dvh - 120px)",
          }}
        >
          {isPdf(doc.url) ? (
            <iframe
              src={doc.url}
              title={doc.label}
              className="w-full"
              style={{
                border: "none",
                height: "calc(96dvh - 180px)",
                minHeight: 320,
              }}
            />
          ) : (
            <div
              className="flex items-center justify-center p-4"
              style={{ minWidth: "100%", minHeight: 320 }}
            >
              <img
                src={doc.url}
                alt={doc.label}
                style={{
                  transform: `scale(${zoom})`,
                  transformOrigin: "center center",
                  transition: "transform 0.2s ease",
                  maxWidth: "100%",
                  imageRendering: "crisp-edges",
                  display: "block",
                }}
              />
            </div>
          )}
        </div>

        {/* Navigation footer */}
        {total > 1 && (
          <div
            className="flex items-center gap-3 px-4 py-3 flex-shrink-0"
            style={{ borderTop: "1px solid rgba(255,255,255,0.10)" }}
          >
            <button
              type="button"
              onClick={goPrev}
              className="w-9 h-9 flex items-center justify-center rounded-lg text-white transition-colors"
              style={{
                background: "rgba(255,255,255,0.08)",
                border: "1px solid rgba(255,255,255,0.12)",
              }}
              aria-label="Previous document"
              data-ocid="lead.docs.modal.pagination_prev"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {/* Dot indicators */}
            <div className="flex-1 flex items-center justify-center gap-2">
              {docs.map((d, i) => (
                <button
                  key={d.label}
                  type="button"
                  onClick={() => {
                    setCurrent(i);
                    setZoomIndex(2);
                  }}
                  className="rounded-full transition-all"
                  style={{
                    width: i === current ? 20 : 8,
                    height: 8,
                    background:
                      i === current
                        ? "linear-gradient(90deg, #3b82f6, #8b5cf6)"
                        : "rgba(255,255,255,0.25)",
                  }}
                  aria-label={`View ${d.label}`}
                />
              ))}
            </div>

            <button
              type="button"
              onClick={goNext}
              className="w-9 h-9 flex items-center justify-center rounded-lg text-white transition-colors"
              style={{
                background: "rgba(255,255,255,0.08)",
                border: "1px solid rgba(255,255,255,0.12)",
              }}
              aria-label="Next document"
              data-ocid="lead.docs.modal.pagination_next"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {total === 1 && (
          <div
            className="px-4 py-2 text-center flex-shrink-0"
            style={{ borderTop: "1px solid rgba(255,255,255,0.10)" }}
          >
            <p className="text-xs text-slate-400">1 of 1 document</p>
          </div>
        )}
      </div>
    </div>
  );
}

// \u2500\u2500\u2500 Main Component \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
export default function LeadDetailPage({
  leadId,
  onBack,
}: LeadDetailPageProps) {
  const { leads, updateLead, currentUser, setPbPortalOpen } = useApp();
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

  // Voice assistant state
  const [showVoiceAssistant, setShowVoiceAssistant] = useState(false);

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

  // Shared section card style (white-on-dark, clear borders)
  const sectionCard: React.CSSProperties = {
    background: "rgba(255,255,255,0.04)",
    border: "1.5px solid rgba(255,255,255,0.12)",
    borderRadius: 16,
  };
  const sectionHeaderStyle: React.CSSProperties = {
    borderBottom: "1px solid rgba(255,255,255,0.10)",
    background: "rgba(255,255,255,0.03)",
    padding: "10px 16px",
  };

  return (
    <div
      className="min-h-full"
      style={{ background: "linear-gradient(180deg, #0a0e1a, #0d1228)" }}
    >
      {/* Header bar */}
      <header
        className="sticky top-0 z-10"
        style={{
          background: "rgba(10,14,26,0.97)",
          backdropFilter: "blur(6px)",
          borderBottom: "1.5px solid rgba(255,255,255,0.12)",
        }}
      >
        <div className="flex items-center gap-3 px-4 py-3 max-w-lg mx-auto">
          <button
            type="button"
            onClick={onBack}
            className="flex items-center justify-center w-9 h-9 rounded-lg transition-colors"
            style={{
              background: "rgba(255,255,255,0.07)",
              border: "1px solid rgba(255,255,255,0.12)",
            }}
            data-ocid="lead.detail.back_button"
            aria-label="Go back"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <h1 className="flex-1 text-base font-bold text-white text-center">
            Lead Details
          </h1>
          <div className="w-9" />
        </div>
      </header>

      {/* Content */}
      <div className="px-4 py-5 max-w-lg mx-auto space-y-4 pb-32">
        {/* IDENTITY section */}
        <section style={sectionCard} className="overflow-hidden">
          <div style={sectionHeaderStyle}>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
              Identity
            </p>
          </div>
          <div className="p-4 space-y-4">
            <div className="space-y-1.5">
              <Label
                htmlFor="detail-mobile"
                className="text-sm font-semibold text-slate-200"
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
                className="h-11 font-mono text-base text-white"
              />
            </div>
            <div className="space-y-1.5">
              <Label
                htmlFor="detail-name"
                className="text-sm font-semibold text-slate-200"
              >
                Name
              </Label>
              <Input
                id="detail-name"
                data-ocid="lead.detail.name.input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Customer name"
                className="h-11 text-white"
              />
            </div>
          </div>
        </section>

        {/* ASSIGNED AGENT section */}
        <section style={sectionCard} className="overflow-hidden">
          <div style={sectionHeaderStyle}>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
              Assigned Agent
            </p>
          </div>
          <div className="p-4">
            {isAdmin ? (
              <div className="space-y-1.5">
                <Label className="text-sm font-semibold text-slate-200">
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
              <div
                className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl"
                style={{
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.10)",
                }}
              >
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: "rgba(99,102,241,0.25)" }}
                >
                  <UserCheck className="w-4 h-4 text-indigo-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">
                    {assignedAgentName}
                  </p>
                  <p className="text-[11px] text-slate-400">{assignedAgent}</p>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* STATUS section */}
        <section style={sectionCard} className="overflow-hidden">
          <div style={sectionHeaderStyle}>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
              Status
            </p>
          </div>
          <div className="p-4">
            <Label className="text-sm font-semibold text-slate-200 mb-2 block">
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
        <section style={sectionCard} className="overflow-hidden">
          <div style={sectionHeaderStyle}>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
              Details
            </p>
          </div>
          <div className="p-4 space-y-4">
            <div className="space-y-1.5">
              <Label className="text-sm font-semibold text-slate-200">
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
              <Label className="text-sm font-semibold text-slate-200">
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
              <Label className="text-sm font-semibold text-slate-200">
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

        {/* BUSINESS TRACKING section */}
        {workflowStatus === "Completed" && (
          <section
            className="overflow-hidden"
            style={{
              ...sectionCard,
              border: "1.5px solid rgba(16,185,129,0.35)",
            }}
          >
            <div
              style={{
                ...sectionHeaderStyle,
                background: "rgba(16,185,129,0.08)",
                borderBottom: "1px solid rgba(16,185,129,0.20)",
              }}
            >
              <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-400">
                Business Tracking
              </p>
            </div>
            <div className="p-4 space-y-4">
              <div className="space-y-1.5">
                <Label
                  htmlFor="detail-policy-amount"
                  className="text-sm font-semibold text-slate-200"
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
                  className="h-11 text-white"
                />
              </div>
              <div className="space-y-1.5">
                <Label
                  htmlFor="detail-commission"
                  className="text-sm font-semibold text-slate-200"
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
                  className="h-11 text-white"
                />
              </div>
              {policyAmount > 0 && commissionPercent > 0 && (
                <div
                  className="flex items-center justify-between px-3 py-2.5 rounded-xl"
                  style={{
                    background: "rgba(16,185,129,0.12)",
                    border: "1.5px solid rgba(16,185,129,0.30)",
                  }}
                >
                  <span className="text-xs font-semibold text-emerald-300">
                    Commission Amount
                  </span>
                  <span className="text-sm font-bold text-emerald-200">
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
        <section style={sectionCard} className="overflow-hidden">
          <div style={sectionHeaderStyle}>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
              Payment Link
            </p>
          </div>
          <div className="p-4 space-y-3">
            <div className="space-y-1.5">
              <Label
                htmlFor="detail-payment-link"
                className="text-sm font-semibold text-slate-200"
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
                  className="h-11 flex-1 text-white"
                />
              </div>
            </div>

            {savedLink && (
              <div
                className="flex items-center gap-2 px-3 py-2.5 rounded-xl"
                style={{
                  background: "rgba(59,130,246,0.10)",
                  border: "1.5px solid rgba(59,130,246,0.25)",
                }}
              >
                <Link2 className="w-4 h-4 text-blue-400 flex-shrink-0" />
                <span className="text-xs font-semibold text-blue-300 flex-shrink-0">
                  Saved:
                </span>
                <a
                  href={savedLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-ocid="lead.payment_link.button"
                  className="text-xs text-blue-300 hover:text-blue-200 hover:underline truncate flex-1 min-w-0"
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
                  className="text-xs font-bold text-blue-400 hover:text-blue-300 flex-shrink-0 underline"
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
            style={sectionCard}
            className="overflow-hidden"
            data-ocid="lead.docs.section"
          >
            <div style={sectionHeaderStyle}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileImage className="w-3.5 h-3.5 text-blue-400" />
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                    Uploaded Documents
                  </p>
                </div>
                <span
                  className="text-[10px] font-semibold px-2 py-0.5 rounded-full text-blue-300"
                  style={{
                    background: "rgba(59,130,246,0.15)",
                    border: "1px solid rgba(59,130,246,0.25)",
                  }}
                >
                  {docItems.length} file{docItems.length !== 1 ? "s" : ""}
                </span>
              </div>
            </div>
            <div className="p-4">
              <div className="grid grid-cols-2 gap-3">
                {docItems.map((doc, idx) => (
                  <div
                    key={doc.label}
                    className="rounded-xl overflow-hidden transition-all hover:scale-[1.02]"
                    style={{
                      background: "rgba(255,255,255,0.04)",
                      border: "1.5px solid rgba(255,255,255,0.12)",
                    }}
                    data-ocid={`lead.docs.item.${idx + 1}`}
                  >
                    {/* Label */}
                    <div className="px-2.5 pt-2.5 pb-1">
                      <p className="text-[10px] font-bold text-slate-300 uppercase tracking-wide truncate">
                        {doc.label}
                      </p>
                    </div>

                    {/* Thumbnail */}
                    <button
                      type="button"
                      onClick={() => openViewer(idx)}
                      className="w-full block group relative"
                      aria-label={`View ${doc.label}`}
                    >
                      {isPdf(doc.url) ? (
                        <div
                          className="w-full h-24 flex flex-col items-center justify-center gap-1"
                          style={{
                            background: "rgba(239,68,68,0.10)",
                            borderTop: "1px solid rgba(255,255,255,0.08)",
                            borderBottom: "1px solid rgba(255,255,255,0.08)",
                          }}
                        >
                          <div
                            className="w-8 h-8 rounded-lg flex items-center justify-center"
                            style={{ background: "rgba(239,68,68,0.20)" }}
                          >
                            <span className="text-[9px] font-bold text-red-400 uppercase">
                              PDF
                            </span>
                          </div>
                          <span className="text-[10px] text-red-400 font-medium">
                            PDF Document
                          </span>
                        </div>
                      ) : (
                        <div className="relative">
                          <img
                            src={doc.url}
                            alt={doc.label}
                            className="w-full h-24 object-cover"
                            style={{
                              borderTop: "1px solid rgba(255,255,255,0.08)",
                              borderBottom: "1px solid rgba(255,255,255,0.08)",
                              imageRendering: "crisp-edges",
                            }}
                          />
                          {/* Hover overlay */}
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                            <Eye className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow" />
                          </div>
                        </div>
                      )}
                    </button>

                    {/* Action buttons */}
                    <div className="flex gap-1.5 p-2">
                      <button
                        type="button"
                        onClick={() => openViewer(idx)}
                        className="flex-1 h-8 text-xs font-semibold rounded-lg flex items-center justify-center gap-1 transition-colors"
                        style={{
                          background: "rgba(59,130,246,0.15)",
                          border: "1px solid rgba(59,130,246,0.30)",
                          color: "#93c5fd",
                        }}
                        data-ocid={`lead.docs.view_button.${idx + 1}`}
                      >
                        <Eye className="w-3.5 h-3.5" />
                        View
                      </button>
                      <button
                        type="button"
                        onClick={() => downloadDoc(doc.url, doc.label)}
                        className="flex-1 h-8 text-xs font-semibold rounded-lg flex items-center justify-center gap-1 transition-colors"
                        style={{
                          background: "rgba(255,255,255,0.07)",
                          border: "1px solid rgba(255,255,255,0.12)",
                          color: "#cbd5e1",
                        }}
                        data-ocid={`lead.docs.download_button.${idx + 1}`}
                      >
                        <Download className="w-3.5 h-3.5" />
                        Save
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ACTIONS section */}
        <section style={sectionCard} className="overflow-hidden">
          <div style={sectionHeaderStyle}>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
              Quick Actions
            </p>
          </div>
          <div className="p-4 space-y-3">
            {isFollowUpDue && (
              <div
                className="flex items-start gap-3 px-3 py-3 rounded-xl"
                style={{
                  background: "rgba(245,158,11,0.10)",
                  border: "1.5px solid rgba(245,158,11,0.30)",
                }}
                data-ocid="lead.followup.panel"
              >
                <Bell className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-amber-300">
                    Follow-up due
                  </p>
                  <p className="text-xs text-amber-400 mt-0.5">
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
                  className="flex-shrink-0 px-3 py-1.5 rounded-lg text-white text-xs font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    background: "linear-gradient(135deg, #d97706, #b45309)",
                  }}
                >
                  Send Follow-up
                </button>
              </div>
            )}

            {/* Voice Assistant button */}
            <button
              type="button"
              onClick={() => setShowVoiceAssistant(true)}
              className="flex items-center justify-center gap-2 w-full h-11 px-4 rounded-xl text-sm font-bold transition-all"
              style={{
                background: "rgba(99,102,241,0.15)",
                border: "1.5px solid rgba(99,102,241,0.35)",
                color: "#a5b4fc",
              }}
              data-ocid="lead.detail.voice_assistant.button"
            >
              <Mic className="w-4 h-4" />
              Start Voice Assistant
            </button>

            <a
              href="https://www.pbpartners.com"
              target="_blank"
              rel="noopener noreferrer"
              data-ocid="lead.detail.pb_portal.button"
              className="flex items-center justify-center gap-2 w-full h-11 px-4 rounded-xl text-sm font-bold transition-all"
              onClick={() => setPbPortalOpen(true)}
              style={{
                background: "rgba(59,130,246,0.15)",
                border: "1.5px solid rgba(59,130,246,0.35)",
                color: "#93c5fd",
              }}
            >
              <ExternalLink className="w-4 h-4" />
              Open PB Portal
            </a>

            <div className="space-y-1">
              <p className="text-[11px] text-slate-400 font-medium">
                Message Preview
              </p>
              <div
                className="text-xs px-3 py-2.5 rounded-xl leading-relaxed"
                style={{
                  background: "rgba(16,185,129,0.08)",
                  border: "1px solid rgba(16,185,129,0.20)",
                  color: "#6ee7b7",
                }}
              >
                {previewMessage}
              </div>
            </div>

            {whatsappUrl ? (
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                data-ocid="lead.detail.whatsapp.button"
                className="flex items-center justify-center gap-2 w-full h-11 px-4 rounded-xl text-white text-sm font-bold transition-all"
                style={{
                  background: "linear-gradient(135deg, #16a34a, #15803d)",
                  boxShadow: "0 0 12px rgba(16,185,129,0.25)",
                }}
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
                className="flex items-center justify-center gap-2 w-full h-11 px-4 rounded-xl text-sm font-bold cursor-not-allowed opacity-50"
                style={{
                  background: "rgba(22,163,74,0.15)",
                  border: "1px solid rgba(22,163,74,0.20)",
                  color: "#86efac",
                }}
              >
                <MessageCircle className="w-4 h-4" />
                WhatsApp Customer
              </button>
            )}
          </div>
        </section>

        <p className="text-[11px] text-slate-500 text-center">
          Lead ID: {lead.id} \u00b7 Created{" "}
          {new Date(lead.createdAt).toLocaleDateString("en-IN")}
        </p>
      </div>

      {/* Sticky Save Button */}
      <div
        className="fixed bottom-0 left-0 right-0 z-20 p-4"
        style={{
          background: "rgba(10,14,26,0.97)",
          backdropFilter: "blur(6px)",
          borderTop: "1.5px solid rgba(255,255,255,0.12)",
        }}
      >
        <Button
          onClick={handleSave}
          disabled={isSaving}
          className="w-full max-w-lg mx-auto block h-12 text-base font-bold text-white rounded-xl shadow-sm"
          style={{
            background: "linear-gradient(135deg, #3b82f6, #6366f1)",
            boxShadow: "0 0 20px rgba(99,102,241,0.35)",
          }}
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

      {/* Voice Assistant Modal */}
      {showVoiceAssistant && (
        <VoiceAssistant
          lead={lead}
          onClose={() => setShowVoiceAssistant(false)}
        />
      )}
    </div>
  );
}
