import {
  Task,
  DailyGoal,
  CalendarMeeting,
  TimerSettings,
  ThemeConfig,
  StudyStats,
  QuickNote,
} from '../types';

const STORAGE_KEYS = {
  TASKS: 'tempo_tasks_v1',
  DAILY_GOALS: 'tempo_daily_goals_v1',
  MEETINGS: 'tempo_meetings_v1',
  TIMER_SETTINGS: 'tempo_timer_settings_v1',
  THEME: 'tempo_theme_config_v1',
  STUDY_STATS: 'tempo_study_stats_v1',
  CANVAS_CONFIG: 'tempo_canvas_config_v1',
  QUICK_NOTES: 'tempo_quick_notes_v1',
};

// Initial default theme
export const DEFAULT_THEME: ThemeConfig = {
  preset: 'matcha',
  isDark: false,
  paperTexture: 'grid',
  fontStyle: 'sans',
  cardRadius: 'modern',
};

// Initial default timer settings
export const DEFAULT_TIMER_SETTINGS: TimerSettings = {
  method: 'pomodoro',
  pomodoroFocusMinutes: 25,
  pomodoroShortBreakMinutes: 5,
  pomodoroLongBreakMinutes: 15,
  cyclesBeforeLongBreak: 4,
  autoStartBreaks: false,
  autoStartPomodoros: false,
  soundEnabled: true,
  soundVolume: 0.6,
  ambientNoise: 'none',
  ambientVolume: 0.3,
  timerBackground: {
    type: 'chicago_fireplace',
    dimLevel: 0.50,
    blur: 0,
  },
};

// Seed realistic tasks for students
const getSeedTasks = (): Task[] => {
  const today = new Date().toISOString().split('T')[0];
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];

  return [
    {
      id: 'task-offline-1',
      title: 'Read Biology Chapter 7: Cell Respiration (pages 142–168)',
      description: 'Highlight key diagrams on ATP synthesis and take Cornell notes in notebook.',
      category: 'offline',
      courseName: 'BIO 81',
      dueDate: today,
      dueTime: '16:00',
      priority: 'high',
      isCompleted: false,
      estimatedMinutes: 45,
      subtasks: [
        { id: 'st1', title: 'Read Glycolysis section & summarize ATP yield', completed: true },
        { id: 'st2', title: 'Sketch Krebs Cycle intermediate steps', completed: false },
        { id: 'st3', title: 'Review end-of-chapter practice questions 1–8', completed: false },
      ],
      createdAt: new Date().toISOString(),
    },
    {
      id: 'task-canvas-1',
      title: 'CS 106A Assignment 4: Breakout Ball Collision Physics',
      description: 'Implement paddle bounce vector reflection and brick grid array detection.',
      category: 'canvas',
      courseName: 'CS 106A',
      dueDate: today,
      dueTime: '23:59',
      priority: 'high',
      isCompleted: false,
      estimatedMinutes: 60,
      canvasUrl: 'https://canvas.instructure.com',
      subtasks: [
        { id: 'cst1', title: 'Fix horizontal edge boundary clipping', completed: true },
        { id: 'cst2', title: 'Test sound effect trigger on brick hit', completed: false },
      ],
      createdAt: new Date().toISOString(),
    },
    {
      id: 'task-offline-2',
      title: 'Handwrite Math 51 Problem Set 6 Matrix Proofs',
      description: 'Complete problem set on engineering paper using pencil, show all row reduction steps.',
      category: 'offline',
      courseName: 'MATH 51',
      dueDate: tomorrow,
      dueTime: '17:00',
      priority: 'medium',
      isCompleted: false,
      estimatedMinutes: 50,
      subtasks: [
        { id: 'mst1', title: 'Solve problems 1–4: Eigenvectors and null spaces', completed: false },
        { id: 'mst2', title: 'Solve problem 5: Diagonalization proof', completed: false },
      ],
      createdAt: new Date().toISOString(),
    },
    {
      id: 'task-personal-1',
      title: 'Organize desk workspace and prep backpack for tomorrow',
      description: 'Clear loose lecture handouts, charge graphing calculator, pack water bottle.',
      category: 'personal',
      dueDate: today,
      dueTime: '21:00',
      priority: 'low',
      isCompleted: true,
      completedAt: new Date().toISOString(),
      subtasks: [],
      createdAt: new Date().toISOString(),
    },
  ];
};

