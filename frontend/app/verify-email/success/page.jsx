'use client';

import Link from 'next/link';

export default function VerifyEmailSuccess() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #0a1628 0%, #0c2d6b 100%)',
      padding: '2rem',
    }}>
      <div style={{
        maxWidth: '450px',
        background: 'white',
        borderRadius: '24px',
        padding: '2.5rem',
        textAlign: 'center',
      }}>
        <div style={{
          width: '64px',
          height: '64px',
          background: '#10b98120',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 1.5rem',
          color: '#10b981',
        }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <h1 style={{ fontSize: '1.75rem', color: '#0a1628', marginBottom: '0.75rem' }}>
          Email vérifié !
        </h1>
        <p style={{ color: '#475569', marginBottom: '1.5rem' }}>
          Votre adresse email a été confirmée avec succès.
        </p>
        <Link href="/login" style={{
          display: 'inline-block',
          padding: '0.75rem 1.75rem',
          background: '#1d6af4',
          color: 'white',
          textDecoration: 'none',
          borderRadius: '12px',
          fontWeight: '600',
        }}>
          Se connecter
        </Link>
      </div>
    </div>
  );
}