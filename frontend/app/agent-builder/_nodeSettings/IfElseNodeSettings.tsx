"use client";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import React, { useEffect, useState } from "react";
import { toast } from "sonner";

interface IfElseNodeSettingsProps {
  selectedNode: any;
  updateFormData: (data: any) => void;
}

const defaultForm = {
  ifCondition: "",
  elseCondition: "",
};

export const IfElseNodeSettings: React.FC<IfElseNodeSettingsProps> = ({
  selectedNode,
  updateFormData,
}) => {
  const [formData, setFormData] = useState(defaultForm);

  useEffect(() => {
    if (selectedNode?.data?.settings) {
      setFormData({ ...defaultForm, ...selectedNode.data.settings });
    }
  }, [selectedNode]);

  const handleChange = (key: string, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    if (!formData.ifCondition.trim()) {
      toast.error("If condition is required");
      return;
    }
    updateFormData(formData);
    toast.success("If-Else node settings saved");
  };

  return (
    <div className="flex flex-col gap-4 w-full max-w-md p-4">
      {/* IF Condition */}
      <div className="grid gap-2">
        <Label htmlFor="ifCondition">If Condition</Label>
        <Input
          id="ifCondition"
          placeholder='e.g. status === "active"'
          value={formData.ifCondition}
          onChange={(e) => handleChange("ifCondition", e.target.value)}
        />
      </div>

      {/* ELSE Condition */}
      <div className="grid gap-2">
        <Label htmlFor="elseCondition">Else Condition</Label>
        <Input
          id="elseCondition"
          placeholder='e.g. status !== "active"'
          value={formData.elseCondition}
          onChange={(e) => handleChange("elseCondition", e.target.value)}
        />
      </div>

      <Button className="w-full bg-indigo-600 hover:bg-indigo-500 text-white mt-2" onClick={handleSave}>
        Save
      </Button>
    </div>
  );
};

export default IfElseNodeSettings;





// modified version with more features and better UI/UX - can be used as a future reference for improving the current component
// "use client";

// import React, { useEffect, useMemo, useState } from "react";
// import { Button } from "@/components/ui/button";
// import { Label } from "@/components/ui/label";
// import { Input } from "@/components/ui/input";
// import {
//   Select,
//   SelectTrigger,
//   SelectValue,
//   SelectContent,
//   SelectItem,
// } from "@/components/ui/select";
// import { toast } from "sonner";
// import { GitBranch, CheckCircle2, AlertCircle, Eye } from "lucide-react";

// interface IfElseNodeSettingsProps {
//   selectedNode: any;
//   updateFormData: (data: any) => void;
// }

// type Operator =
//   | "equals"
//   | "not_equals"
//   | "contains"
//   | "not_contains"
//   | "greater_than"
//   | "less_than"
//   | "is_empty"
//   | "is_not_empty";

// interface IfElseFormData {
//   name: string;
//   leftOperand: string;
//   operator: Operator;
//   rightOperand: string;
//   caseSensitive: boolean;
//   trueLabel: string;
//   falseLabel: string;
// }

// const defaultForm: IfElseFormData = {
//   name: "",
//   leftOperand: "",
//   operator: "equals",
//   rightOperand: "",
//   caseSensitive: false,
//   trueLabel: "True",
//   falseLabel: "False",
// };

// const operatorLabels: Record<Operator, string> = {
//   equals: "Equals",
//   not_equals: "Does Not Equal",
//   contains: "Contains",
//   not_contains: "Does Not Contain",
//   greater_than: "Greater Than",
//   less_than: "Less Than",
//   is_empty: "Is Empty",
//   is_not_empty: "Is Not Empty",
// };

// const IfElseNodeSettings: React.FC<IfElseNodeSettingsProps> = ({
//   selectedNode,
//   updateFormData,
// }) => {
//   const [formData, setFormData] = useState<IfElseFormData>(defaultForm);
//   const [saving, setSaving] = useState(false);

