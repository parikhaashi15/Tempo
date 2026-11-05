import { CalendarMeeting, DailyGoal } from '../types';
import { soundEngine } from './audioService';

export interface ActiveAlert {
  id: string;
  title: string;
  message: string;
  type: 'meeting' | 'goal' | 'timer';
  timestamp: number;
}

class NotificationService {
  private listeners: ((alerts: ActiveAlert[]) => void)[] = [];
  private activeAlerts: ActiveAlert[] = [];
  private notifiedIds = new Set<string>();

  constructor() {
    this.checkAlertsRoutine();
  }

  // Request browser notifications
  async requestPermission(): Promise<boolean> {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return false;
    }
    try {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    } catch {
      return false;
    }
  }

  hasPermission(): boolean {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return false;
    }
    return Notification.permission === 'granted';
  }

  subscribe(listener: (alerts: ActiveAlert[]) => void) {
    this.listeners.push(listener);
    listener([...this.activeAlerts]);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private emit() {
    this.listeners.forEach(l => l([...this.activeAlerts]));
  }

  dismissAlert(id: string) {
    this.activeAlerts = this.activeAlerts.filter(a => a.id !== id);
    this.emit();
  }

  triggerAlert(title: string, message: string, type: 'meeting' | 'goal' | 'timer') {
    const alert: ActiveAlert = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      title,
      message,
      type,
      timestamp: Date.now(),
    };

    // Add to in-app banner queue
    this.activeAlerts.unshift(alert);
    // Limit to 3 concurrent banners
    if (this.activeAlerts.length > 3) {
      this.activeAlerts = this.activeAlerts.slice(0, 3);
    }
    this.emit();

    // Play subtle chime
    soundEngine.playChime(0.4);

    // Also trigger system notification if allowed
    if (this.hasPermission()) {
      try {
        new Notification(title, {
          body: message,
          icon: '/favicon.ico',
        });
      } catch {
        // Ignore fallback
      }
    }
  }

  // Routine check for upcoming meetings and daily goals approaching target time
  checkMeetingsAndGoals(meetings: CalendarMeeting[], goals: DailyGoal[]) {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    // 1. Check Meetings
    meetings.forEach(meeting => {
      if (meeting.startDate !== todayStr) return;
      const [h, m] = meeting.startTime.split(':').map(Number);
      const meetingMinutes = h * 60 + m;
      const reminderOffset = meeting.reminderMinutesBefore || 10;
      const alertTimeMinutes = meetingMinutes - reminderOffset;

      const alertKey = `meeting-${meeting.id}-${meeting.startTime}`;
      if (
        currentMinutes >= alertTimeMinutes &&
        currentMinutes <= meetingMinutes + 5 &&
        !this.notifiedIds.has(alertKey)
      ) {
        this.notifiedIds.add(alertKey);
        const minutesDiff = meetingMinutes - currentMinutes;
        const timeText = minutesDiff <= 0 ? 'Starting now!' : `in ${minutesDiff} minute${minutesDiff > 1 ? 's' : ''}`;
        
        this.triggerAlert(
          `Upcoming Meeting: ${meeting.title}`,
          `Starts ${timeText} at ${meeting.startTime}${meeting.location ? ` (${meeting.location})` : ''}`,
          'meeting'
        );
      }
    });

    // 2. Check Daily Goals approaching target time
    goals.forEach(goal => {
      if (goal.isCompleted || goal.targetDate !== todayStr || !goal.targetTime) return;
      const [gh, gm] = goal.targetTime.split(':').map(Number);
      const goalMinutes = gh * 60 + gm;
      const alertKey = `goal-${goal.id}-${goal.targetTime}`;

      // Alert 15 minutes before target completion time
      if (
        currentMinutes >= goalMinutes - 15 &&
        currentMinutes <= goalMinutes &&
        !this.notifiedIds.has(alertKey)
      ) {
        this.notifiedIds.add(alertKey);
        this.triggerAlert(
          `Goal Target Approaching: ${goal.text}`,
          `Target time is ${goal.targetTime}. 15 minutes remaining to wrap up!`,
          'goal'
        );
      }
    });
  }

  private checkAlertsRoutine() {
    if (typeof window === 'undefined') return;
    // Check every 30 seconds
    setInterval(() => {
      // Storage service will trigger checkMeetingsAndGoals periodically
    }, 30000);
  }
}

export const notificationService = new NotificationService();
