// src/pages/Table.jsx
// NepalBite Table QR Ordering
// URL: /table?table=3  → Customer scans QR on Table 3, orders directly

import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { MENU, CATEGORIES } from '../data/menu';
import useCursor from '../hooks/useCursor';
import useToast  from '../hooks/useToast';
import './Table.css';

const TAG_CLS   = t => t==='veg'?'badge-veg':t==='spicy'?'badge-spicy':t==='sweet'?'badge-sweet':'badge-pop';
const TAG_LABEL = t => t==='veg'?'🌱':t==='spicy'?'🌶':t==='sweet'?'🍬':'⭐';

const PAYMENT_METHODS = [
  { id:'esewa',      icon:'🟢', name:'eSewa' },
  { id:'khalti',     icon:'💜', name:'Khalti' },
  { id:'fonepay',    icon:'📱', name:'Fonepay' },
  { id:'connectips', icon:'🏦', name:'ConnectIPS' },
  { id:'card',       icon:'💳', name:'Card' },
  { id:'cash',       icon:'💵', name:'Cash' },
];

export default function Table() {
  useCursor();
  const { showToast, ToastEl } = useToast();

  // Get table number from URL: /table?table=5
  const params  = new URLSearchParams(window.location.search);
  const tableNo = params.get('table') || '1';

  const [cart,       setCart]       = useState([]);
  const [activeFilter, setFilter]   = useState('All');
  const [cartOpen,   setCartOpen]   = useState(false);
  const [custName,   setCustName]   = useState('');
  const [payMethod,  setPayMethod]  = useState('cash');
  const [placing,    setPlacing]    = useState(false);
  const [success,    setSuccess]    = useState(false);
  const [lastOrder,  setLastOrder]  = useState(null);

  // Set page title
  useEffect(() => { document.title = `NepalBite — Table ${tableNo}`; }, [tableNo]);

  // Scroll lock when cart open
  useEffect(() => {
    document.body.style.overflow = cartOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [cartOpen]);

  const addToCart = (item) => {
    setCart(prev => {
      const ex = prev.find(c => c.id === item.id);
      if (ex) return prev.map(c => c.id === item.id ? {...c, qty: c.qty+1} : c);
      return [...prev, {...item, qty:1}];
    });
    showToast(`${item.name} added 🛒`);
  };

  const changeQty = (id, delta) => {
    setCart(prev => prev.map(c => c.id===id ? {...c, qty:c.qty+delta} : c).filter(c => c.qty > 0));
  };

  const subtotal   = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const vat        = Math.round(subtotal * 0.13);
  const grandTotal = subtotal + vat;
  const totalQty   = cart.reduce((s, i) => s + i.qty, 0);

  const placeOrder = async () => {
    if (!custName.trim()) { showToast('Please enter your name'); return; }
    if (!cart.length)     { showToast('Your cart is empty'); return; }
    setPlacing(true);

    const orderNum = `NB-T${tableNo}-${Math.random().toString(36).toUpperCase().slice(2,7)}`;
    const orderData = {
      orderNumber: orderNum,
      tableNo,
      type:        'dine-in',
      customerName: custName,
      items: cart.map(i => ({ id:i.id, name:i.name, qty:i.qty, price:i.price, subtotal:i.price*i.qty })),
      subtotal, vat, delivery: 0, total: grandTotal,
      paymentMethod: payMethod,
      status: 'pending',
      createdAt: serverTimestamp(),
    };

    try {
      await addDoc(collection(db, 'orders'), orderData);
    } catch (e) { console.warn('Order save failed:', e); }

    setLastOrder({ ...orderData, orderNumber: orderNum });
    setSuccess(true);
    setCart([]);
    setCartOpen(false);
    setPlacing(false);
  };

  const printBill = () => {
    if (!lastOrder) return;
    const o = lastOrder;
    const w = window.open('', '_blank');
    w.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"/>
<title>NepalBite Table ${tableNo} Bill</title>
<style>
body{font-family:sans-serif;max-width:380px;margin:0 auto;padding:1.5rem;color:#111;font-size:13px}
.logo{font-family:Georgia,serif;font-size:1.4rem;font-weight:900;text-align:center}.logo span{color:#C9973A}
.head{text-align:center;border-bottom:2px dashed #ccc;padding-bottom:.75rem;margin-bottom:.75rem}
.head p{font-size:.75rem;color:#555;margin:.15rem 0}
.table-badge{display:inline-block;background:#f5f0e0;border:1px solid #C9973A;padding:.2rem .75rem;font-size:.85rem;font-weight:700;color:#C9973A;border-radius:3px;margin:.4rem 0}
table{width:100%;border-collapse:collapse;margin:.75rem 0}
th{font-size:.7rem;text-align:left;padding:.35rem 0;border-bottom:1px solid #ddd;color:#555;text-transform:uppercase}
td{padding:.35rem 0;border-bottom:1px solid #f0f0f0;font-size:.8rem}td:last-child{text-align:right;font-weight:500}
.tr{display:flex;justify-content:space-between;font-size:.8rem;margin:.25rem 0}
.grand{font-weight:700;font-size:.95rem;margin-top:.5rem;border-top:1px solid #ddd;padding-top:.35rem}
.grand span:last-child{color:#C9973A}
.foot{text-align:center;margin-top:1.25rem;font-size:.7rem;color:#888;border-top:1px dashed #ccc;padding-top:.75rem}
.pbadge{display:inline-block;background:#f5f0e0;border:1px solid #C9973A;border-radius:3px;padding:.2rem .6rem;font-size:.7rem;font-weight:600;color:#C9973A}
button{display:block;width:100%;margin-top:1rem;padding:.75rem;background:#C9973A;color:#0A0A08;border:none;border-radius:4px;font-weight:700;cursor:pointer}
@media print{button{display:none}}
</style></head><body>
<div class="logo">Nepal<span>Bite</span></div>
<div class="head">
  <p>Thamel Marg, Kathmandu · Nepal</p>
  <p>+977-01-4XXXXXX · hello@nepalbite.com · PAN: 600-123-456</p>
  <div class="table-badge">TABLE ${tableNo}</div>
</div>
<div style="font-size:.75rem;margin-bottom:.5rem">
  <strong>Order:</strong> #${o.orderNumber}<br>
  <strong>Date:</strong> ${new Date().toLocaleDateString('en-NP',{dateStyle:'full'})}<br>
  <strong>Time:</strong> ${new Date().toLocaleTimeString('en-NP',{timeStyle:'short'})}<br>
  <strong>Customer:</strong> ${o.customerName}
</div>
<table><thead><tr><th>Item</th><th>Qty</th><th>Amount</th></tr></thead>
<tbody>${o.items.map(i=>`<tr><td>${i.name}</td><td>${i.qty}</td><td>₨${i.subtotal.toLocaleString()}</td></tr>`).join('')}</tbody>
</table>
<div style="border-top:2px dashed #ccc;padding-top:.75rem;margin-top:.75rem">
<div class="tr"><span>Subtotal</span><span>₨${o.subtotal.toLocaleString()}</span></div>
<div class="tr"><span>VAT (13%)</span><span>₨${o.vat.toLocaleString()}</span></div>
<div class="tr grand"><span>Total</span><span>₨${o.total.toLocaleString()}</span></div>
</div>
<div style="text-align:center;margin-top:.75rem"><span class="pbadge">${o.paymentMethod.toUpperCase()}</span></div>
<div class="foot"><p>धन्यवाद! Thank you for dining with NepalBite 🙏</p><p>www.nepalbite.com</p></div>
<button onclick="window.print()">🖨 Print / Save as PDF</button>
</body></html>`);
    w.document.close();
  };

  const newOrder = () => {
    setSuccess(false);
    setLastOrder(null);
    setCustName('');
    setPayMethod('cash');
  };

  const filteredMenu = activeFilter === 'All' ? MENU : MENU.filter(m => m.cat === activeFilter);

  // Group menu by category for display
  const grouped = {};
  filteredMenu.forEach(item => {
    if (!grouped[item.cat]) grouped[item.cat] = [];
    grouped[item.cat].push(item);
  });

  return (
    <>
      {/* Custom cursor dots */}
      <div className="custom-cursor" />
      <div className="custom-cursor-ring" />

      {/* HEADER */}
      <header className="table-header">
        <div className="table-logo">Nepal<span>Bite</span></div>
        <div className="table-badge-pill">📍 Table {tableNo}</div>
        <button className="table-cart-btn" onClick={() => setCartOpen(true)}>
          🛒 Cart
          {totalQty > 0 && <span className="table-cart-count">{totalQty}</span>}
        </button>
      </header>

      {/* WELCOME */}
      <div className="table-welcome">
        <h1>Welcome to <em>NepalBite</em></h1>
        <p>Browse our menu and order directly from Table {tableNo} — no waiting!</p>
        <div className="table-scan-info">📱 Scan · Select · Order · Done</div>
      </div>

      {/* CATEGORY FILTERS */}
      <div className="table-filters">
        {['All', ...CATEGORIES.filter(c => c !== 'All')].map(cat => (
          <button
            key={cat}
            className={`table-filter-btn${activeFilter === cat ? ' active' : ''}`}
            onClick={() => setFilter(cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* MENU */}
      <div className="table-menu-container">
        {Object.entries(grouped).map(([cat, items]) => (
          <div key={cat}>
            <div className="table-cat-title">{cat}</div>
            <div className="table-menu-grid">
              {items.map(item => {
                const inCart = cart.find(c => c.id === item.id);
                return (
                  <div key={item.id} className="table-menu-item">
                    <div className="tmi-img">
                      <img src={item.img} alt={item.name} loading="lazy"/>
                    </div>
                    <div className="tmi-info">
                      <div className="tmi-name">{item.name}</div>
                      <div className="tmi-nep">{item.nep}</div>
                      <div className="tmi-desc">{item.desc}</div>
                      <div className="tmi-tags">
                        {item.tags.map(t => (
                          <span key={t} className={`badge ${TAG_CLS(t)}`}>{TAG_LABEL(t)} {t.charAt(0).toUpperCase()+t.slice(1)}</span>
                        ))}
                      </div>
                      <div className="tmi-foot">
                        <span className="tmi-price">₨{item.price}</span>
                        {inCart ? (
                          <div className="tmi-qty-ctrl">
                            <button className="qty-btn" onClick={() => changeQty(item.id, -1)}>−</button>
                            <span className="qty-num">{inCart.qty}</span>
                            <button className="qty-btn" onClick={() => changeQty(item.id,  1)}>+</button>
                          </div>
                        ) : (
                          <button className="tmi-add-btn" onClick={() => addToCart(item)}>+</button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* CART SIDEBAR */}
      {cartOpen && <div className="overlay" onClick={() => setCartOpen(false)} />}
      <div className={`table-cart-sidebar${cartOpen ? ' open' : ''}`}>
        <div className="cart-head">
          <div>
            <div className="cart-title">Your Order</div>
            <span className="cart-table-tag">Table {tableNo}</span>
          </div>
          <button className="cart-close-btn" onClick={() => setCartOpen(false)}>✕</button>
        </div>

        <div className="cart-body">
          {cart.length === 0 ? (
            <div className="cart-empty">
              <div className="cart-empty-icon">🍽</div>
              <div className="cart-empty-title">No items yet</div>
              <div className="cart-empty-sub">Browse the menu and add items</div>
            </div>
          ) : (
            cart.map(item => (
              <div key={item.id} className="cart-item">
                <div className="cart-item-img">
                  <img src={item.img} alt={item.name} loading="lazy"/>
                </div>
                <div className="cart-item-info">
                  <div className="cart-item-name">{item.name}</div>
                  <div className="cart-item-price">₨{(item.price*item.qty).toLocaleString()}</div>
                  <div className="cart-item-qty">
                    <button className="qty-btn" onClick={() => changeQty(item.id, -1)}>−</button>
                    <span className="qty-num">{item.qty}</span>
                    <button className="qty-btn" onClick={() => changeQty(item.id,  1)}>+</button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {cart.length > 0 && (
          <div className="cart-footer">
            <div className="cart-tot-row"><span>Subtotal</span><span>₨{subtotal.toLocaleString()}</span></div>
            <div className="cart-tot-row"><span>VAT (13%)</span><span>₨{vat.toLocaleString()}</span></div>
            <div className="cart-grand-row">
              <span className="grand-lbl">Total</span>
              <span className="grand-val">₨{grandTotal.toLocaleString()}</span>
            </div>

            <label className="cart-field-label">Your Name</label>
            <input
              className="form-input"
              type="text"
              placeholder="Ramesh Shrestha"
              value={custName}
              onChange={e => setCustName(e.target.value)}
            />

            <label className="cart-field-label">Payment Method</label>
            <div className="pay-mini-grid">
              {PAYMENT_METHODS.map(pm => (
                <button
                  key={pm.id}
                  className={`pay-mini${payMethod === pm.id ? ' sel' : ''}`}
                  onClick={() => setPayMethod(pm.id)}
                >
                  <span>{pm.icon}</span>
                  <span>{pm.name}</span>
                </button>
              ))}
            </div>

            <button className="cart-place-btn" onClick={placeOrder} disabled={placing}>
              {placing ? 'Placing…' : 'Place Order 🍽'}
            </button>
          </div>
        )}
      </div>

      {/* SUCCESS OVERLAY */}
      {success && (
        <div className="success-overlay">
          <div className="success-card">
            <div className="success-icon">🎉</div>
            <div className="success-title">Order Placed!</div>
            <div className="success-msg">
              Order <strong style={{color:'var(--g)'}}>#{lastOrder?.orderNumber}</strong> sent to kitchen!<br/>
              <strong>Table {tableNo}</strong> · Total: <strong style={{color:'var(--g)'}}>₨{lastOrder?.total.toLocaleString()}</strong><br/>
              Payment: {payMethod.toUpperCase()}<br/><br/>
              Your food will be ready shortly.<br/>
              Thank you, {lastOrder?.customerName}! 🙏
            </div>
            <button className="success-print-btn" onClick={printBill}>🖨 Print / Download Bill</button>
            <button className="success-new-btn" onClick={newOrder}>+ Place Another Order</button>
          </div>
        </div>
      )}

      {ToastEl}
    </>
  );
}
