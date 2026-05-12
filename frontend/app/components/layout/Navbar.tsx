'use client';

import Link from 'next/link';
import Button from '../common/Button';
import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import useTheme from '@/app/hooks/useTheme';
import { usePathname } from 'next/navigation';

export default function Navbar() {
  const [mounted, setMounted]       = useState(false);
  const [scrolled, setScrolled]     = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { isAuthenticated, user }   = useSelector((state: any) => state.auth);
  const { theme, changeTheme }      = useTheme();
  const pathname                    = usePathname();

  useEffect(() => {
    setMounted(true);
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const navLinks = [
    { href: '/',           label: 'Accueil'    },
    { href: '/programmes', label: 'Programmes' },
    { href: '/incubation', label: 'Incubation' },
    { href: '/about',      label: 'À propos'   },
  ];

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname?.startsWith(href);

  if (!mounted) {
    return (
      <nav className="fixed top-0 left-0 right-0 bg-white/90 backdrop-blur-sm z-50 border-b border-gray-100 dark:bg-gray-900/90 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-10">
          <div className="flex justify-between items-center h-20">
            <LogoSkeleton />
            <div className="w-24 h-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          </div>
        </div>
      </nav>
    );
  }

  return (
    <>
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-white/95 dark:bg-gray-900/95 backdrop-blur-md shadow-md'
          : 'bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm'
      } border-b border-gray-100 dark:border-gray-800`}>
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-10">
          <div className="flex justify-between items-center h-20">

            {/* ── Logo ── */}
            <Logo />

            {/* ── Desktop nav ── */}
            <div className="hidden md:flex items-center space-x-10">
              {navLinks.map((link) => (
                <Link key={link.href} href={link.href}
                  className={`relative text-sm font-semibold transition-colors pb-0.5 ${
                    isActive(link.href)
                      ? 'text-primary-600 dark:text-primary-400'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}>
                  {link.label}
                  {isActive(link.href) && (
                    <span className="absolute -bottom-px left-0 right-0 h-0.5 bg-primary-600 dark:bg-primary-400 rounded-full" />
                  )}
                </Link>
              ))}
            </div>

            {/* ── Right actions ── */}
            <div className="flex items-center gap-3">

              {/* Theme toggle */}
              <button
                onClick={() => changeTheme(theme === 'dark' ? 'light' : 'dark')}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                aria-label="Changer le thème">
                {theme === 'dark' ? (
                  <>
                    <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                    </svg>
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-300 hidden sm:inline">Sombre</span>
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-300 hidden sm:inline">Clair</span>
                  </>
                )}
              </button>

              {/* Auth */}
              {isAuthenticated ? (
                <Link href={`/dashboard/${user?.role || 'startup'}`}>
                  <Button variant="primary" size="md">Tableau de bord</Button>
                </Link>
              ) : (
                <div className="flex items-center gap-2">
                  <Link href="/login">
                    <button className="px-4 py-2 text-sm font-semibold text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
                      Connexion
                    </button>
                  </Link>
                  <Link href="/login">
                    <Button variant="primary" size="md">Candidater</Button>
                  </Link>
                </div>
              )}

              {/* Mobile burger */}
              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className="md:hidden p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                {mobileOpen ? (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 py-4 px-6 space-y-1">
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center justify-between px-4 py-3 text-sm font-semibold rounded-xl transition-colors ${
                  isActive(link.href)
                    ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                }`}>
                {link.label}
                {isActive(link.href) && (
                  <span className="w-1.5 h-1.5 bg-primary-500 rounded-full" />
                )}
              </Link>
            ))}
            <div className="pt-3 mt-2 border-t border-gray-100 dark:border-gray-800 flex flex-col gap-2">
              {isAuthenticated ? (
                <Link href={`/dashboard/${user?.role || 'startup'}`} onClick={() => setMobileOpen(false)}>
                  <Button variant="primary" size="lg" className="w-full">Tableau de bord</Button>
                </Link>
              ) : (
                <>
                  <Link href="/login" onClick={() => setMobileOpen(false)}>
                    <button className="w-full px-4 py-3 text-sm font-semibold text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                      Connexion
                    </button>
                  </Link>
                  <Link href="/login" onClick={() => setMobileOpen(false)}>
                    <Button variant="primary" size="lg" className="w-full">Candidater</Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </nav>
      <div className="h-20" />
    </>
  );
}

/* ─── Logo component ────────────────────────────────────────────── */
function Logo() {
  return (
    <Link href="/" className="flex items-center gap-3 group flex-shrink-0">
      {/* Real Medianet Incubator logo */}
      <img
        src="/logos/medianet incubater logo.png"
        alt="Medianet Incubator"
        className="h-24 w-auto object-contain"
        onError={(e: any) => {
          e.target.style.display = 'none';
          // Fallback: show text logo
          const fallback = e.target.nextSibling;
          if (fallback) fallback.style.display = 'flex';
        }}
      />
      {/* Fallback text logo (hidden by default, shown if img fails) */}
      <span className="items-center gap-2 hidden" aria-hidden="true">
        <span className="text-2xl font-bold tracking-tight">
          <span className="text-secondary-700 dark:text-secondary-500">MEDIA</span>
          <span className="text-primary-700 dark:text-primary-500">NET</span>
        </span>
        <span className="hidden sm:block text-[11px] font-semibold tracking-wider uppercase text-gray-400 dark:text-gray-500 border-l border-gray-200 dark:border-gray-700 pl-3">
          Incubateur
        </span>
      </span>
    </Link>
  );
}

/* ─── Skeleton (SSR) ────────────────────────────────────────────── */
function LogoSkeleton() {
  return (
    <div className="h-24 w-40 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
  );
}