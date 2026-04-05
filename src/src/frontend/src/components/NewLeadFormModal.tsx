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
  FileText,
  Upload,
  X,
} from "lucide-react";
import { useRef, useState } from "react";
import { AGENTS, type NewLeadFormData, useApp } from "../context/AppContext";
import type { LeadDocuments } from "../types";

interface Props {
  open: boolean;
  onClose: () => void;
  onCreated: (leadId: string) => void;
  defaultAgent?: string;
  isAdmin: boolean;
}

const ACCEPTED = "image/jpeg,image/jpg,image/png,application/pdf";

type DocKey = keyof Pick<
  LeadDocuments,
  | "rcFrontData"
  | "rcBackData"
  | "oldPolicyData"
  | "panCardData"
  | "aadhaarFrontData"
  | "aadhaarBackData"
>;

type DocTypeKey = keyof Pick<
  LeadDocuments,
  | "rcFrontType"
  | "rcBackType"
  | "oldPolicyType"
  | "panCardType"
  | "aadhaarFrontType"
  | "aadhaarBackType"
>;

const DATA_KEY_TO_TYPE_KEY: Record<DocKey, DocTypeKey> = {
  rcFrontData: "rcFrontType",
  rcBackData: "rcBackType",
  oldPolicyData: "oldPolicyType",
  panCardData: "panCardType",
  aadhaarFrontData: "aadhaarFrontType",
  aadhaarBackData: "aadhaarBackType",
};

const EMPTY_DOCS: LeadDocuments = {
  rcFrontData: null,
  rcBackData: null,
  oldPolicyData: null,
  panCardData: null,
  aadhaarFrontData: null,
  aadhaarBackData: null,
  rcFrontType: null,
  rcBackType: null,
  oldPolicyType: null,
  panCardType: null,
  aadhaarFrontType: null,
  aadhaarBackType: null,
};

function isValidEmail(val: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim());
}

function FileUploadBox({
  label,
  required,
  dataKey,
  docs,
  onFileChange,
}: {
  label: string;
  required?: boolean;
  dataKey: DocKey;
  docs: LeadDocuments;
  onFileChange: (
    key: DocKey,
    dataUrl: string | null,
    mimeType: string | null,
  ) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const data = docs[dataKey];
  const typeKey = DATA_KEY_TO_TYPE_KEY[dataKey];
  const mime = docs[typeKey];
  const isPdf = mime === "application/pdf";

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      onFileChange(dataKey, reader.result as string, file.type);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleRemove = () => {
    onFileChange(dataKey, null, null);
  };

  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-semibold text-gray-700">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </Label>
      {data ? (
        <div className="relative rounded-xl border-2 border-green-400 bg-green-50 overflow-hidden">
          {isPdf ? (
            <div className="flex items-center gap-3 px-3 py-3">
              <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center flex-shrink-0">
                <FileText className="w-5 h-5 text-red-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-gray-800 truncate">
                  PDF Uploaded
                </p>
                <p className="text-[10px] text-gray-500">Tap × to replace</p>
              </div>
              <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
            </div>
          ) : (
            <div className="relative">
              <img
                src={data}
                alt={label}
                className="w-full h-32 object-cover"
              />
              <div className="absolute top-1 right-1">
                <CheckCircle2 className="w-5 h-5 text-green-500 drop-shadow" />
              </div>
            </div>
          )}
          <button
            type="button"
            onClick={handleRemove}
            className="absolute top-1 left-1 w-6 h-6 rounded-full bg-gray-900/70 flex items-center justify-center hover:bg-gray-900 transition-colors"
            aria-label="Remove"
          >
            <X className="w-3.5 h-3.5 text-white" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="w-full h-24 rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 hover:bg-gray-100 hover:border-blue-400 transition-colors flex flex-col items-center justify-center gap-1.5"
        >
          <Upload className="w-5 h-5 text-gray-400" />
          <span className="text-xs text-gray-500">Tap to upload</span>
          <span className="text-[10px] text-gray-400">PDF, JPG or PNG</span>
        </button>
      )}
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED}
        className="hidden"
        onChange={handleChange}
      />
    </div>
  );
}

const STEPS = [
  { label: "Contact Details" },
  { label: "Vehicle & Insurance" },
  { label: "KYC Documents" },
];

