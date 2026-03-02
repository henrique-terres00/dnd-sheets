"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function SessionState() {
  const [currentSession, setCurrentSession] = useState<string | null>(null);

  useEffect(() => {
    const loadSession = () => {
      const savedSession = localStorage.getItem('currentSession');
      setCurrentSession(savedSession);
    };

    loadSession();

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'currentSession') {
        setCurrentSession(e.newValue);
      }
    };

    const handleSessionUpdate = () => {
      loadSession();
    };

    const handleVisibilityChange = () => {
      if (!document.hidden) {
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
