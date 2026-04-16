// // app/context/WorkflowContext.tsx
// "use client"
// import { createContext } from 'react';

// const WorkflowContext = createContext<any>(null);

// export default WorkflowContext;

// import { createContext } from "react";
// import { Node } from "@xyflow/react";

// interface WorkflowContextType {
//   nodes: Node[];
//   setNodes: React.Dispatch<React.SetStateAction<Node[]>>;
// }

// const WorkflowContext = createContext<WorkflowContextType | null>(null);
// export default WorkflowContext;

"use client"; // Required for Next.js Context

import { createContext, Dispatch, SetStateAction, useState } from "react";
import { Node, Edge } from "@xyflow/react";


interface WorkflowContextType {
  nodes: Node[];
  setNodes: Dispatch<SetStateAction<Node[]>>;

  edges: Edge[];
  setEdges: Dispatch<SetStateAction<Edge[]>>;

  selectedNode: Node | null;
  setSelectedNode: Dispatch<SetStateAction<Node | null>>;

}

// Keep the null default, but we will handle it in a provider
const WorkflowContext = createContext<WorkflowContextType | null>(null);




export default WorkflowContext;