export default function NewLeadFormModal({
  open,
  onClose,
  onCreated,
  defaultAgent,
  isAdmin,
}: Props) {
  const { addLeadFromForm } = useApp();

  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [email, setEmail] = useState("");
  const [assignedAgent, setAssignedAgent] = useState(
    defaultAgent ?? AGENTS[0].email,
  );
  const [claim, setClaim] = useState<"" | "yes" | "no">("no");
  const [ncb, setNcb] = useState<string>("0");
  const [ownerChange, setOwnerChange] = useState<"" | "yes" | "no">("no");
  const [docs, setDocs] = useState<LeadDocuments>({ ...EMPTY_DOCS });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  if (!open) return null;

  const handleFileChange = (
    key: DocKey,
    dataUrl: string | null,
    mimeType: string | null,
  ) => {
    const typeKey = DATA_KEY_TO_TYPE_KEY[key];
    setDocs((prev) => ({ ...prev, [key]: dataUrl, [typeKey]: mimeType }));
  };

  const validateStep1 = () => {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = "Full name is required.";
    if (!mobile.trim() || mobile.replace(/\D/g, "").length !== 10)
      e.mobile = "Enter a valid 10-digit mobile number.";
    if (!email.trim()) {
      e.email = "Email ID is required.";
    } else if (!isValidEmail(email)) {
      e.email = "Enter a valid email address (e.g. name@example.com).";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const validateStep2 = () => {
    const e: Record<string, string> = {};
    if (!docs.rcFrontData) e.rcFront = "RC Front is required.";
    if (!docs.rcBackData) e.rcBack = "RC Back is required.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const validateStep3 = () => {
    const e: Record<string, string> = {};
    if (!docs.panCardData) e.panCard = "PAN Card is required.";
    if (!docs.aadhaarFrontData) e.aadhaarFront = "Aadhaar Front is required.";
    if (!docs.aadhaarBackData) e.aadhaarBack = "Aadhaar Back is required.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleNext = () => {
    if (step === 1 && !validateStep1()) return;
    if (step === 2 && !validateStep2()) return;
    setStep((s) => s + 1);
    setErrors({});
  };

  const handleBack = () => {
    setStep((s) => s - 1);
    setErrors({});
  };

  const handleSave = () => {
    if (!validateStep3()) return;
    setSaving(true);
    setTimeout(() => {
      const formData: NewLeadFormData = {
        name: name.trim(),
        mobileNumber: mobile.replace(/\D/g, ""),
        email: email.trim(),
        assignedAgent,
        claim: claim === "yes" ? true : claim === "no" ? false : null,
        ncb: Number(ncb),
        ownerChange:
          ownerChange === "yes" ? true : ownerChange === "no" ? false : null,
        documents: docs,
        docsUploaded: {
          rcFront: !!docs.rcFrontData,
          rcBack: !!docs.rcBackData,
          oldPolicy: !!docs.oldPolicyData,
        },
      };
      const leadId = addLeadFromForm(formData);
      setSaving(false);
      setSaved(true);
      setTimeout(() => {
        handleReset();
        onCreated(leadId);
      }, 1200);
    }, 400);
  };

  const handleReset = () => {
    setStep(1);
    setName("");
    setMobile("");
    setEmail("");
    setAssignedAgent(defaultAgent ?? AGENTS[0].email);
    setClaim("no");
    setNcb("0");
    setOwnerChange("no");
    setDocs({ ...EMPTY_DOCS });
    setErrors({});
    setSaving(false);
    setSaved(false);
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div
        className="absolute inset-0 bg-black/50"
        onClick={handleClose}
        onKeyDown={(e) => e.key === "Escape" && handleClose()}
        role="button"
        tabIndex={-1}
        aria-label="Close modal"
      />

      <div className="relative w-full sm:max-w-md bg-white sm:rounded-2xl rounded-t-2xl shadow-2xl flex flex-col max-h-[92vh] sm:max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-gray-100 flex-shrink-0">
          <div>
            <h2 className="text-base font-bold text-gray-900">New Lead</h2>
            <p className="text-xs text-gray-500">
              Step {step} of {STEPS.length} &mdash; {STEPS[step - 1].label}
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
          >
            <X className="w-4 h-4 text-gray-600" />
          </button>
        </div>

        {/* Progress bar */}
        <div className="h-1 bg-gray-100 flex-shrink-0">
          <div
            className="h-1 bg-blue-600 transition-all duration-300"
            style={{ width: `${(step / STEPS.length) * 100}%` }}
          />
        </div>

        {/* Step indicators */}
        <div className="flex items-center justify-center gap-2 py-3 px-4 flex-shrink-0">
          {STEPS.map((s, i) => (
            <div key={s.label} className="flex items-center gap-1">
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-colors ${
                  i + 1 < step
                    ? "bg-green-500 text-white"
                    : i + 1 === step
                      ? "bg-blue-600 text-white"
                      : "bg-gray-200 text-gray-400"
                }`}
              >
                {i + 1 < step ? (
                  <CheckCircle2 className="w-3.5 h-3.5" />
                ) : (
                  i + 1
                )}
              </div>
              <span
                className={`text-[10px] font-medium hidden xs:inline ${
                  i + 1 === step ? "text-blue-600" : "text-gray-400"
                }`}
              >
                {s.label}
              </span>
              {i < STEPS.length - 1 && (
                <div className="w-4 h-px bg-gray-200 mx-0.5" />
              )}
            </div>
          ))}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-4 pb-2">
          {saved ? (
            <div className="flex flex-col items-center justify-center py-10 gap-3">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle2 className="w-9 h-9 text-green-500" />
              </div>
              <p className="text-base font-bold text-gray-900 text-center">
                Lead + Documents Saved Successfully!
              </p>
              <p className="text-xs text-gray-500">Opening lead details...</p>
            </div>
          ) : (
            <>
              {/* STEP 1: Contact Details */}
              {step === 1 && (
                <div className="space-y-4 py-2">
                  {/* Mandatory banner */}
                  <div className="flex items-center gap-2 px-3 py-2.5 bg-blue-50 border border-blue-200 rounded-xl">
                    <span className="text-red-500 font-bold text-sm">*</span>
                    <p className="text-xs font-semibold text-blue-700">
                      Mobile number and email are required to proceed.
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <Label
                      htmlFor="nl-mobile"
                      className="text-xs font-semibold text-gray-700"
                    >
                      Mobile Number <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="nl-mobile"
                      type="tel"
                      placeholder="10-digit mobile number"
                      value={mobile}
                      onChange={(e) =>
                        setMobile(
                          e.target.value.replace(/\D/g, "").slice(0, 10),
                        )
                      }
                      className={`h-11 text-base font-mono ${
                        errors.mobile
                          ? "border-red-400 focus-visible:ring-red-400"
                          : ""
                      }`}
                    />
                    {errors.mobile && (
                      <p className="text-xs text-red-500 flex items-center gap-1">
                        <span>&#9888;</span> {errors.mobile}
                      </p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <Label
                      htmlFor="nl-email"
                      className="text-xs font-semibold text-gray-700"
                    >
                      Email ID <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="nl-email"
                      type="email"
                      placeholder="customer@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className={`h-11 ${
                        errors.email
                          ? "border-red-400 focus-visible:ring-red-400"
                          : ""
                      }`}
                    />
                    {errors.email && (
                      <p className="text-xs text-red-500 flex items-center gap-1">
                        <span>&#9888;</span> {errors.email}
                      </p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <Label
                      htmlFor="nl-name"
                      className="text-xs font-semibold text-gray-700"
                    >
                      Full Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="nl-name"
                      placeholder="Customer full name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className={`h-11 ${
                        errors.name
                          ? "border-red-400 focus-visible:ring-red-400"
                          : ""
                      }`}
                    />
                    {errors.name && (
                      <p className="text-xs text-red-500 flex items-center gap-1">
                        <span>&#9888;</span> {errors.name}
                      </p>
                    )}
                  </div>

                  {isAdmin && (
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-gray-700">
                        Assign to Agent
                      </Label>
                      <Select
                        value={assignedAgent}
                        onValueChange={setAssignedAgent}
                      >
                        <SelectTrigger className="h-11">
                          <SelectValue placeholder="Select agent" />
                        </SelectTrigger>
                        <SelectContent>
                          {AGENTS.map((a) => (
                            <SelectItem key={a.email} value={a.email}>
                              {a.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
              )}

              {/* STEP 2: Vehicle & Insurance Docs */}
              {step === 2 && (
                <div className="space-y-4 py-2">
                  <div className="bg-blue-50 rounded-xl p-3 text-xs text-blue-700 font-medium">
                    Upload both sides of the RC. Old Policy copy is optional.
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <FileUploadBox
                      label="RC Front"
                      required
                      dataKey="rcFrontData"
                      docs={docs}
                      onFileChange={handleFileChange}
                    />
                    <FileUploadBox
                      label="RC Back"
                      required
                      dataKey="rcBackData"
                      docs={docs}
                      onFileChange={handleFileChange}
                    />
                  </div>
                  {(errors.rcFront || errors.rcBack) && (
                    <p className="text-xs text-red-500 flex items-center gap-1">
                      <span>&#9888;</span> {errors.rcFront || errors.rcBack}
                    </p>
                  )}

                  <FileUploadBox
                    label="Old Policy Copy"
                    dataKey="oldPolicyData"
                    docs={docs}
                    onFileChange={handleFileChange}
                  />

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-gray-700">
                      Last Year Claim
                    </Label>
                    <Select
                      value={claim}
                      onValueChange={(v) => setClaim(v as "yes" | "no" | "")}
                    >
                      <SelectTrigger className="h-11">
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="no">No</SelectItem>
                        <SelectItem value="yes">Yes</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-gray-700">
                      NCB %
                    </Label>
                    <Select value={ncb} onValueChange={setNcb}>
                      <SelectTrigger className="h-11">
                        <SelectValue placeholder="Select NCB" />
                      </SelectTrigger>
                      <SelectContent>
                        {["0", "20", "25", "35", "45", "50"].map((v) => (
                          <SelectItem key={v} value={v}>
                            {v}%
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-gray-700">
                      Owner Change Required?
                    </Label>
                    <Select
                      value={ownerChange}
                      onValueChange={(v) =>
                        setOwnerChange(v as "yes" | "no" | "")
                      }
                    >
                      <SelectTrigger className="h-11">
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="no">No</SelectItem>
                        <SelectItem value="yes">Yes</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              {/* STEP 3: KYC Documents */}
              {step === 3 && (
                <div className="space-y-4 py-2">
                  <div className="bg-amber-50 rounded-xl p-3 text-xs text-amber-700 font-medium">
                    PAN Card and both sides of Aadhaar are required.
                  </div>

                  <FileUploadBox
                    label="PAN Card"
                    required
                    dataKey="panCardData"
                    docs={docs}
                    onFileChange={handleFileChange}
                  />
                  {errors.panCard && (
                    <p className="text-xs text-red-500 flex items-center gap-1">
                      <span>&#9888;</span> {errors.panCard}
                    </p>
                  )}

                  <div className="grid grid-cols-2 gap-3">
                    <FileUploadBox
                      label="Aadhaar Front"
                      required
                      dataKey="aadhaarFrontData"
                      docs={docs}
                      onFileChange={handleFileChange}
                    />
                    <FileUploadBox
                      label="Aadhaar Back"
                      required
                      dataKey="aadhaarBackData"
                      docs={docs}
                      onFileChange={handleFileChange}
                    />
                  </div>
                  {(errors.aadhaarFront || errors.aadhaarBack) && (
                    <p className="text-xs text-red-500 flex items-center gap-1">
                      <span>&#9888;</span>{" "}
                      {errors.aadhaarFront || errors.aadhaarBack}
                    </p>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer actions */}
        {!saved && (
          <div className="flex gap-2 px-4 py-3 border-t border-gray-100 flex-shrink-0">
            {step > 1 ? (
              <Button
                variant="outline"
                onClick={handleBack}
                className="flex-1 h-11 flex items-center gap-1.5"
              >
                <ChevronLeft className="w-4 h-4" />
                Back
              </Button>
            ) : (
              <Button
                variant="outline"
                onClick={handleClose}
                className="flex-1 h-11"
              >
                Cancel
              </Button>
            )}

            {step < STEPS.length ? (
              <Button
                onClick={handleNext}
                className="flex-1 h-11 bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1.5"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </Button>
            ) : (
              <Button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 h-11 bg-green-600 hover:bg-green-700 text-white"
              >
                {saving ? "Saving..." : "Save Lead"}
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
