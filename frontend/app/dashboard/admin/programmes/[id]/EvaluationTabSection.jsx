// app/dashboard/admin/programmes/[id]/EvaluationTabSection.jsx
// FIX: 
//   - Fusionne les doublons de même startup name en un seul groupe
//   - Garde le applicationId le plus récent (avec le plus d'évaluations)
//   - N/A sector → utilise le secteur de l'autre groupe si disponible

'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';

const scoreColor = (s) =>
  s >= 80 ? '#10b981' : s >= 65 ? '#f59e0b' : s >= 50 ? '#f97316' : '#ef4444';

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

const strId = (v) => (v == null ? '' : String(v).trim());

// ─── Group evaluations by startup name (not applicationId) ───────────────────
// If same startup has multiple applicationIds, merge them into one group
// but keep track of all applicationIds for navigation.
function groupByStartup(evaluations = []) {
  // Step 1: group by applicationId (precise)
  const byAppId = {};
  evaluations.forEach((ev) => {
    const appId = strId(
      ev.applicationId ||
      ev.application?._id ||
      ev.application?.id ||
      null
    );
    const key = appId || ev.startup || ev.startupName || 'unknown';

    if (!byAppId[key]) {
      byAppId[key] = {
        applicationId: appId || null,
        startup: ev.startup || ev.startupName || ev.application?.startupName || '—',
        sector: ev.sector || ev.application?.sector || '',
        evals: [],
        lastDate: null,
      };
    }
    byAppId[key].evals.push(ev);
    const d = ev.date || ev.submittedAt || ev.updatedAt;
    if (d && (!byAppId[key].lastDate || new Date(d) > new Date(byAppId[key].lastDate))) {
      byAppId[key].lastDate = d;
    }
  });

  // Step 2: merge groups with same startup name
  // Keep the applicationId of the group with the most evaluations (most relevant)
  const byName = {};
  Object.values(byAppId).forEach((g) => {
    const nameKey = (g.startup || '').toLowerCase().trim();
    if (!nameKey || nameKey === '—') {
      // No name, keep as-is with applicationId as key
      byName[g.applicationId || Math.random()] = g;
      return;
    }

    if (!byName[nameKey]) {
      byName[nameKey] = {
        ...g,
        allApplicationIds: g.applicationId ? [g.applicationId] : [],
      };
    } else {
      // Merge: combine evals, keep best sector, latest date, most-eval applicationId
      const existing = byName[nameKey];
      existing.evals = [...existing.evals, ...g.evals];

      // Use sector from whichever group has a real value
      if ((!existing.sector || existing.sector === 'N/A' || existing.sector === '—') && g.sector && g.sector !== 'N/A') {
        existing.sector = g.sector;
      }

      // Keep latest date
      if (g.lastDate && (!existing.lastDate || new Date(g.lastDate) > new Date(existing.lastDate))) {
        existing.lastDate = g.lastDate;
      }

      // Track all applicationIds
      if (g.applicationId) existing.allApplicationIds.push(g.applicationId);

      // Keep applicationId of the group with the most evals (most representative)
      if (g.evals.length > (byName[nameKey]._mainEvalsCount || 0)) {
        existing.applicationId = g.applicationId;
        existing._mainEvalsCount = g.evals.length;
      }
    }
  });

  // Step 3: compute stats
  return Object.values(byName).map((g) => {
    const submitted = g.evals.filter((e) => e.status === 'completed' || e.jurySubmitted);
    const total = g.evals.length;
    const avgScore =
      submitted.length > 0
        ? Math.round(submitted.reduce((s, e) => s + (e.score || e.totalScore || 0), 0) / submitted.length)
        : 0;
    const allDone = submitted.length === total && total > 0;
    const status = allDone ? 'completed' : submitted.length > 0 ? 'in_progress' : 'pending';

    // Clean up internal field
    const { _mainEvalsCount, ...rest } = g;
    return { ...rest, submitted: submitted.length, total, avgScore, status };
  }).sort((a, b) => b.avgScore - a.avgScore);
}

