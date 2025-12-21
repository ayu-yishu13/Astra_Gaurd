import React, { useState } from "react";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar"; // Import your sidebar
import ChatAssistant from "../pages/ChatAssistant";

export default function MainLayout({ children }) {
  // 1. Create the state for Sidebar
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-[#020617] flex">
      {/* 2. Add Sidebar and pass the states */}
      <Sidebar 
        collapsed={collapsed} 
        setCollapsed={setCollapsed} 
        isMobileOpen={isMobileOpen} 
        setIsMobileOpen={setIsMobileOpen} 
      />

      {/* 3. Main content area needs flex-1 to fill remaining space */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* 4. Pass setIsMobileOpen to Navbar so the toggle works */}
        <Navbar setIsMobileOpen={setIsMobileOpen} />
        
        {/* 5. Add pt-20 to children to prevent them from hiding under the fixed Navbar */}
        <main className="flex-1 pt-20">
          {children}
        </main>
        
        <ChatAssistant />
      </div>
    </div>
  );
}