"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/auth";
import { toast } from "sonner";
import { Loader2, ArrowRight, RotateCcw } from "lucide-react";

export default function VerifyPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [email, setEmail] = useState("");
  const [timeLeft, setTimeLeft] = useState(300);
  const [mounted, setMounted] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    setMounted(true);
    const pendingEmail = localStorage.getItem("pending_email");
    if (!pendingEmail) { router.push("/signup"); return; }
    setEmail(pendingEmail);
  }, [router]);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => { if (prev <= 0) { clearInterval(timer); return 0; } return prev - 1; });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;

  const timerPercent = (timeLeft / 300) * 100;
  const timerColor = timeLeft > 120 ? "#3B82F6" : timeLeft > 60 ? "#F59E0B" : "#EF4444";

  const handleOtpChange = (index: number, value: string) => {
    // Handle paste
    if (value.length > 1) {
      const digits = value.replace(/\D/g, "").slice(0, 6).split("");
      const newOtp = [...otp];
      digits.forEach((d, i) => { if (index + i < 6) newOtp[index + i] = d; });
      setOtp(newOtp);
      const nextIdx = Math.min(index + digits.length, 5);
      inputRefs.current[nextIdx]?.focus();
      return;
    }
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    if (value && index < 5) inputRefs.current[index + 1]?.focus();
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      const newOtp = [...otp];
      newOtp[index - 1] = "";
      setOtp(newOtp);
      inputRefs.current[index - 1]?.focus();
    }
    if (e.key === "ArrowLeft" && index > 0) inputRefs.current[index - 1]?.focus();
    if (e.key === "ArrowRight" && index < 5) inputRefs.current[index + 1]?.focus();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const otpString = otp.join("");
    if (otpString.length !== 6) { toast.error("Please enter all 6 digits"); return; }
    setLoading(true);
    try {
      await auth.verifyOTP(email, otpString);
      toast.success("Email verified successfully!");
      localStorage.removeItem("pending_email");
      router.push("/workspace/create");
    } catch (error: any) {
      toast.error(error.message || "Verification failed");
      setOtp(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    try {
      await auth.signup(email, "temp123");
      toast.success("New code sent!");
      setTimeLeft(300);
      setOtp(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } catch {
      toast.error("Failed to resend code");
    }
  };

  const isComplete = otp.every((d) => d !== "");

  // Masked email
  const maskedEmail = email
    ? email.replace(/(.{2})(.*)(@.*)/, (_, a, b, c) => a + "*".repeat(Math.min(b.length, 5)) + c)
    : "";

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

        .verify-root {
          min-height: 100vh;
          background: var(--bg);
          display: grid;
          grid-template-columns: 1fr 1fr;
        }

        /* LEFT */
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
        .lp-headline { font-size: clamp(30px, 3.5vw, 48px); font-weight: 800; line-height: 1.1; letter-spacing: -2px; color: var(--text-primary); margin-bottom: 20px; }
        .lp-headline span { background: linear-gradient(135deg, var(--accent), var(--accent-2)); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
        .lp-desc { font-size: 15px; color: var(--text-secondary); line-height: 1.7; margin-bottom: 40px; max-width: 360px; }

        .steps { display: flex; flex-direction: column; gap: 0; }
        .step { display: flex; gap: 16px; }
        .step-line-col { display: flex; flex-direction: column; align-items: center; }
        .step-circle { width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 700; font-family: 'Outfit', sans-serif; flex-shrink: 0; }
        .step-circle.done { background: rgba(59,130,246,0.15); border: 1px solid rgba(59,130,246,0.3); color: var(--accent); }
        .step-circle.active { background: var(--accent); color: white; }
        .step-circle.upcoming { background: var(--surface-2); border: 1px solid var(--border); color: var(--text-tertiary); }
        .step-connector { width: 1px; flex: 1; min-height: 28px; background: var(--border); margin: 4px 0; }
        .step-body { padding-bottom: 28px; padding-top: 4px; }
        .step-label { font-size: 13px; font-weight: 600; color: var(--text-primary); margin-bottom: 3px; }
        .step-label.muted { color: var(--text-tertiary); font-weight: 400; }
        .step-sub { font-size: 12px; color: var(--text-tertiary); }

        .lp-bottom { position: relative; z-index: 1; }
        .security-row { display: flex; align-items: center; gap: 8px; padding: 12px 16px; background: rgba(63,185,80,0.05); border: 1px solid rgba(63,185,80,0.12); border-radius: 8px; }
        .sec-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--success); box-shadow: 0 0 6px rgba(63,185,80,0.5); flex-shrink: 0; }
        .sec-text { font-size: 12px; color: var(--text-secondary); font-family: 'DM Mono', monospace; }

        /* RIGHT */
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
          width: 100%; max-width: 380px;
          opacity: 0; transform: translateY(16px);
          transition: opacity 0.5s ease, transform 0.5s ease;
        }
        .form-wrap.visible { opacity: 1; transform: translateY(0); }

        .form-header { margin-bottom: 36px; }
        .form-eyebrow { font-family: 'DM Mono', monospace; font-size: 11px; color: var(--accent); text-transform: uppercase; letter-spacing: 2px; margin-bottom: 12px; display: flex; align-items: center; gap: 8px; }
        .form-eyebrow::before { content: ''; display: inline-block; width: 16px; height: 1px; background: var(--accent); }
        .form-title { font-size: 28px; font-weight: 800; color: var(--text-primary); letter-spacing: -1.5px; line-height: 1.1; margin-bottom: 10px; }
        .email-display { display: inline-flex; align-items: center; gap: 7px; padding: 6px 12px; background: var(--surface-2); border: 1px solid var(--border); border-radius: 6px; font-size: 12px; font-family: 'DM Mono', monospace; color: var(--text-secondary); margin-top: 4px; }
        .email-dot { width: 5px; height: 5px; border-radius: 50%; background: var(--accent); }

        .otp-label { font-size: 12px; font-weight: 500; color: var(--text-secondary); margin-bottom: 14px; text-align: center; }

        .otp-grid { display: flex; justify-content: center; gap: 10px; margin-bottom: 20px; }

        .otp-input {
          width: 50px; height: 58px;
          background: var(--surface-2);
          border: 1px solid var(--border);
          border-radius: 10px;
          text-align: center;
          font-size: 22px;
          font-weight: 700;
          font-family: 'Outfit', sans-serif;
          color: var(--text-primary);
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s, background 0.2s;
          caret-color: var(--accent);
          -moz-appearance: textfield;
        }
        .otp-input::-webkit-outer-spin-button,
        .otp-input::-webkit-inner-spin-button { -webkit-appearance: none; }
        .otp-input:focus {
          border-color: rgba(59,130,246,0.5);
          box-shadow: 0 0 0 3px var(--accent-glow);
          background: var(--bg);
        }
        .otp-input.filled { border-color: rgba(59,130,246,0.3); }
        .otp-input:hover:not(:focus) { border-color: var(--border-hover); }

        /* Timer ring */
        .timer-wrap { display: flex; align-items: center; justify-content: center; gap: 12px; margin-bottom: 28px; }
        .timer-ring { position: relative; width: 44px; height: 44px; flex-shrink: 0; }
        .timer-ring svg { transform: rotate(-90deg); }
        .timer-track { fill: none; stroke: var(--surface-2); stroke-width: 3; }
        .timer-fill { fill: none; stroke-width: 3; stroke-linecap: round; transition: stroke-dashoffset 1s linear, stroke 0.5s; }
        .timer-text-wrap { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; }
        .timer-text { font-size: 10px; font-family: 'Outfit', sans-serif; font-weight: 500; color: var(--text-primary); }
        .timer-label { font-size: 12px; color: var(--text-secondary); font-family: 'Outfit', sans-serif; }
        .timer-expired { font-size: 12px; color: var(--danger); font-family: 'Outfit', sans-serif; }

        .submit-btn {
          width: 100%; height: 44px; background: var(--accent); color: white;
          border: none; border-radius: 8px; font-size: 14px; font-weight: 600;
          font-family: 'Outfit', sans-serif; cursor: pointer;
          display: flex; align-items: center; justify-content: center; gap: 8px;
          transition: background 0.2s, transform 0.15s, box-shadow 0.2s;
          position: relative; overflow: hidden; margin-bottom: 20px;
          letter-spacing: 0.2px;
        }
        .submit-btn::before { content: ''; position: absolute; inset: 0; background: linear-gradient(135deg, rgba(255,255,255,0.08) 0%, transparent 60%); pointer-events: none; }
        .submit-btn:hover:not(:disabled) { background: #2563EB; transform: translateY(-1px); box-shadow: 0 4px 16px rgba(59,130,246,0.35); }
        .submit-btn:active:not(:disabled) { transform: translateY(0); }
        .submit-btn:disabled { opacity: 0.5; cursor: not-allowed; }

        .resend-row { text-align: center; font-size: 13px; color: var(--text-tertiary); }
        .resend-btn { background: none; border: none; cursor: pointer; color: var(--accent); font-size: 13px; font-weight: 500; font-family: 'Outfit', sans-serif; padding: 0; transition: color 0.2s; }
        .resend-btn:hover:not(:disabled) { color: #60A5FA; }
        .resend-btn:disabled { color: var(--text-tertiary); cursor: not-allowed; }

        .bottom-note { position: absolute; bottom: 28px; font-size: 11px; font-family: 'DM Mono', monospace; color: var(--text-tertiary); }

        @keyframes spin { to { transform: rotate(360deg); } }

        @media (max-width: 768px) {
          .verify-root { grid-template-columns: 1fr; }
          .lp { display: none; }
          .rp { padding: 32px 24px; }
        }
      `}</style>

      <div className="verify-root">
        {/* LEFT PANEL */}
        <div className="lp">
          <div className="grid-bg" />
          <div className="lp-top">
            <a href="/" className="logo-mark">
              <div className="logo-icon">M2</div>
              <span className="logo-text">Media2AI</span>
            </a>
          </div>

          <div className="lp-mid">
            <h1 className="lp-headline">Almost<br />there — <span>verify</span><br />your email</h1>
            <p className="lp-desc">
              One last step. Enter the 6-digit code we sent to confirm your identity and activate your workspace.
            </p>

            {/* Progress steps */}
            <div className="steps">
              {[
                { label: "Create account", sub: "Email & password set", state: "done" },
                { label: "Verify email", sub: "Enter your 6-digit code", state: "active" },
                { label: "Set up workspace", sub: "Name and configure", state: "upcoming" },
              ].map((s, i) => (
                <div className="step" key={s.label}>
                  <div className="step-line-col">
                    <div className={`step-circle ${s.state}`}>
                      {s.state === "done" ? "✓" : i + 1}
                    </div>
                    {i < 2 && <div className="step-connector" />}
                  </div>
                  <div className="step-body">
                    <div className={`step-label ${s.state === "upcoming" ? "muted" : ""}`}>{s.label}</div>
                    <div className="step-sub">{s.sub}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="lp-bottom">
            <div className="security-row">
              <div className="sec-dot" />
              <span className="sec-text">256-bit encrypted · Code expires in 5 min</span>
            </div>
          </div>
        </div>

        {/* RIGHT PANEL */}
        <div className="rp">
          <div className={`form-wrap ${mounted ? "visible" : ""}`}>
            <div className="form-header">
              <div className="form-eyebrow">Email verification</div>
              <h2 className="form-title">Check your inbox</h2>
              <p style={{ fontSize: "14px", color: "var(--text-secondary)", marginBottom: "10px" }}>
                We sent a 6-digit code to
              </p>
              {email && (
                <div className="email-display">
                  <div className="email-dot" />
                  {maskedEmail}
                </div>
              )}
            </div>

            <form onSubmit={handleSubmit}>
              <div className="otp-label">Enter verification code</div>

              {/* OTP inputs */}
              <div className="otp-grid">
                {otp.map((digit, i) => (
                  <input
                    key={i}
                    ref={(el) => { inputRefs.current[i] = el; }}
                    id={`otp-${i}`}
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={digit}
                    onChange={(e) => handleOtpChange(i, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(i, e)}
                    onFocus={(e) => e.target.select()}
                    className={`otp-input ${digit ? "filled" : ""}`}
                    autoComplete={i === 0 ? "one-time-code" : "off"}
                    autoFocus={i === 0}
                  />
                ))}
              </div>

              {/* Timer */}
              <div className="timer-wrap">
                {timeLeft > 0 ? (
                  <>
                    <div className="timer-ring">
                      <svg width="44" height="44" viewBox="0 0 44 44">
                        <circle className="timer-track" cx="22" cy="22" r="18" />
                        <circle
                          className="timer-fill"
                          cx="22" cy="22" r="18"
                          stroke={timerColor}
                          strokeDasharray={`${2 * Math.PI * 18}`}
                          strokeDashoffset={`${2 * Math.PI * 18 * (1 - timerPercent / 100)}`}
                        />
                      </svg>
                      <div className="timer-text-wrap">
                        <span className="timer-text">{formatTime(timeLeft)}</span>
                      </div>
                    </div>
                    <span className="timer-label">Code expires in {formatTime(timeLeft)}</span>
                  </>
                ) : (
                  <span className="timer-expired">Code expired — please request a new one</span>
                )}
              </div>

              <button
                type="submit"
                className="submit-btn"
                disabled={loading || timeLeft === 0 || !isComplete}
              >
                {loading ? (
                  <>
                    <Loader2 size={15} style={{ animation: "spin 1s linear infinite" }} />
                    Verifying...
                  </>
                ) : (
                  <>
                    Verify email
                    <ArrowRight size={15} />
                  </>
                )}
              </button>
            </form>

            <div className="resend-row">
              Didn't receive it?{" "}
              <button
                type="button"
                className="resend-btn"
                onClick={handleResend}
                disabled={timeLeft > 240}
              >
                {timeLeft > 240
                  ? `Resend in ${formatTime(timeLeft - 240)}`
                  : "Resend code"
                }
              </button>
            </div>
          </div>

          <div className="bottom-note">Step 2 of 3 — account setup</div>
        </div>
      </div>
    </>
  );
}