import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle2, FileText, Send } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useApp } from "../../context/AppContext";
import type { Lead } from "../../types";

interface Props {
  lead: Lead;
  onNext: () => void;
}

export default function Step9Policy({ lead, onNext }: Props) {
  const { updateLead } = useApp();
  const [policyNumber, setPolicyNumber] = useState(lead.policyNumber);
  const [docUploaded, setDocUploaded] = useState(!!lead.policyNumber);
  const isCompleted = lead.policyStatus === "Completed";

  const handleUpload = () => {
    if (!policyNumber.trim()) {
      toast.error("Please enter a policy number first.");
      return;
    }
    setDocUploaded(true);
    toast.success("Policy copy uploaded.");
  };

  const handleSend = () => {
    if (!docUploaded || !policyNumber.trim()) {
      toast.error("Please upload the policy copy first.");
      return;
    }
    updateLead(lead.id, {
      policyNumber,
      policyStatus: "Completed",
      pbStatus: "Active",
      currentStep: Math.max(lead.currentStep, 10),
    });
    toast.success("Policy issued and sent to customer!");
    onNext();
  };

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-base font-semibold text-gray-900">
          Step 9 &mdash; Policy Issuance
        </h3>
        <p className="text-sm text-gray-500 mt-1">
          Enter the policy number, upload a copy, and send to the customer.
        </p>
      </div>

      {isCompleted && (
        <div className="flex items-center gap-2 bg-green-50 text-green-800 rounded-lg px-4 py-3 text-sm font-medium">
          <CheckCircle2 className="w-4 h-4" />
          Policy issued:{" "}
          <span className="font-bold ml-1">{lead.policyNumber}</span> &mdash;
          sent to customer!
        </div>
      )}

      {!isCompleted && (
        <div className="space-y-4">
          <div className="bg-gray-50 rounded-xl border border-gray-200 p-4 space-y-3">
            <Label className="text-sm font-semibold text-gray-800 block">
              Policy Number
            </Label>
            <Input
              placeholder="e.g. POL-2024-007"
              value={policyNumber}
              onChange={(e) => setPolicyNumber(e.target.value)}
              className="bg-white max-w-xs"
              data-ocid="lead.input"
            />
          </div>

          <div
            className={`rounded-xl border p-4 ${docUploaded ? "bg-green-50 border-green-200" : "bg-gray-50 border-gray-200"}`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-white border border-gray-200 flex items-center justify-center">
                  <FileText className="w-4 h-4 text-gray-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-800">
                    Policy Copy
                  </p>
                  <p className="text-xs text-gray-400">
                    Upload policy document
                  </p>
                </div>
              </div>
              {docUploaded ? (
                <div className="flex items-center gap-1.5 text-green-600 text-sm font-medium">
                  <CheckCircle2 className="w-4 h-4" />
                  Uploaded
                </div>
              ) : (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleUpload}
                  disabled={!policyNumber.trim()}
                  className="text-xs h-8 border-gray-300 hover:border-blue-400 hover:text-blue-600 disabled:opacity-50"
                  data-ocid="lead.upload_button"
                >
                  Upload Copy
                </Button>
              )}
            </div>
          </div>

          <Button
            onClick={handleSend}
            disabled={!docUploaded}
            className="w-full bg-gray-900 hover:bg-gray-800 text-white h-10 flex items-center justify-center gap-2 disabled:opacity-50"
            data-ocid="lead.primary_button"
          >
            <Send className="w-4 h-4" />
            Send Policy to Customer
          </Button>
        </div>
      )}
    </div>
  );
}
