import React from "react";
import Navbar from "./Navbar";
import ChatAssistant from "../pages/ChatAssistant";

export default function MainLayout({ children }) {
  return (
    <div className="relative">
      <Navbar />
      {children}
      <ChatAssistant />
    </div>
  );
}
