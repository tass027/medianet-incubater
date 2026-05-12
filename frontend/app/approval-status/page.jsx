'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

function ApprovalStatusContent() {
  const searchParams = useSearchParams();
  const status = searchParams.get('status');
  const message = searchParams.get('message');
  const userId = searchParams.get('userId');
  const email = searchParams.get('email');

  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    if (status === 'success') {
      const timer = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            window.location.href = '/login';
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [status]);

  const styles = {
    container: {
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #0a1628 0%, #0c2d6b 100%)',
      fontFamily: "'DM Sans', sans-serif",
      padding: '2rem',
    },
    card: {
      maxWidth: '480px',
      width: '100%',
      background: 'white',
      borderRadius: '24px',
      padding: '2.5rem',
      textAlign: 'center',
      boxShadow: '0 32px 80px rgba(0,0,0,0.22)',
    },
    successIcon: {
      width: '72px',
      height: '72px',
      margin: '0 auto 1.5rem',
      background: '#10b98120',
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: '#10b981',
    },
    errorIcon: {
      width: '72px',
      height: '72px',
      margin: '0 auto 1.5rem',
      background: '#ef444420',
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: '#ef4444',
    },
    warningIcon: {
      width: '72px',
      height: '72px',
      margin: '0 auto 1.5rem',
      background: '#f59e0b20',
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: '#f59e0b',
    },
    title: {
      fontSize: '1.75rem',
      fontWeight: '700',
      marginBottom: '0.75rem',
      color: '#0a1628',
    },
    message: {
      fontSize: '0.95rem',
      color: '#475569',
      marginBottom: '1.5rem',
      lineHeight: '1.6',
    },
    button: {
      display: 'inline-block',
      padding: '0.75rem 1.75rem',
      background: '#1d6af4',
      color: 'white',
      textDecoration: 'none',
      borderRadius: '12px',
      fontWeight: '600',
      transition: 'all 0.2s',
    },
  };

  if (status === 'success') {
    return (
      <>
        <div style={styles.successIcon}>
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <h1 style={styles.title}>Compte approuvé !</h1>
        <p style={styles.message}>
          Le compte a été approuvé avec succès. L'utilisateur a reçu un email de confirmation.
        </p>
        <p style={{ ...styles.message, fontSize: '0.85rem', color: '#94a3b8' }}>
          Redirection vers la page de connexion dans {countdown} secondes...
        </p>
        <Link href="/login" style={styles.button}>
          Aller à la connexion
        </Link>
      </>
    );
  }

  if (status === 'rejected') {
    return (
      <>
        <div style={styles.warningIcon}>
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="18" y1="6" x2="6" y2="18" />
          </svg>
        </div>
        <h1 style={styles.title}>Compte rejeté</h1>
        <p style={styles.message}>
          Le compte a été rejeté. Un email de notification a été envoyé à {email || "l'utilisateur"}.
        </p>
        <Link href="/internal/login" style={styles.button}>
          Retour à l'admin
        </Link>
      </>
    );
  }

  if (status === 'already-approved') {
    return (
      <>
        <div style={styles.warningIcon}>
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 16v-4M12 8h.01" />
          </svg>
        </div>
        <h1 style={styles.title}>Compte déjà approuvé</h1>
        <p style={styles.message}>Ce compte a déjà été approuvé précédemment.</p>
        <Link href="/internal/login" style={styles.button}>
          Retour à l'admin
        </Link>
      </>
    );
  }

  return (
    <>
      <div style={styles.errorIcon}>
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      </div>
      <h1 style={styles.title}>Erreur</h1>
      <p style={styles.message}>{message || "Une erreur est survenue lors de l'approbation."}</p>
      <Link href="/internal/login" style={styles.button}>
        Retour à l'admin
      </Link>
    </>
  );
}

export default function ApprovalStatusPage() {
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
        maxWidth: '480px',
        width: '100%',
        background: 'white',
        borderRadius: '24px',
        padding: '2.5rem',
        textAlign: 'center',
        boxShadow: '0 32px 80px rgba(0,0,0,0.22)',
      }}>
        <Suspense fallback={<p>Chargement...</p>}>
          <ApprovalStatusContent />
        </Suspense>
      </div>
    </div>
  );
}