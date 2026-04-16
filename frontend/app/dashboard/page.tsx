import React from "react";
import { CreateAgentSection } from "./_components/CreateAgentSection";
import { AgentBuilderPreview } from "./_components/AgentBuilderPreview";

function Dashboard() {
  return (
    <div className="flex flex-col items-center py-10 px-6 max-w-6xl mx-auto transition-colors duration-300">
      <CreateAgentSection />
      <AgentBuilderPreview />
    </div>
  );
}

export default Dashboard;