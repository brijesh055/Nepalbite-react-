// src/components/Chatbot.jsx
import React, { useState, useRef, useEffect } from 'react';
import './Chatbot.css';

const HOUR = new Date().getHours();
const TOD  = HOUR < 12 ? 'morning' : HOUR < 17 ? 'afternoon' : HOUR < 21 ? 'evening' : 'night';

const QUICK_REPLIES = [
  { label: '😊 Happy mood',    msg: "I'm happy, suggest food!" },
  { label: '😔 Comfort food',  msg: 'I need comfort food' },
  { label: '🌧 Rainy day',     msg: "It's raining, what to eat?" },
  { label: '💰 Under ₨200',    msg: 'Suggest food under 200 rupees' },
  { label: '🌱 Vegetarian',    msg: "I'm vegetarian, what's good?" },
  { label: '🌶 Spicy food',    msg: 'I love spicy food' },
  { label: '🥟 Momos info',    msg: 'Tell me about your momos' },
  { label: '💳 Payment',       msg: 'How can I pay?' },
];

function getBotReply(msg) {
  const m = msg.toLowerCase();
  if (m.includes('happy') || m.includes('celebrat') || m.includes('great mood'))
    return "You're in a great mood! 🎉 Celebrate with:\n\n🥟 Chicken Momo ₨280\n🍽 Newari Khaja Set ₨520\n🍰 Juju Dhau ₨160\n🍛 Thakali Set ₨650\n\nPerfect for a special occasion! 🎊";
  if (m.includes('sad') || m.includes('down') || m.includes('comfort') || m.includes('depress'))
    return "Sending warm hugs! 🤗 Comfort food:\n\n🍛 Dal Bhat Thali ₨450 — like a hug in a bowl\n🍜 Thukpa ₨320 — warming noodle soup\n☕ Masala Chiya ₨80 — Nepal's cure-all\n\nFeel better soon! 💛";
  if (m.includes('rain') || m.includes('cold') || m.includes('wet') || m.includes('monsoon'))
    return "Rainy day in Kathmandu! 🌧\n\n☕ Masala Chiya ₨80 — essential for rain\n🥟 Pakoda ₨120 — crispy snacks\n🍜 Thukpa ₨320 — warming soup\n🥟 Hot Momos ₨220-280 — rain + momos = perfection 🥟";
  if (m.includes('hot') || m.includes('summer') || m.includes('cool'))
    return "Hot day? Let me cool you down! ☀️\n\n🥛 Mango Lassi ₨180\n🍋 Fresh Lime Soda ₨120\n🥤 Fresh Juice ₨150\n🍮 Juju Dhau ₨160 — cold and creamy";
  if (m.includes('200') || m.includes('budget') || m.includes('cheap') || m.includes('affordable'))
    return "Best picks under ₨200:\n\n☕ Masala Chiya — ₨80\n🧅 Samosa — ₨80\n🌶 Chatpate — ₨100\n🥔 Aloo Chop — ₨90\n🌯 Egg Roll — ₨150\n🍯 Jalebi — ₨120\n🍋 Lime Soda — ₨120";
  if (m.includes('veg') || m.includes('no meat') || m.includes('plant'))
    return "Best vegetarian options 🌱:\n\nVeg Momo ₨220\nDal Bhat Thali ₨450\nJuju Dhau ₨160\nPanipuri ₨120\nSel Roti ₨150\nMasala Chiya ₨80\n\nAll marked 🌱 in our menu!";
  if (m.includes('spicy') || m.includes('chilli') || m.includes('fire') || m.includes('hot food'))
    return "Spice lover! 🔥\n\n🌶 Laphing ₨160 — VERY spicy cold noodles\n🥟 Chicken Momo + spicy achar ₨280\n🍗 Fried Chicken ₨380\n🌶 Chatpate ₨100 — maximum chilli\n🍢 Sekuwa ₨380";
  if (m.includes('momo') || m.includes('dumpling'))
    return "Our momos! 🥟\n\n🥟 Chicken Momo ₨280 — most popular!\n🥟 Buff Momo ₨260 — Newari classic\n🥟 Veg Momo ₨220\n\nAll served with secret sesame-tomato achar. Steamed fresh to order!";
  if (m.includes('pay') || m.includes('esewa') || m.includes('khalti') || m.includes('cash'))
    return "We accept all Nepal payment methods:\n\n🟢 eSewa\n💜 Khalti\n📱 Fonepay QR\n🏦 ConnectIPS\n💳 Debit/Credit Card\n💵 Cash on Delivery\n\nAll secure, no extra charges! 💰";
  if (m.includes('deliver') || m.includes('how long') || m.includes('time'))
    return "Delivery info:\n\n⏱ Average: 28 mins across Kathmandu Valley\n🆓 Free delivery above ₨500\n📦 ₨60 on smaller orders\n\nYou'll get a call when your rider is on the way. 🚴";
  if (m.includes('table') || m.includes('qr') || m.includes('scan'))
    return "Our QR Table System 📱:\n\nEach table has a unique QR code. Scan → see menu → order → get bill PDF. No waiting for a waiter! Ask your server for the table QR card. 😊";
  if (TOD === 'morning')
    return "Good morning! 🌅 Start your day right:\n\n☕ Masala Chiya ₨80\n🍞 Sel Roti ₨150\n🥤 Fresh Juice ₨150\n🍔 Club Sandwich ₨280";
  if (TOD === 'evening' || TOD === 'night')
    return "Good evening! 🌆\n\n🍢 Sekuwa ₨380 — grilled skewers\n🥟 Momos + Chiya ₨360\n🍜 Mutton Curry ₨480\n🍺 Tongba ₨220 — traditional millet brew";
  return "Namaste! 🙏 I'm Neela, your NepalBite guide!\n\nAsk me about:\n• Food by mood 😊😔\n• Rainy/hot day picks 🌧☀️\n• Budget options 💰\n• Veg/spicy food 🌱🌶\n• Delivery & payment 🚴💳";
}

