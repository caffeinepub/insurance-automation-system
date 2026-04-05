import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Rocket, Search, Shield } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { AGENTS, useApp } from "../context/AppContext";

interface LoginPageProps {
  onTrackPolicy?: () => void;
}

export default function LoginPage({ onTrackPolicy }: LoginPageProps) {
  const { login } = useApp();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [logoError, setLogoError] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    setTimeout(() => {
      const ok = login(email, password);
      setIsLoading(false);
      if (!ok) {
        setError("Invalid email or password. Please try again.");
      } else {
        toast.success("Welcome back! Logged in successfully.");
      }
    }, 600);
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        background:
          "linear-gradient(135deg, #0a0e1a 0%, #0d1228 30%, #0f1535 60%, #0a0e1a 100%)",
      }}
    >
      {/* Ambient glow orbs */}
      <div
        className="fixed top-0 left-1/4 w-96 h-96 rounded-full pointer-events-none"
        style={{
          background:
            "radial-gradient(circle, rgba(59,130,246,0.12) 0%, transparent 70%)",
          filter: "blur(40px)",
        }}
      />
      <div
        className="fixed bottom-0 right-1/4 w-96 h-96 rounded-full pointer-events-none"
        style={{
          background:
            "radial-gradient(circle, rgba(139,92,246,0.10) 0%, transparent 70%)",
          filter: "blur(40px)",
        }}
      />

      <div className="w-full max-w-md relative z-10">
        {/* Branding */}
        <div className="text-center mb-8">
          <div
            className="inline-flex items-center justify-center mb-4 shadow-2xl overflow-hidden"
            style={{
              background: "#ffffff",
              width: 80,
              height: 80,
              borderRadius: 16,
              boxShadow:
                "0 0 30px rgba(99,102,241,0.5), 0 8px 24px rgba(0,0,0,0.4)",
            }}
          >
            {!logoError ? (
              <img
                src="/assets/generated/pb-logo.png"
                alt="PB Insurance Logo"
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "contain",
                  display: "block",
                }}
                onError={() => setLogoError(true)}
              />
            ) : (
              <Shield className="w-9 h-9 text-indigo-600" />
            )}
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">
            PB Insurance AI
          </h1>
          <div className="flex items-center justify-center gap-1.5 mt-1.5">
            <Rocket className="w-3.5 h-3.5 text-blue-400" />
            <span
              className="text-sm font-bold"
              style={{
                background: "linear-gradient(90deg, #60a5fa, #22d3ee)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              AI Insurance Trainer
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1 font-medium tracking-wide">
            Train • Guide • Close Faster 💰
          </p>
        </div>

        {/* Glass card */}
        <div
          className="rounded-2xl p-8 shadow-2xl"
          style={{
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.10)",
            boxShadow:
              "0 25px 50px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.08)",
          }}
        >
          <h2 className="text-xl font-bold text-white mb-1">
            Sign in to your account
          </h2>
          <p className="text-sm text-slate-400 mb-6">
            Enter your credentials to continue
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label
                htmlFor="email"
                className="text-sm font-medium text-slate-300"
              >
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="h-11 text-white placeholder:text-slate-500"
                style={{
                  background: "rgba(255,255,255,0.10)",
                  border: "1px solid rgba(139,92,246,0.4)",
                  color: "#ffffff",
                }}
                data-ocid="login.input"
              />
            </div>
            <div className="space-y-1.5">
              <Label
                htmlFor="password"
                className="text-sm font-medium text-slate-300"
              >
                Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  className="h-11 pr-10 text-white placeholder:text-slate-500"
                  style={{
                    background: "rgba(255,255,255,0.10)",
                    border: "1px solid rgba(139,92,246,0.4)",
                    color: "#ffffff",
                  }}
                  data-ocid="login.input"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {error && (
              <div
                className="text-sm text-red-300 rounded-xl px-3 py-2"
                style={{
                  background: "rgba(239,68,68,0.12)",
                  border: "1px solid rgba(239,68,68,0.25)",
                }}
                data-ocid="login.error_state"
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-11 rounded-xl font-semibold text-sm text-white transition-all duration-200 disabled:opacity-60"
              style={{
                background: "linear-gradient(135deg, #3b82f6, #8b5cf6)",
                boxShadow:
                  "0 0 20px rgba(99,102,241,0.4), 0 4px 15px rgba(0,0,0,0.3)",
              }}
              data-ocid="login.submit_button"
            >
              {isLoading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          <div
            className="mt-6 pt-6"
            style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}
          >
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
              Demo Credentials
            </p>
            <div className="space-y-2">
              {/* Admin */}
              <button
                type="button"
                className="w-full flex items-center justify-between rounded-xl px-3 py-2.5 cursor-pointer transition-all text-left hover:border-blue-500/40"
                style={{
                  background: "rgba(59,130,246,0.08)",
                  border: "1px solid rgba(59,130,246,0.20)",
                }}
                onClick={() => {
                  setEmail("admin@insurance.com");
                  setPassword("admin123");
                }}
              >
                <div>
                  <p className="text-xs font-semibold text-blue-300">
                    Admin User
                  </p>
                  <p className="text-xs text-blue-400/70">
                    admin@insurance.com / admin123
                  </p>
                </div>
                <span
                  className="text-xs px-2 py-0.5 rounded-full font-semibold text-blue-300"
                  style={{ background: "rgba(59,130,246,0.20)" }}
                >
                  Admin
                </span>
              </button>
              {/* Agents */}
              {AGENTS.map((agent) => (
                <button
                  key={agent.email}
                  type="button"
                  className="w-full flex items-center justify-between rounded-xl px-3 py-2.5 cursor-pointer transition-all text-left hover:border-emerald-500/40"
                  style={{
                    background: "rgba(16,185,129,0.07)",
                    border: "1px solid rgba(16,185,129,0.18)",
                  }}
                  onClick={() => {
                    setEmail(agent.email);
                    setPassword(agent.password);
                  }}
                >
                  <div>
                    <p className="text-xs font-semibold text-emerald-300">
                      {agent.name}
                    </p>
                    <p className="text-xs text-emerald-400/70">
                      {agent.email} / {agent.password}
                    </p>
                  </div>
                  <span
                    className="text-xs px-2 py-0.5 rounded-full font-semibold text-emerald-300"
                    style={{ background: "rgba(16,185,129,0.18)" }}
                  >
                    Agent
                  </span>
                </button>
              ))}
            </div>
            <p className="text-xs text-slate-500 mt-2 text-center">
              Click a row to auto-fill credentials
            </p>
          </div>

          {/* Track policy link */}
          {onTrackPolicy && (
            <div
              className="mt-5 pt-4 text-center"
              style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
            >
              <button
                type="button"
                onClick={onTrackPolicy}
                className="inline-flex items-center gap-1.5 text-sm text-blue-400 hover:text-blue-300 transition-colors font-medium"
                data-ocid="login.link"
              >
                <Search className="w-3.5 h-3.5" />
                Track your policy status
              </button>
            </div>
          )}
        </div>

        <p className="text-center text-xs text-slate-500 mt-6">
          Powered by Prashant Chandratre | 7709446589
        </p>
      </div>
    </div>
  );
}