// Seed realistic daily goals with specific target times
const getSeedDailyGoals = (): DailyGoal[] => {
  const today = new Date().toISOString().split('T')[0];

  return [
    {
      id: 'goal-1',
      text: 'Finish Biology Chapter 7 reading & sketch ATP diagram',
      targetTime: '16:00',
      targetDate: today,
      isCompleted: false,
      linkedTaskId: 'task-offline-1',
    },
    {
      id: 'goal-2',
      text: 'Debug Breakout collision logic for CS 106A',
      targetTime: '18:30',
      targetDate: today,
      isCompleted: false,
      linkedTaskId: 'task-canvas-1',
    },
    {
      id: 'goal-3',
      text: 'Log 3 Pomodoro study blocks without opening social media',
      targetTime: '20:00',
      targetDate: today,
      isCompleted: true,
      completedAt: new Date(Date.now() - 3600000).toISOString(),
    },
  ];
};

// Seed realistic meetings / classes
const getSeedMeetings = (): CalendarMeeting[] => {
  const today = new Date().toISOString().split('T')[0];
  const now = new Date();
  const currentHour = now.getHours();

  // Create meeting later today
  const meetingHour = Math.min(Math.max(currentHour + 2, 11), 20);
  const startTime = `${String(meetingHour).padStart(2, '0')}:00`;
  const endTime = `${String(meetingHour + 1).padStart(2, '0')}:00`;

  return [
    {
      id: 'meeting-1',
      title: 'CS 106A Section Discussion with TA Jordan',
      description: 'Go over Breakout assignment common pitfalls and memory management.',
      startDate: today,
      startTime,
      endDate: today,
      endTime,
      location: 'Gates Computer Science Room 104',
      meetingLink: 'https://meet.google.com/study-hub',
      reminderMinutesBefore: 15,
      isGoogleEvent: false,
    },
    {
      id: 'meeting-2',
      title: 'Math 51 Study Group: PSet 6 Review',
      description: 'Review eigenvalues and discuss problem 5 proof with Sarah and Liam.',
      startDate: today,
      startTime: '19:00',
      endDate: today,
      endTime: '20:30',
      location: 'Green Library 2nd Floor Study Room B',
      reminderMinutesBefore: 10,
      isGoogleEvent: false,
    },
  ];
};

