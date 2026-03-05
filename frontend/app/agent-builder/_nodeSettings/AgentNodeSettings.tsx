import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

const AgentSettings = ({ selectedNode, updateFormData }: any) => {
  const [formData, setFormData] = useState({
    name: "",
    instruction: "",
    history: true, // Set as boolean for the Switch
    model: "gpt-5",
    output: "text",
    schema: "",
  });

  const handleChange = (key: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const onSave = () => {
    console.log(formData);
    updateFormData(formData);

    toast.success("Agent settings saved successfully!");

    // Wapis se form data ko reset karne ke liye
    // setFormData({
    //   name: "",
    //   instruction: "",
    //   history: true, // Set as boolean for the Switch
    //   model: "gpt-5",
    //   output: "text",
    //   schema: "",
    // });
  };

  return (
    <div className="flex flex-col gap-2.5 p-1 w-full max-w-[400px]">
      <div>
        <h2 className="text-lg font-bold">My Agent</h2>
        <p className="text-sm text-muted-foreground">
          Call the model with your instructions and tools
        </p>
      </div>

      <div className="space-y-4">
        {/* Name Input */}
        <div className="grid gap-2">
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            value = {formData?.name}
            placeholder="Agent Name"
            onChange={(e) => handleChange("name", e.target.value)}
          />
        </div>

        {/* Instructions Textarea */}
        <div className="grid gap-2">
          <Label htmlFor="instruction">Instructions</Label>
          <Textarea
            id="instruction"
            placeholder="Instruction"
            className="min-h-[80px]"
            value={formData?.instruction || ""}
            onChange={(e) => handleChange("instruction", e.target.value)}
          />
        </div>

        {/* Chat History Switch */}
        <div className="flex items-center justify-between">
          <Label htmlFor="history">Include chat history</Label>
          <Switch
            id="history"
            checked={formData?.history}
            onCheckedChange={(checked) => handleChange("history", checked)}
          />
        </div>

        {/* Model Selection */}
        <div className="flex items-center justify-between">
          <Label>Model</Label>
          <Select
            value={formData.model}
            onValueChange={(value) => handleChange("model", value)}
          >
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Select Model" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="gpt-5">gpt-5</SelectItem>
              <SelectItem value="gpt-4o">gpt-4o</SelectItem>
              <SelectItem value="gemini-pro">gemini-pro</SelectItem>
              <SelectItem value="claude-3">claude-3</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Output Format Tabs */}
        <div className="grid gap-2">
          <Label>Output Format</Label>
          <Tabs
            value={formData?.output}
            onValueChange={(value) => handleChange("output", value)}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="text">Text</TabsTrigger>
              <TabsTrigger value="json">JSON</TabsTrigger>
            </TabsList>
            <TabsContent value="text" className="mt-2">
              <p className="text-sm text-muted-foreground">
                Output will be plain text.
              </p>
            </TabsContent>
            <TabsContent value="json" className="mt-2">
              <Textarea
                placeholder='{ "title" : "string" }'
                value={formData.schema}
                onChange={(e) => handleChange("schema", e.target.value)}
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <Button
        className="w-full mt-4 bg-black text-white hover:bg-zinc-800"
        onClick={onSave}
      >
        Save
      </Button>
    </div>
  );
};

export default AgentSettings;
