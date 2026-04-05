import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle2, ExternalLink, Info } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useApp } from "../../context/AppContext";
import type { Lead } from "../../types";

interface Props {
  lead: Lead;
  onNext: () => void;
}

export default function Step3Quotation({ lead, onNext }: Props) {
  const { updateLead } = useApp();
  const [showMessage, setShowMessage] = useState(false);
  const [quoteAmount, setQuoteAmount] = useState(
    lead.quoteAmount > 0 ? String(lead.quoteAmount) : "",
  );
  const isCompleted = lead.quoteStatus === "Quote Ready";

  const handleMarkReady = () => {
    const amount = Number(quoteAmount);
    if (!amount || amount <= 0) {
      toast.error("Please enter a valid quote amount.");
      return;
    }
    updateLead(lead.id, {
      quoteAmount: amount,
      quoteStatus: "Quote Ready",
      currentStep: Math.max(lead.currentStep, 4),
    });
    toast.success(
      `Quote of \u20b9${amount.toLocaleString("en-IN")} marked as ready!`,
    );
    onNext();
  };

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-base font-semibold text-gray-900">
          Step 3 &mdash; Quotation Flow
        </h3>
        <p className="text-sm text-gray-500 mt-1">
          Generate quotation via PB Portal and record the premium amount.
        </p>
      </div>

      {isCompleted && (
        <div className="flex items-center gap-2 bg-green-50 text-green-800 rounded-lg px-4 py-3 text-sm font-medium">
          <CheckCircle2 className="w-4 h-4" />
          Quote of &#8377;{lead.quoteAmount.toLocaleString("en-IN")} is ready.
        </div>
      )}

      <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3.5 flex items-start gap-3">
        <Info className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
        <p className="text-sm text-blue-800">
          Click &quot;Generate Quotation&quot; to open the PB Portal and
          generate a quote there. Then enter the premium amount below.
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        <Button
          onClick={() => setShowMessage(true)}
          variant="outline"
          className="border-gray-300 text-gray-700 hover:border-blue-400 hover:text-blue-600"
          data-ocid="lead.primary_button"
        >
          Generate Quotation
        </Button>
        <Button
          onClick={() => window.open("https://www.pbpartners.com", "_blank")}
          variant="outline"
          className="border-blue-300 text-blue-600 hover:bg-blue-50 flex items-center gap-2"
          data-ocid="lead.secondary_button"
        >
          <ExternalLink className="w-4 h-4" />
          Open PB Portal
        </Button>
      </div>

      {showMessage && (
        <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 flex items-center gap-2 text-green-800 text-sm font-medium">
          <CheckCircle2 className="w-4 h-4" />
          Please open the PB portal and generate a quotation there.
        </div>
      )}

      {!isCompleted && (
        <div className="space-y-3">
          <div>
            <Label className="text-sm font-semibold text-gray-700 mb-1.5 block">
              Enter Quote Amount (&#8377;)
            </Label>
            <Input
              type="number"
              placeholder="e.g. 12500"
              value={quoteAmount}
              onChange={(e) => setQuoteAmount(e.target.value)}
              className="max-w-xs"
              data-ocid="lead.input"
            />
          </div>
          <Button
            onClick={handleMarkReady}
            disabled={!quoteAmount}
            className="bg-gray-900 hover:bg-gray-800 text-white h-10 px-6 disabled:opacity-50"
            data-ocid="lead.save_button"
          >
            Mark Quote Ready
          </Button>
        </div>
      )}
    </div>
  );
}
