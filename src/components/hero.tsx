"use client";

import { useEffect, useState } from "react";

function useMouse() {
  const [pos, setPos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handler = (e: MouseEvent) => setPos({ x: e.clientX, y: e.clientY });
    window.addEventListener("mousemove", handler, { passive: true });
    return () => window.removeEventListener("mousemove", handler);
  }, []);

  return pos;
}

export function HeroBackground() {
  const { x, y } = useMouse();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  // ponytail: offset stays 0 until after mount so server HTML and the first
  // client render agree — reading window during render caused a hydration mismatch.
  const factor = 0.015;
  const dx = mounted ? (x - window.innerWidth / 2) * factor : 0;
  const dy = mounted ? (y - window.innerHeight / 2) * factor : 0;

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Static grid pattern */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(var(--color-outline-variant) 1px, transparent 1px), linear-gradient(90deg, var(--color-outline-variant) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
          opacity: 0.3,
        }}
      />

      {/* Parallax icon layer */}
      <div
        className="absolute inset-0"
        style={{
          transform: `translate3d(${dx.toFixed(2)}px, ${dy.toFixed(2)}px, 0)`,
          willChange: "transform",
        }}
      >
        {/* Decorative French-themed SVG icons */}
        <svg
          style={{ position: "absolute", top: "12%", left: "8%", opacity: 0.5 }}
          width="72"
          height="72"
          viewBox="0 0 72 72"
          fill="none"
        >
          <circle cx="36" cy="36" r="34" stroke="var(--color-primary-container)" strokeWidth="2" />
          <text x="50%" y="55%" dominantBaseline="middle" textAnchor="middle" fill="var(--color-primary-container)" fontSize="28" fontFamily="serif">«»</text>
        </svg>

        <svg
          style={{ position: "absolute", top: "20%", right: "12%", opacity: 0.5 }}
          width="60"
          height="60"
          viewBox="0 0 60 60"
          fill="none"
        >
          <rect x="4" y="4" width="52" height="52" rx="8" stroke="var(--color-primary-container)" strokeWidth="2" />
          <text x="50%" y="55%" dominantBaseline="middle" textAnchor="middle" fill="var(--color-primary-container)" fontSize="22" fontFamily="serif">é</text>
        </svg>

        <svg
          style={{ position: "absolute", bottom: "25%", left: "18%", opacity: 0.5 }}
          width="56"
          height="56"
          viewBox="0 0 56 56"
          fill="none"
        >
          <circle cx="28" cy="28" r="26" stroke="var(--color-primary-container)" strokeWidth="2" />
          <text x="50%" y="55%" dominantBaseline="middle" textAnchor="middle" fill="var(--color-primary-container)" fontSize="20" fontFamily="serif">A</text>
        </svg>

        <svg
          style={{ position: "absolute", top: "55%", right: "20%", opacity: 0.5 }}
          width="64"
          height="64"
          viewBox="0 0 64 64"
          fill="none"
        >
          <rect x="4" y="4" width="56" height="56" rx="4" stroke="var(--color-primary-container)" strokeWidth="2" />
          <text x="50%" y="55%" dominantBaseline="middle" textAnchor="middle" fill="var(--color-primary-container)" fontSize="24" fontFamily="serif">ç</text>
        </svg>

        <svg
          style={{ position: "absolute", bottom: "15%", right: "8%", opacity: 0.5 }}
          width="50"
          height="50"
          viewBox="0 0 50 50"
          fill="none"
        >
          <circle cx="25" cy="25" r="23" stroke="var(--color-primary-container)" strokeWidth="2" />
          <text x="50%" y="55%" dominantBaseline="middle" textAnchor="middle" fill="var(--color-primary-container)" fontSize="18" fontFamily="serif">à</text>
        </svg>
      </div>
    </div>
  );
}

export function DisabledCTA() {
  return (
    <div className="relative group inline-block">
      <button
        disabled
        className="px-6 py-3 bg-primary text-on-primary rounded font-label text-sm opacity-60 cursor-not-allowed"
      >
        Create account
      </button>
      <span className="absolute -top-9 left-1/2 -translate-x-1/2 bg-on-surface text-surface text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
        Coming soon
      </span>
    </div>
  );
}
