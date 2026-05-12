'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import ProtectedRoute from '@/app/components/common/ProtectedRoute';
import DashboardLayout from '@/app/components/layout/DashboardLayout';
import { useSelector } from 'react-redux';
import { axiosAuth } from '@/app/store/slices/authSlice';

const CHART_COLORS = ['#4285F4','#EA4335','#FBBC04','#34A853','#FF6D00','#46BDC6','#7B68EE','#E91E63','#00BCD4','#8BC34A'];

const hr = h => { const r = h.replace('#','').match(/.{2}/g); return r ? r.map(x => parseInt(x,16)).join(',') : '0,109,148'; };

const tk = (dark, accent) => {
  const rgb = hr(accent); const L = !dark;
  return {
    card:    L ? '#FFFFFF'  : '#1E1B24',
    card2:   L ? '#F7F4FF'  : '#231F2E',
    line:    L ? '#E4DFF0'  : '#2E2A3C',
    line2:   L ? '#CFC8E8'  : '#3D3756',
    ink:     L ? '#1A1523'  : '#EDE9F8',
    ink2:    L ? '#4B4560'  : '#B8B0D0',
    ink3:    L ? '#8B83A3'  : '#6B6485',
    hover:   L ? '#F0ECF9'  : '#231F2E',
    shadow:  L ? '0 1px 2px rgba(20,15,40,.04),0 4px 16px rgba(20,15,40,.07)' : '0 1px 2px rgba(0,0,0,.3),0 4px 16px rgba(0,0,0,.4)',
    shadowLg:L ? '0 8px 24px rgba(20,15,40,.10)' : '0 8px 24px rgba(0,0,0,.5)',
    ac: accent, acRgb: rgb,
    acBg:    `rgba(${rgb},.09)`,
    acLine:  `rgba(${rgb},.30)`,
    acText:  accent,
    errBg:   L ? '#FEF2F2' : '#2D1515',
    errText: L ? '#DC2626' : '#FCA5A5',
  };
};

