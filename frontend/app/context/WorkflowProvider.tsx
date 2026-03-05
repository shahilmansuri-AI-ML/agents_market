// "use client";

// import { useState } from "react";
// import { Node } from "@xyflow/react";
// import WorkflowContext from "./WorkflowContext";


// export default function WorkflowProvider({ children }: any) {
//   const [nodes, setNodes] = useState<Node[]>([
//     {
//       id: "start",
//       type: "StartNode",
//       position: { x: 100, y: 100 },
//       data: { label: "Start" },
//     },
//   ]);

//   const [edge, setEdge] = useState([]);

//   return (
//     <WorkflowContext.Provider value={{ nodes, setNodes }}>
//       {children}
//     </WorkflowContext.Provider>
//   );
// }


"use client";

import { useState } from "react";
import { type Node, type Edge, ReactFlowProvider } from "@xyflow/react"; 
// Adding 'type' before Node and Edge often clears the underline`
import WorkflowContext from "./WorkflowContext";

export default function WorkflowProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [nodes, setNodes] = useState<Node[]>([
    {
      id: "start",
      type: "StartNode",
      position: { x: 0, y: 0 },
      data: { label: "Start" },
      selectable:false
    },
  ]);

  const [edges, setEdges] = useState<Edge[]>([]);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);

  return (
    <ReactFlowProvider>
      <WorkflowContext.Provider
        value={{
          nodes,
          setNodes,
          edges,
          setEdges,
          selectedNode,
          setSelectedNode,
        }}
      >
        {children}
      </WorkflowContext.Provider>
    </ReactFlowProvider>
  );
}
