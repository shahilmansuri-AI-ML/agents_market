"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function AgentRegisterPage() {
  const router = useRouter();

  const [formData, setFormData] = useState({
    id: "",
    tenant_id: "",
    name: "",
    status: "active",
    tags: [] as string[],
  });

  const [tagInput, setTagInput] = useState("");

  // update form values on typing
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Add tag
  const addTag = () => {
    if (!tagInput.trim()) return;
    if (formData.tags.includes(tagInput)) return;

    setFormData((prev) => ({
      ...prev,
      tags: [...prev.tags, tagInput],
    }));

    setTagInput("");
  };

  // Remove tag
  const removeTag = (tag: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((t) => t !== tag),
    }));
  };

  // submit form
  const handleSubmit = async () => {
    const payload = {
      id: formData.id,
      tenant_id: formData.tenant_id,
      name: formData.name,
      status: formData.status,
      tags: formData.tags,
    };

    // call api
    const res = await fetch("http://127.0.0.1:8000/agents/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (!res.ok) {
      alert(JSON.stringify(data));
      return;
    }
    // redirect to agent builder page
    toast.success("Agent created successfully!");
    
    router.push(`/agent-builder/${data.agent.id}`);
  };

  return (
    <div className="max-w-lg mx-auto mt-16 space-y-6">
      <h1 className="text-2xl font-bold ">Register Your AI Agent</h1>

      <div className="space-y-5">
        <div>
          <Label>Agent ID</Label>
          <Input name="id" value={formData.id} onChange={handleChange} />
        </div>

        <div>
          <Label>Agent Name</Label>
          <Input name="name" value={formData.name} onChange={handleChange} />
        </div>

        <div>
          <Label>Tenant ID</Label>
          <Input
            name="tenant_id"
            value={formData.tenant_id}
            onChange={handleChange}
          />
        </div>

        <div>
          <Label>Status</Label>
          <Input
            name="status"
            value={formData.status}
            onChange={handleChange}
          />
        </div>

        {/* TAGS */}
        <div>
          <Label>Tags</Label>

          <div className="flex gap-2 mt-1">
            <Input
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              placeholder="Enter tag"
            />
            <Button type="button" onClick={addTag}>
              Add
            </Button>
          </div>

          {/* Tag Chips */}
          <div className="flex flex-wrap gap-2 mt-2">
            {formData.tags.map((tag) => (
              <span
                key={tag}
                className="px-3 py-1 text-sm bg-gray-200 rounded-full cursor-pointer"
                onClick={() => removeTag(tag)}
              >
                {tag} ✕
              </span>
            ))}
          </div>
        </div>

        <Button className="w-full" onClick={handleSubmit}>
          Create Agent
        </Button>
      </div>
    </div>
  );
}