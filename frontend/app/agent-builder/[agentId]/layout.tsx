"use client";

import WorkflowProvider from "@/app/context/WorkflowProvider";

export default function Layout({ children }: { children: React.ReactNode }) {
  return <WorkflowProvider>{children}</WorkflowProvider>;
}
