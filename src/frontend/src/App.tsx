import { Toaster } from "@/components/ui/sonner";
import { useState } from "react";
import { AppProvider, useApp } from "./context/AppContext";
import CustomerTrackingPage from "./pages/CustomerTrackingPage";
import DashboardPage from "./pages/DashboardPage";
import LoginPage from "./pages/LoginPage";

type AppView = "main" | "customer-tracking";

function AppInner() {
  const { currentUser } = useApp();
  const [view, setView] = useState<AppView>("main");

  if (view === "customer-tracking") {
    return (
      <>
        <CustomerTrackingPage onBack={() => setView("main")} />
        <Toaster position="bottom-right" richColors />
      </>
    );
  }

  return (
    <>
      {currentUser ? (
        <DashboardPage />
      ) : (
        <LoginPage onTrackPolicy={() => setView("customer-tracking")} />
      )}
      <Toaster position="bottom-right" richColors />
    </>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppInner />
    </AppProvider>
  );
}
