import { Button } from "@/components/ui/button";
import { Star } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useApp } from "../../context/AppContext";
import type { Lead } from "../../types";

interface Props {
  lead: Lead;
}

export default function Step10Rating({ lead }: Props) {
  const { updateLead } = useApp();
  const [hovered, setHovered] = useState(0);
  const [selected, setSelected] = useState(lead.rating ?? 0);
  const isRated = lead.rating !== null;

  const handleSubmit = () => {
    if (!selected) {
      toast.error("Please select a rating before submitting.");
      return;
    }
    updateLead(lead.id, { rating: selected });
    toast.success(`Thank you! You rated us ${selected}/5 stars.`);
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-base font-semibold text-gray-900">
          Step 10 &mdash; Customer Rating
        </h3>
        <p className="text-sm text-gray-500 mt-1">
          Collect customer satisfaction feedback.
        </p>
      </div>

      <div className="bg-gray-50 rounded-2xl border border-gray-200 p-6 text-center">
        <div className="text-4xl mb-3">&#127775;</div>
        <h4 className="text-lg font-semibold text-gray-900 mb-1">
          Are you satisfied with our service?
        </h4>
        <p className="text-sm text-gray-500 mb-5">
          Please rate your experience from 1 to 5 stars.
        </p>

        {isRated ? (
          <div className="space-y-2">
            <div className="flex justify-center gap-1.5">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star
                  key={s}
                  className={`w-8 h-8 ${
                    s <= (lead.rating ?? 0)
                      ? "text-yellow-400 fill-yellow-400"
                      : "text-gray-200 fill-gray-200"
                  }`}
                />
              ))}
            </div>
            <p className="text-sm font-semibold text-gray-700">
              Thank you! You rated us {lead.rating}/5 stars &#11088;
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div
              className="flex justify-center gap-1.5"
              onMouseLeave={() => setHovered(0)}
            >
              {[1, 2, 3, 4, 5].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSelected(s)}
                  onMouseEnter={() => setHovered(s)}
                  className="transition-transform hover:scale-110"
                  data-ocid={`lead.toggle.${s}`}
                >
                  <Star
                    className={`w-10 h-10 transition-colors ${
                      s <= (hovered || selected)
                        ? "text-yellow-400 fill-yellow-400"
                        : "text-gray-200 fill-gray-200"
                    }`}
                  />
                </button>
              ))}
            </div>
            {selected > 0 && (
              <p className="text-sm text-gray-600">
                You selected:{" "}
                <span className="font-semibold text-yellow-600">
                  {selected} star{selected !== 1 ? "s" : ""}
                </span>
              </p>
            )}
            <Button
              onClick={handleSubmit}
              disabled={!selected}
              className="bg-gray-900 hover:bg-gray-800 text-white h-10 px-8 disabled:opacity-50"
              data-ocid="lead.submit_button"
            >
              Submit Rating
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
