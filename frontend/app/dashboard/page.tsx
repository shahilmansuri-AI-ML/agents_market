import React from "react";
import { CreateAgentSection } from "./_components/CreateAgentSection";
import { AppHeader } from "./_components/AppHeader";
import Provider from "../provider";
import AppSidebar from "./_components/AppSidebar";
import { AiAgentTab } from "./_components/AiAgentTab";
import { AgentBuilderPreview } from "./_components/AgentBuilderPreview";
import Home from "./_components/Home"

function Dashboard() {
  return (
    <>
      <div className="flex flex-col items-center py-10 px-6 max-w-6xl mx-auto transition-colors duration-300">
        <CreateAgentSection />

        <AgentBuilderPreview />

        {/* <Home/> */}
      </div>
    </>
  );
}

export default Dashboard;
