import React, { useEffect, useState } from 'react';
import { notificationService, ActiveAlert } from '../services/notificationService';
import { Bell, X, Calendar, Target, Clock } from 'lucide-react';

export const AlertBanner: React.FC = () => {
  const [alerts, setAlerts] = useState<ActiveAlert[]>([]);

  useEffect(() => {
    const unsubscribe = notificationService.subscribe(newAlerts => {
      setAlerts(newAlerts);
    });
    return unsubscribe;
  }, []);

  if (alerts.length === 0) return null;

  return (
    <div className="fixed top-16 right-4 z-40 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {alerts.map(alert => {
        const isMeeting = alert.type === 'meeting';
        return (
          <div
            key={alert.id}
            className="pointer-events-auto p-3.5 rounded-xl border border-[var(--theme-border)] bg-[var(--theme-surface)] shadow-lg animate-in slide-in-from-top-2 flex items-start gap-3 transition-all"
          >
            <div className="p-2 rounded-lg bg-[var(--theme-accent-soft)] text-[var(--theme-accent)] shrink-0">
              {isMeeting ? <Calendar className="w-4 h-4" /> : <Target className="w-4 h-4" />}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-1">
                <span className="text-xs font-bold text-[var(--theme-text-primary)] truncate">
                  {alert.title}
                </span>
                <button
                  onClick={() => notificationService.dismissAlert(alert.id)}
                  className="text-[var(--theme-text-muted)] hover:text-[var(--theme-text-primary)] p-0.5"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <p className="text-[11px] text-[var(--theme-text-muted)] mt-0.5 leading-snug">
                {alert.message}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
};
