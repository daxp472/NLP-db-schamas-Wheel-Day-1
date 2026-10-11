import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Database,
  LayoutDashboard,
  Sparkles,
  Network,
  ArrowLeft,
  Settings,
  LogOut,
  Compass,
  Users
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { useAuth } from '../../context/AuthContext';

export const Navbar: React.FC = () => {
  const location = useLocation();
  const { user, isAuthenticated, logout } = useAuth();
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const navLinks = [
    { to: '/dashboard', label: 'Projects', icon: LayoutDashboard },
    { to: '/explore', label: 'Explore', icon: Compass },
    { to: '/collaboration', label: 'Teams', icon: Users },
    { to: '/workspace', label: 'New Requirement', icon: Sparkles },
    { to: '/studio', label: 'Schema Studio', icon: Network },
  ];

  return (
    <header className="h-14 border-b border-workbench-border bg-workbench-surface px-4 flex items-center justify-between z-30 select-none">
      {/* Brand & Back link */}
      <div className="flex items-center gap-3">
        <Link
          to="/"
          className="flex items-center gap-1.5 text-xs font-mono text-workbench-muted hover:text-workbench-cyan transition-colors mr-1"
          title="Return to Public Website"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Website</span>
        </Link>

        <span className="text-workbench-border text-sm hidden sm:inline">/</span>

        <Link to="/" className="flex items-center gap-2 group">
          <div className="w-7 h-7 rounded bg-workbench-overlay border border-workbench-border-active flex items-center justify-center text-workbench-cyan group-hover:shadow-glow-cyan transition-all">
            <Database className="w-3.5 h-3.5" />
          </div>
          <div>
            <span className="font-semibold text-xs tracking-wide text-workbench-heading group-hover:text-workbench-cyan transition-colors">
              SCHEMA STUDIO
            </span>
            <span className="ml-1 text-[10px] font-mono uppercase px-1 py-0.2 rounded bg-workbench-overlay text-workbench-cyan border border-workbench-border">
              AI
            </span>
          </div>
        </Link>

        <span className="text-workbench-border text-sm hidden md:inline">|</span>
        <span className="text-[11px] text-workbench-muted font-mono hidden md:inline">
          Workbench Shell
        </span>
      </div>

      {/* Navigation Tabs */}
      <nav className="flex items-center gap-1">
        {navLinks.map((link) => {
          const Icon = link.icon;
          const isActive = location.pathname === link.to;
          return (
            <Link
              key={link.to}
              to={link.to}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-all',
                isActive
                  ? 'bg-workbench-elevated text-workbench-cyan border border-workbench-border-active shadow-sm'
                  : 'text-workbench-muted hover:text-workbench-text hover:bg-workbench-elevated/50'
              )}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{link.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Quick Action / User Profile */}
      <div className="flex items-center gap-2.5">
        <Link
          to="/workspace"
          className="text-xs font-semibold px-3 py-1.5 rounded bg-workbench-cyan text-black hover:bg-cyan-300 font-sans flex items-center gap-1.5 transition-all shadow-sm"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">New Schema</span>
        </Link>

        {isAuthenticated && user ? (
          <div className="relative">
            <button
              onClick={() => setUserDropdownOpen(!userDropdownOpen)}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-workbench-bg hover:bg-workbench-elevated border border-workbench-border text-xs text-workbench-text font-medium transition-all"
            >
              <div className="w-5 h-5 rounded-full bg-workbench-cyan/20 border border-workbench-cyan/40 text-workbench-cyan flex items-center justify-center text-[10px] font-bold">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <span className="hidden sm:inline max-w-[90px] truncate">{user.name}</span>
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
          <Link
            to="/login"
            className="text-xs font-mono px-2.5 py-1.5 rounded bg-workbench-bg hover:bg-workbench-elevated border border-workbench-border text-workbench-muted hover:text-workbench-text transition-all"
          >
            Sign In
          </Link>
        )}
      </div>
    </header>
  );
};
