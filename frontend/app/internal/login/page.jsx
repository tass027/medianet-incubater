'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useDispatch } from 'react-redux';  // ✅ Import correct
import { login } from '@/app/store/slices/authSlice';
import Link from 'next/link';

const INTERNAL_ROLES = {
  admin:   '/dashboard/admin/dashboard',
  staff:   '/dashboard/admin',
  manager: '/dashboard/admin',
  mentor:  '/dashboard/mentor/dashboard',
  jury:    '/dashboard/jury/dashboard',    // ← AJOUTER
};

export default function InternalLoginPage() {
  const router   = useRouter();
  const dispatch = useDispatch();

  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  const handleSignIn = async (e) => {
    e.preventDefault();
    setError('');
    if (!email || !password) { setError('Veuillez remplir tous les champs.'); return; }

// Pas de restriction email pour permettre les jurys externes
// qui ont un compte avec role='jury' même sans @medianet.tn

    setLoading(true);
    try {
      const result = await dispatch(login({ email, password })).unwrap();
      const userRole = result.user?.role;

      // Block non-internal users
      if (!INTERNAL_ROLES[userRole]) {
        setError('Accès refusé. Ce portail est réservé au personnel MediaNet.');
        setLoading(false);
        return;
      }

      router.push(INTERNAL_ROLES[userRole]);
    } catch (err) {
      setError(typeof err === 'string' ? err : 'Identifiants incorrects ou accès non autorisé.');
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600&display=swap');

        :root {
          --dark-950:#08101e;
          --dark-900:#0d1726;
          --dark-800:#111f35;
          --dark-700:#162843;
          --dark-600:#1c3254;
          --gold-500:#f5c400;
          --gold-400:#f7d040;
          --gold-300:#fae080;
          --gold-100:rgba(245,196,0,.12);
          --slate-400:#94a3b8;
          --slate-300:#cbd5e1;
          --white:#ffffff;
          --red-400:#f87171;
          --ease-out:cubic-bezier(0.16,1,0.3,1);
        }
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}

        .int-page {
          min-height:100vh; display:flex;
          background:var(--dark-950);
          font-family:'DM Sans',sans-serif;
          position:relative; overflow:hidden;
        }

        /* ── LEFT: decorative panel ── */
        .int-left {
          width:42%; position:relative; overflow:hidden;
          background:linear-gradient(160deg,var(--dark-800) 0%,var(--dark-950) 100%);
          display:flex; flex-direction:column; justify-content:space-between;
          padding:3rem;
        }
        .int-left::before {
          content:''; position:absolute; inset:0;
          background:
            radial-gradient(ellipse 70% 60% at 30% 70%, rgba(245,196,0,.08) 0%, transparent 65%),
            radial-gradient(ellipse 50% 40% at 80% 20%, rgba(29,106,244,.1) 0%, transparent 60%);
        }
        .int-left::after {
          content:''; position:absolute; bottom:-100px; left:-60px;
          width:400px; height:400px; border-radius:50%;
          border:60px solid rgba(245,196,0,.04); pointer-events:none;
        }
        /* Fine grid overlay */
        .int-left-grid {
          position:absolute; inset:0; pointer-events:none;
          background-image:
            linear-gradient(rgba(245,196,0,.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(245,196,0,.04) 1px, transparent 1px);
          background-size:40px 40px;
        }

        /* ── BRAND ── */
        .int-brand { position:relative; z-index:1; }
        .int-brand-row { display:flex; align-items:baseline; }
        .int-brand-media { font-family:'Syne',sans-serif; font-size:1.8rem; font-weight:800; color:rgba(255,255,255,.35); letter-spacing:-.5px; }
        .int-brand-net   { font-family:'Syne',sans-serif; font-size:1.8rem; font-weight:800; color:var(--white); letter-spacing:-.5px; }
        .int-brand-dot   { width:6px; height:6px; background:var(--gold-500); border-radius:50%; margin-left:3px; margin-bottom:12px; flex-shrink:0; box-shadow:0 0 10px var(--gold-500); }
        .int-brand-sub   { font-size:.58rem; letter-spacing:3px; text-transform:uppercase; color:rgba(255,255,255,.25); margin-top:.2rem; font-weight:500; }

        /* ── BADGE ── */
        .int-badge {
          display:inline-flex; align-items:center; gap:.5rem;
          background:rgba(245,196,0,.1); border:1px solid rgba(245,196,0,.25);
          color:var(--gold-400); font-size:.65rem; font-weight:700;
          letter-spacing:1.5px; text-transform:uppercase;
          padding:.4rem .9rem; border-radius:20px; margin-bottom:1.5rem;
        }
        .int-badge-dot { width:5px; height:5px; border-radius:50%; background:var(--gold-500); box-shadow:0 0 6px var(--gold-500); animation:pulse 2s ease infinite; }
        @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.6;transform:scale(.8)} }

        /* ── LEFT CONTENT ── */
        .int-left-content { position:relative; z-index:1; }
        .int-left-title {
          font-family:'Syne',sans-serif; font-size:2.2rem; font-weight:700;
          color:var(--white); line-height:1.15; margin-bottom:1rem;
        }
        .int-left-title span { color:var(--gold-400); }
        .int-left-desc { font-size:.82rem; color:rgba(255,255,255,.4); line-height:1.8; font-weight:300; max-width:280px; }

        /* ── SECURITY CHIPS ── */
        .int-chips { display:flex; flex-direction:column; gap:.5rem; margin-top:2rem; }
        .int-chip {
          display:flex; align-items:center; gap:.6rem;
          background:rgba(255,255,255,.04); border:1px solid rgba(255,255,255,.07);
          border-radius:8px; padding:.5rem .8rem;
        }
        .int-chip-icon { color:var(--gold-400); flex-shrink:0; }
        .int-chip-text { font-size:.71rem; color:rgba(255,255,255,.45); font-weight:400; }
        .int-chip-text strong { color:rgba(255,255,255,.7); font-weight:600; }

        /* ── LEFT FOOTER ── */
        .int-left-footer { position:relative; z-index:1; }
        .int-back-link {
          display:inline-flex; align-items:center; gap:.4rem;
          color:rgba(255,255,255,.3); font-size:.71rem; text-decoration:none;
          transition:color .2s;
        }
        .int-back-link:hover { color:var(--gold-400); }

        /* ── RIGHT: form panel ── */
        .int-right {
          flex:1; display:flex; align-items:center; justify-content:center;
          padding:3rem 2.5rem; position:relative;
          background:var(--dark-900);
        }
        .int-right::before {
          content:''; position:absolute; top:0; left:0; bottom:0; width:1px;
          background:linear-gradient(180deg, transparent, rgba(245,196,0,.2) 40%, rgba(245,196,0,.2) 60%, transparent);
        }

        .int-form-wrap {
          width:100%; max-width:380px;
          animation:fadeUp .6s var(--ease-out) .1s both;
        }
        @keyframes fadeUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }

        .int-form-eyebrow { font-size:.6rem; font-weight:700; letter-spacing:2.5px; text-transform:uppercase; color:var(--gold-500); margin-bottom:.4rem; }
        .int-form-title   { font-family:'Syne',sans-serif; font-size:1.7rem; font-weight:700; color:var(--white); letter-spacing:-.5px; line-height:1.2; margin-bottom:.3rem; }
        .int-form-sub     { font-size:.78rem; color:var(--slate-400); margin-bottom:2rem; font-weight:300; line-height:1.6; }

        /* ── RESTRICTED NOTICE ── */
        .int-restricted {
          display:flex; align-items:flex-start; gap:.6rem;
          background:rgba(245,196,0,.06); border:1px solid rgba(245,196,0,.2);
          border-radius:10px; padding:.75rem 1rem; margin-bottom:1.5rem;
        }
        .int-restricted-icon { color:var(--gold-400); flex-shrink:0; margin-top:1px; }
        .int-restricted-text { font-size:.72rem; color:rgba(255,255,255,.5); line-height:1.6; }
        .int-restricted-text strong { display:block; font-weight:600; color:var(--gold-400); margin-bottom:.1rem; font-size:.73rem; }

        /* ── FIELDS ── */
        .int-field { margin-bottom:1rem; }
        .int-label { display:block; font-size:.62rem; font-weight:700; color:rgba(255,255,255,.4); text-transform:uppercase; letter-spacing:.8px; margin-bottom:.3rem; }

        .int-input-wrap { position:relative; }
        .int-input {
          width:100%; padding:.7rem 1rem;
          border:1.5px solid rgba(255,255,255,.08); border-radius:10px;
          font-size:.85rem; font-family:inherit; color:var(--white);
          background:rgba(255,255,255,.04); outline:none;
          transition:border-color .2s,box-shadow .2s,background .2s;
        }
        .int-input::placeholder { color:rgba(255,255,255,.2); font-weight:300; }
        .int-input:focus { border-color:rgba(245,196,0,.4); background:rgba(255,255,255,.06); box-shadow:0 0 0 3px rgba(245,196,0,.08); }
        .int-input.has-icon { padding-right:2.5rem; }

        .int-input-icon { position:absolute; right:.9rem; top:50%; transform:translateY(-50%); color:rgba(255,255,255,.25); cursor:pointer; padding:2px; transition:color .15s; line-height:0; }
        .int-input-icon:hover { color:var(--gold-400); }

        .int-forgot { font-size:.71rem; color:rgba(255,255,255,.3); text-decoration:none; font-weight:500; text-align:right; display:block; margin-top:-.5rem; margin-bottom:1.2rem; transition:color .2s; }
        .int-forgot:hover { color:var(--gold-400); }

        /* ── ERROR ── */
        .int-error {
          display:flex; align-items:flex-start; gap:.45rem;
          background:rgba(248,113,113,.08); border:1px solid rgba(248,113,113,.25);
          color:var(--red-400); font-size:.73rem; font-weight:500;
          padding:.6rem .85rem; border-radius:8px; margin-bottom:1rem; line-height:1.5;
        }

        /* ── BUTTON ── */
        .int-btn {
          width:100%; padding:.82rem;
          background:linear-gradient(135deg, var(--gold-500) 0%, #d4a800 100%);
          color:var(--dark-950); border:none; border-radius:10px;
          font-size:.85rem; font-weight:700; font-family:inherit;
          cursor:pointer; letter-spacing:.3px;
          transition:transform .15s,box-shadow .15s,opacity .15s;
          box-shadow:0 4px 20px rgba(245,196,0,.3);
          display:flex; align-items:center; justify-content:center; gap:.5rem;
        }
        .int-btn:hover:not(:disabled) { transform:translateY(-1px); box-shadow:0 6px 28px rgba(245,196,0,.45); }
        .int-btn:disabled { opacity:.6; cursor:not-allowed; }

        @keyframes spin { to{transform:rotate(360deg)} }
        .int-spinner { width:14px; height:14px; border:2px solid rgba(10,22,40,.3); border-top-color:var(--dark-950); border-radius:50%; animation:spin .7s linear infinite; }

        /* ── DIVIDER ── */
        .int-divider { display:flex; align-items:center; gap:.8rem; margin:1.2rem 0; }
        .int-divider-line { flex:1; height:1px; background:rgba(255,255,255,.07); }
        .int-divider-text { font-size:.65rem; color:rgba(255,255,255,.2); white-space:nowrap; }

        /* ── PUBLIC LINK ── */
        .int-public-link {
          display:flex; align-items:center; justify-content:center; gap:.5rem;
          border:1px solid rgba(255,255,255,.08); border-radius:10px;
          padding:.65rem; color:rgba(255,255,255,.35); font-size:.75rem;
          font-weight:500; text-decoration:none; transition:all .2s;
        }
        .int-public-link:hover { border-color:rgba(255,255,255,.18); color:rgba(255,255,255,.6); background:rgba(255,255,255,.03); }

        /* ── FOOTER NOTE ── */
        .int-footer-note { margin-top:1.5rem; font-size:.65rem; color:rgba(255,255,255,.2); text-align:center; line-height:1.6; }

        @media (max-width:700px) {
          .int-left { display:none; }
          .int-right { padding:2rem 1.5rem; }
        }
      `}</style>

      <div className="int-page">

        {/* ══════════════ LEFT PANEL ══════════════ */}
        <div className="int-left">
          <div className="int-left-grid" />

          <div className="int-brand">
            <div className="int-brand-row">
              <span className="int-brand-media">MEDIA</span>
              <span className="int-brand-net">NET</span>
              <span className="int-brand-dot" />
            </div>
            <div className="int-brand-sub">Portail interne · Personnel autorisé</div>
          </div>

          <div className="int-left-content">
            <div className="int-badge">
              <span className="int-badge-dot" />
              Accès restreint
            </div>
            <div className="int-left-title">
              Espace<br />réservé au<br /><span>staff MediaNet</span>
            </div>
            <div className="int-left-desc">
              Ce portail est destiné aux collaborateurs internes de MediaNet : <strong style={{color:'rgba(255,255,255,.65)'}}>Admins</strong> et <strong style={{color:'rgba(255,255,255,.65)'}}>Mentors</strong>. L'accès est fourni par votre administrateur système.
            </div>

            <div className="int-chips">
              <div className="int-chip">
                <svg className="int-chip-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                <span className="int-chip-text"><strong>Authentification sécurisée</strong> via email @medianet.tn</span>
              </div>
              <div className="int-chip">
                <svg className="int-chip-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                <span className="int-chip-text"><strong>Aucune inscription</strong> — accès sur invitation uniquement</span>
              </div>
              <div className="int-chip">
                <svg className="int-chip-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                <span className="int-chip-text"><strong>Problème d'accès ?</strong> Contactez support@medianet.tn</span>
              </div>
            </div>
          </div>

          <div className="int-left-footer">
            {/* ✅ CORRECTION ICI : lien vers /login au lieu de /auth/login */}
            <Link href="/login" className="int-back-link">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
              </svg>
              Retour au portail public
            </Link>
          </div>
        </div>

        {/* ══════════════ RIGHT PANEL (FORM) ══════════════ */}
        <div className="int-right">
          <div className="int-form-wrap">

            <div className="int-form-eyebrow">Portail Staff</div>
            <div className="int-form-title">Connexion<br />interne</div>
            <div className="int-form-sub">Accédez au back-office et aux outils d'administration de la plateforme.</div>

            <div className="int-restricted">
              <svg className="int-restricted-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
              <div className="int-restricted-text">
                <strong>Accès réservé au personnel MediaNet</strong>
                Utilisez votre adresse email professionnelle <strong style={{color:'rgba(255,255,255,.6)'}}>@medianet.tn</strong> et le mot de passe fourni par votre administrateur.
              </div>
            </div>

            <form onSubmit={handleSignIn} noValidate>

              {error && (
                <div className="int-error">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{flexShrink:0,marginTop:1}}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                  {error}
                </div>
              )}

              <div className="int-field">
                <label className="int-label">Email professionnel</label>
                <div className="int-input-wrap">
                  <input className="int-input has-icon" type="email" placeholder="prenom.nom@medianet.tn"
                    value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" />
                  <span className="int-input-icon">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
                    </svg>
                  </span>
                </div>
              </div>

              <div className="int-field">
                <label className="int-label">Mot de passe</label>
                <div className="int-input-wrap">
                  <input className="int-input has-icon" type={showPass ? 'text' : 'password'} placeholder="Mot de passe fourni par l'admin"
                    value={password} onChange={e => setPassword(e.target.value)} autoComplete="current-password" />
                  <span className="int-input-icon" onClick={() => setShowPass(p => !p)}>
                    {showPass
                      ? <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                      : <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                    }
                  </span>
                </div>
              </div>

              <a href="#" className="int-forgot">Mot de passe oublié ? Contactez l'IT</a>

              <button className="int-btn" type="submit" disabled={loading}>
                {loading
                  ? <><span className="int-spinner" /> Vérification…</>
                  : <>
                      Accéder au portail
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
                      </svg>
                    </>
                }
              </button>

              <div className="int-divider">
                <div className="int-divider-line" />
                <span className="int-divider-text">Pas un employé MediaNet ?</span>
                <div className="int-divider-line" />
              </div>

              {/* ✅ CORRECTION ICI : lien vers /login au lieu de /auth/login */}
              <Link href="/login" className="int-public-link">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                </svg>
                Portail public — Fondateurs & Candidats
              </Link>

            </form>

            <div className="int-footer-note">
              MediaNet Innovation Platform · Accès interne sécurisé<br />
              © {new Date().getFullYear()} MediaNet. Tous droits réservés.
            </div>
          </div>
        </div>

      </div>
    </>
  );
}