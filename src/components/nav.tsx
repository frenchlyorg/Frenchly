"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { ThemeToggle } from "./theme-toggle";

export function Nav() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="bg-surface border-b border-outline-variant sticky top-0 z-50">
      <div className="max-w-[1040px] mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="font-heading text-xl font-semibold text-primary">
          Frenchly
        </Link>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-6">
          <Link
            href="/"
            className="text-on-surface-variant hover:text-on-surface text-sm transition-colors"
          >
            Home
          </Link>
          <Link
            href="/mission"
            className="text-on-surface-variant hover:text-on-surface text-sm transition-colors"
          >
            Mission
          </Link>
          <Link
            href="/login"
            className="text-on-surface-variant hover:text-on-surface text-sm transition-colors"
          >
            Log in
          </Link>
          <ThemeToggle />
        </div>

        {/* Mobile hamburger */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          aria-label={isOpen ? "Close menu" : "Open menu"}
          className="md:hidden p-2 rounded text-on-surface hover:bg-surface-container-high transition-colors"
        >
          {isOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile drawer */}
      {isOpen && (
        <div className="absolute top-full left-0 w-full bg-surface border-b border-outline-variant md:hidden">
          <Link
            href="/"
            className="block px-6 py-3 text-on-surface-variant hover:text-on-surface hover:bg-surface-container text-sm"
            onClick={() => setIsOpen(false)}
          >
            Home
          </Link>
          <Link
            href="/mission"
            className="block px-6 py-3 text-on-surface-variant hover:text-on-surface hover:bg-surface-container text-sm"
            onClick={() => setIsOpen(false)}
          >
            Mission
          </Link>
          <Link
            href="/login"
            className="block px-6 py-3 text-on-surface-variant hover:text-on-surface hover:bg-surface-container text-sm"
            onClick={() => setIsOpen(false)}
          >
            Log in
          </Link>
          <div className="px-4 py-3">
            <ThemeToggle />
          </div>
        </div>
      )}
    </nav>
  );
}
