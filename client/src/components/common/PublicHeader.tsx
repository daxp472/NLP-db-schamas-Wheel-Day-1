import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Database,
  Sparkles,
  Network,
  Menu,
  X,
  ChevronRight,
  LogOut,
  Settings,
  LayoutDashboard
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { useAuth } from '../../context/AuthContext';

interface NavItem {
  to: string;
  label: string;
}

const PUBLIC_NAV_ITEMS: NavItem[] = [
  { to: '/explore', label: 'Explore' },
  { to: '/product', label: 'Product' },
  { to: '/features', label: 'Features' },
  { to: '/how-it-works', label: 'How It Works' },
  { to: '/use-cases', label: 'Use Cases' },
  { to: '/faq', label: 'FAQ' },
  { to: '/about', label: 'About' },
  { to: '/contact', label: 'Contact' },
];

export const PublicHeader: React.FC = () => {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const { user, isAuthenticated, logout } = useAuth();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-workbench-border bg-workbench-bg/90 backdrop-blur-md transition-all select-none">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded bg-workbench-surface border border-workbench-border-active flex items-center justify-center text-workbench-cyan group-hover:shadow-glow-cyan transition-all">
            <Database className="w-4 h-4" />
          </div>
          <div className="flex items-center">
            <span className="font-semibold text-sm tracking-wide text-workbench-heading group-hover:text-workbench-cyan transition-colors">
              SCHEMA STUDIO
            </span>
            <span className="ml-1.5 text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-workbench-elevated text-workbench-cyan border border-workbench-border">
              AI
            </span>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden lg:flex items-center gap-1">
          {PUBLIC_NAV_ITEMS.map((item) => {
            const isActive = location.pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  'px-3 py-1.5 rounded text-xs font-medium transition-colors',
                  isActive
                    ? 'text-workbench-cyan bg-workbench-elevated border border-workbench-border-active'
                    : 'text-workbench-muted hover:text-workbench-text hover:bg-workbench-surface'
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Right CTA Actions */}
        <div className="hidden sm:flex items-center gap-2.5">
          <Link
            to="/studio"
            className="text-xs font-mono px-3 py-1.5 rounded bg-workbench-surface hover:bg-workbench-elevated text-workbench-text border border-workbench-border hover:border-workbench-cyan/50 flex items-center gap-1.5 transition-all"
          >
            <Network className="w-3.5 h-3.5 text-workbench-cyan" />
            <span>Interactive Demo</span>
          </Link>

          {isAuthenticated && user ? (
            <div className="relative">
              <button
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-workbench-surface hover:bg-workbench-elevated border border-workbench-border text-xs text-workbench-text font-medium transition-all"
              >
                <div className="w-5 h-5 rounded-full bg-workbench-cyan/20 border border-workbench-cyan/40 text-workbench-cyan flex items-center justify-center text-[10px] font-bold">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <span className="max-w-[100px] truncate">{user.name}</span>
              </button>

              {userDropdownOpen && (
                <div
                  onMouseLeave={() => setUserDropdownOpen(false)}
                  className="absolute right-0 mt-1 w-48 rounded-lg bg-workbench-surface border border-workbench-border shadow-xl py-1 text-xs z-50 animate-in fade-in zoom-in-95 duration-100"
                >
                  <div className="px-3 py-2 border-b border-workbench-border/60">
                    <p className="font-semibold text-workbench-heading truncate">{user.name}</p>
                    <p className="text-[11px] font-mono text-workbench-muted truncate">{user.email}</p>
                  </div>

                  <Link
                    to="/dashboard"
                    onClick={() => setUserDropdownOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 text-workbench-text hover:bg-workbench-elevated hover:text-workbench-cyan transition-colors"
                  >
                    <LayoutDashboard className="w-3.5 h-3.5" />
                    <span>My Projects</span>
                  </Link>

                  <Link
                    to="/settings"
                    onClick={() => setUserDropdownOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 text-workbench-text hover:bg-workbench-elevated hover:text-workbench-cyan transition-colors"
                  >
                    <Settings className="w-3.5 h-3.5" />
                    <span>Account Settings</span>
                  </Link>

                  <div className="border-t border-workbench-border/60 mt-1">
                    <button
                      onClick={async () => {
                        setUserDropdownOpen(false);
                        await logout();
                      }}
                      className="w-full text-left flex items-center gap-2 px-3 py-2 text-red-400 hover:bg-red-950/20 transition-colors"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link
                to="/login"
                className="text-xs font-medium px-3 py-1.5 rounded text-workbench-muted hover:text-workbench-text hover:bg-workbench-surface transition-colors"
              >
                Sign In
              </Link>
            </>
          )}

          <Link
            to="/workspace"
            className="text-xs font-semibold px-4 py-2 rounded bg-workbench-cyan text-black hover:bg-cyan-300 font-sans flex items-center gap-1.5 transition-all shadow-sm hover:shadow-glow-cyan"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Start Designing</span>
          </Link>
        </div>

        {/* Mobile menu toggle */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="lg:hidden p-2 rounded text-workbench-muted hover:text-workbench-text hover:bg-workbench-surface transition-colors"
          aria-label="Toggle navigation menu"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-b border-workbench-border bg-workbench-surface px-4 py-4 space-y-3">
          <div className="flex flex-col space-y-1">
            {PUBLIC_NAV_ITEMS.map((item) => {
              const isActive = location.pathname === item.to;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    'px-3 py-2 rounded text-xs font-medium flex items-center justify-between transition-colors',
                    isActive
                      ? 'bg-workbench-elevated text-workbench-cyan font-semibold'
                      : 'text-workbench-muted hover:text-workbench-text hover:bg-workbench-elevated/50'
                  )}
                >
                  <span>{item.label}</span>
                  <ChevronRight className="w-3.5 h-3.5 opacity-60" />
                </Link>
              );
            })}
          </div>

          <div className="pt-3 border-t border-workbench-border space-y-2">
            {isAuthenticated && user ? (
              <>
                <div className="px-3 py-1 text-xs text-workbench-muted">
                  Signed in as <span className="font-semibold text-workbench-text">{user.name}</span>
                </div>
                <Link
                  to="/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full py-2 px-3 rounded bg-workbench-elevated text-workbench-text text-xs font-medium flex items-center justify-center gap-2"
                >
                  <LayoutDashboard className="w-3.5 h-3.5" />
                  <span>My Projects</span>
                </Link>
                <Link
                  to="/settings"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full py-2 px-3 rounded bg-workbench-elevated text-workbench-text text-xs font-medium flex items-center justify-center gap-2"
                >
                  <Settings className="w-3.5 h-3.5" />
                  <span>Account Settings</span>
                </Link>
                <button
                  onClick={async () => {
                    setMobileMenuOpen(false);
                    await logout();
                  }}
                  className="w-full py-2 px-3 rounded text-red-400 hover:bg-red-950/20 text-xs font-medium flex items-center justify-center gap-2"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              </>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="py-2 text-center rounded bg-workbench-elevated text-workbench-text text-xs font-medium"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="py-2 text-center rounded bg-workbench-cyan text-black text-xs font-semibold"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
