import { Button } from "@/components/ui/button";
import {
  AlertTriangle,
  CheckCircle2,
  Mic,
  MicOff,
  Pause,
  Play,
  RefreshCw,
  SkipForward,
  Volume2,
  X,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Lead } from "../types";

interface VoiceAssistantProps {
  lead: Lead;
  onClose: () => void;
}

interface Step {
  id: number;
  text: string;
  label: string;
  autoAdvanceDelay: number;
}

const STEPS: Step[] = [
  {
    id: 1,
    text: "Vehicle number daliyega",
    label: "Vehicle Number",
    autoAdvanceDelay: 7000,
  },
  {
    id: 2,
    text: "Ab fuel type aur model check kijiye",
    label: "Fuel Type & Model",
    autoAdvanceDelay: 3000,
  },
  {
    id: 3,
    text: "RC ke hisaab se details match karein",
    label: "RC Details Match",
    autoAdvanceDelay: 3000,
  },
  {
    id: 4,
    text: "Agar sab details sahi hai to aage badhiye",
    label: "Confirm Details",
    autoAdvanceDelay: 3000,
  },
  {
    id: 5,
    text: "Agar kuch missing hai to please fill karein",
    label: "Fill Missing Info",
    autoAdvanceDelay: 3000,
  },
  {
    id: 6,
    text: "Quotation generate hone ke baad customer ko share karein",
    label: "Share Quotation",
    autoAdvanceDelay: 3000,
  },
];

const WARNING_TEXT = "Warning: RC aur entered details match nahi kar rahe";

