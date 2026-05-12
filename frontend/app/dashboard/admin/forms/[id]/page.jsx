'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import ProtectedRoute from '@/app/components/common/ProtectedRoute';
import DashboardLayout from '@/app/components/layout/DashboardLayout';
import { useSelector } from 'react-redux';

/*
  Edit Form Page  —  app/dashboard/admin/forms/[id]/page.jsx
  ──────────────────────────────────────────────────────────
  Same design system as new/page.jsx:
    · Plus Jakarta Sans typography
    · tk() token factory with full dark/light parity
    · All inline styles — zero Tailwind dependency
  Differences from /new:
    · Pre-populated with existing form data keyed by [id]
    · "Editing" badge in nav bar
    · "Update" instead of "Publish", "Save draft" stays
    · No Responses tab (use dedicated /responses page)
*/

// ─── Constants ────────────────────────────────────────────────────
const QTYPES = [
  { id:'short',    sym:'Aa', label:'Short answer',    group:'text'   },
  { id:'long',     sym:'¶',  label:'Paragraph',       group:'text'   },
  { id:'radio',    sym:'◉',  label:'Multiple choice', group:'choice' },
  { id:'checkbox', sym:'☑',  label:'Checkboxes',      group:'choice' },
  { id:'dropdown', sym:'▾',  label:'Dropdown',        group:'choice' },
  { id:'scale',    sym:'∿',  label:'Linear scale',    group:'scale'  },
  { id:'grid',     sym:'⊞',  label:'Grid',            group:'scale'  },
  { id:'date',     sym:'📅', label:'Date',            group:'misc'   },
  { id:'time',     sym:'⏰', label:'Time',            group:'misc'   },
  { id:'file',     sym:'📎', label:'File upload',     group:'misc'   },
];

const MOCK_APPS = [
  { id:1, name:'PayTunis',    founder:'Imen Ben Ammar',  sector:'FinTech',    color:'#0EA5E9' },
  { id:2, name:'DabaDoc',     founder:'Hela Ghariani',   sector:'HealthTech', color:'#10B981' },
  { id:3, name:'AgriSmart',   founder:'Ibrahim Diallo',  sector:'AgriTech',   color:'#84CC16' },
  { id:4, name:'EduLearn TN', founder:'Sara Ben Ali',    sector:'EdTech',     color:'#F59E0B' },
  { id:5, name:'SolarTech',   founder:'Mohamed Khemiri', sector:'CleanTech',  color:'#06B6D4' },
];

const FORM_DATA = {
  1: {
    title:'Basic Application Form',
    subtitle:'Standard application form sent to all candidates upon registration.',
    accent:'#006d94',
    recipients:[1,2,3,4,5],
    questions:[
      { id:'q1', type:'short',    title:'Company Name',               description:'',                                        required:true,  options:[], rows:[], scaleMin:1, scaleMax:5,  scaleMinLabel:'', scaleMaxLabel:'' },
      { id:'q2', type:'dropdown', title:'Sector',                     description:'e.g. FinTech, EdTech, AgriTech',          required:true,  options:['FinTech','HealthTech','AgriTech','EdTech','CleanTech','Logistics','Other'], rows:[], scaleMin:1, scaleMax:5, scaleMinLabel:'', scaleMaxLabel:'' },
      { id:'q3', type:'short',    title:'Founding Year',              description:'',                                        required:true,  options:[], rows:[], scaleMin:1, scaleMax:5,  scaleMinLabel:'', scaleMaxLabel:'' },
      { id:'q4', type:'short',    title:'Team Size',                  description:'',                                        required:false, options:[], rows:[], scaleMin:1, scaleMax:5,  scaleMinLabel:'', scaleMaxLabel:'' },
      { id:'q5', type:'short',    title:'Country of Operation',       description:'',                                        required:false, options:[], rows:[], scaleMin:1, scaleMax:5,  scaleMinLabel:'', scaleMaxLabel:'' },
      { id:'q6', type:'radio',    title:'Funding Stage',              description:'',                                        required:true,  options:['Pre-seed','Seed','Series A','Series B+'], rows:[], scaleMin:1, scaleMax:5, scaleMinLabel:'', scaleMaxLabel:'' },
      { id:'q7', type:'long',     title:'Brief Description',          description:'Describe your startup in 2–3 sentences',  required:true,  options:[], rows:[], scaleMin:1, scaleMax:5,  scaleMinLabel:'', scaleMaxLabel:'' },
      { id:'q8', type:'radio',    title:'How did you hear about us?', description:'',                                        required:false, options:['Partner referral','LinkedIn','Accelerator website','Social media','Conference','Other'], rows:[], scaleMin:1, scaleMax:5, scaleMinLabel:'', scaleMaxLabel:'' },
    ],
  },
  2: {
    title:'FinTech Due Diligence',
    subtitle:'Deep-dive assessment for FinTech startups entering the evaluation phase.',
    accent:'#0EA5E9',
    recipients:[1],
    questions:[
      { id:'q1', type:'radio',  title:'Revenue Model',                   description:'',                                                  required:true,  options:['Subscription','Transaction fee','Freemium','Marketplace','Other'], rows:[], scaleMin:1, scaleMax:5, scaleMinLabel:'', scaleMaxLabel:'' },
      { id:'q2', type:'short',  title:'Monthly Recurring Revenue (TND)', description:'',                                                  required:true,  options:[], rows:[], scaleMin:1, scaleMax:5, scaleMinLabel:'', scaleMaxLabel:'' },
      { id:'q3', type:'radio',  title:'Regulatory Compliance',           description:'',                                                  required:true,  options:['Fully compliant','In progress','Not started'], rows:[], scaleMin:1, scaleMax:5, scaleMinLabel:'', scaleMaxLabel:'' },
      { id:'q4', type:'long',   title:'Banking Partnerships',            description:'List any banking or financial institution partnerships', required:false, options:[], rows:[], scaleMin:1, scaleMax:5, scaleMinLabel:'', scaleMaxLabel:'' },
    ],
  },
  3: {
    title:'Technical Assessment',
    subtitle:'Technical evaluation for deep-tech and software projects.',
    accent:'#8B5CF6',
    recipients:[],
    questions:[
      { id:'q1', type:'short', title:'Primary Technology', description:'e.g. AI/ML, Blockchain, IoT', required:true,  options:[], rows:[], scaleMin:1, scaleMax:5, scaleMinLabel:'', scaleMaxLabel:'' },
      { id:'q2', type:'long',  title:'Tech Stack',         description:'List your core technologies', required:true,  options:[], rows:[], scaleMin:1, scaleMax:5, scaleMinLabel:'', scaleMaxLabel:'' },
      { id:'q3', type:'radio', title:'IP / Patents',       description:'',                            required:false, options:['Patent filed','Patent pending','Trade secret','None'], rows:[], scaleMin:1, scaleMax:5, scaleMinLabel:'', scaleMaxLabel:'' },
    ],
  },
  4: {
    title:'Market Validation Survey',
    subtitle:'Market traction and product-market fit assessment questions.',
    accent:'#D97706',
    recipients:[2,3],
    questions:[
      { id:'q1', type:'short', title:'Target Customer',         description:'',                                        required:true,  options:[], rows:[], scaleMin:1, scaleMax:5,  scaleMinLabel:'', scaleMaxLabel:'' },
      { id:'q2', type:'long',  title:'Problem Being Solved',    description:'',                                        required:true,  options:[], rows:[], scaleMin:1, scaleMax:5,  scaleMinLabel:'', scaleMaxLabel:'' },
      { id:'q3', type:'scale', title:'Product-Market Fit Score',description:'How confident are you in your PMF?',     required:false, options:[], rows:[], scaleMin:1, scaleMax:10, scaleMinLabel:'Not confident', scaleMaxLabel:'Extremely confident' },
    ],
  },
  5: {
    title:'Pitch Deck Feedback Form',
    subtitle:'Structured feedback form distributed after pitch presentations.',
    accent:'#9D174D',
    recipients:[1,2,3,4,5],
    questions:[
      { id:'q1', type:'scale', title:'Clarity of Vision',  description:'', required:true, options:[], rows:[], scaleMin:1, scaleMax:5, scaleMinLabel:'Poor', scaleMaxLabel:'Excellent' },
      { id:'q2', type:'scale', title:'Team Credibility',   description:'', required:true, options:[], rows:[], scaleMin:1, scaleMax:5, scaleMinLabel:'Poor', scaleMaxLabel:'Excellent' },
      { id:'q3', type:'long',  title:'Overall Impression', description:'Summarize your feedback', required:true, options:[], rows:[], scaleMin:1, scaleMax:5, scaleMinLabel:'', scaleMaxLabel:'' },
    ],
  },
};

