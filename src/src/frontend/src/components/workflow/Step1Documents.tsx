import { Button } from "@/components/ui/button";
import { CheckCircle2, FileText, Upload } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useApp } from "../../context/AppContext";
import type { Lead } from "../../types";

interface Props {
  lead: Lead;
  onNext: () => void;
}

export default function Step1Documents({ lead, onNext }: Props) {
  const { updateLead } = useApp();
  const [uploads, setUploads] = useState(lead.docsUploaded);

  const handleUpload = (key: keyof typeof uploads) => {
    const next = { ...uploads, [key]: true };
    setUploads(next);
    updateLead(lead.id, { docsUploaded: next });
    toast.success("Document uploaded successfully.");
  };

  const canComplete = uploads.rcFront && uploads.rcBack;
  const isCompleted = lead.rcStatus === "Docs Received";

  const handleComplete = () => {
    if (!canComplete) return;
    updateLead(lead.id, {
      rcStatus: "Docs Received",
      currentStep: Math.max(lead.currentStep, 2),
    });
    toast.success("Documents marked as received!");
    onNext();
  };

  const docs = [
    { key: "rcFront" as const, label: "RC Front", required: true },
    { key: "rcBack" as const, label: "RC Back", required: true },
    { key: "oldPolicy" as const, label: "Old Policy", required: false },
  ];

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-base font-semibold text-gray-900">
          Step 1 &mdash; Document Collection
        </h3>
        <p className="text-sm text-gray-500 mt-1">
          Upload the required documents to proceed. RC Front and RC Back are
          mandatory.
        </p>
      </div>

      {isCompleted && (
        <div className="flex items-center gap-2 bg-green-50 text-green-800 rounded-lg px-4 py-3 text-sm font-medium">
          <CheckCircle2 className="w-4 h-4" />
          All documents received &mdash; this step is complete.
        </div>
      )}

      <div className="space-y-3">
        {docs.map(({ key, label, required }) => (
          <div
            key={key}
            className="flex items-center justify-between bg-gray-50 rounded-xl border border-gray-200 px-4 py-3.5"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-white border border-gray-200 flex items-center justify-center">
                <FileText className="w-4 h-4 text-gray-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-800">{label}</p>
                <p className="text-xs text-gray-400">
                  {required ? "Required" : "Optional"}
                </p>
              </div>
            </div>
            {uploads[key] ? (
              <div className="flex items-center gap-1.5 text-green-600 text-sm font-medium">
                <CheckCircle2 className="w-4 h-4" />
                Uploaded
              </div>
            ) : (
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleUpload(key)}
                className="text-xs h-8 px-3 border-gray-300 hover:border-blue-400 hover:text-blue-600"
                data-ocid="lead.upload_button"
              >
                <Upload className="w-3.5 h-3.5 mr-1.5" />
                Upload
              </Button>
            )}
          </div>
        ))}
      </div>

      {!isCompleted && (
        <Button
          onClick={handleComplete}
          disabled={!canComplete}
          className="w-full bg-gray-900 hover:bg-gray-800 text-white disabled:opacity-50 h-10"
          data-ocid="lead.save_button"
        >
          Mark Docs Received
        </Button>
      )}
    </div>
  );
}
