"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { api } from "@/lib/api-client";
import { toast } from "sonner";
import { Activity, TrendingUp, Users, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface AgentUsageStats {
  agent_id: string;
  agent_name: string;
  total_calls_all_time: number;
  calls_this_month: number;
  unique_consumers_this_month: number;
  error_rate_this_month: number;
}

interface ConsumptionStats {
  agent_id: string;
  agent_name: string;
  owner_tenant_id: string;
  calls_this_month: number;
  monthly_limit: number;
  used_count: number;
  reset_at: string;
}

interface Consumer {
  tenant_id: string;
  tenant_name: string;
  total_calls: number;
  monthly_limit: number;
  used_count: number;
  reset_at: string | null;
}

export default function UsagePage() {
  const [myAgentsStats, setMyAgentsStats] = useState<AgentUsageStats[]>([]);
  const [consumptionStats, setConsumptionStats] = useState<ConsumptionStats[]>([]);
  const [consumers, setConsumers] = useState<Consumer[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingConsumers, setLoadingConsumers] = useState(false);
  const [quotaDialogOpen, setQuotaDialogOpen] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [quotaForm, setQuotaForm] = useState({
    consumer_tenant_id: "",
    monthly_limit: 1000
  });

  useEffect(() => {
    loadUsageData();
  }, []);

  const loadUsageData = async () => {
    setLoading(true);
    try {
      const [agentsData, consumptionData] = await Promise.all([
        api.get("/usage/my-agents", { requireAuth: true }),
        api.get("/usage/my-consumption", { requireAuth: true })
      ]);
      setMyAgentsStats(agentsData);
      setConsumptionStats(consumptionData);
    } catch (error: any) {
      toast.error("Failed to load usage data");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const loadConsumers = async (agentId: string) => {
    setLoadingConsumers(true);
    try {
      const data = await api.get(`/usage/agents/${agentId}/consumers`, { requireAuth: true });
      setConsumers(data);
      
      // Pre-select first consumer if available
      if (data.length > 0) {
        setQuotaForm({
          consumer_tenant_id: data[0].tenant_id,
          monthly_limit: data[0].monthly_limit
        });
      }
    } catch (error: any) {
      console.error("Failed to load consumers:", error);
      setConsumers([]);
    } finally {
      setLoadingConsumers(false);
    }
  };

  const openQuotaDialog = (agentId: string) => {
    setSelectedAgent(agentId);
    setQuotaDialogOpen(true);
    loadConsumers(agentId);
  };

  const updateQuota = async () => {
    if (!selectedAgent || !quotaForm.consumer_tenant_id) {
      toast.error("Please select a consumer tenant");
      return;
    }

    try {
      await api.put(`/usage/quotas/${selectedAgent}`, quotaForm, { requireAuth: true });
      toast.success("Quota updated successfully");
      setQuotaDialogOpen(false);
      setQuotaForm({ consumer_tenant_id: "", monthly_limit: 1000 });
      setSelectedAgent(null);
      setConsumers([]);
      loadUsageData();
    } catch (error: any) {
      toast.error("Failed to update quota");
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getUsagePercentage = (used: number, limit: number) => {
    if (limit === -1) return 0;
    return Math.round((used / limit) * 100);
  };

  const getUsageBadge = (percentage: number) => {
    if (percentage >= 100) return <Badge variant="destructive">Exceeded</Badge>;
    if (percentage >= 80) return <Badge className="bg-orange-500">Warning</Badge>;
    return <Badge variant="secondary">Normal</Badge>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">API Usage & Quotas</h1>
          <p className="text-muted-foreground mt-1">
            Monitor API usage and manage quotas for your agents
          </p>
        </div>
      </div>

      <Tabs defaultValue="my-agents" className="space-y-4">
        <TabsList>
          <TabsTrigger value="my-agents" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            My Agents Usage
          </TabsTrigger>
          <TabsTrigger value="consumption" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            My Consumption
          </TabsTrigger>
        </TabsList>

        {/* My Agents Tab - Owner Perspective */}
        <TabsContent value="my-agents" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Agents</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{myAgentsStats.length}</div>
                <p className="text-xs text-muted-foreground">Public API-enabled agents</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Calls</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {myAgentsStats.reduce((sum, stat) => sum + stat.total_calls_all_time, 0)}
                </div>
                <p className="text-xs text-muted-foreground">All time</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">This Month</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {myAgentsStats.reduce((sum, stat) => sum + stat.calls_this_month, 0)}
                </div>
                <p className="text-xs text-muted-foreground">API calls</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Agent Usage Statistics</CardTitle>
              <CardDescription>
                See how consumers are using your public agents
              </CardDescription>
            </CardHeader>
            <CardContent>
              {myAgentsStats.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No public API-enabled agents found</p>
                  <p className="text-sm mt-2">Create an agent and enable API access to see usage stats</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Agent Name</TableHead>
                      <TableHead className="text-right">All Time</TableHead>
                      <TableHead className="text-right">This Month</TableHead>
                      <TableHead className="text-right">Unique Consumers</TableHead>
                      <TableHead className="text-right">Error Rate</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {myAgentsStats.map((stat) => (
                      <TableRow key={stat.agent_id}>
                        <TableCell className="font-medium">{stat.agent_name}</TableCell>
                        <TableCell className="text-right">{stat.total_calls_all_time}</TableCell>
                        <TableCell className="text-right">{stat.calls_this_month}</TableCell>
                        <TableCell className="text-right">{stat.unique_consumers_this_month}</TableCell>
                        <TableCell className="text-right">
                          <Badge variant={stat.error_rate_this_month > 10 ? "destructive" : "secondary"}>
                            {stat.error_rate_this_month.toFixed(1)}%
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openQuotaDialog(stat.agent_id)}
                          >
                            Set Quota
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Consumption Tab - Consumer Perspective */}
        <TabsContent value="consumption" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Agents Used</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{consumptionStats.length}</div>
                <p className="text-xs text-muted-foreground">External agents accessed</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Calls</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {consumptionStats.reduce((sum, stat) => sum + stat.calls_this_month, 0)}
                </div>
                <p className="text-xs text-muted-foreground">This month</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Quotas Status</CardTitle>
                <AlertCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {consumptionStats.filter(s => s.monthly_limit !== -1 && getUsagePercentage(s.used_count, s.monthly_limit) >= 80).length}
                </div>
                <p className="text-xs text-muted-foreground">At risk (≥80%)</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>My API Consumption</CardTitle>
              <CardDescription>
                Track your usage of external agents and quota limits
              </CardDescription>
            </CardHeader>
            <CardContent>
              {consumptionStats.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No API consumption yet</p>
                  <p className="text-sm mt-2">Start using public agents via API to see consumption stats</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Agent Name</TableHead>
                      <TableHead className="text-right">Calls This Month</TableHead>
                      <TableHead className="text-right">Quota Limit</TableHead>
                      <TableHead className="text-right">Usage</TableHead>
                      <TableHead className="text-right">Status</TableHead>
                      <TableHead className="text-right">Resets On</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {consumptionStats.map((stat) => {
                      const percentage = getUsagePercentage(stat.used_count, stat.monthly_limit);
                      return (
                        <TableRow key={stat.agent_id}>
                          <TableCell className="font-medium">{stat.agent_name}</TableCell>
                          <TableCell className="text-right">{stat.calls_this_month}</TableCell>
                          <TableCell className="text-right">
                            {stat.monthly_limit === -1 ? "Unlimited" : stat.monthly_limit}
                          </TableCell>
                          <TableCell className="text-right">
                            {stat.monthly_limit === -1 ? (
                              <span className="text-muted-foreground">N/A</span>
                            ) : (
                              <span className={percentage >= 80 ? "text-orange-500 font-semibold" : ""}>
                                {stat.used_count} / {stat.monthly_limit}
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            {stat.monthly_limit === -1 ? (
                              <Badge variant="secondary">Unlimited</Badge>
                            ) : (
                              getUsageBadge(percentage)
                            )}
                          </TableCell>
                          <TableCell className="text-right text-sm text-muted-foreground">
                            {formatDate(stat.reset_at)}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Set Quota Dialog */}
      <Dialog open={quotaDialogOpen} onOpenChange={setQuotaDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Set Usage Quota</DialogTitle>
            <DialogDescription>
              Set monthly API call limits for a consumer tenant
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {loadingConsumers ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : consumers.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="font-medium">No consumers yet</p>
                <p className="text-sm mt-2">This agent hasn't been called via API by any tenant yet.</p>
                <p className="text-sm mt-2">Consumers will appear here after their first API call.</p>
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="consumer_tenant">Consumer Tenant</Label>
                  <select
                    id="consumer_tenant"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    value={quotaForm.consumer_tenant_id}
                    onChange={(e) => {
                      const selectedConsumer = consumers.find(c => c.tenant_id === e.target.value);
                      setQuotaForm({
                        consumer_tenant_id: e.target.value,
                        monthly_limit: selectedConsumer?.monthly_limit || 1000
                      });
                    }}
                  >
                    {consumers.map((consumer) => (
                      <option key={consumer.tenant_id} value={consumer.tenant_id}>
                        {consumer.tenant_name} ({consumer.total_calls} calls, limit: {consumer.monthly_limit === -1 ? 'Unlimited' : consumer.monthly_limit})
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-muted-foreground">
                    Select the tenant to set quota limits for
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="monthly_limit">Monthly Limit</Label>
                  <Input
                    id="monthly_limit"
                    type="number"
                    placeholder="1000"
                    value={quotaForm.monthly_limit}
                    onChange={(e) => setQuotaForm({ ...quotaForm, monthly_limit: parseInt(e.target.value) || 0 })}
                  />
                  <p className="text-xs text-muted-foreground">
                    Set to -1 for unlimited access
                  </p>
                </div>
              </>
            )}
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => {
              setQuotaDialogOpen(false);
              setConsumers([]);
            }}>
              Cancel
            </Button>
            <Button onClick={updateQuota} disabled={consumers.length === 0}>
              Update Quota
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
