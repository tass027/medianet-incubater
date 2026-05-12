'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import Spinner from './Spinner';

// ─────────────────────────────────────────────────────────────────────────────
// ROLE REDIRECT MAP
// ─────────────────────────────────────────────────────────────────────────────
const ROLE_DASHBOARD = {
  admin:     '/dashboard/admin/dashboard',
  mentor:    '/dashboard/mentor/dashboard',
  startup:   '/dashboard/startup/dashboard',
  jury:      '/dashboard/jury/dashboard',   // ← AJOUTÉ
  // Legacy redirects — support des anciens tokens JWT
  applicant: '/dashboard/startup/dashboard',
  founder:   '/dashboard/startup/dashboard',
};

// ─────────────────────────────────────────────────────────────────────────────
// ROLE ALIASES
// 'applicant' et 'founder' sont des alias de 'startup'.
// Pendant la migration, les anciens tokens JWT peuvent encore contenir ces rôles.
// ─────────────────────────────────────────────────────────────────────────────
const ROLE_ALIASES = {
  applicant: 'startup',
  founder:   'startup',
  // NOTE: 'jury' n'est PAS aliasé — il reste 'jury' tel quel
};

/**
 * Résout le rôle effectif d'un utilisateur.
 * 'applicant' → 'startup', 'founder' → 'startup', autres inchangés.
 */
export function resolveRole(role) {
  return ROLE_ALIASES[role] ?? role;
}

// ─────────────────────────────────────────────────────────────────────────────
// PROTECTED ROUTE
// ─────────────────────────────────────────────────────────────────────────────
export default function ProtectedRoute({ children, allowedRoles = [] }) {
  const router = useRouter();
  const { user, accessToken, isLoading } = useSelector((state) => state.auth);

  const [mounted,    setMounted]    = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!mounted || isLoading) return;

    setIsChecking(false);

    const isAuthenticated = user && accessToken;

    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    const effectiveRole   = resolveRole(user?.role);
    const resolvedAllowed = allowedRoles.map(r => resolveRole(r));

    if (resolvedAllowed.length > 0 && !resolvedAllowed.includes(effectiveRole)) {
      const dest = ROLE_DASHBOARD[effectiveRole] ?? '/login';
      router.push(dest);
    }
  }, [user, accessToken, isLoading, router, allowedRoles, mounted]);

  if (!mounted) return null;

  if (isLoading || isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <Spinner size="lg" />
          <p className="mt-4 text-gray-600 dark:text-gray-400">Chargement...</p>
        </div>
      </div>
    );
  }

  const isAuthenticated = user && accessToken;
  if (!isAuthenticated) return null;

  const effectiveRole   = resolveRole(user?.role);
  const resolvedAllowed = allowedRoles.map(r => resolveRole(r));
  if (resolvedAllowed.length > 0 && !resolvedAllowed.includes(effectiveRole)) return null;

  return <>{children}</>;
}