"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";
import { Menu, X } from "lucide-react";
import { useState, useEffect } from "react";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/how-it-works", label: "How It Works" },
  { href: "/courses", label: "Courses" },
  { href: "/study-guides", label: "Study Guides" },
  { href: "/live-sessions", label: "Live Sessions" },
];

export function Navbar() {
  const pathname = usePathname();
  const { user } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const isHome = pathname === "/";
  const isDark = isHome;

  return (
    <>
      <nav
        className={cn(
          "fixed top-0 left-0 right-0 h-[70px] z-[200] flex items-center transition-all duration-300",
          isDark
            ? scrolled
              ? "bg-neutral-900/95 backdrop-blur-[16px] border-b border-white/10"
              : "bg-transparent"
            : "bg-white/92 backdrop-blur-[16px] backdrop-saturate-[180%] border-b border-black/7"
        )}
      >
        <div className="max-w-[1200px] mx-auto px-6 w-full flex items-center justify-between">

          {/* Left — Logo only */}
          <Logo variant={isDark ? "light" : "dark"} />

          {/* Right — links + CTA together */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "relative text-sm font-medium px-3.5 py-[7px] transition-colors group",
                    isActive
                      ? isDark ? "text-white" : "text-primary"
                      : isDark
                      ? "text-white/65 hover:text-white"
                      : "text-neutral-500 hover:text-neutral-900"
                  )}
                >
                  {/* Top bar — lights up on hover and active */}
                  <span
                    className={cn(
                      "absolute top-0 left-1/2 -translate-x-1/2 h-[2px] rounded-b-full transition-all duration-200",
                      isActive
                        ? "w-[60%] bg-accent"
                        : "w-0 bg-accent group-hover:w-[60%]"
                    )}
                  />
                  {link.label}
                </Link>
              );
            })}

            {/* CTA sits right after the links */}
            <div className="ml-3">
              {user ? (
                <Button variant="primary" size="md" href={`/dashboard/${user.role}`}>
                  Dashboard
                </Button>
              ) : (
                <Button
                  variant={isDark ? "accent" : "primary"}
                  size="md"
                  href="/auth/signup"
                  className="rounded-lg"
                >
                  Get Started
                </Button>
              )}
            </div>
          </div>

          {/* Mobile hamburger */}
          <button
            className={cn(
              "md:hidden p-2 rounded-lg transition-colors",
              isDark
                ? "text-white hover:bg-white/10"
                : "text-neutral-700 hover:bg-neutral-100"
            )}
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </nav>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-[199] bg-neutral-900/95 backdrop-blur-lg flex flex-col pt-[80px] px-6 pb-8 animate-fade-up md:hidden"
          onClick={() => setMobileOpen(false)}
        >
          <div className="flex flex-col gap-2 flex-1" onClick={(e) => e.stopPropagation()}>
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "text-lg font-medium py-3 px-4 rounded-xl transition-colors",
                  pathname === link.href
                    ? "text-white bg-white/10"
                    : "text-white/70 hover:text-white hover:bg-white/5"
                )}
              >
                {link.label}
              </Link>
            ))}
          </div>
          <div onClick={(e) => e.stopPropagation()}>
            {user ? (
              <Button
                variant="primary"
                size="xl"
                href={`/dashboard/${user.role}`}
                className="w-full justify-center"
                onClick={() => setMobileOpen(false)}
              >
                Dashboard
              </Button>
            ) : (
              <Button
                variant="accent"
                size="xl"
                href="/auth/signup"
                className="w-full justify-center rounded-xl"
                onClick={() => setMobileOpen(false)}
              >
                Get Started
              </Button>
            )}
          </div>
        </div>
      )}
    </>
  );
}