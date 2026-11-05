export type TaskCategory = 'offline' | 'canvas' | 'calendar' | 'personal';
export type TaskPriority = 'low' | 'medium' | 'high';

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  category: TaskCategory;
  courseName?: string;
  dueDate?: string; // YYYY-MM-DD
  dueTime?: string; // HH:mm
  priority: TaskPriority;
  isCompleted: boolean;
  completedAt?: string;
  estimatedMinutes?: number;
  subtasks: Subtask[];
  canvasAssignmentId?: string;
  canvasUrl?: string;
  calendarEventId?: string;
  meetingLink?: string;
  location?: string;
  notes?: string;
  createdAt: string;
}

export interface DailyGoal {
  id: string;
  text: string;
  targetTime: string; // "16:30"
  targetDate: string; // YYYY-MM-DD
  isCompleted: boolean;
  completedAt?: string;
  linkedTaskId?: string;
  notes?: string;
}

export type StudyMethod = 
  | 'pomodoro' 
  | 'flowtime' 
  | 'ultradian50_10' 
  | 'deepwork90' 
  | 'feynman' 
  | 'active_recall';

export type TimerBackgroundType = 
  | 'none' 
  | 'chicago_penthouse' 
  | 'chicago_fireplace' 
  | 'chicago_dusk'
  | 'nyc_penthouse' 
  | 'london_penthouse' 
  | 'paris_penthouse' 
  | 'mountain' 
  | 'animated_fireplace'
  | 'custom';

export interface TimerBackgroundConfig {
  type: TimerBackgroundType;
  customUrl?: string;
  dimLevel: number; // 0.2 to 0.85
  blur: number; // 0 to 8
  fireMotion?: boolean; // enable live motion flames and dancing embers
  fireCrackleSound?: boolean; // enable fireplace wood crackle sound
}

export interface TimerSettings {
  method: StudyMethod;
  pomodoroFocusMinutes: number;
  pomodoroShortBreakMinutes: number;
  pomodoroLongBreakMinutes: number;
  cyclesBeforeLongBreak: number;
  autoStartBreaks: boolean;
  autoStartPomodoros: boolean;
  soundEnabled: boolean;
  soundVolume: number;
  ambientNoise: 'none' | 'rain' | 'whitenoise' | 'fireplace';
  ambientVolume: number;
  timerBackground?: TimerBackgroundConfig;
}

export interface StudyStats {
  focusMinutesToday: number;
  sessionsCompletedToday: number;
  lastActiveDate: string;
  studyLogs: {
    id: string;
    timestamp: string;
    taskTitle: string;
    durationMinutes: number;
    method: StudyMethod;
  }[];
}

export type ThemePreset = 'matcha' | 'lavender' | 'peach' | 'nordic' | 'midnight';
export type PaperTexture = 'none' | 'grid' | 'dots';
export type FontStyle = 'sans' | 'mono';
export type CardRadius = 'modern' | 'soft' | 'sharp';

export interface ThemeConfig {
  preset: ThemePreset;
  isDark: boolean;
  paperTexture: PaperTexture;
  fontStyle: FontStyle;
  cardRadius: CardRadius;
}

export interface CanvasCourse {
  id: string;
  name: string;
  courseCode: string;
  color?: string;
}

export interface CanvasAssignment {
  id: string;
  courseId: string;
  courseName: string;
  name: string;
  dueAt?: string;
  pointsPossible?: number;
  htmlUrl?: string;
  hasSubmitted?: boolean;
}

export interface CalendarMeeting {
  id: string;
  title: string;
  description?: string;
  startDate: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endDate: string; // YYYY-MM-DD
  endTime: string; // HH:mm
  location?: string;
  meetingLink?: string;
  reminderMinutesBefore: number; // e.g. 10, 15, 30
  isGoogleEvent?: boolean;
  googleEventId?: string;
  notified?: boolean;
}

export interface FeynmanSession {
  concept: string;
  targetAudience: string;
  explanation: string;
  identifiedGaps: string;
  clarifiedAnalogy: string;
}

export interface QuickNote {
  id: string;
  content: string;
  createdAt: string;
  color?: 'default' | 'sage' | 'peach' | 'lavender';
  isPinned?: boolean;
}