export const storage = {
  getTasks(): Task[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.TASKS);
      if (!data) {
        const seed = getSeedTasks();
        this.saveTasks(seed);
        return seed;
      }
      return JSON.parse(data);
    } catch {
      return getSeedTasks();
    }
  },

  saveTasks(tasks: Task[]) {
    try {
      localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));
    } catch (e) {
      console.warn('Storage error saving tasks:', e);
    }
  },

  getDailyGoals(): DailyGoal[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.DAILY_GOALS);
      if (!data) {
        const seed = getSeedDailyGoals();
        this.saveDailyGoals(seed);
        return seed;
      }
      return JSON.parse(data);
    } catch {
      return getSeedDailyGoals();
    }
  },

  saveDailyGoals(goals: DailyGoal[]) {
    try {
      localStorage.setItem(STORAGE_KEYS.DAILY_GOALS, JSON.stringify(goals));
    } catch (e) {
      console.warn('Storage error saving daily goals:', e);
    }
  },

  getMeetings(): CalendarMeeting[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.MEETINGS);
      if (!data) {
        const seed = getSeedMeetings();
        this.saveMeetings(seed);
        return seed;
      }
      return JSON.parse(data);
    } catch {
      return getSeedMeetings();
    }
  },

  saveMeetings(meetings: CalendarMeeting[]) {
    try {
      localStorage.setItem(STORAGE_KEYS.MEETINGS, JSON.stringify(meetings));
    } catch (e) {
      console.warn('Storage error saving meetings:', e);
    }
  },

  getTimerSettings(): TimerSettings {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.TIMER_SETTINGS);
      if (!data) return DEFAULT_TIMER_SETTINGS;
      return { ...DEFAULT_TIMER_SETTINGS, ...JSON.parse(data) };
    } catch {
      return DEFAULT_TIMER_SETTINGS;
    }
  },

  saveTimerSettings(settings: TimerSettings) {
    try {
      localStorage.setItem(STORAGE_KEYS.TIMER_SETTINGS, JSON.stringify(settings));
    } catch (e) {
      console.warn('Storage error saving timer settings:', e);
    }
  },

  getTheme(): ThemeConfig {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.THEME);
      if (!data) return DEFAULT_THEME;
      return { ...DEFAULT_THEME, ...JSON.parse(data) };
    } catch {
      return DEFAULT_THEME;
    }
  },

  saveTheme(theme: ThemeConfig) {
    try {
      localStorage.setItem(STORAGE_KEYS.THEME, JSON.stringify(theme));
      // Apply theme preset and dark class immediately to documentElement
      document.documentElement.setAttribute('data-preset', theme.preset);
      if (theme.isDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    } catch (e) {
      console.warn('Storage error saving theme:', e);
    }
  },

  getStudyStats(): StudyStats {
    const today = new Date().toISOString().split('T')[0];
    try {
      const data = localStorage.getItem(STORAGE_KEYS.STUDY_STATS);
      if (!data) {
        return {
          focusMinutesToday: 50,
          sessionsCompletedToday: 2,
          lastActiveDate: today,
          studyLogs: [
            {
              id: 'log-1',
              timestamp: new Date(Date.now() - 7200000).toISOString(),
              taskTitle: 'CS 106A Assignment 4',
              durationMinutes: 25,
              method: 'pomodoro',
            },
            {
              id: 'log-2',
              timestamp: new Date(Date.now() - 3600000).toISOString(),
              taskTitle: 'Bio Chapter 7 Reading',
              durationMinutes: 25,
              method: 'pomodoro',
            },
          ],
        };
      }
      const parsed: StudyStats = JSON.parse(data);
      // Reset daily counts if day changed
      if (parsed.lastActiveDate !== today) {
        parsed.focusMinutesToday = 0;
        parsed.sessionsCompletedToday = 0;
        parsed.lastActiveDate = today;
      }
      return parsed;
    } catch {
      return {
        focusMinutesToday: 0,
        sessionsCompletedToday: 0,
        lastActiveDate: today,
        studyLogs: [],
      };
    }
  },

  saveStudyStats(stats: StudyStats) {
    try {
      localStorage.setItem(STORAGE_KEYS.STUDY_STATS, JSON.stringify(stats));
    } catch (e) {
      console.warn('Storage error saving study stats:', e);
    }
  },

  getCanvasConfig(): { domain: string; token: string; isConnected: boolean; icalUrl: string } {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CANVAS_CONFIG);
      if (!data) {
        return {
          domain: 'canvas.instructure.com',
          token: '',
          isConnected: false,
          icalUrl: '',
        };
      }
      return JSON.parse(data);
    } catch {
      return {
        domain: 'canvas.instructure.com',
        token: '',
        isConnected: false,
        icalUrl: '',
      };
    }
  },

  saveCanvasConfig(cfg: { domain: string; token: string; isConnected: boolean; icalUrl: string }) {
    try {
      localStorage.setItem(STORAGE_KEYS.CANVAS_CONFIG, JSON.stringify(cfg));
    } catch (e) {
      console.warn('Storage error saving canvas config:', e);
    }
  },

  getQuickNotes(): QuickNote[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.QUICK_NOTES);
      if (!data) {
        const seed: QuickNote[] = [
          {
            id: 'note-1',
            content: 'TA mentioned on Friday that midterm question 3 focuses on Gram-Schmidt orthogonalization proofs.',
            createdAt: new Date(Date.now() - 3600000).toISOString(),
            color: 'sage',
            isPinned: true,
          },
          {
            id: 'note-2',
            content: 'Buy extra carbon lab notebook & black pens at bookstore before Wednesday 9am lab.',
            createdAt: new Date(Date.now() - 7200000).toISOString(),
            color: 'peach',
          },
        ];
        this.saveQuickNotes(seed);
        return seed;
      }
      return JSON.parse(data);
    } catch {
      return [];
    }
  },

  saveQuickNotes(notes: QuickNote[]) {
    try {
      localStorage.setItem(STORAGE_KEYS.QUICK_NOTES, JSON.stringify(notes));
    } catch (e) {
      console.warn('Storage error saving quick notes:', e);
    }
  },
};