const PALETTE = [
  { hex:'#7C3AED', label:'Violet'  },
  { hex:'#4F46E5', label:'Indigo'  },
  { hex:'#0284C7', label:'Azure'   },
  { hex:'#0891B2', label:'Cyan'    },
  { hex:'#059669', label:'Emerald' },
  { hex:'#D97706', label:'Amber'   },
  { hex:'#DC2626', label:'Crimson' },
  { hex:'#9D174D', label:'Rose'    },
];

// ─── Helpers ──────────────────────────────────────────────────────
const uid = () => `q_${Date.now()}_${Math.random().toString(36).slice(2,7)}`;
const mkQ = t => ({
  id:uid(), type:t||'short', title:'', description:'', required:false,
  options:['radio','checkbox','dropdown','grid'].includes(t)?['Option 1','Option 2']:[],
  rows:t==='grid'?['Row 1']:[], scaleMin:1, scaleMax:5, scaleMinLabel:'', scaleMaxLabel:'',
});
const hr = h => { const r=h.replace('#','').match(/.{2}/g); return r?r.map(x=>parseInt(x,16)).join(','):'124,58,237'; };

// ─── Token factory — identical to new/page.jsx ─────────────────────
const tk = (dark, accent) => {
  const rgb = hr(accent);
  const L = !dark;
  return {
    root     : L?'#F1EEF8':'#0F0E13',
    canvas   : L?'#FAF9FC':'#141218',
    card     : L?'#FFFFFF':'#1E1B24',
    card2    : L?'#F7F4FF':'#231F2E',
    float    : L?'#FFFFFF':'#28243A',
    line     : L?'#E4DFF0':'#2E2A3C',
    line2    : L?'#CFC8E8':'#3D3756',
    ink      : L?'#1A1523':'#EDE9F8',
    ink2     : L?'#4B4560':'#B8B0D0',
    ink3     : L?'#8B83A3':'#6B6485',
    hover    : L?'#F0ECF9':'#231F2E',
    active   : L?'#EAE3FF':'#2A2440',
    errBg    : L?'#FEF2F2':'#2D1515',
    errText  : L?'#DC2626':'#FCA5A5',
    okBg     : L?'#F0FDF4':'#0F2318',
    okText   : L?'#16A34A':'#86EFAC',
    warnBg   : L?'#FFFBEB':'#291A00',
    warnText : L?'#D97706':'#FCD34D',
    ac       : accent, acRgb: rgb,
    acBg     : `rgba(${rgb},.08)`,
    acBg2    : `rgba(${rgb},.15)`,
    acLine   : `rgba(${rgb},.30)`,
    acText   : accent,
    shadow   : L?'0 1px 2px rgba(20,15,40,.04), 0 4px 16px rgba(20,15,40,.07)':'0 1px 2px rgba(0,0,0,.3), 0 4px 16px rgba(0,0,0,.4)',
    shadowLg : L?'0 8px 24px rgba(20,15,40,.10), 0 2px 6px rgba(20,15,40,.06)':'0 8px 24px rgba(0,0,0,.5), 0 2px 6px rgba(0,0,0,.3)',
    ring     : `0 0 0 3px rgba(${rgb},.22)`,
  };
};

