'use client';

import React from 'react';

const LS_KEY = 'tn_dark_mode';

export function DarkModeToggle() {
  const [dark, setDark] = React.useState<boolean>(false);

  React.useEffect(() => {
    try {
      const saved = localStorage.getItem(LS_KEY);
      const isDark = saved === '1';
      setDark(isDark);
      if (typeof document !== 'undefined') {
        document.body.classList.toggle('theme-dark', isDark);
      }
    } catch {}
  }, []);

  function toggle() {
    setDark((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(LS_KEY, next ? '1' : '0');
      } catch {}
      if (typeof document !== 'undefined') {
        document.body.classList.toggle('theme-dark', next);
      }
      return next;
    });
  }

  const icon = dark ? '☀️' : '🌙';
  const label = dark ? 'Switch to light mode' : 'Switch to dark mode';

  return (
    <button
      aria-label={label}
      onClick={toggle}
      className="fixed bottom-3 right-3 z-50 h-9 w-9 rounded-full bg-transparent text-xl cursor-pointer transition hover:brightness-90"
      title={label}
    >
      <span role="img" aria-hidden>
        {icon}
      </span>
    </button>
  );
}

