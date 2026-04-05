import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle2, MessageCircle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useApp } from "../../context/AppContext";
import type { Lead } from "../../types";

interface Props {
  lead: Lead;
  onNext: () => void;
}

export default function Step6PaymentLink({ lead, onNext }: Props) {
  const { updateLead } = useApp();
  const [link, setLink] = useState(lead.paymentLink);
  const [sent, setSent] = useState(
    lead.paymentStatus === "Payment Sent" ||
      lead.paymentStatus === "Payment Done",
  );

  const handleSend = () => {
    if (!link.trim()) {
      toast.error("Please paste the payment link first.");
      return;
    }
    updateLead(lead.id, {
      paymentLink: link,
      paymentStatus: "Payment Sent",
      currentStep: Math.max(lead.currentStep, 7),
    });
    setSent(true);
    toast.success("Payment link sent to customer via WhatsApp (simulated)!");
    onNext();
  };

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-base font-semibold text-gray-900">
          Step 6 &mdash; Payment Link
        </h3>
        <p className="text-sm text-gray-500 mt-1">
          Paste the PB payment link and send it to the customer.
        </p>
      </div>

      {sent && (
        <div className="flex items-center gap-2 bg-green-50 text-green-800 rounded-lg px-4 py-3 text-sm font-medium">
          <CheckCircle2 className="w-4 h-4" />
          Payment link sent to customer via WhatsApp (simulated)
        </div>
      )}

      <div className="bg-gray-50 rounded-xl border border-gray-200 p-4 space-y-3">
        <Label className="text-sm font-semibold text-gray-800">
          PB Payment Link
        </Label>
        <Input
          placeholder="Paste PB Payment Link here..."
          value={link}
          onChange={(e) => setLink(e.target.value)}
          disabled={sent}
          className="bg-white"
          data-ocid="lead.input"
        />
        {sent && link && (
          <p className="text-xs text-blue-600 break-all">{link}</p>
        )}
      </div>

      {!sent && (
        <Button
          onClick={handleSend}
          disabled={!link.trim()}
          className="w-full bg-gray-900 hover:bg-gray-800 text-white h-10 flex items-center justify-center gap-2 disabled:opacity-50"
          data-ocid="lead.primary_button"
        >
          <MessageCircle className="w-4 h-4" />
          Send Payment Link
        </Button>
      )}
    </div>
  );
}
