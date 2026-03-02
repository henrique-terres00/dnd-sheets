"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function SessionState() {
  const [currentSession, setCurrentSession] = useState<string | null>(null);

  useEffect(() => {
    // Load current session from localStorage
    const loadSession = () => {
      const savedSession = localStorage.getItem('currentSession');
      console.log('SessionState: Loading session from localStorage:', savedSession);
      setCurrentSession(savedSession);
    };

    // Initial load
    loadSession();

    // Listen for storage changes
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'currentSession') {
        console.log('SessionState: Storage changed:', e.newValue);
        setCurrentSession(e.newValue);
      }
    };

    // Listen for custom session events
    const handleSessionUpdate = () => {
      console.log('SessionState: Session update event received');
      loadSession();
    };

    // Listen for visibility changes (when user returns to tab)
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        console.log('SessionState: Tab became visible, reloading session');
        loadSession();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('sessionUpdated', handleSessionUpdate);
    window.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('sessionUpdated', handleSessionUpdate);
      window.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const clearSession = () => {
    localStorage.removeItem('currentSession');
    setCurrentSession(null);
    // Dispatch event to notify other components
    window.dispatchEvent(new Event('sessionUpdated'));
  };

  if (!currentSession) {
    return null;
  }

  return (
    <Link 
      href={`/session/${currentSession}`}
      className="hover:text-[var(--app-fg)] flex items-center gap-2"
    >
      🎲 Minha Sessão
    </Link>
  );
}
