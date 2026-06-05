import { Outlet } from "react-router-dom";
import { useState } from "react";

import { useAuth } from "../context/AuthContext";
import { TraineeProgressProvider } from "../context/TraineeProgressContext";
import { Sidebar } from "./Sidebar";

export function DashboardLayout() {
  const { user } = useAuth();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const layout = (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900">
      {isMobileSidebarOpen && (
        <button
          className="fixed inset-0 z-20 bg-gray-950/40 lg:hidden"
          onClick={() => setIsMobileSidebarOpen(false)}
          aria-label="Close sidebar overlay"
        />
      )}

      <Sidebar
        isCollapsed={isSidebarCollapsed}
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
        onToggleCollapse={() => setIsSidebarCollapsed((current) => !current)}
      />

      <main
        className={`min-h-screen transition-[padding] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
          isSidebarCollapsed ? "lg:pl-20" : "lg:pl-72"
        }`}
      >
        <Outlet />
      </main>
    </div>
  );

  if (user?.role === "admin") {
    return layout;
  }

  return <TraineeProgressProvider>{layout}</TraineeProgressProvider>;
}
