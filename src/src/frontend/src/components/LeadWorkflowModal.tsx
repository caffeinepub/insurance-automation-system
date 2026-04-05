import { Button } from "@/components/ui/button";
import { Check, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useApp } from "../context/AppContext";
import type { Lead } from "../types";
import Step1Documents from "./workflow/Step1Documents";
import Step2Questions from "./workflow/Step2Questions";
import Step3Quotation from "./workflow/Step3Quotation";
import Step4AgentConfirm from "./workflow/Step4AgentConfirm";
import Step5KYC from "./workflow/Step5KYC";
import Step6PaymentLink from "./workflow/Step6PaymentLink";
import Step7Followup from "./workflow/Step7Followup";
import Step8PaymentConfirm from "./workflow/Step8PaymentConfirm";
import Step9Policy from "./workflow/Step9Policy";
import Step10Rating from "./workflow/Step10Rating";

const STEP_LABELS = [
  "Documents",
  "Questions",
  "Quotation",
  "Confirm",
  "KYC",
  "Pmt Link",
  "Follow-up",
  "Pmt Confirm",
  "Policy",
  "Rating",
];

interface Props {
  lead: Lead;
  isOpen: boolean;
  onClose: () => void;
}

export default function LeadWorkflowModal({ lead, isOpen, onClose }: Props) {
  const { leads } = useApp();
  const liveLead = leads.find((l) => l.id === lead.id) ?? lead;
  const [activeStep, setActiveStep] = useState(liveLead.currentStep);

  useEffect(() => {
    setActiveStep(liveLead.currentStep);
  }, [liveLead.currentStep]);

  if (!isOpen) return null;

  const isStepUnlocked = (step: number) => step <= liveLead.currentStep;

  const stepComponents: Record<number, React.ReactNode> = {
    1: <Step1Documents lead={liveLead} onNext={() => setActiveStep(2)} />,
    2: <Step2Questions lead={liveLead} onNext={() => setActiveStep(3)} />,
    3: <Step3Quotation lead={liveLead} onNext={() => setActiveStep(4)} />,
    4: <Step4AgentConfirm lead={liveLead} onNext={() => setActiveStep(5)} />,
    5: <Step5KYC lead={liveLead} onNext={() => setActiveStep(6)} />,
    6: <Step6PaymentLink lead={liveLead} onNext={() => setActiveStep(7)} />,
    7: <Step7Followup lead={liveLead} onNext={() => setActiveStep(8)} />,
    8: <Step8PaymentConfirm lead={liveLead} onNext={() => setActiveStep(9)} />,
    9: <Step9Policy lead={liveLead} onNext={() => setActiveStep(10)} />,
    10: <Step10Rating lead={liveLead} />,
  };

  return (
    <dialog
      open
      className="fixed inset-0 z-50 flex items-center justify-center bg-transparent p-0 max-w-none w-full h-full m-0"
      aria-modal="true"
      data-ocid="lead.modal"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        onKeyDown={(e) => e.key === "Escape" && onClose()}
        role="presentation"
      />

      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col mx-4">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-base font-semibold text-gray-900">
              Lead Workflow
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Mobile:{" "}
              <span className="font-medium text-gray-700">
                {liveLead.mobileNumber}
              </span>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            data-ocid="lead.close_button"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Indicator */}
        <div className="px-4 py-3 border-b border-gray-100 overflow-x-auto">
          <div className="flex items-center min-w-max">
            {STEP_LABELS.map((label, i) => {
              const step = i + 1;
              const isDone = step < liveLead.currentStep;
              const isActive = step === activeStep;
              const isUnlocked = isStepUnlocked(step);
              return (
                <div key={step} className="flex items-center">
                  <button
                    type="button"
                    onClick={() => isUnlocked && setActiveStep(step)}
                    className={`flex flex-col items-center gap-1 px-1.5 ${
                      isUnlocked
                        ? "cursor-pointer"
                        : "cursor-not-allowed opacity-40"
                    }`}
                    disabled={!isUnlocked}
                  >
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                        isDone
                          ? "bg-gray-200 text-gray-500"
                          : isActive
                            ? "bg-blue-600 text-white shadow-sm"
                            : isUnlocked
                              ? "bg-gray-100 text-gray-600 hover:bg-gray-200"
                              : "bg-gray-100 text-gray-400"
                      }`}
                    >
                      {isDone ? <Check className="w-3.5 h-3.5" /> : step}
                    </div>
                    <span
                      className={`text-[9px] font-medium whitespace-nowrap ${
                        isActive ? "text-blue-600" : "text-gray-400"
                      }`}
                    >
                      {label}
                    </span>
                  </button>
                  {i < STEP_LABELS.length - 1 && (
                    <div
                      className={`h-0.5 w-3 rounded-full mb-3 ${
                        step < liveLead.currentStep
                          ? "bg-gray-300"
                          : "bg-gray-100"
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {stepComponents[activeStep]}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
          <Button
            variant="outline"
            onClick={() => setActiveStep((s) => Math.max(1, s - 1))}
            disabled={activeStep === 1}
            className="border-gray-300 text-gray-700 h-9 px-4"
            data-ocid="lead.modal.cancel_button"
          >
            Previous
          </Button>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={onClose}
              className="border-gray-300 text-gray-700 h-9 px-4"
              data-ocid="lead.modal.close_button"
            >
              Close
            </Button>
            {activeStep < 10 && (
              <Button
                onClick={() => {
                  if (isStepUnlocked(activeStep + 1))
                    setActiveStep((s) => s + 1);
                }}
                disabled={!isStepUnlocked(activeStep + 1)}
                className="bg-gray-900 hover:bg-gray-800 text-white h-9 px-4 disabled:opacity-50"
                data-ocid="lead.modal.confirm_button"
              >
                Next Stage
              </Button>
            )}
          </div>
        </div>
      </div>
    </dialog>
  );
}
