// src/pages/Home.jsx
import React, { useState, useEffect, useRef } from 'react';
import { db, storage } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { MENU, CATEGORIES, FAMOUS_ITEMS } from '../data/menu';
import Navbar         from '../components/Navbar';
import CartSidebar    from '../components/CartSidebar';
import CheckoutModal  from '../components/CheckoutModal';
import Chatbot        from '../components/Chatbot';
import useCursor      from '../hooks/useCursor';
import useToast       from '../hooks/useToast';
import './Home.css';

/* ── Story data ── */
const STORIES_DATA = {
  today: [
    {id:1,name:'Sita Sharma',av:'https://randomuser.me/api/portraits/women/44.jpg',cap:'Fresh steamed momos 🥟',time:'2h ago',img:'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=400&q=80'},
    {id:2,name:'Ramesh K.',av:'https://randomuser.me/api/portraits/men/32.jpg',cap:'Thakali lunch ❤️',time:'4h ago',img:'https://images.unsplash.com/photo-1627308595229-7830a5c91f9f?w=400&q=80'},
    {id:3,name:'Pooja Rai',av:'https://randomuser.me/api/portraits/women/65.jpg',cap:'Sunday dal bhat 🙏',time:'5h ago',img:'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=400&q=80'},
    {id:4,name:'Bikash G.',av:'https://randomuser.me/api/portraits/men/55.jpg',cap:'Newari feast at Patan!',time:'6h ago',img:'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=400&q=80'},
    {id:5,name:'Anita T.',av:'https://randomuser.me/api/portraits/women/22.jpg',cap:'Chowmein lunch 🍜',time:'8h ago',img:'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=400&q=80'},
  ],
  yesterday: [
    {id:6,name:'Sunil M.',av:'https://randomuser.me/api/portraits/men/11.jpg',cap:'Late night momo run',time:'Yesterday 10pm',img:'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=400&q=80'},
    {id:7,name:'Priya S.',av:'https://randomuser.me/api/portraits/women/33.jpg',cap:'Birthday rooftop dinner 🎂',time:'Yesterday 7pm',img:'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&q=80'},
  ],
  twodaysago: [
    {id:8,name:'Meera J.',av:'https://randomuser.me/api/portraits/women/12.jpg',cap:'Sel roti morning 🌅',time:'2 days ago',img:'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&q=80'},
  ],
};

const today = new Date();
const GALLERY_BASE = {
  today:[
    {img:'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=400&q=80',name:'Chicken Momos',by:'@sita_eats',time:'3h ago'},
    {img:'https://images.unsplash.com/photo-1627308595229-7830a5c91f9f?w=400&q=80',name:'Thakali Thali',by:'@ramesh_k',time:'5h ago'},
    {img:'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=400&q=80',name:'Newari Bara',by:'@pooja_r',time:'6h ago'},
    {img:'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=400&q=80',name:'Chowmein',by:'@bikash_g',time:'7h ago'},
    {img:'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=400&q=80',name:'Dal Bhat',by:'@anita_t',time:'9h ago'},
  ],
};
for (let i=1;i<=6;i++){
  const d=new Date(today); d.setDate(d.getDate()-i);
  const k=d.toISOString().split('T')[0];
  GALLERY_BASE[k]=[
    {img:'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=400&q=80',name:'Dal Bhat',by:`@user${i}a`,time:`${i}d ago`},
    {img:'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=400&q=80',name:'Momos',by:`@user${i}b`,time:`${i}d ago`},
    {img:'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=400&q=80',name:'Newari',by:`@user${i}c`,time:`${i}d ago`},
  ];
}

function fmtDate(d) { return d.toLocaleDateString('en-NP',{month:'short',day:'numeric'}); }
const yest = new Date(today); yest.setDate(today.getDate()-1);
const y2   = new Date(today); y2.setDate(today.getDate()-2);