const Svg = ({d,sz=16,fill=false,sw=2}) => (
  <svg width={sz} height={sz} viewBox="0 0 24 24"
    fill={fill?'currentColor':'none'} stroke={fill?'none':'currentColor'}
    strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"
    style={{display:'block',flexShrink:0}}>{d}</svg>
);
const IC = {
  back  : <Svg d={<><path d="M19 12H5M12 19l-7-7 7-7"/>                                                                                                                           </>}/>,
  dl    : <Svg d={<><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>                                </>}/>,
  sheets: <Svg d={<><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="9" x2="9" y2="21"/><line x1="15" y1="9" x2="15" y2="21"/></>}/>,
  prev  : <Svg d={<><polyline points="15 18 9 12 15 6"/>                                                                                                                           </>}/>,
  next  : <Svg d={<><polyline points="9 18 15 12 9 6"/>                                                                                                                            </>}/>,
  trash : <Svg d={<><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6M10 11v6M14 11v6M9 6V4h6v2"/>                                                                       </>}/>,
  print : <Svg d={<><path d="M6 9V2h12v7M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"/><rect x="6" y="14" width="12" height="8"/>                        </>}/>,
  copy  : <Svg d={<><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>                                              </>}/>,
  check : <Svg d={<><polyline points="20 6 9 17 4 12"/>                                                                                                                            </>}/>,
  send  : <Svg d={<><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>                                                                          </>}/>,
  spin  : (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
      style={{display:'block',flexShrink:0,animation:'_spin .65s linear infinite'}}>
      <circle cx="12" cy="12" r="10" strokeOpacity=".15"/>
      <path d="M12 2a10 10 0 0110 10" strokeLinecap="round"/>
    </svg>
  ),
};

// ════════════════════════════════════════════════════════════════════
//  MAIN PAGE
// ════════════════════════════════════════════════════════════════════
export default function FormResponsesPage() {
  const router   = useRouter();
  const params   = useParams();
  const { user } = useSelector(s => s.auth);

  const formId = params?.id;

  const [isDark,    setDark]    = useState(false);
  const [form,      setForm]    = useState(null);
  const [responses, setResponses] = useState([]);
  const [loading,   setLoading] = useState(true);
  const [error,     setError]   = useState(null);
  const [tab,       setTab]     = useState('summary');
  const [toast,     setToast]   = useState(null);

  // Sync dark mode
  useEffect(() => {
    const sync = () => setDark(document.documentElement.classList.contains('dark'));
    sync();
    const obs = new MutationObserver(sync);
    obs.observe(document.documentElement, {attributes:true, attributeFilter:['class']});
    return () => obs.disconnect();
  }, []);

  // ── Fetch form + responses from API ─────────────────────────────
  useEffect(() => {
    if (!formId) return;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        // Fetch form details
        const formRes = await axiosAuth.get(`/api/forms/${formId}`);
        const formData = formRes.data?.form ?? formRes.data;
        setForm(formData);

        // Fetch responses for this form
        const respRes = await axiosAuth.get(`/api/forms/${formId}/responses`);
        // Handle various response shapes from the API
        const respData = respRes.data?.responses ?? respRes.data?.data ?? respRes.data ?? [];
        setResponses(Array.isArray(respData) ? respData : []);
      } catch (err) {
        console.error('Error loading form responses:', err);
        setError(err.response?.data?.message || 'Failed to load form data');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [formId]);

  const accent = form?.accent || '#006d94';
  const T = tk(isDark, accent);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 2600); };

  // ── Build questions list from form data ──────────────────────────
  // Support both `questions` and `fields` naming from DB
  const questions = form?.questions || form?.fields || [];

  // ── Completion rate ──────────────────────────────────────────────
  const totalSent = form?.sentTo || 0;
  const respondedCount = responses.length;
  const completionRate = totalSent > 0 ? Math.round((respondedCount / totalSent) * 100) : (respondedCount > 0 ? 100 : 0);

  // ── Normalize response answers ───────────────────────────────────
  // Responses from DB have answers in `answers` or `formResponses` field
  const normalizedResponses = responses.map(r => ({
    ...r,
    id: r._id || r.id,
    respondent: r.respondent || r.founderName || r.founder || r.company || 'Unknown',
    email: r.email || r.founderEmail || '',
    submittedAt: r.submittedAt
      ? new Date(r.submittedAt).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })
      : '',
    answers: r.answers || r.formResponses || {},
  }));

  // ── Export as XLS ────────────────────────────────────────────────
  const exportXLS = () => {
    const clean = (v) => String(v == null ? '' : v).replace(/\r\n|\r|\n/g, ' ');
    const SEP = '\t';
    const EOL = '\r\n';
    const headers = ['Respondent', 'Email', 'Submitted At'].concat(questions.map(q => q.label || q.title));
    const rowsData = normalizedResponses.map(r =>
      [r.respondent, r.email, r.submittedAt].concat(questions.map(q => r.answers[q.id] || ''))
    );
    const lines = [headers].concat(rowsData).map(row => row.map(clean).join(SEP)).join(EOL);
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + lines], { type: 'application/vnd.ms-excel;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = (form?.title || 'form').replace(/\s+/g, '_') + '_responses_' + new Date().toISOString().slice(0,10) + '.xls';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast(`Exported ${normalizedResponses.length} response${normalizedResponses.length !== 1 ? 's' : ''}`);
  };

  const card = { background:T.card, border:`1px solid ${T.line}`, borderRadius:16, boxShadow:T.shadow };

  const TABS = [
    { id:'summary',    label:'Summary'    },
    { id:'question',   label:'Question'   },
    { id:'individual', label:'Individual' },
    { id:'trends',     label:'Trends'     },
  ];

  // ── Loading state ────────────────────────────────────────────────
  if (loading) return (
    <ProtectedRoute allowedRoles={['admin']}>
      <DashboardLayout>
        <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:320,gap:12,color:'#6B7280',fontFamily:'system-ui'}}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{animation:'spin .65s linear infinite'}}>
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
            <circle cx="12" cy="12" r="10" strokeOpacity=".15"/>
            <path d="M12 2a10 10 0 0110 10" strokeLinecap="round"/>
          </svg>
          Loading responses…
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );

  // ── Error state ──────────────────────────────────────────────────
  if (error) return (
    <ProtectedRoute allowedRoles={['admin']}>
      <DashboardLayout>
        <div style={{textAlign:'center',padding:'64px 24px',fontFamily:'system-ui'}}>
          <p style={{fontSize:16,color:'#DC2626',marginBottom:12}}>{error}</p>
          <button onClick={() => router.push('/dashboard/admin/forms')}
            style={{padding:'8px 20px',background:'#006d94',color:'#fff',border:'none',borderRadius:9,cursor:'pointer',fontSize:14}}>
            Back to Forms
          </button>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );

  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <DashboardLayout>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
          @keyframes _fadeUp { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
          @keyframes _spin   { to{transform:rotate(360deg)} }
          ._up { animation:_fadeUp .32s cubic-bezier(.22,1,.36,1) both }
          ._d1 { animation-delay:.06s }
          ._scroll::-webkit-scrollbar{width:3px}
          ._scroll::-webkit-scrollbar-track{background:transparent}
          ._scroll::-webkit-scrollbar-thumb{background:${T.line2};border-radius:99px}
        `}</style>

        <div style={{fontFamily:"'Plus Jakarta Sans',system-ui,sans-serif", display:'flex', flexDirection:'column', gap:16, paddingBottom:56}}>

          {/* Toast */}
          {toast && (
            <div style={{position:'fixed',bottom:24,left:'50%',transform:'translateX(-50%)',zIndex:9999,display:'flex',alignItems:'center',gap:9,padding:'10px 20px',borderRadius:12,background:T.card,color:T.ink,border:`1px solid ${T.line}`,boxShadow:T.shadowLg,fontSize:13,fontWeight:600,animation:'_fadeUp .28s cubic-bezier(.22,1,.36,1) both',pointerEvents:'none',whiteSpace:'nowrap'}}>
              <span style={{display:'flex',color:'#22C55E'}}>{IC.check}</span>
              {toast}
            </div>
          )}

          {/* ── HEADER ──────────────────────────────────────────── */}
          <div className="_up" style={{background:'linear-gradient(135deg,#00526e 0%,#006d94 55%,#0088ba 100%)',borderRadius:18,padding:'28px 32px',position:'relative',overflow:'hidden'}}>
            <div style={{position:'absolute',inset:0,pointerEvents:'none',backgroundImage:'linear-gradient(rgba(255,255,255,.04) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.04) 1px,transparent 1px)',backgroundSize:'30px 30px'}}/>
            <div style={{position:'relative'}}>
              {/* Breadcrumb */}
              <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:18}}>
                <button onClick={()=>router.push('/dashboard/admin/forms')}
                  style={{display:'flex',alignItems:'center',gap:6,background:'rgba(255,255,255,.13)',border:'1px solid rgba(255,255,255,.2)',borderRadius:100,padding:'5px 14px',cursor:'pointer',color:'rgba(255,255,255,.9)',fontSize:12,fontWeight:700,fontFamily:'inherit',transition:'background .15s'}}
                  onMouseEnter={e=>e.currentTarget.style.background='rgba(255,255,255,.22)'}
                  onMouseLeave={e=>e.currentTarget.style.background='rgba(255,255,255,.13)'}>
                  {IC.back}&nbsp;Forms
                </button>
                <span style={{color:'rgba(255,255,255,.3)'}}>/ </span>
                <span style={{color:'rgba(255,255,255,.7)',fontSize:12,maxWidth:180,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{form?.title}</span>
                <span style={{color:'rgba(255,255,255,.3)'}}>/ </span>
                <span style={{color:'rgba(255,255,255,.9)',fontSize:12,fontWeight:700}}>Responses</span>
              </div>

              <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:16}}>
                <div>
                  <h1 style={{margin:'0 0 4px',fontSize:28,fontWeight:800,color:'#fff',letterSpacing:'-.02em'}}>{form?.title}</h1>
                  <p style={{margin:'0 0 18px',fontSize:14,color:'rgba(186,230,253,.8)'}}>{form?.programmeName || 'Form responses'}</p>
                  <div style={{display:'inline-flex',alignItems:'center',gap:10,background:'rgba(255,255,255,.15)',borderRadius:12,padding:'10px 18px',backdropFilter:'blur(8px)',border:'1px solid rgba(255,255,255,.2)'}}>
                    <span style={{fontSize:28,fontWeight:800,color:'#fff',letterSpacing:'-.03em'}}>{normalizedResponses.length}</span>
                    <span style={{fontSize:13,color:'rgba(255,255,255,.7)',fontWeight:500,lineHeight:1.3}}>total<br/>responses</span>
                    {totalSent > 0 && (
                      <>
                        <div style={{width:1,height:28,background:'rgba(255,255,255,.2)',margin:'0 4px'}}/>
                        <div style={{textAlign:'center'}}>
                          <span style={{fontSize:20,fontWeight:800,color:'#fff'}}>{completionRate}%</span>
                          <span style={{fontSize:11,color:'rgba(255,255,255,.7)',display:'block',marginTop:-2}}>completion</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
                {/* Export buttons */}
                <div style={{display:'flex',flexDirection:'column',gap:8,alignItems:'flex-end'}}>
                  <button onClick={exportXLS}
                    style={{display:'flex',alignItems:'center',gap:8,background:'rgba(255,255,255,.15)',border:'1px solid rgba(255,255,255,.25)',borderRadius:10,padding:'9px 18px',cursor:'pointer',color:'#fff',fontSize:13,fontWeight:600,fontFamily:'inherit',transition:'all .15s',backdropFilter:'blur(8px)'}}
                    onMouseEnter={e=>e.currentTarget.style.background='rgba(255,255,255,.25)'}
                    onMouseLeave={e=>e.currentTarget.style.background='rgba(255,255,255,.15)'}>
                    {IC.sheets}<span>View in Sheets</span>
                  </button>
                  <button onClick={exportXLS}
                    style={{display:'flex',alignItems:'center',gap:8,background:'rgba(255,255,255,.1)',border:'1px solid rgba(255,255,255,.15)',borderRadius:10,padding:'9px 18px',cursor:'pointer',color:'rgba(255,255,255,.8)',fontSize:13,fontWeight:600,fontFamily:'inherit',transition:'all .15s'}}
                    onMouseEnter={e=>e.currentTarget.style.background='rgba(255,255,255,.2)'}
                    onMouseLeave={e=>e.currentTarget.style.background='rgba(255,255,255,.1)'}>
                    {IC.dl}<span>Export XLS</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* ── TAB CONTAINER ────────────────────────────────────── */}
          <div className="_up _d1" style={{...card, overflow:'hidden'}}>
            {/* Tab header */}
            <div style={{borderBottom:`1px solid ${T.line}`,display:'flex',alignItems:'center',padding:'0 24px',gap:0}}>
              <div style={{marginRight:'auto',padding:'20px 0 16px'}}>
                <span style={{fontSize:22,fontWeight:800,color:T.ink,letterSpacing:'-.02em'}}>{normalizedResponses.length} response{normalizedResponses.length!==1?'s':''}</span>
              </div>
              <div style={{display:'flex',gap:0,flexWrap:'wrap'}}>
                {TABS.map(t=>(
                  <button key={t.id} onClick={()=>setTab(t.id)}
                    style={{padding:'18px 28px 14px',border:'none',background:'none',fontFamily:'inherit',fontSize:13.5,fontWeight:600,cursor:'pointer',transition:'color .15s',color:tab===t.id?accent:T.ink3,borderBottom:`3px solid ${tab===t.id?accent:'transparent'}`,marginBottom:-1}}
                    onMouseEnter={e=>{if(tab!==t.id)e.currentTarget.style.color=T.ink2;}}
                    onMouseLeave={e=>{if(tab!==t.id)e.currentTarget.style.color=T.ink3;}}>
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Tab content */}
            <div style={{padding:'24px'}}>
              {normalizedResponses.length === 0 ? (
                <div style={{textAlign:'center',padding:'64px 24px',color:T.ink3}}>
                  <div style={{fontSize:48,marginBottom:16}}>📭</div>
                  <p style={{fontSize:16,fontWeight:600,color:T.ink2,margin:'0 0 8px'}}>No responses yet</p>
                  <p style={{fontSize:14,color:T.ink3,margin:0}}>Responses will appear here once candidates submit the form.</p>
                </div>
              ) : (
                <>
                  {tab==='summary'    && <SummaryTab    form={{...form, questions}} responses={normalizedResponses} T={T} accent={accent} showToast={showToast} totalSent={totalSent}/>}
                  {tab==='question'   && <QuestionTab   form={{...form, questions}} responses={normalizedResponses} T={T} accent={accent}/>}
                  {tab==='individual' && <IndividualTab form={{...form, questions}} responses={normalizedResponses} T={T} accent={accent} showToast={showToast} formId={formId} onDelete={async (respId) => {
                    try {
                      await axiosAuth.delete(`/api/forms/${formId}/responses/${respId}`);
                      setResponses(prev => prev.filter(r => (r._id || r.id) !== respId));
                      showToast('Response deleted');
                    } catch { showToast('Delete failed'); }
                  }}/>}
                  {tab==='trends'     && <TrendsTab     responses={normalizedResponses} T={T} accent={accent}/>}
                </>
              )}
            </div>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}

// ════════════════════════════════════════════════════════════════════
//  SUMMARY TAB
// ════════════════════════════════════════════════════════════════════
function SummaryTab({ form, responses, T, accent, showToast, totalSent }) {
  const responded = responses.length;
  const completionRate = totalSent > 0 ? Math.round((responded / totalSent) * 100) : (responded > 0 ? 100 : 0);
  const questions = form?.questions || [];

  return (
    <div style={{display:'flex',flexDirection:'column',gap:20}}>
      {/* Completion Rate Card */}
      {totalSent > 0 && (
        <div style={{background:T.card2,border:`1px solid ${T.line}`,borderRadius:14,padding:'20px 24px',display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:16}}>
          <div>
            <p style={{margin:'0 0 4px',fontSize:13,fontWeight:600,textTransform:'uppercase',letterSpacing:'.07em',color:T.ink3}}>Completion Rate</p>
            <p style={{margin:0,fontSize:32,fontWeight:800,color:T.ink}}>{completionRate}%</p>
          </div>
          <div style={{display:'flex',gap:32}}>
            <div><p style={{margin:'0 0 2px',fontSize:28,fontWeight:800,color:accent}}>{responded}</p><p style={{margin:0,fontSize:12,color:T.ink3}}>Responded</p></div>
            <div><p style={{margin:'0 0 2px',fontSize:28,fontWeight:800,color:T.ink3}}>{totalSent - responded}</p><p style={{margin:0,fontSize:12,color:T.ink3}}>Pending</p></div>
            <div><p style={{margin:'0 0 2px',fontSize:28,fontWeight:800,color:T.ink2}}>{totalSent}</p><p style={{margin:0,fontSize:12,color:T.ink3}}>Total Sent</p></div>
          </div>
          <div style={{flex:1,maxWidth:200}}>
            <div style={{height:8,background:T.line,borderRadius:99,overflow:'hidden'}}>
              <div style={{width:`${completionRate}%`,height:'100%',background:accent,borderRadius:99,transition:'width .5s'}}/>
            </div>
          </div>
        </div>
      )}

      {/* Questions */}
      {questions.map((q) => {
        const answers = responses.map(r => r.answers[q.id]).filter(Boolean);
        return (
          <QuestionCard key={q.id} q={q} answers={answers} T={T} accent={accent} total={responses.length}
            onCopy={()=>showToast('Chart copied')}/>
        );
      })}
    </div>
  );
}

function QuestionCard({ q, answers, T, accent, total, onCopy }) {
  const freq = {};
  answers.forEach(a => { freq[a] = (freq[a]||0) + 1; });
  const entries = Object.entries(freq).sort((a,b) => b[1]-a[1]);
  const maxCount = entries.length ? Math.max(...entries.map(e => e[1])) : 1;
  const qType = q.type;
  const showPie = (qType === 'choice' || qType === 'radio' || qType === 'dropdown' || qType === 'scale' || qType === 'checkbox') && entries.length <= 8;
  const showText = qType === 'short' || qType === 'long';

  const label = q.label || q.title || 'Question';

  return (
    <div style={{background:T.card,border:`1px solid ${T.line}`,borderRadius:14,overflow:'hidden',boxShadow:'0 1px 4px rgba(0,0,0,.06)'}}>
      <div style={{padding:'20px 24px 16px',display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:12}}>
        <div>
          <p style={{margin:'0 0 4px',fontSize:16,fontWeight:700,color:T.ink}}>{label}</p>
          <p style={{margin:0,fontSize:12.5,color:T.ink3}}>{answers.length} response{answers.length!==1?'s':''}</p>
        </div>
        <button onClick={onCopy}
          style={{display:'flex',alignItems:'center',gap:6,padding:'6px 12px',borderRadius:8,border:`1px solid ${T.line}`,background:'transparent',color:T.ink3,fontSize:12,fontWeight:600,cursor:'pointer',fontFamily:'inherit',transition:'all .14s',flexShrink:0}}
          onMouseEnter={e=>{e.currentTarget.style.background=T.hover;e.currentTarget.style.color=T.ink;}}
          onMouseLeave={e=>{e.currentTarget.style.background='transparent';e.currentTarget.style.color=T.ink3;}}>
          {IC.copy} Copy chart
        </button>
      </div>
      <div style={{padding:'0 24px 24px'}}>
        {answers.length === 0 ? (
          <p style={{color:T.ink3,fontSize:13,fontStyle:'italic'}}>No answers yet.</p>
        ) : showPie ? (
          entries.length <= 6
            ? <PieChart entries={entries} total={total} T={T}/>
            : <BarChart entries={entries} maxCount={maxCount} total={total} T={T}/>
        ) : showText ? (
          <div style={{display:'flex',flexDirection:'column',gap:8,maxHeight:320,overflowY:'auto'}} className="_scroll">
            {answers.map((ans, i) => (
              <div key={i} style={{padding:'12px 16px',background:T.card2,borderRadius:10,border:`1px solid ${T.line}`,fontSize:13.5,color:T.ink,lineHeight:1.5}}>
                {ans}
              </div>
            ))}
          </div>
        ) : (
          <BarChart entries={entries} maxCount={maxCount} total={total} T={T}/>
        )}
      </div>
    </div>
  );
}

function PieChart({ entries, total, T }) {
  const size = 180; const cx = size/2; const cy = size/2; const r = 70;
  let cumAngle = -90;
  const slices = entries.map(([label, count], i) => {
    const pct = count / total;
    const angle = pct * 360;
    const s = (cumAngle * Math.PI) / 180;
    const e = ((cumAngle + angle) * Math.PI) / 180;
    const x1 = cx + r * Math.cos(s); const y1 = cy + r * Math.sin(s);
    const x2 = cx + r * Math.cos(e); const y2 = cy + r * Math.sin(e);
    const large = angle > 180 ? 1 : 0;
    const midRad = ((cumAngle + angle/2) * Math.PI) / 180;
    const lx = cx + r*0.65*Math.cos(midRad); const ly = cy + r*0.65*Math.sin(midRad);
    const path = `M${cx},${cy} L${x1},${y1} A${r},${r} 0 ${large},1 ${x2},${y2} Z`;
    cumAngle += angle;
    return { path, color: CHART_COLORS[i % CHART_COLORS.length], pct: (pct*100).toFixed(1), label, count, lx, ly, show: pct > 0.07 };
  });
  return (
    <div style={{display:'flex',alignItems:'center',gap:32,flexWrap:'wrap'}}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {slices.map((s,i)=><path key={i} d={s.path} fill={s.color} stroke="#fff" strokeWidth="1.5"/>)}
        {slices.map((s,i)=>s.show&&<text key={i} x={s.lx} y={s.ly} textAnchor="middle" dominantBaseline="middle" fill="#fff" fontSize="10" fontWeight="700">{s.pct}%</text>)}
      </svg>
      <div style={{display:'flex',flexDirection:'column',gap:8}}>
        {slices.map((s,i)=>(
          <div key={i} style={{display:'flex',alignItems:'center',gap:8}}>
            <span style={{width:10,height:10,borderRadius:'50%',background:s.color,flexShrink:0}}/>
            <span style={{fontSize:13,color:T.ink2}}>{s.label}</span>
            <span style={{fontSize:12,color:T.ink3,fontWeight:600,marginLeft:'auto',paddingLeft:16}}>{s.pct}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function BarChart({ entries, maxCount, total, T }) {
  return (
    <div style={{display:'flex',flexDirection:'column',gap:10}}>
      {entries.map(([label, count], i) => {
        const pct = maxCount > 0 ? (count/maxCount)*100 : 0;
        const realPct = total > 0 ? ((count/total)*100).toFixed(1) : 0;
        return (
          <div key={i}>
            <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:4}}>
              <span style={{fontSize:12.5,color:T.ink2,minWidth:120,flexShrink:0}}>{label}</span>
              <div style={{flex:1,height:22,background:T.card2,borderRadius:4,overflow:'hidden',border:`1px solid ${T.line}`}}>
                <div style={{height:'100%',width:`${pct}%`,background:CHART_COLORS[i%CHART_COLORS.length],borderRadius:4,transition:'width .5s',display:'flex',alignItems:'center',paddingLeft:8}}>
                  {pct > 25 && <span style={{fontSize:10,fontWeight:700,color:'#fff'}}>{count} ({realPct}%)</span>}
                </div>
              </div>
              {pct <= 25 && <span style={{fontSize:12,color:T.ink3,fontWeight:600,flexShrink:0}}>{count} ({realPct}%)</span>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
//  QUESTION TAB
// ════════════════════════════════════════════════════════════════════
function QuestionTab({ form, responses, T, accent }) {
  const [qIdx, setQIdx] = useState(0);
  const questions = form?.questions || [];
  const q = questions[qIdx];
  const total = questions.length;
  const answers = q ? responses.map(r => ({ respondent: r.respondent, value: r.answers[q.id] })).filter(a => a.value) : [];

  if (!q) return <p style={{color:T.ink3,textAlign:'center',padding:'32px 0'}}>No questions found.</p>;

  return (
    <div>
      <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:24,padding:'12px 16px',background:T.card2,borderRadius:12,border:`1px solid ${T.line}`}}>
        <select value={qIdx} onChange={e=>setQIdx(+e.target.value)}
          style={{flex:1,padding:'8px 12px',borderRadius:9,border:`1px solid ${T.line}`,background:T.card,color:T.ink,fontSize:13.5,fontWeight:600,outline:'none',fontFamily:'inherit',cursor:'pointer'}}>
          {questions.map((q,i)=><option key={q.id} value={i}>{q.label || q.title}</option>)}
        </select>
        <button onClick={()=>setQIdx(i=>Math.max(0,i-1))} disabled={qIdx===0}
          style={{width:32,height:32,borderRadius:8,border:`1px solid ${T.line}`,background:'transparent',cursor:qIdx===0?'not-allowed':'pointer',color:T.ink,display:'flex',alignItems:'center',justifyContent:'center',opacity:qIdx===0?.35:1}}>
          {IC.prev}
        </button>
        <span style={{fontSize:13,color:T.ink3,fontWeight:600,whiteSpace:'nowrap'}}>{qIdx+1} of {total}</span>
        <button onClick={()=>setQIdx(i=>Math.min(total-1,i+1))} disabled={qIdx===total-1}
          style={{width:32,height:32,borderRadius:8,border:`1px solid ${T.line}`,background:'transparent',cursor:qIdx===total-1?'not-allowed':'pointer',color:T.ink,display:'flex',alignItems:'center',justifyContent:'center',opacity:qIdx===total-1?.35:1}}>
          {IC.next}
        </button>
      </div>
      <div style={{marginBottom:20,padding:'18px 20px',background:T.card2,borderRadius:12,border:`1px solid ${T.line}`}}>
        <p style={{margin:'0 0 4px',fontSize:17,fontWeight:700,color:T.ink}}>{q.label || q.title}</p>
        <p style={{margin:0,fontSize:12.5,color:T.ink3}}>{answers.length} response{answers.length!==1?'s':''}</p>
      </div>
      <div style={{display:'flex',flexDirection:'column',gap:10}}>
        {answers.length === 0
          ? <p style={{color:T.ink3,fontSize:14,textAlign:'center',padding:'32px 0'}}>No answers for this question.</p>
          : answers.map((a, i) => (
            <div key={i} style={{display:'flex',alignItems:'flex-start',gap:14,padding:'14px 18px',background:T.card,border:`1px solid ${T.line}`,borderRadius:12,boxShadow:'0 1px 3px rgba(0,0,0,.04)'}}>
              <div style={{width:32,height:32,borderRadius:8,background:`linear-gradient(135deg,${accent}cc,${accent}66)`,display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontSize:11,fontWeight:800,flexShrink:0}}>
                {(a.respondent||'?').split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase()}
              </div>
              <div style={{flex:1,minWidth:0}}>
                <p style={{margin:'0 0 2px',fontSize:12,fontWeight:700,color:T.ink2}}>{a.respondent}</p>
                <p style={{margin:0,fontSize:13.5,color:T.ink,lineHeight:1.5,wordBreak:'break-word'}}>{a.value}</p>
              </div>
            </div>
          ))
        }
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
//  INDIVIDUAL TAB
// ════════════════════════════════════════════════════════════════════
function IndividualTab({ form, responses, T, accent, showToast, onDelete }) {
  const [rIdx, setRIdx] = useState(0);
  const r = responses[rIdx];
  const total = responses.length;
  const questions = form?.questions || [];

  if (!r) return null;

  return (
    <div>
      <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:24,padding:'12px 16px',background:T.card2,borderRadius:12,border:`1px solid ${T.line}`}}>
        <select value={rIdx} onChange={e=>setRIdx(+e.target.value)}
          style={{flex:1,padding:'8px 12px',borderRadius:9,border:`1px solid ${T.line}`,background:T.card,color:T.ink,fontSize:13.5,fontWeight:600,outline:'none',fontFamily:'inherit',cursor:'pointer'}}>
          {responses.map((r,i)=><option key={r.id||i} value={i}>{r.email || r.respondent}</option>)}
        </select>
        <button onClick={()=>setRIdx(i=>Math.max(0,i-1))} disabled={rIdx===0}
          style={{width:32,height:32,borderRadius:8,border:`1px solid ${T.line}`,background:'transparent',cursor:rIdx===0?'not-allowed':'pointer',color:T.ink,display:'flex',alignItems:'center',justifyContent:'center',opacity:rIdx===0?.35:1}}>
          {IC.prev}
        </button>
        <span style={{fontSize:13,color:T.ink3,fontWeight:600,whiteSpace:'nowrap'}}>{rIdx+1} of {total}</span>
        <button onClick={()=>setRIdx(i=>Math.min(total-1,i+1))} disabled={rIdx===total-1}
          style={{width:32,height:32,borderRadius:8,border:`1px solid ${T.line}`,background:'transparent',cursor:rIdx===total-1?'not-allowed':'pointer',color:T.ink,display:'flex',alignItems:'center',justifyContent:'center',opacity:rIdx===total-1?.35:1}}>
          {IC.next}
        </button>
        <button onClick={()=>window.print()}
          style={{width:32,height:32,borderRadius:8,border:`1px solid ${T.line}`,background:'transparent',cursor:'pointer',color:T.ink3,display:'flex',alignItems:'center',justifyContent:'center',transition:'all .14s'}}
          onMouseEnter={e=>{e.currentTarget.style.background=T.hover;e.currentTarget.style.color=T.ink;}}
          onMouseLeave={e=>{e.currentTarget.style.background='transparent';e.currentTarget.style.color=T.ink3;}}>
          {IC.print}
        </button>
        <button onClick={()=>onDelete && onDelete(r.id)}
          style={{width:32,height:32,borderRadius:8,border:`1px solid ${T.line}`,background:'transparent',cursor:'pointer',color:T.ink3,display:'flex',alignItems:'center',justifyContent:'center',transition:'all .14s'}}
          onMouseEnter={e=>{e.currentTarget.style.background='#FEF2F2';e.currentTarget.style.color='#DC2626';}}
          onMouseLeave={e=>{e.currentTarget.style.background='transparent';e.currentTarget.style.color=T.ink3;}}>
          {IC.trash}
        </button>
      </div>

      <div style={{background:T.card,border:`1px solid ${T.line}`,borderRadius:16,overflow:'hidden',boxShadow:'0 2px 8px rgba(0,0,0,.06)'}}>
        <div style={{height:6,background:accent}}/>
        <div style={{padding:'20px 28px',borderBottom:`1px solid ${T.line}`,display:'flex',alignItems:'center',gap:14}}>
          <div style={{width:44,height:44,borderRadius:12,background:`linear-gradient(135deg,${accent}cc,${accent}66)`,display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontSize:16,fontWeight:800,flexShrink:0}}>
            {(r.respondent||'?').split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase()}
          </div>
          <div>
            <p style={{margin:'0 0 2px',fontSize:16,fontWeight:700,color:T.ink}}>{r.respondent}</p>
            <p style={{margin:0,fontSize:12.5,color:T.ink3}}>{r.email} · {r.submittedAt}</p>
          </div>
        </div>
        <div style={{padding:'8px 0'}}>
          {questions.length === 0 ? (
            // Fallback: show all answers if no questions defined
            Object.entries(r.answers || {}).map(([key, val], i, arr) => (
              <div key={key} style={{padding:'16px 28px',borderBottom:i<arr.length-1?`1px solid ${T.line}`:'none'}}>
                <p style={{margin:'0 0 8px',fontSize:12,fontWeight:700,textTransform:'uppercase',letterSpacing:'.07em',color:T.ink3}}>{key}</p>
                <p style={{margin:0,fontSize:14,color:val?T.ink:T.ink3,fontStyle:val?'normal':'italic',lineHeight:1.6}}>{val || 'No answer provided'}</p>
              </div>
            ))
          ) : (
            questions.map((q, i) => {
              const val = r.answers[q.id];
              return (
                <div key={q.id} style={{padding:'16px 28px',borderBottom:i<questions.length-1?`1px solid ${T.line}`:'none'}}>
                  <p style={{margin:'0 0 8px',fontSize:12,fontWeight:700,textTransform:'uppercase',letterSpacing:'.07em',color:T.ink3}}>{q.label || q.title}</p>
                  <p style={{margin:0,fontSize:14,color:val?T.ink:T.ink3,fontStyle:val?'normal':'italic',lineHeight:1.6}}>{val || 'No answer provided'}</p>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
//  TRENDS TAB
// ════════════════════════════════════════════════════════════════════
function TrendsTab({ responses, T, accent }) {
  const getWeekRange = (date) => {
    const d = new Date(date);
    const day = d.getDay();
    const start = new Date(d);
    start.setDate(d.getDate() - day + (day === 0 ? -6 : 1));
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    return `${start.getMonth()+1}/${start.getDate()} - ${end.getMonth()+1}/${end.getDate()}`;
  };

  const weeklyData = {};
  responses.forEach(r => {
    const raw = r.submittedAt || r.createdAt;
    if (!raw) return;
    const date = new Date(raw);
    const weekRange = getWeekRange(date);
    if (!weeklyData[weekRange]) weeklyData[weekRange] = { week: weekRange, count: 0, date };
    weeklyData[weekRange].count++;
  });

  const weeks = Object.values(weeklyData).sort((a,b) => new Date(a.date) - new Date(b.date));
  const maxCount = weeks.length ? Math.max(...weeks.map(w => w.count)) : 1;

  let cumulative = 0;
  const cumulativeData = weeks.map(w => { cumulative += w.count; return { week: w.week, count: cumulative }; });

  const width = 700; const height = 300; const padding = 40;
  const chartWidth = width - 2 * padding; const chartHeight = height - 2 * padding;
  const xStep = weeks.length > 1 ? chartWidth / (weeks.length - 1) : chartWidth;

  const points = weeks.map((w, i) => `${padding + i * xStep},${padding + chartHeight - (w.count / maxCount) * chartHeight}`).join(' ');
  const cumulativePoints = cumulativeData.map((c, i) => `${padding + i * xStep},${padding + chartHeight - (c.count / (responses.length || 1)) * chartHeight}`).join(' ');

  return (
    <div style={{display:'flex',flexDirection:'column',gap:24}}>
      <div style={{background:T.card,border:`1px solid ${T.line}`,borderRadius:14,padding:'20px'}}>
        <p style={{margin:'0 0 4px',fontSize:16,fontWeight:700,color:T.ink}}>Responses Over Time</p>
        <p style={{margin:'0 0 20px',fontSize:12.5,color:T.ink3}}>Weekly submission trend</p>
        {weeks.length === 0 ? (
          <p style={{color:T.ink3,textAlign:'center',padding:'32px 0'}}>Not enough data for trends.</p>
        ) : (
          <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{width:'100%',height:'auto'}}>
            {[0,.25,.5,.75,1].map((tick,i)=>{
              const y=padding+chartHeight-tick*chartHeight;
              return <g key={i}><line x1={padding} y1={y} x2={width-padding} y2={y} stroke={T.line2} strokeWidth=".5" strokeDasharray="4"/><text x={padding-8} y={y+3} fontSize="10" fill={T.ink3} textAnchor="end">{Math.round(tick*maxCount)}</text></g>;
            })}
            {weeks.map((w,i)=>{
              const bh=(w.count/maxCount)*chartHeight; const x=padding+i*xStep-15; const y=padding+chartHeight-bh;
              return <rect key={i} x={x} y={y} width={30} height={bh} fill={accent} opacity=".7" rx="3"><title>{w.week}: {w.count}</title></rect>;
            })}
            <polyline points={points} fill="none" stroke={accent} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        )}
      </div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:16}}>
        {[['Total',responses.length,accent],['Active Weeks',weeks.length||1,accent],['Avg/Week',weeks.length?Math.round(responses.length/weeks.length):0,accent]].map(([l,v,c])=>(
          <div key={l} style={{background:T.card2,border:`1px solid ${T.line}`,borderRadius:12,padding:'16px',textAlign:'center'}}>
            <p style={{margin:'0 0 4px',fontSize:28,fontWeight:800,color:c}}>{v}</p>
            <p style={{margin:0,fontSize:12,color:T.ink3}}>{l}</p>
          </div>
        ))}
      </div>
    </div>
  );
}