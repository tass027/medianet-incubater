'use client';

import { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '@/app/store/slices/authSlice';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { getRoleName, getInitials } from '@/app/lib/utils';
import useTranslation from '@/app/hooks/useTranslation';

const resolveRole = (role) => {
  if (role === 'founder' || role === 'applicant') return 'startup';
  return role;
};

export default function DashboardLayout({ children }) {
  const { user } = useSelector((state) => state.auth);
  const { t, language } = useTranslation();
  const dispatch  = useDispatch();
  const router    = useRouter();
  const pathname  = usePathname();
  const [sidebarOpen,     setSidebarOpen]     = useState(false);
  const [mounted,         setMounted]         = useState(false);
  const [time,            setTime]            = useState(new Date());
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  useEffect(() => {
    setMounted(true);
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleLogout = async () => {
    try { await dispatch(logout()).unwrap(); } catch {}
    finally { router.push('/login'); }
  };

  const effectiveRole = resolveRole(user?.role);

  const getNavigationItems = () => {
    if (!mounted || !user?.role) return [];

    const ic = {
      dashboard: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      ),
      users: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ),
      applications: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      evaluations: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
        </svg>
      ),
      forms: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
        </svg>
      ),
      investors: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      rocket: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
      kpis: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      matches: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
        </svg>
      ),
      startups: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      ),
      feedback: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      ),
      apply: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      ),
      status: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
      ),
      mentor: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      ),
      roles: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ),
      reporting: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      lock: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      ),
      calendar: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
      resources: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 19.5A2.5 2.5 0 016.5 17H20M4 19.5A2.5 2.5 0 014 17V5a2 2 0 012-2h13.5A1.5 1.5 0 0121 4.5v12a1.5 1.5 0 01-1.5 1.5H6.5" />
        </svg>
      ),
      jury: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
        </svg>
      ),
      programmes: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      ),
      candidatures: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
        </svg>
      ),
    };

    // ── Base : dashboard link adapté au rôle ──────────────────────────────────
    // Pour jury : /dashboard/jury/dashboard (Next.js app/dashboard/jury/dashboard/)
    const base = [
      {
        name: t.dashboard || 'Dashboard',
        href: effectiveRole === 'jury'
          ? '/dashboard/jury/dashboard'
          : `/dashboard/${effectiveRole}/dashboard`,
        icon: ic.dashboard,
      },
    ];

    const roleItems = {
      admin: [
        { name: 'Roles & Permissions', href: '/dashboard/admin/roles',        icon: ic.roles        },
        { name: 'Utilisateurs',         href: '/dashboard/admin/users',        icon: ic.users        },
        { name: 'Programmes',           href: '/dashboard/admin/programmes',   icon: ic.forms        },
        { name: 'Formulaires',          href: '/dashboard/admin/forms',        icon: ic.forms        },
        { name: 'Candidatures',         href: '/dashboard/admin/applications', icon: ic.applications },
        { name: 'Jury',                 href: '/dashboard/admin/jury',         icon: ic.users        },
        { name: 'Évaluations',          href: '/dashboard/admin/evaluations',  icon: ic.evaluations  },
        { name: 'Startups',             href: '/dashboard/admin/startups',     icon: ic.startups     },
        { name: 'Investisseurs',        href: '/dashboard/admin/investors',    icon: ic.investors    },
        { name: 'mentors',                 href: '/dashboard/admin/mentors',         icon: ic.users  },
        { name: 'Reporting',            href: '/dashboard/admin/reporting',    icon: ic.reporting    },
      ],

      startup: [
        { name: 'Programmes ouverts', href: '/dashboard/startup/programmes',   icon: ic.programmes   },
        { name: 'Mes candidatures',   href: '/dashboard/startup/candidatures', icon: ic.candidatures },
        { name: 'Suivi détaillé',     href: '/dashboard/startup/status',       icon: ic.status       },
        { name: 'KPIs & Performance', href: '/dashboard/startup/kpis',         icon: ic.kpis         },
        { name: 'Investisseurs',      href: '/dashboard/startup/matches',      icon: ic.matches      },
        { name: 'Mentorat',           href: '/dashboard/startup/mentoring',    icon: ic.mentor       },
      ],

      // ── JURY : routes corrigées ────────────────────────────────────────────
      jury: [
        { name: 'Candidatures',    href: '/dashboard/jury/candidatures', icon: ic.applications },
        { name: 'Mes évaluations', href: '/dashboard/jury/evaluations',  icon: ic.evaluations  },
      ],

      mentor: [
        { name: 'Startups',   href: '/dashboard/mentor/startups',  icon: ic.startups  },
        { name: 'Sessions',   href: '/dashboard/mentor/sessions',  icon: ic.calendar  },
        { name: 'Feedback',   href: '/dashboard/mentor/feedback',  icon: ic.feedback  },
        { name: 'Rapports',   href: '/dashboard/mentor/reports',   icon: ic.reporting },
        { name: 'Ressources', href: '/dashboard/mentor/resources', icon: ic.resources },
        ...(user?.mentorRoles?.includes('jury')
          ? [{ name: 'Jury', href: '/dashboard/jury/dashboard', icon: ic.jury, badge: 'JURY' }]
          : []),
      ],
    };

    return [...base, ...(roleItems[effectiveRole] || [])];
  };

  const navItems = getNavigationItems();

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <nav className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 fixed w-full z-30 top-0">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center">
                <Link href="/" className="flex items-center ml-4 lg:ml-0">
                    <img
                      src="/logos/medianet incubater logo.png"
                      alt="Medianet Incubator"
                      className="h-24 w-auto object-contain"
                    />
                </Link>
              </div>
              <div className="w-32"></div>
            </div>
          </div>
        </nav>
        <aside className="fixed top-16 left-0 z-20 w-64 h-full bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
          <div className="h-full px-3 py-4"></div>
        </aside>
        <main className="pt-16 lg:pl-64">
          <div className="p-4 sm:p-6 lg:p-8">{children}</div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <style jsx>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap');
        * { font-family: 'Syne', -apple-system, BlinkMacSystemFont, sans-serif; }

        @keyframes slideDown { from{opacity:0;transform:translateY(-10px)} to{opacity:1;transform:translateY(0)} }
        @keyframes pulse-dot { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.5;transform:scale(1.1)} }

        .glass-nav {
          background: rgba(255,255,255,0.9);
          backdrop-filter: blur(20px);
          border-bottom: 1px solid rgba(0,0,0,0.05);
        }
        :global(.dark) .glass-nav { background:rgba(31,41,55,0.9); border-bottom:1px solid rgba(255,255,255,0.05); }

        .glass-sidebar {
          background: rgba(255,255,255,0.95);
          backdrop-filter: blur(20px);
          border-right: 1px solid rgba(0,0,0,0.05);
        }
        :global(.dark) .glass-sidebar { background:rgba(31,41,55,0.95); border-right:1px solid rgba(255,255,255,0.05); }

        .nav-link { position:relative; transition:all 0.3s cubic-bezier(0.4,0,0.2,1); }
        .nav-link::before {
          content:''; position:absolute; left:0; top:0; bottom:0; width:4px;
          background:linear-gradient(135deg,#667eea,#764ba2); border-radius:0 4px 4px 0;
          transform:scaleY(0); transition:transform 0.3s ease;
        }
        :global(.dark) .nav-link::before { background:linear-gradient(135deg,#818cf8,#a78bfa); }
        .nav-link.active::before { transform:scaleY(1); }
        .nav-link:hover { background:linear-gradient(90deg,rgba(102,126,234,0.1) 0%,transparent 100%); }
        :global(.dark) .nav-link:hover { background:linear-gradient(90deg,rgba(102,126,234,0.2) 0%,transparent 100%); }
        .nav-link.active { background:linear-gradient(90deg,rgba(102,126,234,0.15) 0%,rgba(118,75,162,0.05) 100%); font-weight:600; }
        :global(.dark) .nav-link.active { background:linear-gradient(90deg,rgba(102,126,234,0.3) 0%,rgba(118,75,162,0.1) 100%); }

        .mono { font-family:'JetBrains Mono',monospace; }
        .profile-menu { animation:slideDown 0.2s ease-out; }
        .notification-dot { animation:pulse-dot 2s ease-in-out infinite; }
        .nav-section-divider { height:1px; background:linear-gradient(90deg,transparent,rgba(102,126,234,0.2),transparent); margin:8px 0; }

        .founder-badge {
          background:linear-gradient(135deg,#f59e0b,#d97706);
          color:white; font-size:9px; font-weight:700;
          padding:1px 5px; border-radius:4px; margin-left:auto;
        }
        .locked-badge {
          background:rgba(100,116,139,0.15); color:#94a3b8;
          font-size:9px; font-weight:600;
          padding:1px 5px; border-radius:4px; margin-left:auto;
        }
        .jury-badge {
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
          color: white; font-size: 9px; font-weight: 700;
          padding: 1px 6px; border-radius: 4px; margin-left: auto;
          letter-spacing: 0.05em;
        }
      `}</style>

      {/* ══ NAVBAR ══ */}
      <nav className="glass-nav fixed w-full z-30 top-0 shadow-lg">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">

            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-3 rounded-xl text-gray-600 dark:text-gray-400 hover:bg-gradient-to-br hover:from-blue-50 hover:to-purple-50 dark:hover:from-gray-700 dark:hover:to-gray-600 lg:hidden transition-all"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <Link href="/" className="flex items-center gap-3 group">
                  <div className="hidden sm:block">
                    <img
                      src="/logos/medianet incubater logo.png"
                      alt="Medianet Incubator"
                      className="h-24 w-auto object-contain"
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                  </div>
              </Link>
            </div>

            <div className="hidden md:flex items-center gap-3 px-4 py-2 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-700 rounded-xl">
              <div className="w-2 h-2 bg-green-400 rounded-full notification-dot"></div>
              <span className="text-sm font-bold text-gray-700 dark:text-gray-300 mono">
                {time.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
              <div className="w-px h-4 bg-gray-300 dark:bg-gray-600"></div>
              <span className="text-xs text-gray-600 dark:text-gray-400 font-medium">
                {time.toLocaleDateString('fr-FR', { weekday: 'short', month: 'short', day: 'numeric' })}
              </span>
            </div>

            {user && (
              <div className="flex items-center gap-3">
                <button className="relative p-3 text-gray-600 dark:text-gray-400 hover:bg-gradient-to-br hover:from-blue-50 hover:to-purple-50 dark:hover:from-gray-700 dark:hover:to-gray-600 rounded-xl transition-all">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-red-500 border-2 border-white dark:border-gray-800 rounded-full notification-dot"></span>
                </button>

                <div className="relative">
                  <button
                    onClick={() => setShowProfileMenu(!showProfileMenu)}
                    className="flex items-center gap-3 px-4 py-2 hover:bg-gradient-to-br hover:from-blue-50 hover:to-purple-50 dark:hover:from-gray-700 dark:hover:to-gray-600 rounded-xl transition-all group"
                  >
                    <div className="hidden sm:block text-right">
                      <p className="text-sm font-bold text-gray-900 dark:text-white">{user?.name}</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mono">
                        {effectiveRole === 'admin'  ? 'SYS.ADMIN' :
                         effectiveRole === 'jury'   ? 'JURY · CONFIDENTIEL' :
                         effectiveRole === 'mentor' ? (
                           user?.mentorRoles?.includes('jury') ? 'MENTOR · JURY' : 'MENTOR'
                         ) : effectiveRole.toUpperCase()}
                        {effectiveRole === 'startup' && user?.isFounder && (
                          <span className="ml-1 text-amber-500">⭐</span>
                        )}
                      </p>
                    </div>
                    <div className="relative">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-2xl flex items-center justify-center text-white font-bold text-lg shadow-lg group-hover:shadow-xl transition-all">
                        {getInitials(user?.name || 'User')}
                      </div>
                      <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-green-400 border-2 border-white dark:border-gray-800 rounded-full"></div>
                    </div>
                  </button>

                  {showProfileMenu && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setShowProfileMenu(false)}></div>
                      <div className="profile-menu absolute right-0 mt-2 w-64 glass-nav rounded-2xl shadow-2xl overflow-hidden z-50">
                        <div className="p-4 bg-gradient-to-r from-blue-500 to-purple-600">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-24 bg-white/20 rounded-xl flex items-center justify-center text-white font-bold text-lg">
                              {getInitials(user?.name || 'User')}
                            </div>
                            <div>
                              <p className="font-bold text-white">{user?.name}</p>
                              <p className="text-xs text-blue-100 mono">{user?.email}</p>
                              {effectiveRole === 'jury' && (
                                <span className="inline-block mt-1 text-[9px] font-bold bg-white/20 text-white px-2 py-0.5 rounded-full tracking-wide">
                                  ESPACE JURY
                                </span>
                              )}
                              {effectiveRole === 'mentor' && user?.mentorRoles?.includes('jury') && (
                                <span className="inline-block mt-1 text-[9px] font-bold bg-white/20 text-white px-2 py-0.5 rounded-full tracking-wide">
                                  MENTOR + JURY
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="p-2 dark:bg-gray-800">
                          <Link
                            href={`/dashboard/${effectiveRole}/profile`}
                            className="flex items-center gap-3 px-4 py-3 text-gray-700 dark:text-gray-300 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 dark:hover:from-gray-700 dark:hover:to-gray-600 rounded-xl transition-all"
                            onClick={() => setShowProfileMenu(false)}
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                            <span className="font-semibold">Profil</span>
                          </Link>
                          <Link
                            href={`/dashboard/${effectiveRole}/settings`}
                            className="flex items-center gap-3 px-4 py-3 text-gray-700 dark:text-gray-300 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 dark:hover:from-gray-700 dark:hover:to-gray-600 rounded-xl transition-all"
                            onClick={() => setShowProfileMenu(false)}
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            <span className="font-semibold">Paramètres</span>
                          </Link>
                          <div className="my-2 h-px bg-gray-200 dark:bg-gray-700"></div>
                          <button
                            onClick={handleLogout}
                            className="flex items-center gap-3 w-full px-4 py-3 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                            <span className="font-semibold">Déconnexion</span>
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* ══ SIDEBAR ══ */}
      {user && (
        <>
          <aside className={`glass-sidebar fixed top-20 left-0 z-20 w-72 h-[calc(100vh-5rem)] shadow-2xl transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>
            <div className="h-full px-4 py-6 overflow-y-auto">

              {/* ── Brand block ──────────────────────────────────────────────── */}
              <div className="mb-8 p-4 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-700 rounded-2xl border border-blue-100 dark:border-gray-700">
                  <div className="mb-3">
                    <img
                      src="/logos/medianet incubater logo.png"
                      alt="Medianet Incubator"
                      className="h-24 w-auto object-contain"
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                  </div>

                {/* Status badge par rôle */}
                {effectiveRole === 'jury' && (
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full notification-dot inline-block"></span>
                    <span className="text-xs text-indigo-600 dark:text-indigo-400 font-bold">ESPACE JURY</span>
                  </div>
                )}
                {effectiveRole === 'startup' && (
                  <div className="flex items-center gap-1.5">
                    {user?.isFounder ? (
                      <>
                        <span className="w-1.5 h-1.5 bg-amber-400 rounded-full notification-dot inline-block"></span>
                        <span className="text-xs text-amber-600 dark:text-amber-400 font-bold">MODE FONDATEUR</span>
                      </>
                    ) : (
                      <>
                        <span className="w-1.5 h-1.5 bg-blue-400 rounded-full notification-dot inline-block"></span>
                        <span className="text-xs text-blue-600 dark:text-blue-400 font-bold">MODE CANDIDAT</span>
                      </>
                    )}
                  </div>
                )}
                {effectiveRole === 'mentor' && (
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-violet-400 rounded-full notification-dot inline-block"></span>
                    <span className="text-xs text-violet-600 dark:text-violet-400 font-bold">
                      {user?.mentorRoles?.includes('jury') ? 'ESPACE MENTOR · JURY' : 'ESPACE MENTOR'}
                    </span>
                  </div>
                )}
                {effectiveRole !== 'startup' && effectiveRole !== 'mentor' && effectiveRole !== 'jury' && (
                  <div className="flex items-center gap-2 text-xs">
                    <div className="w-1.5 h-1.5 bg-green-400 rounded-full notification-dot"></div>
                    <span className="text-gray-600 dark:text-gray-400 font-medium">System Operational</span>
                  </div>
                )}
              </div>

              {/* ── Section label ─────────────────────────────────────────────── */}
              {effectiveRole === 'jury' && (
                <div className="mb-2 px-4">
                  <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
                    Espace Jury
                  </p>
                </div>
              )}
              {effectiveRole === 'startup' && (
                <div className="mb-2 px-4">
                  <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
                    Candidatures
                  </p>
                </div>
              )}
              {effectiveRole === 'mentor' && (
                <div className="mb-2 px-4">
                  <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
                    Espace Mentor
                  </p>
                </div>
              )}

              {/* ── Nav ──────────────────────────────────────────────────────── */}
              <nav className="space-y-1">
                {navItems.map((item, index) => {
                  const isActive = pathname === item.href || pathname.startsWith(item.href + '/');

                  const founderOnlyPaths = [
                    '/dashboard/startup/kpis',
                    '/dashboard/startup/matches',
                    '/dashboard/startup/mentoring',
                  ];
                  const isFounded     = user?.isFounder === true;
                  const isFounderOnly = effectiveRole === 'startup' && founderOnlyPaths.includes(item.href);

                  const showFounderDivider = effectiveRole === 'startup' && item.href === '/dashboard/startup/kpis';
                  const showAdminDivider   = effectiveRole === 'admin'   && item.href === '/dashboard/admin/forms';
                  const showJuryDivider    = effectiveRole === 'mentor'  && item.badge === 'JURY';

                  return (
                    <div key={item.name}>
                      {showFounderDivider && (
                        <div className="nav-section-divider">
                          <p className="px-4 text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mt-3 mb-1">
                            Espace Fondateur
                          </p>
                        </div>
                      )}
                      {showAdminDivider && <div className="nav-section-divider" />}
                      {showJuryDivider && (
                        <div className="nav-section-divider">
                          <p className="px-4 text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mt-3 mb-1">
                            Rôle Jury
                          </p>
                        </div>
                      )}

                      <Link
                        href={item.href}
                        className={`nav-link flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all group
                          ${isActive ? 'active' : 'text-gray-700 dark:text-gray-400'}
                          ${isFounderOnly && !isFounded ? 'opacity-50' : ''}`}
                        onClick={() => setSidebarOpen(false)}
                      >
                        <div className={`transition-colors ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-500 group-hover:text-blue-600 dark:group-hover:text-blue-400'}`}>
                          {item.icon}
                        </div>
                        <span className={`font-semibold flex-1 ${isActive ? 'text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-400'}`}>
                          {item.name}
                        </span>

                        {isFounderOnly && (
                          isFounded
                            ? <span className="founder-badge">PRO</span>
                            : <span className="locked-badge">🔒</span>
                        )}

                        {item.badge === 'JURY' && (
                          <span className="jury-badge">JURY</span>
                        )}
                      </Link>
                    </div>
                  );
                })}
              </nav>

              {/* Déconnexion mobile */}
              <div className="lg:hidden mt-4">
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-3 w-full px-4 py-3.5 text-red-600 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 rounded-xl transition-all font-semibold"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  <span>Déconnexion</span>
                </button>
              </div>
            </div>
          </aside>

          {sidebarOpen && (
            <div
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-10 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            ></div>
          )}
        </>
      )}

      {/* ══ MAIN ══ */}
      <main className="pt-20 lg:pl-72 transition-all duration-300">
        <div className="p-4 sm:p-6 lg:p-8">{children}</div>
      </main>
    </div>
  );
}