import { useState, useEffect, useCallback } from 'react';
import {
  Task,
  DailyGoal,
  CalendarMeeting,
  TimerSettings,
  ThemeConfig,
  StudyStats,
  CanvasAssignment,
  QuickNote,
} from './types';
import { storage } from './services/storageService';
import {
  initGoogleAuth,
  googleSignIn,
  googleSignOut,
  fetchGoogleCalendarEvents,
  insertGoogleCalendarEvent,
} from './services/googleCalendarService';
import { notificationService } from './services/notificationService';
import { convertCanvasToTask } from './services/canvasService';
import { Navbar } from './components/Navbar';
import { DailyGoalsSection } from './components/DailyGoalsSection';
import { StudyHubSection } from './components/StudyHubSection';
import { TaskPlannerSection } from './components/TaskPlannerSection';
import { MeetingCalendarSection } from './components/MeetingCalendarSection';
import { CanvasConnectModal } from './components/CanvasConnectModal';
import { ThemeCustomizerModal } from './components/ThemeCustomizerModal';
import { AlertBanner } from './components/AlertBanner';
import { FloatingQuickNotes } from './components/FloatingQuickNotes';
import { User } from 'firebase/auth';

export default function App() {
  // Navigation & Active View
  const [activeTab, setActiveTab] = useState<'planner' | 'goals' | 'study' | 'calendar'>('planner');

  // Application Data State
  const [tasks, setTasks] = useState<Task[]>([]);
  const [goals, setGoals] = useState<DailyGoal[]>([]);
  const [meetings, setMeetings] = useState<CalendarMeeting[]>([]);
  const [timerSettings, setTimerSettings] = useState<TimerSettings>(storage.getTimerSettings());
  const [studyStats, setStudyStats] = useState<StudyStats>(storage.getStudyStats());
  const [theme, setTheme] = useState<ThemeConfig>(storage.getTheme());
  const [canvasConfig, setCanvasConfig] = useState(storage.getCanvasConfig());
  const [quickNotes, setQuickNotes] = useState<QuickNote[]>([]);

  // Google Calendar Auth
  const [googleUser, setGoogleUser] = useState<User | null>(null);
  const [googleAccessToken, setGoogleAccessToken] = useState<string | null>(null);

  // Modals
  const [isThemeOpen, setIsThemeOpen] = useState(false);
  const [isCanvasOpen, setIsCanvasOpen] = useState(false);

  // Study timer focused task
  const [activeFocusTask, setActiveFocusTask] = useState<Task | DailyGoal | null>(null);

  // Notification state
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);

  // 1. Initial State Load & Theme Bootstrap
  useEffect(() => {
    const loadedTheme = storage.getTheme();
    setTheme(loadedTheme);
    storage.saveTheme(loadedTheme);

    setTasks(storage.getTasks());
    setGoals(storage.getDailyGoals());
    setMeetings(storage.getMeetings());
    setTimerSettings(storage.getTimerSettings());
    setStudyStats(storage.getStudyStats());
    setCanvasConfig(storage.getCanvasConfig());
    setQuickNotes(storage.getQuickNotes());

    setNotificationsEnabled(notificationService.hasPermission());
  }, []);

  // 2. Google Workspace Auth Listener
  useEffect(() => {
    const unsubscribe = initGoogleAuth(
      (user, token) => {
        setGoogleUser(user);
        setGoogleAccessToken(token);
        // Automatically fetch live Google Calendar events
        syncGoogleEvents(token);
      },
      () => {
        setGoogleUser(null);
        setGoogleAccessToken(null);
      }
    );
    return () => unsubscribe();
  }, []);

  // Fetch Google Calendar events and merge into local meetings
  const syncGoogleEvents = async (token: string) => {
    try {
      const gcalEvents = await fetchGoogleCalendarEvents(token);
      if (gcalEvents.length > 0) {
        setMeetings(prev => {
          // Remove old google events and replace with fresh ones
          const nonGoogle = prev.filter(m => !m.isGoogleEvent);
          const combined = [...nonGoogle, ...gcalEvents];
          storage.saveMeetings(combined);
          return combined;
        });
      }
    } catch (err) {
      console.warn('Could not sync Google Calendar events:', err);
    }
  };

  // 3. Periodic Notification Checks for upcoming meetings & goals
  useEffect(() => {
    const checkTimer = setInterval(() => {
      notificationService.checkMeetingsAndGoals(meetings, goals);
    }, 15000);
    return () => clearInterval(checkTimer);
  }, [meetings, goals]);

  // Request browser notification permission
  const handleToggleNotifications = async () => {
    if (!notificationsEnabled) {
      const granted = await notificationService.requestPermission();
      setNotificationsEnabled(granted);
      if (granted) {
        notificationService.triggerAlert(
          'Notifications Active',
          'Tempo will alert you prior to meetings and as daily goal targets approach.',
          'timer'
        );
      }
    } else {
      notificationService.triggerAlert(
        'In-App Alerts Active',
        'In-app alert banners and chimes will continue to notify you prior to meetings.',
        'timer'
      );
    }
  };

  // Google Sign-In
  const handleGoogleSignIn = async () => {
    try {
      const result = await googleSignIn();
      if (result) {
        setGoogleUser(result.user);
        setGoogleAccessToken(result.accessToken);
        await syncGoogleEvents(result.accessToken);
        notificationService.triggerAlert(
          'Google Calendar Connected',
          'Classes and scheduled meetings are now synced live.',
          'meeting'
        );
      }
    } catch (e: any) {
      console.error('Google Sign-In failed:', e);
    }
  };

  // Google Sign-Out
  const handleGoogleSignOut = async () => {
    const confirmed = window.confirm('Disconnect Google Calendar from Tempo?');
    if (!confirmed) return;
    await googleSignOut();
    setGoogleUser(null);
    setGoogleAccessToken(null);
    // Remove google events from state
    setMeetings(prev => {
      const filtered = prev.filter(m => !m.isGoogleEvent);
      storage.saveMeetings(filtered);
      return filtered;
    });
  };

  // Task Handlers
  const handleToggleTask = useCallback((id: string) => {
    setTasks(prev => {
      const next = prev.map(t =>
        t.id === id ? { ...t, isCompleted: !t.isCompleted, completedAt: !t.isCompleted ? new Date().toISOString() : undefined } : t
      );
      storage.saveTasks(next);
      return next;
    });
  }, []);

  const handleAddTask = (taskData: Omit<Task, 'id' | 'createdAt'>) => {
    const newTask: Task = {
      ...taskData,
      id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      createdAt: new Date().toISOString(),
    };
    const next = [newTask, ...tasks];
    setTasks(next);
    storage.saveTasks(next);

    notificationService.triggerAlert(
      'Task Added',
      `"${newTask.title}" added to your study planner.`,
      'timer'
    );
  };

  const handleDeleteTask = (id: string) => {
    const next = tasks.filter(t => t.id !== id);
    setTasks(next);
    storage.saveTasks(next);
  };

  const handleToggleSubtask = (taskId: string, subtaskId: string) => {
    setTasks(prev => {
      const next = prev.map(t => {
        if (t.id === taskId) {
          const nextSubtasks = t.subtasks.map(st =>
            st.id === subtaskId ? { ...st, completed: !st.completed } : st
          );
          return { ...t, subtasks: nextSubtasks };
        }
        return t;
      });
      storage.saveTasks(next);
      return next;
    });
  };

  // Daily Goal Handlers
  const handleToggleGoal = (id: string) => {
    setGoals(prev => {
      const next = prev.map(g =>
        g.id === id ? { ...g, isCompleted: !g.isCompleted, completedAt: !g.isCompleted ? new Date().toISOString() : undefined } : g
      );
      storage.saveDailyGoals(next);
      return next;
    });
  };

  const handleAddGoal = (text: string, targetTime: string, linkedTaskId?: string) => {
    const newGoal: DailyGoal = {
      id: `goal-${Date.now()}`,
      text,
      targetTime,
      targetDate: new Date().toISOString().split('T')[0],
      isCompleted: false,
      linkedTaskId,
    };
    const next = [...goals, newGoal];
    setGoals(next);
    storage.saveDailyGoals(next);

    notificationService.triggerAlert(
      'Daily Target Set',
      `Goal: "${text}" due by ${targetTime}.`,
      'goal'
    );
  };

  const handleDeleteGoal = (id: string) => {
    const next = goals.filter(g => g.id !== id);
    setGoals(next);
    storage.saveDailyGoals(next);
  };

  // Meeting Handlers
  const handleAddMeeting = async (meetingData: Omit<CalendarMeeting, 'id'>) => {
    let googleEventId: string | undefined;

    // If sync to Google Calendar is requested and user is connected
    if (meetingData.isGoogleEvent && googleAccessToken) {
      try {
        googleEventId = await insertGoogleCalendarEvent(googleAccessToken, {
          summary: meetingData.title,
          description: meetingData.description,
          startDate: meetingData.startDate,
          startTime: meetingData.startTime,
          endDate: meetingData.endDate,
          endTime: meetingData.endTime,
          location: meetingData.location,
          meetingLink: meetingData.meetingLink,
          reminderMinutes: meetingData.reminderMinutesBefore,
        });
      } catch (e) {
        console.warn('Could not insert event into Google Calendar:', e);
      }
    }

    const newMeeting: CalendarMeeting = {
      ...meetingData,
      id: `meeting-${Date.now()}`,
      googleEventId,
    };

    const next = [newMeeting, ...meetings];
    setMeetings(next);
    storage.saveMeetings(next);

    notificationService.triggerAlert(
      'Meeting Scheduled',
      `"${newMeeting.title}" at ${newMeeting.startTime}. Alert scheduled ${newMeeting.reminderMinutesBefore}m prior.`,
      'meeting'
    );
  };

  const handleDeleteMeeting = (id: string) => {
    const next = meetings.filter(m => m.id !== id);
    setMeetings(next);
    storage.saveMeetings(next);
  };

  // Canvas import
  const handleImportCanvasAssignments = (assignments: CanvasAssignment[]) => {
    const newTasks = assignments.map(convertCanvasToTask);
    const existingIds = new Set(tasks.map(t => t.canvasAssignmentId).filter(Boolean));
    const uniqueNew = newTasks.filter(t => !existingIds.has(t.canvasAssignmentId));

    const combined = [...uniqueNew, ...tasks];
    setTasks(combined);
    storage.saveTasks(combined);

    notificationService.triggerAlert(
      'Canvas Assignments Synced',
      `Imported ${uniqueNew.length} assignments to your study planner.`,
      'timer'
    );
  };

  // Quick Notes Handlers
  const handleAddQuickNote = (content: string, color: QuickNote['color'], isPinned?: boolean) => {
    const newNote: QuickNote = {
      id: `note-${Date.now()}`,
      content,
      color,
      isPinned,
      createdAt: new Date().toISOString(),
    };
    const next = [newNote, ...quickNotes];
    setQuickNotes(next);
    storage.saveQuickNotes(next);
  };

  const handleDeleteQuickNote = (id: string) => {
    const next = quickNotes.filter(n => n.id !== id);
    setQuickNotes(next);
    storage.saveQuickNotes(next);
  };

  const handleTogglePinQuickNote = (id: string) => {
    const next = quickNotes.map(n => (n.id === id ? { ...n, isPinned: !n.isPinned } : n));
    setQuickNotes(next);
    storage.saveQuickNotes(next);
  };

  const handleConvertNoteToTask = (note: QuickNote) => {
    const lines = note.content.split('\n').filter(Boolean);
    const title = lines[0]?.slice(0, 80) || 'Converted Note';
    const description = note.content.length > 80 || lines.length > 1 ? note.content : undefined;

    handleAddTask({
      title,
      description,
      category: 'offline',
      priority: 'medium',
      isCompleted: false,
      estimatedMinutes: 30,
      subtasks: [],
    });

    notificationService.triggerAlert(
      'Note Converted to Task',
      `"${title}" added to your study planner.`,
      'timer'
    );
  };

  // Switch to study timer on a specific task or goal
  const handleStartFocus = (item: Task | DailyGoal) => {
    setActiveFocusTask(item);
    setActiveTab('study');
  };

  // Theme update
  const handleUpdateTheme = (newTheme: ThemeConfig) => {
    setTheme(newTheme);
    storage.saveTheme(newTheme);
  };

  // Timer settings update
  const handleUpdateTimerSettings = (newSettings: TimerSettings) => {
    setTimerSettings(newSettings);
    storage.saveTimerSettings(newSettings);
  };

  // Study stats update
  const handleUpdateStudyStats = (newStats: StudyStats) => {
    setStudyStats(newStats);
    storage.saveStudyStats(newStats);
  };

  // Paper texture class
  const paperClass =
    theme.paperTexture === 'grid'
      ? 'paper-grid'
      : theme.paperTexture === 'dots'
      ? 'paper-dots'
      : '';

  return (
    <div className={`min-h-screen flex flex-col ${paperClass} transition-colors duration-200`}>
      {/* Alert Banner / Notification Toasts */}
      <AlertBanner />

      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenQuickAdd={() => {
          setActiveTab('planner');
        }}
        onOpenTheme={() => setIsThemeOpen(true)}
        onOpenCanvas={() => setIsCanvasOpen(true)}
        googleUser={googleUser}
        onGoogleSignIn={handleGoogleSignIn}
        onGoogleSignOut={handleGoogleSignOut}
        notificationsEnabled={notificationsEnabled}
        onToggleNotifications={handleToggleNotifications}
        canvasConnected={canvasConfig.isConnected}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-8">
        {/* View: Tasks & Planner (Default Dashboard) */}
        {activeTab === 'planner' && (
          <div className="space-y-8 animate-in fade-in">
            {/* Today's Goals Section always prominently featured */}
            <DailyGoalsSection
              goals={goals}
              tasks={tasks}
              onToggleGoal={handleToggleGoal}
              onAddGoal={handleAddGoal}
              onDeleteGoal={handleDeleteGoal}
              onStartFocusOnGoal={handleStartFocus}
            />

            {/* Offline and Unified Task Planner */}
            <div>
              <div className="mb-3">
                <h3 className="text-base font-bold text-[var(--theme-text-primary)] font-['Plus_Jakarta_Sans']">
                  Tasks & Assignments Stream
                </h3>
                <p className="text-xs text-[var(--theme-text-muted)]">
                  Unified view of paper offline tasks, Canvas LMS homework, and scheduled study blocks.
                </p>
              </div>

              <TaskPlannerSection
                tasks={tasks}
                onToggleTask={handleToggleTask}
                onAddTask={handleAddTask}
                onDeleteTask={handleDeleteTask}
                onToggleSubtask={handleToggleSubtask}
                onStartFocus={handleStartFocus}
              />
            </div>
          </div>
        )}

        {/* View: Daily Goals Dedicated Full View */}
        {activeTab === 'goals' && (
          <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in">
            <DailyGoalsSection
              goals={goals}
              tasks={tasks}
              onToggleGoal={handleToggleGoal}
              onAddGoal={handleAddGoal}
              onDeleteGoal={handleDeleteGoal}
              onStartFocusOnGoal={handleStartFocus}
            />

            {/* Accompanying Daily Tips */}
            <div className="p-5 rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-surface)] text-xs text-[var(--theme-text-muted)] space-y-2">
              <h4 className="font-bold text-[var(--theme-text-primary)] text-sm">
                The Science of Target Time Goals
              </h4>
              <p>
                Parkinson&apos;s Law states that work expands to fill the time available for its completion. By specifying an explicit target time (e.g. &quot;Done by 4:00 PM&quot;) instead of a vague &quot;sometime today&quot;, your brain creates an urgency buffer that prevents procrastination and study burnout.
              </p>
            </div>
          </div>
        )}

        {/* View: Study Hub & Timer */}
        {activeTab === 'study' && (
          <div className="max-w-4xl mx-auto animate-in fade-in">
            <StudyHubSection
              settings={timerSettings}
              onUpdateSettings={handleUpdateTimerSettings}
              stats={studyStats}
              onUpdateStats={handleUpdateStudyStats}
              tasks={tasks}
              goals={goals}
              activeTask={activeFocusTask}
              onClearActiveTask={() => setActiveFocusTask(null)}
            />
          </div>
        )}

        {/* View: Schedule & Meetings */}
        {activeTab === 'calendar' && (
          <div className="max-w-4xl mx-auto animate-in fade-in">
            <MeetingCalendarSection
              meetings={meetings}
              onAddMeeting={handleAddMeeting}
              onDeleteMeeting={handleDeleteMeeting}
              isGoogleConnected={!!googleUser}
              onConnectGoogle={handleGoogleSignIn}
            />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-[var(--theme-border)] bg-[var(--theme-surface)]/60 py-6 text-center text-xs text-[var(--theme-text-muted)]">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-bold text-[var(--theme-text-primary)] font-['Plus_Jakarta_Sans']">Tempo</span>
            <span>·</span>
            <span>Lo-Fi Student Task & Study Hub</span>
          </div>

          <div className="flex items-center gap-4 text-[11px]">
            <span>Google Calendar Sync</span>
            <span>·</span>
            <span>Canvas LMS Connect</span>
            <span>·</span>
            <span>Offline Tasks</span>
            <span>·</span>
            <span>Pomodoro & Flowtime</span>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <ThemeCustomizerModal
        isOpen={isThemeOpen}
        onClose={() => setIsThemeOpen(false)}
        theme={theme}
        onUpdateTheme={handleUpdateTheme}
      />

      <CanvasConnectModal
        isOpen={isCanvasOpen}
        onClose={() => setIsCanvasOpen(false)}
        onImportAssignments={handleImportCanvasAssignments}
        savedDomain={canvasConfig.domain}
        savedToken={canvasConfig.token}
        onSaveConfig={cfg => {
          setCanvasConfig(cfg);
          storage.saveCanvasConfig(cfg);
        }}
      />

      {/* Floating Quick Notes Component */}
      <FloatingQuickNotes
        notes={quickNotes}
        onAddNote={handleAddQuickNote}
        onDeleteNote={handleDeleteQuickNote}
        onTogglePin={handleTogglePinQuickNote}
        onConvertToTask={handleConvertNoteToTask}
      />
    </div>
  );
}