export default function EvaluationTabSection({ progId, evalStats, evalLoading }) {
  const router = useRouter();

  const groups = useMemo(
    () => groupByStartup(evalStats?.evaluations || []),
    [evalStats]
  );

  const summary = {
    total: groups.length,
    completed: groups.filter((g) => g.status === 'completed').length,
    inProgress: groups.filter((g) => g.status === 'in_progress').length,
    pending: groups.filter((g) => g.status === 'pending').length,
    avgScore: evalStats?.avgScore ?? null,
  };

  // Navigate to evaluation page filtered by applicationId
  const goToEval = (group) => {
    const base = `/dashboard/admin/programmes/${progId}/evaluation`;
    if (!group) {
      router.push(base);
      return;
    }
    const id = group.applicationId;
    const url = id ? `${base}?applicationId=${encodeURIComponent(id)}` : base;
    router.push(url);
  };

  const StatusBadge = ({ status, submitted, total }) => {
    const cfg = {
      completed:   { label: 'Complétée',  bg: '#dcfce7', color: '#15803d', dot: '#10b981' },
      in_progress: { label: 'En cours',   bg: '#fef9c3', color: '#a16207', dot: '#f59e0b' },
      pending:     { label: 'En attente', bg: '#f1f5f9', color: '#64748b', dot: '#94a3b8' },
    }[status] || { label: status, bg: '#f1f5f9', color: '#64748b', dot: '#94a3b8' };

    return (
      <span style={{
        display: 'inline-flex', alignItems: 'center', gap: 5,
        padding: '3px 9px', borderRadius: 99, fontSize: 11, fontWeight: 600,
        background: cfg.bg, color: cfg.color,
      }}>
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: cfg.dot, flexShrink: 0 }} />
        {cfg.label}
        {total > 0 && (
          <span style={{ opacity: 0.65 }}>({submitted}/{total})</span>
        )}
      </span>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* ── Summary cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
        {[
          { label: 'Candidatures', value: summary.total,      color: '#006d94', bg: 'rgba(0,109,148,.07)' },
          { label: 'Complétées',   value: summary.completed,  color: '#10b981', bg: 'rgba(16,185,129,.07)' },
          { label: 'En cours',     value: summary.inProgress, color: '#f59e0b', bg: 'rgba(245,158,11,.07)' },
          {
            label: 'Score moyen',
            value: summary.avgScore != null ? `${summary.avgScore}/100` : '—',
            color: summary.avgScore != null ? scoreColor(summary.avgScore) : '#94a3b8',
            bg: summary.avgScore != null ? `${scoreColor(summary.avgScore)}12` : 'rgba(148,163,184,.07)',
          },
        ].map((s) => (
          <div key={s.label} style={{
            padding: '12px 14px', borderRadius: 10,
            background: s.bg, border: `1px solid ${s.color}22`,
          }}>
            <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '.06em' }}>
              {s.label}
            </div>
            <div style={{ fontSize: 20, fontWeight: 700, color: s.color, fontFamily: 'monospace' }}>
              {s.value}
            </div>
          </div>
        ))}
      </div>

      {/* ── Table ── */}
      {evalLoading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[1, 2, 3].map((i) => (
            <div key={i} style={{
              height: 52, borderRadius: 10, background: '#f1f5f9',
              animation: 'pulse 1.5s ease-in-out infinite',
            }} />
          ))}
          <style>{`@keyframes pulse{0%,100%{opacity:.4}50%{opacity:.8}}`}</style>
        </div>
      ) : groups.length === 0 ? (
        <div style={{
          textAlign: 'center', padding: '48px 24px',
          border: '2px dashed rgba(0,0,0,.08)', borderRadius: 12,
          color: '#94a3b8',
        }}>
          <svg width="36" height="36" fill="none" stroke="currentColor" viewBox="0 0 24 24"
            style={{ margin: '0 auto 10px', display: 'block', opacity: .4 }}>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <p style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Aucune évaluation</p>
          <p style={{ fontSize: 12 }}>Les évaluations des jurés apparaîtront ici.</p>
        </div>
      ) : (
        <div style={{ borderRadius: 12, border: '1px solid rgba(0,0,0,.06)', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
            <colgroup>
              <col style={{ width: '28%' }} />
              <col style={{ width: '14%' }} />
              <col style={{ width: '18%' }} />
              <col style={{ width: '22%' }} />
              <col style={{ width: '18%' }} />
            </colgroup>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid rgba(0,0,0,.06)' }}>
                {['Startup', 'Jurés', 'Score moyen', 'Statut', 'Dernière éval.'].map((h) => (
                  <th key={h} style={{
                    padding: '10px 14px', textAlign: 'left',
                    fontSize: 10, fontWeight: 700, color: '#94a3b8',
                    textTransform: 'uppercase', letterSpacing: '.08em',
                  }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {groups.map((g, i) => (
                <tr
                  key={g.applicationId || g.startup || i}
                  onClick={() => goToEval(g)}
                  style={{
                    borderBottom: i < groups.length - 1 ? '1px solid rgba(0,0,0,.04)' : 'none',
                    cursor: 'pointer', transition: 'background .12s',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#f0f9ff'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  {/* Startup */}
                  <td style={{ padding: '12px 14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{
                        width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                        background: 'linear-gradient(135deg,#006d94,#0088ba)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: '#fff', fontSize: 11, fontWeight: 700,
                      }}>
                        {g.startup.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{g.startup}</div>
                        {g.sector && g.sector !== '—' && g.sector !== 'N/A' && (
                          <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 1 }}>{g.sector}</div>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Jurés count */}
                  <td style={{ padding: '12px 14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      <svg width="13" height="13" fill="none" stroke="#94a3b8" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                      <span style={{ fontSize: 13, fontWeight: 600, color: '#475569' }}>{g.total}</span>
                      <span style={{ fontSize: 11, color: '#94a3b8' }}>juré{g.total > 1 ? 's' : ''}</span>
                    </div>
                  </td>

                  {/* Score */}
                  <td style={{ padding: '12px 14px' }}>
                    {g.avgScore > 0 ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{
                          width: 52, height: 4, background: 'rgba(0,0,0,.07)', borderRadius: 99, overflow: 'hidden',
                        }}>
                          <div style={{
                            height: '100%', width: `${g.avgScore}%`,
                            background: scoreColor(g.avgScore), borderRadius: 99,
                          }} />
                        </div>
                        <span style={{ fontSize: 13, fontWeight: 700, fontFamily: 'monospace', color: scoreColor(g.avgScore) }}>
                          {g.avgScore}<span style={{ fontSize: 10, opacity: .6 }}>/100</span>
                        </span>
                      </div>
                    ) : (
                      <span style={{ fontSize: 12, color: '#cbd5e1' }}>—</span>
                    )}
                  </td>

                  {/* Status */}
                  <td style={{ padding: '12px 14px' }}>
                    <StatusBadge status={g.status} submitted={g.submitted} total={g.total} />
                  </td>

                  {/* Date + arrow */}
                  <td style={{ padding: '12px 14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 11, color: '#94a3b8', fontFamily: 'monospace' }}>
                        {fmtDate(g.lastDate)}
                      </span>
                      <svg width="13" height="13" fill="none" stroke="#cbd5e1" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── CTA ── */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '12px 16px', borderRadius: 10,
        background: 'linear-gradient(135deg,rgba(0,109,148,.05),rgba(0,136,186,.03))',
        border: '1px solid rgba(0,109,148,.12)',
      }}>
        <span style={{ fontSize: 12, color: '#475569' }}>
          Accédez à la page dédiée pour gérer toutes les évaluations jury et prendre les décisions finales.
        </span>
        <button
          onClick={() => goToEval(null)}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '7px 14px', borderRadius: 8, border: 'none', cursor: 'pointer',
            background: 'linear-gradient(135deg,#006d94,#0088ba)',
            color: '#fff', fontSize: 12, fontWeight: 600, flexShrink: 0,
          }}
        >
          Gérer les évaluations
          <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
}