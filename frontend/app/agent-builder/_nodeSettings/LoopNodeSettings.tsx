"use client";

import React, { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

interface LoopNodeSettingsProps {
  selectedNode: any;
  updateFormData: (data: any) => void;
}

const defaultForm = {
  loopCount: "",
  iteratorName: "",
};

export const LoopNodeSettings: React.FC<LoopNodeSettingsProps> = ({
  selectedNode,
  updateFormData,
}) => {
  const [formData, setFormData] = useState(defaultForm);

  useEffect(() => {
    if (selectedNode?.data?.settings) {
      setFormData({ ...defaultForm, ...selectedNode.data.settings });
    } else {
      setFormData(defaultForm);
    }
  }, [selectedNode]);

  const handleChange = (key: keyof typeof defaultForm, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const parsedLoopCount = Number(formData.loopCount);

  const errors = useMemo(() => {
    const newErrors: { loopCount?: string; iteratorName?: string } = {};

    if (!formData.loopCount.trim()) {
      newErrors.loopCount = "Iteration count is required.";
    } else if (
      !Number.isInteger(parsedLoopCount) ||
      parsedLoopCount <= 0
    ) {
      newErrors.loopCount = "Please enter a positive whole number.";
    }

    if (
      formData.iteratorName &&
      !/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(formData.iteratorName)
    ) {
      newErrors.iteratorName =
        "Use a valid variable name (e.g. item, index, row).";
    }

    return newErrors;
  }, [formData.loopCount, formData.iteratorName, parsedLoopCount]);

  const isValid = Object.keys(errors).length === 0;

  const handleSave = () => {
    if (!isValid) {
      if (errors.loopCount) toast.error(errors.loopCount);
      else if (errors.iteratorName) toast.error(errors.iteratorName);
      return;
    }

    updateFormData({
      ...formData,
      loopCount: String(parsedLoopCount),
      iteratorName: formData.iteratorName.trim(),
    });

    toast.success("Loop node settings saved");
  };

  return (
    <div className="w-full max-w-md rounded-2xl border border-border/60 bg-background/95 p-4 shadow-sm">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-foreground">
          Loop Configuration
        </h3>
        <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
          Define how many times this node should repeat and optionally assign
          a variable name for each iteration.
        </p>
      </div>

      <div className="space-y-4">
        {/* Iteration Count */}
        <div className="space-y-1.5">
          <Label htmlFor="loopCount" className="text-xs font-medium">
            Iterations <span className="text-destructive">*</span>
          </Label>
          <Input
            id="loopCount"
            type="number"
            min={1}
            step={1}
            placeholder="e.g. 10"
            value={formData.loopCount}
            onChange={(e) => handleChange("loopCount", e.target.value)}
            className={`h-9 text-sm ${errors.loopCount
                ? "border-destructive focus-visible:ring-destructive/30"
                : ""
              }`}
          />
          <p className="text-[11px] text-muted-foreground">
            Number of times this loop should execute.
          </p>
          {errors.loopCount && (
            <p className="text-[11px] text-destructive">{errors.loopCount}</p>
          )}
        </div>

        {/* Iterator Name */}
        <div className="space-y-1.5">
          <Label htmlFor="iteratorName" className="text-xs font-medium">
            Iterator Variable
          </Label>
          <Input
            id="iteratorName"
            placeholder="e.g. item"
            value={formData.iteratorName}
            onChange={(e) => handleChange("iteratorName", e.target.value)}
            className={`h-9 text-sm ${errors.iteratorName
                ? "border-destructive focus-visible:ring-destructive/30"
                : ""
              }`}
          />
          <p className="text-[11px] text-muted-foreground">
            Optional variable name available inside the loop.
          </p>
          {errors.iteratorName && (
            <p className="text-[11px] text-destructive">
              {errors.iteratorName}
            </p>
          )}
        </div>

        {/* Save Button */}
        <Button
          onClick={handleSave}
          disabled={!isValid}
          className="mt-2 h-9 w-full rounded-lg bg-amber-600 text-sm font-medium text-white shadow-sm transition-all hover:bg-amber-500 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Save Settings
        </Button>
      </div>
    </div>
  );
};

export default LoopNodeSettings;