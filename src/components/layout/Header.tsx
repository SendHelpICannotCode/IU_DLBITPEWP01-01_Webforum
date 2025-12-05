"use client";

import Link from "next/link";
import { MessageSquare, Menu, X, LogIn, UserPlus, LogOut } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui";
import { logout } from "@/actions/auth";

interface HeaderProps {
  /** Aktueller Benutzer aus Session */
  user?: {
    id: string;
    username: string;
    role: "USER" | "ADMIN";
  } | null;
}

export function Header({ user }: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-800 bg-slate-900/80 backdrop-blur-md">
      <div className="container flex h-16 items-center justify-between">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-2 text-xl font-bold text-white transition-colors hover:text-cyan-400"
        >
          <MessageSquare className="h-6 w-6 text-cyan-500" />
          <span className="hidden sm:inline">CyberForum</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          <Link
            href="/"
            className="text-sm font-medium text-slate-300 transition-colors hover:text-cyan-400"
          >
            Forum
          </Link>
        </nav>

        {/* Auth Buttons (Desktop) */}
        <div className="hidden md:flex items-center gap-3">
          {user ? (
            <>
              <span className="text-sm text-slate-400">
                Hallo,{" "}
                <span className="font-medium text-cyan-400">
                  {user.username}
                </span>
                {user.role === "ADMIN" && (
                  <span className="ml-1.5 rounded bg-cyan-900/50 px-1.5 py-0.5 text-xs text-cyan-300">
                    Admin
                  </span>
                )}
              </span>
              <Button variant="ghost" size="sm" onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </Button>
            </>
          ) : (
            <>
              <Link href="/login">
                <Button variant="ghost" size="sm">
                  <LogIn className="mr-2 h-4 w-4" />
                  Login
                </Button>
              </Link>
              <Link href="/register">
                <Button variant="primary" size="sm">
                  <UserPlus className="mr-2 h-4 w-4" />
                  Registrieren
                </Button>
              </Link>
            </>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 text-slate-400 hover:text-white transition-colors"
          aria-label="Menü öffnen"
        >
          {mobileMenuOpen ? (
            <X className="h-6 w-6" />
          ) : (
            <Menu className="h-6 w-6" />
          )}
        </button>
      </div>

      {/* Mobile Menu */}
      <div
        className={cn(
          "md:hidden overflow-hidden transition-all duration-300 ease-in-out",
          mobileMenuOpen ? "max-h-96" : "max-h-0"
        )}
      >
        <nav className="container flex flex-col gap-4 py-4 border-t border-slate-800">
          <Link
            href="/"
            className="text-sm font-medium text-slate-300 hover:text-cyan-400"
            onClick={() => setMobileMenuOpen(false)}
          >
            Forum
          </Link>

          <div className="flex flex-col gap-2 pt-4 border-t border-slate-800">
            {user ? (
              <>
                <span className="text-sm text-slate-400 flex items-center gap-1.5">
                  Eingeloggt als{" "}
                  <span className="font-medium text-cyan-400">
                    {user.username}
                  </span>
                  {user.role === "ADMIN" && (
                    <span className="rounded bg-cyan-900/50 px-1.5 py-0.5 text-xs text-cyan-300">
                      Admin
                    </span>
                  )}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="justify-start"
                  onClick={handleLogout}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start"
                  >
                    <LogIn className="mr-2 h-4 w-4" />
                    Login
                  </Button>
                </Link>
                <Link href="/register" onClick={() => setMobileMenuOpen(false)}>
                  <Button
                    variant="primary"
                    size="sm"
                    className="w-full justify-start"
                  >
                    <UserPlus className="mr-2 h-4 w-4" />
                    Registrieren
                  </Button>
                </Link>
              </>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
}
