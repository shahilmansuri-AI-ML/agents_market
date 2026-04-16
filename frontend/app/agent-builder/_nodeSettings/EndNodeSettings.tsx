"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectTrigger,
    SelectValue,
    SelectContent,
    SelectItem,
} from "@/components/ui/select";
import { toast } from "sonner";
import { FileJson, CheckCircle2, AlertCircle, Sparkles } from "lucide-react";

interface EndSettingsProps {
    selectedNode: any;
    updateFormData: (data: any) => void;
}

type OutputFormat = "json" | "text" | "markdown";

interface EndFormData {
    name: string;
    outputFormat: OutputFormat;
    schema: string;
    responseKey: string;
}

const defaultForm: EndFormData = {
    name: "",
    outputFormat: "json",
    schema: '{\n  "result": "string"\n}',
    responseKey: "result",
};

const EndSettings: React.FC<EndSettingsProps> = ({
    selectedNode,
    updateFormData,
}) => {
    const [formData, setFormData] = useState<EndFormData>(defaultForm);
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
            console.error("Error loading End node config:", err);
            setFormData(defaultForm);
        }
    }, [selectedNode]);

    /* ---------------- HANDLE CHANGE ---------------- */
    const handleChange = <K extends keyof EndFormData>(
        key: K,
        value: EndFormData[K]
    ) => {
        setFormData((prev) => ({ ...prev, [key]: value }));
    };

    /* ---------------- VALIDATION ---------------- */
    const validationError = useMemo(() => {
        if (!formData.name.trim()) return "Output name is required";
        if (!formData.responseKey.trim()) return "Response key is required";

        if (formData.outputFormat === "json") {
            try {
                JSON.parse(formData.schema);
            } catch {
                return "Schema must be valid JSON";
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
            updateFormData(formData);
            toast.success("End node configured successfully");
        } catch (err) {
            console.error("Failed to save End node:", err);
            toast.error("Failed to save End node configuration");
        } finally {
            setSaving(false);
        }
    };

    /* ---------------- PREVIEW ---------------- */
    const previewOutput = useMemo(() => {
        if (formData.outputFormat === "json") {
            try {
                return JSON.stringify(JSON.parse(formData.schema), null, 2);
            } catch {
                return formData.schema;
            }
        }

        if (formData.outputFormat === "markdown") {
            return `# ${formData.name}\n\n{{${formData.responseKey}}}`;
        }

        return `{{${formData.responseKey}}}`;
    }, [formData]);

    return (
        <div className="flex flex-col gap-5 w-full p-4">
            {/* Header */}
            <div className="rounded-xl border p-4 bg-zinc-50 dark:bg-zinc-900/40">
                <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="w-4 h-4 text-emerald-500" />
                    <h3 className="text-sm font-semibold">Workflow Output Configuration</h3>
                </div>
                <p className="text-xs text-muted-foreground leading-5">
                    Define what this workflow should return when execution finishes.
                </p>
            </div>

            {/* Output Name */}
            <div className="grid gap-2">
                <Label htmlFor="name">Output Name</Label>
                <Input
                    id="name"
                    placeholder="Final Workflow Output"
                    value={formData.name}
                    onChange={(e) => handleChange("name", e.target.value)}
                />
            </div>

            {/* Output Format */}
            <div className="grid gap-2">
                <Label>Output Format</Label>
                <Select
                    value={formData.outputFormat}
                    onValueChange={(value) =>
                        handleChange("outputFormat", value as OutputFormat)
                    }
                >
                    <SelectTrigger>
                        <SelectValue placeholder="Select output format" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="json">JSON</SelectItem>
                        <SelectItem value="text">Plain Text</SelectItem>
                        <SelectItem value="markdown">Markdown</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Response Key */}
            <div className="grid gap-2">
                <Label htmlFor="responseKey">Response Key</Label>
                <Input
                    id="responseKey"
                    placeholder="result"
                    value={formData.responseKey}
                    onChange={(e) => handleChange("responseKey", e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                    This is the final variable returned by the workflow.
                </p>
            </div>

            {/* Schema */}
            <div className="space-y-3 rounded-xl border p-4 bg-zinc-50 dark:bg-zinc-900/40">
                <Label className="text-sm font-semibold flex items-center gap-2">
                    <FileJson className="w-4 h-4" />
                    Output Schema / Template
                </Label>

                <Textarea
                    className="min-h-[180px] font-mono text-sm"
                    placeholder={
                        formData.outputFormat === "json"
                            ? '{\n  "result": "string"\n}'
                            : "{{result}}"
                    }
                    value={formData.schema}
                    onChange={(e) => handleChange("schema", e.target.value)}
                />

                {formData.outputFormat === "json" && (
                    <p className="text-xs text-muted-foreground">
                        Define the final structured output of this workflow in valid JSON.
                    </p>
                )}
            </div>

            {/* Preview */}
            <div className="space-y-3 rounded-xl border p-4 bg-zinc-50 dark:bg-zinc-900/40">
                <div className="flex items-center gap-2">
                    {validationError ? (
                        <AlertCircle className="w-4 h-4 text-red-500" />
                    ) : (
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    )}
                    <Label className="text-sm font-semibold">Output Preview</Label>
                </div>

                <pre className="rounded-lg bg-black text-white text-xs p-4 overflow-auto whitespace-pre-wrap">
                    {previewOutput}
                </pre>
            </div>

            {/* Save */}
            <Button
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white mt-2"
                onClick={handleSave}
                disabled={saving}
            >
                {saving ? "Saving..." : "Save End Configuration"}
            </Button>
        </div>
    );
};

export default EndSettings;