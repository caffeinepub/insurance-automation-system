import { Button } from "@/components/ui/button";
import { Bell, CheckCircle2, Info } from "lucide-react";
import { toast } from "sonner";
import { useApp } from "../../context/AppContext";
import type { Lead } from "../../types";

interface Props {
  lead: Lead;
  onNext: () => void;
}

export default function Step7Followup({ lead, onNext }: Props) {
  const { updateLead } = useApp();
  const isPaid = lead.paymentStatus === "Payment Done";

  const sendReminder = () => {
    updateLead(lead.id, { reminderCount: lead.reminderCount + 1 });
    toast.info("Reminder sent to customer.");
  };

  const goNext = () => {
    updateLead(lead.id, { currentStep: Math.max(lead.currentStep, 8) });
    onNext();
  };

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-base font-semibold text-gray-900">
          Step 7 &mdash; Follow-up System
        </h3>
        <p className="text-sm text-gray-500 mt-1">
          Send reminders to the customer until payment is done.
        </p>
      </div>

      {isPaid ? (
        <div className="flex items-center gap-2 bg-green-50 text-green-800 rounded-lg px-4 py-3 text-sm font-medium">
          <CheckCircle2 className="w-4 h-4" />
          Payment is done &mdash; no more reminders needed.
        </div>
      ) : (
        <div className="flex items-center gap-2 bg-blue-50 text-blue-700 rounded-lg px-4 py-3 text-sm">
          <Info className="w-4 h-4 flex-shrink-0" />
          Payment is still pending. You can send reminders to the customer.
        </div>
      )}

      <div className="bg-gray-50 rounded-xl border border-gray-200 p-4 flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-gray-800">Reminders Sent</p>
          <p className="text-2xl font-bold text-blue-600 mt-1">
            {lead.reminderCount}
          </p>
        </div>
        <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center">
          <Bell className="w-6 h-6 text-blue-500" />
        </div>
      </div>

      <div className="flex gap-3">
        <Button
          type="button"
          onClick={sendReminder}
          disabled={isPaid}
          variant="outline"
          className="flex items-center gap-2 border-gray-300 text-gray-700 hover:border-blue-400 hover:text-blue-600 disabled:opacity-50"
          data-ocid="lead.primary_button"
        >
          <Bell className="w-4 h-4" />
          Send Reminder
        </Button>
        <Button
          type="button"
          onClick={goNext}
          className="bg-gray-900 hover:bg-gray-800 text-white"
          data-ocid="lead.secondary_button"
        >
          Proceed to Payment
        </Button>
      </div>
    </div>
  );
}