export default function Chatbot() {
  const [open, setOpen]       = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput]     = useState('');
  const msgsRef               = useRef(null);

  useEffect(() => {
    if (msgsRef.current) msgsRef.current.scrollTop = 9999;
  }, [messages]);

  const openChat = () => {
    setOpen(true);
    if (messages.length === 0) {
      setMessages([{
        type: 'bot',
        text: `Namaste! 🙏 I'm Neela, your NepalBite AI food guide.\n\nIt's ${TOD} in Kathmandu. Tell me your mood and I'll suggest the perfect dish! 😊`
      }]);
    }
  };

  const sendMsg = (msg) => {
    if (!msg.trim()) return;
    const userMsg = { type: 'user', text: msg };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setTimeout(() => {
      setMessages(prev => [...prev, { type: 'bot', text: getBotReply(msg) }]);
    }, 460);
  };

  const handleKey = (e) => { if (e.key === 'Enter') sendMsg(input); };

  return (
    <>
      <button className="chat-fab" onClick={open ? () => setOpen(false) : openChat} aria-label="Chat with Neela AI">
        🤖
      </button>

      <div className={`chat-window${open ? ' open' : ''}`}>
        <div className="chat-header">
          <span className="chat-av">🤖</span>
          <div>
            <div className="chat-name">Neela AI</div>
            <div className="chat-status">● Online</div>
          </div>
          <button className="chat-close-btn" onClick={() => setOpen(false)}>✕</button>
        </div>

        <div className="chat-messages" ref={msgsRef}>
          {messages.map((m, i) => (
            <div key={i} className={`chat-msg ${m.type}`}>{m.text}</div>
          ))}
        </div>

        <div className="chat-quicks">
          {QUICK_REPLIES.map(r => (
            <button key={r.msg} className="quick-btn" onClick={() => sendMsg(r.msg)}>
              {r.label}
            </button>
          ))}
        </div>

        <div className="chat-input-row">
          <input
            className="chat-input"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Ask me anything…"
          />
          <button className="chat-send" onClick={() => sendMsg(input)}>→</button>
        </div>
      </div>
    </>
  );
}
