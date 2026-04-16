"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api-client";
import { toast } from "sonner";
import { Lock, Eye, EyeOff, CheckCircle2, XCircle, Loader2 } from "lucide-react";

export default function SecurityPage() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [saving, setSaving] = useState(false);

  const passwordRequirements = [
    { label: "At least 8 characters", met: newPassword.length >= 8 },
    { label: "Contains uppercase letter", met: /[A-Z]/.test(newPassword) },
    { label: "Contains lowercase letter", met: /[a-z]/.test(newPassword) },
    { label: "Contains number", met: /[0-9]/.test(newPassword) },
    { label: "Contains special character", met: /[!@#$%^&*(),.?":{}|<>]/.test(newPassword) },
  ];

  const allRequirementsMet = passwordRequirements.every(req => req.met);
  const passwordsMatch = newPassword === confirmPassword && newPassword.length > 0;

  const handleChangePassword = async () => {
    if (!currentPassword) {
      toast.error("Please enter your current password");
      return;
    }

    if (!allRequirementsMet) {
      toast.error("Please meet all password requirements");
      return;
    }

    if (!passwordsMatch) {
      toast.error("New passwords do not match");
      return;
    }

    setSaving(true);
    try {
      await api.post("/profile/change-password", {
        current_password: currentPassword,
        new_password: newPassword,
      }, { requireAuth: true });

      toast.success("Password changed successfully");
      
      // Clear form
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      const errorMessage = error?.response?.data?.detail || "Failed to change password";
      toast.error(errorMessage);
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col py-10 px-6 max-w-6xl mx-auto transition-colors duration-300">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-[var(--text-primary)]">Security Settings</h1>
        <p className="text-[var(--text-secondary)] mt-2">Manage your password and security preferences</p>
      </div>

      <div className="space-y-6">
      {/* Change Password */}
      <Card className="bg-[var(--surface)] border-[var(--border)] hover:border-[var(--border-hover)] transition-all duration-300">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-[var(--text-primary)]">
            <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950">
              <Lock className="h-5 w-5 text-indigo-500" />
            </div>
            Change Password
          </CardTitle>
          <CardDescription className="text-[var(--text-secondary)]">
            Update your password to keep your account secure
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="currentPassword">Current Password</Label>
            <div className="relative">
              <Input
                id="currentPassword"
                type={showCurrentPassword ? "text" : "password"}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current password"
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-700"
              >
                {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="newPassword">New Password</Label>
            <div className="relative">
              <Input
                id="newPassword"
                type={showNewPassword ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-700"
              >
                {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm New Password</Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-700"
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {confirmPassword && (
              <p className={`text-xs flex items-center gap-1 ${passwordsMatch ? "text-green-600" : "text-red-600"}`}>
                {passwordsMatch ? (
                  <>
                    <CheckCircle2 className="h-3 w-3" />
                    Passwords match
                  </>
                ) : (
                  <>
                    <XCircle className="h-3 w-3" />
                    Passwords do not match
                  </>
                )}
              </p>
            )}
          </div>

          {/* Password Requirements */}
          {newPassword && (
            <div className="space-y-2 p-4 bg-zinc-50 dark:bg-zinc-900 rounded-lg">
              <p className="text-sm font-medium">Password Requirements:</p>
              <div className="space-y-1">
                {passwordRequirements.map((req, index) => (
                  <div key={index} className="flex items-center gap-2 text-xs">
                    {req.met ? (
                      <CheckCircle2 className="h-3 w-3 text-green-600" />
                    ) : (
                      <XCircle className="h-3 w-3 text-zinc-400" />
                    )}
                    <span className={req.met ? "text-green-600" : "text-zinc-500"}>
                      {req.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-end pt-4">
            <Button
              onClick={handleChangePassword}
              disabled={saving || !currentPassword || !allRequirementsMet || !passwordsMatch}
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Changing Password...
                </>
              ) : (
                "Change Password"
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Security Tips */}
      <Card className="bg-[var(--surface)] border-[var(--border)] hover:border-[var(--border-hover)] transition-all duration-300">
        <CardHeader className="pb-4">
          <CardTitle className="text-[var(--text-primary)]">Security Tips</CardTitle>
          <CardDescription className="text-[var(--text-secondary)]">
            Best practices to keep your account secure
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5" />
              <span className="text-[var(--text-primary)]">Use a unique password that you don't use for other accounts</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5" />
              <span className="text-[var(--text-primary)]">Change your password regularly (every 3-6 months)</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5" />
              <span className="text-[var(--text-primary)]">Never share your password with anyone</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5" />
              <span className="text-[var(--text-primary)]">Use a password manager to generate and store strong passwords</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5" />
              <span className="text-[var(--text-primary)]">Enable two-factor authentication when available (coming soon)</span>
            </li>
          </ul>
        </CardContent>
      </Card>
      </div>
    </div>
  );
}
