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
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  FileImage,
  FileText,
  Save,
  Shield,
  Upload,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { AGENTS, useApp } from "../context/AppContext";

interface NewLeadFullFormProps {
  onSave: (leadId: string) => void;
  onCancel: () => void;
  defaultAgent?: string;
  isAdmin?: boolean;
}

type YesNoEmpty = "yes" | "no" | "";

const NCB_OPTIONS = [0, 20, 25, 35, 45, 50];

const STEP_TITLES = [
  "Basic & Insurance Details",
  "Vehicle Documents",
  "KYC Documents",
];

const STEP_ICONS = [Shield, FileImage, FileText];

// ─── FileUploadField ─────────────────────────────────────────────────────────

interface FileUploadFieldProps {
  label: string;
  required?: boolean;
  accept?: string;
  file: File | null;
  error?: string;
  onChange: (file: File | null) => void;
  ocid: string;
}

function FileUploadField({
  label,
  required = false,
  accept = "image/*",
  file,
  error,
  onChange,
  ocid,
}: FileUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const preview = file?.type.startsWith("image/")
    ? URL.createObjectURL(file)
    : null;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-1.5">
        <Label className="text-sm font-semibold text-gray-700">{label}</Label>
        {required ? (
          <span className="text-[10px] font-bold text-red-500 uppercase tracking-wide">
            * Required
          </span>
        ) : (
          <span className="text-[10px] text-gray-400">(optional)</span>
        )}
      </div>

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        data-ocid={ocid}
        className={`w-full rounded-xl border-2 border-dashed transition-colors overflow-hidden ${
          error
            ? "border-red-300 bg-red-50"
            : file
              ? "border-blue-300 bg-blue-50"
              : "border-gray-200 bg-gray-50 hover:border-blue-300 hover:bg-blue-50"
        }`}
      >
        {file ? (
          <div className="flex items-center gap-3 p-3">
            {preview ? (
              <img
                src={preview}
                alt={label}
                className="w-16 h-16 object-cover rounded-lg flex-shrink-0 shadow-sm"
              />
            ) : (
              <div className="w-16 h-16 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                <FileText className="w-8 h-8 text-blue-500" />
              </div>
            )}
            <div className="flex-1 min-w-0 text-left">
              <p className="text-xs font-semibold text-blue-700 truncate">
                {file.name}
              </p>
              <p className="text-[11px] text-blue-500 mt-0.5">
                {(file.size / 1024).toFixed(1)} KB
              </p>
              <p className="text-[10px] text-blue-400 mt-0.5">Tap to change</p>
            </div>
            <CheckCircle2 className="w-5 h-5 text-blue-500 flex-shrink-0" />
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-5 px-3 gap-2">
            <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
              <Upload className="w-5 h-5 text-gray-400" />
            </div>
            <p className="text-xs font-medium text-gray-500">Tap to upload</p>
          </div>
        )}
      </button>

      {error && (
        <p
          className="text-xs text-red-500 font-medium"
          data-ocid={`${ocid}_error`}
        >
          {error}
        </p>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="sr-only"
        onChange={(e) => {
          const f = e.target.files?.[0] ?? null;
          onChange(f);
          // Reset input so same file can be re-selected
          e.target.value = "";
        }}
      />
    </div>
  );
}

// ─── Main Form ────────────────────────────────────────────────────────────────

export default function NewLeadFullForm({
  onSave,
  onCancel,
  defaultAgent,
  isAdmin = false,
}: NewLeadFullFormProps) {
  const { addLeadFull } = useApp();
  const [step, setStep] = useState(1);

  // Step 1 state
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [email, setEmail] = useState("");
  const [claim, setClaim] = useState<YesNoEmpty>("");
  const [ncb, setNcb] = useState<string>("0");
  const [ownerChange, setOwnerChange] = useState<YesNoEmpty>("");
  const [assignedAgent, setAssignedAgent] = useState(
    defaultAgent ?? AGENTS[0].email,
  );

  // Step 1 errors
  const [mobileError, setMobileError] = useState("");

  // Step 2 state
  const [rcFrontFile, setRcFrontFile] = useState<File | null>(null);
  const [rcBackFile, setRcBackFile] = useState<File | null>(null);
  const [oldPolicyFile, setOldPolicyFile] = useState<File | null>(null);

  // Step 2 errors
  const [rcFrontError, setRcFrontError] = useState("");
  const [rcBackError, setRcBackError] = useState("");

  // Step 3 state
  const [panFile, setPanFile] = useState<File | null>(null);
  const [aadhaarFrontFile, setAadhaarFrontFile] = useState<File | null>(null);
  const [aadhaarBackFile, setAadhaarBackFile] = useState<File | null>(null);

  // Step 3 errors
  const [panError, setPanError] = useState("");
  const [aadhaarFrontError, setAadhaarFrontError] = useState("");
  const [aadhaarBackError, setAadhaarBackError] = useState("");

  const [isSaving, setIsSaving] = useState(false);

  // ── Validation ─────────────────────────────────────────────────────────────

  const validateStep1 = (): boolean => {
    let valid = true;
    const digits = mobile.replace(/\D/g, "");
    if (!digits || digits.length !== 10) {
      setMobileError("Enter a valid 10-digit mobile number");
      valid = false;
    } else {
      setMobileError("");
    }
    return valid;
  };

  const validateStep2 = (): boolean => {
    let valid = true;
    if (!rcFrontFile) {
      setRcFrontError("RC Front image is required");
      valid = false;
    } else {
      setRcFrontError("");
    }
    if (!rcBackFile) {
      setRcBackError("RC Back image is required");
      valid = false;
    } else {
      setRcBackError("");
    }
    return valid;
  };

  const validateStep3 = (): boolean => {
    let valid = true;
    if (!panFile) {
      setPanError("PAN Card is required");
      valid = false;
    } else {
      setPanError("");
    }
    if (!aadhaarFrontFile) {
      setAadhaarFrontError("Aadhaar Front is required");
      valid = false;
    } else {
      setAadhaarFrontError("");
    }
    if (!aadhaarBackFile) {
      setAadhaarBackError("Aadhaar Back is required");
      valid = false;
    } else {
      setAadhaarBackError("");
    }
    return valid;
  };

  // ── Navigation ──────────────────────────────────────────────────────────────

  const handleNext = () => {
    if (step === 1 && !validateStep1()) return;
    if (step === 2 && !validateStep2()) return;
    setStep((s) => s + 1);
  };

  const handleBack = () => setStep((s) => s - 1);

  // ── Save ───────────────────────────────────────────────────────────────────

  const handleSave = () => {
    if (!validateStep3()) return;

    setIsSaving(true);

    const rcFrontUrl = rcFrontFile
      ? URL.createObjectURL(rcFrontFile)
      : undefined;
    const rcBackUrl = rcBackFile ? URL.createObjectURL(rcBackFile) : undefined;
    const oldPolicyUrl = oldPolicyFile
      ? URL.createObjectURL(oldPolicyFile)
      : undefined;
    const panUrl = panFile ? URL.createObjectURL(panFile) : undefined;
    const aadhaarFrontUrl = aadhaarFrontFile
      ? URL.createObjectURL(aadhaarFrontFile)
      : undefined;
    const aadhaarBackUrl = aadhaarBackFile
      ? URL.createObjectURL(aadhaarBackFile)
      : undefined;

    const newId = addLeadFull({
      name,
      mobileNumber: mobile,
      email,
      claim: claim === "" ? null : claim === "yes",
      ncb: Number(ncb),
      ownerChange: ownerChange === "" ? null : ownerChange === "yes",
      assignedAgent,
      workflowStatus: "Docs Received",
      rcStatus: "Docs Received",
      docsUploaded: {
        rcFront: !!rcFrontFile,
        rcBack: !!rcBackFile,
        oldPolicy: !!oldPolicyFile,
      },
      rcFrontUrl,
      rcBackUrl,
      oldPolicyUrl,
      panUrl,
      aadhaarFrontUrl,
      aadhaarBackUrl,
      kycData: {
        pan: "",
        dob: "",
        aadhaar: "",
        panVerified: false,
        docsUploaded: true,
      },
    });

    setTimeout(() => {
      setIsSaving(false);
      toast.success("Lead + Documents Saved Successfully");
      onSave(newId);
    }, 400);
  };

  const StepIcon = STEP_ICONS[step - 1];

  return (
    <div
      className="fixed inset-0 z-50 bg-white flex flex-col overflow-hidden"
      data-ocid="new_lead_full.modal"
    >
      {/* ── Header ── */}
      <header className="flex-shrink-0 bg-white border-b border-gray-200 shadow-xs">
        <div className="flex items-center gap-3 px-4 py-3 max-w-lg mx-auto">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center flex-shrink-0">
            <Shield className="w-4 h-4 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-sm font-bold text-gray-900 leading-tight">
              New Lead
            </h1>
            <p className="text-[11px] text-gray-400">{STEP_TITLES[step - 1]}</p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="w-9 h-9 rounded-lg flex items-center justify-center hover:bg-gray-100 transition-colors flex-shrink-0"
            data-ocid="new_lead_full.close_button"
            aria-label="Close form"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Progress bar */}
        <div className="px-4 pb-3 max-w-lg mx-auto">
          <div className="flex items-center gap-2">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center gap-2 flex-1">
                <div
                  className={`flex items-center justify-center w-6 h-6 rounded-full text-[11px] font-bold flex-shrink-0 transition-colors ${
                    s < step
                      ? "bg-green-500 text-white"
                      : s === step
                        ? "bg-blue-600 text-white"
                        : "bg-gray-200 text-gray-400"
                  }`}
                  data-ocid={`new_lead_full.step.${s}`}
                >
                  {s < step ? <CheckCircle2 className="w-3.5 h-3.5" /> : s}
                </div>
                {s < 3 && (
                  <div
                    className={`h-1 flex-1 rounded-full transition-colors ${
                      s < step ? "bg-green-400" : "bg-gray-200"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          <p className="text-[10px] text-gray-400 mt-1.5 font-medium">
            Step {step} of 3
          </p>
        </div>
      </header>

      {/* ── Scrollable Content ── */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-4 py-5 max-w-lg mx-auto pb-28">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 24 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -24 }}
                transition={{ duration: 0.22, ease: "easeOut" }}
                className="space-y-5"
              >
                {/* Section: Basic Details */}
                <div className="space-y-1 mb-2">
                  <div className="flex items-center gap-2">
                    <StepIcon className="w-4 h-4 text-blue-500" />
                    <h2 className="text-sm font-bold text-gray-800">
                      Basic Details
                    </h2>
                  </div>
                  <div className="h-px bg-gray-100" />
                </div>

                <div className="space-y-1.5">
                  <Label
                    htmlFor="nlf-mobile"
                    className="text-sm font-semibold text-gray-700"
                  >
                    Mobile Number{" "}
                    <span className="text-red-500 text-[10px] font-bold uppercase">
                      * Required
                    </span>
                  </Label>
                  <Input
                    id="nlf-mobile"
                    data-ocid="new_lead_full.mobile.input"
                    type="tel"
                    inputMode="numeric"
                    maxLength={10}
                    value={mobile}
                    onChange={(e) => {
                      setMobile(e.target.value.replace(/\D/g, ""));
                      if (mobileError) setMobileError("");
                    }}
                    placeholder="10-digit mobile number"
                    className={`h-12 text-base font-mono ${
                      mobileError ? "border-red-300 focus:ring-red-300" : ""
                    }`}
                  />
                  {mobileError && (
                    <p
                      className="text-xs text-red-500 font-medium"
                      data-ocid="new_lead_full.mobile.error_state"
                    >
                      {mobileError}
                    </p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label
                    htmlFor="nlf-name"
                    className="text-sm font-semibold text-gray-700"
                  >
                    Full Name{" "}
                    <span className="text-[10px] text-gray-400">
                      (optional)
                    </span>
                  </Label>
                  <Input
                    id="nlf-name"
                    data-ocid="new_lead_full.name.input"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Customer's full name"
                    className="h-12"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label
                    htmlFor="nlf-email"
                    className="text-sm font-semibold text-gray-700"
                  >
                    Email ID{" "}
                    <span className="text-[10px] text-gray-400">
                      (optional)
                    </span>
                  </Label>
                  <Input
                    id="nlf-email"
                    data-ocid="new_lead_full.email.input"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="customer@email.com"
                    className="h-12"
                  />
                </div>

                {/* Section: Insurance Details */}
                <div className="space-y-1 mb-2 pt-2">
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-blue-500" />
                    <h2 className="text-sm font-bold text-gray-800">
                      Insurance Details
                    </h2>
                  </div>
                  <div className="h-px bg-gray-100" />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-sm font-semibold text-gray-700">
                    Last Year Claim
                  </Label>
                  <Select
                    value={claim}
                    onValueChange={(v) => setClaim(v as YesNoEmpty)}
                  >
                    <SelectTrigger
                      className="h-12 text-sm"
                      data-ocid="new_lead_full.claim.select"
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

                <div className="space-y-1.5">
                  <Label className="text-sm font-semibold text-gray-700">
                    NCB %
                  </Label>
                  <Select value={ncb} onValueChange={setNcb}>
                    <SelectTrigger
                      className="h-12 text-sm"
                      data-ocid="new_lead_full.ncb.select"
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
                    Owner Change Required?
                  </Label>
                  <Select
                    value={ownerChange}
                    onValueChange={(v) => setOwnerChange(v as YesNoEmpty)}
                  >
                    <SelectTrigger
                      className="h-12 text-sm"
                      data-ocid="new_lead_full.owner_change.select"
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

                {isAdmin && (
                  <div className="space-y-1.5">
                    <Label className="text-sm font-semibold text-gray-700">
                      Assign To Agent
                    </Label>
                    <Select
                      value={assignedAgent}
                      onValueChange={setAssignedAgent}
                    >
                      <SelectTrigger
                        className="h-12 text-sm"
                        data-ocid="new_lead_full.agent.select"
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
                )}
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 24 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -24 }}
                transition={{ duration: 0.22, ease: "easeOut" }}
                className="space-y-5"
              >
                <div className="space-y-1 mb-2">
                  <div className="flex items-center gap-2">
                    <StepIcon className="w-4 h-4 text-blue-500" />
                    <h2 className="text-sm font-bold text-gray-800">
                      Vehicle Documents
                    </h2>
                  </div>
                  <div className="h-px bg-gray-100" />
                </div>

                <FileUploadField
                  label="RC Front Image"
                  required
                  accept="image/*"
                  file={rcFrontFile}
                  error={rcFrontError}
                  onChange={(f) => {
                    setRcFrontFile(f);
                    if (f) setRcFrontError("");
                  }}
                  ocid="new_lead_full.rc_front.upload_button"
                />

                <FileUploadField
                  label="RC Back Image"
                  required
                  accept="image/*"
                  file={rcBackFile}
                  error={rcBackError}
                  onChange={(f) => {
                    setRcBackFile(f);
                    if (f) setRcBackError("");
                  }}
                  ocid="new_lead_full.rc_back.upload_button"
                />

                <div className="pt-2 space-y-1 mb-2">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-gray-400" />
                    <h2 className="text-sm font-bold text-gray-800">
                      Insurance Document
                    </h2>
                  </div>
                  <div className="h-px bg-gray-100" />
                </div>

                <FileUploadField
                  label="Old Policy Upload"
                  required={false}
                  accept="image/*,application/pdf"
                  file={oldPolicyFile}
                  onChange={setOldPolicyFile}
                  ocid="new_lead_full.old_policy.upload_button"
                />
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 24 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -24 }}
                transition={{ duration: 0.22, ease: "easeOut" }}
                className="space-y-5"
              >
                <div className="space-y-1 mb-2">
                  <div className="flex items-center gap-2">
                    <StepIcon className="w-4 h-4 text-blue-500" />
                    <h2 className="text-sm font-bold text-gray-800">
                      KYC Documents
                    </h2>
                  </div>
                  <div className="h-px bg-gray-100" />
                </div>

                <FileUploadField
                  label="PAN Card"
                  required
                  accept="image/*"
                  file={panFile}
                  error={panError}
                  onChange={(f) => {
                    setPanFile(f);
                    if (f) setPanError("");
                  }}
                  ocid="new_lead_full.pan.upload_button"
                />

                <FileUploadField
                  label="Aadhaar Front"
                  required
                  accept="image/*"
                  file={aadhaarFrontFile}
                  error={aadhaarFrontError}
                  onChange={(f) => {
                    setAadhaarFrontFile(f);
                    if (f) setAadhaarFrontError("");
                  }}
                  ocid="new_lead_full.aadhaar_front.upload_button"
                />

                <FileUploadField
                  label="Aadhaar Back"
                  required
                  accept="image/*"
                  file={aadhaarBackFile}
                  error={aadhaarBackError}
                  onChange={(f) => {
                    setAadhaarBackFile(f);
                    if (f) setAadhaarBackError("");
                  }}
                  ocid="new_lead_full.aadhaar_back.upload_button"
                />

                {/* Upload summary */}
                <div className="rounded-xl bg-blue-50 border border-blue-100 p-3 space-y-1.5">
                  <p className="text-[11px] font-bold text-blue-700 uppercase tracking-wide">
                    Upload Summary
                  </p>
                  {(
                    [
                      { label: "RC Front", file: rcFrontFile },
                      { label: "RC Back", file: rcBackFile },
                      {
                        label: "Old Policy",
                        file: oldPolicyFile,
                        optional: true,
                      },
                      { label: "PAN Card", file: panFile },
                      { label: "Aadhaar Front", file: aadhaarFrontFile },
                      { label: "Aadhaar Back", file: aadhaarBackFile },
                    ] as {
                      label: string;
                      file: File | null;
                      optional?: boolean;
                    }[]
                  ).map((item) => (
                    <div
                      key={item.label}
                      className="flex items-center justify-between"
                    >
                      <span className="text-xs text-blue-600">
                        {item.label}
                      </span>
                      {item.file ? (
                        <span className="text-xs font-semibold text-green-600 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Uploaded
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">
                          {item.optional ? "Not uploaded" : "Missing"}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ── Sticky Footer Nav ── */}
      <div className="flex-shrink-0 bg-white/95 backdrop-blur-sm border-t border-gray-200 p-4">
        <div className="max-w-lg mx-auto flex gap-3">
          {step > 1 ? (
            <Button
              type="button"
              variant="outline"
              onClick={handleBack}
              className="flex-1 h-12 font-semibold"
              data-ocid="new_lead_full.back.button"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Back
            </Button>
          ) : (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              className="flex-1 h-12 font-semibold"
              data-ocid="new_lead_full.cancel_button"
            >
              Cancel
            </Button>
          )}

          {step < 3 ? (
            <Button
              type="button"
              onClick={handleNext}
              className="flex-1 h-12 font-bold bg-blue-600 hover:bg-blue-700 text-white"
              data-ocid="new_lead_full.next.button"
            >
              Next
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          ) : (
            <Button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="flex-1 h-12 font-bold bg-gray-900 hover:bg-gray-800 text-white"
              data-ocid="new_lead_full.save_button"
            >
              {isSaving ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Saving…
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Save className="w-4 h-4" />
                  Save Lead
                </span>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
