"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api-client";
import { toast } from "sonner";
import { User, Building2, Briefcase, Globe, Users, Loader2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface ProfileData {
  user_id: string;
  email: string;
  full_name: string | null;
  job_title: string | null;
  profile_picture_url: string | null;
  tenant_id: string;
  tenant_name: string;
  company_size: string | null;
  website: string | null;
  created_at: string;
  last_login: string | null;
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [userRole, setUserRole] = useState<string>("");
  const [canEditCompany, setCanEditCompany] = useState(false);

  const [fullName, setFullName] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [companySize, setCompanySize] = useState("");
  const [website, setWebsite] = useState("");

  useEffect(() => {
    // Check if user is super admin
    const superAdminEmail = typeof window !== 'undefined' ? localStorage.getItem('super_admin_email') : null;
    setIsSuperAdmin(!!superAdminEmail);
    
    // Get user role from localStorage
    const roleName = typeof window !== 'undefined' ? localStorage.getItem('user_role_name') : null;
    setUserRole(roleName || "");
    
    // Check if user can edit company info (Owner or Admin only)
    const canEdit = roleName === 'Owner' || roleName === 'Admin';
    setCanEditCompany(canEdit);
    
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const data = await api.get("/profile/me", { requireAuth: true });
      setProfile(data);
      setFullName(data.full_name || "");
      
      // Auto-fill job title with user role if not already set
      const roleName = typeof window !== 'undefined' ? localStorage.getItem('user_role_name') : null;
      setJobTitle(data.job_title || roleName || "");
      
      setCompanySize(data.company_size || "");
      setWebsite(data.website || "");
    } catch (error) {
      toast.error("Failed to load profile");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      await api.put("/profile/me", {
        full_name: fullName,
        job_title: jobTitle,
      }, { requireAuth: true });

      toast.success("Profile updated successfully");
      loadProfile();
    } catch (error) {
      toast.error("Failed to update profile");
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveCompany = async () => {
    setSaving(true);
    try {
      await api.put("/profile/tenant", {
        company_size: companySize,
        website: website,
      }, { requireAuth: true });

      toast.success("Company profile updated successfully");
      loadProfile();
    } catch (error) {
      toast.error("Failed to update company profile");
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-500" />
      </div>
    );
  }

  return (
    <div className="flex flex-col py-10 px-6 max-w-6xl mx-auto transition-colors duration-300">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-[var(--text-primary)]">Profile Settings</h1>
        <p className="text-[var(--text-secondary)] mt-2">Manage your personal and company information</p>
      </div>

      <div className="space-y-6">
      {/* Personal Information */}
      <Card className="bg-[var(--surface)] border-[var(--border)] hover:border-[var(--border-hover)] transition-all duration-300">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-[var(--text-primary)]">
            <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950">
              <User className="h-5 w-5 text-indigo-500" />
            </div>
            Personal Information
          </CardTitle>
          <CardDescription className="text-[var(--text-secondary)]">
            Update your personal details and contact information
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={profile?.email || ""}
                disabled
                className="bg-zinc-50 dark:bg-zinc-900"
              />
              <p className="text-xs text-zinc-500">Email cannot be changed</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="John Doe"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="jobTitle">Job Title</Label>
              <Input
                id="jobTitle"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                placeholder={userRole || "Software Engineer"}
              />
              {userRole && !jobTitle && (
                <p className="text-xs text-zinc-500">Auto-filled with your role: {userRole}</p>
              )}
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button 
              onClick={handleSaveProfile} 
              disabled={saving}
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Company Information - Hidden for Super Admins */}
      {!isSuperAdmin && (
      <Card className="bg-[var(--surface)] border-[var(--border)] hover:border-[var(--border-hover)] transition-all duration-300">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-[var(--text-primary)]">
            <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950">
              <Building2 className="h-5 w-5 text-indigo-500" />
            </div>
            Company Information
          </CardTitle>
          <CardDescription className="text-[var(--text-secondary)]">
            Update your organization details
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="companyName">Company Name</Label>
              <Input
                id="companyName"
                value={profile?.tenant_name || ""}
                disabled
                className="bg-zinc-50 dark:bg-zinc-900"
              />
              <p className="text-xs text-zinc-500">Company name cannot be changed</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="companySize">Company Size</Label>
              <Select value={companySize} onValueChange={setCompanySize} disabled={!canEditCompany}>
                <SelectTrigger className={!canEditCompany ? "bg-zinc-50 dark:bg-zinc-900" : ""}>
                  <SelectValue placeholder="Select company size" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1-10">1-10 employees</SelectItem>
                  <SelectItem value="11-50">11-50 employees</SelectItem>
                  <SelectItem value="51-200">51-200 employees</SelectItem>
                  <SelectItem value="201-500">201-500 employees</SelectItem>
                  <SelectItem value="501-1000">501-1000 employees</SelectItem>
                  <SelectItem value="1000+">1000+ employees</SelectItem>
                </SelectContent>
              </Select>
              {!canEditCompany && (
                <p className="text-xs text-zinc-500">Only Owner and Admin can edit company information</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                type="url"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="https://example.com"
                disabled={!canEditCompany}
                className={!canEditCompany ? "bg-zinc-50 dark:bg-zinc-900" : ""}
              />
            </div>
          </div>

          {canEditCompany && (
          <div className="flex justify-end pt-2">
            <Button 
              onClick={handleSaveCompany} 
              disabled={saving}
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Company Info"
              )}
            </Button>
          </div>
          )}
        </CardContent>
      </Card>
      )}

      {/* Account Details - Hidden for Super Admins */}
      {!isSuperAdmin && (
      <Card className="bg-[var(--surface)] border-[var(--border)] hover:border-[var(--border-hover)] transition-all duration-300">
        <CardHeader className="pb-4">
          <CardTitle className="text-[var(--text-primary)]">Account Details</CardTitle>
          <CardDescription className="text-[var(--text-secondary)]">
            Your account information
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950">
                <User className="h-5 w-5 text-indigo-500" />
              </div>
              <div>
                <p className="text-[var(--text-secondary)] text-xs mb-1">Member Since</p>
                <p className="font-semibold text-[var(--text-primary)]">
                  {profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : "N/A"}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-green-50 dark:bg-green-950">
                <User className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-[var(--text-secondary)] text-xs mb-1">Last Login</p>
                <p className="font-semibold text-[var(--text-primary)]">
                {profile?.last_login ? new Date(profile.last_login).toLocaleString('en-IN', {
                  year: 'numeric',
                  month: 'numeric',
                  day: 'numeric',
                  hour: 'numeric',
                  minute: 'numeric',
                  second: 'numeric',
                  hour12: true
                }) : "N/A"}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      )}
      </div>
    </div>
  );
}
