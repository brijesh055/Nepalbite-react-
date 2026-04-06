// src/hooks/useCursor.js
import { useEffect } from "react";

export default function useCursor() {
  useEffect(() => {
    // Only activate on real mouse (not touch)
    const hasMouse = window.matchMedia("(pointer: fine)").matches;
    const hasTouch = "ontouchstart" in window || navigator.maxTouchPoints > 1;
    if (!hasMouse || hasTouch) return;

    document.body.classList.add("has-mouse");
    const dot  = document.querySelector(".custom-cursor");
    const ring = document.querySelector(".custom-cursor-ring");
    if (!dot || !ring) return;

    let mouseX = 0, mouseY = 0;
    let ringX  = 0, ringY  = 0;
    let raf;

    const onMove = (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      dot.style.left = mouseX + "px";
      dot.style.top  = mouseY + "px";
    };

    const animateRing = () => {
      ringX += (mouseX - ringX) * 0.12;
      ringY += (mouseY - ringY) * 0.12;
      ring.style.left = ringX + "px";
      ring.style.top  = ringY + "px";
      raf = requestAnimationFrame(animateRing);
    };

    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseleave", () => {
      dot.style.opacity = "0";
      ring.style.opacity = "0";
    });
    document.addEventListener("mouseenter", () => {
      dot.style.opacity = "1";
      ring.style.opacity = "1";
    });
    raf = requestAnimationFrame(animateRing);

    return () => {
      document.removeEventListener("mousemove", onMove);
      cancelAnimationFrame(raf);
      document.body.classList.remove("has-mouse");
    };
  }, []);
}
