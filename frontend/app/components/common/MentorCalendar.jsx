'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';

/* ─────────────────────────────────────────────
   Couleurs assignées dynamiquement aux startups
───────────────────────────────────────────── */
const PALETTE = [
  { dot: 'bg-blue-500',   badge: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',   bar: 'from-blue-500 to-blue-400'   },
  { dot: 'bg-emerald-500',badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300', bar: 'from-emerald-500 to-teal-400' },
  { dot: 'bg-violet-500', badge: 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300', bar: 'from-violet-500 to-purple-400' },
  { dot: 'bg-amber-500',  badge: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',  bar: 'from-amber-500 to-yellow-400' },
  { dot: 'bg-rose-500',   badge: 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300',    bar: 'from-rose-500 to-pink-400'    },
  { dot: 'bg-cyan-500',   badge: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300',    bar: 'from-cyan-500 to-sky-400'     },
];

const DAYS_FR   = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
const MONTHS_FR = [
  'Janvier','Février','Mars','Avril','Mai','Juin',
  'Juillet','Août','Septembre','Octobre','Novembre','Décembre',
];

/* Renvoie l'index lundi-basé (0=lun … 6=dim) */
function mondayIndex(date) {
  return (date.getDay() + 6) % 7;
}

/* Jours du calendrier affiché (6 semaines × 7) */
function buildCalendarDays(year, month) {
  const first = new Date(year, month, 1);
  const last  = new Date(year, month + 1, 0);
  const days  = [];

  // Jours du mois précédent
  for (let i = mondayIndex(first) - 1; i >= 0; i--) {
    const d = new Date(year, month, -i);
    days.push({ date: d, currentMonth: false });
  }
  // Jours du mois courant
  for (let d = 1; d <= last.getDate(); d++) {
    days.push({ date: new Date(year, month, d), currentMonth: true });
  }
  // Jours du mois suivant
  while (days.length % 7 !== 0) {
    const d = new Date(year, month + 1, days.length - last.getDate() - mondayIndex(first) + 1);
    days.push({ date: d, currentMonth: false });
  }
  return days;
}

/* Formate une heure depuis un ISO string */
function fmtTime(iso) {
  return new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

/* Badge "dans X jours" */
function relativeDay(iso) {
  const diff = Math.round(
    (new Date(iso).setHours(0,0,0,0) - new Date().setHours(0,0,0,0)) / 86400000
  );
  if (diff === 0)  return { label: "Aujourd'hui", cls: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300' };
  if (diff === 1)  return { label: 'Demain',      cls: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'   };
  if (diff  <  0)  return { label: `Il y a ${-diff}j`, cls: 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400' };
  return { label: `Dans ${diff}j`, cls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' };
}

/* ═══════════════════════════════════════════════
   Composant principal
═══════════════════════════════════════════════ */
/**
 * MentorCalendar
 *
 * Props :
 *   sessions  {Array}  — depuis useMentorSessions()
 *   startups  {Array}  — depuis useMentorStartups()
 *   loading   {boolean}
 *
 * Intégration dans page.jsx :
 *   import MentorCalendar from './MentorCalendar';
 *   ...
 *   <MentorCalendar sessions={sessions} startups={startups} loading={loadingSessions || loadingStartups} />
 */
export default function MentorCalendar({ sessions = [], startups = [], loading = false }) {
  const today     = new Date();
  const [viewYear,  setViewYear]  = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selected,  setSelected]  = useState(null); // Date object or null

  /* ── Assigner une couleur par startup ── */
  const colorByStartup = useMemo(() => {
    const map = {};
    startups.forEach((s, i) => {
      map[s._id] = PALETTE[i % PALETTE.length];
    });
    return map;
  }, [startups]);

  /* ── Sessions futures triées ── */
  const upcoming = useMemo(() =>
    [...sessions]
      .filter((s) => new Date(s.date) >= today)
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .slice(0, 6),
  [sessions]);

  /* ── Indexer les sessions par YYYY-MM-DD ── */
  const sessionsByDay = useMemo(() => {
    const map = {};
    sessions.forEach((s) => {
      const key = new Date(s.date).toDateString();
      (map[key] = map[key] || []).push(s);
    });
    return map;
  }, [sessions]);

  /* ── Sessions du jour sélectionné ── */
  const dayDetail = useMemo(() => {
    if (!selected) return [];
    return (sessionsByDay[selected.toDateString()] || [])
      .sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [selected, sessionsByDay]);

  const calDays = useMemo(() => buildCalendarDays(viewYear, viewMonth), [viewYear, viewMonth]);

  /* ── Navigation mois ── */
  const prevMonth = () => {
    if (viewMonth === 0) { setViewYear((y) => y - 1); setViewMonth(11); }
    else                   setViewMonth((m) => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewYear((y) => y + 1); setViewMonth(0); }
    else                    setViewMonth((m) => m + 1);
  };

  /* ── Naviguer le calendrier vers une date ── */
  const goToDate = (iso) => {
    const d = new Date(iso);
    setViewYear(d.getFullYear());
    setViewMonth(d.getMonth());
    setSelected(d);
  };

  if (loading) {
    return (
      <div className="glass-card rounded-xl p-6">
        <div className="h-64 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

      {/* ── Calendrier ── */}
      <div className="lg:col-span-3 glass-card rounded-xl overflow-hidden">
        {/* En-tête */}
        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-gray-900 dark:text-white">Calendrier des sessions</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Cliquez sur un jour pour voir le détail</p>
          </div>
          <Link
            href="/dashboard/mentor/sessions/new"
            className="text-xs font-semibold px-3 py-1.5 bg-[#006d94] hover:bg-[#00526e] text-white rounded-lg transition-colors"
          >
            + Session
          </Link>
        </div>

        {/* Navigation mois */}
        <div className="px-6 pt-4 flex items-center justify-between mb-3">
          <button
            onClick={prevMonth}
            className="w-8 h-8 rounded-lg border border-gray-200 dark:border-gray-700 flex items-center justify-center text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            ‹
          </button>
          <span className="text-sm font-semibold text-gray-900 dark:text-white">
            {MONTHS_FR[viewMonth]} {viewYear}
          </span>
          <button
            onClick={nextMonth}
            className="w-8 h-8 rounded-lg border border-gray-200 dark:border-gray-700 flex items-center justify-center text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            ›
          </button>
        </div>

        {/* Grille jours */}
        <div className="px-4 pb-4">
          {/* Noms des jours */}
          <div className="grid grid-cols-7 mb-1">
            {DAYS_FR.map((d) => (
              <div key={d} className="text-center text-[10px] font-semibold text-gray-400 py-1 uppercase tracking-wide">
                {d}
              </div>
            ))}
          </div>

          {/* Cellules */}
          <div className="grid grid-cols-7 gap-0.5">
            {calDays.map(({ date, currentMonth }, idx) => {
              const daySessions = sessionsByDay[date.toDateString()] || [];
              const isToday     = date.toDateString() === today.toDateString();
              const isSelected  = selected && date.toDateString() === selected.toDateString();
              const hasSession  = daySessions.length > 0;

              return (
                <button
                  key={idx}
                  onClick={() => setSelected(isSelected ? null : date)}
                  className={[
                    'flex flex-col items-center justify-start pt-1 pb-1 rounded-lg min-h-[44px] transition-all text-xs font-medium',
                    !currentMonth && 'opacity-30',
                    isSelected  && 'bg-[#006d94] text-white ring-2 ring-[#006d94]/30',
                    isToday && !isSelected && 'bg-blue-50 dark:bg-blue-900/20 text-[#006d94] dark:text-blue-400 font-bold',
                    !isToday && !isSelected && hasSession && 'text-gray-900 dark:text-white',
                    !isToday && !isSelected && !hasSession && 'text-gray-500 dark:text-gray-400',
                    'hover:bg-gray-100 dark:hover:bg-gray-800',
                    isSelected && 'hover:bg-[#006d94]',
                  ].filter(Boolean).join(' ')}
                >
                  <span>{date.getDate()}</span>
                  {/* Points de couleur */}
                  {hasSession && (
                    <div className="flex gap-0.5 mt-0.5 flex-wrap justify-center max-w-[28px]">
                      {daySessions.slice(0, 3).map((s, i) => {
                        const sid = s.startupId?._id || s.startupId;
                        const col = colorByStartup[sid] || PALETTE[0];
                        return (
                          <span
                            key={i}
                            className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white/80' : col.dot}`}
                          />
                        );
                      })}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Légende startups */}
        {startups.length > 0 && (
          <div className="px-6 pb-4 flex flex-wrap gap-2">
            {startups.slice(0, 6).map((s) => {
              const col = colorByStartup[s._id] || PALETTE[0];
              return (
                <span key={s._id} className={`flex items-center gap-1.5 text-xs px-2 py-0.5 rounded-full ${col.badge}`}>
                  <span className={`w-2 h-2 rounded-full ${col.dot}`} />
                  {s.name}
                </span>
              );
            })}
          </div>
        )}

        {/* Détail du jour sélectionné */}
        {selected && (
          <div className="border-t border-gray-100 dark:border-gray-800 px-6 py-4">
            <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-3">
              {selected.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
            {dayDetail.length === 0 ? (
              <div className="text-center py-4 text-gray-400">
                <p className="text-xs">Aucune session ce jour</p>
                <Link
                  href={`/dashboard/mentor/sessions/new?date=${selected.toISOString().split('T')[0]}`}
                  className="text-xs text-[#006d94] hover:underline mt-1 inline-block"
                >
                  + Planifier une session
                </Link>
              </div>
            ) : (
              <div className="space-y-2">
                {dayDetail.map((s) => {
                  const sid  = s.startupId?._id || s.startupId;
                  const col  = colorByStartup[sid] || PALETTE[0];
                  const name = s.startupId?.projectName || s.startupId?.companyName || 'Startup';
                  return (
                    <div key={s._id} className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                      <div className="flex flex-col items-center gap-1 pt-0.5">
                        <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${col.dot}`} />
                        <span className="w-px flex-1 bg-gray-200 dark:bg-gray-700 min-h-[16px]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-semibold text-gray-900 dark:text-white">{name}</p>
                          <span className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0">
                            {fmtTime(s.date)}{s.duration ? ` · ${s.duration}min` : ''}
                          </span>
                        </div>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5 truncate">{s.topic}</p>
                        {s.notes && (
                          <p className="text-xs text-gray-400 mt-0.5 line-clamp-1 italic">{s.notes}</p>
                        )}
                        {s.meetingLink && (
                          <a
                            href={s.meetingLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-[#006d94] hover:underline mt-1 inline-block"
                          >
                            Rejoindre la réunion →
                          </a>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Sessions à venir ── */}
      <div className="lg:col-span-2 glass-card rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800">
          <h2 className="font-semibold text-gray-900 dark:text-white">Sessions à venir</h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Prochains rendez-vous planifiés</p>
        </div>
        <div className="p-4">
          {upcoming.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              {/* Calendar icon inline */}
              <svg className="w-8 h-8 mx-auto mb-2 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p className="text-sm">Aucune session planifiée</p>
              <Link href="/dashboard/mentor/sessions/new" className="mt-1 text-xs text-[#006d94] hover:underline inline-block">
                Planifier une session →
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {upcoming.map((s) => {
                const sid   = s.startupId?._id || s.startupId;
                const col   = colorByStartup[sid] || PALETTE[0];
                const name  = s.startupId?.projectName || s.startupId?.companyName || 'Startup';
                const rel   = relativeDay(s.date);

                return (
                  <button
                    key={s._id}
                    onClick={() => goToDate(s.date)}
                    className="w-full text-left p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors group"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${col.dot}`} />
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">{name}</p>
                      </div>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${rel.cls}`}>
                        {rel.label}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 ml-4">
                      {new Date(s.date).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })}
                      {' à '}{fmtTime(s.date)}
                      {s.duration ? ` · ${s.duration}min` : ''}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 ml-4 mt-0.5 truncate">{s.topic}</p>
                    {s.meetingLink && (
                      <a
                        href={s.meetingLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="text-xs text-[#006d94] hover:underline ml-4 mt-1 inline-block"
                      >
                        Rejoindre →
                      </a>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Lien agenda complet */}
        <div className="px-4 pb-4">
          <Link
            href="/dashboard/mentor/sessions"
            className="flex items-center justify-center gap-2 w-full py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            Voir l'agenda complet
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>
    </div>
  );
}