// "use client";

// import { Mail, Database, Zap, Plus, Search } from "lucide-react";
// import type { LucideIcon } from "lucide-react";
// import { useState, useMemo } from "react";

// import { Input } from "@/components/ui/input";
// import { Button } from "@/components/ui/button";

// export type ToolConfig = {
//   id: string;
//   name: string;
//   type: string;
//   icon: LucideIcon;
//   color: string;
//   description: string;
// };

// export default function ToolPanel({
//   onAddNode,
// }: {
//   onAddNode: (tool: ToolConfig) => void;
// }) {
//   const initialTools: ToolConfig[] = [
//     {
//       id: "mail-1",
//       name: "Mail",
//       type: "MailNode",
//       icon: Mail,
//       color: "#3B82F6",
//       description: "Send and receive emails",
//     },
//     {
//       id: "drive-1",
//       name: "Drive",
//       type: "DriveNode",
//       icon: Database,
//       color: "#10B981",
//       description: "Access files from Drive",
//     },
//     {
//       id: "openai-1",
//       name: "OpenAI",
//       type: "OpenAINode",
//       icon: Zap,
//       color: "#EF4444",
//       description: "AI assistant integration",
//     },
//   ];

//   const [tools, setTools] = useState<ToolConfig[]>(initialTools);
//   const [search, setSearch] = useState("");

//   const filteredTools = useMemo(() => {
//     return tools.filter((tool) =>
//       tool.name.toLowerCase().includes(search.toLowerCase())
//     );
//   }, [tools, search]);

//   const addNewTool = () => {
//     const newTool: ToolConfig = {
//       id: `custom-${Date.now()}`,
//       name: "New Tool",
//       type: "CustomNode",
//       icon: Plus,
//       color: "#F59E0B",
//       description: "User added tool",
//     };
//     setTools((prev) => [...prev, newTool]);
//   };

//   return (
//     <div className="flex h-full w-full flex-col bg-background/95 p-3">
//       {/* Header */}
//       <div className="mb-3">
//         <h2 className="text-sm font-semibold">Tools</h2>
//         <p className="text-xs text-muted-foreground">
//           Drag or click to add nodes
//         </p>
//       </div>

//       {/* Search */}
//       <div className="relative mb-3">
//         <Search className="absolute left-2 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
//         <Input
//           placeholder="Search tools..."
//           value={search}
//           onChange={(e) => setSearch(e.target.value)}
//           className="h-8 pl-7 text-xs"
//         />
//       </div>

//       {/* Tool List */}
//       <div className="flex-1 space-y-2 overflow-y-auto pr-1">
//         {filteredTools.map((tool) => {
//           const Icon = tool.icon;

//           return (
//             <div
//               key={tool.id}
//               onClick={() => onAddNode(tool)}
//               className="group flex cursor-pointer items-center justify-between rounded-xl border border-border/60 bg-muted/30 p-2 transition-all hover:bg-muted/60 hover:shadow-sm active:scale-[0.98]"
//             >
//               <div className="flex items-center gap-2">
//                 {/* Icon */}
//                 <div
//                   className="flex h-8 w-8 items-center justify-center rounded-lg border"
//                   style={{
//                     background: "rgba(0,0,0,0.4)",
//                     borderColor: `${tool.color}30`,
//                   }}
//                 >
//                   <Icon size={14} style={{ color: tool.color }} />
//                 </div>

//                 {/* Text */}
//                 <div className="leading-tight">
//                   <div className="text-xs font-medium">{tool.name}</div>
//                   <div className="text-[10px] text-muted-foreground">
//                     {tool.type}
//                   </div>
//                 </div>
//               </div>

//               {/* Hover Action */}
//               <div className="opacity-0 transition-opacity group-hover:opacity-100">
//                 <Plus className="h-3.5 w-3.5 text-muted-foreground" />
//               </div>
//             </div>
//           );
//         })}
//       </div>

//       {/* Add Tool */}
//       <Button
//         onClick={addNewTool}
//         variant="outline"
//         className="mt-3 h-8 w-full justify-center gap-1 text-xs"
//       >
//         <Plus className="h-3.5 w-3.5" />
//         Add Tool
//       </Button>
//     </div>
//   );
// }