import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useApp } from "../../context/AppContext";
import type { Lead } from "../../types";

interface Props {
  lead: Lead;
  onNext: () => void;
}

export default function Step2Questions({ lead, onNext }: Props) {
  const { updateLead } = useApp();
  const [claim, setClaim] = useState<boolean | null>(lead.claim);
  const [ncb, setNcb] = useState<number>(lead.ncb);
  const [ownerChange, setOwnerChange] = useState<boolean | null>(
    lead.ownerChange,
  );

  const isCompleted = lead.detailsStatus === "Details Completed";

  const handleSave = () => {
    if (claim === null || ownerChange === null) {
      toast.error("Please answer all questions before saving.");
      return;
    }
    updateLead(lead.id, {
      claim,
      ncb,
      ownerChange,
      detailsStatus: "Details Completed",
      currentStep: Math.max(lead.currentStep, 3),
    });
    toast.success("Customer details saved!");
    onNext();
  };

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-base font-semibold text-gray-900">
          Step 2 &mdash; Customer Questions
        </h3>
        <p className="text-sm text-gray-500 mt-1">
          Collect customer details for accurate quotation.
        </p>
      </div>

      {isCompleted && (
        <div className="flex items-center gap-2 bg-green-50 text-green-800 rounded-lg px-4 py-3 text-sm font-medium">
          <CheckCircle2 className="w-4 h-4" />
          Customer details saved &mdash; this step is complete.
        </div>
      )}

      <div className="space-y-4">
        <div className="bg-gray-50 rounded-xl border border-gray-200 p-4">
          <Label className="text-sm font-semibold text-gray-800 mb-3 block">
            Last year claim?
          </Label>
          <div className="flex gap-4">
            {([true, false] as const).map((val) => (
              <label
                key={String(val)}
                className="flex items-center gap-2 cursor-pointer"
              >
                <input
                  type="radio"
                  name="claim"
                  checked={claim === val}
                  onChange={() => setClaim(val)}
                  className="text-blue-600"
                  data-ocid="lead.radio"
                />
                <span className="text-sm text-gray-700">
                  {val ? "Yes" : "No"}
                </span>
              </label>
            ))}
          </div>
        </div>

        <div className="bg-gray-50 rounded-xl border border-gray-200 p-4">
          <Label className="text-sm font-semibold text-gray-800 mb-3 block">
            Current NCB %
          </Label>
          <Select value={String(ncb)} onValueChange={(v) => setNcb(Number(v))}>
            <SelectTrigger className="w-48 bg-white" data-ocid="lead.select">
              <SelectValue placeholder="Select NCB" />
            </SelectTrigger>
            <SelectContent>
              {[0, 20, 25, 35, 45, 50].map((v) => (
                <SelectItem key={v} value={String(v)}>
                  {v}%
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="bg-gray-50 rounded-xl border border-gray-200 p-4">
          <Label className="text-sm font-semibold text-gray-800 mb-3 block">
            Owner change?
          </Label>
          <div className="flex gap-4">
            {([true, false] as const).map((val) => (
              <label
                key={String(val)}
                className="flex items-center gap-2 cursor-pointer"
              >
                <input
                  type="radio"
                  name="ownerChange"
                  checked={ownerChange === val}
                  onChange={() => setOwnerChange(val)}
                  className="text-blue-600"
                  data-ocid="lead.radio"
                />
                <span className="text-sm text-gray-700">
                  {val ? "Yes" : "No"}
                </span>
              </label>
            ))}
          </div>
        </div>
      </div>

      {!isCompleted && (
        <Button
          onClick={handleSave}
          className="w-full bg-gray-900 hover:bg-gray-800 text-white h-10"
          data-ocid="lead.save_button"
        >
          Save Details
        </Button>
      )}
    </div>
  );
}
