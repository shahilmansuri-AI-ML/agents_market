"use client";

import WorkflowProvider from "../context/WorkflowProvider";

export default function AgentBuilderLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <WorkflowProvider>{children}</WorkflowProvider>;
}