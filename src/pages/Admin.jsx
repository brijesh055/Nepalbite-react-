// src/pages/Admin.jsx
import React, { useState, useEffect, useRef } from 'react';
import { auth, db } from '../firebase';
import {
  signInWithEmailAndPassword, sendPasswordResetEmail,
  signOut, onAuthStateChanged
} from 'firebase/auth';
import {
  collection, onSnapshot, query, orderBy, limit,
  doc, updateDoc, addDoc, serverTimestamp, getDocs
} from 'firebase/firestore';
import useCursor from '../hooks/useCursor';
import './Admin.css';

// ── QR Library loaded globally ──────────────────
const QR_CDN = 'https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js';

// ── Demo data (shown until Firestore loads) ──────
const DEMO_ORDERS = [
  { id:'NB-A001', item:'Dal Bhat Thali × 2', type:'Dine-In',   tableNo:'T-4', customer:'Ramesh S.', total:900,  status:'preparing', time:'12:34', phone:'9801234567' },
  { id:'NB-A002', item:'Chicken Momo × 3',   type:'Delivery',  tableNo:'—',   customer:'Priya M.',  total:840,  status:'pending',   time:'12:41', phone:'9812345678' },
  { id:'NB-A003', item:'Thakali Set × 1',    type:'Table QR',  tableNo:'T-3', customer:'Sita K.',   total:650,  status:'ready',     time:'12:28', phone:'9823456789' },
  { id:'NB-A004', item:'Newari Khaja × 2',   type:'Dine-In',   tableNo:'T-7', customer:'Bikash G.', total:1040, status:'delivered', time:'12:15', phone:'9834567890' },
  { id:'NB-A005', item:'Masala Chiya × 4',   type:'Table QR',  tableNo:'T-2', customer:'Anita T.',  total:320,  status:'pending',   time:'12:44', phone:'9845678901' },
  { id:'NB-A006', item:'Chatamari × 2',       type:'Online',    tableNo:'—',   customer:'Sunil M.',  total:480,  status:'preparing', time:'12:39', phone:'9856789012' },
];
const DEMO_MENU = [
  { id:1, name:'Dal Bhat Thali', cat:'Dal Bhat',   price:450, img:'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=200&q=80', available:true },
  { id:2, name:'Chicken Momo',  cat:'Momos',      price:280, img:'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=200&q=80', available:true },
  { id:3, name:'Thakali Set',   cat:'Dal Bhat',   price:650, img:'https://images.unsplash.com/photo-1627308595229-7830a5c91f9f?w=200&q=80', available:true },
  { id:4, name:'Newari Khaja',  cat:'Newari',     price:520, img:'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=200&q=80', available:true },
  { id:5, name:'Chatamari',     cat:'Newari',     price:240, img:'https://images.unsplash.com/photo-1565299507177-b0ac66763828?w=200&q=80', available:true },
  { id:6, name:'Juju Dhau',     cat:'Sweets',     price:160, img:'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=200&q=80', available:true },
  { id:7, name:'Masala Chiya',  cat:'Drinks',     price:80,  img:'https://images.unsplash.com/photo-1556242049-0cfed4f6a45d?w=200&q=80', available:false },
  { id:8, name:'Chicken Curry', cat:'Meat Dishes',price:380, img:'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=200&q=80', available:true },
];
const DEMO_STORIES = [
  { id:1, name:'Sita Sharma', time:'2h ago', cap:'Fresh momos 🥟', img:'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=200&q=80', exp:'22h left' },
  { id:2, name:'Ramesh K.',   time:'4h ago', cap:'Thakali lunch ❤️',img:'https://images.unsplash.com/photo-1627308595229-7830a5c91f9f?w=200&q=80', exp:'20h left' },
  { id:3, name:'Pooja Rai',   time:'5h ago', cap:'Sunday dal bhat',  img:'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=200&q=80', exp:'19h left' },
  { id:4, name:'Bikash G.',   time:'6h ago', cap:'Newari feast!',     img:'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=200&q=80', exp:'18h left' },
];
const DEMO_FEEDBACK = [
  { id:1, name:'Priya Maharjan', rating:5, message:'Best dal bhat! Fast delivery, still hot.', date:'Mar 25, 2025' },
  { id:2, name:'Sujan Thapa',    rating:5, message:'Newari Khaja Set was absolutely authentic.', date:'Mar 24, 2025' },
  { id:3, name:'Aarati S.',      rating:4, message:'Great food, delivery 10 mins late. Still 4 stars.', date:'Mar 24, 2025' },
];
const INVENTORY = [
  { name:'Masoor Dal',   unit:'kg', stock:2.3, min:5,  status:'critical' },
  { name:'Basmati Rice', unit:'kg', stock:8,   min:10, status:'low' },
  { name:'Desi Ghee',    unit:'L',  stock:1.2, min:3,  status:'low' },
  { name:'Chicken',      unit:'kg', stock:4,   min:5,  status:'low' },
  { name:'Cabbage',      unit:'kg', stock:12,  min:5,  status:'ok' },
  { name:'Ginger',       unit:'kg', stock:3.5, min:2,  status:'ok' },
  { name:'Mustard Oil',  unit:'L',  stock:8,   min:4,  status:'ok' },
  { name:'Buffalo Meat', unit:'kg', stock:6,   min:5,  status:'ok' },
];

// ── Status pill helper ────────────────────────────
function StatusPill({ status }) {
  const map = {
    pending:   ['pill-new',  'Pending'],
    preparing: ['pill-prep', 'Preparing'],
    ready:     ['pill-rdy',  'Ready'],
    delivered: ['pill-done', 'Delivered'],
    cancelled: ['pill-can',  'Cancelled'],
  };
  const [cls, label] = map[status] || ['pill-done', status];
  return <span className={`status-pill ${cls}`}>{label}</span>;
}

