"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/auth";
import { toast } from "sonner";
import { Loader2, ArrowRight, Eye, EyeOff, CheckCircle, XCircle } from "lucide-react";
import Link from "next/link";

export default function SignupPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [formData, setFormData] = useState({ email: "", password: "", confirmPassword: "", invitationToken: "" });
  const [passwordStrength, setPasswordStrength] = useState<"weak" | "medium" | "strong" | null>(null);

  useEffect(() => { setMounted(true); }, []);

  const checkPasswordStrength = (p: string): "weak" | "medium" | "strong" => {
    if (p.length < 8) return "weak";
    const hasUpper = /[A-Z]/.test(p);
    const hasLower = /[a-z]/.test(p);
    const hasNum = /\d/.test(p);
    const hasSpec = /[!@#$%^&*(),.?":{}|<>]/.test(p);
    if (hasUpper && hasLower && hasNum && hasSpec) return "strong";
    if ((hasUpper || hasLower) && hasNum) return "medium";
    return "weak";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) { toast.error("Passwords do not match"); return; }
    if (formData.password.length < 8) { toast.error("Password must be at least 8 characters"); return; }
    setLoading(true);
    try {
      if (formData.invitationToken) {
        // Handle invitation signup
        const response = await fetch("http://localhost:8000/invitations/accept", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            token: formData.invitationToken, 
            password: formData.password 
          }),
        });
        
        if (response.ok) {
          const data = await response.json();
          toast.success("Account created! You've been added to the tenant workspace.");
          // Auto-login after invitation acceptance
          await auth.login(formData.email, formData.password);
          router.push("/dashboard");
        } else {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.detail || "Invalid invitation token");
        }
      } else {
        // Regular signup
        await auth.signup(formData.email, formData.password);
        toast.success("Account created! Check your email for a verification code.");
        localStorage.setItem("pending_email", formData.email);
        router.push("/verify");
      }
    } catch (error: any) {
      toast.error(error.message || "Signup failed");
    } finally {
      setLoading(false);
    }
  };

  const strengthWidth = passwordStrength === "weak" ? "33%" : passwordStrength === "medium" ? "66%" : passwordStrength === "strong" ? "100%" : "0%";
  const strengthColor = passwordStrength === "weak" ? "#EF4444" : passwordStrength === "medium" ? "#F59E0B" : "#22C55E";
  const strengthLabel = passwordStrength ? passwordStrength.charAt(0).toUpperCase() + passwordStrength.slice(1) : "";
  const passwordsMatch = formData.confirmPassword.length > 0 && formData.password === formData.confirmPassword;
  const passwordsMismatch = formData.confirmPassword.length > 0 && formData.password !== formData.confirmPassword;

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
          --success: #3FB950; --danger: #F85149;
        }
        body { background: var(--bg); font-family: 'Outfit', sans-serif; }

        .signup-root { min-height: 100vh; display: grid; grid-template-columns: 1fr 1fr; background: var(--bg); }

        /* LEFT PANEL */
        .lp { position: relative; display: flex; flex-direction: column; justify-content: space-between; padding: 48px; overflow: hidden; border-right: 1px solid var(--border); }
        .lp::before { content: ''; position: absolute; inset: 0; background: radial-gradient(ellipse 60% 50% at 20% 20%, rgba(59,130,246,0.08) 0%, transparent 70%), radial-gradient(ellipse 50% 40% at 80% 80%, rgba(6,182,212,0.06) 0%, transparent 70%); pointer-events: none; }
        .grid-overlay { position: absolute; inset: 0; background-image: linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px); background-size: 48px 48px; pointer-events: none; }
        .lp-top { position: relative; z-index: 1; }
        .logo-mark { display: inline-flex; align-items: center; gap: 10px; text-decoration: none; }
        .logo-icon { width: 36px; height: 36px; border-radius: 8px; background: linear-gradient(135deg, var(--accent), var(--accent-2)); display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: 800; color: white; letter-spacing: -1px; box-shadow: 0 0 20px rgba(59,130,246,0.3); }
        .logo-text { font-size: 18px; font-weight: 700; color: var(--text-primary); letter-spacing: -0.5px; }
        .lp-mid { position: relative; z-index: 1; }
        .lp-headline { font-size: clamp(30px, 3.5vw, 48px); font-weight: 800; line-height: 1.25; letter-spacing: -2px; color: var(--text-primary); margin-bottom: 20px; }
        .lp-headline span { background: linear-gradient(135deg, var(--accent), var(--accent-2)); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
        .lp-desc { font-size: 15px; color: var(--text-secondary); line-height: 1.7; margin-bottom: 40px; max-width: 380px; }

        /* RIGHT PANEL */
        .rp { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 48px; background: var(--surface); position: relative; }
        .form-wrap { width: 100%; max-width: 380px; opacity: 0; transform: translateY(16px); transition: opacity 0.5s ease, transform 0.5s ease; }
        .form-wrap.visible { opacity: 1; transform: translateY(0); }
        .form-header { margin-bottom: 36px; }
        .form-eyebrow { font-family: 'DM Mono', monospace; font-size: 11px; font-weight: 500; color: var(--accent); text-transform: uppercase; letter-spacing: 2px; margin-bottom: 12px; display: flex; align-items: center; gap: 8px; }
        .form-eyebrow::before { content: ''; display: inline-block; width: 16px; height: 1px; background: var(--accent); }
        .form-title { font-size: 30px; font-weight: 800; color: var(--text-primary); letter-spacing: -1.5px; line-height: 1.3; margin-bottom: 8px; }
        .form-sub { font-size: 14px; color: var(--text-secondary); }

        .fields { display: flex; flex-direction: column; gap: 18px; margin-bottom: 24px; }
        .field { display: flex; flex-direction: column; gap: 7px; }
        .field-label { font-size: 12px; font-weight: 500; color: var(--text-secondary); letter-spacing: 0.2px; }
        .input-wrap { position: relative; }
        .field-input { width: 100%; height: 42px; background: var(--surface-2); border: 1px solid var(--border); border-radius: 8px; padding: 0 40px 0 13px; font-size: 13px; font-weight: 400; color: var(--text-primary); font-family:'Outfit', sans-serif;  outline: none; transition: border-color 0.2s, box-shadow 0.2s, background 0.2s; caret-color: var(--accent); }
        .field-input.no-icon { padding-right: 13px; }
        .field-input::placeholder { color: var(--text-tertiary); }
        .field-input:focus { border-color: rgba(59,130,246,0.5); box-shadow: 0 0 0 3px var(--accent-glow); background: var(--bg); }
        .field-input:hover:not(:focus) { border-color: var(--border-hover); }
        .toggle-btn { position: absolute; right: 11px; top: 50%; transform: translateY(-50%); background: none; border: none; cursor: pointer; color: var(--text-tertiary); padding: 4px; display: flex; transition: color 0.2s; }
        .toggle-btn:hover { color: var(--text-secondary); }

        .strength-bar-wrap { margin-top: 6px; display: flex; align-items: center; gap: 10px; }
        .strength-track { flex: 1; height: 3px; background: rgba(255,255,255,0.06); border-radius: 100px; overflow: hidden; }
        .strength-fill { height: 100%; border-radius: 100px; transition: width 0.3s ease, background-color 0.3s ease; }
        .strength-label { font-size: 11px; font-family: 'Outfit', sans-serif;; font-weight: 500; white-space: nowrap; }
        .strength-hint { font-size: 11px; color: var(--text-tertiary); margin-top: 5px; font-family: 'Outfit', sans-serif; }

        .match-row { display: flex; align-items: center; gap: 6px; margin-top: 5px; font-size: 11px; font-family: 'Outfit', sans-serif; }

        .submit-btn { width: 100%; height: 42px; background: var(--accent); color: white; border: none; border-radius: 8px; font-size: 13px; font-weight: 600; font-family: 'Outfit', sans-serif; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; letter-spacing: 0.2px; transition: background 0.2s, transform 0.15s, box-shadow 0.2s; position: relative; overflow: hidden; margin-bottom: 20px; }
        .submit-btn::before { content: ''; position: absolute; inset: 0; background: linear-gradient(135deg, rgba(255,255,255,0.08) 0%, transparent 60%); pointer-events: none; }
        .submit-btn:hover:not(:disabled) { background: #2563EB; transform: translateY(-1px); box-shadow: 0 4px 16px rgba(59,130,246,0.35); }
        .submit-btn:active:not(:disabled) { transform: translateY(0); }
        .submit-btn:disabled { opacity: 0.6; cursor: not-allowed; }

        .signin-row { text-align: center; font-size: 13px; color: var(--text-tertiary); }
        .signin-link { color: var(--accent); text-decoration: none; font-weight: 500; transition: color 0.2s; }
        .signin-link:hover { color: #60A5FA; }

        .bottom-note { position: absolute; bottom: 28px; font-size: 11px; font-family: 'DM Mono', monospace; color: var(--text-tertiary); text-align: center; }

        @media (max-width: 768px) {
          .signup-root { grid-template-columns: 1fr; }
          .lp { display: none; }
          .rp { padding: 32px 24px; }
        }
      `}</style>

      <div className="signup-root">
        {/* LEFT PANEL */}
        <div className="lp">
          <div className="grid-overlay" />
          <div className="lp-top">
            <a href="/" className="logo-mark">
              <div className="logo-icon">M2</div>
              <span className="logo-text">Media2AI</span>
            </a>
          </div>

          <div className="lp-mid">
            <h1 className="lp-headline">
              Create your<br /><span>account</span>
            </h1>
            <p className="lp-desc">
              Join Media2AI and get started with your workspace. Use an invitation token to join a specific tenant workspace directly.
            </p>
          </div>

          <div className="lp-bottom">
          </div>
        </div>

        {/* RIGHT PANEL */}
        <div className="rp">
          <div className={`form-wrap ${mounted ? "visible" : ""}`}>
            <div className="form-header">
              <div className="form-eyebrow">Get started</div>
              <h2 className="form-title">Create your account</h2>
              <p className="form-sub">Join Media2AI and get started</p>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="fields">
                {/* Email */}
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

                {/* Password */}
                <div className="field">
                  <label className="field-label">Password</label>
                  <div className="input-wrap">
                    <input
                      type={showPassword ? "text" : "password"}
                      className="field-input"
                      placeholder="Min. 8 characters"
                      value={formData.password}
                      onChange={(e) => {
                        setFormData({ ...formData, password: e.target.value });
                        if (e.target.value) setPasswordStrength(checkPasswordStrength(e.target.value));
                        else setPasswordStrength(null);
                      }}
                      required
                      autoComplete="new-password"
                    />
                    <button type="button" className="toggle-btn" onClick={() => setShowPassword(!showPassword)} tabIndex={-1}>
                      {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                  {formData.password && (
                    <>
                      <div className="strength-bar-wrap">
                        <div className="strength-track">
                          <div className="strength-fill" style={{ width: strengthWidth, backgroundColor: strengthColor }} />
                        </div>
                        <span className="strength-label" style={{ color: strengthColor }}>{strengthLabel}</span>
                      </div>
                      <div className="strength-hint">Use uppercase, numbers & symbols</div>
                    </>
                  )}
                </div>

                {/* Confirm Password */}
                <div className="field">
                  <label className="field-label">Confirm password</label>
                  <div className="input-wrap">
                    <input
                      type={showConfirm ? "text" : "password"}
                      className="field-input"
                      placeholder="Re-enter your password"
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                      required
                      autoComplete="new-password"
                      style={formData.confirmPassword ? { borderColor: passwordsMatch ? "rgba(63,185,80,0.4)" : passwordsMismatch ? "rgba(248,81,73,0.4)" : undefined } : undefined}
                    />
                    <button type="button" className="toggle-btn" onClick={() => setShowConfirm(!showConfirm)} tabIndex={-1}>
                      {showConfirm ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                  {passwordsMatch && (
                    <div className="match-row" style={{ color: "#3FB950" }}>
                      <CheckCircle size={12} /> Passwords match
                    </div>
                  )}
                  {passwordsMismatch && (
                    <div className="match-row" style={{ color: "#F85149" }}>
                      <XCircle size={12} /> Passwords do not match
                    </div>
                  )}
                </div>

                {/* Invitation Token */}
                <div className="field">
                  <label className="field-label">Invitation Token (Optional)</label>
                  <div className="input-wrap">
                    <input
                      type="text"
                      className="field-input no-icon"
                      placeholder="Paste your invitation token here"
                      value={formData.invitationToken}
                      onChange={(e) => setFormData({ ...formData, invitationToken: e.target.value })}
                    />
                  </div>
                  <div className="strength-hint">If you have an invitation token, you'll join the tenant workspace directly</div>
                </div>
              </div>

              <button type="submit" className="submit-btn" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} />
                    Creating account...
                  </>
                ) : (
                  <>
                    Create account
                    <ArrowRight size={14} />
                  </>
                )}
              </button>
            </form>

            <div className="signin-row">
              Already have an account?{" "}
              <Link href="/login" className="signin-link">Sign in</Link>
            </div>
          </div>

          <div className="bottom-note">
            By signing up, you agree to our Terms & Privacy Policy
          </div>
        </div>
      </div>
    </>
  );
}