const TAG_CLS  = t => t==='veg'?'badge-veg':t==='spicy'?'badge-spicy':t==='sweet'?'badge-sweet':'badge-pop';
const TAG_LABEL = t => t==='veg'?'🌱 Veg':t==='spicy'?'🌶 Spicy':t==='sweet'?'🍬 Sweet':'⭐ Popular';

export default function Home() {
  useCursor();
  const { showToast, ToastEl } = useToast();
  const { addToCart }          = useCart();
  const { user }               = useAuth();

  /* Checkout */
  const [ckOpen, setCkOpen] = useState(false);

  /* Menu filter */
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQ, setSearchQ]               = useState('');

  /* Stories */
  const [storyKey, setStoryKey]           = useState('today');
  const [storyOpen, setStoryOpen]         = useState(false);
  const [storyIdx, setStoryIdx]           = useState(0);
  const [storyList, setStoryList]         = useState([]);
  const storyTimer                        = useRef(null);

  /* Gallery */
  const [galKey, setGalKey]   = useState('today');
  const [gallery, setGallery] = useState([...GALLERY_BASE.today]);

  /* Upload modal */
  const [upOpen, setUpOpen]   = useState(false);
  const [upCap, setUpCap]     = useState('');
  const [upName, setUpName]   = useState('');
  const [upPreview, setUpPreview] = useState(null);
  const [upFile, setUpFile]   = useState(null);
  const fileRef               = useRef(null);

  /* Feedback */
  const [rating, setRating]   = useState(0);
  const [fbName, setFbName]   = useState('');
  const [fbEmail, setFbEmail] = useState('');
  const [fbMsg, setFbMsg]     = useState('');

  /* Reveal observer */
  useEffect(() => {
    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
    }, { threshold: 0.06 });
    document.querySelectorAll('.reveal').forEach(el => obs.observe(el));
    return () => obs.disconnect();
  }, []);

  /* Keyboard shortcuts */
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') {
        setStoryOpen(false); setUpOpen(false); setCkOpen(false);
        clearTimeout(storyTimer.current);
      }
      if (storyOpen) {
        if (e.key === 'ArrowRight') nextStory();
        if (e.key === 'ArrowLeft')  prevStory();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  /* ── Filtered menu ── */
  const filteredMenu = MENU.filter(m => {
    const matchCat = activeCategory === 'All' || m.cat === activeCategory;
    const q = searchQ.toLowerCase();
    const matchQ = !q || m.name.toLowerCase().includes(q) || m.cat.toLowerCase().includes(q) || m.desc.toLowerCase().includes(q);
    return matchCat && matchQ;
  });

  const handleSearch = () => {
    document.getElementById('menu')?.scrollIntoView({ behavior: 'smooth' });
  };

  const jumpFilter = (cat) => {
    setActiveCategory(cat);
    setSearchQ('');
    setTimeout(() => document.getElementById('menu')?.scrollIntoView({ behavior: 'smooth' }), 100);
  };

  const handleAddToCart = (item) => {
    addToCart(item);
    showToast(`${item.name} added to cart 🛒`);
  };

  /* ── Stories ── */
  const openStory = (idx, key) => {
    setStoryList(STORIES_DATA[key] || []);
    setStoryIdx(idx);
    setStoryOpen(true);
    startStoryTimer(STORIES_DATA[key], idx);
  };
  const startStoryTimer = (list, idx) => {
    clearTimeout(storyTimer.current);
    storyTimer.current = setTimeout(() => {
      if (idx < list.length - 1) {
        setStoryIdx(i => i + 1);
        startStoryTimer(list, idx + 1);
      } else {
        setStoryOpen(false);
      }
    }, 5000);
  };
  const prevStory = () => { clearTimeout(storyTimer.current); if (storyIdx > 0) { setStoryIdx(i => i-1); startStoryTimer(storyList, storyIdx-1); } };
  const nextStory = () => { clearTimeout(storyTimer.current); if (storyIdx < storyList.length-1) { setStoryIdx(i => i+1); startStoryTimer(storyList, storyIdx+1); } else setStoryOpen(false); };
  const closeStory = () => { clearTimeout(storyTimer.current); setStoryOpen(false); };

  /* ── Gallery ── */
  const loadGal = (key) => { setGalKey(key); setGallery([...(GALLERY_BASE[key] || [])]); };
  const dateChips = [
    { key: 'today', label: 'Today', sub: today.toLocaleDateString('en',{weekday:'short'}), cnt: GALLERY_BASE.today.length },
    ...[1,2,3,4,5,6].map(i => {
      const d = new Date(today); d.setDate(d.getDate()-i);
      const k = d.toISOString().split('T')[0];
      return { key: k, label: String(d.getDate()), sub: d.toLocaleDateString('en',{month:'short',weekday:'short'}).split(', ')[0], cnt: (GALLERY_BASE[k]||[]).length + Math.floor(Math.random()*5)+1 };
    }),
  ];

  /* ── Upload story ── */
  const handleFileChange = (e) => {
    const file = e.target.files[0]; if (!file) return;
    if (file.size > 10*1024*1024) { showToast('File too large. Max 10MB.'); return; }
    setUpFile(file);
    const reader = new FileReader();
    reader.onload = ev => setUpPreview(ev.target.result);
    reader.readAsDataURL(file);
  };
  const handleUpload = async () => {
    if (!upCap) { showToast('Please add a caption ✍️'); return; }
    const name = upName || user?.displayName || 'Anonymous';
    let imgSrc = 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=400&q=80';
    if (upFile && user) {
      try {
        const storageRef = ref(storage, `stories/${user.uid}/${Date.now()}_${upFile.name}`);
        const snap = await uploadBytes(storageRef, upFile);
        imgSrc = await getDownloadURL(snap.ref);
      } catch (e) { console.warn('Upload failed, using placeholder'); }
    }
    try {
      await addDoc(collection(db, 'stories'), {
        userName: name, userId: user?.uid || 'anonymous',
        caption: upCap, imageUrl: imgSrc,
        expiresAt: new Date(Date.now() + 24*60*60*1000),
        approved: false, createdAt: serverTimestamp(),
      });
    } catch (e) { console.warn('Story save failed'); }
    const newStory = { id: Date.now(), name, av: 'https://randomuser.me/api/portraits/lego/1.jpg', cap: upCap, time: 'Just now', img: imgSrc };
    STORIES_DATA.today.unshift(newStory);
    GALLERY_BASE.today.unshift({ img: imgSrc, name: upCap, by: '@'+name.split(' ')[0].toLowerCase(), time: 'Just now' });
    if (galKey === 'today') setGallery([...GALLERY_BASE.today]);
    setUpOpen(false); setUpCap(''); setUpName(''); setUpPreview(null); setUpFile(null);
    showToast('Story posted! Pending admin approval ✨');
  };

  /* ── Feedback ── */
  const submitFeedback = async () => {
    if (!fbName) { showToast('Please enter your name'); return; }
    if (!rating)  { showToast('Please select a rating ⭐'); return; }
    if (!fbMsg)   { showToast('Please write a message'); return; }
    try {
      await addDoc(collection(db, 'feedback'), {
        name: fbName, email: fbEmail, message: fbMsg, rating,
        userId: user?.uid || 'guest', createdAt: serverTimestamp(),
      });
      showToast(`Thank you ${fbName}! Feedback saved 🙏`);
    } catch (e) { showToast(`Thank you ${fbName}! 🙏`); }
    setFbName(''); setFbEmail(''); setFbMsg(''); setRating(0);
  };

  const curStory = storyList[storyIdx];

  return (
    <>
      {/* Cursor dots — shown only on PC by CSS + JS in useCursor */}
      <div className="custom-cursor" />
      <div className="custom-cursor-ring" />

      <Navbar />

      {/* ── HERO ── */}
      <section className="hero" id="home">
        <div className="hero-bg" />
        <div className="hero-c">
          <div className="hero-pill">🇳🇵 Authentic Nepali Flavours · Kathmandu</div>
          <h1>Taste <em>Nepal</em><br/>At Its Best</h1>
          <p className="hero-sub">Order from Nepal's finest restaurants, explore rich culinary heritage, and share your food stories.</p>
          <div className="hero-search">
            <input
              type="text" value={searchQ} placeholder="Search momos, dal bhat, thukpa…"
              onChange={e => setSearchQ(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleSearch(); }}
            />
            <button onClick={handleSearch}>Find Food</button>
          </div>
          <div className="hero-tags">
            {['Dal Bhat','Momos','Newari','Street Food','Sweets','Drinks'].map(c => (
              <span key={c} className="hero-tag" onClick={() => jumpFilter(c)}>
                {c === 'Dal Bhat' ? '🍛' : c === 'Momos' ? '🥟' : c === 'Newari' ? '🎋' : c === 'Street Food' ? '🌶' : c === 'Sweets' ? '🍰' : '☕'} {c}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── STORIES ── */}
      <section className="stories-section" id="stories">
        <div className="stories-hd">
          <div className="stories-label">Today's Stories · {fmtDate(today)}</div>
          <div className="stories-pills">
            <button className={`dpill${storyKey==='today'?' on':''}`} onClick={() => setStoryKey('today')}>Today</button>
            <button className={`dpill${storyKey==='yesterday'?' on':''}`} onClick={() => setStoryKey('yesterday')}>{fmtDate(yest)}</button>
            <button className={`dpill${storyKey==='twodaysago'?' on':''}`} onClick={() => setStoryKey('twodaysago')}>{fmtDate(y2)}</button>
          </div>
        </div>
        <div className="stories-scroll">
          <div className="stories-track">
            <div className="story-item" onClick={() => { if (!user) { showToast('Please sign in to share a story'); } else setUpOpen(true); }}>
              <div className="story-ring" style={{background:'rgba(201,151,58,.2)'}}>
                <div className="story-add">📷</div>
              </div>
              <div className="story-name">Your Story</div>
              <div className="story-time">Tap to add</div>
            </div>
            {(STORIES_DATA[storyKey] || []).map((s, i) => (
              <div key={s.id} className="story-item" onClick={() => openStory(i, storyKey)}>
                <div className="story-ring">
                  <div className="story-inner"><img src={s.av} alt={s.name} loading="lazy"/></div>
                </div>
                <div className="story-name">{s.name.split(' ')[0]}</div>
                <div className="story-time">{s.time}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Story viewer */}
      {storyOpen && curStory && (
        <div className="story-viewer" onClick={closeStory}>
          <div className="story-frame" onClick={e => e.stopPropagation()}>
            <div className="story-progress">
              {storyList.map((_,i) => (
                <div key={i} className="spb"><div className={`spf${i<storyIdx?' done':i===storyIdx?' run':''}`}/></div>
              ))}
            </div>
            <button className="story-x" onClick={closeStory}>✕</button>
            <button className="story-prev" onClick={prevStory}>‹</button>
            <button className="story-next" onClick={nextStory}>›</button>
            <img className="story-img" src={curStory.img} alt={curStory.cap}/>
            <div className="story-info">
              <div className="story-author">
                <div className="story-av-wrap"><img src={curStory.av} alt=""/></div>
                <div><div className="story-uname">{curStory.name}</div><div className="story-utime">{curStory.time}</div></div>
              </div>
              <div className="story-cap">{curStory.cap}</div>
            </div>
          </div>
        </div>
      )}

      {/* ── FAMOUS / SIGNATURE DISHES ── */}
      <section className="sec bg1 bt" id="famous">
        <div className="ctr">
          <div className="reveal" style={{textAlign:'center',marginBottom:'.5rem'}}>
            <div className="eye">Signature Selection</div>
            <h2 className="sec-t">Famous Dishes at <em>NepalBite</em></h2>
            <p className="sec-sub">Our most-loved plates — each a story of Nepal's culinary soul.</p>
          </div>
          <div className="fam-grid reveal d1">
            {FAMOUS_ITEMS.map(f => (
              <div key={f.id} className="fam-card">
                <img className="fam-img" src={f.img} alt={f.name} loading="lazy"/>
                <div className="fam-badge">★ Signature</div>
                <div className="fam-body">
                  <div className="fam-nep">{f.nep}</div>
                  <div className="fam-name">{f.name}</div>
                  <div className="fam-tags">
                    {f.tags.map(t => <span key={t} className={`badge ${TAG_CLS(t)}`}>{TAG_LABEL(t)}</span>)}
                  </div>
                  <div className="fam-desc">{f.famDesc}</div>
                  <div className="fam-foot">
                    <div className="fam-price">₨{f.price}</div>
                    <button className="add-btn" onClick={() => handleAddToCart(f)}>+</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FULL MENU ── */}
      <section className="sec" id="menu">
        <div className="ctr">
          <div className="reveal">
            <div className="eye">Our Full Menu</div>
            <h2 className="sec-t">Every Flavour of <em>Nepal</em></h2>
          </div>
          <div className="menu-filters reveal d1">
            {CATEGORIES.map(c => (
              <button key={c} className={`mfbtn${activeCategory===c?' on':''}`} onClick={() => setActiveCategory(c)}>{c}</button>
            ))}
          </div>
          <div className="menu-grid reveal d2">
            {filteredMenu.map(item => (
              <div key={item.id} className="menu-card">
                <img className="menu-img" src={item.img} alt={item.name} loading="lazy"/>
                <div className="menu-body">
                  <div className="menu-cat">{item.cat}</div>
                  <div className="menu-name">{item.name} <span className="menu-nep">{item.nep}</span></div>
                  <div className="menu-badges">
                    {item.tags.map(t => <span key={t} className={`badge ${TAG_CLS(t)}`}>{TAG_LABEL(t)}</span>)}
                  </div>
                  <div className="menu-desc">{item.desc}</div>
                  <div className="menu-foot">
                    <div className="menu-price">₨{item.price} <span>/ serving</span></div>
                    <button className="add-btn" onClick={() => handleAddToCart(item)}>+</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── GALLERY ── */}
      <section className="sec bg1 bt" id="gallery">
        <div className="ctr">
          <div className="gal-hd reveal">
            <div>
              <div className="eye">Customer Stories Gallery</div>
              <h2 className="sec-t">Moments from <em>Our Community</em></h2>
              <p className="gal-sub">Stories expire after 24 hours · Browse archive by date</p>
            </div>
            <button className="btn-gold" onClick={() => setUpOpen(true)}>+ Share Story</button>
          </div>
          <div className="date-selector reveal d1">
            {dateChips.map(dc => (
              <button key={dc.key} className={`date-chip${galKey===dc.key?' on':''}`} onClick={() => loadGal(dc.key)}>
                <div className="dc-num">{dc.label}</div>
                <div className="dc-day">{dc.sub}</div>
                <div className="dc-cnt">{dc.cnt} stories</div>
              </button>
            ))}
          </div>
          <div className="gal-grid reveal d2">
            <div className="gal-upload" onClick={() => setUpOpen(true)}>
              <div className="gup-icon">📷</div>
              <div className="gup-txt">Share your story<br/><span>Visible 24 hours</span></div>
            </div>
            {gallery.map((g,i) => (
              <div key={i} className="gal-item">
                <img src={g.img} alt={g.name} loading="lazy"/>
                <div className="gal-ov"/>
                <div className="gal-info"><div className="gal-name">{g.name}</div><div className="gal-meta">{g.by} · {g.time}</div></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section className="sec" id="testimonials">
        <div className="ctr">
          <div className="reveal" style={{textAlign:'center'}}>
            <div className="eye">What People Say</div>
            <h2 className="sec-t">Loved by <em>Thousands</em></h2>
          </div>
          <div className="testi-grid">
            {[
              {stars:5,text:'"The best dal bhat I\'ve had outside my mum\'s kitchen. Fast delivery, still hot!"',name:'Priya Maharjan',role:'Regular Customer, Lalitpur'},
              {stars:5,text:'"Live stories before ordering shows the food is fresh. Gallery archive is so unique!"',name:'Sujan Thapa',role:'Food Enthusiast, Kathmandu'},
              {stars:5,text:'"Finding real Newari food was a challenge. NepalBite changed that. Yomari delivered!"',name:'Aarati Shrestha',role:'Customer, Bhaktapur'},
            ].map((t,i) => (
              <div key={i} className="testi-card reveal" style={{transitionDelay:`${i*.1}s`}}>
                <div className="testi-stars">{'★'.repeat(t.stars)}</div>
                <div className="testi-text">{t.text}</div>
                <div className="testi-author">
                  <div className="testi-av">{t.name[0]}</div>
                  <div><div className="testi-name">{t.name}</div><div className="testi-role">{t.role}</div></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── ABOUT ── */}
      <section className="sec bg1 bt" id="about">
        <div className="ctr">
          <div className="about-grid">
            <div className="about-text reveal">
              <div><div className="eye">Our Story</div><h2 className="sec-t">Food is <em>Culture.</em><br/>We Protect Both.</h2></div>
              <p className="about-p">Born in the lanes of Thamel, NepalBite was founded by food-lovers who believed Nepal's extraordinary culinary heritage deserved a modern digital home.</p>
              <p className="about-p">From grandmothers' secret recipes in Patan courtyards to cloud kitchens in New Baneshwor — we connect every corner of Nepal's food culture with people who love to eat.</p>
              <div className="values-grid">
                {[['🇳🇵','Made in Nepal','100% local team, built for Nepal\'s unique food culture.'],['🌱','Fresh Always','We verify freshness for every partner restaurant.'],['⚡','Fast Delivery','Average 28 minutes across Kathmandu Valley.'],['❤️','Community First','Supporting local restaurants, farmers, livelihoods.']].map(([ic,t,d]) => (
                  <div key={t} className="value-card"><div className="value-icon">{ic}</div><div className="value-title">{t}</div><div className="value-desc">{d}</div></div>
                ))}
              </div>
            </div>
            <div className="about-imgs reveal d2">
              <div className="aimg"><img src="https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=500&q=80" alt="Nepali food" loading="lazy"/></div>
              <div className="aimg"><img src="https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=500&q=80" alt="Restaurant" loading="lazy"/></div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CONTACT + FEEDBACK ── */}
      <section className="sec" id="contact">
        <div className="ctr">
          <div className="reveal" style={{textAlign:'center',marginBottom:'2.5rem'}}>
            <div className="eye">Get In Touch</div>
            <h2 className="sec-t">We're Always <em>Here</em></h2>
          </div>
          <div className="contact-grid">
            <div className="contact-left reveal">
              {[['📍','Location','Thamel Marg, Kathmandu · Nepal 44600'],['📞','Phone','+977-01-4XXXXXX · +977-9800000000'],['✉️','Email','hello@nepalbite.com'],['🕐','Hours','Open 7 days · 10 AM – 10 PM NST']].map(([ic,lb,val]) => (
                <div key={lb} className="contact-item">
                  <div className="c-icon">{ic}</div>
                  <div><div className="c-label">{lb}</div><div className="c-value">{val}</div></div>
                </div>
              ))}
              <div className="map-ph">📍 Thamel, Kathmandu — Google Maps</div>
            </div>
            <div className="reveal d1">
              <div className="fb-box">
                <h3 className="fb-title">Your <span>Feedback</span></h3>
                <p className="fb-sub">Rate your experience and help us improve</p>
                <div className="star-row">
                  {[1,2,3,4,5].map(n => (
                    <span key={n} className={`star${rating>=n?' lit':''}`} onClick={() => setRating(n)}>★</span>
                  ))}
                </div>
                <label className="fb-label">Your Name</label>
                <input className="form-input" type="text" placeholder="Ramesh Shrestha" value={fbName} onChange={e => setFbName(e.target.value)}/>
                <label className="fb-label" style={{marginTop:'.5rem'}}>Email (optional)</label>
                <input className="form-input" type="email" placeholder="you@example.com" value={fbEmail} onChange={e => setFbEmail(e.target.value)}/>
                <label className="fb-label" style={{marginTop:'.5rem'}}>Your Message</label>
                <textarea className="form-input fb-textarea" placeholder="Tell us about your experience…" value={fbMsg} onChange={e => setFbMsg(e.target.value)}/>
                <button className="btn-gold" style={{width:'100%',marginTop:'.75rem',padding:'.78rem'}} onClick={submitFeedback}>Send Feedback →</button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer>
        <div className="ctr">
          <div className="footer-grid">
            <div>
              <div className="footer-logo">Nepal<span>Bite</span></div>
              <div className="footer-desc">Nepal's favourite food-tech platform — connecting authentic restaurants with hungry customers since 2022.</div>
              <div className="footer-socials">
                {['f','in','ig','yt'].map(s => <div key={s} className="social">{s}</div>)}
              </div>
            </div>
            <div>
              <div className="footer-col-title">Discover</div>
              <ul className="footer-links">
                <li><a href="#famous">Signature Dishes</a></li>
                <li><a href="#menu">Browse Menu</a></li>
                <li><a href="#gallery">Stories Gallery</a></li>
                <li><a href="#about">About Us</a></li>
              </ul>
            </div>
            <div>
              <div className="footer-col-title">Support</div>
              <ul className="footer-links">
                <li><a href="#contact">Contact Us</a></li>
                <li><a href="#contact">Leave Feedback</a></li>
                <li><a href="/admin">Admin Login</a></li>
              </ul>
            </div>
            <div>
              <div className="footer-col-title">For Restaurants</div>
              <ul className="footer-links">
                <li><a href="/admin">Admin Panel</a></li>
                <li><a href="/table">Table QR Menu</a></li>
                <li><a href="#contact">Partner With Us</a></li>
              </ul>
            </div>
          </div>
          <div className="footer-bottom">
            <span>© 2025 NepalBite Technology Pvt. Ltd. · Kathmandu, Nepal</span>
            <span>Made with ❤️ in Kathmandu</span>
          </div>
        </div>
      </footer>

      {/* ── Upload Story Modal ── */}
      {upOpen && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setUpOpen(false)}>
          <div className="up-box">
            <button className="up-close" onClick={() => setUpOpen(false)}>✕</button>
            <h3>Share Your Story</h3>
            <p>Your photo will be visible for <strong>24 hours</strong>, then auto-archived.</p>
            {!upPreview ? (
              <div className="drop-zone" onClick={() => fileRef.current?.click()}>
                <div>📷</div>
                <div>Tap to choose a photo</div>
                <div className="drop-note">JPG · PNG · Max 10MB</div>
              </div>
            ) : (
              <img className="up-preview" src={upPreview} alt="preview"/>
            )}
            <input ref={fileRef} type="file" accept="image/*" style={{display:'none'}} onChange={handleFileChange}/>
            <label className="fb-label">Caption</label>
            <input className="form-input" type="text" placeholder="What are you eating? 🍛" value={upCap} onChange={e => setUpCap(e.target.value)}/>
            <label className="fb-label" style={{marginTop:'.5rem'}}>Your Name</label>
            <input className="form-input" type="text" placeholder="Your name" value={upName} onChange={e => setUpName(e.target.value)}/>
            <button className="btn-gold" style={{width:'100%',marginTop:'.85rem',padding:'.78rem'}} onClick={handleUpload}>Post Story →</button>
          </div>
        </div>
      )}

      <CartSidebar onCheckout={() => setCkOpen(true)} />
      {ckOpen && <CheckoutModal onClose={() => setCkOpen(false)} />}
      <Chatbot />
      {ToastEl}
    </>
  );
}