// ── Export helper ────────────────────────────────
function exportData(format, type, rows) {
  if (!rows.length) return;
  const dateStr = new Date().toISOString().split('T')[0];
  if (format === 'json') {
    const blob = new Blob([JSON.stringify(rows, null, 2)], { type: 'application/json' });
    dlBlob(blob, `nepalbite-${type}-${dateStr}.json`);
  } else if (format === 'csv' || format === 'excel') {
    const keys = Object.keys(rows[0]);
    const csv = [keys.join(','), ...rows.map(r => keys.map(k => `"${String(r[k] ?? '').replace(/"/g, '""')}"`).join(','))].join('\n');
    const ext = format === 'excel' ? 'xlsx' : 'csv';
    dlBlob(new Blob([csv], { type: 'text/csv' }), `nepalbite-${type}-${dateStr}.${ext}`);
  } else if (format === 'pdf') {
    const keys = Object.keys(rows[0]);
    const w = window.open('', '_blank');
    w.document.write(`<!DOCTYPE html><html><head><title>NepalBite ${type}</title>
    <style>body{font-family:sans-serif;padding:2rem;font-size:12px}h1{font-size:1.3rem}
    h1 span{color:#C9973A}p{font-size:.75rem;color:#555;margin-bottom:1rem}
    table{width:100%;border-collapse:collapse}th{background:#C9973A;color:#fff;padding:.4rem .7rem;text-align:left}
    td{padding:.4rem .7rem;border-bottom:1px solid #eee}tr:nth-child(even)td{background:#fafafa}
    button{margin-top:1rem;padding:.6rem 1.4rem;background:#C9973A;color:#0A0A08;border:none;border-radius:4px;font-weight:700;cursor:pointer}
    @media print{button{display:none}}</style></head>
    <body><h1>Nepal<span>Bite</span> — ${type} Report</h1>
    <p>Generated: ${new Date().toLocaleString()}</p>
    <table><thead><tr>${keys.map(k => `<th>${k}</th>`).join('')}</tr></thead>
    <tbody>${rows.map(r => `<tr>${keys.map(k => `<td>${r[k] ?? ''}</td>`).join('')}</tr>`).join('')}</tbody>
    </table><button onclick="window.print()">🖨 Print / Save PDF</button></body></html>`);
    w.document.close();
  }
}
function dlBlob(blob, name) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = name; a.click();
  URL.revokeObjectURL(a.href);
}

