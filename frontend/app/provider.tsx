"use client";
import React, { useState, useCallback } from "react";

// import WorkflowContext from "./context/WorkflowContext";
// import StartNode from "./agent-builder/_customNodes/StartNode";

// Import your custom context


export const Provider = ({ children }: { children: React.ReactNode }) => {
// Manage the state for nodes and edges
//   const [nodes, setNodes] = useState<Node[]>([]);
//   const [edges, setEdges] = useState<Edge[]>([]);

  // const [addNodes, setAddNodes] = useState([{
  //   id:'start',
  //   posotion : {x:0, y:0},
  //   data : {label: 'Start'},
  //   type : 'StartNode'                                        // yha mene changes kia hai StartNode to ' '
  // }])

  // const [nodeEdges, setNodeEdges] = useState([]);

  // React Flow handlers
//   const onNodesChange: OnNodesChange = useCallback(
//     (changes) => setNodes((nds) => applyNodeChanges(changes, nds)),
//     []
//   );

//   const onEdgesChange: OnEdgesChange = useCallback(
//     (changes) => setEdges((eds) => applyEdgeChanges(changes, eds)),
//     []
//   );

//   const onConnect: OnConnect = useCallback(
//     (params) => setEdges((eds) => addEdge(params, eds)),
//     []
//   );

  return (
    // <WorkflowContext.Provider 
    //   value={{addNodes, setAddNodes, setNodeEdges}}
    // >
      <div className="h-full w-full">
        {children}
      </div>
    // </WorkflowContext.Provider>
  );
};

export default Provider;