import {
  BarChart3,
  Download,
  HelpCircle,
  LayoutDashboard,
  LogOut,
  Settings,
  Shield,
  ShieldCheck,
  Users,
} from "lucide-react";
import { useState } from "react";
import { useApp } from "../context/AppContext";
import { useInstallPrompt } from "../hooks/useInstallPrompt";

type Page = "dashboard" | "leads" | "reports" | "settings";

interface SidebarProps {
  currentPage: Page;
  onNavigate: (page: Page) => void;
  onAdminPanel?: () => void;
}

const navItems: {
  id: Page;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "leads", label: "Leads", icon: Users },
  { id: "reports", label: "Reports", icon: BarChart3 },
  { id: "settings", label: "Settings", icon: Settings },
];

export default function Sidebar({
  currentPage,
  onNavigate,
  onAdminPanel,
}: SidebarProps) {
  const { currentUser, logout } = useApp();
  const isAdmin = currentUser?.role === "admin";
  const { canInstall, isInstalled, triggerInstall } = useInstallPrompt();
  const [logoError, setLogoError] = useState(false);

  return (
    <aside
      className="fixed top-0 left-0 h-full w-[240px] flex flex-col z-30"
      style={{
        background:
          "linear-gradient(180deg, #0a0e1a 0%, #0d1228 50%, #0a0e1a 100%)",
        borderRight: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      {/* Branding */}
      <div
        className="flex items-center gap-3 px-5 py-5"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}
      >
        {/* Logo container: white rounded square bg, glow, shadow */}
        <div
          className="flex-shrink-0 flex items-center justify-center"
          style={{
            width: 52,
            height: 52,
            borderRadius: 12,
            background: "#ffffff",
            boxShadow:
              "0 0 0 2px rgba(99,102,241,0.4), 0 0 18px 6px rgba(99,102,241,0.35), 0 4px 16px rgba(0,0,0,0.5)",
            overflow: "hidden",
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
            <Shield className="w-7 h-7 text-indigo-600" />
          )}
        </div>
        <div>
          <span className="text-white font-black text-sm tracking-tight leading-tight">
            PB Insurance AI
          </span>
          <p
            className="text-[11px] font-bold leading-tight mt-0.5"
            style={{
              background: "linear-gradient(90deg, #60a5fa, #22d3ee)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            AI Insurance Trainer 🚀
          </p>
          <p className="text-[10px] text-slate-500 leading-tight">
            Train • Guide • Close Faster 💰
          </p>
        </div>
      </div>

      <nav
        className="flex-1 px-3 py-4 space-y-0.5"
        aria-label="Main navigation"
      >
        {navItems.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => onNavigate(id)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
              currentPage === id
                ? "text-white"
                : "text-slate-400 hover:text-white hover:bg-white/5"
            }`}
            style={
              currentPage === id
                ? {
                    background:
                      "linear-gradient(90deg, rgba(59,130,246,0.25), rgba(99,102,241,0.15))",
                    borderLeft: "2px solid #60a5fa",
                  }
                : { borderLeft: "2px solid transparent" }
            }
            data-ocid={`sidebar.${id}.link`}
          >
            <Icon
              className={`w-5 h-5 flex-shrink-0 ${
                currentPage === id ? "text-blue-400" : ""
              }`}
            />
            {label}
          </button>
        ))}

        {/* Admin Control Panel - admin only */}
        {isAdmin && onAdminPanel && (
          <button
            type="button"
            onClick={onAdminPanel}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:text-white hover:bg-white/5 transition-all duration-150 mt-1"
            style={{ borderLeft: "2px solid transparent" }}
            data-ocid="sidebar.admin_panel.link"
          >
            <ShieldCheck className="w-5 h-5 flex-shrink-0" />
            Admin Panel
          </button>
        )}

        {/* Install App button */}
        {!isInstalled && (
          <button
            type="button"
            onClick={canInstall ? triggerInstall : undefined}
            disabled={!canInstall}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 mt-2 ${
              canInstall
                ? "text-emerald-400 hover:text-emerald-300"
                : "text-slate-500 cursor-default"
            }`}
            style={
              canInstall
                ? {
                    background: "rgba(16,185,129,0.10)",
                    border: "1px solid rgba(16,185,129,0.20)",
                    borderRadius: 8,
                  }
                : {}
            }
            data-ocid="sidebar.install_app.button"
            title={
              canInstall
                ? "Install app on your device"
                : "Open in Chrome/Edge on Android to install"
            }
          >
            <Download className="w-5 h-5 flex-shrink-0" />
            Install App
          </button>
        )}
      </nav>

      <div
        className="px-3 py-2"
        style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}
      >
        <button
          type="button"
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
        >
          <HelpCircle className="w-5 h-5 flex-shrink-0" />
          Help &amp; Support
        </button>
      </div>

      <div
        className="px-4 py-4"
        style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}
      >
        <div className="flex items-center gap-3 mb-3">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
            style={{ background: "linear-gradient(135deg, #3b82f6, #8b5cf6)" }}
          >
            {currentUser?.name.charAt(0)}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-white truncate">
              {currentUser?.name}
            </p>
            <p className="text-xs text-slate-400 truncate capitalize">
              {currentUser?.role}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={logout}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-red-400 hover:text-red-300 transition-colors"
          style={{ background: "rgba(239,68,68,0.06)" }}
          data-ocid="sidebar.logout.button"
        >
          <LogOut className="w-4 h-4" />
          Log out
        </button>
      </div>

      {/* Sidebar footer */}
      <div
        className="px-4 py-3"
        style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
      >
        <p className="text-[10px] text-slate-500 text-center leading-tight">
          Powered by Prashant Chandratre
          <br />
          <span className="text-slate-400">7709446589</span>
        </p>
      </div>
    </aside>
  );
}
