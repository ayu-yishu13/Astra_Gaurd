import React, { useState } from "react";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar"; // Import your sidebar
import ChatAssistant from "../pages/ChatAssistant";

export default function MainLayout({ children }) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-[#020617] flex overflow-x-hidden">
      <Sidebar 
        collapsed={collapsed} 
        setCollapsed={setCollapsed} 
        isMobileOpen={isMobileOpen} 
        setIsMobileOpen={setIsMobileOpen} 
      />

      {/* Dynamic margin based on collapsed state for Desktop */}
      <div className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${collapsed ? "lg:ml-20" : "lg:ml-64"}`}>
        <Navbar setIsMobileOpen={setIsMobileOpen} />
        
        <main className="flex-1 pt-20 p-4 md:p-6">
          {children}
        </main>
        
        <ChatAssistant />
      </div>
    </div>
  );
}