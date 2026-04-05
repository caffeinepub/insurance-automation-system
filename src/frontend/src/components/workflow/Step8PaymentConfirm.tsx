import { Button } from "@/components/ui/button";
import { CheckCircle2, CreditCard } from "lucide-react";
import { toast } from "sonner";
import { useApp } from "../../context/AppContext";
import type { Lead } from "../../types";

interface Props {
  lead: Lead;
  onNext: () => void;
}

export default function Step8PaymentConfirm({ lead, onNext }: Props) {
  const { updateLead } = useApp();
  const isPaid = lead.paymentStatus === "Payment Done";

  const markPaid = () => {
    updateLead(lead.id, {
      paymentStatus: "Payment Done",
      currentStep: Math.max(lead.currentStep, 9),
    });
    toast.success("Payment confirmed!");
    onNext();
  };

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-base font-semibold text-gray-900">
          Step 8 &mdash; Payment Confirmation
        </h3>
        <p className="text-sm text-gray-500 mt-1">
          Mark the payment as received once confirmed.
        </p>
      </div>

      <div className="bg-gray-50 rounded-xl border border-gray-200 p-4 space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
            <CreditCard className="w-5 h-5 text-blue-500" />
          </div>
          <div>
            <p className="text-xs text-gray-400">Quote Amount</p>
            <p className="text-lg font-bold text-gray-900">
              {lead.quoteAmount > 0
                ? `₹${lead.quoteAmount.toLocaleString("en-IN")}`
                : "\u2014"}
            </p>
          </div>
        </div>
        {lead.paymentLink && (
          <div>
            <p className="text-xs text-gray-400 mb-1">Payment Link Sent</p>
            <p className="text-xs text-blue-600 break-all">
              {lead.paymentLink}
            </p>
          </div>
        )}
      </div>

      {isPaid ? (
        <div className="flex items-center gap-2 bg-green-50 text-green-800 rounded-lg px-4 py-3 text-sm font-medium">
          <CheckCircle2 className="w-4 h-4" />
          Payment received! Customer has paid.
        </div>
      ) : (
        <Button
          onClick={markPaid}
          className="w-full bg-gray-900 hover:bg-gray-800 text-white h-10"
          data-ocid="lead.confirm_button"
        >
          Mark as Paid
        </Button>
      )}
    </div>
  );
}
