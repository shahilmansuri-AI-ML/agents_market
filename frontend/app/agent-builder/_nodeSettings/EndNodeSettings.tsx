import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { TabsContent } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { tr } from "date-fns/locale";
import { Toast } from "radix-ui";
import React, { useEffect, useState } from "react";
import { toast } from "sonner";

export const EndSettings = ({selectedNode, updateFormData} : any) => {

  const [formData, setFormData] = useState({schema : ''})

  useEffect(()=>{
    selectedNode && setFormData(selectedNode?.data.settings)
  },[selectedNode])


  return (
    <div>
      <div>
        <h2 className="text-lg font-bold">End</h2>
        <p className="text-sm text-muted-foreground">
          Choose the workflow output
        </p>
      </div>

      <div className="mt-2 space-y-5">
        <Label>Output</Label>
        <Textarea placeholder="{name : string}"
        onChange={(e) => {setFormData({schema : e.target.value})}}
        value={formData?.schema}
        required = {true}
        />
      </div>

      <Button className="w-full mt-5" onClick={() => {updateFormData(formData); toast.success("End node settings saved successfully!")}}> Save </Button>      

      
    </div>
  );
};
