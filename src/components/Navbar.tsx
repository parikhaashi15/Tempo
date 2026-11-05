import React from 'react';
import { Palette, Bell, BellOff, Sparkles, Plus } from 'lucide-react';
import { User } from 'firebase/auth';

interface NavbarProps {
  activeTab: 'planner' | 'goals' | 'study' | 'calendar';
  setActiveTab: (tab: 'planner' | 'goals' | 'study' | 'calendar') => void;
  onOpenQuickAdd: () => void;
  onOpenTheme: () => void;
  onOpenCanvas: () => void;
  googleUser: User | null;
  onGoogleSignIn: () => void;
  onGoogleSignOut: () => void;
  notificationsEnabled: boolean;
  onToggleNotifications: () => void;
  canvasConnected: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onOpenQuickAdd,
  onOpenTheme,
  onOpenCanvas,
  googleUser,
  onGoogleSignIn,
  onGoogleSignOut,
  notificationsEnabled,
  onToggleNotifications,
  canvasConnected,
}) => {
  return (
    <header className="sticky top-0 z-30 w-full border-b border-[var(--theme-border)] bg-[var(--theme-surface)]/90 backdrop-blur-md transition-colors">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-8 px-4 sm:px-6 py-3.5">
        {/* Zone 1: Single Wordmark */}
        <div className="flex items-center gap-3 shrink-0">
          <button 
            onClick={() => setActiveTab('planner')}
            className="flex items-center gap-2.5 text-left focus:outline-none"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--theme-accent)] text-white shadow-xs">
              <span className="font-mono text-sm font-semibold tracking-tighter">tp</span>
            </div>
            <span className="text-xl font-bold tracking-tight text-[var(--theme-text-primary)] font-['Plus_Jakarta_Sans']">
              Tempo
            </span>
          </button>
        </div>

        {/* Zone 2: 4 single-line text navigation links */}
        <nav className="hidden md:flex items-center gap-1 sm:gap-2">
          <button
            onClick={() => setActiveTab('planner')}
            className={`px-3.5 py-1.5 text-sm font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'planner'
                ? 'bg-[var(--theme-accent-soft)] text-[var(--theme-accent)] font-semibold'
                : 'text-[var(--theme-text-muted)] hover:text-[var(--theme-text-primary)] hover:bg-[var(--theme-surface-subtle)]'
            }`}
          >
            Tasks & Planner
          </button>
          <button
            onClick={() => setActiveTab('goals')}
            className={`px-3.5 py-1.5 text-sm font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'goals'
                ? 'bg-[var(--theme-accent-soft)] text-[var(--theme-accent)] font-semibold'
                : 'text-[var(--theme-text-muted)] hover:text-[var(--theme-text-primary)] hover:bg-[var(--theme-surface-subtle)]'
            }`}
          >
            Daily Goals
          </button>
          <button
            onClick={() => setActiveTab('study')}
            className={`px-3.5 py-1.5 text-sm font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'study'
                ? 'bg-[var(--theme-accent-soft)] text-[var(--theme-accent)] font-semibold'
                : 'text-[var(--theme-text-muted)] hover:text-[var(--theme-text-primary)] hover:bg-[var(--theme-surface-subtle)]'
            }`}
          >
            Study Hub & Timer
          </button>
          <button
            onClick={() => setActiveTab('calendar')}
            className={`px-3.5 py-1.5 text-sm font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'calendar'
                ? 'bg-[var(--theme-accent-soft)] text-[var(--theme-accent)] font-semibold'
                : 'text-[var(--theme-text-muted)] hover:text-[var(--theme-text-primary)] hover:bg-[var(--theme-surface-subtle)]'
            }`}
          >
            Schedule & Meetings
          </button>
        </nav>

        {/* Zone 3: Actions & Connections */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Notifications Toggle */}
          <button
            onClick={onToggleNotifications}
            title={notificationsEnabled ? 'Meeting & Goal alerts active' : 'Click to enable alerts'}
            className="p-2 text-xs rounded-md text-[var(--theme-text-muted)] hover:text-[var(--theme-text-primary)] hover:bg-[var(--theme-surface-subtle)] transition-colors"
          >
            {notificationsEnabled ? (
              <Bell className="w-4 h-4 text-[var(--theme-accent)]" />
            ) : (
              <BellOff className="w-4 h-4 opacity-70" />
            )}
          </button>

          {/* Canvas Status button */}
          <button
            onClick={onOpenCanvas}
            className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-md border transition-colors ${
              canvasConnected
                ? 'border-[var(--theme-border)] bg-[var(--theme-surface-subtle)] text-[var(--theme-text-primary)]'
                : 'border-dashed border-[var(--theme-border)] text-[var(--theme-text-muted)] hover:border-[var(--theme-accent)]'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-[var(--theme-accent)]" />
            <span>{canvasConnected ? 'Canvas Connected' : 'Sync Canvas'}</span>
          </button>

          {/* Theme customizer button */}
          <button
            onClick={onOpenTheme}
            title="Customize pastel theme & paper textures"
            className="flex items-center gap-1.5 p-2 sm:px-2.5 sm:py-1.5 text-xs font-medium rounded-md border border-[var(--theme-border)] bg-[var(--theme-surface)] text-[var(--theme-text-primary)] hover:bg-[var(--theme-surface-subtle)] transition-colors"
          >
            <Palette className="w-4 h-4 text-[var(--theme-accent)]" />
            <span className="hidden sm:inline">Theme</span>
          </button>

          {/* Google Calendar Auth Button */}
          {googleUser ? (
            <div className="flex items-center gap-2">
              <div 
                className="hidden lg:flex flex-col text-right cursor-pointer"
                onClick={onGoogleSignOut}
                title="Click to sign out of Google Calendar"
              >
                <span className="text-xs font-medium text-[var(--theme-text-primary)] truncate max-w-[110px]">
                  {googleUser.displayName || googleUser.email?.split('@')[0]}
                </span>
                <span className="text-[10px] text-[var(--theme-accent)]">GCal Synced</span>
              </div>
              <button
                onClick={onGoogleSignOut}
                className="h-8 w-8 rounded-full border border-[var(--theme-border)] overflow-hidden hover:opacity-85 transition-opacity"
                title="Sign out of Google Calendar"
              >
                {googleUser.photoURL ? (
                  <img src={googleUser.photoURL} alt="Avatar" className="h-full w-full object-cover" />
                ) : (
                  <div className="h-full w-full bg-[var(--theme-accent)] text-white text-xs flex items-center justify-center font-bold">
                    {(googleUser.displayName || 'G')[0]}
                  </div>
                )}
              </button>
            </div>
          ) : (
            <button
              onClick={onGoogleSignIn}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md border border-[var(--theme-border)] bg-[var(--theme-surface)] text-[var(--theme-text-primary)] hover:bg-[var(--theme-surface-subtle)] transition-colors"
              title="Connect your Google Calendar to sync events"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span className="hidden sm:inline">GCal</span>
            </button>
          )}

          {/* Quick Add Button */}
          <button
            onClick={onOpenQuickAdd}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-white bg-[var(--theme-accent)] rounded-lg hover:opacity-90 transition-all shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="font-medium">Quick Add</span>
          </button>
        </div>
      </div>

      {/* Mobile navigation tab strip */}
      <div className="flex md:hidden border-t border-[var(--theme-border)] px-2 py-1 justify-around bg-[var(--theme-surface)]">
        <button
          onClick={() => setActiveTab('planner')}
          className={`py-1.5 px-2 text-xs font-medium ${
            activeTab === 'planner' ? 'text-[var(--theme-accent)] font-bold' : 'text-[var(--theme-text-muted)]'
          }`}
        >
          Tasks
        </button>
        <button
          onClick={() => setActiveTab('goals')}
          className={`py-1.5 px-2 text-xs font-medium ${
            activeTab === 'goals' ? 'text-[var(--theme-accent)] font-bold' : 'text-[var(--theme-text-muted)]'
          }`}
        >
          Daily Goals
        </button>
        <button
          onClick={() => setActiveTab('study')}
          className={`py-1.5 px-2 text-xs font-medium ${
            activeTab === 'study' ? 'text-[var(--theme-accent)] font-bold' : 'text-[var(--theme-text-muted)]'
          }`}
        >
          Study Hub
        </button>
        <button
          onClick={() => setActiveTab('calendar')}
          className={`py-1.5 px-2 text-xs font-medium ${
            activeTab === 'calendar' ? 'text-[var(--theme-accent)] font-bold' : 'text-[var(--theme-text-muted)]'
          }`}
        >
          Schedule
        </button>
      </div>
    </header>
  );
};
