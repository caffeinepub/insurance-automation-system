import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Shield } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useApp } from "../context/AppContext";

export default function LoginPage() {
  const { login } = useApp();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

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
          "linear-gradient(135deg, oklch(0.13 0.015 255) 0%, oklch(0.2 0.02 262) 100%)",
      }}
    >
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-blue-600 mb-4 shadow-lg">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            InsureFlow
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Insurance Automation System
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-1">
            Sign in to your account
          </h2>
          <p className="text-sm text-gray-500 mb-6">
            Enter your credentials to continue
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label
                htmlFor="email"
                className="text-sm font-medium text-gray-700"
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
                className="h-11"
                data-ocid="login.input"
              />
            </div>
            <div className="space-y-1.5">
              <Label
                htmlFor="password"
                className="text-sm font-medium text-gray-700"
              >
                Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  className="h-11 pr-10"
                  data-ocid="login.input"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
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
                className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2"
                data-ocid="login.error_state"
              >
                {error}
              </div>
            )}

            <Button
              type="submit"
              className="w-full h-11 bg-gray-900 hover:bg-gray-800 text-white font-medium text-sm"
              disabled={isLoading}
              data-ocid="login.submit_button"
            >
              {isLoading ? "Signing in..." : "Sign In"}
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-100">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
              Demo Credentials
            </p>
            <div className="space-y-2">
              <button
                type="button"
                className="w-full flex items-center justify-between bg-blue-50 rounded-lg px-3 py-2.5 cursor-pointer hover:bg-blue-100 transition-colors text-left"
                onClick={() => {
                  setEmail("admin@insurance.com");
                  setPassword("admin123");
                }}
              >
                <div>
                  <p className="text-xs font-semibold text-blue-800">Admin</p>
                  <p className="text-xs text-blue-600">
                    admin@insurance.com / admin123
                  </p>
                </div>
                <span className="text-xs bg-blue-200 text-blue-800 px-2 py-0.5 rounded-full font-medium">
                  Admin
                </span>
              </button>
              <button
                type="button"
                className="w-full flex items-center justify-between bg-green-50 rounded-lg px-3 py-2.5 cursor-pointer hover:bg-green-100 transition-colors text-left"
                onClick={() => {
                  setEmail("agent1@insurance.com");
                  setPassword("agent123");
                }}
              >
                <div>
                  <p className="text-xs font-semibold text-green-800">Agent</p>
                  <p className="text-xs text-green-600">
                    agent1@insurance.com / agent123
                  </p>
                </div>
                <span className="text-xs bg-green-200 text-green-800 px-2 py-0.5 rounded-full font-medium">
                  Agent
                </span>
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-2 text-center">
              Click a row to auto-fill credentials
            </p>
          </div>
        </div>

        <p className="text-center text-xs text-slate-500 mt-6">
          &copy; {new Date().getFullYear()}. Built with love using{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400 hover:underline"
          >
            caffeine.ai
          </a>
        </p>
      </div>
    </div>
  );
}
