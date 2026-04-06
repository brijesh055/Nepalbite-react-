// src/components/CartSidebar.jsx
import React from "react";
import { useCart } from "../context/CartContext";
import "./CartSidebar.css";

export default function CartSidebar({ onCheckout }) {
  const { cart, cartOpen, setCartOpen, changeQty, subtotal, totalQty } = useCart();

  return (
    <>
      {cartOpen && <div className="overlay" onClick={() => setCartOpen(false)} />}
      <div className={`cart-sidebar${cartOpen ? " open" : ""}`}>
        <div className="cart-head">
          <div className="cart-title">Your Cart</div>
          <button className="cart-close-btn" onClick={() => setCartOpen(false)}>✕</button>
        </div>

        <div className="cart-body">
          {cart.length === 0 ? (
            <div className="cart-empty">
              <div className="cart-empty-icon">🛒</div>
              <div className="cart-empty-title">Your cart is empty</div>
              <div className="cart-empty-sub">Browse our menu and add items</div>
            </div>
          ) : (
            cart.map(item => (
              <div key={item.id} className="cart-item">
                <div className="cart-item-img">
                  <img src={item.img} alt={item.name} loading="lazy"/>
                </div>
                <div className="cart-item-info">
                  <div className="cart-item-name">{item.name}</div>
                  <div className="cart-item-price">₨{(item.price * item.qty).toLocaleString()}</div>
                  <div className="cart-item-qty">
                    <button className="qty-btn" onClick={() => changeQty(item.id, -1)}>−</button>
                    <span className="qty-num">{item.qty}</span>
                    <button className="qty-btn" onClick={() => changeQty(item.id, 1)}>+</button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {cart.length > 0 && (
          <div className="cart-footer">
            <div className="cart-subtotal-row">
              <span>Subtotal</span>
              <span className="cart-subtotal-val">₨{subtotal.toLocaleString()}</span>
            </div>
            <div className="cart-note">Delivery + 13% VAT calculated at checkout</div>
            <button className="cart-checkout-btn" onClick={() => { setCartOpen(false); onCheckout(); }}>
              Proceed to Checkout →
            </button>
          </div>
        )}
      </div>
    </>
  );
}
