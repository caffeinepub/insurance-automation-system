import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useApp } from "../../context/AppContext";
import type { Lead } from "../../types";

interface Props {
  lead: Lead;
  onNext: () => void;
}

export default function Step5KYC({ lead, onNext }: Props) {
  const { updateLead } = useApp();
  const [pan, setPan] = useState(lead.kycData.pan);
  const [dob, setDob] = useState(lead.kycData.dob);
  const [aadhaar, setAadhaar] = useState(lead.kycData.aadhaar);
  const [panVerified, setPanVerified] = useState(lead.kycData.panVerified);
  const [docsUploaded, setDocsUploaded] = useState(lead.kycData.docsUploaded);
  const [verifying, setVerifying] = useState(false);

  const savedPan = lead.kycData.pan;
  const savedDob = lead.kycData.dob;

  const completedCount = [
    !!savedPan,
    !!savedDob,
    panVerified,
    !!lead.kycData.aadhaar,
    docsUploaded,
  ].filter(Boolean).length;
  const progress = (completedCount / 5) * 100;
  const isCompleted = lead.kycStatus === "KYC Completed";

  const savePan = () => {
    if (!pan.trim()) {
      toast.error("Please enter a valid PAN number.");
      return;
    }
    updateLead(lead.id, {
      kycData: { ...lead.kycData, pan },
      kycStatus: "KYC In Progress",
    });
    toast.success("PAN number saved.");
  };

  const saveDob = () => {
    if (!dob) {
      toast.error("Please select a date of birth.");
      return;
    }
    updateLead(lead.id, { kycData: { ...lead.kycData, dob } });
    toast.success("Date of birth saved.");
  };

  const verifyPan = () => {
    if (!savedPan) {
      toast.error("Save PAN first before verifying.");
      return;
    }
    setVerifying(true);
    setTimeout(() => {
      setVerifying(false);
      setPanVerified(true);
      updateLead(lead.id, { kycData: { ...lead.kycData, panVerified: true } });
      toast.success("PAN verified successfully!");
    }, 1200);
  };

  const saveAadhaar = () => {
    if (!aadhaar.trim() || aadhaar.length !== 12) {
      toast.error("Please enter a valid 12-digit Aadhaar number.");
      return;
    }
    updateLead(lead.id, { kycData: { ...lead.kycData, aadhaar } });
    toast.success("Aadhaar saved.");
  };

  const uploadDocs = () => {
    setDocsUploaded(true);
    updateLead(lead.id, { kycData: { ...lead.kycData, docsUploaded: true } });
    toast.success("KYC documents uploaded.");
  };

  const completeKYC = () => {
    updateLead(lead.id, {
      kycStatus: "KYC Completed",
      currentStep: Math.max(lead.currentStep, 6),
    });
    toast.success("KYC completed!");
    onNext();
  };

  const allDone =
    savedPan && savedDob && panVerified && lead.kycData.aadhaar && docsUploaded;

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-base font-semibold text-gray-900">
          Step 5 &mdash; KYC Process
        </h3>
        <p className="text-sm text-gray-500 mt-1">
          Complete all sub-steps to finish KYC verification.
        </p>
      </div>

      {isCompleted && (
        <div className="flex items-center gap-2 bg-green-50 text-green-800 rounded-lg px-4 py-3 text-sm font-medium">
          <CheckCircle2 className="w-4 h-4" />
          KYC is complete &mdash; this step is done.
        </div>
      )}

      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-gray-500 font-medium">
            KYC Progress
          </span>
          <span className="text-xs font-semibold text-blue-600">
            {completedCount}/5 steps
          </span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      <div className="space-y-3">
        <div
          className={`rounded-xl border p-4 ${
            savedPan
              ? "bg-green-50 border-green-200"
              : "bg-gray-50 border-gray-200"
          }`}
        >
          <div className="flex items-center gap-2 mb-2">
            {savedPan ? (
              <CheckCircle2 className="w-4 h-4 text-green-600" />
            ) : (
              <div className="w-4 h-4 rounded-full border-2 border-gray-300" />
            )}
            <span className="text-sm font-semibold text-gray-800">
              1. PAN Number
            </span>
          </div>
          {savedPan ? (
            <p className="text-sm text-green-700 font-medium">{savedPan}</p>
          ) : (
            <div className="flex gap-2">
              <Input
                placeholder="e.g. ABCDE1234F"
                value={pan}
                onChange={(e) => setPan(e.target.value.toUpperCase())}
                maxLength={10}
                className="bg-white max-w-xs"
                data-ocid="lead.input"
              />
              <Button
                size="sm"
                onClick={savePan}
                className="bg-gray-900 text-white hover:bg-gray-800"
                data-ocid="lead.save_button"
              >
                Save PAN
              </Button>
            </div>
          )}
        </div>

        <div
          className={`rounded-xl border p-4 ${
            savedDob
              ? "bg-green-50 border-green-200"
              : "bg-gray-50 border-gray-200"
          }`}
        >
          <div className="flex items-center gap-2 mb-2">
            {savedDob ? (
              <CheckCircle2 className="w-4 h-4 text-green-600" />
            ) : (
              <div className="w-4 h-4 rounded-full border-2 border-gray-300" />
            )}
            <span className="text-sm font-semibold text-gray-800">
              2. Date of Birth
            </span>
          </div>
          {savedDob ? (
            <p className="text-sm text-green-700 font-medium">{savedDob}</p>
          ) : (
            <div className="flex gap-2 flex-wrap">
              <Input
                type="date"
                value={dob}
                onChange={(e) => setDob(e.target.value)}
                className="bg-white max-w-xs"
                data-ocid="lead.input"
              />
              <Button
                size="sm"
                onClick={saveDob}
                className="bg-gray-900 text-white hover:bg-gray-800"
                data-ocid="lead.save_button"
              >
                Save DOB
              </Button>
            </div>
          )}
        </div>

        <div
          className={`rounded-xl border p-4 ${
            panVerified
              ? "bg-green-50 border-green-200"
              : "bg-gray-50 border-gray-200"
          }`}
        >
          <div className="flex items-center gap-2 mb-2">
            {panVerified ? (
              <CheckCircle2 className="w-4 h-4 text-green-600" />
            ) : (
              <div className="w-4 h-4 rounded-full border-2 border-gray-300" />
            )}
            <span className="text-sm font-semibold text-gray-800">
              3. Verify PAN
            </span>
          </div>
          {panVerified ? (
            <p className="text-sm text-green-700 font-medium">
              &#10003; PAN Verified
            </p>
          ) : (
            <Button
              size="sm"
              onClick={verifyPan}
              disabled={verifying || !savedPan}
              className="bg-blue-600 text-white hover:bg-blue-700 flex items-center gap-2"
              data-ocid="lead.confirm_button"
            >
              {verifying && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {verifying ? "Verifying..." : "Verify PAN"}
            </Button>
          )}
        </div>

        <div
          className={`rounded-xl border p-4 ${
            lead.kycData.aadhaar
              ? "bg-green-50 border-green-200"
              : "bg-gray-50 border-gray-200"
          }`}
        >
          <div className="flex items-center gap-2 mb-2">
            {lead.kycData.aadhaar ? (
              <CheckCircle2 className="w-4 h-4 text-green-600" />
            ) : (
              <div className="w-4 h-4 rounded-full border-2 border-gray-300" />
            )}
            <span className="text-sm font-semibold text-gray-800">
              4. Aadhaar Number
            </span>
          </div>
          {lead.kycData.aadhaar ? (
            <p className="text-sm text-green-700 font-medium">
              {lead.kycData.aadhaar}
            </p>
          ) : (
            <div className="flex gap-2 flex-wrap">
              <Input
                placeholder="12-digit Aadhaar"
                value={aadhaar}
                onChange={(e) => setAadhaar(e.target.value.replace(/\D/g, ""))}
                maxLength={12}
                className="bg-white max-w-xs"
                data-ocid="lead.input"
              />
              <Button
                size="sm"
                onClick={saveAadhaar}
                className="bg-gray-900 text-white hover:bg-gray-800"
                data-ocid="lead.save_button"
              >
                Save Aadhaar
              </Button>
            </div>
          )}
        </div>

        <div
          className={`rounded-xl border p-4 ${
            docsUploaded
              ? "bg-green-50 border-green-200"
              : "bg-gray-50 border-gray-200"
          }`}
        >
          <div className="flex items-center gap-2 mb-2">
            {docsUploaded ? (
              <CheckCircle2 className="w-4 h-4 text-green-600" />
            ) : (
              <div className="w-4 h-4 rounded-full border-2 border-gray-300" />
            )}
            <span className="text-sm font-semibold text-gray-800">
              5. Upload KYC Documents
            </span>
          </div>
          {docsUploaded ? (
            <p className="text-sm text-green-700 font-medium">
              &#10003; Documents uploaded
            </p>
          ) : (
            <Button
              size="sm"
              onClick={uploadDocs}
              className="bg-gray-900 text-white hover:bg-gray-800"
              data-ocid="lead.upload_button"
            >
              Upload Docs
            </Button>
          )}
        </div>
      </div>

      {!isCompleted && (
        <Button
          onClick={completeKYC}
          disabled={!allDone}
          className="w-full bg-gray-900 hover:bg-gray-800 text-white h-10 disabled:opacity-50"
          data-ocid="lead.save_button"
        >
          Complete KYC
        </Button>
      )}
    </div>
  );
}
