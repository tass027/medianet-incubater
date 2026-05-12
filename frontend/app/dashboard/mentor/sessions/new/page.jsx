'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import ProtectedRoute from '@/app/components/common/ProtectedRoute';
import DashboardLayout from '@/app/components/layout/DashboardLayout';
import Button from '@/app/components/common/Button';
import Link from 'next/link';
import useMentorStartups from '@/app/hooks/useMentorStartups';
import useMentorSessions from '@/app/hooks/useMentorSessions';

const Icons = {
  ArrowLeft: ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
    </svg>
  ),
  Check: ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  ),
  Calendar: ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  ),
  Mail: ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  ),
  Google: ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  ),
  ExternalLink: ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
    </svg>
  ),
  Info: ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  User: ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  ),
  Shield: ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  ),
  Flask: ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 3h6m-6 0v6l-4 9a1 1 0 00.9 1.45h12.2A1 1 0 0019 18l-4-9V3m-6 0h6" />
    </svg>
  ),
};

const TOPICS = [
  'Strategie produit',
  'Levee de fonds',
  'Developpement equipe',
  'Marketing strategique',
  'Modele economique',
  'Expansion marche',
  'Revue des KPIs',
  'Pivot strategique',
  'Autre',
];

function buildGoogleCalendarUrl({ title, dateTime, durationMin, description, location }) {
  const pad   = (n) => String(n).padStart(2, '0');
  const start = new Date(dateTime);
  const end   = new Date(start.getTime() + durationMin * 60 * 1000);
  const fmt = (d) =>
    `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T` +
    `${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}00Z`;
  const params = new URLSearchParams({
    action:   'TEMPLATE',
    text:     title,
    dates:    `${fmt(start)}/${fmt(end)}`,
    details:  description || '',
    location: location   || '',
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

export default function NewSessionPage() {
  const router             = useRouter();
  const searchParams       = useSearchParams();
  const preSelectedStartup = searchParams.get('startupId') || '';

  const { startups, loading: loadingStartups } = useMentorStartups();
  const { createSession }                      = useMentorSessions();

  const [mounted,      setMounted]      = useState(false);
  const [submitting,   setSubmitting]   = useState(false);
  const [success,      setSuccess]      = useState(false);
  const [errors,       setErrors]       = useState({});
  const [calendarUrl,  setCalendarUrl]  = useState('');

  const [notifyAdmin,   setNotifyAdmin]   = useState(true);
  const [notifyStartup, setNotifyStartup] = useState(true);
  const [addToCalendar, setAddToCalendar] = useState(true);
  const [emailMessage,  setEmailMessage]  = useState('');

  // Test mode: override recipient to a test email address
  const [testMode,      setTestMode]      = useState(false);
  const [testEmail,     setTestEmail]     = useState('');

  const [form, setForm] = useState({
    startupId:   preSelectedStartup,
    date:        '',
    time:        '',
    duration:    60,
    topic:       '',
    customTopic: '',
    notes:       '',
    meetingLink: '',
  });

  useEffect(() => { setMounted(true); }, []);
  if (!mounted) return null;

  const set = (field) => (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const selectedStartup = startups.find((s) => s._id === form.startupId);
  const topicLabel      = form.topic === 'Autre' ? form.customTopic : form.topic;

  // Derived: formatted date for preview
  const previewDate = form.date && form.time
    ? new Date(`${form.date}T${form.time}`).toLocaleDateString('fr-FR', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
      })
    : null;

  const validate = () => {
    const errs = {};
    if (!form.startupId) errs.startupId = 'Selectionnez une startup';
    if (!form.date)      errs.date      = 'La date est requise';
    if (!form.time)      errs.time      = "L'heure est requise";
    if (!form.topic)     errs.topic     = 'Le theme est requis';
    if (form.topic === 'Autre' && !form.customTopic.trim())
      errs.customTopic = 'Precisez le theme';
    if (testMode && testEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(testEmail))
      errs.testEmail = 'Adresse email invalide';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    setSubmitting(true);

    try {
      const dateTime = new Date(`${form.date}T${form.time}`);

      await createSession({
        startupId:   form.startupId,
        date:        dateTime.toISOString(),
        duration:    Number(form.duration),
        topic:       topicLabel,
        notes:       form.notes,
        meetingLink: form.meetingLink,
        notify: {
          admin:        notifyAdmin,
          startup:      notifyStartup,
          emailMessage: emailMessage.trim() || undefined,
          // Pass testEmail to backend if test mode is on
          testEmail:    testMode && testEmail.trim() ? testEmail.trim() : undefined,
        },
      });

      if (addToCalendar && form.date && form.time) {
        const gcUrl = buildGoogleCalendarUrl({
          title:       `Session mentorat — ${selectedStartup?.name || 'Startup'} : ${topicLabel}`,
          dateTime:    dateTime.toISOString(),
          durationMin: Number(form.duration),
          description: [
            form.notes && `Notes : ${form.notes}`,
            form.meetingLink && `Lien reunion : ${form.meetingLink}`,
            `Startup : ${selectedStartup?.name || ''}`,
          ].filter(Boolean).join('\n\n'),
          location: form.meetingLink || '',
        });
        setCalendarUrl(gcUrl);
      }

      setSuccess(true);
    } catch (err) {
      setErrors({ submit: err.message || 'Une erreur est survenue.' });
    } finally {
      setSubmitting(false);
    }
  };

  /* ── SUCCESS ── */
  if (success) {
    return (
      <ProtectedRoute allowedRoles={['mentor']}>
        <DashboardLayout>
          <style jsx>{STYLES}</style>
          <div className="space-y-6 min-h-screen pb-10">
            <HeaderBanner title="Session planifiee !" subtitle="Votre session a ete enregistree avec succes" />
            <div className="glass-card rounded-2xl p-10 max-w-xl mx-auto text-center">
              <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                <Icons.Check className="w-10 h-10 text-emerald-600 dark:text-emerald-400" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Session planifiee !</h2>
              <p className="text-gray-500 dark:text-gray-400 mb-2 text-sm leading-relaxed">
                {[
                  notifyAdmin   && "L'administrateur",
                  notifyStartup && (selectedStartup?.name || 'La startup'),
                ].filter(Boolean).join(' et ')}{(notifyAdmin || notifyStartup) ? ' ont ete notifies par email.' : ''}
              </p>
              {testMode && testEmail && (
                <p className="text-xs text-blue-500 mb-6">
                  Mode test actif — emails envoyes a <strong>{testEmail}</strong>
                </p>
              )}
              <div className="space-y-3">
                {calendarUrl && (
                  <a href={calendarUrl} target="_blank" rel="noopener noreferrer"
                    className="btn-primary flex items-center justify-center gap-2 w-full py-3 rounded-xl font-semibold text-sm">
                    <Icons.Google className="w-4 h-4" />
                    Ajouter a Google Agenda
                    <Icons.ExternalLink className="w-3.5 h-3.5 opacity-70" />
                  </a>
                )}
                <Link href="/dashboard/mentor/sessions">
                  <button className="w-full py-3 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 text-sm font-medium transition">
                    Retour a l'agenda
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  /* ── FORM ── */
  return (
    <ProtectedRoute allowedRoles={['mentor']}>
      <DashboardLayout>
        <style jsx>{STYLES}</style>
        <div className="space-y-6 min-h-screen pb-10">

          <HeaderBanner
            title="Planifier une session"
            subtitle="Organisez un rendez-vous d'accompagnement"
            backHref="/dashboard/mentor/sessions"
            backLabel="Retour aux sessions"
          />

          <div className="max-w-2xl mx-auto space-y-5">
            <form onSubmit={handleSubmit} className="space-y-5">

              {/* ── Session Details ── */}
              <Section title="Details de la session" icon={<Icons.Calendar className="w-4 h-4" />}>
                <Field label="Startup" required error={errors.startupId}>
                  <select value={form.startupId} onChange={set('startupId')} disabled={loadingStartups}
                    className={`input-base ${errors.startupId ? 'input-err' : ''}`}>
                    <option value="">Selectionner une startup...</option>
                    {startups.map((s) => <option key={s._id} value={s._id}>{s.name}</option>)}
                  </select>
                </Field>

                <div className="grid grid-cols-2 gap-4">
                  <Field label="Date" required error={errors.date}>
                    <input type="date" value={form.date} onChange={set('date')}
                      className={`input-base ${errors.date ? 'input-err' : ''}`} />
                  </Field>
                  <Field label="Heure" required error={errors.time}>
                    <input type="time" value={form.time} onChange={set('time')}
                      className={`input-base ${errors.time ? 'input-err' : ''}`} />
                  </Field>
                </div>

                <Field label={<>Duree : <span className="text-[#006d94] font-bold">{form.duration} min</span></>}>
                  <input type="range" min="15" max="180" step="15" value={form.duration} onChange={set('duration')}
                    className="w-full accent-[#006d94]" />
                  <div className="flex justify-between text-xs text-gray-400 mt-1">
                    <span>15</span><span>30</span><span>45</span><span>1h</span><span>1h30</span><span>2h</span><span>2h30</span><span>3h</span>
                  </div>
                </Field>

                <Field label="Theme" required error={errors.topic}>
                  <select value={form.topic} onChange={set('topic')}
                    className={`input-base ${errors.topic ? 'input-err' : ''}`}>
                    <option value="">Selectionner un theme...</option>
                    {TOPICS.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                  {form.topic === 'Autre' && (
                    <div className="mt-3">
                      <input type="text" placeholder="Precisez le theme..." value={form.customTopic}
                        onChange={set('customTopic')}
                        className={`input-base ${errors.customTopic ? 'input-err' : ''}`} />
                      {errors.customTopic && <p className="field-error">{errors.customTopic}</p>}
                    </div>
                  )}
                </Field>

                <Field label="Lien de reunion">
                  <input type="url" placeholder="https://meet.google.com/..." value={form.meetingLink}
                    onChange={set('meetingLink')} className="input-base" />
                </Field>

                <Field label="Notes preparatoires">
                  <textarea value={form.notes} onChange={set('notes')} rows={3}
                    placeholder="Points a aborder, documents a preparer..."
                    className="input-base resize-none" />
                </Field>
              </Section>

              {/* ── Google Calendar ── */}
              <Section title="Google Agenda" icon={<Icons.Google className="w-4 h-4 text-blue-500" />}>
                <ToggleRow checked={addToCalendar} onChange={setAddToCalendar}
                  label="Generer un lien Google Agenda"
                  desc="Un lien sera genere apres enregistrement pour ajouter l'evenement a votre agenda (sans connexion OAuth)." />
              </Section>

              {/* ── Email Notifications ── */}
              <Section title="Notifications par email" icon={<Icons.Mail className="w-4 h-4" />}>

                <ToggleRow checked={notifyAdmin} onChange={setNotifyAdmin}
                  label="Notifier l'administrateur"
                  desc="Un email recapitulatif sera envoye a l'equipe d'administration MediaNet."
                  icon={<Icons.Shield className="w-4 h-4 text-violet-500" />} />

                <ToggleRow checked={notifyStartup} onChange={setNotifyStartup}
                  label={`Notifier la startup${selectedStartup ? ` — ${selectedStartup.name}` : ''}`}
                  desc={selectedStartup
                    ? `Un email d'invitation sera envoye au fondateur de ${selectedStartup.name}.`
                    : 'Selectionnez une startup pour activer cette option.'}
                  disabled={!selectedStartup}
                  icon={<Icons.User className="w-4 h-4 text-emerald-500" />} />

                {(notifyAdmin || notifyStartup) && (
                  <div className="mt-1">
                    <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                      Message du mentor (optionnel)
                    </label>
                    <textarea value={emailMessage} onChange={(e) => setEmailMessage(e.target.value)} rows={2}
                      placeholder="Ajoutez un message personnel a l'email..."
                      className="input-base resize-none text-sm" />
                    <p className="text-xs text-gray-400 mt-1">Ce message apparaitra dans une section distincte de l'email.</p>
                  </div>
                )}

                {/* ── Test Mode ── */}
                {(notifyAdmin || notifyStartup) && (
                  <div className="mt-2 p-4 rounded-xl border border-dashed border-amber-300 dark:border-amber-700 bg-amber-50/50 dark:bg-amber-900/10">
                    <div className="flex items-center gap-3 mb-3">
                      <Icons.Flask className="w-4 h-4 text-amber-500 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">Mode test</p>
                        <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">
                          Rediriger tous les emails vers une adresse de test avant d'envoyer en production.
                        </p>
                      </div>
                      <button type="button" onClick={() => setTestMode(!testMode)}
                        className={`relative w-11 h-6 rounded-full transition-colors duration-200 flex-shrink-0 ${testMode ? 'bg-amber-500' : 'bg-gray-300 dark:bg-gray-600'}`}>
                        <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${testMode ? 'translate-x-5' : ''}`} />
                      </button>
                    </div>
                    {testMode && (
                      <div>
                        <input type="email" value={testEmail} onChange={(e) => setTestEmail(e.target.value)}
                          placeholder="ex: tasnimmehrabi992@gmail.com"
                          className={`input-base text-sm ${errors.testEmail ? 'input-err' : ''}`} />
                        {errors.testEmail && <p className="field-error">{errors.testEmail}</p>}
                        {testEmail && (
                          <p className="text-xs text-amber-600 dark:text-amber-400 mt-1.5">
                            Les emails seront envoyes uniquement a <strong>{testEmail}</strong> au lieu des destinataires reels.
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* ── Email Preview (pro style, no emojis) ── */}
                {(notifyAdmin || notifyStartup) && form.date && form.time && topicLabel && (
                  <div className="mt-3 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
                    {/* Preview chrome bar */}
                    <div className="bg-gray-100 dark:bg-gray-800 px-4 py-2 flex items-center gap-3 border-b border-gray-200 dark:border-gray-700">
                      <div className="flex gap-1.5">
                        <div className="w-3 h-3 rounded-full bg-red-400" />
                        <div className="w-3 h-3 rounded-full bg-amber-400" />
                        <div className="w-3 h-3 rounded-full bg-green-400" />
                      </div>
                      <span className="text-xs text-gray-400 flex-1 text-center">Aperçu email — style professionnel</span>
                    </div>

                    {/* Gmail-like email preview */}
                    <div className="bg-white dark:bg-gray-900 p-5">
                      {/* Email meta */}
                      <div className="border-b border-gray-100 dark:border-gray-800 pb-3 mb-4 space-y-1">
                        <div className="flex gap-2 text-xs">
                          <span className="text-gray-400 w-14 flex-shrink-0">De :</span>
                          <span className="text-gray-700 dark:text-gray-300 font-medium">MediaNet Incubator &lt;noreply@medianet.tn&gt;</span>
                        </div>
                        <div className="flex gap-2 text-xs">
                          <span className="text-gray-400 w-14 flex-shrink-0">À :</span>
                          <span className="text-gray-700 dark:text-gray-300">
                            {testMode && testEmail
                              ? <span className="text-amber-600 font-medium">{testEmail} (mode test)</span>
                              : [
                                  notifyAdmin   && 'admin@medianet.tn',
                                  notifyStartup && selectedStartup && `fondateur@${(selectedStartup.name || 'startup').toLowerCase().replace(/\s/g, '')}.com`,
                                ].filter(Boolean).join(', ')
                            }
                          </span>
                        </div>
                        <div className="flex gap-2 text-xs">
                          <span className="text-gray-400 w-14 flex-shrink-0">Objet :</span>
                          <span className="text-gray-900 dark:text-gray-100 font-semibold">
                            {notifyAdmin
                              ? `Nouvelle session planifiee - ${selectedStartup?.name || 'Startup'} : ${topicLabel}`
                              : `Session de mentorat planifiee - ${topicLabel}`}
                          </span>
                        </div>
                      </div>

                      {/* Email body preview */}
                      <div className="space-y-3 text-xs text-gray-700 dark:text-gray-300">
                        <p>Bonjour{notifyAdmin ? ' Equipe Administration' : selectedStartup ? ` ${selectedStartup.name}` : ''},</p>
                        <p className="text-gray-500 dark:text-gray-400 leading-relaxed">
                          Une session de mentorat a ete planifiee sur la plateforme <strong className="text-gray-700 dark:text-gray-200">MediaNet Incubator</strong>.
                          Vous trouverez ci-dessous les details de cette session.
                        </p>

                        {/* Details card */}
                        <div className="border border-gray-200 dark:border-gray-700 rounded-md overflow-hidden">
                          <div className="bg-gray-50 dark:bg-gray-800 px-3 py-2 border-b border-gray-200 dark:border-gray-700">
                            <p className="text-gray-500 dark:text-gray-400 text-[10px] font-bold uppercase tracking-widest">Details de la session</p>
                          </div>
                          <div className="p-3 space-y-1.5">
                            {[
                              { label: 'Date',    value: previewDate },
                              { label: 'Heure',   value: form.time },
                              { label: 'Duree',   value: `${form.duration} minutes` },
                              { label: 'Theme',   value: topicLabel, bold: true },
                              { label: 'Startup', value: selectedStartup?.name || '—' },
                              form.meetingLink && { label: 'Lien', value: form.meetingLink, link: true },
                            ].filter(Boolean).map(({ label, value, bold, link }) => (
                              <div key={label} className="flex gap-3">
                                <span className="text-gray-400 w-16 flex-shrink-0 font-medium">{label}</span>
                                {link
                                  ? <a href={value} className="text-blue-600 truncate">{value}</a>
                                  : <span className={`text-gray-800 dark:text-gray-200 ${bold ? 'font-semibold' : ''}`}>{value}</span>
                                }
                              </div>
                            ))}
                          </div>
                        </div>

                        {emailMessage && (
                          <div className="border-l-2 border-blue-500 pl-3 bg-blue-50 dark:bg-blue-900/20 py-2 rounded-r">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-blue-500 mb-1">Message du mentor</p>
                            <p className="text-blue-800 dark:text-blue-200 italic">{emailMessage}</p>
                          </div>
                        )}

                        <p className="pt-1">Cordialement,<br /><strong>L'equipe MediaNet Incubator</strong></p>
                      </div>
                    </div>
                  </div>
                )}
              </Section>

              {errors.submit && (
                <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700/40 text-red-600 rounded-xl text-sm">
                  {errors.submit}
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <Link href="/dashboard/mentor/sessions">
                  <Button variant="outline">Annuler</Button>
                </Link>
                <Button variant="primary" type="submit" disabled={submitting} className="px-8 flex items-center gap-2">
                  {submitting
                    ? <><span className="spinner" /> Planification...</>
                    : <><Icons.Check className="w-4 h-4" /> Planifier la session</>}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}

/* ── Sub-components ── */
function HeaderBanner({ title, subtitle, backHref, backLabel }) {
  return (
    <div className="relative overflow-hidden rounded-2xl p-8"
      style={{ background: 'linear-gradient(135deg,#00526e 0%,#006d94 50%,#0088ba 100%)' }}>
      <div className="absolute inset-0 opacity-10"
        style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '32px 32px' }} />
      <div className="relative">
        {backHref && (
          <Link href={backHref}>
            <button className="flex items-center gap-2 text-white/70 hover:text-white transition mb-4 text-sm">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
              </svg>
              {backLabel}
            </button>
          </Link>
        )}
        <h1 className="text-3xl font-bold text-white">{title}</h1>
        <p className="text-blue-100 mt-1 text-sm">{subtitle}</p>
      </div>
    </div>
  );
}

function Section({ title, icon, children }) {
  return (
    <div className="glass-card rounded-2xl p-6 space-y-4">
      <div className="flex items-center gap-2 pb-3 border-b border-gray-100 dark:border-gray-700">
        <span className="text-gray-400">{icon}</span>
        <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">{title}</h3>
      </div>
      {children}
    </div>
  );
}

function Field({ label, required, error, children }) {
  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
        {label}{required && <span className="text-red-400 ml-1">*</span>}
      </label>
      {children}
      {error && <p className="field-error">{error}</p>}
    </div>
  );
}

function ToggleRow({ checked, onChange, label, desc, disabled = false, icon }) {
  return (
    <div className={`flex items-start gap-4 p-4 rounded-xl border transition-all ${
      checked && !disabled
        ? 'border-[#006d94]/30 bg-[#006d94]/5 dark:bg-[#006d94]/10'
        : 'border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/30'
    } ${disabled ? 'opacity-50' : ''}`}>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          {icon && <span>{icon}</span>}
          <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">{label}</span>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 leading-relaxed">{desc}</p>
      </div>
      <button type="button" disabled={disabled} onClick={() => !disabled && onChange(!checked)}
        className={`relative w-11 h-6 rounded-full transition-colors duration-200 flex-shrink-0 mt-0.5 ${
          checked && !disabled ? 'bg-[#006d94]' : 'bg-gray-300 dark:bg-gray-600'
        }`}>
        <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${checked && !disabled ? 'translate-x-5' : ''}`} />
      </button>
    </div>
  );
}

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
  * { font-family: 'Inter', sans-serif; }
  .glass-card {
    background: rgba(255,255,255,0.97);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(0,0,0,0.06);
    box-shadow: 0 1px 3px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.04);
  }
  :global(.dark) .glass-card { background: rgba(30,41,59,0.97); border: 1px solid #334155; box-shadow: none; }
  .input-base { width:100%; padding:0.6rem 0.9rem; border:1.5px solid #e5e7eb; border-radius:0.75rem; font-size:0.85rem; transition:all 0.2s; background:white; color:#111827; }
  :global(.dark) .input-base { border-color:#374151; background:#1f2937; color:#f9fafb; }
  .input-base:focus { outline:none; border-color:#006d94; box-shadow:0 0 0 3px rgba(0,109,148,0.12); }
  .input-err { border-color:#ef4444 !important; }
  .field-error { color:#ef4444; font-size:0.72rem; margin-top:4px; }
  .btn-primary { background:linear-gradient(135deg,#006d94,#0088ba); color:white; padding:0.7rem 1.5rem; border-radius:0.75rem; font-size:0.85rem; font-weight:600; transition:all 0.2s; }
  .btn-primary:hover { transform:translateY(-1px); }
  @keyframes spin { to { transform:rotate(360deg); } }
  .spinner { display:inline-block; width:14px; height:14px; border:2px solid rgba(255,255,255,0.3); border-top-color:#fff; border-radius:50%; animation:spin 0.7s linear infinite; }
`;