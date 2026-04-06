// src/components/CheckoutModal.jsx
import React, { useState } from "react";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { db } from "../firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import "./CheckoutModal.css";

const PAYMENT_METHODS = [
  { id: "esewa",      icon: "🟢", name: "eSewa",      tag: "Digital Wallet" },
  { id: "khalti",     icon: "💜", name: "Khalti",     tag: "Digital Wallet" },
  { id: "fonepay",    icon: "📱", name: "Fonepay",    tag: "QR Payment" },
  { id: "connectips", icon: "🏦", name: "ConnectIPS", tag: "Bank Transfer" },
  { id: "card",       icon: "💳", name: "Card",       tag: "Visa / Master" },
  { id: "cash",       icon: "💵", name: "Cash",       tag: "On Delivery" },
];

const PAY_MESSAGES = {
  esewa:      "You will be redirected to eSewa to complete payment.",
  khalti:     "You will be redirected to Khalti wallet.",
  fonepay:    "Scan the QR code shown after placing order.",
  connectips: "Bank transfer via ConnectIPS.",
  card:       "Enter your card details on the next screen.",
  cash:       "Pay cash to the delivery rider when order arrives.",
};

export default function CheckoutModal({ onClose }) {
  const { cart, subtotal, delivery, vat, grandTotal, clearCart } = useCart();
  const { user } = useAuth();
  const [address,   setAddress]   = useState("");
  const [phone,     setPhone]     = useState(user?.phoneNumber || "");
  const [payMethod, setPayMethod] = useState(null);
  const [placing,   setPlacing]   = useState(false);
  const [success,   setSuccess]   = useState(false);
  const [orderData, setOrderData] = useState(null);

  const placeOrder = async () => {
    if (!address) return;
    if (!phone)   return;
    if (!payMethod) return;

    setPlacing(true);
    const orderNum = "NB-" + Math.random().toString(36).toUpperCase().slice(2, 8);
    const data = {
      orderNumber: orderNum,
      items: cart.map(i => ({ id: i.id, name: i.name, qty: i.qty, price: i.price, subtotal: i.price * i.qty })),
      subtotal, delivery, vat, total: grandTotal,
      paymentMethod: payMethod,
      deliveryAddress: address, phone,
      status: "pending",
      userId: user?.uid || "guest",
      userName: user?.displayName || "Guest",
      userEmail: user?.email || "",
      tableNo: new URLSearchParams(window.location.search).get("table") || null,
      createdAt: serverTimestamp(),
    };
    try {
      await addDoc(collection(db, "orders"), data);
    } catch (e) { console.warn("Order save failed:", e); }

    setOrderData({ ...data, orderNumber: orderNum });
    setSuccess(true);
    clearCart();
    setPlacing(false);
  };

  const printBill = () => {
    if (!orderData) return;
    const o = orderData;
    const w = window.open("", "_blank");
    w.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"/>
<title>NepalBite Bill #${o.orderNumber}</title>
<style>
body{font-family:sans-serif;max-width:380px;margin:0 auto;padding:1.5rem;color:#111;font-size:13px}
.logo{font-family:Georgia,serif;font-size:1.4rem;font-weight:900;text-align:center}.logo span{color:#C9973A}
.head{text-align:center;border-bottom:2px dashed #ccc;padding-bottom:.75rem;margin-bottom:.75rem}
.head p{font-size:.75rem;color:#555;margin:.15rem 0}
table{width:100%;border-collapse:collapse;margin:.75rem 0}
th{font-size:.7rem;text-align:left;padding:.35rem 0;border-bottom:1px solid #ddd;color:#555;text-transform:uppercase}
td{padding:.35rem 0;border-bottom:1px solid #f0f0f0;font-size:.8rem}td:last-child{text-align:right;font-weight:500}
.tr{display:flex;justify-content:space-between;font-size:.8rem;margin:.25rem 0}
.grand{font-weight:700;font-size:.95rem;margin-top:.5rem;border-top:1px solid #ddd;padding-top:.35rem}
.grand span:last-child{color:#C9973A}
.pbadge{display:inline-block;background:#f5f0e0;border:1px solid #C9973A;border-radius:3px;padding:.2rem .6rem;font-size:.7rem;font-weight:600;color:#C9973A}
.foot{text-align:center;margin-top:1.25rem;font-size:.7rem;color:#888;border-top:1px dashed #ccc;padding-top:.75rem}
button{display:block;width:100%;margin-top:1rem;padding:.75rem;background:#C9973A;color:#0A0A08;border:none;border-radius:4px;font-weight:700;cursor:pointer}
@media print{button{display:none}}
</style></head><body>
<div class="logo">Nepal<span>Bite</span></div>
<div class="head"><p>Thamel Marg, Kathmandu · Nepal</p><p>+977-01-4XXXXXX · hello@nepalbite.com · PAN: 600-123-456</p></div>
<div style="font-size:.75rem;margin-bottom:.5rem">
<strong>Order:</strong> #${o.orderNumber}<br>
<strong>Date:</strong> ${new Date().toLocaleDateString("en-NP", {dateStyle:"full"})}<br>
<strong>Time:</strong> ${new Date().toLocaleTimeString("en-NP", {timeStyle:"short"})}<br>
<strong>Phone:</strong> ${o.phone}<br>
<strong>Address:</strong> ${o.deliveryAddress}${o.tableNo ? `<br><strong>Table:</strong> ${o.tableNo}` : ""}
</div>
<table><thead><tr><th>Item</th><th>Qty</th><th>Amount</th></tr></thead>
<tbody>${o.items.map(i => `<tr><td>${i.name}</td><td>${i.qty}</td><td>₨${i.subtotal.toLocaleString()}</td></tr>`).join("")}</tbody></table>
<div style="border-top:2px dashed #ccc;padding-top:.75rem;margin-top:.75rem">
<div class="tr"><span>Subtotal</span><span>₨${o.subtotal.toLocaleString()}</span></div>
<div class="tr"><span>Delivery</span><span>${o.delivery === 0 ? "Free" : "₨" + o.delivery}</span></div>
<div class="tr"><span>VAT (13%)</span><span>₨${o.vat.toLocaleString()}</span></div>
<div class="tr grand"><span>Total</span><span>₨${o.total.toLocaleString()}</span></div>
</div>
<div style="text-align:center;margin-top:.75rem"><span class="pbadge">${o.paymentMethod.toUpperCase()}</span></div>
<div class="foot"><p>धन्यवाद! Thank you for dining with NepalBite 🙏</p><p>www.nepalbite.com</p></div>
<button onclick="window.print()">🖨 Print / Save as PDF</button>
</body></html>`);
    w.document.close();
  };

  const canPlace = address && phone && payMethod && !placing;

  return (
    <div className="ck-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="ck-box">
        <button className="ck-close" onClick={onClose}>✕</button>

        {!success ? (
          <>
            <div className="ck-title">Complete Your Order</div>
            <div className="ck-sub">Review items, choose payment, and place your order.</div>

            <div className="ck-section">Order Summary</div>
            <div className="ck-items">
              {cart.map(i => (
                <div key={i.id} className="ck-item-row">
                  <span>{i.name} × {i.qty}</span>
                  <span className="ck-item-price">₨{(i.price * i.qty).toLocaleString()}</span>
                </div>
              ))}
            </div>
            <div className="ck-totals">
              <div className="ck-tot-row"><span>Subtotal</span><span>₨{subtotal.toLocaleString()}</span></div>
              <div className="ck-tot-row"><span>Delivery</span><span style={{color: delivery===0?"var(--grn)":"inherit"}}>{delivery===0?"Free":"₨"+delivery}</span></div>
              <div className="ck-tot-row"><span>VAT (13%)</span><span>₨{vat.toLocaleString()}</span></div>
              <div className="ck-tot-row grand"><span>Total</span><span className="grand-amt">₨{grandTotal.toLocaleString()}</span></div>
            </div>

            <div className="ck-section">Delivery Address</div>
            <input className="ck-input" type="text" placeholder="Street address, landmark (e.g. Near Boudha Stupa, Kathmandu)" value={address} onChange={e => setAddress(e.target.value)}/>
            <input className="ck-input" type="tel" placeholder="Your phone number (+977 98XXXXXXXX)" value={phone} onChange={e => setPhone(e.target.value)}/>

            <div className="ck-section">Payment Method</div>
            <div className="pay-grid">
              {PAYMENT_METHODS.map(pm => (
                <button key={pm.id} className={`pay-opt${payMethod === pm.id ? " sel" : ""}`} onClick={() => setPayMethod(pm.id)}>
                  <span className="pay-icon">{pm.icon}</span>
                  <span className="pay-name">{pm.name}</span>
                  <span className="pay-tag">{pm.tag}</span>
                </button>
              ))}
            </div>
            {payMethod && <div className="pay-msg">{PAY_MESSAGES[payMethod]}</div>}

            <button className="place-btn" onClick={placeOrder} disabled={!canPlace}>
              {placing ? "Placing…" : "Place Order →"}
            </button>
          </>
        ) : (
          <div className="success-view">
            <div className="success-icon">🎉</div>
            <div className="success-title">Order Placed!</div>
            <div className="success-msg">
              Order <strong style={{color:"var(--g)"}}>#{orderData.orderNumber}</strong> confirmed!<br/>
              Total: <strong style={{color:"var(--g)"}}>₨{orderData.total.toLocaleString()}</strong> via {payMethod.toUpperCase()}<br/><br/>
              Estimated delivery: <strong>28–35 minutes</strong><br/>
              We'll call you on <strong>{orderData.phone}</strong>.
            </div>
            <button className="place-btn" style={{width:"100%"}} onClick={onClose}>Continue Browsing</button>
            <button className="print-bill-btn" onClick={printBill}>🖨 Print / Download Bill</button>
          </div>
        )}
      </div>
    </div>
  );
}
