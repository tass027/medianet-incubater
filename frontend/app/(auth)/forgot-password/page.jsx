'use client';

import { useState } from 'react';
import Link from 'next/link';

// ─────────────────────────────────────────────
// Inline SVG icons
// ─────────────────────────────────────────────
const IconMail = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
    <polyline points="22,6 12,13 2,6"/>
  </svg>
);
const IconEye = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
);
const IconEyeOff = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
    <line x1="1" y1="1" x2="23" y2="23"/>
  </svg>
);
const IconAlert = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <line x1="12" y1="8" x2="12" y2="12"/>
    <line x1="12" y1="16" x2="12.01" y2="16"/>
  </svg>
);
const IconCheck = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);
const IconArrowLeft = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="19" y1="12" x2="5" y2="12"/>
    <polyline points="12 19 5 12 12 5"/>
  </svg>
);
const IconShield = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
  </svg>
);
const IconLock = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
  </svg>
);

// ─────────────────────────────────────────────
// Password strength
// ─────────────────────────────────────────────
const getPasswordStrength = (pwd) => {
  if (!pwd) return null;
  let score = 0;
  if (pwd.length >= 8)           score++;
  if (pwd.length >= 12)          score++;
  if (/[A-Z]/.test(pwd))         score++;
  if (/[0-9]/.test(pwd))         score++;
  if (/[^A-Za-z0-9]/.test(pwd))  score++;
  if (score <= 1) return { label: 'Faible',  color: '#ef4444', width: '25%' };
  if (score <= 2) return { label: 'Moyen',   color: '#f59e0b', width: '50%' };
  if (score <= 3) return { label: 'Bien',    color: '#3b82f6', width: '75%' };
  return           { label: 'Fort',    color: '#10b981', width: '100%' };
};

// ─────────────────────────────────────────────
// Step indicator
// ─────────────────────────────────────────────
const StepDot = ({ n, current }) => {
  const done    = n < current;
  const active  = n === current;
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '6px',
    }}>
      <div style={{
        width: active ? '28px' : '8px',
        height: '8px',
        borderRadius: '4px',
        background: done ? '#10b981' : active ? '#1d6af4' : 'rgba(255,255,255,.2)',
        transition: 'all .4s ease',
      }} />
    </div>
  );
};

