import { useState } from "react";
import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Navbar onMenuToggle={() => setSidebarOpen((prev) => !prev)} />
        <main className="flex-1 overflow-y-auto bg-slate-50 p-6 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
