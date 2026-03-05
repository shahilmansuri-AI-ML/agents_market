import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import React from "react";
import AppSidebar from "./_components/AppSidebar";
import { AppHeader } from "./_components/AppHeader";
import { CreateAgentSection } from "./_components/CreateAgentSection";


// Dummy role switch
let  USER_ROLE = "user"; 
// change to: "owner" | "user"
let permission = "";

if(USER_ROLE == "user") {
  permission = "View Only"
} else if(USER_ROLE == "tenant_admin") {
  permission = "Manage whole users"
} else if(USER_ROLE == "owner") {
  permission = "Access entire platform "
}

function DashboardProvider({ children }: any) {
  return (
    <SidebarProvider>
      <AppSidebar role={USER_ROLE?.toUpperCase()}/>
      <div className="w-full">
        <AppHeader />
        {children}
      </div>

    </SidebarProvider>


    // <SidebarProvider>
    //   <div className="flex flex-col min-h-screen w-full">
    //     {/* 1. Header hamesha top par rahega */}
    //     <AppHeader />

    //     <div className="flex flex-1">
    //       {/* 2. Sidebar niche side mein rahega */}
    //       <AppSidebar />
          
    //       {/* 3. Main content area */}
    //       <main className="flex-1 p-6 overflow-y-auto">
    //         {/* Agar aapko header ke andar button nahi chahiye toh yahan trigger de sakte hain */}
    //         {/* <SidebarTrigger className="mb-4" /> */}
    //         {children}
    //       </main>
    //     </div>
    //   </div>
    // </SidebarProvider>
  );
}


export default DashboardProvider;
