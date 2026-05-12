'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

// Composant interne qui utilise useSearchParams
function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const email = searchParams.get('email');

  const [status, setStatus] = useState('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token || !email) {
      setStatus('error');
      setMessage('Lien de vérification invalide');
      return;
    }

    const verifyEmail = async () => {
      try {
        const response = await fetch(
          `http://localhost:5000/auth/verify-email?token=${encodeURIComponent(token)}&email=${encodeURIComponent(email)}`
        );

        const data = await response.json();

        if (response.ok) {
          setStatus('success');
          setMessage(data.message || 'Email vérifié avec succès !');
          
          setTimeout(() => {
            router.push('/login?verified=true');
          }, 3000);
        } else {
          setStatus('error');
          setMessage(data.message || 'Erreur lors de la vérification');
        }
      } catch (error) {
        console.error('Erreur de vérification:', error);
        setStatus('error');
        setMessage('Erreur de connexion au serveur');
      }
    };

    verifyEmail();
  }, [token, email, router]);

  // Styles
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
    icon: {
      width: '72px',
      height: '72px',
      margin: '0 auto 1.5rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: '50%',
    },
    successIcon: {
      background: '#10b98120',
      color: '#10b981',
    },
    errorIcon: {
      background: '#ef444420',
      color: '#ef4444',
    },
    loadingIcon: {
      background: '#1d6af420',
      color: '#1d6af4',
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
      border: 'none',
      cursor: 'pointer',
      fontSize: '0.9rem',
    },
    spinner: {
      width: '44px',
      height: '44px',
      border: '3px solid #e2e8f0',
      borderTopColor: '#1d6af4',
      borderRadius: '50%',
      animation: 'spin 0.8s linear infinite',
      margin: '0 auto 1.5rem',
    },
    link: {
      color: '#1d6af4',
      textDecoration: 'none',
      fontWeight: '500',
    },
  };

  if (status === 'loading') {
    return (
      <>
        <div style={{ ...styles.icon, ...styles.loadingIcon }}>
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M20 12v4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-4M12 2v12m-3-3 3 3 3-3"/>
          </svg>
        </div>
        <h1 style={styles.title}>Vérification en cours...</h1>
        <p style={styles.message}>Nous vérifions votre adresse email. Veuillez patienter.</p>
        <div style={styles.spinner}></div>
      </>
    );
  }

  if (status === 'success') {
    return (
      <>
        <div style={{ ...styles.icon, ...styles.successIcon }}>
          <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <h1 style={styles.title}>Email vérifié !</h1>
        <p style={styles.message}>{message}</p>
        <p style={{ ...styles.message, fontSize: '0.8rem', color: '#94a3b8' }}>
          Redirection vers la page de connexion...
        </p>
        <Link href="/login?verified=true" style={styles.button}>
          Se connecter maintenant
        </Link>
      </>
    );
  }

  return (
    <>
      <div style={{ ...styles.icon, ...styles.errorIcon }}>
        <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      </div>
      <h1 style={styles.title}>Vérification échouée</h1>
      <p style={styles.message}>{message}</p>
      <div style={{ marginTop: '0.5rem' }}>
        <Link href="/login" style={styles.button}>
          Retour à la connexion
        </Link>
      </div>
      <p style={{ ...styles.message, marginTop: '1.5rem', fontSize: '0.8rem' }}>
        Vous n'avez pas reçu d'email ?{' '}
        <Link href="/" style={styles.link}>
          Créez un nouveau compte
        </Link>
      </p>
    </>
  );
}

// Composant principal avec Suspense
export default function VerifyEmailPage() {
  return (
    <>
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #0a1628 0%, #0c2d6b 100%)',
        fontFamily: "'DM Sans', sans-serif",
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
          <Suspense fallback={
            <>
              <div style={{
                width: '44px',
                height: '44px',
                border: '3px solid #e2e8f0',
                borderTopColor: '#1d6af4',
                borderRadius: '50%',
                animation: 'spin 0.8s linear infinite',
                margin: '0 auto 1.5rem',
              }} />
              <p style={{ color: '#64748b' }}>Chargement...</p>
            </>
          }>
            <VerifyEmailContent />
          </Suspense>
        </div>
      </div>
    </>
  );
}