// ── Export Dropdown ────────────────────────────────
function ExportMenu({ type, rows }) {
  const [open, setOpen] = useState(false);
  const ref = useRef();
  useEffect(() => {
    const close = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);
  return (
    <div className="exp-wrap" ref={ref}>
      <button className="exp-btn" onClick={() => setOpen(!open)}>⬇ Export ▾</button>
      {open && (
        <div className="exp-dd">
          {[['csv','📄','CSV'],['excel','📊','Excel (.xlsx)'],['json','{}','JSON'],['pdf','🖨','Print / PDF']].map(([fmt,ic,label]) => (
            <button key={fmt} className="exp-item" onClick={() => { exportData(fmt, type, rows); setOpen(false); }}>
              <span>{ic}</span><span>{label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════
// MAIN ADMIN COMPONENT
// ══════════════════════════════════════════════════
export default function Admin() {
  useCursor();

  // Auth state
  const [user,     setUser]     = useState(null);
  const [authReady,setAuthReady]= useState(false);
  const [role,     setRole]     = useState('Admin');

  // Login form
  const [loginView, setLoginView] = useState('signin'); // signin | forgot
  const [lEmail,    setLEmail]    = useState('');
  const [lPass,     setLPass]     = useState('');
  const [lErr,      setLErr]      = useState('');
  const [lLoading,  setLLoading]  = useState(false);
  const [fEmail,    setFEmail]    = useState('');
  const [fErr,      setFErr]      = useState('');
  const [fOk,       setFOk]       = useState('');

  // App state
  const [page,       setPage]      = useState('dashboard');
  const [sbOpen,     setSbOpen]    = useState(false);
  const [orders,     setOrders]    = useState(DEMO_ORDERS);
  const [menuItems,  setMenuItems] = useState(DEMO_MENU);
  const [stories,    setStories]   = useState(DEMO_STORIES);
  const [feedback,   setFeedback]  = useState(DEMO_FEEDBACK);
  const [tableCount, setTableCount]= useState(10);
  const [toast,      setToast]     = useState('');
  const [toastShow,  setToastShow] = useState(false);

  // Add menu modal
  const [addOpen,    setAddOpen]   = useState(false);
  const [nmName,     setNmName]    = useState('');
  const [nmCat,      setNmCat]     = useState('Dal Bhat');
  const [nmPrice,    setNmPrice]   = useState('');
  const [nmDesc,     setNmDesc]    = useState('');
  const [nmImg,      setNmImg]     = useState('');

  // QR refs
  const qrRefs = useRef({});

  // Load QR library
  useEffect(() => {
    if (!window.QRCode) {
      const s = document.createElement('script');
      s.src = QR_CDN; document.head.appendChild(s);
    }
  }, []);

  // Auth listener
  useEffect(() => {
    return onAuthStateChanged(auth, u => { setUser(u); setAuthReady(true); });
  }, []);

  // Live orders from Firestore
  useEffect(() => {
    if (!user) return;
    try {
      const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'), limit(50));
      return onSnapshot(q, snap => {
        if (!snap.empty) {
          const live = snap.docs.map(d => ({ ...d.data(), id: d.id, firestoreId: d.id }));
          setOrders(prev => {
            const merged = [...live, ...DEMO_ORDERS.filter(o => !live.find(l => l.id === o.id))];
            return merged;
          });
        }
      });
    } catch (e) { console.warn('Live orders failed:', e); }
  }, [user]);

  // Live feedback from Firestore
  useEffect(() => {
    if (!user) return;
    getDocs(query(collection(db, 'feedback'), orderBy('createdAt', 'desc'), limit(20)))
      .then(snap => { if (!snap.empty) setFeedback(snap.docs.map(d => d.data())); })
      .catch(() => {});
  }, [user]);

  // Generate QR codes when on tables page
  useEffect(() => {
    if (page !== 'tables' || !window.QRCode) return;
    setTimeout(() => {
      for (let t = 1; t <= tableCount; t++) {
        const el = document.getElementById(`qr-${t}`);
        if (el && el.innerHTML === '') {
          const url = `${window.location.origin}/table?table=${t}`;
          try { new window.QRCode(el, { text: url, width: 70, height: 70, colorDark: '#0A0A08', colorLight: '#FFFFFF' }); }
          catch (e) { el.innerHTML = `<div style="font-size:.5rem;color:#666;text-align:center;padding:4px">T${t}</div>`; }
        }
      }
    }, 150);
  }, [page, tableCount]);

  // Toast
  const showToast = msg => {
    setToast(msg); setToastShow(true);
    setTimeout(() => setToastShow(false), 2800);
  };

  // ── Login ──
  const fbErrMsg = code => ({
    'auth/invalid-credential': 'Wrong email or password.',
    'auth/user-not-found':     'No account with this email.',
    'auth/wrong-password':     'Wrong password.',
    'auth/too-many-requests':  'Too many attempts. Try again later.',
  }[code] || 'Sign in failed.');

  const doLogin = async e => {
    e.preventDefault(); setLErr('');
    if (!lEmail || !lPass) { setLErr('Please fill in all fields.'); return; }
    setLLoading(true);
    try { await signInWithEmailAndPassword(auth, lEmail, lPass); }
    catch (err) { setLErr(fbErrMsg(err.code)); }
    setLLoading(false);
  };

  const doForgot = async e => {
    e.preventDefault(); setFErr(''); setFOk('');
    if (!fEmail) { setFErr('Please enter your email.'); return; }
    try {
      await sendPasswordResetEmail(auth, fEmail);
      setFOk('✓ Reset email sent! Check your inbox and spam folder.');
    } catch (err) { setFErr(fbErrMsg(err.code)); }
  };

  // ── Order status update ──
  const updOrder = async (id, newStatus) => {
    setOrders(prev => prev.map(o => (o.id === id || o.orderNumber === id) ? { ...o, status: newStatus } : o));
    const o = orders.find(x => x.id === id || x.orderNumber === id);
    if (o?.firestoreId) {
      try { await updateDoc(doc(db, 'orders', o.firestoreId), { status: newStatus }); } catch {}
    }
    showToast(`Order ${id} → ${newStatus} ✓`);
  };

  // ── Menu toggle ──
  const toggleMenuItem = i => {
    setMenuItems(prev => prev.map((m, idx) => idx === i ? { ...m, available: !m.available } : m));
    showToast(`${menuItems[i].name} → ${menuItems[i].available ? 'Hidden' : 'Live'} ✓`);
  };

  // ── Add menu item ──
  const addMenuItem = async () => {
    if (!nmName) { showToast('Please enter item name'); return; }
    const item = { id: Date.now(), name: nmName, cat: nmCat, price: parseInt(nmPrice) || 0, desc: nmDesc, img: nmImg || 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=200&q=80', available: true };
    try { await addDoc(collection(db, 'menu'), { ...item, createdAt: serverTimestamp() }); showToast(`${nmName} saved to Firebase ✓`); }
    catch { showToast(`${nmName} added locally ✓`); }
    setMenuItems(prev => [item, ...prev]);
    setAddOpen(false); setNmName(''); setNmCat('Dal Bhat'); setNmPrice(''); setNmDesc(''); setNmImg('');
  };

  // ── Print QR ──
  const printQR = (t, url) => {
    const w = window.open('', '_blank');
    w.document.write(`<!DOCTYPE html><html><head><title>Table ${t} QR</title>
    <script src="${QR_CDN}"><\/script>
    <style>body{font-family:sans-serif;display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;background:#fff;text-align:center;gap:.75rem;padding:2rem}
    .logo{font-size:1.6rem;font-weight:900;color:#111}.logo span{color:#C9973A}
    .tnum{font-size:3.5rem;font-weight:900;color:#C9973A}#qrdiv{margin:.5rem auto;width:200px}
    p{font-size:.82rem;color:#666;max-width:240px;line-height:1.55}.url{font-size:.62rem;color:#aaa;word-break:break-all;max-width:280px}
    button{margin-top:1rem;padding:.65rem 1.6rem;background:#C9973A;color:#0A0A08;border:none;border-radius:4px;font-weight:700;cursor:pointer}
    @media print{button{display:none}}</style></head>
    <body><div class="logo">Nepal<span>Bite</span></div><div class="tnum">TABLE ${t}</div>
    <div id="qrdiv"></div>
    <p>Scan to view menu and order directly from your phone</p>
    <div class="url">${url}</div>
    <button onclick="window.print()">🖨 Print / Save as PDF</button>
    <script>window.onload=function(){new QRCode(document.getElementById('qrdiv'),{text:'${url}',width:200,height:200,colorDark:'#0A0A08',colorLight:'#FFFFFF'});}<\/script>
    </body></html>`);
    w.document.close();
  };

  // ── KPI data ──
  const pendingCount   = orders.filter(o => o.status === 'pending').length;
  const activeCount    = orders.filter(o => ['pending','preparing','ready'].includes(o.status)).length;

  // ── Not logged in ──────────────────────────────
  if (!authReady) return <div className="admin-loading">Loading…</div>;

  if (!user) return (
    <div className="admin-login-screen">
      <div className="login-card">
        <div className="login-logo">Nepal<span>Bite</span> <small>Admin</small></div>
        <div className="login-sub">Sign in to your dashboard</div>

        {/* View tabs */}
        <div className="login-vtabs">
          <button className={`lvtab${loginView==='signin'?' on':''}`} onClick={() => { setLoginView('signin'); setLErr(''); setFErr(''); setFOk(''); }}>Sign In</button>
          <button className={`lvtab${loginView==='forgot'?' on':''}`} onClick={() => { setLoginView('forgot'); setLErr(''); }}>Forgot Password</button>
        </div>

        {loginView === 'signin' && (
          <form onSubmit={doLogin}>
            {/* Role picker */}
            <div className="role-tabs">
              {['Admin','Owner','Staff'].map(r => (
                <button key={r} type="button" className={`rtab${role===r?' on':''}`} onClick={() => setRole(r)}>{r}</button>
              ))}
            </div>
            <div className="login-hint-box">
              <strong>First time?</strong> Go to Firebase Console → Authentication → Users → Add User to create your admin account.
            </div>
            <label className="ll">Email</label>
            <input className="li" type="email" placeholder="admin@nepalbite.com" value={lEmail} onChange={e => setLEmail(e.target.value)}/>
            <label className="ll" style={{marginTop:'.65rem'}}>Password</label>
            <input className="li" type="password" placeholder="Your password" value={lPass} onChange={e => setLPass(e.target.value)}/>
            {lErr && <div className="l-err">{lErr}</div>}
            <button className="login-btn" type="submit" disabled={lLoading}>
              {lLoading ? 'Signing in…' : 'Sign In →'}
            </button>
          </form>
        )}

        {loginView === 'forgot' && (
          <form onSubmit={doForgot}>
            <p style={{fontSize:'.78rem',color:'var(--wm)',lineHeight:'1.6',marginBottom:'.85rem'}}>
              Enter your admin email and Firebase will send a password reset link instantly.
            </p>
            <label className="ll">Admin Email</label>
            <input className="li" type="email" placeholder="admin@nepalbite.com" value={fEmail} onChange={e => setFEmail(e.target.value)}/>
            {fErr && <div className="l-err">{fErr}</div>}
            {fOk  && <div className="l-ok">{fOk}</div>}
            <button className="login-btn" type="submit" disabled={!!fOk}>
              {fOk ? 'Email Sent ✓' : 'Send Reset Email →'}
            </button>
            <button type="button" className="back-link" onClick={() => setLoginView('signin')}>← Back to Sign In</button>
          </form>
        )}
      </div>
    </div>
  );

  // ── Logged in — App shell ─────────────────────
  const navItems = [
    { id:'dashboard', icon:'📊', label:'Dashboard' },
    { id:'orders',    icon:'🛒', label:'Orders',   badge: pendingCount > 0 ? pendingCount : null, badgeClass:'badge-red' },
    { id:'menu',      icon:'🍽', label:'Menu Manager' },
    { id:'stories',   icon:'📸', label:'Stories',  badge:stories.length, badgeClass:'badge-grn' },
    { id:'analytics', icon:'📈', label:'Analytics & AI' },
    { id:'feedback',  icon:'💬', label:'Feedback' },
    { id:'inventory', icon:'📦', label:'Inventory', badge:INVENTORY.filter(i=>i.status!=='ok').length, badgeClass:'badge-red' },
    { id:'tables',    icon:'🪑', label:'Tables & QR' },
    ...(role === 'Admin' ? [
      { id:'users',    icon:'👥', label:'Users & Roles' },
      { id:'settings', icon:'⚙️', label:'Settings' },
    ] : []),
  ];

  const PAGE_TITLES = { dashboard:'Dashboard', orders:'Orders', menu:'Menu Manager', stories:'Story Moderation', analytics:'Analytics & AI', feedback:'Customer Feedback', inventory:'Inventory', tables:'Tables & QR Codes', users:'Users & Roles', settings:'Settings' };

  return (
    <div className="admin-shell">
      {/* Custom cursor dots */}
      <div className="custom-cursor" />
      <div className="custom-cursor-ring" />

      {/* Sidebar overlay on mobile */}
      {sbOpen && <div className="sb-overlay" onClick={() => setSbOpen(false)} />}

      {/* ── SIDEBAR ── */}
      <aside className={`sidebar${sbOpen ? ' open' : ''}`}>
        <div className="sb-head">
          <div className="sb-logo">Nepal<span>Bite</span></div>
          <button className="sb-close" onClick={() => setSbOpen(false)}>✕</button>
        </div>
        <div className="sb-role">● {role} Dashboard</div>
        <div className="sb-section">Main</div>
        {navItems.map(item => (
          <button key={item.id} className={`sbi${page===item.id?' active':''}`} onClick={() => { setPage(item.id); setSbOpen(false); }}>
            <span className="sbi-icon">{item.icon}</span>
            <span className="sbi-label">{item.label}</span>
            {item.badge > 0 && <span className={`sbi-badge ${item.badgeClass}`}>{item.badge}</span>}
          </button>
        ))}
        <div className="sb-footer">
          <div className="sb-av">{(user.displayName || user.email)[0].toUpperCase()}</div>
          <div className="sb-user">
            <div className="sb-uname">{user.displayName || user.email.split('@')[0]}</div>
            <div className="sb-uemail">{user.email}</div>
          </div>
        </div>
      </aside>

      {/* ── MAIN ── */}
      <main className="admin-main">
        {/* Topbar */}
        <div className="topbar">
          <div className="topbar-left">
            <button className="ham-btn" onClick={() => setSbOpen(true)}>
              <span/><span/><span/>
            </button>
            <div className="tb-title">
              <span className="live-dot" />
              {PAGE_TITLES[page]}
            </div>
          </div>
          <div className="topbar-right">
            <div className="fb-conn">
              <span className="fb-dot-ok" />
              <span>Firebase ✓</span>
            </div>
            <div className="tb-date">{new Date().toLocaleDateString('en-NP',{weekday:'short',month:'short',day:'numeric'})}</div>
            <a href="/" className="ico-btn" target="_blank">View Site ↗</a>
            <a href={`/table?table=1`} className="ico-btn" target="_blank">Table Demo ↗</a>
            <button className="ico-btn danger" onClick={() => signOut(auth)}>Logout</button>
          </div>
        </div>

        {/* Page content */}
        <div className="pg-content">

          {/* ─── DASHBOARD ─── */}
          {page === 'dashboard' && (
            <div>
              <div className="kpi-grid">
                <div className="kpi"><div className="kpi-l">Today's Revenue</div><div className="kpi-v gold">₨52,400</div><div className="kpi-d up">↑ 18% vs yesterday</div></div>
                <div className="kpi"><div className="kpi-l">Active Orders</div><div className="kpi-v grn">{activeCount}</div><div className="kpi-d up">Live · Firestore</div></div>
                <div className="kpi"><div className="kpi-l">Tables Active</div><div className="kpi-v">{tableCount}</div><div className="kpi-d muted">QR codes ready</div></div>
                <div className="kpi"><div className="kpi-l">Inventory Alerts</div><div className="kpi-v red">3</div><div className="kpi-d dn">Dal, Rice, Ghee low</div></div>
              </div>
              <div className="two-col">
                <div className="card">
                  <div className="card-t">Weekly Revenue (₨)</div>
                  <div className="bar-chart">
                    {[38,45,41,55,62,85,72].map((v,i) => (
                      <div key={i} className={`bar${i===5?' hi':''}`} style={{height:`${Math.round(v/85*100)}%`}} title={`₨${(v*620).toLocaleString()}`} />
                    ))}
                  </div>
                  <div className="bar-labels">
                    {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map((d,i) => (
                      <span key={d} style={i===5?{color:'var(--g)'}:{}}>{d}</span>
                    ))}
                  </div>
                </div>
                <div className="card">
                  <div className="card-t">Orders by Category</div>
                  {[['Momos',68,'34'],['Dal Bhat',56,'28'],['Street Food',44,'22'],['Drinks',38,'19']].map(([cat,pct,cnt]) => (
                    <div key={cat}>
                      <div className="prog-row"><span>{cat}</span><span style={{color:'var(--w)',fontWeight:500}}>{cnt}</span></div>
                      <div className="prog-bar"><div className="prog-fill" style={{width:`${pct}%`}}/></div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="card">
                <div className="card-header">
                  <div className="card-t" style={{marginBottom:0}}>
                    Recent Orders <span className="live-label">● Live from Firestore</span>
                  </div>
                  <ExportMenu type="orders" rows={orders.slice(0,6).map(o=>({'Order ID':o.id||o.orderNumber,'Customer':o.customer||o.customerName||'','Items':o.item||'','Total':o.total,'Status':o.status}))} />
                </div>
                <div className="tbl-scroll">
                  <table>
                    <thead><tr><th>Order ID</th><th>Items</th><th>Type</th><th>Table</th><th>Total</th><th>Status</th><th>Time</th></tr></thead>
                    <tbody>
                      {orders.slice(0,6).map(o => (
                        <tr key={o.id||o.orderNumber}>
                          <td style={{color:'var(--g)',fontSize:'.68rem'}}>{o.orderNumber||o.id}</td>
                          <td style={{maxWidth:140}}>{o.item||'—'}</td>
                          <td style={{fontSize:'.68rem'}}>{o.type||'—'}</td>
                          <td style={{fontSize:'.68rem'}}>{o.tableNo||o.table||'—'}</td>
                          <td style={{color:'var(--g)',fontWeight:600}}>₨{(o.total||0).toLocaleString()}</td>
                          <td><StatusPill status={o.status}/></td>
                          <td style={{fontSize:'.68rem'}}>{o.time||'—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ─── ORDERS ─── */}
          {page === 'orders' && (
            <div>
              <div className="pg-hd">
                <div className="pg-ht">Orders <span className="live-dot" style={{marginLeft:'.3rem'}}/></div>
                <div style={{display:'flex',gap:'.45rem',alignItems:'center',flexWrap:'wrap'}}>
                  <ExportMenu type="orders" rows={orders.map(o=>({'ID':o.id||o.orderNumber,'Customer':o.customer||o.customerName||'','Total':o.total,'Status':o.status,'Time':o.time||''}))} />
                </div>
              </div>
              <div className="card">
                <div className="tbl-scroll">
                  <table>
                    <thead><tr><th>Order ID</th><th>Customer</th><th>Items</th><th>Type</th><th>Table</th><th>Total</th><th>Status</th><th>Actions</th></tr></thead>
                    <tbody>
                      {orders.map(o => (
                        <tr key={o.id||o.orderNumber}>
                          <td style={{color:'var(--g)',fontSize:'.66rem'}}>{o.orderNumber||o.id}</td>
                          <td>
                            <div style={{fontSize:'.72rem',fontWeight:500}}>{o.customer||o.customerName||'Guest'}</div>
                            <div style={{fontSize:'.58rem',color:'var(--wd)'}}>{o.phone||''}</div>
                          </td>
                          <td style={{fontSize:'.72rem',maxWidth:140}}>{o.item||'—'}</td>
                          <td style={{fontSize:'.68rem'}}>{o.type||'—'}</td>
                          <td style={{fontSize:'.68rem'}}>{o.tableNo||o.table||'—'}</td>
                          <td style={{color:'var(--g)',fontWeight:600}}>₨{(o.total||0).toLocaleString()}</td>
                          <td><StatusPill status={o.status}/></td>
                          <td>
                            <div className="ab-row">
                              {o.status==='pending'    && <button className="ab ab-g" onClick={()=>updOrder(o.id||o.orderNumber,'preparing')}>Accept</button>}
                              {o.status==='preparing'  && <button className="ab ab-o" onClick={()=>updOrder(o.id||o.orderNumber,'ready')}>Ready</button>}
                              {o.status==='ready'      && <button className="ab ab-g" onClick={()=>updOrder(o.id||o.orderNumber,'delivered')}>Delivered</button>}
                              {['pending','preparing'].includes(o.status) && <button className="ab ab-r" onClick={()=>updOrder(o.id||o.orderNumber,'cancelled')}>Cancel</button>}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ─── MENU MANAGER ─── */}
          {page === 'menu' && (
            <div>
              <div className="pg-hd">
                <div className="pg-ht">Menu Manager</div>
                <div style={{display:'flex',gap:'.4rem',flexWrap:'wrap'}}>
                  <ExportMenu type="menu" rows={menuItems.map(m=>({Name:m.name,Category:m.cat,Price:m.price,Available:m.available?'Yes':'No'}))} />
                  <button className="ab ab-o" style={{padding:'.38rem .9rem',fontSize:'.72rem'}} onClick={()=>setAddOpen(true)}>+ Add Item</button>
                </div>
              </div>
              <div className="ma-grid">
                {menuItems.map((m, i) => (
                  <div key={m.id||i} className="ma-card">
                    <img className="ma-img" src={m.img} alt={m.name} loading="lazy"/>
                    <span className={`ma-tog ${m.available?'tog-on':'tog-off'}`} onClick={() => toggleMenuItem(i)}>{m.available?'Live':'Hidden'}</span>
                    <div className="ma-body">
                      <div className="ma-cat">{m.cat}</div>
                      <div className="ma-name">{m.name}</div>
                      <div className="ma-price">₨{m.price}</div>
                      <div className="ab-row">
                        <button className="ab ab-o" onClick={()=>showToast(`Edit ${m.name}`)}>Edit</button>
                        <button className="ab ab-r" onClick={()=>{ if(window.confirm(`Delete "${m.name}"?`)) { setMenuItems(p=>p.filter((_,idx)=>idx!==i)); showToast('Item deleted'); }}}>Delete</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Add menu modal */}
              {addOpen && (
                <div className="modal-bg" onClick={e => e.target===e.currentTarget && setAddOpen(false)}>
                  <div className="modal-box">
                    <button className="modal-close" onClick={()=>setAddOpen(false)}>✕</button>
                    <div className="modal-title">Add Menu Item</div>
                    <div className="mf2">
                      <div>
                        <label className="mfl">Item Name</label>
                        <input className="mfi" placeholder="Dal Bhat Thali" value={nmName} onChange={e=>setNmName(e.target.value)}/>
                      </div>
                      <div>
                        <label className="mfl">Category</label>
                        <select className="mfi" value={nmCat} onChange={e=>setNmCat(e.target.value)}>
                          {['Dal Bhat','Momos','Newari','Street Food','Meat Dishes','Sweets','Fast Food','Drinks'].map(c=><option key={c}>{c}</option>)}
                        </select>
                      </div>
                    </div>
                    <label className="mfl">Price (₨)</label>
                    <input className="mfi" type="number" placeholder="350" value={nmPrice} onChange={e=>setNmPrice(e.target.value)}/>
                    <label className="mfl">Description</label>
                    <textarea className="mfta" placeholder="Describe this dish…" value={nmDesc} onChange={e=>setNmDesc(e.target.value)}/>
                    <label className="mfl">Image URL (optional)</label>
                    <input className="mfi" placeholder="https://images.unsplash.com/…" value={nmImg} onChange={e=>setNmImg(e.target.value)}/>
                    <button className="save-btn" onClick={addMenuItem}>Add to Menu →</button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ─── STORIES ─── */}
          {page === 'stories' && (
            <div>
              <div className="pg-hd">
                <div className="pg-ht">Story Moderation</div>
                <span style={{fontSize:'.72rem',color:'var(--wm)'}}>Approve before showing to customers</span>
              </div>
              <div className="sm-grid">
                {stories.map((s, i) => (
                  <div key={s.id||i} className="sm-card">
                    <img className="sm-img" src={s.img} alt={s.cap} loading="lazy"/>
                    <span className="sm-exp">⏱ {s.exp}</span>
                    <div className="sm-info">
                      <div className="sm-name">{s.name}</div>
                      <div className="sm-time">{s.time}</div>
                      <div className="sm-cap">"{s.cap}"</div>
                      <div className="ab-row">
                        <button className="ab ab-g" onClick={()=>showToast(`Story by ${s.name} approved ✓`)}>✓ Approve</button>
                        <button className="ab ab-r" onClick={()=>{ setStories(p=>p.filter((_,idx)=>idx!==i)); showToast('Story removed'); }}>✕ Remove</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ─── ANALYTICS ─── */}
          {page === 'analytics' && (
            <div>
              <div className="pg-hd">
                <div className="pg-ht">Analytics & AI Insights</div>
                <ExportMenu type="analytics" rows={[{Metric:'Today Revenue',Value:'₨52,400'},{Metric:'Active Orders',Value:activeCount},{Metric:'Tables',Value:tableCount},{Metric:'Avg Rating',Value:4.8}]} />
              </div>
              <div className="ana-3">
                <div className="card">
                  <div className="card-t">Top Selling Items</div>
                  {[['Chicken Momo',34],['Dal Bhat',28],['Thakali Set',18],['Masala Chiya',12]].map(([name,pct])=>(
                    <div key={name}><div className="prog-row"><span>{name}</span><span style={{color:'var(--g)'}}>{pct}%</span></div><div className="prog-bar"><div className="prog-fill" style={{width:`${pct}%`}}/></div></div>
                  ))}
                </div>
                <div className="card">
                  <div className="card-t">Monthly Revenue</div>
                  <div className="bar-chart" style={{height:75}}>
                    {[42,38,55,60,48,72].map((v,i)=><div key={i} className={`bar${i===5?' hi':''}`} style={{height:`${Math.round(v/72*100)}%`}}/>)}
                  </div>
                  <div className="bar-labels">{['Oct','Nov','Dec','Jan','Feb','Mar'].map((m,i)=><span key={m} style={i===5?{color:'var(--g)'}:{}}>{m}</span>)}</div>
                </div>
                <div className="card">
                  <div className="card-t">Order Types</div>
                  {[['Dine-In',42],['Delivery',35],['Table QR',23]].map(([t,p])=>(
                    <div key={t}><div className="prog-row"><span>{t}</span><span style={{color:'var(--g)'}}>{p}%</span></div><div className="prog-bar"><div className="prog-fill" style={{width:`${p}%`}}/></div></div>
                  ))}
                </div>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))',gap:'.85rem'}}>
                <div className="card">
                  <div className="card-t">🤖 AI Demand Forecast</div>
                  <div className="ai-box"><div className="ai-lbl">Tomorrow's Prediction</div><div className="ai-txt">Revenue: <strong style={{color:'var(--g)'}}>₨58,200</strong> (+11%) · Peak: 12–2pm & 6–8pm · High demand: Momos, Dal Bhat, Chiya</div></div>
                  <div className="ai-box" style={{marginTop:'.6rem'}}><div className="ai-lbl">Weekend Forecast</div><div className="ai-txt">Saturday +28%. Pre-stock chicken momo filling (+40%). Add 2 extra staff Sunday. Push table QR promotions.</div></div>
                </div>
                <div className="card">
                  <div className="card-t">📦 Inventory AI Predictions</div>
                  <div style={{background:'rgba(248,113,113,.08)',border:'1px solid rgba(248,113,113,.15)',padding:'.62rem',borderRadius:'var(--r4)',marginBottom:'.5rem'}}><div style={{fontSize:'.6rem',color:'var(--rd)',fontWeight:600,marginBottom:'.2rem'}}>⚠ Critical — Restock Now</div><div style={{fontSize:'.7rem',color:'var(--wm)'}}>Dal (Masoor): 2.3kg — runs out tomorrow 2pm</div></div>
                  <div style={{background:'rgba(251,191,36,.08)',border:'1px solid rgba(251,191,36,.15)',padding:'.62rem',borderRadius:'var(--r4)',marginBottom:'.5rem'}}><div style={{fontSize:'.6rem',color:'var(--yw)',fontWeight:600,marginBottom:'.2rem'}}>⚡ Low Stock</div><div style={{fontSize:'.7rem',color:'var(--wm)'}}>Basmati Rice: 8kg · Ghee: 1.2L · Chicken: 4kg</div></div>
                  <div style={{background:'rgba(74,222,128,.08)',border:'1px solid rgba(74,222,128,.12)',padding:'.62rem',borderRadius:'var(--r4)'}}><div style={{fontSize:'.6rem',color:'var(--grn)',fontWeight:600,marginBottom:'.2rem'}}>✓ Well Stocked</div><div style={{fontSize:'.7rem',color:'var(--wm)'}}>Vegetables, Spices, Oil — 7+ days supply</div></div>
                </div>
              </div>
            </div>
          )}

          {/* ─── FEEDBACK ─── */}
          {page === 'feedback' && (
            <div>
              <div className="pg-hd">
                <div className="pg-ht">Customer Feedback</div>
                <div style={{display:'flex',gap:'.6rem',alignItems:'center',flexWrap:'wrap'}}>
                  <div style={{display:'flex',alignItems:'center',gap:'.5rem'}}>
                    <div style={{fontFamily:"'Playfair Display',serif",fontSize:'1.4rem',fontWeight:700,color:'var(--g)'}}>4.8</div>
                    <div><div style={{color:'var(--g)',fontSize:'.78rem'}}>★★★★★</div><div style={{fontSize:'.6rem',color:'var(--wm)'}}>avg · Live from Firestore</div></div>
                  </div>
                  <ExportMenu type="feedback" rows={feedback.map(f=>({Name:f.name,Rating:f.rating,Message:f.message||f.msg||'',Date:f.date||''}))} />
                </div>
              </div>
              <div className="card">
                {feedback.length === 0
                  ? <div style={{padding:'2rem',textAlign:'center',color:'var(--wd)',fontSize:'.8rem'}}>No feedback yet. Feedback submitted on the customer site will appear here in real-time.</div>
                  : feedback.map((f, i) => (
                    <div key={i} className="fb-row">
                      <div style={{flexShrink:0}}>
                        <div style={{fontWeight:600,fontSize:'.78rem',marginBottom:'.12rem'}}>{f.name}</div>
                        <div style={{color:'var(--g)',fontSize:'.7rem'}}>{'★'.repeat(f.rating||0)}{'☆'.repeat(5-(f.rating||0))}</div>
                        <div style={{fontSize:'.58rem',color:'var(--wd)',marginTop:'.12rem'}}>{f.date||''}</div>
                      </div>
                      <div style={{flex:1,minWidth:180}}>
                        <div style={{fontSize:'.76rem',color:'var(--wm)',lineHeight:1.6}}>"{f.message||f.msg||''}"</div>
                        {f.email && <div style={{fontSize:'.6rem',color:'var(--wd)',marginTop:'.18rem'}}>{f.email}</div>}
                      </div>
                      <button className="fb-reply-btn" onClick={()=>showToast(`Reply to ${f.name}`)}>Reply</button>
                    </div>
                  ))
                }
              </div>
            </div>
          )}

          {/* ─── INVENTORY ─── */}
          {page === 'inventory' && (
            <div>
              <div className="pg-hd">
                <div className="pg-ht">Inventory</div>
                <div style={{display:'flex',gap:'.4rem',flexWrap:'wrap'}}>
                  <ExportMenu type="inventory" rows={INVENTORY.map(i=>({Item:i.name,Unit:i.unit,Stock:i.stock,'Min Level':i.min,Status:i.status}))} />
                  <button className="ab ab-o" style={{padding:'.38rem .9rem',fontSize:'.72rem'}} onClick={()=>showToast('Add item — connect to Firestore')}>+ Add Item</button>
                </div>
              </div>
              <div className="card">
                <div className="tbl-scroll">
                  <table>
                    <thead><tr><th>Item</th><th>Unit</th><th>Current Stock</th><th>Min Level</th><th>Status</th><th>Action</th></tr></thead>
                    <tbody>
                      {INVENTORY.map(item => (
                        <tr key={item.name}>
                          <td style={{fontWeight:500}}>{item.name}</td>
                          <td>{item.unit}</td>
                          <td style={{color:item.status==='critical'?'var(--rd)':item.status==='low'?'var(--yw)':'var(--grn)',fontWeight:600}}>{item.stock} {item.unit}</td>
                          <td>{item.min} {item.unit}</td>
                          <td><span className={`status-pill ${item.status==='critical'?'pill-can':item.status==='low'?'pill-prep':'pill-new'}`}>{item.status==='critical'?'Critical':item.status==='low'?'Low':'OK'}</span></td>
                          <td><button className="ab ab-o" onClick={()=>showToast(`Restock ${item.name}`)}>Restock</button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ─── TABLES & QR ─── */}
          {page === 'tables' && (
            <div>
              <div className="pg-hd">
                <div className="pg-ht">Tables & QR Codes</div>
                <span style={{fontSize:'.74rem',color:'var(--wm)'}}>Customers scan to view menu & order</span>
              </div>
              <div className="tbl-ctrl">
                <span style={{fontSize:'.78rem',color:'var(--wm)'}}>Number of Tables:</span>
                <button className="tc-btn" onClick={() => setTableCount(t => Math.max(1, t-1))}>−</button>
                <span className="tc-num">{tableCount}</span>
                <button className="tc-btn" onClick={() => setTableCount(t => Math.min(50, t+1))}>+</button>
                <button className="ab ab-o" style={{padding:'.38rem .9rem',fontSize:'.72rem'}} onClick={() => showToast(`Saved! ${tableCount} tables ✓`)}>Save</button>
              </div>
              <div className="qr-grid">
                {Array.from({length:tableCount},(_,i)=>i+1).map(t => {
                  const url = `${window.location.origin}/table?table=${t}`;
                  const statuses = ['available','available','occupied','available','occupied','available','reserved'];
                  const status = statuses[(t-1) % statuses.length];
                  return (
                    <div key={t} className={`qr-card${status==='occupied'?' occupied':''}`}>
                      <div className="qr-tnum">{t}</div>
                      <span className={`qr-status ${status==='available'?'qs-avail':status==='occupied'?'qs-occ':'qs-res'}`}>
                        {status.charAt(0).toUpperCase()+status.slice(1)}
                      </span>
                      <div className="qr-box" id={`qr-${t}`} />
                      <div className="qr-url">{url}</div>
                      <div className="qr-actions">
                        <button className="ab ab-o" onClick={() => printQR(t, url)}>🖨 Print QR</button>
                        <a href={`/table?table=${t}`} target="_blank" rel="noreferrer" className="ab ab-g" style={{textDecoration:'none'}}>Open</a>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ─── USERS ─── */}
          {page === 'users' && (
            <div>
              <div className="pg-hd">
                <div className="pg-ht">Users & Roles</div>
                <div style={{display:'flex',gap:'.4rem'}}>
                  <ExportMenu type="users" rows={[{Name:'Admin User',Email:'admin@nepalbite.com',Role:'Admin',Status:'Active'},{Name:'Ramesh Shrestha',Email:'owner@rest.com',Role:'Owner',Status:'Active'}]} />
                  <button className="ab ab-o" style={{padding:'.38rem .9rem',fontSize:'.72rem'}} onClick={()=>showToast('Add user in Firebase Console → Authentication → Users')}>+ Add User</button>
                </div>
              </div>
              <div className="card">
                <div className="tbl-scroll">
                  <table>
                    <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th>Actions</th></tr></thead>
                    <tbody>
                      {[{name:'Admin User',email:'admin@nepalbite.com',role:'Admin',status:'Active'},{name:'Ramesh Shrestha',email:'owner@rest.com',role:'Owner',status:'Active'},{name:'Sita Kumari',email:'staff@nepalbite.com',role:'Staff',status:'Active'}].map(u=>(
                        <tr key={u.email}>
                          <td style={{fontWeight:500}}>{u.name}</td>
                          <td style={{fontSize:'.68rem',color:'var(--wm)'}}>{u.email}</td>
                          <td><span className="role-badge">{u.role}</span></td>
                          <td><span className="status-pill pill-new">{u.status}</span></td>
                          <td><div className="ab-row">
                            <button className="ab ab-o" onClick={()=>showToast(`Edit ${u.name}`)}>Edit</button>
                            <button className="ab ab-r" onClick={()=>showToast('Remove user via Firebase Console')}>Remove</button>
                          </div></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ─── SETTINGS ─── */}
          {page === 'settings' && (
            <div>
              <div className="pg-ht" style={{marginBottom:'1.2rem'}}>System Settings</div>
              <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))',gap:'1rem'}}>
                <div className="card">
                  <div className="card-t">Restaurant Info</div>
                  {[['Restaurant Name','NepalBite Thamel'],['Phone','+977-01-4XXXXXX'],['Address','Thamel Marg, Kathmandu'],['PAN / VAT Number','600-123-456']].map(([l,v])=>(
                    <div key={l}><label className="mfl">{l}</label><input className="mfi" defaultValue={v}/></div>
                  ))}
                  <button className="save-btn" style={{marginTop:'.75rem'}} onClick={()=>showToast('Settings saved ✓')}>Save Changes</button>
                </div>
                <div className="card">
                  <div className="card-t">Platform Toggles</div>
                  {[['Online Ordering','Accept orders from website'],['Table QR Ordering','Enable table QR system'],['Story Moderation','Require admin approval'],['AI Chatbot (Neela)','Show chatbot to customers'],['Story Auto-Archive','Archive after 24 hours']].map(([t,d])=>(
                    <ToggleRow key={t} title={t} desc={d} defaultOn />
                  ))}
                </div>
                <div className="card">
                  <div className="card-t">🔥 Firebase Status</div>
                  <div style={{display:'flex',alignItems:'center',gap:'.6rem',padding:'.75rem',background:'rgba(74,222,128,.08)',border:'1px solid rgba(74,222,128,.2)',borderRadius:'var(--r4)',marginBottom:'.85rem'}}>
                    <span style={{width:8,height:8,borderRadius:'50%',background:'var(--grn)',flexShrink:0,display:'block'}}/>
                    <div><div style={{fontSize:'.78rem',fontWeight:600,color:'var(--grn)'}}>Connected</div><div style={{fontSize:'.65rem',color:'var(--wm)'}}>nepalbite-30c26.firebaseapp.com</div></div>
                  </div>
                  {[['Authentication','✓ Enabled'],['Firestore Database','✓ Enabled'],['Firebase Storage','✓ Enabled'],['Project ID','nepalbite-30c26']].map(([k,v])=>(
                    <div key={k} style={{display:'flex',justifyContent:'space-between',fontSize:'.74rem',color:'var(--wm)',marginBottom:'.4rem'}}><span>{k}</span><span style={{color:v.startsWith('✓')?'var(--grn)':'inherit'}}>{v}</span></div>
                  ))}
                </div>
              </div>
            </div>
          )}

        </div>
      </main>

      {/* Toast */}
      <div className={`toast${toastShow?' show':''}`}>{toast}</div>
    </div>
  );
}

function ToggleRow({ title, desc, defaultOn }) {
  const [on, setOn] = useState(defaultOn);
  return (
    <div className="tog-row">
      <div><div style={{fontSize:'.8rem',fontWeight:500}}>{title}</div><div style={{fontSize:'.64rem',color:'var(--wm)'}}>{desc}</div></div>
      <div className={`tog-track ${on?'on':'off'}`} onClick={()=>setOn(!on)}><div className="tog-thumb"/></div>
    </div>
  );
}
