'use client';

import React from 'react';
import { Notification, NotificationType, subscribe } from '@/src/lib/notifications';

function typeStyles(t: NotificationType): { bg: string; border: string; text: string; icon: string } {
  switch (t) {
    case 'success':
      return { bg: 'bg-green-50', border: 'border-green-300', text: 'text-green-900', icon: '✅' };
    case 'warning':
      return { bg: 'bg-yellow-50', border: 'border-yellow-300', text: 'text-yellow-900', icon: '⚠️' };
    case 'info':
      return { bg: 'bg-blue-50', border: 'border-blue-300', text: 'text-blue-900', icon: 'ℹ️' };
    case 'error':
    default:
      return { bg: 'bg-red-50', border: 'border-red-300', text: 'text-red-900', icon: '⛔' };
  }
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = React.useState<Notification[]>([]);

  React.useEffect(() => {
    const unsub = subscribe((n) => {
      setItems((prev) => [...prev, n]);
      // Auto-dismiss after 5s
      const timeout = setTimeout(() => {
        setItems((prev) => prev.filter((x) => x.id !== n.id));
      }, 5000);
      return () => clearTimeout(timeout);
    });
    return () => {
      unsub();
    };
  }, []);

  function dismiss(id: string) {
    setItems((prev) => prev.filter((x) => x.id !== id));
  }

  return (
    <>
      {children}
      {/* Toast viewport */}
      <div className="fixed top-4 right-4 z-50 flex w-[92vw] max-w-sm flex-col gap-3">
        {items.map((n) => {
          const s = typeStyles(n.type);
          return (
            <div key={n.id} className={`flex items-start gap-3 rounded-md border p-3 shadow ${s.bg} ${s.border} ${s.text}`} role="alert" aria-live="polite">
              <div className="text-lg leading-none">{s.icon}</div>
              <div className="flex-1">
                {n.title && <div className="font-semibold mb-0.5">{n.title}</div>}
                <div className="text-sm whitespace-pre-wrap">{n.message}</div>
              </div>
              <button
                onClick={() => dismiss(n.id)}
                className="ml-2 rounded px-2 text-sm opacity-70 hover:opacity-100"
                aria-label="Dismiss notification"
              >
                ✕
              </button>
            </div>
          );
        })}
      </div>
    </>
  );
}