// ─────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────
export default function ForgotPasswordPage() {
  // step: 1 = email, 2 = code, 3 = new password, 4 = success
  const [step, setStep]           = useState(1);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');

  // Step 1
  const [email, setEmail]         = useState('');

  // Step 2
  const [code, setCode]           = useState(['', '', '', '', '', '']);
  const [resetToken, setResetToken] = useState('');

  // Step 3
  const [newPassword, setNewPassword]     = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNew, setShowNew]             = useState(false);
  const [showConfirm, setShowConfirm]     = useState(false);

  const strength = getPasswordStrength(newPassword);

  // ── Step 1 : send code
  const handleSendCode = async (e) => {
    e.preventDefault();
    setError('');
    if (!email) { setError('Veuillez entrer votre adresse email.'); return; }
    setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.message || 'Erreur lors de l\'envoi.'); setLoading(false); return; }
      setStep(2);
    } catch {
      setError('Erreur de connexion au serveur.');
    }
    setLoading(false);
  };

  // ── Step 2 : verify code
  const handleVerifyCode = async (e) => {
    e.preventDefault();
    setError('');
    const codeStr = code.join('');
    if (codeStr.length < 6) { setError('Veuillez entrer les 6 chiffres du code.'); return; }
    setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/auth/verify-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code: codeStr }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.message || 'Code incorrect.'); setLoading(false); return; }
      setResetToken(data.resetToken);
      setStep(3);
    } catch {
      setError('Erreur de connexion au serveur.');
    }
    setLoading(false);
  };

  // ── Step 3 : reset password
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    if (!newPassword) { setError('Veuillez entrer un nouveau mot de passe.'); return; }
    if (newPassword.length < 8) { setError('Le mot de passe doit contenir au moins 8 caractères.'); return; }
    if (newPassword !== confirmPassword) { setError('Les mots de passe ne correspondent pas.'); return; }
    setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, resetToken, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.message || 'Erreur lors de la réinitialisation.'); setLoading(false); return; }
      setStep(4);
    } catch {
      setError('Erreur de connexion au serveur.');
    }
    setLoading(false);
  };

  // ── Code input handler (OTP-style)
  const handleCodeInput = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    const newCode = [...code];
    newCode[index] = value.slice(-1);
    setCode(newCode);
    // Auto-focus next
    if (value && index < 5) {
      const next = document.getElementById(`otp-${index + 1}`);
      if (next) next.focus();
    }
  };

  const handleCodeKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      const prev = document.getElementById(`otp-${index - 1}`);
      if (prev) prev.focus();
    }
  };

  const handleCodePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    const newCode = [...code];
    for (let i = 0; i < 6; i++) newCode[i] = pasted[i] || '';
    setCode(newCode);
    const lastFilled = Math.min(pasted.length, 5);
    const el = document.getElementById(`otp-${lastFilled}`);
    if (el) el.focus();
  };

  // ─────────────────────────────────────────────
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,300&display=swap');
        :root {
          --blue-950:#0a1628; --blue-800:#0c2d6b; --blue-600:#1a56db; --blue-500:#1d6af4;
          --blue-400:#4d8af8; --blue-100:#dbeafe; --blue-50:#eff6ff;
          --yellow-400:#f5c400;
          --slate-700:#334155; --slate-500:#64748b; --slate-400:#94a3b8;
          --slate-200:#e2e8f0; --slate-100:#f1f5f9; --slate-50:#f8fafc;
          --white:#ffffff; --red-500:#ef4444; --green-500:#10b981;
        }
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}

        .fp-page {
          min-height:100vh; display:flex; flex-direction:column; align-items:center; justify-content:center;
          background:var(--blue-950);
          background-image:
            radial-gradient(ellipse 60% 50% at 20% 80%,rgba(26,86,219,.18) 0%,transparent 60%),
            radial-gradient(ellipse 50% 40% at 80% 10%,rgba(245,196,0,.09) 0%,transparent 55%);
          font-family:'DM Sans',sans-serif; padding:2rem; position:relative; overflow:hidden;
        }
        .fp-page::before {
          content:''; position:absolute; inset:0;
          background-image:linear-gradient(rgba(26,86,219,.06) 1px,transparent 1px),linear-gradient(90deg,rgba(26,86,219,.06) 1px,transparent 1px);
          background-size:60px 60px; pointer-events:none;
        }

        .fp-card {
          position:relative; width:480px; max-width:100%;
          border-radius:24px; background:var(--white);
          box-shadow:0 32px 80px rgba(10,22,40,.28),0 4px 20px rgba(10,22,40,.08);
          overflow:hidden; border:1px solid rgba(255,255,255,.06);
          animation:fadeUp .6s ease both;
        }
        @keyframes fadeUp{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:translateY(0)}}

        /* Blue top band */
        .fp-top {
          background:linear-gradient(135deg,#1a56db 0%,#0c2d6b 100%);
          padding:2rem 2.5rem 1.8rem;
          position:relative; overflow:hidden;
        }
        .fp-top::after {
          content:''; position:absolute; bottom:-40px; right:-20px;
          width:160px; height:160px; border-radius:50%;
          border:30px solid rgba(245,196,0,.08); pointer-events:none;
        }
        .fp-brand { display:flex; align-items:baseline; margin-bottom:.15rem; }
        .fp-b1 { font-family:'Syne',sans-serif; font-size:1.4rem; font-weight:800; color:rgba(255,255,255,.4); letter-spacing:-.5px; }
        .fp-b2 { font-family:'Syne',sans-serif; font-size:1.4rem; font-weight:800; color:var(--white); letter-spacing:-.5px; }
        .fp-bdot { width:5px; height:5px; background:var(--yellow-400); border-radius:50%; margin-left:2px; margin-bottom:10px; flex-shrink:0; }
        .fp-tagline { font-size:.55rem; letter-spacing:3px; text-transform:uppercase; color:rgba(255,255,255,.3); font-weight:500; margin-bottom:1.4rem; }

        /* Step dots */
        .fp-steps { display:flex; align-items:center; gap:6px; }

        /* Icon circle */
        .fp-icon-wrap {
          width:52px; height:52px; border-radius:14px;
          background:rgba(255,255,255,.12); backdrop-filter:blur(8px);
          display:flex; align-items:center; justify-content:center;
          color:var(--white); margin-bottom:1rem;
          border:1px solid rgba(255,255,255,.15);
        }
        .fp-top-title { font-family:'Syne',sans-serif; font-size:1.35rem; font-weight:700; color:var(--white); margin-bottom:.3rem; line-height:1.2; }
        .fp-top-sub   { font-size:.78rem; color:rgba(255,255,255,.5); font-weight:300; }

        /* Body */
        .fp-body { padding:1.8rem 2.5rem 2rem; }

        .fp-f   { margin-bottom:.7rem; }
        .fp-lbl { display:block; font-size:.62rem; font-weight:700; color:var(--slate-700); text-transform:uppercase; letter-spacing:.8px; margin-bottom:.28rem; }
        .fp-iw  { position:relative; }
        .fp-inp {
          width:100%; padding:.62rem .9rem;
          border:1.5px solid var(--slate-200); border-radius:10px;
          font-size:.83rem; font-family:inherit; color:var(--blue-950);
          background:var(--slate-50); outline:none;
          transition:border-color .2s,box-shadow .2s,background .2s;
        }
        .fp-inp::placeholder { color:var(--slate-400); font-weight:300; }
        .fp-inp:focus { border-color:var(--blue-500); background:var(--white); box-shadow:0 0 0 3px rgba(29,106,244,.1); }
        .fp-inp.ico { padding-right:2.4rem; }
        .fp-iico { position:absolute; right:.85rem; top:50%; transform:translateY(-50%); color:var(--slate-400); cursor:pointer; padding:2px; transition:color .15s; line-height:0; }
        .fp-iico:hover { color:var(--blue-500); }

        /* OTP inputs */
        .fp-otp { display:flex; gap:.55rem; justify-content:center; margin:.25rem 0; }
        .fp-otp-inp {
          width:46px; height:54px; text-align:center;
          border:1.5px solid var(--slate-200); border-radius:12px;
          font-size:1.3rem; font-weight:700; font-family:'Syne',sans-serif;
          color:var(--blue-950); background:var(--slate-50); outline:none;
          transition:border-color .2s,box-shadow .2s,background .2s,transform .1s;
          caret-color:var(--blue-500);
        }
        .fp-otp-inp:focus {
          border-color:var(--blue-500); background:var(--white);
          box-shadow:0 0 0 3px rgba(29,106,244,.12);
          transform:scale(1.04);
        }
        .fp-otp-inp.filled { border-color:var(--blue-400); background:var(--blue-50); color:var(--blue-600); }

        /* Strength bar */
        .fp-strength { margin-top:.3rem; display:flex; align-items:center; gap:.5rem; }
        .fp-strength-bar-wrap { flex:1; height:3px; background:var(--slate-200); border-radius:2px; overflow:hidden; }
        .fp-strength-bar { height:100%; border-radius:2px; transition:width .3s ease,background-color .3s ease; }
        .fp-strength-label { font-size:.62rem; font-weight:600; flex-shrink:0; min-width:32px; text-align:right; }

        /* Match */
        .fp-match { display:flex; align-items:center; gap:.3rem; font-size:.65rem; margin-top:.3rem; font-weight:500; }
        .fp-match.ok { color:var(--green-500); }
        .fp-match.no { color:var(--red-500); }

        /* Error */
        .fp-err {
          display:flex; align-items:center; gap:.4rem;
          background:#fff5f5; border:1px solid #fecaca;
          color:var(--red-500); font-size:.75rem; font-weight:500;
          padding:.5rem .85rem; border-radius:8px; margin-bottom:.8rem;
        }

        /* Button */
        .fp-btn {
          width:100%; padding:.76rem;
          background:linear-gradient(135deg,var(--blue-500) 0%,var(--blue-800) 100%);
          color:var(--white); border:none; border-radius:10px;
          font-size:.85rem; font-weight:600; font-family:inherit; cursor:pointer; letter-spacing:.3px;
          transition:transform .15s,box-shadow .15s;
          box-shadow:0 4px 18px rgba(29,106,244,.38);
          display:flex; align-items:center; justify-content:center; gap:.5rem;
          margin-top:.3rem;
        }
        .fp-btn:hover:not(:disabled) { transform:translateY(-1px); box-shadow:0 6px 24px rgba(29,106,244,.48); }
        .fp-btn:disabled { opacity:.7; cursor:not-allowed; }
        @keyframes spin{to{transform:rotate(360deg)}}
        .fp-spin { width:14px; height:14px; border:2px solid rgba(255,255,255,.3); border-top-color:#fff; border-radius:50%; animation:spin .7s linear infinite; }

        /* Back link */
        .fp-back {
          display:inline-flex; align-items:center; gap:.35rem;
          font-size:.72rem; color:var(--slate-400); text-decoration:none;
          font-weight:500; margin-bottom:1.2rem; cursor:pointer; border:none; background:none;
          transition:color .15s; padding:0;
        }
        .fp-back:hover { color:var(--blue-500); }

        /* Resend */
        .fp-resend { margin-top:.9rem; font-size:.72rem; color:var(--slate-400); text-align:center; font-weight:300; }
        .fp-resend button { color:var(--blue-500); font-weight:600; background:none; border:none; cursor:pointer; font-family:inherit; font-size:inherit; }
        .fp-resend button:hover { color:var(--blue-800); }

        /* Helper text */
        .fp-hint { font-size:.72rem; color:var(--slate-400); margin-bottom:.9rem; line-height:1.6; font-weight:300; }
        .fp-hint strong { color:var(--blue-950); font-weight:600; }

        /* Success */
        .fp-success-icon {
          width:72px; height:72px; border-radius:50%;
          background:#10b98120; color:var(--green-500);
          display:flex; align-items:center; justify-content:center;
          margin:0 auto 1.25rem;
          animation:scaleIn .4s cubic-bezier(0.34,1.56,0.64,1) both;
        }
        @keyframes scaleIn{from{opacity:0;transform:scale(.5)}to{opacity:1;transform:scale(1)}}
        .fp-success-title { font-family:'Syne',sans-serif; font-size:1.4rem; font-weight:700; color:var(--blue-950); text-align:center; margin-bottom:.5rem; }
        .fp-success-msg { font-size:.82rem; color:var(--slate-500); text-align:center; line-height:1.7; margin-bottom:1.5rem; font-weight:300; }

        .fp-link { margin-top:.85rem; font-size:.74rem; color:var(--slate-400); text-align:center; font-weight:300; }
        .fp-link a { color:var(--blue-500); font-weight:600; text-decoration:none; }
        .fp-link a:hover { color:var(--blue-800); }
      `}</style>

      <div className="fp-page">
        <div className="fp-card">

          {/* ── TOP BAND ── */}
          {step < 4 && (
            <div className="fp-top">
              <div className="fp-brand">
                <span className="fp-b1">MEDIA</span>
                <span className="fp-b2">NET</span>
                <span className="fp-bdot" />
              </div>
              <div className="fp-tagline">Innovation Platform</div>

              <div className="fp-steps">
                {[1, 2, 3].map(n => <StepDot key={n} n={n} current={step} />)}
              </div>

              <div style={{ marginTop: '1.2rem' }}>
                <div className="fp-icon-wrap">
                  {step === 1 ? <IconMail /> : step === 2 ? <IconShield /> : <IconLock />}
                </div>
                <div className="fp-top-title">
                  {step === 1 && 'Mot de passe oublié'}
                  {step === 2 && 'Vérification du code'}
                  {step === 3 && 'Nouveau mot de passe'}
                </div>
                <div className="fp-top-sub">
                  {step === 1 && 'Entrez votre email pour recevoir un code'}
                  {step === 2 && 'Entrez le code à 6 chiffres reçu par email'}
                  {step === 3 && 'Choisissez un nouveau mot de passe sécurisé'}
                </div>
              </div>
            </div>
          )}

          {/* ── BODY ── */}
          <div className="fp-body">

            {/* ════ STEP 1 — Email ════ */}
            {step === 1 && (
              <form onSubmit={handleSendCode} noValidate>
                {error && <div className="fp-err"><IconAlert />{error}</div>}

                <div className="fp-hint">
                  Entrez l'adresse email associée à votre compte. Nous vous enverrons un code de vérification.
                </div>

                <div className="fp-f">
                  <label className="fp-lbl">Adresse Email</label>
                  <div className="fp-iw">
                    <input
                      className="fp-inp ico"
                      type="email"
                      placeholder="nom@organisation.com"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      autoComplete="email"
                    />
                    <span className="fp-iico"><IconMail /></span>
                  </div>
                </div>

                <button className="fp-btn" type="submit" disabled={loading}>
                  {loading ? <><span className="fp-spin" /> Envoi en cours…</> : 'Envoyer le code'}
                </button>

                <div className="fp-link" style={{ marginTop: '1rem' }}>
                  <Link href="/login">
                    <button type="button" className="fp-back"><IconArrowLeft /> Retour à la connexion</button>
                  </Link>
                </div>
              </form>
            )}

            {/* ════ STEP 2 — OTP Code ════ */}
            {step === 2 && (
              <form onSubmit={handleVerifyCode} noValidate>
                <button type="button" className="fp-back" onClick={() => { setError(''); setCode(['','','','','','']); setStep(1); }}>
                  <IconArrowLeft /> Modifier l'email
                </button>

                {error && <div className="fp-err"><IconAlert />{error}</div>}

                <div className="fp-hint">
                  Un code a été envoyé à <strong>{email}</strong>. Ce code est valable <strong>10 minutes</strong>.
                </div>

                <div className="fp-f">
                  <label className="fp-lbl" style={{ textAlign: 'center', display: 'block', marginBottom: '.6rem' }}>Code de vérification</label>
                  <div className="fp-otp" onPaste={handleCodePaste}>
                    {code.map((digit, i) => (
                      <input
                        key={i}
                        id={`otp-${i}`}
                        className={`fp-otp-inp${digit ? ' filled' : ''}`}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={e => handleCodeInput(i, e.target.value)}
                        onKeyDown={e => handleCodeKeyDown(i, e)}
                        autoFocus={i === 0}
                      />
                    ))}
                  </div>
                </div>

                <button className="fp-btn" type="submit" disabled={loading || code.join('').length < 6}>
                  {loading ? <><span className="fp-spin" /> Vérification…</> : 'Vérifier le code'}
                </button>

                <div className="fp-resend">
                  Vous n'avez pas reçu le code ?{' '}
                  <button
                    type="button"
                    onClick={async () => {
                      setError('');
                      setCode(['','','','','','']);
                      try {
                        await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/auth/forgot-password`, {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ email }),
                        });
                      } catch {}
                    }}
                  >
                    Renvoyer
                  </button>
                </div>
              </form>
            )}

            {/* ════ STEP 3 — New Password ════ */}
            {step === 3 && (
              <form onSubmit={handleResetPassword} noValidate>
                <button type="button" className="fp-back" onClick={() => { setError(''); setStep(2); }}>
                  <IconArrowLeft /> Retour
                </button>

                {error && <div className="fp-err"><IconAlert />{error}</div>}

                <div className="fp-f">
                  <label className="fp-lbl">Nouveau mot de passe</label>
                  <div className="fp-iw">
                    <input
                      className="fp-inp ico"
                      type={showNew ? 'text' : 'password'}
                      placeholder="Min. 8 caractères"
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      autoComplete="new-password"
                    />
                    <span className="fp-iico" onClick={() => setShowNew(p => !p)}>
                      {showNew ? <IconEyeOff /> : <IconEye />}
                    </span>
                  </div>
                  {strength && (
                    <div className="fp-strength">
                      <div className="fp-strength-bar-wrap">
                        <div className="fp-strength-bar" style={{ width: strength.width, backgroundColor: strength.color }} />
                      </div>
                      <span className="fp-strength-label" style={{ color: strength.color }}>{strength.label}</span>
                    </div>
                  )}
                </div>

                <div className="fp-f">
                  <label className="fp-lbl">Confirmer le mot de passe</label>
                  <div className="fp-iw">
                    <input
                      className="fp-inp ico"
                      type={showConfirm ? 'text' : 'password'}
                      placeholder="Retapez votre mot de passe"
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      autoComplete="new-password"
                    />
                    <span className="fp-iico" onClick={() => setShowConfirm(p => !p)}>
                      {showConfirm ? <IconEyeOff /> : <IconEye />}
                    </span>
                  </div>
                  {confirmPassword && (
                    <div className={`fp-match ${newPassword === confirmPassword ? 'ok' : 'no'}`}>
                      {newPassword === confirmPassword
                        ? <><IconCheck /> Les mots de passe correspondent</>
                        : <><IconAlert /> Les mots de passe ne correspondent pas</>}
                    </div>
                  )}
                </div>

                <button className="fp-btn" type="submit" disabled={loading}>
                  {loading ? <><span className="fp-spin" /> Réinitialisation…</> : 'Réinitialiser le mot de passe'}
                </button>
              </form>
            )}

            {/* ════ STEP 4 — Success ════ */}
            {step === 4 && (
              <div style={{ textAlign: 'center', paddingTop: '.5rem' }}>
                <div className="fp-success-icon">
                  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                </div>
                <div className="fp-success-title">Mot de passe réinitialisé !</div>
                <div className="fp-success-msg">
                  Votre mot de passe a été mis à jour avec succès.<br />
                  Vous pouvez maintenant vous connecter avec votre nouveau mot de passe.
                </div>
                <Link href="/login">
                  <button className="fp-btn" type="button" style={{ maxWidth: '280px', margin: '0 auto' }}>
                    Se connecter
                  </button>
                </Link>
              </div>
            )}

          </div>
        </div>
      </div>
    </>
  );
}