"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { Menu, X, ChevronDown } from "lucide-react";
import { ThemeToggle } from "./theme-toggle";
import { signOut } from "@/app/auth/actions";

interface NavProps {
  username: string | null;
}

export function Nav({ username }: NavProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const accountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (accountRef.current && !accountRef.current.contains(e.target as Node)) {
        setAccountOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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

          {username ? (
            <>
              <Link
                href="/dashboard"
                className="text-on-surface-variant hover:text-on-surface text-sm transition-colors"
              >
                Dashboard
              </Link>

              {/* Account dropdown */}
              <div className="relative" ref={accountRef}>
                <button
                  onClick={() => setAccountOpen(!accountOpen)}
                  className="flex items-center gap-1 text-on-surface-variant hover:text-on-surface text-sm transition-colors"
                  aria-expanded={accountOpen}
                  aria-haspopup="true"
                >
                  My account
                  <ChevronDown size={14} className={`transition-transform ${accountOpen ? "rotate-180" : ""}`} />
                </button>

                {accountOpen && (
                  <div className="absolute right-0 top-full mt-2 w-48 bg-surface border border-outline-variant rounded-[12px] shadow-md py-1 z-50">
                    <div className="px-4 py-2 border-b border-outline-variant">
                      <p className="text-xs text-on-surface-variant font-label truncate">{username}</p>
                    </div>
                    <Link
                      href="/account"
                      className="block px-4 py-2.5 text-sm text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors"
                      onClick={() => setAccountOpen(false)}
                    >
                      Account settings
                    </Link>
                    <Link
                      href="/dashboard"
                      className="block px-4 py-2.5 text-sm text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors"
                      onClick={() => setAccountOpen(false)}
                    >
                      My progress
                    </Link>
                    <div className="border-t border-outline-variant mt-1 pt-1">
                      <form action={signOut}>
                        <button
                          type="submit"
                          className="block w-full text-left px-4 py-2.5 text-sm text-error hover:bg-surface-container transition-colors"
                          onClick={() => setAccountOpen(false)}
                        >
                          Log out
                        </button>
                      </form>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <Link
              href="/login"
              className="text-on-surface-variant hover:text-on-surface text-sm transition-colors"
            >
              Log in
            </Link>
          )}

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

          {username ? (
            <>
              <Link
                href="/dashboard"
                className="block px-6 py-3 text-on-surface-variant hover:text-on-surface hover:bg-surface-container text-sm"
                onClick={() => setIsOpen(false)}
              >
                Dashboard
              </Link>
              <div className="border-t border-outline-variant">
                <p className="px-6 pt-3 pb-1 text-xs text-on-surface-variant font-label">{username}</p>
                <Link
                  href="/account"
                  className="block px-6 py-2.5 text-on-surface-variant hover:text-on-surface hover:bg-surface-container text-sm"
                  onClick={() => setIsOpen(false)}
                >
                  Account settings
                </Link>
                <Link
                  href="/dashboard"
                  className="block px-6 py-2.5 text-on-surface-variant hover:text-on-surface hover:bg-surface-container text-sm"
                  onClick={() => setIsOpen(false)}
                >
                  My progress
                </Link>
                <form action={signOut}>
                  <button
                    type="submit"
                    className="block w-full text-left px-6 py-2.5 text-error hover:bg-surface-container text-sm"
                    onClick={() => setIsOpen(false)}
                  >
                    Log out
                  </button>
                </form>
              </div>
            </>
          ) : (
            <Link
              href="/login"
              className="block px-6 py-3 text-on-surface-variant hover:text-on-surface hover:bg-surface-container text-sm"
              onClick={() => setIsOpen(false)}
            >
              Log in
            </Link>
          )}

          <div className="px-4 py-3 border-t border-outline-variant">
            <ThemeToggle />
          </div>
        </div>
      )}
    </nav>
  );
}
