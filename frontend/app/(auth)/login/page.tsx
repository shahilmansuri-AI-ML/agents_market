"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/auth";
import { toast } from "sonner";
import { Loader2, ArrowRight, Eye, EyeOff } from "lucide-react";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [formData, setFormData] = useState({ email: "", password: "" });

  useEffect(() => { setMounted(true); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const SUPER_ADMIN_EMAIL = "admin@media2ai.com";
      const SUPER_ADMIN_PASSWORD = "superpassword123";

      console.log("🔐 Login attempt:", {
        email: formData.email,
        isSuperAdminEmail: formData.email === SUPER_ADMIN_EMAIL,
        isSuperAdminPassword: formData.password === SUPER_ADMIN_PASSWORD
      });

      if (formData.email === SUPER_ADMIN_EMAIL && formData.password === SUPER_ADMIN_PASSWORD) {
        console.log("✅ Super admin credentials matched, calling super admin API...");
        const res = await fetch("http://localhost:8000/api/super-admin/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: formData.email, password: formData.password }),
        });
        console.log("🌐 Super admin API response status:", res.status);
        if (res.ok) {
          const data = await res.json();
          console.log("✅ Super admin login successful, setting localStorage...");
          localStorage.setItem("super_admin_email", formData.email);
          localStorage.setItem("access_token", data.access_token);
          localStorage.setItem("refresh_token", data.refresh_token);
          localStorage.setItem("user_email", formData.email);
          localStorage.removeItem("user_original_role"); // Clear role switching state
          // Clear tenant data for super admin
          localStorage.removeItem("tenant_id");
          localStorage.removeItem("tenant_name");
          localStorage.removeItem("user_role_id");
          localStorage.removeItem("user_role_name");
          console.log("📦 Super admin localStorage set:", {
            super_admin_email: localStorage.getItem("super_admin_email"),
            access_token: !!localStorage.getItem("access_token")
          });
          toast.success("Super Admin access granted!");
          router.push("/dashboard");
          return;
        } else {
          const errorData = await res.json().catch(() => ({}));
          console.error("❌ Super admin API failed:", errorData);
          throw new Error(errorData.detail || "Super Admin verification failed");
        }
      }
      console.log("👤 Regular user login...");
      await auth.login(formData.email, formData.password);
      
      // Log what's actually in localStorage after login
      console.log("📦 After login, localStorage contains:", {
        tenant_id: localStorage.getItem("tenant_id"),
        tenant_name: localStorage.getItem("tenant_name"),
        user_role_id: localStorage.getItem("user_role_id"),
        user_role_name: localStorage.getItem("user_role_name"),
        user_email: localStorage.getItem("user_email")
      });
      
      toast.success("Login successful!");
      router.push("/dashboard");
    } catch (error: any) {
      toast.error(error.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=DM+Mono:wght@300;400;500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        :root {
          --bg: #080B0F; --surface: #0D1117; --surface-2: #161B22;
          --border: rgba(255,255,255,0.06); --border-hover: rgba(255,255,255,0.12);
          --accent: #3B82F6; --accent-glow: rgba(59,130,246,0.15); --accent-2: #06B6D4;
          --text-primary: #F0F6FC; --text-secondary: #7D8590; --text-tertiary: #444C56;
          --success: #3FB950;
        }
        body { background: var(--bg); font-family: 'Outfit', sans-serif; }

        .login-root {
          min-height: 100vh;
          background: var(--bg);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
          position: relative;
          overflow: hidden;
        }
        .login-root::before {
          content: '';
          position: absolute; inset: 0;
          background:
            radial-gradient(ellipse 50% 40% at 20% 20%, rgba(59,130,246,0.06) 0%, transparent 70%),
            radial-gradient(ellipse 40% 40% at 80% 80%, rgba(6,182,212,0.04) 0%, transparent 70%);
          pointer-events: none;
        }
        .grid-overlay {
          position: absolute; inset: 0;
          background-image:
            linear-gradient(rgba(255,255,255,0.013) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.013) 1px, transparent 1px);
          background-size: 48px 48px;
          pointer-events: none;
        }

        .form-container {
          position: relative; z-index: 1;
          width: 100%; max-width: 400px;
          opacity: 0; transform: translateY(16px);
          transition: opacity 0.5s ease, transform 0.5s ease;
        }
        .form-container.visible { opacity: 1; transform: translateY(0); }

        .logo-wrap {
          display: flex; align-items: center; justify-content: center;
          gap: 10px; margin-bottom: 40px; text-decoration: none;
        }
        .logo-icon {
          width: 38px; height: 38px; border-radius: 9px;
          background: linear-gradient(135deg, var(--accent), var(--accent-2));
          display: flex; align-items: center; justify-content: center;
          font-size: 14px; font-weight: 800; color: white; letter-spacing: -1px;
          box-shadow: 0 0 24px rgba(59,130,246,0.3);
        }
        .logo-text { font-size: 20px; font-weight: 700; color: var(--text-primary); letter-spacing: -0.5px; }

        .card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 14px;
          padding: 36px;
        }

        .form-eyebrow {
          font-family: 'DM Mono', monospace; font-size: 11px; color: var(--accent);
          text-transform: uppercase; letter-spacing: 2px; margin-bottom: 12px;
          display: flex; align-items: center; gap: 8px;
        }
        .form-eyebrow::before { content: ''; display: inline-block; width: 16px; height: 1px; background: var(--accent); }

        .form-title {
          font-size: 28px; font-weight: 800; color: var(--text-primary);
          letter-spacing: -1.5px; line-height: 1.3; margin-bottom: 6px;
        }
        .form-subtitle { font-size: 14px; color: var(--text-secondary); margin-bottom: 32px; }

        .fields { display: flex; flex-direction: column; gap: 20px; margin-bottom: 28px; }
        .field { display: flex; flex-direction: column; gap: 7px; }
        .field-label { font-size: 12px; font-weight: 500; color: var(--text-secondary); }

        .input-wrap { position: relative; }
        .field-input {
          width: 100%; height: 44px;
          background: var(--surface-2); border: 1px solid var(--border);
          border-radius: 8px; padding: 0 40px 0 14px;
          font-size: 14px; color: var(--text-primary);
          font-family: 'Syne', sans-serif; outline: none;
          transition: border-color 0.2s, box-shadow 0.2s, background 0.2s;
          caret-color: var(--accent);
        }
        .field-input.no-icon { padding-right: 14px; }
        .field-input::placeholder { color: var(--text-tertiary); }
        .field-input:focus {
          border-color: rgba(59,130,246,0.5);
          box-shadow: 0 0 0 3px var(--accent-glow);
          background: var(--bg);
        }
        .field-input:hover:not(:focus) { border-color: var(--border-hover); }

        .toggle-btn {
          position: absolute; right: 12px; top: 50%; transform: translateY(-50%);
          background: none; border: none; cursor: pointer;
          color: var(--text-tertiary); padding: 4px; display: flex; transition: color 0.2s;
        }
        .toggle-btn:hover { color: var(--text-secondary); }

        .forgot-row { display: flex; justify-content: flex-end; margin-top: -8px; }
        .forgot-link {
          font-size: 12px; color: var(--text-tertiary); text-decoration: none;
          font-family: 'Outfit', sans-serif; transition: color 0.2s;
        }
        .forgot-link:hover { color: var(--text-secondary); }

        .submit-btn {
          width: 100%; height: 44px; background: var(--accent); color: white;
          border: none; border-radius: 8px; font-size: 14px; font-weight: 600;
          font-family: 'Outfit', sans-serif; cursor: pointer;
          display: flex; align-items: center; justify-content: center; gap: 8px;
          letter-spacing: 0.2px; margin-bottom: 24px;
          transition: background 0.2s, transform 0.15s, box-shadow 0.2s;
          position: relative; overflow: hidden;
        }
        .submit-btn::before {
          content: ''; position: absolute; inset: 0;
          background: linear-gradient(135deg, rgba(255,255,255,0.08) 0%, transparent 60%);
          pointer-events: none;
        }
        .submit-btn:hover:not(:disabled) {
          background: #2563EB; transform: translateY(-1px);
          box-shadow: 0 4px 16px rgba(59,130,246,0.35);
        }
        .submit-btn:active:not(:disabled) { transform: translateY(0); }
        .submit-btn:disabled { opacity: 0.6; cursor: not-allowed; }

        .signup-row { text-align: center; font-size: 13px; color: var(--text-tertiary); }
        .signup-link { color: var(--accent); text-decoration: none; font-weight: 500; transition: color 0.2s; }
        .signup-link:hover { color: #60A5FA; }

        .bottom-status {
          display: flex; align-items: center; justify-content: center;
          gap: 6px; margin-top: 24px;
          font-size: 11px; font-family: 'Outfit', sans-serif; color: var(--text-tertiary);
        }
        .status-dot {
          width: 6px; height: 6px; border-radius: 50%; background: var(--success);
          box-shadow: 0 0 6px rgba(63,185,80,0.6);
          animation: pulse-dot 2.5s infinite;
        }
        @keyframes pulse-dot { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      <div className="login-root">
        <div className="grid-overlay" />

        <div className={`form-container ${mounted ? "visible" : ""}`}>
          <a href="/" className="logo-wrap">
            <div className="logo-icon">M2</div>
            <span className="logo-text">Media2AI</span>
          </a>

          <div className="card">
            <div className="form-eyebrow">Secure sign-in</div>
            <h1 className="form-title">Welcome back</h1>
            <p className="form-subtitle">Enter your credentials to continue</p>

            <form onSubmit={handleSubmit}>
              <div className="fields">
                <div className="field">
                  <label className="field-label">Email address</label>
                  <div className="input-wrap">
                    <input
                      type="email"
                      className="field-input no-icon"
                      placeholder="you@company.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                      autoComplete="email"
                    />
                  </div>
                </div>

                <div className="field">
                  <label className="field-label">Password</label>
                  <div className="input-wrap">
                    <input
                      type={showPassword ? "text" : "password"}
                      className="field-input"
                      placeholder="••••••••••••"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      required
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      className="toggle-btn"
                      onClick={() => setShowPassword(!showPassword)}
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                  <div className="forgot-row">
                    <a href="/forgot-password" className="forgot-link">Forgot password?</a>
                  </div>
                </div>
              </div>

              <button type="submit" className="submit-btn" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 size={15} style={{ animation: "spin 1s linear infinite" }} />
                    Signing in...
                  </>
                ) : (
                  <>
                    Sign in
                    <ArrowRight size={15} />
                  </>
                )}
              </button>
            </form>

            <div className="signup-row">
              No account?{" "}
              <Link href="/signup" className="signup-link">Create one</Link>
            </div>
          </div>

          <div className="bottom-status">
            <div className="status-dot" />
            All systems operational
          </div>
        </div>
      </div>
    </>
  );
}