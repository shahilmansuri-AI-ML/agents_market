"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, Trash2, Globe, Shield, Clock3, FileJson } from "lucide-react";

interface ApiNodeSettingsProps {
  selectedNode: any;
  updateFormData: (data: any) => void;
}

type KeyValue = {
  key: string;
  value: string;
};

type AuthType = "none" | "bearer" | "apiKey";

interface ApiFormData {
  name: string;
  endpoint: string;
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  headers: KeyValue[];
  queryParams: KeyValue[];
  body: string;
  authType: AuthType;
  authValue: string;
  timeout: string;
}

const defaultForm: ApiFormData = {
  name: "",
  endpoint: "",
  method: "GET",
  headers: [{ key: "", value: "" }],
  queryParams: [{ key: "", value: "" }],
  body: "",
  authType: "none",
  authValue: "",
  timeout: "30",
};

const ApiNodeSettings: React.FC<ApiNodeSettingsProps> = ({
  selectedNode,
  updateFormData,
}) => {
  const [formData, setFormData] = useState<ApiFormData>(defaultForm);
  const [saving, setSaving] = useState(false);

  /* ---------------- LOAD CONFIG ---------------- */
  useEffect(() => {
    if (!selectedNode) return;

    const nodeId = selectedNode.id;

    try {
      const local = localStorage.getItem(`node-config-${nodeId}`);
      if (local) {
        setFormData({ ...defaultForm, ...JSON.parse(local) });
        return;
      }

      if (selectedNode.data?.config) {
        setFormData({ ...defaultForm, ...selectedNode.data.config });
        return;
      }

      if (selectedNode.data?.settings) {
        setFormData({ ...defaultForm, ...selectedNode.data.settings });
        return;
      }

      setFormData(defaultForm);
    } catch (err) {
      console.error("Error loading API node config:", err);
      setFormData(defaultForm);
    }
  }, [selectedNode]);

  /* ---------------- HELPERS ---------------- */
  const handleChange = <K extends keyof ApiFormData>(
    key: K,
    value: ApiFormData[K]
  ) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const updateKeyValue = (
    field: "headers" | "queryParams",
    index: number,
    subKey: "key" | "value",
    value: string
  ) => {
    setFormData((prev) => {
      const updated = [...prev[field]];
      updated[index] = { ...updated[index], [subKey]: value };
      return { ...prev, [field]: updated };
    });
  };

  const addKeyValue = (field: "headers" | "queryParams") => {
    setFormData((prev) => ({
      ...prev,
      [field]: [...prev[field], { key: "", value: "" }],
    }));
  };

  const removeKeyValue = (field: "headers" | "queryParams", index: number) => {
    setFormData((prev) => ({
      ...prev,
      [field]:
        prev[field].length > 1
          ? prev[field].filter((_, i) => i !== index)
          : [{ key: "", value: "" }],
    }));
  };

  /* ---------------- VALIDATION ---------------- */
  const validationError = useMemo(() => {
    if (!formData.endpoint.trim()) return "Endpoint URL is required";

    try {
      new URL(formData.endpoint);
    } catch {
      return "Please enter a valid URL";
    }

    if (!formData.timeout || Number(formData.timeout) <= 0) {
      return "Timeout must be greater than 0";
    }

    if (formData.authType !== "none" && !formData.authValue.trim()) {
      return "Authentication value is required";
    }

    if (
      ["POST", "PUT", "PATCH"].includes(formData.method) &&
      formData.body.trim()
    ) {
      try {
        JSON.parse(formData.body);
      } catch {
        return "Request body must be valid JSON";
      }
    }

    return null;
  }, [formData]);

  /* ---------------- SAVE ---------------- */
  const handleSave = async () => {
    if (validationError) {
      toast.error(validationError);
      return;
    }

    try {
      setSaving(true);

      const cleanedData = {
        ...formData,
        headers: formData.headers.filter((h) => h.key.trim() || h.value.trim()),
        queryParams: formData.queryParams.filter(
          (q) => q.key.trim() || q.value.trim()
        ),
      };

      updateFormData(cleanedData);
      toast.success("API node configured successfully");
    } catch (err) {
      console.error("Failed to save API node:", err);
      toast.error("Failed to save API configuration");
    } finally {
      setSaving(false);
    }
  };

  /* ---------------- SECTION RENDERER ---------------- */
  const renderKeyValueSection = (
    title: string,
    field: "headers" | "queryParams"
  ) => (
    <div className="space-y-3 rounded-xl border p-4 bg-zinc-50 dark:bg-zinc-900/40">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-semibold">{title}</Label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => addKeyValue(field)}
          className="h-8 px-3"
        >
          <Plus className="w-4 h-4 mr-1" />
          Add
        </Button>
      </div>

      <div className="space-y-2">
        {formData[field].map((item, index) => (
          <div key={index} className="grid grid-cols-[1fr_1fr_auto] gap-2">
            <Input
              placeholder="Key"
              value={item.key}
              onChange={(e) =>
                updateKeyValue(field, index, "key", e.target.value)
              }
            />
            <Input
              placeholder="Value"
              value={item.value}
              onChange={(e) =>
                updateKeyValue(field, index, "value", e.target.value)
              }
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => removeKeyValue(field, index)}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );

  /* ---------------- UI ---------------- */
  return (
    <div className="flex flex-col gap-5 w-full p-4">
      {/* Name */}
      <div className="grid gap-2">
        <Label htmlFor="name">Node Name</Label>
        <Input
          id="name"
          placeholder="API Request Node"
          value={formData.name}
          onChange={(e) => handleChange("name", e.target.value)}
        />
      </div>

      {/* Method + Endpoint */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="grid gap-2">
          <Label>Method</Label>
          <Select
            value={formData.method}
            onValueChange={(value) =>
              handleChange("method", value as ApiFormData["method"])
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select method" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="GET">GET</SelectItem>
              <SelectItem value="POST">POST</SelectItem>
              <SelectItem value="PUT">PUT</SelectItem>
              <SelectItem value="PATCH">PATCH</SelectItem>
              <SelectItem value="DELETE">DELETE</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-2 md:col-span-2">
          <Label htmlFor="endpoint" className="flex items-center gap-2">
            <Globe className="w-4 h-4" />
            Endpoint URL
          </Label>
          <Input
            id="endpoint"
            placeholder="https://api.example.com/data"
            value={formData.endpoint}
            onChange={(e) => handleChange("endpoint", e.target.value)}
          />
        </div>
      </div>

      {/* Auth */}
      <div className="space-y-3 rounded-xl border p-4 bg-zinc-50 dark:bg-zinc-900/40">
        <Label className="text-sm font-semibold flex items-center gap-2">
          <Shield className="w-4 h-4" />
          Authentication
        </Label>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Select
            value={formData.authType}
            onValueChange={(value) =>
              handleChange("authType", value as AuthType)
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select auth type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None</SelectItem>
              <SelectItem value="bearer">Bearer Token</SelectItem>
              <SelectItem value="apiKey">API Key</SelectItem>
            </SelectContent>
          </Select>

          {formData.authType !== "none" && (
            <Input
              placeholder={
                formData.authType === "bearer"
                  ? "Enter bearer token"
                  : "Enter API key"
              }
              value={formData.authValue}
              onChange={(e) => handleChange("authValue", e.target.value)}
            />
          )}
        </div>
      </div>

      {/* Query Params */}
      {renderKeyValueSection("Query Parameters", "queryParams")}

      {/* Headers */}
      {renderKeyValueSection("Headers", "headers")}

      {/* Body */}
      {["POST", "PUT", "PATCH"].includes(formData.method) && (
        <div className="space-y-3 rounded-xl border p-4 bg-zinc-50 dark:bg-zinc-900/40">
          <Label className="text-sm font-semibold flex items-center gap-2">
            <FileJson className="w-4 h-4" />
            Request Body (JSON)
          </Label>
          <Textarea
            className="min-h-[140px] font-mono text-sm"
            placeholder={`{\n  "key": "value"\n}`}
            value={formData.body}
            onChange={(e) => handleChange("body", e.target.value)}
          />
        </div>
      )}

      {/* Timeout */}
      <div className="grid gap-2">
        <Label htmlFor="timeout" className="flex items-center gap-2">
          <Clock3 className="w-4 h-4" />
          Timeout (seconds)
        </Label>
        <Input
          id="timeout"
          type="number"
          min="1"
          placeholder="30"
          value={formData.timeout}
          onChange={(e) => handleChange("timeout", e.target.value)}
        />
      </div>

      {/* Save */}
      <Button
        className="w-full bg-emerald-600 hover:bg-emerald-500 text-white mt-2"
        onClick={handleSave}
        disabled={saving}
      >
        {saving ? "Saving..." : "Save API Configuration"}
      </Button>
    </div>
  );
};

export default ApiNodeSettings;