// ─── SVG Icons — identical to new/page.jsx ─────────────────────────
const Svg = ({d,sz=16,fill=false,stroke=2}) => (
  <svg width={sz} height={sz} viewBox="0 0 24 24"
    fill={fill?'currentColor':'none'} stroke={fill?'none':'currentColor'}
    strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round"
    style={{display:'block',flexShrink:0}}>{d}</svg>
);
const IC = {
  send  : <Svg d={<><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></>}/>,
  save  : <Svg d={<><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></>}/>,
  eye   : <Svg d={<><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></>}/>,
  cog   : <Svg d={<><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></>}/>,
  build : <Svg d={<><path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></>}/>,
  plus  : <Svg d={<><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></>}/>,
  copy  : <Svg d={<><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></>}/>,
  trash : <Svg d={<><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6M10 11v6M14 11v6M9 6V4h6v2"/></>}/>,
  back  : <Svg d={<><path d="M19 12H5M12 19l-7-7 7-7"/></>}/>,
  check : <Svg d={<><polyline points="20 6 9 17 4 12"/></>}/>,
  x     : <Svg d={<><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>}/>,
  warn  : <Svg d={<><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></>}/>,
  search: <Svg d={<><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></>}/>,
  down  : <Svg d={<><polyline points="6 9 12 15 18 9"/></>} sz={14}/>,
  drag  : <Svg d={<><circle cx="9" cy="5" r="1.4" fill="currentColor"/><circle cx="15" cy="5" r="1.4" fill="currentColor"/><circle cx="9" cy="12" r="1.4" fill="currentColor"/><circle cx="15" cy="12" r="1.4" fill="currentColor"/><circle cx="9" cy="19" r="1.4" fill="currentColor"/><circle cx="15" cy="19" r="1.4" fill="currentColor"/></>} fill sz={14}/>,
  users : <Svg d={<><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></>}/>,
  spin  : (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
      style={{display:'block',flexShrink:0,animation:'_spin .65s linear infinite'}}>
      <circle cx="12" cy="12" r="10" strokeOpacity=".15"/>
      <path d="M12 2a10 10 0 0110 10" strokeLinecap="round"/>
    </svg>
  ),
};

const Chip = ({children,color}) => (
  <span style={{display:'inline-flex',alignItems:'center',fontSize:10,fontWeight:700,letterSpacing:'.04em',padding:'3px 8px',borderRadius:6,background:`${color}18`,color,border:`1px solid ${color}28`}}>{children}</span>
);
const Divider = ({T}) => <div style={{height:1,background:T.line,margin:'0 -1px'}}/>;

// ════════════════════════════════════════════════════════════════════
//  MAIN PAGE
// ════════════════════════════════════════════════════════════════════
export default function EditFormPage() {
  const router   = useRouter();
  const params   = useParams();
  const { user } = useSelector(s => s.auth);

  const formId   = parseInt(params?.id || '1');
  const existing = FORM_DATA[formId] || FORM_DATA[1];

  const [isDark,    setDark]    = useState(false);
  useEffect(() => {
    const sync = () => setDark(document.documentElement.classList.contains('dark'));
    sync();
    const obs = new MutationObserver(sync);
    obs.observe(document.documentElement, {attributes:true, attributeFilter:['class']});
    return () => obs.disconnect();
  }, []);

  const [tab,       setTab]       = useState('build');
  const [title,     setTitle]     = useState(existing.title);
  const [subtitle,  setSubtitle]  = useState(existing.subtitle);
  const [accent,    setAccent]    = useState(existing.accent);
  const [questions, setQuestions] = useState(existing.questions);
  const [activeId,  setActiveId]  = useState(existing.questions[0]?.id || null);
  const [recips,    setRecips]    = useState(existing.recipients);
  const [srch,      setSrch]      = useState('');
  const [saving,    setSaving]    = useState(false);
  const [updating,  setUpdating]  = useState(false);
  const [updated,   setUpdated]   = useState(false);
  const [toast,     setToast]     = useState(null);
  const [colorOpen, setColorOpen] = useState(false);
  const dragFrom = useRef(null);

  const T = tk(isDark, accent);

  const toast$ = (msg, type='ok') => {
    setToast({msg,type});
    setTimeout(()=>setToast(null), 2800);
  };

  const upd     = useCallback((id,p) => setQuestions(qs=>qs.map(q=>q.id===id?{...q,...p}:q)), []);
  const addQ    = t  => { const q=mkQ(t||'short'); setQuestions(qs=>[...qs,q]); setActiveId(q.id); };
  const dupQ    = id => { const s=questions.find(q=>q.id===id); const c={...s,id:uid(),title:s.title+' (copy)'}; const i=questions.findIndex(q=>q.id===id); const n=[...questions]; n.splice(i+1,0,c); setQuestions(n); setActiveId(c.id); };
  const delQ    = id => { if(questions.length===1)return; const i=questions.findIndex(q=>q.id===id); const n=questions.filter(q=>q.id!==id); setQuestions(n); setActiveId(n[Math.max(0,i-1)].id); };
  const moveQ   = (a,b) => { const n=[...questions]; const [x]=n.splice(a,1); n.splice(b,0,x); setQuestions(n); };
  const addOpt  = id => upd(id,{options:[...questions.find(q=>q.id===id).options,`Option ${questions.find(q=>q.id===id).options.length+1}`]});
  const delOpt  = (id,i) => upd(id,{options:questions.find(q=>q.id===id).options.filter((_,j)=>j!==i)});
  const editOpt = (id,i,v) => upd(id,{options:questions.find(q=>q.id===id).options.map((o,j)=>j===i?v:o)});
  const addRow  = id => upd(id,{rows:[...questions.find(q=>q.id===id).rows,`Row ${questions.find(q=>q.id===id).rows.length+1}`]});
  const delRow  = (id,i) => upd(id,{rows:questions.find(q=>q.id===id).rows.filter((_,j)=>j!==i)});
  const editRow = (id,i,v) => upd(id,{rows:questions.find(q=>q.id===id).rows.map((r,j)=>j===i?v:r)});
  const toggleR = id => setRecips(r=>r.includes(id)?r.filter(x=>x!==id):[...r,id]);

  const onSave = () => {
    setSaving(true);
    setTimeout(()=>{ setSaving(false); toast$('Draft saved'); }, 800);
  };
  const onUpdate = () => {
    if(!title)         return toast$('Please add a form title','warn');
    if(!recips.length) return toast$('Select at least one recipient','warn');
    setUpdating(true);
    setTimeout(()=>{ setUpdating(false); setUpdated(true); toast$('Form updated successfully!'); setTimeout(()=>router.push('/dashboard/admin/forms'),1400); }, 1100);
  };

  const filtApps = MOCK_APPS.filter(a =>
    a.name.toLowerCase().includes(srch.toLowerCase()) ||
    a.founder.toLowerCase().includes(srch.toLowerCase())
  );
  const pct = Math.round((title?34:0)+(questions.some(q=>q.title)?33:0)+(recips.length?33:0));

  const TABS = [
    {id:'build',   label:'Questions', icon:IC.build},
    {id:'preview', label:'Preview',   icon:IC.eye  },
    {id:'settings',label:'Settings',  icon:IC.cog  },
  ];

  const card = {background:T.card, border:`1px solid ${T.line}`, borderRadius:16, boxShadow:T.shadow};

  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <DashboardLayout>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
          @keyframes _spin  { to{transform:rotate(360deg)} }
          @keyframes _fadeUp{ from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
          @keyframes _pop   { 0%{opacity:0;transform:scale(.92)} 60%{transform:scale(1.03)} 100%{opacity:1;transform:scale(1)} }
          ._up { animation:_fadeUp .36s cubic-bezier(.22,1,.36,1) both }
          ._d1 { animation-delay:.05s }
          ._d2 { animation-delay:.10s }
          ._scroll::-webkit-scrollbar{width:3px}
          ._scroll::-webkit-scrollbar-track{background:transparent}
          ._scroll::-webkit-scrollbar-thumb{background:${T.line2};border-radius:99px}
          ._ibase{font-family:inherit;font-size:14px;color:${T.ink};background:transparent;border:none;outline:none;width:100%;}
          ._ul{border-bottom:1.5px solid ${T.line2};padding-bottom:6px;transition:border-color .18s;}
        `}</style>

        <div style={{fontFamily:"'Plus Jakarta Sans',system-ui,sans-serif", display:'flex', flexDirection:'column', gap:16, paddingBottom:56}}>

          {/* Toast */}
          {toast && (
            <div style={{
              position:'fixed', bottom:24, left:'50%', transform:'translateX(-50%)',
              zIndex:9999, display:'flex', alignItems:'center', gap:9,
              padding:'10px 20px', borderRadius:12,
              background:toast.type==='warn'?T.warnBg:toast.type==='err'?T.errBg:T.card,
              color:toast.type==='warn'?T.warnText:toast.type==='err'?T.errText:T.ink,
              border:`1px solid ${toast.type==='warn'?T.warnText+'40':toast.type==='err'?T.errText+'40':T.line}`,
              boxShadow:T.shadowLg, fontSize:13, fontWeight:600,
              animation:'_fadeUp .28s cubic-bezier(.22,1,.36,1) both',
              pointerEvents:'none', whiteSpace:'nowrap',
            }}>
              <span style={{display:'flex', color:toast.type==='ok'?'#22C55E':toast.type==='warn'?T.warnText:T.errText}}>
                {toast.type==='ok'?IC.check:IC.warn}
              </span>
              {toast.msg}
            </div>
          )}

          {/* ── TOP NAV ─────────────────────────────────────────── */}
          <div className="_up" style={{
            background:T.card, border:`1px solid ${T.line}`,
            borderRadius:16, padding:'0 24px',
            display:'flex', alignItems:'center', gap:0,
            boxShadow:T.shadow, height:58,
          }}>
            <button onClick={()=>router.push('/dashboard/admin/forms')}
              style={{display:'flex',alignItems:'center',gap:7,padding:'7px 14px 7px 8px',borderRadius:10,border:'none',background:'none',cursor:'pointer',color:T.ink3,fontSize:13,fontWeight:600,fontFamily:'inherit',transition:'all .15s',marginRight:8}}
              onMouseEnter={e=>{e.currentTarget.style.background=T.hover;e.currentTarget.style.color=T.ink;}}
              onMouseLeave={e=>{e.currentTarget.style.background='none';e.currentTarget.style.color=T.ink3;}}>
              {IC.back}<span>Forms</span>
            </button>

            <div style={{width:1,height:20,background:T.line,marginRight:16}}/>

            <div style={{display:'flex',alignItems:'center',gap:10,flex:1,minWidth:0}}>
              <div style={{width:30,height:30,borderRadius:8,background:accent,display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontSize:13,fontWeight:800,flexShrink:0,letterSpacing:'-.02em'}}>F</div>
              <span style={{fontSize:14,fontWeight:700,color:T.ink,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',maxWidth:200}}>{title}</span>
              {/* Editing badge */}
              <span style={{fontSize:10,fontWeight:700,padding:'2px 9px',borderRadius:99,background:T.warnBg,color:T.warnText,border:`1px solid ${T.warnText}30`,flexShrink:0,letterSpacing:'.04em'}}>EDITING</span>
              {/* Progress */}
              <div style={{display:'flex',alignItems:'center',gap:6,padding:'4px 10px',borderRadius:99,background:pct===100?T.okBg:T.acBg,border:`1px solid ${pct===100?T.okText+'30':T.acLine}`}}>
                <div style={{width:32,height:3,borderRadius:99,background:T.line2,overflow:'hidden'}}>
                  <div style={{height:'100%',width:`${pct}%`,background:pct===100?T.okText:accent,borderRadius:99,transition:'width .4s'}}/>
                </div>
                <span style={{fontSize:10,fontWeight:700,color:pct===100?T.okText:T.acText}}>{pct}%</span>
              </div>
            </div>

            {/* Tabs */}
            <div style={{display:'flex',gap:1,padding:'4px',background:T.card2,borderRadius:10,border:`1px solid ${T.line}`}}>
              {TABS.map(t=>(
                <button key={t.id} onClick={()=>setTab(t.id)}
                  style={{display:'flex',alignItems:'center',gap:6,padding:'6px 14px',borderRadius:7,border:'none',fontFamily:'inherit',fontSize:12.5,fontWeight:600,cursor:'pointer',transition:'all .16s',background:tab===t.id?T.card:'transparent',color:tab===t.id?T.ink:T.ink3,boxShadow:tab===t.id?T.shadow:'none'}}>
                  {t.icon}<span>{t.label}</span>
                </button>
              ))}
            </div>

            <div style={{width:1,height:20,background:T.line,margin:'0 16px'}}/>

            {/* Actions */}
            <div style={{display:'flex',alignItems:'center',gap:8}}>
              <button onClick={onSave} disabled={saving}
                style={{display:'flex',alignItems:'center',gap:6,padding:'8px 14px',borderRadius:9,border:`1px solid ${T.line}`,background:'transparent',color:T.ink2,fontSize:13,fontWeight:600,fontFamily:'inherit',cursor:'pointer',transition:'all .15s'}}
                onMouseEnter={e=>{e.currentTarget.style.background=T.hover;e.currentTarget.style.borderColor=T.line2;}}
                onMouseLeave={e=>{e.currentTarget.style.background='transparent';e.currentTarget.style.borderColor=T.line;}}>
                {saving?IC.spin:IC.save}<span>Save draft</span>
              </button>

              {updated ? (
                <div style={{display:'flex',alignItems:'center',gap:6,padding:'8px 18px',borderRadius:9,background:T.okBg,color:T.okText,fontSize:13,fontWeight:700,border:`1px solid ${T.okText}30`}}>
                  {IC.check}<span>Updated</span>
                </div>
              ) : (
                <button onClick={onUpdate} disabled={updating}
                  style={{display:'flex',alignItems:'center',gap:7,padding:'9px 22px',borderRadius:9,border:'none',background:accent,color:'#fff',fontSize:13,fontWeight:700,fontFamily:'inherit',cursor:updating?'not-allowed':'pointer',boxShadow:`0 2px 12px rgba(${T.acRgb},.32)`,opacity:updating?.55:1,transition:'all .18s'}}
                  onMouseEnter={e=>{if(!updating){e.currentTarget.style.transform='translateY(-1px)';e.currentTarget.style.boxShadow=`0 4px 20px rgba(${T.acRgb},.44)`;}}}
                  onMouseLeave={e=>{e.currentTarget.style.transform='none';e.currentTarget.style.boxShadow=`0 2px 12px rgba(${T.acRgb},.32)`;}}>
                  {updating?IC.spin:IC.send}<span>{updating?'Updating…':'Update'}</span>
                </button>
              )}
            </div>
          </div>

          {/* ── BUILD TAB ────────────────────────────────────────── */}
          {tab==='build' && (
            <div className="_up _d1" style={{display:'grid',gridTemplateColumns:'260px 1fr 288px',gap:14,alignItems:'start'}}>

              {/* LEFT */}
              <div style={{display:'flex',flexDirection:'column',gap:12}}>

                {/* Q list */}
                <div style={{...card,overflow:'hidden'}}>
                  <div style={{padding:'14px 16px 10px',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                    <span style={{fontSize:11,fontWeight:700,textTransform:'uppercase',letterSpacing:'.08em',color:T.ink3}}>Questions</span>
                    <span style={{fontSize:11,fontWeight:700,padding:'2px 8px',borderRadius:99,background:T.acBg,color:T.acText}}>{questions.length}</span>
                  </div>
                  <Divider T={T}/>
                  <div style={{padding:'8px',maxHeight:220,overflowY:'auto'}} className="_scroll">
                    {questions.map((q,i)=>(
                      <div key={q.id} draggable
                        onDragStart={()=>{dragFrom.current=i;}}
                        onDragOver={e=>e.preventDefault()}
                        onDrop={()=>{if(dragFrom.current!==null&&dragFrom.current!==i){moveQ(dragFrom.current,i);dragFrom.current=null;}}}
                        onClick={()=>setActiveId(q.id)}
                        style={{display:'flex',alignItems:'center',gap:8,padding:'7px 8px',borderRadius:9,cursor:'pointer',background:activeId===q.id?T.active:'transparent',transition:'background .14s'}}
                        onMouseEnter={e=>{if(activeId!==q.id)e.currentTarget.style.background=T.hover;}}
                        onMouseLeave={e=>{if(activeId!==q.id)e.currentTarget.style.background='transparent';}}>
                        <span style={{color:T.line2,flexShrink:0}}>{IC.drag}</span>
                        <span style={{width:19,height:19,borderRadius:5,display:'flex',alignItems:'center',justifyContent:'center',fontSize:9,fontWeight:800,flexShrink:0,background:activeId===q.id?accent:T.line,color:activeId===q.id?'#fff':T.ink3,transition:'all .16s'}}>{i+1}</span>
                        <span style={{fontSize:12,fontWeight:activeId===q.id?600:400,color:activeId===q.id?T.ink:T.ink2,flex:1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                          {q.title||<em style={{color:T.ink3,fontStyle:'normal'}}>Untitled</em>}
                        </span>
                        {q.required&&<span style={{width:5,height:5,borderRadius:'50%',background:accent,flexShrink:0}}/>}
                      </div>
                    ))}
                  </div>
                  <Divider T={T}/>
                  <div style={{padding:'8px'}}>
                    <button onClick={()=>addQ('short')}
                      style={{width:'100%',padding:'8px',borderRadius:9,border:`1.5px dashed ${T.line2}`,background:'transparent',color:T.ink3,fontSize:12,fontWeight:600,fontFamily:'inherit',display:'flex',alignItems:'center',justifyContent:'center',gap:6,cursor:'pointer',transition:'all .15s'}}
                      onMouseEnter={e=>{e.currentTarget.style.borderColor=accent;e.currentTarget.style.color=accent;e.currentTarget.style.background=T.acBg;}}
                      onMouseLeave={e=>{e.currentTarget.style.borderColor=T.line2;e.currentTarget.style.color=T.ink3;e.currentTarget.style.background='transparent';}}>
                      {IC.plus}<span>Add question</span>
                    </button>
                  </div>
                </div>

                {/* Field picker */}
                <div style={{...card,overflow:'hidden'}}>
                  <div style={{padding:'14px 16px 10px'}}>
                    <span style={{fontSize:11,fontWeight:700,textTransform:'uppercase',letterSpacing:'.08em',color:T.ink3}}>Add field</span>
                  </div>
                  <Divider T={T}/>
                  <div style={{padding:'12px'}}>
                    {[{g:'text',l:'Text'},{g:'choice',l:'Choice'},{g:'scale',l:'Scale'},{g:'misc',l:'Other'}].map(({g,l})=>(
                      <div key={g} style={{marginBottom:10}}>
                        <p style={{fontSize:9.5,fontWeight:700,textTransform:'uppercase',letterSpacing:'.08em',color:T.ink3,margin:'0 0 5px 2px'}}>{l}</p>
                        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:4}}>
                          {QTYPES.filter(t=>t.group===g).map(t=>(
                            <button key={t.id} onClick={()=>addQ(t.id)}
                              style={{display:'flex',alignItems:'center',gap:6,padding:'7px 9px',borderRadius:8,border:`1px solid ${T.line}`,background:T.card2,cursor:'pointer',fontSize:11.5,fontWeight:500,fontFamily:'inherit',color:T.ink2,transition:'all .14s',textAlign:'left'}}
                              onMouseEnter={e=>{e.currentTarget.style.borderColor=T.acLine;e.currentTarget.style.background=T.acBg;e.currentTarget.style.color=T.acText;}}
                              onMouseLeave={e=>{e.currentTarget.style.borderColor=T.line;e.currentTarget.style.background=T.card2;e.currentTarget.style.color=T.ink2;}}>
                              <span style={{fontFamily:'monospace',fontSize:12,color:accent,width:14,textAlign:'center',flexShrink:0}}>{t.sym}</span>
                              <span style={{overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{t.label}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Color */}
                <div style={{...card,overflow:'hidden'}}>
                  <button onClick={()=>setColorOpen(o=>!o)}
                    style={{width:'100%',padding:'12px 16px',display:'flex',alignItems:'center',justifyContent:'space-between',background:'none',border:'none',cursor:'pointer',fontFamily:'inherit'}}>
                    <span style={{fontSize:11,fontWeight:700,textTransform:'uppercase',letterSpacing:'.08em',color:T.ink3}}>Theme color</span>
                    <div style={{display:'flex',alignItems:'center',gap:8}}>
                      <div style={{width:18,height:18,borderRadius:'50%',background:accent,boxShadow:`0 0 0 2px ${T.card}, 0 0 0 3.5px ${accent}`}}/>
                      <span style={{color:T.ink3,display:'flex',transform:colorOpen?'rotate(180deg)':'none',transition:'transform .2s'}}>{IC.down}</span>
                    </div>
                  </button>
                  {colorOpen && (
                    <>
                      <Divider T={T}/>
                      <div style={{padding:'12px 16px'}}>
                        <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:8}}>
                          {PALETTE.map(c=>(
                            <button key={c.hex} onClick={()=>setAccent(c.hex)} title={c.label}
                              style={{height:32,borderRadius:8,border:'none',background:c.hex,cursor:'pointer',position:'relative',boxShadow:accent===c.hex?`0 0 0 2px ${T.card}, 0 0 0 4px ${c.hex}`:'none',transform:accent===c.hex?'scale(1.08)':'scale(1)',transition:'all .15s'}}>
                              {accent===c.hex&&<span style={{position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center',color:'#fff'}}>{IC.check}</span>}
                            </button>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* CENTER */}
              <div style={{display:'flex',flexDirection:'column',gap:12,minWidth:0}}>
                <div style={{...card,overflow:'hidden'}}>
                  <div style={{height:8,background:accent,borderRadius:'15px 15px 0 0'}}/>
                  <div style={{padding:'24px 28px 22px'}}>
                    <textarea rows={1} value={title} onChange={e=>setTitle(e.target.value)}
                      placeholder="Form title" className="_ibase"
                      style={{fontSize:26,fontWeight:800,lineHeight:1.25,display:'block',resize:'none',overflow:'hidden',borderBottom:`2.5px solid ${title?accent:T.line2}`,paddingBottom:8,marginBottom:14,transition:'border-color .18s',letterSpacing:'-.02em'}}
                      onInput={e=>{e.target.style.height='auto';e.target.style.height=e.target.scrollHeight+'px';}}
                      onFocus={e=>e.target.style.borderBottomColor=accent}
                      onBlur={e=>e.target.style.borderBottomColor=title?accent:T.line2}
                    />
                    <input value={subtitle} onChange={e=>setSubtitle(e.target.value)}
                      placeholder="Form description (optional)"
                      className="_ibase _ul"
                      style={{fontSize:14,color:T.ink2}}
                      onFocus={e=>e.target.style.borderBottomColor=accent}
                      onBlur={e=>e.target.style.borderBottomColor=T.line2}
                    />
                  </div>
                </div>

                {questions.map((q,idx)=>(
                  <QCard key={q.id} q={q} idx={idx} T={T} accent={accent}
                    isActive={activeId===q.id}
                    onActivate={()=>setActiveId(q.id)}
                    onChange={p=>upd(q.id,p)}
                    onDup={()=>dupQ(q.id)}
                    onDel={()=>delQ(q.id)}
                    canDel={questions.length>1}
                    addOpt={()=>addOpt(q.id)}
                    delOpt={i=>delOpt(q.id,i)}
                    editOpt={(i,v)=>editOpt(q.id,i,v)}
                    addRow={()=>addRow(q.id)}
                    delRow={i=>delRow(q.id,i)}
                    editRow={(i,v)=>editRow(q.id,i,v)}
                  />
                ))}

                <button onClick={()=>addQ('short')}
                  style={{width:'100%',padding:'16px',borderRadius:14,border:`2px dashed ${T.line2}`,background:'transparent',color:T.ink3,fontSize:13,fontWeight:600,fontFamily:'inherit',display:'flex',alignItems:'center',justifyContent:'center',gap:8,cursor:'pointer',transition:'all .2s'}}
                  onMouseEnter={e=>{e.currentTarget.style.borderColor=accent;e.currentTarget.style.color=accent;e.currentTarget.style.background=T.acBg;}}
                  onMouseLeave={e=>{e.currentTarget.style.borderColor=T.line2;e.currentTarget.style.color=T.ink3;e.currentTarget.style.background='transparent';}}>
                  {IC.plus}<span>Add question</span>
                </button>
              </div>

              {/* RIGHT */}
              <div style={{display:'flex',flexDirection:'column',gap:12}}>
                <div style={{...card,overflow:'hidden'}}>
                  <div style={{padding:'14px 16px 12px',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                    <div style={{display:'flex',alignItems:'center',gap:8}}>
                      <span style={{color:T.ink3,display:'flex'}}>{IC.users}</span>
                      <span style={{fontSize:13,fontWeight:700,color:T.ink}}>Recipients</span>
                    </div>
                    <span style={{fontSize:11,fontWeight:700,padding:'2px 8px',borderRadius:99,background:recips.length?accent:T.line,color:recips.length?'#fff':T.ink3,transition:'all .2s'}}>{recips.length}/{MOCK_APPS.length}</span>
                  </div>
                  <Divider T={T}/>
                  <div style={{padding:'10px 12px'}}>
                    <div style={{position:'relative',marginBottom:10}}>
                      <span style={{position:'absolute',left:10,top:'50%',transform:'translateY(-50%)',color:T.ink3,display:'flex',pointerEvents:'none'}}>{IC.search}</span>
                      <input value={srch} onChange={e=>setSrch(e.target.value)} placeholder="Search startups…"
                        style={{width:'100%',padding:'8px 10px 8px 32px',border:`1px solid ${T.line}`,borderRadius:9,background:T.card2,color:T.ink,fontSize:12.5,outline:'none',fontFamily:'inherit',transition:'border-color .16s'}}
                        onFocus={e=>e.target.style.borderColor=accent} onBlur={e=>e.target.style.borderColor=T.line}/>
                    </div>
                    <button onClick={()=>setRecips(recips.length===MOCK_APPS.length?[]:MOCK_APPS.map(a=>a.id))}
                      style={{width:'100%',padding:'6px 10px',borderRadius:8,cursor:'pointer',marginBottom:8,border:`1px dashed ${T.acLine}`,background:recips.length===MOCK_APPS.length?T.acBg2:'transparent',color:T.acText,fontSize:11,fontWeight:700,fontFamily:'inherit',transition:'all .14s'}}>
                      {recips.length===MOCK_APPS.length?'✕  Deselect all':'＋  Select all'}
                    </button>
                    <div style={{display:'flex',flexDirection:'column',gap:5,maxHeight:320,overflowY:'auto'}} className="_scroll">
                      {filtApps.map(app=>{
                        const on=recips.includes(app.id);
                        return (
                          <div key={app.id} onClick={()=>toggleR(app.id)}
                            style={{display:'flex',alignItems:'center',gap:10,padding:'9px 10px',borderRadius:10,cursor:'pointer',border:`1px solid ${on?T.acLine:T.line}`,background:on?T.acBg:T.card,transition:'all .16s'}}
                            onMouseEnter={e=>{if(!on){e.currentTarget.style.background=T.hover;e.currentTarget.style.borderColor=T.acLine;}}}
                            onMouseLeave={e=>{if(!on){e.currentTarget.style.background=T.card;e.currentTarget.style.borderColor=T.line;}}}>
                            <div style={{width:32,height:32,borderRadius:9,flexShrink:0,background:`linear-gradient(135deg,${app.color}ee,${app.color}88)`,display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontWeight:800,fontSize:11,letterSpacing:'-.02em'}}>{app.name.slice(0,2).toUpperCase()}</div>
                            <div style={{flex:1,minWidth:0}}>
                              <p style={{margin:0,fontSize:12.5,fontWeight:700,color:T.ink,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{app.name}</p>
                              <p style={{margin:0,fontSize:10.5,color:T.ink3,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{app.founder}</p>
                            </div>
                            <div style={{display:'flex',flexDirection:'column',alignItems:'flex-end',gap:4,flexShrink:0}}>
                              <Chip color={app.color}>{app.sector}</Chip>
                              <div style={{width:15,height:15,borderRadius:'50%',border:`2px solid ${on?accent:T.line2}`,background:on?accent:'transparent',display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontSize:8,fontWeight:800,transition:'all .16s'}}>{on&&'✓'}</div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    {!recips.length&&(
                      <div style={{marginTop:10,padding:'10px 12px',borderRadius:9,background:T.warnBg,border:`1px solid ${T.warnText}30`,display:'flex',alignItems:'center',gap:8}}>
                        <span style={{color:T.warnText,display:'flex',flexShrink:0}}>{IC.warn}</span>
                        <p style={{margin:0,fontSize:11.5,color:T.warnText,fontWeight:600}}>Select at least one recipient to update</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Summary */}
                <div style={{borderRadius:16,background:accent,position:'relative',overflow:'hidden',boxShadow:`0 6px 24px rgba(${T.acRgb},.28)`}}>
                  <div style={{position:'absolute',inset:0,pointerEvents:'none',backgroundImage:`radial-gradient(circle at 80% 20%, rgba(255,255,255,.12) 0%, transparent 60%)`}}/>
                  <div style={{padding:'18px 20px',position:'relative'}}>
                    <p style={{fontSize:10,fontWeight:700,textTransform:'uppercase',letterSpacing:'.09em',color:'rgba(255,255,255,.55)',margin:'0 0 16px'}}>Summary</p>
                    {[['Questions',questions.length],['Required',questions.filter(q=>q.required).length],['Recipients',recips.length]].map(([l,v])=>(
                      <div key={l} style={{display:'flex',justifyContent:'space-between',alignItems:'baseline',marginBottom:10}}>
                        <span style={{fontSize:13,color:'rgba(255,255,255,.65)',fontWeight:500}}>{l}</span>
                        <span style={{fontSize:22,fontWeight:800,color:'#fff',letterSpacing:'-.03em'}}>{v}</span>
                      </div>
                    ))}
                    <div style={{height:2,background:'rgba(255,255,255,.2)',borderRadius:99,marginTop:14,overflow:'hidden'}}>
                      <div style={{height:'100%',width:`${pct}%`,background:'rgba(255,255,255,.75)',borderRadius:99,transition:'width .45s'}}/>
                    </div>
                    <div style={{display:'flex',justifyContent:'space-between',marginTop:6}}>
                      <span style={{fontSize:10,color:'rgba(255,255,255,.45)'}}>Completion</span>
                      <span style={{fontSize:10,fontWeight:700,color:'rgba(255,255,255,.7)'}}>{pct}%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {tab==='preview'  && <PreviewSection  title={title} subtitle={subtitle} accent={accent} questions={questions} T={T}/>}
          {tab==='settings' && <SettingsSection accent={accent} T={T}/>}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}

// ════════════════════════════════════════════════════════════════════
//  QUESTION CARD — identical to new/page.jsx
// ════════════════════════════════════════════════════════════════════
function QCard({q,idx,isActive,accent,T,onActivate,onChange,onDup,onDel,canDel,addOpt,delOpt,editOpt,addRow,delRow,editRow}) {
  const qt=QTYPES.find(t=>t.id===q.type);
  const hasOpts=['radio','checkbox','dropdown','grid'].includes(q.type);
  const hasRows=q.type==='grid';
  const hasSc=q.type==='scale';
  const ib={fontFamily:"'Plus Jakarta Sans',sans-serif",color:T.ink,background:'transparent',border:'none',outline:'none',width:'100%'};
  return (
    <div onClick={onActivate} style={{background:T.card,borderRadius:16,border:`1.5px solid ${isActive?accent:T.line}`,boxShadow:isActive?`${T.shadowLg}, ${T.ring}`:T.shadow,transition:'border-color .2s, box-shadow .2s',cursor:'pointer',position:'relative',overflow:'hidden'}}>
      <div style={{position:'absolute',left:0,top:0,bottom:0,width:4,background:accent,opacity:isActive?1:0,transition:'opacity .2s',borderRadius:'15px 0 0 15px'}}/>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'10px 18px 10px 20px',background:isActive?T.acBg:T.card2,borderBottom:`1px solid ${isActive?T.acLine:T.line}`,transition:'all .18s'}}>
        <div style={{display:'flex',alignItems:'center',gap:8}}>
          <span style={{width:21,height:21,borderRadius:5,flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center',fontSize:9,fontWeight:800,background:isActive?accent:T.line,color:isActive?'#fff':T.ink3,transition:'all .18s'}}>{idx+1}</span>
          <span style={{fontSize:11.5,fontFamily:'monospace',color:isActive?T.acText:T.ink3}}>{qt?.sym}</span>
          <span style={{fontSize:11.5,fontWeight:600,color:isActive?T.ink:T.ink3}}>{qt?.label}</span>
        </div>
        {isActive&&(
          <div style={{display:'flex',alignItems:'center',gap:2}} onClick={e=>e.stopPropagation()}>
            {[{fn:onDup,ic:IC.copy,ok:false},...(canDel?[{fn:onDel,ic:IC.trash,ok:true}]:[])].map(({fn,ic,ok},i)=>(
              <button key={i} onClick={fn} style={{width:30,height:30,borderRadius:8,border:'none',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',background:'transparent',color:T.ink3,transition:'all .14s'}}
                onMouseEnter={e=>{e.currentTarget.style.background=ok?T.errBg:T.acBg;e.currentTarget.style.color=ok?T.errText:T.acText;}}
                onMouseLeave={e=>{e.currentTarget.style.background='transparent';e.currentTarget.style.color=T.ink3;}}>
                {ic}
              </button>
            ))}
          </div>
        )}
      </div>
      <div style={{padding:'18px 20px 16px 20px',display:'flex',flexDirection:'column',gap:14}}>
        <div style={{display:'flex',gap:12,alignItems:'flex-start'}}>
          <textarea rows={1} value={q.title} onChange={e=>onChange({title:e.target.value})} onClick={e=>e.stopPropagation()} placeholder="Question"
            style={{...ib,flex:1,fontSize:15,fontWeight:600,lineHeight:1.4,resize:'none',overflow:'hidden',display:'block',borderBottom:`2px solid ${T.line2}`,paddingBottom:6,transition:'border-color .18s'}}
            onInput={e=>{e.target.style.height='auto';e.target.style.height=e.target.scrollHeight+'px';}}
            onFocus={e=>e.target.style.borderBottomColor=accent} onBlur={e=>e.target.style.borderBottomColor=T.line2}/>
          {isActive&&(
            <select value={q.type} onClick={e=>e.stopPropagation()}
              onChange={e=>{const t=e.target.value;onChange({type:t,options:['radio','checkbox','dropdown','grid'].includes(t)?(q.options.length?q.options:['Option 1','Option 2']):[],rows:t==='grid'?(q.rows.length?q.rows:['Row 1']):[]});}}
              style={{background:T.card2,border:`1px solid ${T.line}`,borderRadius:9,padding:'6px 10px',fontSize:12,fontWeight:600,color:T.ink2,outline:'none',cursor:'pointer',fontFamily:'inherit',transition:'border-color .15s'}}
              onFocus={e=>e.target.style.borderColor=accent} onBlur={e=>e.target.style.borderColor=T.line}>
              {QTYPES.map(t=><option key={t.id} value={t.id}>{t.sym}  {t.label}</option>)}
            </select>
          )}
        </div>
        {isActive&&(
          <input value={q.description} onChange={e=>onChange({description:e.target.value})} onClick={e=>e.stopPropagation()} placeholder="Helper text (optional)"
            style={{...ib,fontSize:13,color:T.ink3,borderBottom:`1px dashed ${T.line2}`,paddingBottom:5,transition:'border-color .18s'}}
            onFocus={e=>e.target.style.borderBottomColor=accent} onBlur={e=>e.target.style.borderBottomColor=T.line2}/>
        )}
        {q.type==='short'&&<div style={{fontSize:13,color:T.ink3,borderBottom:`1px solid ${T.line2}`,paddingBottom:7}}>Short answer text</div>}
        {q.type==='long' &&<div style={{fontSize:13,color:T.ink3,borderBottom:`1px solid ${T.line2}`,paddingBottom:7}}>Long answer text</div>}
        {hasOpts&&!hasRows&&(
          <div style={{display:'flex',flexDirection:'column',gap:8}}>
            {q.options.map((opt,i)=>(
              <div key={i} style={{display:'flex',alignItems:'center',gap:10}}>
                <span style={{display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,color:T.ink3,fontSize:15,width:20,textAlign:'center',lineHeight:1}}>
                  {q.type==='radio'&&'○'}{q.type==='checkbox'&&'□'}{q.type==='dropdown'&&<span style={{fontSize:11,fontWeight:700}}>{i+1}.</span>}
                </span>
                <input value={opt} onChange={e=>editOpt(i,e.target.value)} onClick={e=>e.stopPropagation()} placeholder={`Option ${i+1}`}
                  style={{...ib,flex:1,fontSize:13.5,borderBottom:`1px solid ${T.line2}`,paddingBottom:5,transition:'border-color .16s'}}
                  onFocus={e=>e.target.style.borderBottomColor=accent} onBlur={e=>e.target.style.borderBottomColor=T.line2}/>
                {isActive&&q.options.length>1&&(
                  <button onClick={e=>{e.stopPropagation();delOpt(i);}} style={{width:26,height:26,borderRadius:6,border:'none',background:'transparent',color:T.ink3,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',transition:'all .13s',flexShrink:0}}
                    onMouseEnter={e=>{e.currentTarget.style.background=T.errBg;e.currentTarget.style.color=T.errText;}}
                    onMouseLeave={e=>{e.currentTarget.style.background='transparent';e.currentTarget.style.color=T.ink3;}}>
                    {IC.x}
                  </button>
                )}
              </div>
            ))}
            {isActive&&<button onClick={e=>{e.stopPropagation();addOpt();}} style={{alignSelf:'flex-start',border:'none',background:'none',cursor:'pointer',fontSize:12.5,fontWeight:700,fontFamily:'inherit',color:accent,padding:'2px 0',transition:'opacity .14s'}} onMouseEnter={e=>e.currentTarget.style.opacity='.65'} onMouseLeave={e=>e.currentTarget.style.opacity='1'}>＋ Add option</button>}
          </div>
        )}
        {hasRows&&(
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:20}}>
            {[{label:'Rows',items:q.rows,edit:editRow,del:delRow,add:addRow,sym:'›'},{label:'Columns',items:q.options,edit:editOpt,del:delOpt,add:addOpt,sym:'◉'}].map(col=>(
              <div key={col.label}>
                <p style={{fontSize:10,fontWeight:700,textTransform:'uppercase',letterSpacing:'.07em',color:T.ink3,margin:'0 0 8px'}}>{col.label}</p>
                {col.items.map((it,i)=>(
                  <div key={i} style={{display:'flex',alignItems:'center',gap:8,marginBottom:7}}>
                    <span style={{fontSize:11,color:T.ink3,width:14,textAlign:'center',flexShrink:0}}>{col.sym}</span>
                    <input value={it} onChange={e=>col.edit(i,e.target.value)} onClick={e=>e.stopPropagation()}
                      style={{...ib,flex:1,fontSize:12.5,borderBottom:`1px solid ${T.line2}`,paddingBottom:4,transition:'border-color .16s'}}
                      onFocus={e=>e.target.style.borderBottomColor=accent} onBlur={e=>e.target.style.borderBottomColor=T.line2}/>
                    {isActive&&col.items.length>1&&(
                      <button onClick={e=>{e.stopPropagation();col.del(i);}} style={{width:24,height:24,borderRadius:5,border:'none',background:'transparent',color:T.ink3,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,transition:'all .13s'}}
                        onMouseEnter={e=>{e.currentTarget.style.background=T.errBg;e.currentTarget.style.color=T.errText;}}
                        onMouseLeave={e=>{e.currentTarget.style.background='transparent';e.currentTarget.style.color=T.ink3;}}>
                        {IC.x}
                      </button>
                    )}
                  </div>
                ))}
                {isActive&&<button onClick={e=>{e.stopPropagation();col.add();}} style={{border:'none',background:'none',cursor:'pointer',fontSize:11.5,fontWeight:700,fontFamily:'inherit',color:accent,padding:'2px 0'}}>＋ Add</button>}
              </div>
            ))}
          </div>
        )}
        {hasSc&&(
          <div style={{display:'flex',flexDirection:'column',gap:10}}>
            <div style={{display:'flex',alignItems:'center',gap:12}}>
              {[{l:'From',k:'scaleMin',v:q.scaleMin,mn:0,mx:1},{l:'to',k:'scaleMax',v:q.scaleMax,mn:2,mx:10}].map(f=>(
                <div key={f.k} style={{display:'flex',alignItems:'center',gap:7}}>
                  <span style={{fontSize:12.5,color:T.ink3}}>{f.l}</span>
                  <input type="number" min={f.mn} max={f.mx} value={f.v} onChange={e=>onChange({[f.k]:+e.target.value})} onClick={e=>e.stopPropagation()}
                    style={{width:52,textAlign:'center',border:`1px solid ${T.line}`,borderRadius:8,padding:'6px',fontSize:13,outline:'none',fontFamily:'inherit',background:T.card2,color:T.ink,transition:'border-color .15s'}}
                    onFocus={e=>e.target.style.borderColor=accent} onBlur={e=>e.target.style.borderColor=T.line}/>
                </div>
              ))}
            </div>
            <div style={{display:'flex',gap:6,flexWrap:'wrap',padding:'10px 12px',background:T.card2,borderRadius:10}}>
              {Array.from({length:q.scaleMax-q.scaleMin+1},(_,i)=>i+q.scaleMin).map(n=>(
                <div key={n} style={{width:30,height:30,borderRadius:'50%',border:`1.5px solid ${T.acLine}`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,fontWeight:700,color:T.acText}}>{n}</div>
              ))}
            </div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
              {[{k:'scaleMinLabel',ph:`Label ${q.scaleMin}`,v:q.scaleMinLabel,al:'left'},{k:'scaleMaxLabel',ph:`Label ${q.scaleMax}`,v:q.scaleMaxLabel,al:'right'}].map(f=>(
                <input key={f.k} value={f.v} onChange={e=>onChange({[f.k]:e.target.value})} onClick={e=>e.stopPropagation()} placeholder={f.ph}
                  style={{fontFamily:"'Plus Jakarta Sans',sans-serif",color:T.ink3,background:'transparent',border:'none',outline:'none',width:'100%',fontSize:12,borderBottom:`1px solid ${T.line2}`,paddingBottom:4,textAlign:f.al,transition:'border-color .15s'}}
                  onFocus={e=>e.target.style.borderBottomColor=accent} onBlur={e=>e.target.style.borderBottomColor=T.line2}/>
              ))}
            </div>
          </div>
        )}
        {q.type==='date'&&<input type="date" disabled style={{border:`1px solid ${T.line}`,borderRadius:9,padding:'8px 12px',fontSize:13,color:T.ink3,background:T.card2,fontFamily:'inherit',cursor:'not-allowed',opacity:.5}}/>}
        {q.type==='time'&&<input type="time" disabled style={{border:`1px solid ${T.line}`,borderRadius:9,padding:'8px 12px',fontSize:13,color:T.ink3,background:T.card2,fontFamily:'inherit',cursor:'not-allowed',opacity:.5}}/>}
        {q.type==='file'&&<div style={{border:`1.5px dashed ${T.acLine}`,borderRadius:10,padding:'16px',textAlign:'center',color:T.ink3,fontSize:12.5,background:T.acBg}}>📎 File upload field</div>}
        {isActive&&(
          <div style={{paddingTop:12,marginTop:2,borderTop:`1px solid ${T.line}`,display:'flex',justifyContent:'flex-end',alignItems:'center',gap:10}} onClick={e=>e.stopPropagation()}>
            <span style={{fontSize:12.5,fontWeight:600,color:q.required?T.acText:T.ink3,transition:'color .18s'}}>Required</span>
            <button onClick={()=>onChange({required:!q.required})} style={{position:'relative',width:40,height:22,borderRadius:100,border:'none',cursor:'pointer',flexShrink:0,background:q.required?accent:T.line2,transition:'background .2s',boxShadow:q.required?`0 0 0 3px rgba(${T.acRgb},.18)`:'none'}}>
              <div style={{position:'absolute',top:2,left:q.required?20:2,width:18,height:18,borderRadius:'50%',background:'#fff',boxShadow:'0 1px 4px rgba(0,0,0,.22)',transition:'left .2s cubic-bezier(.22,1,.36,1)'}}/>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
//  PREVIEW — identical to new/page.jsx
// ════════════════════════════════════════════════════════════════════
function PreviewSection({title,subtitle,accent,questions,T}) {
  const [res,setRes]=useState({});
  const [done,setDone]=useState(false);
  const rgb=hr(accent);
  const set=(id,v)=>setRes(r=>({...r,[id]:v}));
  const ib={fontFamily:"'Plus Jakarta Sans',sans-serif",color:T.ink,background:'transparent',border:'none',outline:'none',width:'100%',fontSize:14};
  if(done) return (
    <div style={{display:'flex',flexDirection:'column',alignItems:'center',padding:'80px 24px',gap:16,textAlign:'center'}}>
      <div style={{width:68,height:68,borderRadius:'50%',background:`linear-gradient(135deg,${accent},${accent}99)`,display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontSize:28,boxShadow:`0 8px 24px rgba(${rgb},.35)`,animation:'_pop .4s cubic-bezier(.22,1,.36,1)'}}>✓</div>
      <h2 style={{margin:'8px 0 0',fontSize:22,fontWeight:800,color:T.ink,letterSpacing:'-.02em'}}>Response submitted!</h2>
      <p style={{margin:0,fontSize:14,color:T.ink3}}>Your answers have been recorded.</p>
      <button onClick={()=>{setDone(false);setRes({});}} style={{marginTop:8,padding:'10px 28px',background:accent,color:'#fff',border:'none',borderRadius:100,fontSize:13.5,fontWeight:700,cursor:'pointer',fontFamily:'inherit',boxShadow:`0 2px 12px rgba(${rgb},.35)`}}>Submit another response</button>
    </div>
  );
  return (
    <div style={{maxWidth:660,margin:'0 auto',width:'100%',paddingBottom:48}}>
      <div style={{background:T.card,border:`1px solid ${T.line}`,borderRadius:16,boxShadow:T.shadow,overflow:'hidden',marginBottom:12}}>
        <div style={{height:8,background:accent,borderRadius:'15px 15px 0 0'}}/>
        <div style={{padding:'26px 30px'}}>
          <h1 style={{margin:'0 0 8px',fontSize:24,fontWeight:800,color:T.ink,letterSpacing:'-.02em'}}>{title||'Untitled form'}</h1>
          {subtitle&&<p style={{margin:'0 0 8px',fontSize:14,color:T.ink2}}>{subtitle}</p>}
          <p style={{margin:0,fontSize:12,color:T.ink3}}>Fields marked <span style={{color:T.errText}}>*</span> are required.</p>
        </div>
      </div>
      {questions.map(q=>(
        <div key={q.id} style={{background:T.card,border:`1px solid ${T.line}`,borderRadius:16,boxShadow:T.shadow,padding:'20px 26px',marginBottom:10}}>
          <p style={{margin:'0 0 4px',fontSize:14.5,fontWeight:600,color:T.ink}}>{q.title||'Untitled question'}{q.required&&<span style={{color:T.errText,marginLeft:4}}>*</span>}</p>
          {q.description&&<p style={{margin:'0 0 12px',fontSize:12,color:T.ink3}}>{q.description}</p>}
          {q.type==='short'   &&<input value={res[q.id]||''} onChange={e=>set(q.id,e.target.value)} placeholder="Your answer" style={{...ib,borderBottom:`1.5px solid ${T.line2}`,paddingBottom:6,transition:'border-color .16s'}} onFocus={e=>e.target.style.borderBottomColor=accent} onBlur={e=>e.target.style.borderBottomColor=T.line2}/>}
          {q.type==='long'    &&<textarea rows={3} value={res[q.id]||''} onChange={e=>set(q.id,e.target.value)} placeholder="Your answer" style={{...ib,borderBottom:`1.5px solid ${T.line2}`,paddingBottom:6,resize:'vertical',display:'block'}} onFocus={e=>e.target.style.borderBottomColor=accent} onBlur={e=>e.target.style.borderBottomColor=T.line2}/>}
          {q.type==='radio'   &&q.options.map((o,j)=><label key={j} style={{display:'flex',alignItems:'center',gap:10,marginBottom:8,cursor:'pointer',fontSize:13.5,color:T.ink2}}><input type="radio" name={q.id} checked={res[q.id]===o} onChange={()=>set(q.id,o)} style={{accentColor:accent,width:16,height:16}}/>{o}</label>)}
          {q.type==='checkbox'&&q.options.map((o,j)=><label key={j} style={{display:'flex',alignItems:'center',gap:10,marginBottom:8,cursor:'pointer',fontSize:13.5,color:T.ink2}}><input type="checkbox" checked={(res[q.id]||[]).includes(o)} onChange={e=>{const p=res[q.id]||[];set(q.id,e.target.checked?[...p,o]:p.filter(v=>v!==o));}} style={{accentColor:accent,width:16,height:16}}/>{o}</label>)}
          {q.type==='dropdown'&&<select value={res[q.id]||''} onChange={e=>set(q.id,e.target.value)} style={{border:`1px solid ${T.line}`,borderRadius:9,padding:'8px 12px',fontSize:13.5,color:T.ink,background:T.card2,outline:'none',fontFamily:'inherit',cursor:'pointer',transition:'border-color .16s'}} onFocus={e=>e.target.style.borderColor=accent} onBlur={e=>e.target.style.borderColor=T.line}><option value="">Choose…</option>{q.options.map((o,j)=><option key={j}>{o}</option>)}</select>}
          {q.type==='scale'   &&<div style={{display:'flex',gap:8,flexWrap:'wrap',marginTop:8}}>{Array.from({length:q.scaleMax-q.scaleMin+1},(_,i)=>i+q.scaleMin).map(n=><button key={n} onClick={()=>set(q.id,n)} style={{width:38,height:38,borderRadius:'50%',border:`1.5px solid ${res[q.id]===n?accent:T.line2}`,background:res[q.id]===n?accent:T.card,color:res[q.id]===n?'#fff':T.ink2,fontWeight:700,cursor:'pointer',fontSize:13,fontFamily:'inherit',transition:'all .15s'}}>{n}</button>)}</div>}
          {q.type==='date'    &&<input type="date" value={res[q.id]||''} onChange={e=>set(q.id,e.target.value)} style={{border:`1px solid ${T.line}`,borderRadius:9,padding:'8px 12px',fontSize:13.5,background:T.card2,color:T.ink,outline:'none',fontFamily:'inherit',transition:'border-color .16s'}} onFocus={e=>e.target.style.borderColor=accent} onBlur={e=>e.target.style.borderColor=T.line}/>}
          {q.type==='time'    &&<input type="time" value={res[q.id]||''} onChange={e=>set(q.id,e.target.value)} style={{border:`1px solid ${T.line}`,borderRadius:9,padding:'8px 12px',fontSize:13.5,background:T.card2,color:T.ink,outline:'none',fontFamily:'inherit'}}/>}
          {q.type==='file'    &&<input type="file" style={{fontSize:13,color:T.ink2}}/>}
        </div>
      ))}
      <button onClick={()=>setDone(true)} style={{padding:'12px 34px',background:accent,color:'#fff',border:'none',borderRadius:100,fontSize:14,fontWeight:700,cursor:'pointer',fontFamily:'inherit',boxShadow:`0 2px 14px rgba(${rgb},.32)`,transition:'all .18s'}}
        onMouseEnter={e=>{e.currentTarget.style.transform='translateY(-2px)';e.currentTarget.style.boxShadow=`0 6px 20px rgba(${rgb},.44)`;}}
        onMouseLeave={e=>{e.currentTarget.style.transform='none';e.currentTarget.style.boxShadow=`0 2px 14px rgba(${rgb},.32)`;}}>
        Submit
      </button>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
//  SETTINGS — identical to new/page.jsx
// ════════════════════════════════════════════════════════════════════
function SettingsSection({accent,T}) {
  const [collectEmail,setCE]=useState(false);
  const [limitOne,    setLO]=useState(false);
  const [shuffleQ,    setSQ]=useState(false);
  const [showProg,    setSP]=useState(true);
  const [confirmMsg,  setCM]=useState('');
  const [deadline,    setDL]=useState('');
  const [reminder,    setRM]=useState(3);
  const Group=({title,children})=>(
    <div style={{background:T.card,border:`1px solid ${T.line}`,borderRadius:16,overflow:'hidden',boxShadow:T.shadow}}>
      <div style={{padding:'14px 22px 12px',borderBottom:`1px solid ${T.line}`}}>
        <span style={{fontSize:11,fontWeight:700,textTransform:'uppercase',letterSpacing:'.08em',color:T.ink3}}>{title}</span>
      </div>
      <div style={{padding:'0 22px'}}>{children}</div>
    </div>
  );
  const Toggle=({on,set,label,desc})=>(
    <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'15px 0',borderBottom:`1px solid ${T.line}`,gap:20}}>
      <div>
        <p style={{margin:0,fontSize:13.5,fontWeight:600,color:T.ink}}>{label}</p>
        {desc&&<p style={{margin:'3px 0 0',fontSize:12,color:T.ink3,lineHeight:1.4}}>{desc}</p>}
      </div>
      <button onClick={()=>set(!on)} style={{position:'relative',width:40,height:22,borderRadius:100,border:'none',cursor:'pointer',flexShrink:0,background:on?accent:T.line2,transition:'background .2s'}}>
        <div style={{position:'absolute',top:2,left:on?20:2,width:18,height:18,borderRadius:'50%',background:'#fff',boxShadow:'0 1px 3px rgba(0,0,0,.2)',transition:'left .18s cubic-bezier(.22,1,.36,1)'}}/>
      </button>
    </div>
  );
  const fld={border:`1px solid ${T.line}`,borderRadius:9,padding:'9px 13px',fontSize:13,background:T.card2,color:T.ink,outline:'none',fontFamily:"'Plus Jakarta Sans',sans-serif",transition:'border-color .16s'};
  return (
    <div style={{maxWidth:600,display:'flex',flexDirection:'column',gap:14,paddingBottom:48}}>
      <Group title="Responses">
        <Toggle on={collectEmail} set={setCE} label="Collect email addresses" desc="Ask respondents for their email before submitting"/>
        <Toggle on={limitOne}     set={setLO} label="Limit to 1 response"     desc="Each candidate can only respond once"/>
        <Toggle on={shuffleQ}     set={setSQ} label="Shuffle question order"   desc="Randomize order for each respondent"/>
      </Group> 
      <Group title="Presentation">
        <Toggle on={showProg} set={setSP} label="Show progress bar" desc="Display completion progress to respondents"/>
        <div style={{padding:'16px 0'}}>
          <label style={{fontSize:13,fontWeight:600,color:T.ink,display:'block',marginBottom:8}}>Confirmation message</label>
          <textarea value={confirmMsg} onChange={e=>setCM(e.target.value)} rows={2} placeholder="Thank you for your response!" style={{...fld,width:'100%',resize:'none',display:'block'}} onFocus={e=>e.target.style.borderColor=accent} onBlur={e=>e.target.style.borderColor=T.line}/>
        </div>
      </Group>
      <Group title="Deadline & Reminders">
        <div style={{padding:'16px 0',display:'flex',flexDirection:'column',gap:16}}>
          <div>
            <label style={{fontSize:13,fontWeight:600,color:T.ink,display:'block',marginBottom:8}}>Response deadline</label>
            <input type="date" value={deadline} onChange={e=>setDL(e.target.value)} style={fld} onFocus={e=>e.target.style.borderColor=accent} onBlur={e=>e.target.style.borderColor=T.line}/>
          </div>
          <div>
            <label style={{fontSize:13,fontWeight:600,color:T.ink,display:'block',marginBottom:8}}>Auto-reminder</label>
            <div style={{display:'flex',alignItems:'center',gap:10}}>
              <input type="number" min={1} max={30} value={reminder} onChange={e=>setRM(+e.target.value)} style={{...fld,width:64,textAlign:'center',fontSize:14}} onFocus={e=>e.target.style.borderColor=accent} onBlur={e=>e.target.style.borderColor=T.line}/>
              <span style={{fontSize:13,color:T.ink3}}>days before the deadline</span>
            </div>
          </div>
        </div>
      </Group>
    </div>
  );
}