//   /* ---------------- LOAD CONFIG ---------------- */
//   useEffect(() => {
//     if (!selectedNode) return;

//     const nodeId = selectedNode.id;

//     try {
//       const local = localStorage.getItem(`node-config-${nodeId}`);
//       if (local) {
//         setFormData({ ...defaultForm, ...JSON.parse(local) });
//         return;
//       }

//       if (selectedNode.data?.config) {
//         setFormData({ ...defaultForm, ...selectedNode.data.config });
//         return;
//       }

//       if (selectedNode.data?.settings) {
//         setFormData({ ...defaultForm, ...selectedNode.data.settings });
//         return;
//       }

//       setFormData(defaultForm);
//     } catch (err) {
//       console.error("Error loading If/Else node config:", err);
//       setFormData(defaultForm);
//     }
//   }, [selectedNode]);

//   /* ---------------- HANDLE CHANGE ---------------- */
//   const handleChange = <K extends keyof IfElseFormData>(
//     key: K,
//     value: IfElseFormData[K]
//   ) => {
//     setFormData((prev) => ({ ...prev, [key]: value }));
//   };

//   /* ---------------- VALIDATION ---------------- */
//   const validationError = useMemo(() => {
//     if (!formData.leftOperand.trim()) return "Left operand is required";
//     if (!formData.trueLabel.trim()) return "True branch label is required";
//     if (!formData.falseLabel.trim()) return "False branch label is required";

//     if (
//       !["is_empty", "is_not_empty"].includes(formData.operator) &&
//       !formData.rightOperand.trim()
//     ) {
//       return "Comparison value is required";
//     }

//     return null;
//   }, [formData]);

//   /* ---------------- PREVIEW ---------------- */
//   const previewCondition = useMemo(() => {
//     const left = formData.leftOperand || "input.value";
//     const right = formData.rightOperand || "value";
//     const op = operatorLabels[formData.operator];

//     if (formData.operator === "is_empty" || formData.operator === "is_not_empty") {
//       return `${left} ${op}`;
//     }

//     return `${left} ${op} ${right}`;
//   }, [formData]);

//   /* ---------------- SAVE ---------------- */
//   const handleSave = async () => {
//     if (validationError) {
//       toast.error(validationError);
//       return;
//     }

//     try {
//       setSaving(true);

//       const cleanedData = {
//         ...formData,
//         name: formData.name.trim() || "Condition Check",
//       };

//       updateFormData(cleanedData);
//       toast.success("If / Else node configured successfully");
//     } catch (err) {
//       console.error("Failed to save If/Else node:", err);
//       toast.error("Failed to save If / Else configuration");
//     } finally {
//       setSaving(false);
//     }
//   };

//   return (
//     <div className="flex flex-col gap-5 w-full p-4">
//       {/* Header */}
//       <div className="rounded-xl border p-4 bg-zinc-50 dark:bg-zinc-900/40">
//         <div className="flex items-center gap-2 mb-2">
//           <GitBranch className="w-4 h-4 text-indigo-500" />
//           <h3 className="text-sm font-semibold">Conditional Branch Logic</h3>
//         </div>
//         <p className="text-xs text-muted-foreground leading-5">
//           Define how this workflow should branch based on incoming data.
//         </p>
//       </div>

//       {/* Node Name */}
//       <div className="grid gap-2">
//         <Label htmlFor="name">Condition Name</Label>
//         <Input
//           id="name"
//           placeholder="User Status Check"
//           value={formData.name}
//           onChange={(e) => handleChange("name", e.target.value)}
//         />
//       </div>

//       {/* Left Operand */}
//       <div className="grid gap-2">
//         <Label htmlFor="leftOperand">Variable / Field</Label>
//         <Input
//           id="leftOperand"
//           placeholder="e.g. user.status"
//           value={formData.leftOperand}
//           onChange={(e) => handleChange("leftOperand", e.target.value)}
//         />
//         <p className="text-xs text-muted-foreground">
//           Example: <code>user.status</code>, <code>response.code</code>, <code>agent.output</code>
//         </p>
//       </div>

