"use client";

import {
  Brain,
  Workflow,
  Network,
  Lock,
  Gauge,
  Code2,
  Github,
  Twitter,
  Linkedin,
  ArrowRight,
  ChevronRight,
  Mail,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import styles from "./page.module.css";

const features = [
  { icon: Brain, title: "AI Agent Engine", desc: "Create intelligent autonomous agents powered by modern AI models." },
  { icon: Workflow, title: "Visual Workflow Builder", desc: "Build automation workflows using a drag-and-drop interface." },
  { icon: Network, title: "Multi-Agent Orchestration", desc: "Connect multiple agents and automate complex processes." },
  { icon: Lock, title: "Enterprise Security", desc: "Secure multi-tenant architecture with full audit logging." },
  { icon: Gauge, title: "Real-time Monitoring", desc: "Track performance, logs and metrics in real-time." },
  { icon: Code2, title: "Developer-First API", desc: "Integrate and extend the platform using powerful REST APIs." },
];

const stats = [
  { n: "10K+", l: "Developers" },
  { n: "500+", l: "Organizations" },
  { n: "1M+", l: "Workflows/day" },
];

const whyCards = [
  { emoji: "⚡", color: "#3B82F6", title: "Instant Deployment", desc: "Deploy AI agents instantly without managing infrastructure." },
  { emoji: "🧠", color: "#06B6D4", title: "Intelligent Automation", desc: "Automate complex workflows using autonomous AI agents." },
  { emoji: "🔐", color: "#3B82F6", title: "Enterprise Security", desc: "Multi-tenant secure architecture with full access control." },
];

export default function LandingPage() {
  const router = useRouter();
  const [invitationToken, setInvitationToken] = useState("");
  const [showInvitationInput, setShowInvitationInput] = useState(false);

  const handleInvitationSubmit = () => {
    if (invitationToken.trim()) {
      router.push(`/accept-invitation?token=${invitationToken.trim()}`);
    }
  };

  return (
    <div className={styles.landingScope}>
        {/* NAVBAR */}
        <nav className="nav">
          <div className="nav-logo" onClick={() => router.push("/")}>
            <div className="nav-logo-icon">M2</div>
            <span className="nav-logo-text">Media2AI</span>
          </div>
          <div className="nav-right">
            <button className="nav-signin" onClick={() => router.push("/login")}>Sign in</button>
            <button className="nav-cta" onClick={() => router.push("/signup")}>
              Start free <ChevronRight size={14} />
            </button>
          </div>
        </nav>

        {/* HERO */}
        <section className="hero">
          <div className="hero-grid" />
          <div className="hero-inner">
            <div className="hero-badge">
              <div className="hero-badge-dot" />
              Now in public beta — join 10,000+ developers
            </div>
            <h1 className="hero-title">
              Build, Deploy & Scale
              <span className="hero-title-accent">AI Agents Faster</span>
            </h1>
            <p className="hero-sub">
              Enterprise-grade platform to create, manage and automate workflows using intelligent AI agents.
            </p>
            <div className="hero-actions">
              <button className="btn-primary" onClick={() => router.push("/signup")}>
                Get started free <ArrowRight size={16} />
              </button>
              <button className="btn-secondary" onClick={() => router.push("/login")}>
                Live demo
              </button>
            </div>
            {/* Invitation Token Section */}
            <div className="invitation-section">
              <button 
                className="invitation-toggle"
                onClick={() => setShowInvitationInput(!showInvitationInput)}
              >
                <Mail size={16} />
                Have an invitation token?
              </button>
              {showInvitationInput && (
                <div className="invitation-input-wrapper">
                  <input
                    type="text"
                    className="invitation-input"
                    placeholder="Paste your invitation token here..."
                    value={invitationToken}
                    onChange={(e) => setInvitationToken(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleInvitationSubmit()}
                  />
                  <button 
                    className="invitation-submit"
                    onClick={handleInvitationSubmit}
                    disabled={!invitationToken.trim()}
                  >
                    Accept <ArrowRight size={14} />
                  </button>
                </div>
              )}
            </div>
            <div className="hero-stats">
              {stats.map((s) => (
                <div className="stat-item" key={s.l}>
                  <div className="stat-num">{s.n}</div>
                  <div className="stat-label">{s.l}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FEATURES */}
        <div className="section">
          <div className="section-eyebrow">Platform capabilities</div>
          <h2 className="section-title">Everything you need to build AI systems</h2>
          <p className="section-sub">A complete toolkit for teams that want to move fast without compromising on quality or security.</p>
          <div className="features-grid">
            {features.map((f) => (
              <div className="feature-cell" key={f.title}>
                <div className="feature-icon-wrap">
                  <f.icon size={18} color="var(--accent)" />
                </div>
                <div className="feature-title">{f.title}</div>
                <div className="feature-desc">{f.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* WHY Media2AI */}
        <div className="why-section">
          <div className="why-inner">
            <div className="section-eyebrow">Why Media2AI</div>
            <h2 className="section-title">Why teams choose Media2AI</h2>
            <p className="section-sub" style={{ marginBottom: "40px" }}>Built for modern AI-driven organizations that need performance, scalability and security.</p>
            <div className="why-grid">
              {whyCards.map((c) => (
                <div className="why-card" key={c.title}>
                  <span className="why-emoji">{c.emoji}</span>
                  <div className="why-title">{c.title}</div>
                  <div className="why-desc">{c.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* CTA */}
        <section className="cta-section">
          <div className="cta-grid" />
          <div className="cta-inner">
            <h2 className="cta-title">
              Ready to build your
              <span className="cta-title-accent">first AI agent?</span>
            </h2>
            <p className="cta-sub">Join thousands of developers and teams already using Media2AI to automate workflows.</p>
            <button className="cta-btn" onClick={() => router.push("/signup")}>
              Create free account <ArrowRight size={16} />
            </button>
            <div className="cta-trust">
              {["Free forever plan", "No credit card required", "2 min setup"].map((t) => (
                <div className="cta-trust-item" key={t}>
                  <span className="cta-check">✓</span> {t}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FOOTER */}
        <footer className="footer">
          <span className="footer-copy">© 2026 Media2AI Platform</span>
          <div className="footer-icons">
            <a className="footer-icon" href="#"><Twitter size={17} /></a>
            <a className="footer-icon" href="#"><Github size={17} /></a>
            <a className="footer-icon" href="#"><Linkedin size={17} /></a>
          </div>
        </footer>
      </div>
  );
}