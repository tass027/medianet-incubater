// app/dashboard/admin/programmes/[id]/evaluation/page.jsx

'use client';

import { useState, useEffect, useCallback, useRef, Suspense } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import ProtectedRoute from '@/app/components/common/ProtectedRoute';
import DashboardLayout from '@/app/components/layout/DashboardLayout';
import Modal from '@/app/components/common/Modal';
import Alert from '@/app/components/common/Alert';
import axiosAuth from '@/app/lib/axiosAuth';

// ─── Constants ────────────────────────────────────────────────────────────────
const CRITERIA = [
  { id: 'team',       name: 'Équipe',      weight: 30, color: '#6366f1' },
  { id: 'innovation', name: 'Innovation',  weight: 25, color: '#0ea5e9' },
  { id: 'market',     name: 'Marché',      weight: 20, color: '#10b981' },
  { id: 'business',   name: 'Modèle Éco.', weight: 15, color: '#f59e0b' },
  { id: 'traction',   name: 'Traction',    weight: 10, color: '#ef4444' },
];

const CRITERIA_ALIASES = {
  team:       ['team', 'equipe', 'équipe', 'Equipe', 'Équipe'],
  innovation: ['innovation', 'Innovation'],
  market:     ['market', 'marche', 'marché', 'Marche', 'Marché'],
  business:   ['business', 'modele', 'modèle', 'model', 'Modèle économique', 'modele_eco'],
  traction:   ['traction', 'Traction'],
};

const DECISION_OPTIONS = [
  { value: 'accepted', label: 'Acceptée',   color: '#10b981', bg: '#dcfce7', border: '#bbf7d0' },
  { value: 'rejected', label: 'Refusée',    color: '#ef4444', bg: '#fee2e2', border: '#fecaca' },
  { value: 'waitlist', label: 'Liste att.', color: '#f59e0b', bg: '#fef9c3', border: '#fef08a' },
  { value: 'pending',  label: 'En attente', color: '#6b7280', bg: '#f1f5f9', border: '#e2e8f0' },
];

const SECTOR_COLORS = {
  FinTech: '#0ea5e9', HealthTech: '#10b981', AgriTech: '#22c55e',
  EdTech: '#f59e0b', CleanTech: '#a855f7', Default: '#64748b',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const sc         = (s) => SECTOR_COLORS[s] || SECTOR_COLORS.Default;
const fmtDate    = (d) => d ? new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';
const scoreColor = (s) => s >= 80 ? '#10b981' : s >= 65 ? '#f59e0b' : s >= 50 ? '#f97316' : '#ef4444';
const scoreLabel = (s) => s >= 80 ? 'Excellent' : s >= 65 ? 'Bien' : s >= 50 ? 'Moyen' : 'Faible';
const decisionOpt = (v) => DECISION_OPTIONS.find((d) => d.value === v) || DECISION_OPTIONS[3];

const normScore = (v) => {
  if (v == null || v === 0) return 0;
  const n = parseFloat(v);
  if (isNaN(n)) return 0;
  return n <= 10 ? Math.round(n * 10) : Math.round(n);
};

function resolveCriteriaScores(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const result = {};
  let hasAny = false;
  CRITERIA.forEach((c) => {
    for (const alias of CRITERIA_ALIASES[c.id]) {
      if (raw[alias] != null) {
        result[c.id] = normScore(raw[alias]);
        hasAny = true;
        break;
      }
    }
    if (result[c.id] == null) result[c.id] = 0;
  });
  return hasAny ? result : null;
}

function normalizeEval(ev) {
  const rawScore = ev.score ?? ev.totalScore ?? 0;
  const score100 = normScore(rawScore);
  const rawScores = ev.scores || ev.criteriaScores || ev.criteria || null;
  const resolvedScores = resolveCriteriaScores(rawScores);
  const displayScores = resolvedScores || (score100 > 0
    ? Object.fromEntries(CRITERIA.map((c) => [c.id, score100]))
    : null);
  return { ...ev, score: score100, totalScore: score100, scores: displayScores };
}

function groupByStartup(evals, decisions) {
  const decMap = {};
  (decisions || []).forEach((d) => { decMap[d.applicationId] = d; });
  const map = {};
  (evals || []).forEach((ev) => {
    const normalized = normalizeEval(ev);
    const key = normalized.applicationId || normalized.startup || 'unknown';
    if (!map[key]) {
      map[key] = {
        applicationId: normalized.applicationId,
        startup: normalized.startup || normalized.startupName || '—',
        sector: normalized.sector || '—',
        evals: [],
        decision: decMap[normalized.applicationId]?.decision || 'pending',
        adminNote: decMap[normalized.applicationId]?.adminNote || '',
        notified: decMap[normalized.applicationId]?.notified || false,
      };
    }
    map[key].evals.push(normalized);
  });
  return Object.values(map).map((g) => {
    const submitted = g.evals.filter((e) => e.status === 'completed' || e.jurySubmitted);
    const avgScore = submitted.length > 0
      ? Math.round(submitted.reduce((s, e) => s + (e.score || 0), 0) / submitted.length)
      : 0;
    return { ...g, avgScore, submittedCount: submitted.length };
  }).sort((a, b) => b.avgScore - a.avgScore);
}

// ─── Score bar ────────────────────────────────────────────────────────────────
function ScoreBar({ score }) {
  if (!score) return <span style={{ fontSize: 12, color: '#cbd5e1' }}>—</span>;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ width: 56, height: 4, background: 'rgba(0,0,0,.07)', borderRadius: 99, overflow: 'hidden', flexShrink: 0 }}>
        <div style={{ height: '100%', width: `${Math.min(score, 100)}%`, background: scoreColor(score), borderRadius: 99 }} />
      </div>
      <span style={{ fontSize: 13, fontWeight: 700, fontFamily: 'monospace', color: scoreColor(score), whiteSpace: 'nowrap' }}>
        {score}<span style={{ fontSize: 10, opacity: .6 }}>/100</span>
      </span>
    </div>
  );
}