//       {/* Operator */}
//       <div className="grid gap-2">
//         <Label>Operator</Label>
//         <Select
//           value={formData.operator}
//           onValueChange={(value) =>
//             handleChange("operator", value as Operator)
//           }
//         >
//           <SelectTrigger>
//             <SelectValue placeholder="Select operator" />
//           </SelectTrigger>
//           <SelectContent>
//             {Object.entries(operatorLabels).map(([value, label]) => (
//               <SelectItem key={value} value={value}>
//                 {label}
//               </SelectItem>
//             ))}
//           </SelectContent>
//         </Select>
//       </div>

//       {/* Right Operand */}
//       {!["is_empty", "is_not_empty"].includes(formData.operator) && (
//         <div className="grid gap-2">
//           <Label htmlFor="rightOperand">Comparison Value</Label>
//           <Input
//             id="rightOperand"
//             placeholder='e.g. active'
//             value={formData.rightOperand}
//             onChange={(e) => handleChange("rightOperand", e.target.value)}
//           />
//         </div>
//       )}

//       {/* Case Sensitive */}
//       <div className="flex items-center justify-between rounded-xl border p-4 bg-zinc-50 dark:bg-zinc-900/40">
//         <div>
//           <Label className="text-sm font-medium">Case Sensitive</Label>
//           <p className="text-xs text-muted-foreground mt-1">
//             Match text exactly including uppercase and lowercase letters.
//           </p>
//         </div>
//         <button
//           type="button"
//           onClick={() => handleChange("caseSensitive", !formData.caseSensitive)}
//           className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${formData.caseSensitive ? "bg-indigo-600" : "bg-zinc-300 dark:bg-zinc-700"
//             }`}
//         >
//           <span
//             className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${formData.caseSensitive ? "translate-x-6" : "translate-x-1"
//               }`}
//           />
//         </button>
//       </div>

//       {/* Branch Labels */}
//       <div className="grid grid-cols-2 gap-3">
//         <div className="grid gap-2">
//           <Label htmlFor="trueLabel">True Branch Label</Label>
//           <Input
//             id="trueLabel"
//             placeholder="True"
//             value={formData.trueLabel}
//             onChange={(e) => handleChange("trueLabel", e.target.value)}
//           />
//         </div>

//         <div className="grid gap-2">
//           <Label htmlFor="falseLabel">False Branch Label</Label>
//           <Input
//             id="falseLabel"
//             placeholder="False"
//             value={formData.falseLabel}
//             onChange={(e) => handleChange("falseLabel", e.target.value)}
//           />
//         </div>
//       </div>

//       {/* Preview */}
//       <div className="space-y-3 rounded-xl border p-4 bg-zinc-50 dark:bg-zinc-900/40">
//         <div className="flex items-center gap-2">
//           {validationError ? (
//             <AlertCircle className="w-4 h-4 text-red-500" />
//           ) : (
//             <CheckCircle2 className="w-4 h-4 text-emerald-500" />
//           )}
//           <Label className="text-sm font-semibold flex items-center gap-2">
//             <Eye className="w-4 h-4" />
//             Condition Preview
//           </Label>
//         </div>

//         <div className="rounded-lg bg-black text-white text-xs p-4 font-mono">
//           IF {previewCondition}
//           <br />
//           → {formData.trueLabel || "True"}
//           <br />
//           ELSE
//           <br />
//           → {formData.falseLabel || "False"}
//         </div>
//       </div>

//       {/* Save */}
//       <Button
//         className="w-full bg-indigo-600 hover:bg-indigo-500 text-white mt-2"
//         onClick={handleSave}
//         disabled={saving}
//       >
//         {saving ? "Saving..." : "Save If / Else Configuration"}
//       </Button>
//     </div>
//   );
// };

// export default IfElseNodeSettings;