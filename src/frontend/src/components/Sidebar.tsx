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

  return (
    <aside
      className="fixed top-0 left-0 h-full w-[240px] flex flex-col z-30"
      style={{
        background:
          "linear-gradient(180deg, oklch(0.13 0.015 255), oklch(0.17 0.015 255))",
      }}
    >
      <div className="flex items-center gap-3 px-6 py-5 border-b border-white/10">
        <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center flex-shrink-0">
          <Shield className="w-5 h-5 text-white" />
        </div>
        <div>
          <span className="text-white font-bold text-sm tracking-tight leading-tight">
            PB Insurance AI
          </span>
          <p className="text-[10px] text-slate-400 leading-tight">
            by Prashant
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
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              currentPage === id
                ? "bg-white/10 text-white"
                : "text-slate-400 hover:text-white hover:bg-white/5"
            }`}
            data-ocid={`sidebar.${id}.link`}
          >
            <Icon
              className={`w-5 h-5 flex-shrink-0 ${currentPage === id ? "text-blue-400" : ""}`}
            />
            {label}
          </button>
        ))}

        {/* Admin Control Panel - admin only */}
        {isAdmin && onAdminPanel && (
          <button
            type="button"
            onClick={onAdminPanel}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:text-white hover:bg-white/5 transition-colors mt-1"
            data-ocid="sidebar.admin_panel.link"
          >
            <ShieldCheck className="w-5 h-5 flex-shrink-0" />
            Admin Panel
          </button>
        )}

        {/* Install App button – shown only if not yet installed */}
        {!isInstalled && (
          <button
            type="button"
            onClick={canInstall ? triggerInstall : undefined}
            disabled={!canInstall}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors mt-2 ${
              canInstall
                ? "bg-green-600/20 text-green-400 hover:bg-green-600/30 hover:text-green-300"
                : "text-slate-500 cursor-default"
            }`}
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

      <div className="px-3 py-2 border-t border-white/10">
        <button
          type="button"
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
        >
          <HelpCircle className="w-5 h-5 flex-shrink-0" />
          Help &amp; Support
        </button>
      </div>

      <div className="px-4 py-4 border-t border-white/10">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
            {currentUser?.name.charAt(0)}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-white truncate">
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
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
          data-ocid="sidebar.logout.button"
        >
          <LogOut className="w-4 h-4" />
          Log out
        </button>
      </div>

      {/* Sidebar footer */}
      <div className="px-4 py-3 border-t border-white/10">
        <p className="text-[10px] text-slate-500 text-center leading-tight">
          Powered by Prashant Chandratre
          <br />
          <span className="text-slate-400">7709446589</span>
        </p>
      </div>
    </aside>
  );
}