// ─── Decision select ──────────────────────────────────────────────────────────
function DecisionSelect({ value, onChange, saving }) {
  const opt = decisionOpt(value);
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} disabled={saving}
      style={{
        appearance: 'none', WebkitAppearance: 'none',
        padding: '4px 24px 4px 8px', borderRadius: 6, fontSize: 11, fontWeight: 700,
        background: opt.bg, color: opt.color, border: `1px solid ${opt.border}`,
        cursor: 'pointer', outline: 'none', minWidth: 100,
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='${encodeURIComponent(opt.color)}' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`,
        backgroundRepeat: 'no-repeat', backgroundPosition: 'right 5px center',
      }}>
      {DECISION_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}

// ─── Jury Row ─────────────────────────────────────────────────────────────────
function JuryRow({ ev, groupDecision, onDecisionChange, savingDecision, onOpenDetail, isLast }) {
  const done = ev.status === 'completed' || ev.jurySubmitted;
  const inProgress = !done && ev.status === 'in_progress';
  const score = ev.score || 0;

  const statusCfg = done
    ? { label: 'Soumis',     bg: '#dcfce7', color: '#15803d', dot: '#10b981' }
    : inProgress
    ? { label: 'En cours',   bg: '#fef9c3', color: '#a16207', dot: '#f59e0b' }
    : { label: 'En attente', bg: '#f1f5f9', color: '#64748b', dot: '#94a3b8' };

  return (
    <tr style={{ borderBottom: !isLast ? '1px solid rgba(0,0,0,.04)' : 'none', transition: 'background .12s' }}
      onMouseEnter={(e) => e.currentTarget.style.background = '#fafcff'}
      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>

      {/* Juré */}
      <td style={{ padding: '11px 14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 28, height: 28, borderRadius: 7, flexShrink: 0,
            background: 'linear-gradient(135deg,#006d94,#0088ba)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontSize: 10, fontWeight: 700,
          }}>
            {(ev.juryName || ev.jurorName || 'J').slice(0, 2).toUpperCase()}
          </div>
          <span style={{ fontSize: 13, fontWeight: 600, color: '#1e293b' }}>
            {ev.juryName || ev.jurorName || 'Jury'}
          </span>
        </div>
      </td>

      {/* Score */}
      <td style={{ padding: '11px 14px' }}><ScoreBar score={score} /></td>

      {/* Critères mini bars */}
      <td style={{ padding: '11px 14px' }}>
        {ev.scores && Object.values(ev.scores).some((v) => v > 0) ? (
          <div style={{ display: 'flex', gap: 4 }}>
            {CRITERIA.map((c) => {
              const v = ev.scores[c.id] || 0;
              return (
                <div key={c.id} title={`${c.name}: ${v}/100`}
                  style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                  <div style={{ width: 4, height: 28, background: 'rgba(0,0,0,.06)', borderRadius: 99, overflow: 'hidden', position: 'relative' }}>
                    <div style={{ position: 'absolute', bottom: 0, width: '100%', height: `${v}%`, background: c.color, borderRadius: 99 }} />
                  </div>
                  <span style={{ fontSize: 9, color: '#94a3b8' }}>{c.id.slice(0, 3)}</span>
                </div>
              );
            })}
          </div>
        ) : <span style={{ fontSize: 11, color: '#cbd5e1' }}>—</span>}
      </td>

      {/* Statut */}
      <td style={{ padding: '11px 14px' }}>
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: 4,
          padding: '3px 8px', borderRadius: 99, fontSize: 10, fontWeight: 700,
          background: statusCfg.bg, color: statusCfg.color,
        }}>
          <span style={{ width: 5, height: 5, borderRadius: '50%', background: statusCfg.dot }} />
          {statusCfg.label}
        </span>
      </td>

      {/* Date */}
      <td style={{ padding: '11px 14px' }}>
        <span style={{ fontSize: 11, color: '#94a3b8', fontFamily: 'monospace' }}>
          {fmtDate(ev.date || ev.submittedAt)}
        </span>
      </td>

      {/* Décision */}
      <td style={{ padding: '11px 14px' }}>
        <DecisionSelect value={groupDecision} onChange={onDecisionChange} saving={savingDecision} />
      </td>

      {/* Voir */}
      <td style={{ padding: '11px 12px', textAlign: 'right' }}>
        {done && (
          <button onClick={onOpenDetail} style={{
            display: 'inline-flex', alignItems: 'center', gap: 4,
            padding: '4px 9px', borderRadius: 6, border: '1px solid rgba(0,109,148,.2)',
            background: 'rgba(0,109,148,.05)', color: '#006d94',
            fontSize: 11, fontWeight: 600, cursor: 'pointer',
          }}>
            <svg width="11" height="11" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            Voir
          </button>
        )}
      </td>
    </tr>
  );
}

// ─── Startup Section ──────────────────────────────────────────────────────────
function StartupSection({ group, onDecisionChange, savingFor, onOpenDetail, highlighted, sectionRef }) {
  const [expanded, setExpanded] = useState(!!highlighted);
  const decOpt = decisionOpt(group.decision);
  const color  = sc(group.sector);

  // Re-expand if highlighted changes (e.g. after navigation)
  useEffect(() => {
    if (highlighted) setExpanded(true);
  }, [highlighted]);

  return (
    <div ref={sectionRef} style={{
      borderRadius: 14,
      border: highlighted ? '2px solid #006d94' : '1px solid rgba(0,0,0,.06)',
      background: '#fff', overflow: 'hidden',
      boxShadow: highlighted
        ? '0 0 0 4px rgba(0,109,148,.1), 0 2px 8px rgba(0,0,0,.06)'
        : '0 1px 4px rgba(0,0,0,.04)',
      transition: 'box-shadow .3s, border-color .3s',
    }}>

      {/* Header */}
      <div onClick={() => setExpanded((v) => !v)} style={{
        padding: '14px 18px', cursor: 'pointer',
        background: highlighted ? 'rgba(0,109,148,.04)' : 'rgba(248,250,252,.8)',
        borderBottom: expanded ? '1px solid rgba(0,0,0,.05)' : 'none',
        display: 'flex', alignItems: 'center', gap: 14,
      }}>
        <div style={{
          width: 40, height: 40, borderRadius: 10, flexShrink: 0,
          background: `linear-gradient(135deg,${color}cc,${color})`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#fff', fontSize: 12, fontWeight: 700,
        }}>
          {group.startup.slice(0, 2).toUpperCase()}
        </div>

        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>{group.startup}</span>
            <span style={{ padding: '2px 8px', borderRadius: 99, fontSize: 10, fontWeight: 700, color: '#fff', background: color }}>
              {group.sector}
            </span>
            <span style={{
              padding: '2px 9px', borderRadius: 99, fontSize: 10, fontWeight: 700,
              background: decOpt.bg, color: decOpt.color, border: `1px solid ${decOpt.border}`,
            }}>
              {decOpt.label}
            </span>
            {group.notified && (
              <span style={{ padding: '2px 8px', borderRadius: 99, fontSize: 10, fontWeight: 600, background: '#f0fdf4', color: '#15803d', border: '1px solid #bbf7d0' }}>
                ✓ Notifié
              </span>
            )}
          </div>
          <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 3 }}>
            {group.evals.length} juré{group.evals.length > 1 ? 's' : ''} assigné{group.evals.length > 1 ? 's' : ''} ·{' '}
            {group.submittedCount}/{group.evals.length} évaluation{group.evals.length > 1 ? 's' : ''} complétée{group.submittedCount > 1 ? 's' : ''}
          </div>
        </div>

        {group.avgScore > 0 && (
          <div style={{ textAlign: 'right', marginRight: 8 }}>
            <div style={{ fontSize: 9, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 2 }}>Moy. jury</div>
            <div style={{
              padding: '4px 12px', borderRadius: 8,
              background: `${scoreColor(group.avgScore)}15`, color: scoreColor(group.avgScore),
              fontFamily: 'monospace', fontWeight: 700, fontSize: 18,
            }}>
              {group.avgScore}<span style={{ fontSize: 10, opacity: .6 }}>/100</span>
            </div>
            <div style={{ fontSize: 9, color: '#94a3b8', marginTop: 1 }}>{scoreLabel(group.avgScore)}</div>
          </div>
        )}

        <svg width="16" height="16" fill="none" stroke="#94a3b8" viewBox="0 0 24 24"
          style={{ flexShrink: 0, transform: expanded ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }}>
          <polyline points="6 9 12 15 18 9" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} />
        </svg>
      </div>

      {/* Table */}
      {expanded && (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
            <colgroup>
              <col style={{ width: '18%' }} /><col style={{ width: '15%' }} /><col style={{ width: '12%' }} />
              <col style={{ width: '12%' }} /><col style={{ width: '14%' }} /><col style={{ width: '18%' }} />
              <col style={{ width: '11%' }} />
            </colgroup>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid rgba(0,0,0,.05)' }}>
                {['Juré', 'Score global', 'Critères', 'Statut', 'Date', 'Décision finale', ''].map((h) => (
                  <th key={h} style={{ padding: '8px 14px', textAlign: 'left', fontSize: 9, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '.08em' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {group.evals.map((ev, i) => (
                <JuryRow
                  key={ev.id || i}
                  ev={ev}
                  groupDecision={group.decision}
                  onDecisionChange={(val) => onDecisionChange(group.applicationId, val)}
                  savingDecision={savingFor === group.applicationId}
                  onOpenDetail={() => onOpenDetail(ev, group.startup)}
                  isLast={i === group.evals.length - 1}
                />
              ))}
            </tbody>
          </table>
          {group.adminNote && (
            <div style={{
              margin: '0 14px 12px', padding: '8px 12px', borderRadius: 8,
              background: 'rgba(251,191,36,.06)', border: '1px solid rgba(251,191,36,.18)',
              fontSize: 12, color: '#92400e', fontStyle: 'italic',
            }}>
              📝 {group.adminNote}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── EvalDetailModal — remplace uniquement la fonction EvalDetailModal
// dans evaluation/page.jsx
// Onglets : Critères | Note globale | Points clés | Feedback
// Champs API couverts :
//   noteGlobale / globalNote / overallNote / noteGlobal
//   pointsCles / keyPoints / pointsClés / strengths+weaknesses
//   feedback / globalRemark / comment / remarks

function EvalDetailModal({ isOpen, ev, startupName, onClose }) {
  const [tab, setTab] = useState('criteres');
  useEffect(() => { if (isOpen) setTab('criteres'); }, [isOpen]);

  if (!isOpen || !ev) return null;

  const score      = ev.score || 0;
  const scores     = ev.scores || {};
  const hasCriteria = Object.values(scores).some((v) => v > 0);

  // ── Note globale (texte libre) ──
  const noteGlobale =
    ev.noteGlobale ?? ev.globalNote ?? ev.overallNote ?? ev.noteGlobal ??
    ev.globalComment ?? ev.overallComment ?? null;

  // ── Points clés (peut être un objet {positifs, negatifs}, un tableau, ou une string) ──
  const rawPointsCles =
    ev.pointsCles ?? ev.keyPoints ?? ev.pointsClés ?? ev.pointsCles ??
    ev.pointsKey ?? ev.keyFindings ?? null;

  // ── Feedback ──
  const feedback = ev.feedback ?? ev.globalRemark ?? ev.comment ?? ev.remarks ?? null;

  // Normalize points clés into { positifs: string[], negatifs: string[] } or { items: string[] }
  const parsePointsCles = (raw) => {
    if (!raw) return null;
    if (typeof raw === 'string' && raw.trim()) return { items: [raw] };
    if (Array.isArray(raw) && raw.length > 0) return { items: raw };
    if (typeof raw === 'object') {
      const pos = raw.positifs ?? raw.strengths ?? raw.atouts ?? raw.positive ?? [];
      const neg = raw.negatifs ?? raw.weaknesses ?? raw.faiblesses ?? raw.negative ?? raw.risks ?? [];
      const items = raw.items ?? raw.points ?? [];
      if (pos.length || neg.length) return { positifs: pos, negatifs: neg };
      if (items.length) return { items };
    }
    return null;
  };
  const pointsCles = parsePointsCles(rawPointsCles);

  const TABS = [
    { id: 'criteres',    label: 'Critères'     },
    { id: 'note',        label: 'Note globale' },
    { id: 'points',      label: 'Points clés'  },
    { id: 'feedback',    label: 'Feedback'     },
  ];

  const hasContent = {
    note:     !!noteGlobale,
    points:   !!pointsCles,
    feedback: !!feedback,
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Évaluation — ${startupName}`} size="lg">

      {/* ── Juré header ── */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20,
        padding: '12px 16px', borderRadius: 12,
        background: 'linear-gradient(135deg,rgba(0,109,148,.05),rgba(0,136,186,.03))',
        border: '1px solid rgba(0,109,148,.1)',
      }}>
        <div style={{
          width: 38, height: 38, borderRadius: 9, flexShrink: 0,
          background: 'linear-gradient(135deg,#006d94,#0088ba)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#fff', fontSize: 11, fontWeight: 700,
        }}>
          {(ev.juryName || ev.jurorName || 'J').slice(0, 2).toUpperCase()}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: 13, color: '#0f172a' }}>
            {ev.juryName || ev.jurorName || 'Jury'}
          </div>
          <div style={{ fontSize: 11, color: '#94a3b8' }}>
            Soumis le {fmtDate(ev.date || ev.submittedAt)}
          </div>
        </div>
        <div style={{
          padding: '5px 14px', borderRadius: 9,
          background: `${scoreColor(score)}15`, color: scoreColor(score),
          fontFamily: 'monospace', fontWeight: 800, fontSize: 20,
        }}>
          {score}<span style={{ fontSize: 10, opacity: .5 }}>/100</span>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0', marginBottom: 18, gap: 0 }}>
        {TABS.map(({ id, label }) => (
          <button key={id} onClick={() => setTab(id)} style={{
            paddingBottom: 10, paddingLeft: 12, paddingRight: 12,
            fontSize: 11, fontWeight: 700, border: 'none', cursor: 'pointer',
            borderBottom: `2px solid ${tab === id ? '#006d94' : 'transparent'}`,
            color: tab === id ? '#006d94' : '#94a3b8',
            background: 'transparent', textTransform: 'uppercase', letterSpacing: '.07em',
            position: 'relative',
          }}>
            {label}
            {/* dot indicator if content exists */}
            {hasContent[id] && tab !== id && (
              <span style={{
                position: 'absolute', top: 4, right: 4,
                width: 5, height: 5, borderRadius: '50%', background: '#10b981',
              }} />
            )}
          </button>
        ))}
      </div>

      {/* ── Critères ── */}
      {tab === 'criteres' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {/* Score total */}
          <div style={{
            textAlign: 'center', padding: '16px', borderRadius: 12,
            background: '#f8fafc', border: '1px solid #e2e8f0', marginBottom: 4,
          }}>
            <div style={{ fontSize: 9, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 4 }}>Score total</div>
            <div style={{ fontSize: 44, fontWeight: 800, lineHeight: 1, color: scoreColor(score), fontFamily: 'monospace' }}>{score}</div>
            <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>/100 · {scoreLabel(score)}</div>
          </div>

          {hasCriteria ? CRITERIA.map((c) => {
            const val = scores[c.id] || 0;
            return (
              <div key={c.id} style={{ padding: '10px 12px', borderRadius: 10, background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <span style={{ width: 7, height: 7, borderRadius: '50%', background: c.color, display: 'inline-block' }} />
                    <span style={{ fontWeight: 600, fontSize: 12, color: '#0f172a' }}>{c.name}</span>
                    <span style={{ fontSize: 10, color: '#94a3b8' }}>({c.weight}%)</span>
                  </div>
                  <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 13, color: c.color }}>
                    {val}<span style={{ fontSize: 9, opacity: .6 }}>/100</span>
                  </span>
                </div>
                <div style={{ height: 4, background: '#e2e8f0', borderRadius: 99, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${Math.min(val, 100)}%`, background: c.color, borderRadius: 99 }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 3 }}>
                  <span style={{ fontSize: 10, color: '#94a3b8', fontFamily: 'monospace' }}>+{Math.round(val * c.weight / 100)} pts</span>
                </div>
              </div>
            );
          }) : (
            <div style={{
              textAlign: 'center', padding: '24px', color: '#94a3b8', fontSize: 13,
              background: '#f8fafc', borderRadius: 10, border: '1px dashed #e2e8f0',
            }}>
              Détail par critère non disponible pour cette évaluation.
            </div>
          )}
        </div>
      )}

      {/* ── Note globale ── */}
      {tab === 'note' && (
        <div>
          {noteGlobale ? (
            <div style={{
              padding: '16px 18px', borderRadius: 12,
              background: 'linear-gradient(135deg,rgba(0,109,148,.03),rgba(0,136,186,.02))',
              border: '1px solid rgba(0,109,148,.12)',
              fontSize: 14, color: '#1e293b', lineHeight: 1.8,
              whiteSpace: 'pre-line',
            }}>
              {noteGlobale}
            </div>
          ) : (
            <EmptyState icon="📝" message="Aucune note globale fournie par ce juré." />
          )}
        </div>
      )}

      {/* ── Points clés ── */}
      {tab === 'points' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {!pointsCles ? (
            <EmptyState icon="🔑" message="Aucun point clé fourni par ce juré." />
          ) : pointsCles.items ? (
            // Simple list
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {pointsCles.items.map((item, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'flex-start', gap: 10,
                  padding: '10px 14px', borderRadius: 10,
                  background: '#f8fafc', border: '1px solid #e2e8f0',
                }}>
                  <span style={{
                    width: 20, height: 20, borderRadius: '50%', flexShrink: 0, marginTop: 1,
                    background: 'rgba(0,109,148,.1)', color: '#006d94',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 10, fontWeight: 700,
                  }}>{i + 1}</span>
                  <span style={{ fontSize: 13, color: '#374151', lineHeight: 1.6 }}>{item}</span>
                </div>
              ))}
            </div>
          ) : (
            // Positifs / Négatifs
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {pointsCles.positifs?.length > 0 && (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                    <span style={{ fontSize: 14 }}>✅</span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#15803d', textTransform: 'uppercase', letterSpacing: '.07em' }}>
                      Points forts
                    </span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {(Array.isArray(pointsCles.positifs) ? pointsCles.positifs : [pointsCles.positifs]).map((p, i) => (
                      <div key={i} style={{
                        display: 'flex', alignItems: 'flex-start', gap: 10,
                        padding: '9px 14px', borderRadius: 9,
                        background: '#f0fdf4', border: '1px solid #bbf7d0',
                      }}>
                        <span style={{ color: '#10b981', fontSize: 13, marginTop: 1, flexShrink: 0 }}>+</span>
                        <span style={{ fontSize: 13, color: '#166534', lineHeight: 1.6 }}>{p}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {pointsCles.negatifs?.length > 0 && (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                    <span style={{ fontSize: 14 }}>⚠️</span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#b45309', textTransform: 'uppercase', letterSpacing: '.07em' }}>
                      Points d'amélioration
                    </span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {(Array.isArray(pointsCles.negatifs) ? pointsCles.negatifs : [pointsCles.negatifs]).map((n, i) => (
                      <div key={i} style={{
                        display: 'flex', alignItems: 'flex-start', gap: 10,
                        padding: '9px 14px', borderRadius: 9,
                        background: '#fffbeb', border: '1px solid #fde68a',
                      }}>
                        <span style={{ color: '#f59e0b', fontSize: 13, marginTop: 1, flexShrink: 0 }}>−</span>
                        <span style={{ fontSize: 13, color: '#92400e', lineHeight: 1.6 }}>{n}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── Feedback ── */}
      {tab === 'feedback' && (
        <div>
          {feedback ? (
            <div style={{
              padding: '14px 16px', borderRadius: 10,
              background: '#f8fafc', border: '1px solid #e2e8f0',
              fontSize: 14, color: '#374151', lineHeight: 1.8, fontStyle: 'italic',
              whiteSpace: 'pre-line',
            }}>
              "{feedback}"
            </div>
          ) : (
            <EmptyState icon="💬" message="Aucun feedback fourni par ce juré." />
          )}
        </div>
      )}

      {/* ── Footer ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 20, paddingTop: 14, borderTop: '1px solid #e2e8f0' }}>
        <span style={{ fontSize: 11, color: '#94a3b8' }}>🔒 Lecture seule</span>
        <button onClick={onClose} style={{
          padding: '7px 20px', borderRadius: 8, border: '1px solid rgba(0,0,0,.1)',
          background: 'transparent', color: '#475569', fontSize: 13, fontWeight: 500, cursor: 'pointer',
        }}>
          Fermer
        </button>
      </div>
    </Modal>
  );
}

// ── Small helper for empty states ──
function EmptyState({ icon, message }) {
  return (
    <div style={{
      textAlign: 'center', padding: '36px 24px',
      background: '#f8fafc', borderRadius: 12,
      border: '1px dashed #e2e8f0', color: '#94a3b8',
    }}>
      <div style={{ fontSize: 32, marginBottom: 10 }}>{icon}</div>
      <p style={{ fontSize: 13, margin: 0 }}>{message}</p>
    </div>
  );
}

// ─── Inner page (uses useSearchParams — must be inside Suspense) ───────────────
function EvaluationPageInner() {
  const router       = useRouter();
  const params       = useParams();
  const searchParams = useSearchParams();
  const progId = params?.id;

  // Read optional targeted applicationId from URL query param
  const targetId = searchParams?.get('applicationId') || null;

  const [loading,     setLoading]     = useState(true);
  const [programme,   setProgramme]   = useState(null);
  const [groups,      setGroups]      = useState([]);
  const [search,      setSearch]      = useState('');
  const [alert,       setAlert]       = useState({ show: false, type: '', message: '' });
  const [detailModal, setDetailModal] = useState(null);
  const [savingFor,   setSavingFor]   = useState(null);

  const sectionRefs = useRef({});

  const showAlert = (type, message) => {
    setAlert({ show: true, type, message });
    setTimeout(() => setAlert({ show: false, type: '', message: '' }), 4000);
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [progRes, evalRes, decRes] = await Promise.allSettled([
        axiosAuth.get(`/api/admin/programmes/${progId}`),
        axiosAuth.get(`/api/admin/programmes/${progId}/evaluations`),
        axiosAuth.get(`/api/admin/programmes/${progId}/decisions`),
      ]);
      const prog      = progRes.status === 'fulfilled' ? progRes.value.data.programme   : null;
      const evals     = evalRes.status === 'fulfilled' ? (evalRes.value.data.evaluations || []) : [];
      const decisions = decRes.status  === 'fulfilled' ? (decRes.value.data.decisions   || []) : [];
      setProgramme(prog);
      setGroups(groupByStartup(evals, decisions));
    } catch (err) {
      console.error('[EvaluationPage load]', err);
      showAlert('error', 'Erreur de chargement');
    } finally {
      setLoading(false);
    }
  }, [progId]);

  useEffect(() => { loadData(); }, [loadData]);

  // Scroll + highlight targeted candidature
  useEffect(() => {
    if (!targetId || loading) return;
    const timer = setTimeout(() => {
      const el = sectionRefs.current[targetId];
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 400);
    return () => clearTimeout(timer);
  }, [targetId, loading]);

  const handleDecisionChange = async (applicationId, decision) => {
    setSavingFor(applicationId);
    try {
      await axiosAuth.post(`/api/admin/programmes/${progId}/decisions`, { applicationId, decision, adminNote: '' });
      setGroups((prev) => prev.map((g) => g.applicationId === applicationId ? { ...g, decision } : g));
      showAlert('success', 'Décision enregistrée');
    } catch {
      showAlert('error', 'Erreur lors de la sauvegarde');
    } finally {
      setSavingFor(null);
    }
  };

  const filtered = groups.filter((g) =>
    g.startup.toLowerCase().includes(search.toLowerCase())
  );

  const stats = {
    total:    groups.length,
    done:     groups.filter((g) => g.submittedCount === g.evals.length && g.evals.length > 0).length,
    accepted: groups.filter((g) => g.decision === 'accepted').length,
    avgScore: groups.length > 0
      ? Math.round(groups.filter((g) => g.avgScore > 0).reduce((s, g) => s + g.avgScore, 0) / Math.max(1, groups.filter((g) => g.avgScore > 0).length))
      : 0,
  };

  return (
    <div className="space-y-5 pb-16">

      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg,#00526e 0%,#006d94 55%,#0088ba 100%)',
        borderRadius: 16, padding: '24px 28px', position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', width: 220, height: 220, borderRadius: '50%', background: 'rgba(255,255,255,.03)', top: -60, right: -30, pointerEvents: 'none' }} />
        <div style={{ position: 'relative' }}>
          <button onClick={() => router.push(`/dashboard/admin/programmes/${progId}`)}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 12,
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'rgba(255,255,255,.6)', fontSize: 11, fontWeight: 600,
              textTransform: 'uppercase', letterSpacing: '.1em', padding: 0,
            }}>
            <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            {programme?.titre || 'Programme'}
          </button>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 16 }}>
            <div>
              <h1 style={{ fontSize: 22, fontWeight: 700, color: '#fff', margin: '0 0 4px' }}>Évaluations Jury</h1>
              <p style={{ fontSize: 13, color: 'rgba(147,197,253,.7)', margin: 0 }}>
                Vue consolidée par candidature · décisions inline · lecture seule
              </p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, auto)', gap: 8 }}>
              {[
                { label: 'Candidatures', value: stats.total,                               accent: '#38bdf8' },
                { label: 'Évaluées',     value: stats.done,                                accent: '#4ade80' },
                { label: 'Acceptées',    value: stats.accepted,                            accent: '#34d399' },
                { label: 'Score moy.',   value: stats.avgScore ? `${stats.avgScore}` : '—', accent: '#fbbf24' },
              ].map((s) => (
                <div key={s.label} style={{
                  padding: '9px 14px', borderRadius: 10, textAlign: 'center',
                  background: 'rgba(255,255,255,.08)', border: '1px solid rgba(255,255,255,.1)',
                }}>
                  <div style={{ fontSize: 9, color: 'rgba(255,255,255,.45)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 2 }}>{s.label}</div>
                  <div style={{ fontSize: 17, fontWeight: 700, color: s.accent, fontFamily: 'monospace' }}>{s.value}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {alert.show && (
        <Alert type={alert.type} message={alert.message} onClose={() => setAlert({ show: false, type: '', message: '' })} />
      )}

      {/* Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={loadData} style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '8px 13px', borderRadius: 9, border: '1px solid rgba(0,0,0,.1)',
            background: '#fff', color: '#475569', fontSize: 12, fontWeight: 500, cursor: 'pointer',
          }}>
            <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Actualiser
          </button>

          {targetId && (
            <button onClick={() => router.push(`/dashboard/admin/programmes/${progId}/evaluation`)}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '8px 13px', borderRadius: 9, border: '1px solid rgba(0,109,148,.2)',
                background: 'rgba(0,109,148,.06)', color: '#006d94', fontSize: 12, fontWeight: 500, cursor: 'pointer',
              }}>
              <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Voir toutes les candidatures
            </button>
          )}
        </div>

        <div style={{ position: 'relative', minWidth: 240 }}>
          <svg width="14" height="14" fill="none" stroke="#94a3b8" viewBox="0 0 24 24"
            style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher une startup…"
            style={{
              width: '100%', padding: '8px 12px 8px 32px',
              border: '1px solid rgba(0,0,0,.1)', borderRadius: 9,
              background: '#fff', color: '#0f172a', fontSize: 13, outline: 'none', boxSizing: 'border-box',
            }} />
        </div>
      </div>

      {/* Guide */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap',
        padding: '10px 14px', borderRadius: 9,
        background: 'rgba(0,109,148,.04)', border: '1px solid rgba(0,109,148,.1)',
        fontSize: 11, color: '#64748b',
      }}>
        <span style={{ fontWeight: 600, color: '#006d94' }}>ℹ️ Guide :</span>
        <span>Cliquez sur l'en-tête d'une candidature pour réduire/étendre.</span>
        <span>·</span>
        <span>La colonne <strong>Décision finale</strong> est partagée par tous les jurés d'une même candidature.</span>
        <span>·</span>
        <span>Le bouton <strong>Voir</strong> ouvre l'évaluation détaillée.</span>
      </div>

      {/* Loading skeleton */}
      {loading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[1, 2, 3].map((i) => (
            <div key={i} style={{ height: 80, borderRadius: 14, background: '#f1f5f9', animation: 'shimmer 1.6s ease-in-out infinite' }} />
          ))}
          <style>{`@keyframes shimmer{0%,100%{opacity:.35}50%{opacity:.7}}`}</style>
        </div>
      )}

      {/* Empty */}
      {!loading && filtered.length === 0 && (
        <div style={{ textAlign: 'center', padding: '56px 24px', border: '2px dashed rgba(0,0,0,.08)', borderRadius: 14, color: '#94a3b8' }}>
          <svg width="40" height="40" fill="none" stroke="currentColor" viewBox="0 0 24 24"
            style={{ margin: '0 auto 12px', display: 'block', opacity: .35 }}>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <p style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>Aucune évaluation</p>
          <p style={{ fontSize: 12 }}>Les évaluations des jurés apparaîtront ici une fois soumises.</p>
        </div>
      )}

      {/* Startup groups */}
      {!loading && filtered.map((group, gi) => (
        <StartupSection
          key={group.applicationId || gi}
          group={group}
          onDecisionChange={handleDecisionChange}
          savingFor={savingFor}
          onOpenDetail={(ev, startup) => setDetailModal({ ev, startup })}
          highlighted={!!targetId && group.applicationId === targetId}
          sectionRef={(el) => { if (el && group.applicationId) sectionRefs.current[group.applicationId] = el; }}
        />
      ))}

      {/* Detail modal */}
      <EvalDetailModal
        isOpen={!!detailModal}
        ev={detailModal?.ev}
        startupName={detailModal?.startup}
        onClose={() => setDetailModal(null)}
      />
    </div>
  );
}

// ─── Main export — wraps inner component in Suspense (required for useSearchParams in Next.js 13+)
export default function ProgrammeEvaluationPage() {
  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <DashboardLayout>
        <Suspense fallback={
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
            <div style={{ width: 32, height: 32, border: '2px solid #006d94', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
          </div>
        }>
          <EvaluationPageInner />
        </Suspense>
      </DashboardLayout>
    </ProtectedRoute>
  );
}