export default function VoiceAssistant({ lead, onClose }: VoiceAssistantProps) {
  const [currentStep, setCurrentStep] = useState(0); // 0 = not started
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [lastText, setLastText] = useState("");
  const [statusText, setStatusText] = useState("Ready to start");
  const [showWarning, setShowWarning] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const voiceRef = useRef<SpeechSynthesisVoice | null>(null);
  const advanceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isPausedRef = useRef(false);
  const isCompletedRef = useRef(false);

  // Sync refs to state
  isPausedRef.current = isPaused;
  isCompletedRef.current = isCompleted;

  // Load and select best Hindi voice
  useEffect(() => {
    const loadVoice = () => {
      const voices = window.speechSynthesis.getVoices();
      const hindiVoice = voices.find(
        (v) => v.lang === "hi-IN" || v.lang.startsWith("hi"),
      );
      voiceRef.current = hindiVoice ?? voices[0] ?? null;
    };

    loadVoice();
    window.speechSynthesis.onvoiceschanged = loadVoice;

    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel();
      if (advanceTimerRef.current) {
        clearTimeout(advanceTimerRef.current);
      }
    };
  }, []);

  // Prevent body scroll
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  // Escape key to close
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  const speak = useCallback((text: string, onEnd?: () => void) => {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.85;
    utterance.pitch = 1.0;
    utterance.lang = "hi-IN";
    if (voiceRef.current) {
      utterance.voice = voiceRef.current;
    }

    utterance.onstart = () => {
      setIsSpeaking(true);
      setStatusText("Speaking...");
    };

    utterance.onend = () => {
      setIsSpeaking(false);
      if (onEnd) {
        onEnd();
      }
    };

    utterance.onerror = () => {
      setIsSpeaking(false);
      setStatusText("Voice error — please retry");
    };

    setLastText(text);
    window.speechSynthesis.speak(utterance);
  }, []);

  const scheduleAdvance = useCallback(
    (stepId: number, delay: number) => {
      if (advanceTimerRef.current) {
        clearTimeout(advanceTimerRef.current);
      }
      setStatusText("Waiting...");
      advanceTimerRef.current = setTimeout(() => {
        if (isPausedRef.current || isCompletedRef.current) return;
        const nextStep = stepId + 1;
        if (nextStep > STEPS.length) {
          setIsCompleted(true);
          setIsPlaying(false);
          setCurrentStep(STEPS.length);
          setStatusText("Completed ✓");
        } else {
          runStep(nextStep);
        }
      }, delay);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const runStep = useCallback(
    (stepNumber: number) => {
      if (advanceTimerRef.current) {
        clearTimeout(advanceTimerRef.current);
      }

      const step = STEPS.find((s) => s.id === stepNumber);
      if (!step) return;

      setCurrentStep(stepNumber);
      setIsPlaying(true);
      setIsCompleted(false);
      setShowWarning(false);

      // At step 3 — smart RC check
      if (stepNumber === 3 && (lead.rcFrontUrl || lead.rcBackUrl)) {
        speak(step.text, () => {
          if (isPausedRef.current) return;
          setTimeout(() => {
            if (isPausedRef.current) return;
            setShowWarning(true);
            speak(WARNING_TEXT, () => {
              if (isPausedRef.current) return;
              scheduleAdvance(stepNumber, step.autoAdvanceDelay);
            });
          }, 2000);
        });
      } else {
        speak(step.text, () => {
          if (isPausedRef.current) return;
          if (stepNumber === STEPS.length) {
            setIsCompleted(true);
            setIsPlaying(false);
            setStatusText("Completed ✓");
          } else {
            scheduleAdvance(stepNumber, step.autoAdvanceDelay);
          }
        });
      }
    },
    [lead.rcFrontUrl, lead.rcBackUrl, speak, scheduleAdvance],
  );

  const handleStart = () => {
    setIsPaused(false);
    runStep(1);
  };

  const handlePause = () => {
    window.speechSynthesis.pause();
    if (advanceTimerRef.current) {
      clearTimeout(advanceTimerRef.current);
    }
    setIsPaused(true);
    setIsSpeaking(false);
    setStatusText("Paused");
  };

  const handleResume = () => {
    window.speechSynthesis.resume();
    setIsPaused(false);
    setStatusText("Speaking...");
  };

  const handleRepeat = () => {
    if (!lastText) return;
    setIsPaused(false);
    speak(lastText);
  };

  const handleNextStep = () => {
    if (currentStep >= STEPS.length) return;
    if (advanceTimerRef.current) {
      clearTimeout(advanceTimerRef.current);
    }
    window.speechSynthesis.cancel();
    setIsPaused(false);
    runStep(currentStep + 1);
  };

  const currentStepData = STEPS.find((s) => s.id === currentStep);

  return (
    // Overlay wrapper (not the dialog itself)
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      data-ocid="voice_assistant.modal"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
        role="button"
        tabIndex={-1}
        aria-label="Close voice assistant"
        onKeyDown={(e) => e.key === "Escape" && onClose()}
      />

      {/* Dialog panel */}
      <div
        aria-modal="true"
        aria-label="Voice Assistant"
        className="relative z-10 w-full max-w-md bg-white rounded-2xl shadow-2xl flex flex-col max-h-[92dvh] overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-indigo-600 to-purple-600">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
              <Mic className="w-4 h-4 text-white" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm font-bold text-white leading-tight">
                Voice Assistant
              </h2>
              <p className="text-xs text-indigo-200 truncate">
                PB Portal Guide — Hindi
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="w-8 h-8 text-white hover:bg-white/20 flex-shrink-0 rounded-lg"
            aria-label="Close voice assistant"
            data-ocid="voice_assistant.close_button"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Step progress */}
        <div className="px-5 pt-4 pb-2">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
              Progress
            </span>
            <span className="text-xs font-bold text-indigo-600">
              {currentStep === 0
                ? "Not started"
                : isCompleted
                  ? "Completed"
                  : `Step ${currentStep} of ${STEPS.length}`}
            </span>
          </div>
          {/* Progress bar */}
          <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-700"
              style={{
                width: `${
                  isCompleted
                    ? 100
                    : currentStep === 0
                      ? 0
                      : (currentStep / STEPS.length) * 100
                }%`,
              }}
            />
          </div>
        </div>

        {/* Current instruction display */}
        {currentStep > 0 && currentStepData && (
          <div className="mx-5 mb-2 px-4 py-3.5 rounded-xl bg-indigo-50 border border-indigo-200">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-0.5">
                {isSpeaking ? (
                  <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center">
                    <Volume2 className="w-4 h-4 text-indigo-600 animate-pulse" />
                  </div>
                ) : isPaused ? (
                  <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center">
                    <Pause className="w-4 h-4 text-amber-600" />
                  </div>
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                    <Mic className="w-4 h-4 text-gray-400" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-1">
                  {isCompleted
                    ? "Completed"
                    : `Step ${currentStep} — ${currentStepData.label}`}
                </p>
                <p className="text-sm font-semibold text-indigo-900 leading-snug">
                  {isCompleted
                    ? "Sab steps complete ho gaye!"
                    : currentStepData.text}
                </p>
              </div>
            </div>

            {/* Status pill */}
            <div className="mt-2.5 flex items-center gap-1.5">
              <div
                className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                  isSpeaking
                    ? "bg-indigo-500 animate-pulse"
                    : isPaused
                      ? "bg-amber-500"
                      : isCompleted
                        ? "bg-emerald-500"
                        : "bg-gray-400"
                }`}
              />
              <span
                className={`text-[10px] font-bold uppercase tracking-widest ${
                  isSpeaking
                    ? "text-indigo-500"
                    : isPaused
                      ? "text-amber-500"
                      : isCompleted
                        ? "text-emerald-600"
                        : "text-gray-400"
                }`}
              >
                {statusText}
              </span>
            </div>
          </div>
        )}

        {/* Warning banner */}
        {showWarning && (
          <div className="mx-5 mb-2 flex items-start gap-2.5 px-3 py-2.5 rounded-xl bg-amber-50 border border-amber-300">
            <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="min-w-0">
              <p className="text-xs font-bold text-amber-800">
                RC Mismatch Warning
              </p>
              <p className="text-xs text-amber-700 mt-0.5">{WARNING_TEXT}</p>
            </div>
          </div>
        )}

        {/* Steps list — scrollable */}
        <div className="flex-1 overflow-y-auto px-5 pb-3 space-y-2 min-h-0">
          {STEPS.map((step) => {
            const isDone = isCompleted || step.id < currentStep;
            const isActive = !isCompleted && step.id === currentStep;
            const isPending = !isCompleted && step.id > currentStep;

            return (
              <div
                key={step.id}
                className={`flex items-start gap-3 px-3.5 py-3 rounded-xl border transition-all duration-300 ${
                  isActive
                    ? "bg-indigo-600 border-indigo-600 shadow-lg shadow-indigo-200"
                    : isDone
                      ? "bg-emerald-50 border-emerald-200"
                      : "bg-gray-50 border-gray-100"
                }`}
                data-ocid={`voice_assistant.step.item.${step.id}`}
              >
                {/* Step number / icon */}
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                    isActive
                      ? "bg-white/20"
                      : isDone
                        ? "bg-emerald-100"
                        : "bg-gray-200"
                  }`}
                >
                  {isDone ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  ) : isActive ? (
                    <Mic className="w-3.5 h-3.5 text-white animate-pulse" />
                  ) : (
                    <span
                      className={`text-[11px] font-bold ${
                        isPending ? "text-gray-400" : "text-gray-600"
                      }`}
                    >
                      {step.id}
                    </span>
                  )}
                </div>

                {/* Text */}
                <div className="flex-1 min-w-0">
                  <p
                    className={`text-[10px] font-bold uppercase tracking-widest mb-0.5 ${
                      isActive
                        ? "text-indigo-200"
                        : isDone
                          ? "text-emerald-500"
                          : "text-gray-400"
                    }`}
                  >
                    Step {step.id} — {step.label}
                  </p>
                  <p
                    className={`text-xs font-semibold leading-snug ${
                      isActive
                        ? "text-white"
                        : isDone
                          ? "text-emerald-700 line-through decoration-emerald-400"
                          : "text-gray-500"
                    }`}
                  >
                    {step.text}
                  </p>
                </div>
              </div>
            );
          })}

          {/* Completed state */}
          {isCompleted && (
            <div className="flex flex-col items-center justify-center py-6 gap-3">
              <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8 text-emerald-600" />
              </div>
              <div className="text-center">
                <p className="text-sm font-bold text-emerald-700">
                  All Steps Completed!
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  PB Portal guide complete ho gaya
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="px-5 py-4 border-t border-gray-100 bg-gray-50">
          {/* Not started — show Start button */}
          {currentStep === 0 && (
            <button
              type="button"
              onClick={handleStart}
              className="flex items-center justify-center gap-2.5 w-full h-12 px-5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white text-sm font-bold shadow-md shadow-indigo-200 transition-all active:scale-95"
              data-ocid="voice_assistant.primary_button"
            >
              <Play className="w-4 h-4 fill-white" />
              Start Voice Assistant
            </button>
          )}

          {/* In progress — show control buttons */}
          {currentStep > 0 && !isCompleted && (
            <div className="space-y-2.5">
              {/* Main controls row */}
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={handlePause}
                  disabled={!isPlaying || isPaused}
                  className="flex flex-col items-center justify-center gap-1 h-14 rounded-xl border-2 border-amber-200 bg-amber-50 hover:bg-amber-100 text-amber-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  data-ocid="voice_assistant.pause_button"
                >
                  <Pause className="w-4 h-4" />
                  <span className="text-[10px] font-bold">Pause</span>
                </button>

                <button
                  type="button"
                  onClick={handleResume}
                  disabled={!isPaused}
                  className="flex flex-col items-center justify-center gap-1 h-14 rounded-xl border-2 border-green-200 bg-green-50 hover:bg-green-100 text-green-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  data-ocid="voice_assistant.toggle"
                >
                  <Play className="w-4 h-4" />
                  <span className="text-[10px] font-bold">Resume</span>
                </button>

                <button
                  type="button"
                  onClick={handleRepeat}
                  disabled={!lastText}
                  className="flex flex-col items-center justify-center gap-1 h-14 rounded-xl border-2 border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  data-ocid="voice_assistant.secondary_button"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span className="text-[10px] font-bold">Repeat</span>
                </button>
              </div>

              {/* Next Step button */}
              {currentStep < STEPS.length && (
                <button
                  type="button"
                  onClick={handleNextStep}
                  className="flex items-center justify-center gap-2 w-full h-10 rounded-xl border-2 border-gray-200 bg-white hover:bg-gray-50 text-gray-700 text-xs font-bold transition-colors"
                  data-ocid="voice_assistant.pagination_next"
                >
                  <SkipForward className="w-3.5 h-3.5" />
                  Skip to Next Step
                </button>
              )}
            </div>
          )}

          {/* Completed — restart or close */}
          {isCompleted && (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setCurrentStep(0);
                  setIsCompleted(false);
                  setIsPlaying(false);
                  setIsPaused(false);
                  setShowWarning(false);
                  setLastText("");
                  setStatusText("Ready to start");
                  window.speechSynthesis.cancel();
                }}
                className="flex items-center justify-center gap-2 flex-1 h-11 rounded-xl border-2 border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-sm font-bold transition-colors"
                data-ocid="voice_assistant.secondary_button"
              >
                <RefreshCw className="w-4 h-4" />
                Restart
              </button>
              <button
                type="button"
                onClick={onClose}
                className="flex items-center justify-center gap-2 flex-1 h-11 rounded-xl bg-gray-900 hover:bg-gray-800 text-white text-sm font-bold transition-colors"
                data-ocid="voice_assistant.close_button"
              >
                <MicOff className="w-4 h-4" />
                Close
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
