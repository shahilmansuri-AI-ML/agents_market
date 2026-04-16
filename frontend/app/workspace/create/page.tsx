"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, ArrowRight, Building2, Users, Settings, Globe, Zap, Shield, CheckCircle } from "lucide-react";
import Link from "next/link";

export default function CreateWorkspacePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    size: "",
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  const companySizes = [
    { value: "1-10", label: "1-10 employees" },
    { value: "11-50", label: "11-50 employees" },
    { value: "51-200", label: "51-200 employees" },
    { value: "201-500", label: "201-500 employees" },
    { value: "500+", label: "500+ employees" }
  ];

  const features = [
    { icon: Zap, title: "Lightning Fast", desc: "Deploy AI agents in seconds" },
    { icon: Shield, title: "Enterprise Security", desc: "Bank-level data protection" },
    { icon: Users, title: "Team Collaboration", desc: "Work together seamlessly" },
    { icon: Globe, title: "Global Scale", desc: "Deploy anywhere, anytime" },
    { icon: Building2, title: "Custom Workspaces", desc: "Tailored to your needs" },
    { icon: Settings, title: "Full Control", desc: "Configure every aspect" }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error("Workspace name is required");
      return;
    }

    setLoading(true);
    try {
      // Create workspace API call
      const response = await fetch("http://localhost:8000/api/workspaces", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("access_token")}`
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        const data = await response.json();
        toast.success("Workspace created successfully!");
        
        // Store workspace info as tenant info (since workspace = tenant)
        localStorage.setItem("tenant_id", data.id);
        localStorage.setItem("tenant_name", data.name);
        
        // Store user's role information (Owner role assigned by backend)
        if (data.user_role_id && data.user_role) {
          localStorage.setItem("user_role_id", data.user_role_id);
          localStorage.setItem("user_role_name", data.user_role);
        }
        
        // Clear any previous role switching state
        localStorage.removeItem("user_original_role");
        
        // Redirect to dashboard
        router.push("/dashboard");
      } else {
        const error = await response.json();
        throw new Error(error.detail || "Failed to create workspace");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to create workspace");
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
          --success: #3FB950; --danger: #EF4444; --warn: #F59E0B;
        }
        body { background: var(--bg); font-family: 'Outfit', sans-serif; color: var(--text-primary); }

        .create-root {
          min-height: 100vh;
          background: var(--bg);
          display: grid;
          grid-template-columns: 1fr 1fr;
        }

        /* LEFT PANEL */
        .lp {
          position: relative;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          padding: 48px;
          border-right: 1px solid var(--border);
          overflow: hidden;
        }
        .lp::before {
          content: '';
          position: absolute; inset: 0;
          background: radial-gradient(ellipse 60% 50% at 15% 25%, rgba(59,130,246,0.08) 0%, transparent 70%),
                      radial-gradient(ellipse 50% 40% at 80% 75%, rgba(6,182,212,0.05) 0%, transparent 70%);
          pointer-events: none;
        }
        .grid-bg {
          position: absolute; inset: 0;
          background-image: linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px);
          background-size: 48px 48px;
          pointer-events: none;
        }
        .lp-top { position: relative; z-index: 1; }
        .logo-mark { display: inline-flex; align-items: center; gap: 10px; text-decoration: none; }
        .logo-icon { width: 36px; height: 36px; border-radius: 8px; background: linear-gradient(135deg, var(--accent), var(--accent-2)); display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: 800; color: white; letter-spacing: -1px; box-shadow: 0 0 20px rgba(59,130,246,0.3); }
        .logo-text { font-size: 18px; font-weight: 700; color: var(--text-primary); letter-spacing: -0.5px; }

        .lp-mid { position: relative; z-index: 1; }
        .lp-headline { font-size: clamp(30px, 3.5vw, 48px); font-weight: 800; line-height: 1.15; letter-spacing: -2px; color: var(--text-primary); margin-bottom: 20px; }
        .lp-headline span { background: linear-gradient(135deg, var(--accent), var(--accent-2)); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
        .lp-desc { font-size: 15px; color: var(--text-secondary); line-height: 1.7; margin-bottom: 40px; max-width: 380px; }

        .features-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 40px; }
        .feature-card {
          padding: 20px; background: rgba(255,255,255,0.02); border: 1px solid var(--border);
          border-radius: 12px; transition: all 0.3s ease;
        }
        .feature-card:hover {
          background: rgba(255,255,255,0.04); border-color: var(--border-hover);
          transform: translateY(-2px);
        }
        .feature-icon { width: 40px; height: 40px; border-radius: 8px; background: rgba(59,130,246,0.1); border: 1px solid rgba(59,130,246,0.2); display: flex; align-items: center; justify-content: center; margin-bottom: 12px; color: var(--accent); }
        .feature-title { font-size: 14px; font-weight: 600; color: var(--text-primary); margin-bottom: 6px; }
        .feature-desc { font-size: 12px; color: var(--text-secondary); line-height: 1.5; }

        .lp-bottom { position: relative; z-index: 1; }
        .security-row { display: flex; align-items: center; gap: 8px; padding: 12px 16px; background: rgba(63,185,80,0.05); border: 1px solid rgba(63,185,80,0.12); border-radius: 8px; }
        .sec-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--success); box-shadow: 0 0 6px rgba(63,185,80,0.5); flex-shrink: 0; }
        .sec-text { font-size: 12px; color: var(--text-secondary); font-family: 'Outfit', sans-serif; }

        /* RIGHT PANEL */
        .rp {
          background: var(--surface);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 48px;
          position: relative;
        }

        .form-wrap {
          width: 100%; max-width: 420px;
          opacity: 0; transform: translateY(16px);
          transition: opacity 0.5s ease, transform 0.5s ease;
        }
        .form-wrap.visible { opacity: 1; transform: translateY(0); }

        .form-header { margin-bottom: 36px; text-align: center; }
        .form-eyebrow { font-family: 'DM Mono', monospace; font-size: 11px; color: var(--accent); text-transform: uppercase; letter-spacing: 2px; margin-bottom: 12px; display: flex; align-items: center; justify-content: center; gap: 8px; }
        .form-eyebrow::before, .form-eyebrow::after { content: ''; display: inline-block; width: 16px; height: 1px; background: var(--accent); }
        .form-title { font-size: 28px; font-weight: 800; color: var(--text-primary); letter-spacing: -1.5px; line-height: 1.3; margin-bottom: 8px; }
        .form-sub { font-size: 14px; color: var(--text-secondary); }

        .fields { display: flex; flex-direction: column; gap: 20px; margin-bottom: 28px; }
        .field { display: flex; flex-direction: column; gap: 7px; }
        .field-label { font-size: 12px; font-weight: 500; color: var(--text-secondary); }
        .field-input, .field-select, .field-textarea {
          width: 100%; background: var(--surface-2); border: 1px solid var(--border); 
          border-radius: 8px; padding: 12px 14px;
          font-size: 14px; color: var(--text-primary);
          font-family: 'Outfit', sans-serif; outline: none;
          transition: border-color 0.2s, box-shadow 0.2s, background 0.2s;
        }
        .field-textarea { resize: vertical; min-height: 80px; font-family: inherit; }
        .field-input::placeholder, .field-textarea::placeholder { color: var(--text-tertiary); }
        .field-input:focus, .field-select:focus, .field-textarea:focus {
          border-color: rgba(59,130,246,0.5);
          box-shadow: 0 0 0 3px var(--accent-glow);
          background: var(--bg);
        }
        .field-input:hover:not(:focus), .field-select:hover:not(:focus), .field-textarea:hover:not(:focus) { border-color: var(--border-hover); }

        .submit-btn {
          width: 100%; height: 44px; background: var(--accent); color: white;
          border: none; border-radius: 8px; font-size: 14px; font-weight: 600;
          font-family: 'Outfit', sans-serif; cursor: pointer;
          display: flex; align-items: center; justify-content: center; gap: 8px;
          transition: background 0.2s, transform 0.15s, box-shadow 0.2s;
          position: relative; overflow: hidden;
          margin-bottom: 20px;
        }
        .submit-btn::before { content: ''; position: absolute; inset: 0; background: linear-gradient(135deg, rgba(255,255,255,0.08) 0%, transparent 60%); pointer-events: none; }
        .submit-btn:hover:not(:disabled) { background: #2563EB; transform: translateY(-1px); box-shadow: 0 4px 16px rgba(59,130,246,0.35); }
        .submit-btn:active:not(:disabled) { transform: translateY(0); }
        .submit-btn:disabled { opacity: 0.6; cursor: not-allowed; }

        .skip-row { text-align: center; font-size: 13px; color: var(--text-tertiary); }
        .skip-link { color: var(--accent); text-decoration: none; font-weight: 500; transition: color 0.2s; }
        .skip-link:hover { color: #60A5FA; }

        @keyframes spin { to { transform: rotate(360deg); } }

        @media (max-width: 768px) {
          .create-root { grid-template-columns: 1fr; }
          .lp { display: none; }
          .rp { padding: 32px 24px; }
          .features-grid { grid-template-columns: 1fr; }
        }
      `}</style>

      <div className="create-root">
        {/* LEFT PANEL */}
        <div className="lp">
          <div className="grid-bg" />
          <div className="lp-top">
            <a href="/dashboard" className="logo-mark">
              <div className="logo-icon">M2</div>
              <span className="logo-text">Media2AI</span>
            </a>
          </div>

          <div className="lp-mid">
            <h1 className="lp-headline">Create your<br /><span>workspace</span></h1>
            <p className="lp-desc">
              Set up your AI-powered workspace and start building intelligent agents that transform your business operations.
            </p>

            <div className="features-grid">
              {features.map((feature, i) => (
                <div className="feature-card" key={i}>
                  <div className="feature-icon">
                    <feature.icon size={20} />
                  </div>
                  <div className="feature-title">{feature.title}</div>
                  <div className="feature-desc">{feature.desc}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="lp-bottom">
            <div className="security-row">
              <div className="sec-dot" />
              <span className="sec-text">Enterprise-grade security · SOC2 compliant</span>
            </div>
          </div>
        </div>

        {/* RIGHT PANEL */}
        <div className="rp">
          <div className={`form-wrap ${mounted ? "visible" : ""}`}>
            <div className="form-header">
              <div className="form-eyebrow">Workspace setup</div>
              <h2 className="form-title">Tell us about your workspace</h2>
              <p className="form-sub">This helps us customize your experience</p>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="fields">
                <div className="field">
                  <label className="field-label">Workspace name *</label>
                  <input
                    type="text"
                    className="field-input"
                    placeholder="e.g., Acme Corp AI"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>

                <div className="field">
                  <label className="field-label">Description</label>
                  <textarea
                    className="field-textarea"
                    placeholder="What does your workspace do?"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>

                <div className="field">
                  <label className="field-label">Company size</label>
                  <select
                    className="field-select"
                    value={formData.size}
                    onChange={(e) => setFormData({ ...formData, size: e.target.value })}
                  >
                    <option value="">Select company size</option>
                    {companySizes.map((size) => (
                      <option key={size.value} value={size.value}>{size.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <button type="submit" className="submit-btn" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 size={15} style={{ animation: "spin 1s linear infinite" }} />
                    Creating workspace...
                  </>
                ) : (
                  <>
                    Create workspace
                    <ArrowRight size={15} />
                  </>
                )}
              </button>
            </form>

            <div className="skip-row">
              Want to set this up later?{" "}
              <Link href="/dashboard" className="skip-link">Skip to dashboard</Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
