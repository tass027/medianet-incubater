'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useDispatch } from 'react-redux';
// app/(auth)/login/page.jsx  line 6
import { login, registerFounder } from '@/app/store/slices/authSlice';import Link from 'next/link';

// ─────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────
const ROLE_ROUTES = {
  applicant: '/dashboard/applicant/dashboard',
  founder:   '/dashboard/founder/dashboard',
};

// ─────────────────────────────────────────────
// Inline SVG icons
// ─────────────────────────────────────────────
const IconRocket = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2L2 7l10 5 10-5-10-5z"/>
    <path d="M2 17l10 5 10-5"/>
    <path d="M2 12l10 5 10-5"/>
  </svg>
);
const IconSpontane = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M13 10V3L4 14h7v7l9-11h-7z"/>
  </svg>
);
const IconMail = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
    <polyline points="22,6 12,13 2,6"/>
  </svg>
);
const IconEyeOff = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
    <line x1="1" y1="1" x2="23" y2="23"/>
  </svg>
);
const IconEye = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
    <circle cx="12" cy="12" r="3"/>
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

// ─────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────
export default function ExternalAuthPage() {
  const router   = useRouter();
  const dispatch = useDispatch();

  // view: 'login' | 'register'
  const [view, setView]         = useState('login');
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const [success, setSuccess]   = useState('');

  // Context badge from URL query params
  // redirectCtx: { type: 'programme'|'spontane', progId?, progName? }
  const [redirectCtx, setRedirectCtx] = useState(null);

  // Login fields
  const [loginEmail, setLoginEmail]       = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register fields (simplified)
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail]       = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirm, setRegConfirm]   = useState('');

  const isRegister = view === 'register';

  // ── Read URL context on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const redirect = params.get('redirect');
    if (redirect === 'programme') {
      setRedirectCtx({
        type: 'programme',
        progId: params.get('progId'),
        progName: params.get('progName'),
      });
    } else if (redirect === 'spontane') {
      setRedirectCtx({ type: 'spontane' });
    }
  }, []);

  const reset = () => {
    setError('');
    setSuccess('');
    setRegEmail('');
    setRegPassword('');
    setRegConfirm('');
    setShowPass(false);
    setShowConfirm(false);
  };

  // ── Password strength indicator
  const getPasswordStrength = (pwd) => {
    if (!pwd) return null;
    let score = 0;
    if (pwd.length >= 8)  score++;
    if (pwd.length >= 12) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;
    if (score <= 1) return { label: 'Faible',    color: '#ef4444', width: '25%' };
    if (score <= 2) return { label: 'Moyen',     color: '#f59e0b', width: '50%' };
    if (score <= 3) return { label: 'Bien',      color: '#3b82f6', width: '75%' };
    return           { label: 'Fort',       color: '#10b981', width: '100%' };
  };
  const strength = getPasswordStrength(regPassword);

  // ── SIGN IN
  const handleSignIn = async (e) => {
    e.preventDefault();
    setError('');
    if (!loginEmail || !loginPassword) {
      setError('Veuillez remplir tous les champs.');
      return;
    }
    setLoading(true);
    try {
      const result = await dispatch(login({ email: loginEmail, password: loginPassword })).unwrap();
      const userRole = result.user?.role;
      if (userRole === 'admin' || userRole === 'mentor') {
        setError('Ce compte appartient au portail interne MediaNet. Veuillez utiliser le portail staff.');
        setLoading(false);
        return;
      }
      // After login, redirect to programme application if context exists
    if (redirectCtx?.type === 'programme' && redirectCtx.progId) {
      const params = new URLSearchParams({
        programmeId: redirectCtx.progId,
        programmeName: redirectCtx.progName || '',
      });
      router.push(`/dashboard/startup/apply?${params.toString()}`);
    } else if (redirectCtx?.type === 'spontane') {
      router.push('/dashboard/startup/apply?type=spontane');
    } else {
      router.push('/dashboard/startup/apply');
    }
    } catch (err) {
      setError(typeof err === 'string' ? err : 'Email ou mot de passe incorrect.');
      setLoading(false);
    }
  };

  // ── REGISTER (unified, simplified)
    const handleRegister = async (e) => {
    e.preventDefault();
    setError('');

    if (!regName || regName.trim().length < 2) {
      setError('Veuillez entrer votre nom complet (min. 2 caractères).');
      return;
    }
    if (!regEmail) { setError('Veuillez entrer votre email.'); return; }
    if (!regPassword) { setError('Veuillez entrer un mot de passe.'); return; }
    if (regPassword.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères.');
      return;
    }
    if (regPassword !== regConfirm) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }

    setLoading(true);
    try {
      await dispatch(registerFounder({
        name: regName,
        email: regEmail,
        password: regPassword,
      })).unwrap();
      reset();
      setRegName('');
      setView('login');
      setSuccess('Compte créé ! Vérifiez votre email pour vous connecter.');
      } catch (err) {
        if (typeof err === 'string') {
          setError(err);
        } else if (err?.details?.length) {
          setError(err.details.join(' • '));
        } else if (err?.message) {
          setError(err.message);
        } else {
          setError("L'inscription a échoué.");
        }
      }
    setLoading(false);
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
          --white:#ffffff; --red-500:#ef4444; --green-500:#10b981; --green-50:#f0fdf4;
          --ease-slide:cubic-bezier(0.76,0,0.24,1);
        }
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}

        .mn-page {
          min-height:100vh; display:flex; flex-direction:column; align-items:center; justify-content:center;
          background:var(--blue-950);
          background-image:
            radial-gradient(ellipse 60% 50% at 20% 80%,rgba(26,86,219,.18) 0%,transparent 60%),
            radial-gradient(ellipse 50% 40% at 80% 10%,rgba(245,196,0,.09) 0%,transparent 55%);
          font-family:'DM Sans',sans-serif; padding:2rem; position:relative; overflow:hidden;
        }
        .mn-page::before {
          content:''; position:absolute; inset:0;
          background-image:linear-gradient(rgba(26,86,219,.06) 1px,transparent 1px),linear-gradient(90deg,rgba(26,86,219,.06) 1px,transparent 1px);
          background-size:60px 60px; pointer-events:none;
        }

        /* ── BANNER ── */
        .mn-banner {
          position:relative; z-index:10; margin-bottom:1.2rem;
          display:flex; align-items:center; gap:.6rem;
          background:rgba(255,255,255,.04); border:1px solid rgba(245,196,0,.2);
          border-radius:12px; padding:.6rem 1rem;
          font-size:.72rem; color:rgba(255,255,255,.5); font-family:'DM Sans',sans-serif;
          animation:fadeUp .5s ease both;
        }
        .mn-banner a { color:var(--yellow-400); font-weight:600; text-decoration:none; display:inline-flex; align-items:center; gap:.3rem; transition:opacity .2s; }
        .mn-banner a:hover { opacity:.8; }

        /* ── CARD ── */
        .mn-card {
          position:relative; width:860px; max-width:100%; min-height:520px;
          border-radius:24px;
          box-shadow:0 32px 80px rgba(10,22,40,.22),0 4px 20px rgba(10,22,40,.08);
          overflow:hidden; border:1px solid rgba(255,255,255,.06);
          animation:fadeUp .6s ease .1s both;
        }
        .mn-card.reg { min-height:480px; }
        @keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}

        /* ── PANELS ── */
        .mn-panel {
          position:absolute; top:0; width:50%; height:100%;
          display:flex; align-items:center; justify-content:center;
          padding:2.2rem 2.6rem; background:var(--white);
          transition:transform .7s var(--ease-slide),opacity .4s ease;
          will-change:transform,opacity;
          overflow-y:auto; scrollbar-width:thin; scrollbar-color:var(--slate-200) transparent;
        }
        .mn-panel::-webkit-scrollbar{width:3px}
        .mn-panel::-webkit-scrollbar-thumb{background:var(--slate-200);border-radius:4px}
        .mn-login    { left:0; z-index:2; opacity:1; pointer-events:auto; }
        .mn-register { left:0; z-index:1; opacity:0; pointer-events:none; align-items:flex-start; padding-top:2.5rem; padding-bottom:2.5rem; }
        .mn-card.reg .mn-login    { transform:translateX(100%); opacity:0; pointer-events:none; }
        .mn-card.reg .mn-register { transform:translateX(100%); opacity:1; pointer-events:auto; z-index:3; }

        /* ── TOGGLE PANEL ── */
        .mn-toggle-wrap {
          position:absolute; top:0; left:50%; width:50%; height:100%; z-index:20;
          overflow:hidden; border-radius:160px 0 0 160px;
          transition:transform .7s var(--ease-slide),border-radius .7s ease;
        }
        .mn-card.reg .mn-toggle-wrap { transform:translateX(-100%); border-radius:0 160px 160px 0; }
        .mn-toggle {
          position:relative; left:-100%; width:200%; height:100%;
          background:linear-gradient(155deg,#1a56db 0%,#0c2d6b 55%,#0a1628 100%);
          display:flex; transition:transform .7s var(--ease-slide); overflow:hidden;
        }
        .mn-toggle::before { content:''; position:absolute; top:0; left:50%; width:3px; height:100%; background:linear-gradient(180deg,transparent,var(--yellow-400),transparent); opacity:.4; }
        .mn-toggle::after  { content:''; position:absolute; bottom:-80px; right:30px; width:280px; height:280px; border-radius:50%; border:40px solid rgba(245,196,0,.06); pointer-events:none; }
        .mn-card.reg .mn-toggle { transform:translateX(50%); }
        .mn-tpanel { width:50%; height:100%; display:flex; flex-direction:column; align-items:flex-start; justify-content:center; padding:3rem 2.8rem; flex-shrink:0; position:relative; z-index:1; }
        .mn-tl { opacity:0; transition:opacity .35s ease .25s; }
        .mn-tr { opacity:1; transition:opacity .35s ease .25s; }
        .mn-card.reg .mn-tl { opacity:1; }
        .mn-card.reg .mn-tr { opacity:0; }
        .mn-brand { display:flex; align-items:baseline; margin-bottom:.1rem; }
        .mn-b1 { font-family:'Syne',sans-serif; font-size:2rem; font-weight:800; color:rgba(255,255,255,.45); letter-spacing:-.5px; }
        .mn-b2 { font-family:'Syne',sans-serif; font-size:2rem; font-weight:800; color:var(--white); letter-spacing:-.5px; }
        .mn-bdot { width:6px; height:6px; background:var(--yellow-400); border-radius:50%; margin-left:3px; margin-bottom:14px; flex-shrink:0; }
        .mn-tagline  { font-size:.6rem; letter-spacing:3px; text-transform:uppercase; color:rgba(255,255,255,.3); margin-bottom:2.8rem; font-weight:500; }
        .mn-teyebrow { font-size:.65rem; font-weight:600; letter-spacing:2px; text-transform:uppercase; color:var(--yellow-400); margin-bottom:.5rem; }
        .mn-ttitle   { font-family:'Syne',sans-serif; font-size:1.75rem; font-weight:700; color:var(--white); line-height:1.15; margin-bottom:.9rem; }
        .mn-tdesc    { font-size:.82rem; color:rgba(255,255,255,.55); line-height:1.7; margin-bottom:2rem; font-weight:300; }
        .mn-corner   { position:absolute; top:2rem; right:2.5rem; width:8px; height:8px; background:var(--yellow-400); border-radius:50%; box-shadow:0 0 12px var(--yellow-400); }
        .mn-ghost {
          display:inline-flex; align-items:center; gap:.5rem;
          background:transparent; border:1.5px solid rgba(255,255,255,.25); color:var(--white);
          padding:.6rem 1.6rem; border-radius:8px; font-size:.75rem; font-weight:600; font-family:inherit;
          text-transform:uppercase; letter-spacing:1.2px; cursor:pointer; transition:border-color .2s,color .2s,transform .15s;
        }
        .mn-ghost:hover { border-color:var(--yellow-400); color:var(--yellow-400); transform:translateY(-1px); }
        .mn-ghost svg { transition:transform .2s; }
        .mn-ghost:hover svg { transform:translateX(3px); }

        /* ── FORM STRUCTURE ── */
        .mn-fi { width:100%; display:flex; flex-direction:column; align-items:stretch; }
        .mn-eyebrow { font-size:.62rem; font-weight:700; letter-spacing:2.5px; text-transform:uppercase; color:var(--blue-500); margin-bottom:.35rem; }
        .mn-title   { font-family:'Syne',sans-serif; font-size:1.55rem; font-weight:700; color:var(--blue-950); letter-spacing:-.5px; line-height:1.15; margin-bottom:.25rem; }
        .mn-sub     { font-size:.76rem; color:var(--slate-400); margin-bottom:1.2rem; font-weight:300; }

        /* ── CONTEXT BADGE ── */
        .mn-ctx-badge {
          display:flex; align-items:center; gap:10px;
          padding:10px 14px; border-radius:12px; margin-bottom:1rem;
          transition:transform .2s;
        }
        .mn-ctx-badge:hover { transform:translateY(-1px); }
        .mn-ctx-programme { background:#eff6ff; border:1px solid #bfdbfe; }
        .mn-ctx-spontane  { background:#fef9ec; border:1px solid #fde68a; }
        .mn-ctx-icon {
          width:34px; height:34px; border-radius:8px; flex-shrink:0;
          display:flex; align-items:center; justify-content:center;
        }
        .mn-ctx-icon-programme { background:#dbeafe; color:var(--blue-600); }
        .mn-ctx-icon-spontane  { background:#fef3c7; color:#d97706; }
        .mn-ctx-top  { font-size:.6rem; font-weight:700; letter-spacing:.8px; text-transform:uppercase; color:var(--slate-500); margin-bottom:1px; }
        .mn-ctx-main { font-size:.78rem; font-weight:600; color:var(--blue-950); }

        /* ── FIELDS ── */
        .mn-f   { margin-bottom:.65rem; }
        .mn-lbl { display:block; font-size:.62rem; font-weight:700; color:var(--slate-700); text-transform:uppercase; letter-spacing:.8px; margin-bottom:.26rem; }
        .mn-lbl span { color:var(--red-500); margin-left:2px; }

        .mn-iw  { position:relative; }
        .mn-inp {
          width:100%; padding:.6rem .9rem;
          border:1.5px solid var(--slate-200); border-radius:10px;
          font-size:.83rem; font-family:inherit; color:var(--blue-950);
          background:var(--slate-50); outline:none;
          transition:border-color .2s,box-shadow .2s,background .2s;
        }
        .mn-inp::placeholder { color:var(--slate-400); font-weight:300; }
        .mn-inp:focus { border-color:var(--blue-500); background:var(--white); box-shadow:0 0 0 3px rgba(29,106,244,.1); }
        .mn-inp.ico { padding-right:2.4rem; }
        .mn-iico { position:absolute; right:.85rem; top:50%; transform:translateY(-50%); color:var(--slate-400); cursor:pointer; padding:2px; transition:color .15s; line-height:0; }
        .mn-iico:hover { color:var(--blue-500); }

        /* ── PASSWORD STRENGTH ── */
        .mn-strength {
          margin-top:.3rem; display:flex; align-items:center; gap:.5rem;
        }
        .mn-strength-bar-wrap {
          flex:1; height:3px; background:var(--slate-200); border-radius:2px; overflow:hidden;
        }
        .mn-strength-bar {
          height:100%; border-radius:2px; transition:width .3s ease, background-color .3s ease;
        }
        .mn-strength-label {
          font-size:.62rem; font-weight:600; flex-shrink:0; min-width:32px; text-align:right;
        }

        /* ── PASSWORD MATCH ── */
        .mn-match {
          display:flex; align-items:center; gap:.3rem;
          font-size:.65rem; margin-top:.3rem; font-weight:500;
        }
        .mn-match.ok    { color:var(--green-500); }
        .mn-match.no    { color:var(--red-500); }

        /* ── MISC ── */
        .mn-forgot { font-size:.72rem; color:var(--blue-500); text-decoration:none; font-weight:600; text-align:right; display:block; margin-top:-.35rem; margin-bottom:1rem; }
        .mn-forgot:hover { color:var(--blue-800); }
        .mn-err {
          display:flex; align-items:center; gap:.4rem;
          background:#fff5f5; border:1px solid #fecaca;
          color:var(--red-500); font-size:.75rem; font-weight:500;
          padding:.5rem .85rem; border-radius:8px; margin-bottom:.75rem;
        }
        .mn-success {
          display:flex; align-items:center; gap:.4rem;
          background:var(--green-50); border:1px solid #6ee7b7;
          color:var(--green-500); font-size:.75rem; font-weight:500;
          padding:.5rem .85rem; border-radius:8px; margin-bottom:.75rem;
        }
        .mn-btn {
          width:100%; padding:.76rem;
          background:linear-gradient(135deg,var(--blue-500) 0%,var(--blue-800) 100%);
          color:var(--white); border:none; border-radius:10px;
          font-size:.85rem; font-weight:600; font-family:inherit; cursor:pointer; letter-spacing:.3px;
          transition:transform .15s,box-shadow .15s;
          box-shadow:0 4px 18px rgba(29,106,244,.38);
          display:flex; align-items:center; justify-content:center; gap:.5rem;
          margin-top:.25rem;
        }
        .mn-btn:hover:not(:disabled) { transform:translateY(-1px); box-shadow:0 6px 24px rgba(29,106,244,.48); }
        .mn-btn:disabled { opacity:.7; cursor:not-allowed; }
        @keyframes spin{to{transform:rotate(360deg)}}
        .mn-spin { width:14px; height:14px; border:2px solid rgba(255,255,255,.3); border-top-color:#fff; border-radius:50%; animation:spin .7s linear infinite; }
        .mn-link { margin-top:.8rem; font-size:.75rem; color:var(--slate-400); text-align:center; font-weight:300; }
        .mn-link a { color:var(--blue-500); font-weight:600; text-decoration:none; }
        .mn-link a:hover { color:var(--blue-800); }
      `}</style>

      <div className="mn-page">

        {/* Internal portal banner */}
        <div className="mn-banner">
          <svg style={{color:'var(--yellow-400)',flexShrink:0}} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2"/>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
          Vous êtes un employé MediaNet ?{' '}
          <Link href="/internal/login">
            Accéder au portail interne
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="12" x2="19" y2="12"/>
              <polyline points="12 5 19 12 12 19"/>
            </svg>
          </Link>
        </div>

        <div className={`mn-card${isRegister ? ' reg' : ''}`}>

          {/* ══════════ LOGIN ══════════ */}
          <div className="mn-panel mn-login">
            <form className="mn-fi" onSubmit={handleSignIn} noValidate>
              <div className="mn-eyebrow">Espace Public</div>
              <div className="mn-title">Bienvenue sur<br />MediaNet</div>
              <div className="mn-sub">Connectez-vous à votre espace personnel</div>

              {/* ── Context badge (programme or spontane) */}
              {redirectCtx && (
                <div className={`mn-ctx-badge mn-ctx-${redirectCtx.type}`}>
                  <div className={`mn-ctx-icon mn-ctx-icon-${redirectCtx.type}`}>
                    {redirectCtx.type === 'programme' ? <IconRocket /> : <IconSpontane />}
                  </div>
                  <div>
                    <div className="mn-ctx-top">
                      {redirectCtx.type === 'programme' ? 'Candidature pour' : 'Candidature'}
                    </div>
                    <div className="mn-ctx-main">
                      {redirectCtx.type === 'programme'
                        ? redirectCtx.progName
                        : 'Spontanée · Ouvert en permanence'}
                    </div>
                  </div>
                </div>
              )}

              {error && view === 'login' && <div className="mn-err"><IconAlert />{error}</div>}
              {success && <div className="mn-success"><IconCheck />{success}</div>}

              <div className="mn-f">
                <label className="mn-lbl">Adresse Email</label>
                <div className="mn-iw">
                  <input
                    className="mn-inp ico"
                    type="email"
                    placeholder="nom@organisation.com"
                    value={loginEmail}
                    onChange={e => setLoginEmail(e.target.value)}
                    autoComplete="email"
                  />
                  <span className="mn-iico"><IconMail /></span>
                </div>
              </div>

              <div className="mn-f">
                <label className="mn-lbl">Mot de passe</label>
                <div className="mn-iw">
                  <input
                    className="mn-inp ico"
                    type={showPass ? 'text' : 'password'}
                    placeholder="Entrez votre mot de passe"
                    value={loginPassword}
                    onChange={e => setLoginPassword(e.target.value)}
                    autoComplete="current-password"
                  />
                  <span className="mn-iico" onClick={() => setShowPass(p => !p)}>
                    {showPass ? <IconEyeOff /> : <IconEye />}
                  </span>
                </div>
              </div>

              <Link href="/forgot-password" className="mn-forgot">Mot de passe oublié ?</Link>

              <button className="mn-btn" type="submit" disabled={loading}>
                {loading
                  ? <><span className="mn-spin" /> Connexion…</>
                  : redirectCtx
                    ? 'Se connecter et candidater'
                    : 'Se connecter'}
              </button>

              <div className="mn-link">
                Nouveau sur MediaNet ?{' '}
                <a href="#" onClick={e => { e.preventDefault(); setError(''); setSuccess(''); setView('register'); }}>
                  Créer un compte
                </a>
              </div>
            </form>
          </div>

          {/* ══════════ REGISTER ══════════ */}
          <div className="mn-panel mn-register">
            <form className="mn-fi" onSubmit={handleRegister} noValidate>
              <div className="mn-eyebrow">Inscription</div>
              <div className="mn-title">Créez votre<br />compte</div>
              <div className="mn-sub">Rejoignez la plateforme MediaNet</div>

              {error && view === 'register' && <div className="mn-err"><IconAlert />{error}</div>}

              <div className="mn-f">
                <label className="mn-lbl">Nom complet <span>*</span></label>
                <div className="mn-iw">
                  <input
                    className="mn-inp"
                    type="text"
                    placeholder="Votre nom complet"
                    value={regName}
                    onChange={e => setRegName(e.target.value)}
                    autoComplete="name"
                  />
                </div>
              </div>
              <div className="mn-f">
                <label className="mn-lbl">Adresse Email <span>*</span></label>
                <div className="mn-iw">
                  <input
                    className="mn-inp ico"
                    type="email"
                    placeholder="nom@email.com"
                    value={regEmail}
                    onChange={e => setRegEmail(e.target.value)}
                    autoComplete="email"
                  />
                  <span className="mn-iico"><IconMail /></span>
                </div>
              </div>

              <div className="mn-f">
                <label className="mn-lbl">Mot de passe <span>*</span></label>
                <div className="mn-iw">
                  <input
                    className="mn-inp ico"
                    type={showPass ? 'text' : 'password'}
                    placeholder="Min. 8 caractères"
                    value={regPassword}
                    onChange={e => setRegPassword(e.target.value)}
                    autoComplete="new-password"
                  />
                  <span className="mn-iico" onClick={() => setShowPass(p => !p)}>
                    {showPass ? <IconEyeOff /> : <IconEye />}
                  </span>
                </div>
                {strength && (
                  <div className="mn-strength">
                    <div className="mn-strength-bar-wrap">
                      <div
                        className="mn-strength-bar"
                        style={{ width: strength.width, backgroundColor: strength.color }}
                      />
                    </div>
                    <span className="mn-strength-label" style={{ color: strength.color }}>
                      {strength.label}
                    </span>
                  </div>
                )}
              </div>

              <div className="mn-f">
                <label className="mn-lbl">Confirmer le mot de passe <span>*</span></label>
                <div className="mn-iw">
                  <input
                    className="mn-inp ico"
                    type={showConfirm ? 'text' : 'password'}
                    placeholder="Retapez votre mot de passe"
                    value={regConfirm}
                    onChange={e => setRegConfirm(e.target.value)}
                    autoComplete="new-password"
                  />
                  <span className="mn-iico" onClick={() => setShowConfirm(p => !p)}>
                    {showConfirm ? <IconEyeOff /> : <IconEye />}
                  </span>
                </div>
                {regConfirm && (
                  <div className={`mn-match ${regPassword === regConfirm ? 'ok' : 'no'}`}>
                    {regPassword === regConfirm
                      ? <><IconCheck /> Les mots de passe correspondent</>
                      : <><IconAlert /> Les mots de passe ne correspondent pas</>}
                  </div>
                )}
              </div>

              <button className="mn-btn" type="submit" disabled={loading}>
                {loading ? <><span className="mn-spin" /> Création…</> : 'Créer mon compte'}
              </button>

              <div className="mn-link">
                Déjà un compte ?{' '}
                <a href="#" onClick={e => { e.preventDefault(); reset(); setView('login'); }}>
                  Se connecter
                </a>
              </div>
            </form>
          </div>

          {/* ══════════ TOGGLE BLUE ══════════ */}
          <div className="mn-toggle-wrap">
            <div className="mn-toggle">

              {/* Left panel — shown when on register view */}
              <div className="mn-tpanel mn-tl">
                <div className="mn-corner" />
                <div className="mn-brand">
                  <span className="mn-b1">MEDIA</span>
                  <span className="mn-b2">NET</span>
                  <span className="mn-bdot" />
                </div>
                <div className="mn-tagline">Innovation Platform</div>
                <div className="mn-teyebrow">Bon retour</div>
                <div className="mn-ttitle">Vous avez<br />déjà un compte</div>
                <div className="mn-tdesc">Connectez-vous pour accéder<br />à votre tableau de bord.</div>
                <button type="button" className="mn-ghost" onClick={() => { reset(); setView('login'); }}>
                  Se connecter
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="5" y1="12" x2="19" y2="12"/>
                    <polyline points="12 5 19 12 12 19"/>
                  </svg>
                </button>
              </div>

              {/* Right panel — shown when on login view */}
              <div className="mn-tpanel mn-tr">
                <div className="mn-corner" />
                <div className="mn-brand">
                  <span className="mn-b1">MEDIA</span>
                  <span className="mn-b2">NET</span>
                  <span className="mn-bdot" />
                </div>
                <div className="mn-tagline">Innovation Platform</div>
                <div className="mn-teyebrow">Nouveau ?</div>
                <div className="mn-ttitle">Rejoignez<br />l'écosystème</div>
                <div className="mn-tdesc">Inscrivez-vous pour accéder<br />à toute la plateforme.</div>
                <button type="button" className="mn-ghost" onClick={() => { setError(''); setView('register'); }}>
                  S'inscrire
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="5" y1="12" x2="19" y2="12"/>
                    <polyline points="12 5 19 12 12 19"/>
                  </svg>
                </button>
              </div>

            </div>
          </div>

        </div>
      </div>
    </>
  );
}