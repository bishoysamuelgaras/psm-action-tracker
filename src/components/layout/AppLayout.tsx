import { Outlet } from "react-router-dom";

import { AppHeader } from "@/components/layout/AppHeader";
import { AppMobileNav } from "@/components/layout/AppMobileNav";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { ChatbotFab } from "@/features/chatbot/components/ChatbotFab";

export function AppLayout() {
  return (
    <div dir="ltr" className="min-h-screen bg-slate-50 text-slate-900">
      <div className="grid min-h-screen lg:grid-cols-[84px_1fr]">
        <div className="relative z-40 hidden lg:block">
          <AppSidebar />
        </div>
        <div className="min-w-0 overflow-x-hidden">
          <AppHeader />
          <AppMobileNav />
          <main className="mx-auto w-full max-w-[1480px] px-3 py-4 sm:px-5 sm:py-5 lg:px-6 lg:py-6 xl:px-8">
            <Outlet />
          </main>
        </div>
      </div>
      <ChatbotFab />
    </div>
  );
}
