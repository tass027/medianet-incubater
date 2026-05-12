import Swal from 'sweetalert2';

// ── Couleurs issues du tailwind.config.js ────────────────
const C = {
  primary:   '#006d94',   // primary-800
  primaryHover: '#0088ba', // primary-700
  danger:    '#DC2626',
  gray:      '#64748B',
  warning:   '#ffbf00',   // secondary-500
  success:   '#2ccc7d',   // accent-500
  magenta:   '#ff0080',   // magenta-500
};

const BASE = {
  customClass: { popup: 'swal-vb-popup' },
  buttonsStyling: true,
  allowOutsideClick: false,
  scrollbarPadding: false,
};

// ── Confirmation suppression ─────────────────────────────
export const confirmDelete = (itemName) =>
  Swal.fire({
    ...BASE,
    title: 'Confirmer la suppression',
    html: `Voulez-vous vraiment supprimer <strong>"${itemName}"</strong> ?<br/><span style="font-size:.85rem;color:#94a3b8">Cette action est irréversible.</span>`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Supprimer',
    cancelButtonText: 'Annuler',
    confirmButtonColor: C.danger,
    cancelButtonColor: C.gray,
  });

// ── Confirmation action neutre ───────────────────────────
export const confirmAction = (title, text, confirmLabel = 'Confirmer') =>
  Swal.fire({
    ...BASE,
    title,
    text,
    icon: 'question',
    showCancelButton: true,
    confirmButtonText: confirmLabel,
    cancelButtonText: 'Annuler',
    confirmButtonColor: C.primary,
    cancelButtonColor: C.gray,
  });

// ── Confirmation avec avertissement (archiver, publier…) ─
export const confirmWarning = (title, text, confirmLabel = 'Continuer') =>
  Swal.fire({
    ...BASE,
    title,
    text,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: confirmLabel,
    cancelButtonText: 'Annuler',
    confirmButtonColor: '#006d94', // ← primary au lieu de warning
    cancelButtonColor: '#64748B',
  });

// ── Toast succès (top-end, auto-fermé) ───────────────────
export const toastSuccess = (message) =>
  Swal.fire({
    customClass: { popup: 'swal-vb-toast' },
    title: message,
    icon: 'success',
    timer: 2400,
    timerProgressBar: true,
    showConfirmButton: false,
    toast: true,
    position: 'top-end',
  });

// ── Toast erreur (top-end, auto-fermé) ───────────────────
export const toastError = (message) =>
  Swal.fire({
    customClass: { popup: 'swal-vb-toast' },
    title: message,
    icon: 'error',
    timer: 3500,
    timerProgressBar: true,
    showConfirmButton: false,
    toast: true,
    position: 'top-end',
  });

// ── Erreur bloquante (modal centré) ─────────────────────
export const alertError = (title, message) =>
  Swal.fire({
    ...BASE,
    title,
    text: message,
    icon: 'error',
    confirmButtonText: 'Compris',
    confirmButtonColor: C.primary,
  });

// ── Info simple ──────────────────────────────────────────
export const alertInfo = (title, text) =>
  Swal.fire({
    ...BASE,
    title,
    text,
    icon: 'info',
    confirmButtonText: 'OK',
    confirmButtonColor: C.primary,
  });

// ── Input texte (renommer, motif de refus…) ─────────────
export const promptInput = (title, placeholder = '', inputLabel = '') =>
  Swal.fire({
    ...BASE,
    title,
    input: 'textarea',
    inputLabel,
    inputPlaceholder: placeholder,
    inputAttributes: { rows: 3 },
    showCancelButton: true,
    confirmButtonText: 'Valider',
    cancelButtonText: 'Annuler',
    confirmButtonColor: C.primary,
    cancelButtonColor: C.gray,
    inputValidator: (v) => !v.trim() && 'Ce champ est requis.',
  });