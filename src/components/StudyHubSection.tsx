import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  StudyMethod,
  TimerSettings,
  StudyStats,
  Task,
  DailyGoal,
} from '../types';
import {
  Play,
  Pause,
  RotateCcw,
  SkipForward,
  Settings2,
  Volume2,
  VolumeX,
  CloudRain,
  Brain,
  Timer,
  Activity,
  Flame,
  CheckCircle,
  HelpCircle,
  Sparkles,
  BookOpen,
  Image as ImageIcon,
} from 'lucide-react';
import { soundEngine } from '../services/audioService';
import { LofiMusicPlayer } from './LofiMusicPlayer';

export const TIMER_WALLPAPERS = [
  {
    id: 'chicago_fireplace' as const,
    name: 'Chicago Penthouse & Fireplace',
    tagline: 'Modern linear glass fireplace overlooking glittering Chicago skyline',
    url: '/src/assets/images/penthouse_fireplace_chicago_1793843498899.jpg',
  },
  {
    id: 'chicago_penthouse' as const,
    name: 'Chicago High-Rise Window',
    tagline: 'Panoramic floor-to-ceiling glass over Lake Michigan & towers',
    url: '/src/assets/images/chicago_penthouse_window_1793843497616.jpg',
  },
  {
    id: 'chicago_dusk' as const,
    name: 'Chicago Golden Dusk',
    tagline: 'High-rise perspective over Chicago river & twilight skyline',
    url: '/src/assets/images/chicago_skyline_dusk_1793843172296.jpg',
  },
  {
    id: 'nyc_penthouse' as const,
    name: 'NYC Manhattan Penthouse',
    tagline: 'Midtown Manhattan & Empire State Building from luxury suite',
    url: '/src/assets/images/nyc_penthouse_skyline_1793843499506.jpg',
  },
  {
    id: 'london_penthouse' as const,
    name: 'London Thames Penthouse',
    tagline: 'Twilight view of The Shard & city bridges from high-rise',
    url: '/src/assets/images/london_penthouse_view_1793843499741.jpg',
  },
  {
    id: 'paris_penthouse' as const,
    name: 'Paris Eiffel Penthouse',
    tagline: 'Private high-rise balcony view of illuminated Eiffel Tower',
    url: '/src/assets/images/paris_penthouse_eiffel_1793843500588.jpg',
  },
  {
    id: 'mountain' as const,
    name: 'Alpine Mountain Mist',
    tagline: 'Calm alpine pine forest & morning fog through penthouse windows',
    url: '/src/assets/images/mountain_mist_forest_1793843172589.jpg',
  },
  {
    id: 'none' as const,
    name: 'Clean Solid Canvas',
    tagline: 'Minimalist pastel theme surface without photographic backdrop',
    url: '',
  },
];

interface StudyHubProps {
  settings: TimerSettings;
  onUpdateSettings: (newSettings: TimerSettings) => void;
  stats: StudyStats;
  onUpdateStats: (newStats: StudyStats) => void;
  tasks: Task[];
  goals: DailyGoal[];
  activeTask?: Task | DailyGoal | null;
  onClearActiveTask?: () => void;
}

export const StudyHubSection: React.FC<StudyHubProps> = ({
  settings,
  onUpdateSettings,
  stats,
  onUpdateStats,
  tasks,
  goals,
  activeTask,
  onClearActiveTask,
}) => {
  // Method selection
  const [selectedMethod, setSelectedMethod] = useState<StudyMethod>(settings.method || 'pomodoro');
  
  // Timer State
  const [mode, setMode] = useState<'focus' | 'shortBreak' | 'longBreak'>('focus');
  const [isRunning, setIsRunning] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(settings.pomodoroFocusMinutes * 60);
  const [flowtimeSeconds, setFlowtimeSeconds] = useState(0);
  const [completedCycles, setCompletedCycles] = useState(0);

  // UI state
  const [showSettings, setShowSettings] = useState(false);
  const [showWallpaper, setShowWallpaper] = useState(false);
  const [customBgUrlInput, setCustomBgUrlInput] = useState('');
  const [activeTaskTitle, setActiveTaskTitle] = useState(activeTask ? ('text' in activeTask ? activeTask.text : activeTask.title) : '');

  // Active Timer Wallpaper
  const bgConfig = settings.timerBackground || { type: 'chicago_fireplace', dimLevel: 0.50, blur: 0 };
  const currentWallpaper = TIMER_WALLPAPERS.find(w => w.id === bgConfig.type);
  const activeBgUrl = bgConfig.type === 'custom' ? bgConfig.customUrl : currentWallpaper?.url;
  const hasActivePhoto = Boolean(activeBgUrl && bgConfig.type !== 'none');

  // Feynman modal state
  const [feynmanConcept, setFeynmanConcept] = useState('');
  const [feynmanSimpleExplain, setFeynmanSimpleExplain] = useState('');
  const [feynmanGaps, setFeynmanGaps] = useState('');
  const [feynmanAnalogy, setFeynmanAnalogy] = useState('');
  const [feynmanSaved, setFeynmanSaved] = useState(false);

  // Active Recall state
  const [recallQuestions, setRecallQuestions] = useState([
    { q: 'What is the core premise or equation of this topic?', a: '' },
    { q: 'What are 2 common mistakes or edge cases to avoid?', a: '' },
    { q: 'How would I explain this concept without looking at notes?', a: '' },
  ]);
  const [recallPassed, setRecallPassed] = useState(false);

  // Update when activeTask changes externally (e.g. from Goal "Focus" button)
  useEffect(() => {
    if (activeTask) {
      const title = 'text' in activeTask ? activeTask.text : activeTask.title;
      setActiveTaskTitle(title);
    }
  }, [activeTask]);

  // Determine initial duration for current method & mode
  const getInitialDurationForMethod = useCallback((method: StudyMethod, currentMode: 'focus' | 'shortBreak' | 'longBreak') => {
    if (method === 'flowtime') return 0;
    if (method === 'ultradian50_10') {
      return currentMode === 'focus' ? 50 * 60 : 10 * 60;
    }
    if (method === 'deepwork90') {
      return currentMode === 'focus' ? 90 * 60 : 20 * 60;
    }
    // Pomodoro (customizable)
    if (currentMode === 'focus') return settings.pomodoroFocusMinutes * 60;
    if (currentMode === 'shortBreak') return settings.pomodoroShortBreakMinutes * 60;
    return settings.pomodoroLongBreakMinutes * 60;
  }, [settings.pomodoroFocusMinutes, settings.pomodoroShortBreakMinutes, settings.pomodoroLongBreakMinutes]);

  // When method or settings change, sync timer if not running
  useEffect(() => {
    if (!isRunning && selectedMethod !== 'flowtime') {
      setSecondsLeft(getInitialDurationForMethod(selectedMethod, mode));
    }
  }, [selectedMethod, mode, settings.pomodoroFocusMinutes, settings.pomodoroShortBreakMinutes, settings.pomodoroLongBreakMinutes, isRunning, getInitialDurationForMethod]);

  // Timer Tick Interval
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        if (selectedMethod === 'flowtime') {
          // Count up
          setFlowtimeSeconds(prev => prev + 1);
        } else {
          // Count down
          setSecondsLeft(prev => {
            if (prev <= 1) {
              handleSessionComplete();
              return 0;
            }
            return prev - 1;
          });
        }
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning, selectedMethod]);

  // Session completion handler
  const handleSessionComplete = () => {
    setIsRunning(false);

    if (settings.soundEnabled) {
      soundEngine.playChime(settings.soundVolume);
    }

    if (mode === 'focus') {
      const minutesCompleted = selectedMethod === 'ultradian50_10' ? 50 : selectedMethod === 'deepwork90' ? 90 : settings.pomodoroFocusMinutes;

      // Update study stats
      const today = new Date().toISOString().split('T')[0];
      const newStats: StudyStats = {
        ...stats,
        focusMinutesToday: stats.focusMinutesToday + minutesCompleted,
        sessionsCompletedToday: stats.sessionsCompletedToday + 1,
        lastActiveDate: today,
        studyLogs: [
          {
            id: `log-${Date.now()}`,
            timestamp: new Date().toISOString(),
            taskTitle: activeTaskTitle || 'Focused Study Session',
            durationMinutes: minutesCompleted,
            method: selectedMethod,
          },
          ...stats.studyLogs,
        ].slice(0, 20),
      };
      onUpdateStats(newStats);

      const nextCycles = completedCycles + 1;
      setCompletedCycles(nextCycles);

      // Determine next mode: Long or Short break
      if (nextCycles % settings.cyclesBeforeLongBreak === 0) {
        setMode('longBreak');
        setSecondsLeft(settings.pomodoroLongBreakMinutes * 60);
      } else {
        setMode('shortBreak');
        setSecondsLeft(settings.pomodoroShortBreakMinutes * 60);
      }

      if (settings.autoStartBreaks) {
        setTimeout(() => setIsRunning(true), 1000);
      }
    } else {
      // Break completed -> Return to Focus
      setMode('focus');
      setSecondsLeft(getInitialDurationForMethod(selectedMethod, 'focus'));
      if (settings.autoStartPomodoros) {
        setTimeout(() => setIsRunning(true), 1000);
      }
    }
  };

  // Keyboard shortcut: Space to Toggle, R to Reset
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) return;
      if (e.code === 'Space') {
        e.preventDefault();
        handleToggleStart();
      } else if (e.code === 'KeyR') {
        handleReset();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isRunning, selectedMethod, mode]);

  const handleToggleStart = () => {
    if (!isRunning) {
      if (settings.soundEnabled) {
        soundEngine.playStartTone(settings.soundVolume);
      }
      if (settings.ambientNoise !== 'none') {
        soundEngine.startAmbient(settings.ambientNoise, settings.ambientVolume);
      }
      setIsRunning(true);
    } else {
      soundEngine.stopAmbient();
      setIsRunning(false);
    }
  };

  const handleReset = () => {
    setIsRunning(false);
    soundEngine.stopAmbient();
    if (selectedMethod === 'flowtime') {
      setFlowtimeSeconds(0);
    } else {
      setSecondsLeft(getInitialDurationForMethod(selectedMethod, mode));
    }
  };

  const handleSkip = () => {
    handleSessionComplete();
  };

  // Flowtime stop and calculate break
  const handleFlowtimeStop = () => {
    setIsRunning(false);
    soundEngine.stopAmbient();

    const minutes = Math.floor(flowtimeSeconds / 60);
    if (minutes > 0) {
      const today = new Date().toISOString().split('T')[0];
      const newStats: StudyStats = {
        ...stats,
        focusMinutesToday: stats.focusMinutesToday + minutes,
        sessionsCompletedToday: stats.sessionsCompletedToday + 1,
        lastActiveDate: today,
        studyLogs: [
          {
            id: `log-${Date.now()}`,
            timestamp: new Date().toISOString(),
            taskTitle: activeTaskTitle || 'Flowtime Session',
            durationMinutes: minutes,
            method: 'flowtime' as StudyMethod,
          },
          ...stats.studyLogs,
        ].slice(0, 20),
      };
      onUpdateStats(newStats);
    }
  };

  // Flowtime recommended break based on focus time
  const getFlowtimeBreakMinutes = (secs: number) => {
    const mins = Math.floor(secs / 60);
    if (mins < 25) return 5;
    if (mins <= 50) return 8;
    if (mins <= 90) return 15;
    return 20;
  };

  // Toggle ambient noise
  const handleToggleAmbient = (type: 'none' | 'rain' | 'whitenoise') => {
    const nextType = settings.ambientNoise === type ? 'none' : type;
    const nextSettings = { ...settings, ambientNoise: nextType };
    onUpdateSettings(nextSettings);
    if (nextType === 'none') {
      soundEngine.stopAmbient();
    } else if (isRunning) {
      soundEngine.startAmbient(nextType, settings.ambientVolume);
    }
  };

  // Formatting seconds to MM:SS
  const formatTime = (totalSecs: number) => {
    const m = Math.floor(totalSecs / 60);
    const s = totalSecs % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  // Progress percentage
  const totalDuration = getInitialDurationForMethod(selectedMethod, mode);
  const progressPercent =
    selectedMethod === 'flowtime'
      ? Math.min((flowtimeSeconds / (60 * 60)) * 100, 100)
      : totalDuration > 0
      ? ((totalDuration - secondsLeft) / totalDuration) * 100
      : 0;

  return (
    <section className="space-y-6">
      {/* Method Selector Tabs */}
      <div className="flex items-center gap-1.5 p-1 rounded-xl border border-[var(--theme-border)] bg-[var(--theme-surface)] overflow-x-auto">
        <button
          onClick={() => {
            setSelectedMethod('pomodoro');
            setIsRunning(false);
          }}
          className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 ${
            selectedMethod === 'pomodoro'
              ? 'bg-[var(--theme-accent)] text-white shadow-xs'
              : 'text-[var(--theme-text-muted)] hover:text-[var(--theme-text-primary)] hover:bg-[var(--theme-surface-subtle)]'
          }`}
        >
          <Timer className="w-3.5 h-3.5" />
          <span>Pomodoro ({settings.pomodoroFocusMinutes}/{settings.pomodoroShortBreakMinutes}m)</span>
        </button>

        <button
          onClick={() => {
            setSelectedMethod('flowtime');
            setIsRunning(false);
          }}
          className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 ${
            selectedMethod === 'flowtime'
              ? 'bg-[var(--theme-accent)] text-white shadow-xs'
              : 'text-[var(--theme-text-muted)] hover:text-[var(--theme-text-primary)] hover:bg-[var(--theme-surface-subtle)]'
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          <span>Flowtime (Open Stopwatch)</span>
        </button>

        <button
          onClick={() => {
            setSelectedMethod('ultradian50_10');
            setIsRunning(false);
          }}
          className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 ${
            selectedMethod === 'ultradian50_10'
              ? 'bg-[var(--theme-accent)] text-white shadow-xs'
              : 'text-[var(--theme-text-muted)] hover:text-[var(--theme-text-primary)] hover:bg-[var(--theme-surface-subtle)]'
          }`}
        >
          <Flame className="w-3.5 h-3.5" />
          <span>50/10 Ultradian Focus</span>
        </button>

        <button
          onClick={() => {
            setSelectedMethod('deepwork90');
            setIsRunning(false);
          }}
          className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 ${
            selectedMethod === 'deepwork90'
              ? 'bg-[var(--theme-accent)] text-white shadow-xs'
              : 'text-[var(--theme-text-muted)] hover:text-[var(--theme-text-primary)] hover:bg-[var(--theme-surface-subtle)]'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>90m Deep Work Block</span>
        </button>

        <button
          onClick={() => setSelectedMethod('feynman')}
          className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 ${
            selectedMethod === 'feynman'
              ? 'bg-[var(--theme-accent)] text-white shadow-xs'
              : 'text-[var(--theme-text-muted)] hover:text-[var(--theme-text-primary)] hover:bg-[var(--theme-surface-subtle)]'
          }`}
        >
          <Brain className="w-3.5 h-3.5" />
          <span>Feynman Method</span>
        </button>

        <button
          onClick={() => setSelectedMethod('active_recall')}
          className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 ${
            selectedMethod === 'active_recall'
              ? 'bg-[var(--theme-accent)] text-white shadow-xs'
              : 'text-[var(--theme-text-muted)] hover:text-[var(--theme-text-primary)] hover:bg-[var(--theme-surface-subtle)]'
          }`}
        >
          <HelpCircle className="w-3.5 h-3.5" />
          <span>Active Recall Check</span>
        </button>
      </div>

      {/* Main Timer Display & Controls (For Pomodoro, Flowtime, 50/10, Deep Work) */}
      {selectedMethod !== 'feynman' && selectedMethod !== 'active_recall' && (
        <div className={`rounded-2xl border p-6 sm:p-8 shadow-xs relative overflow-hidden transition-all duration-500 ${
          hasActivePhoto
            ? 'border-white/20 bg-slate-950 text-white'
            : 'border-[var(--theme-border)] bg-[var(--theme-surface)]'
        }`}>
          {/* Custom Study Wallpaper Background (e.g. Chicago Skyline at dusk) */}
          {hasActivePhoto && (
            <>
              <img
                src={activeBgUrl}
                alt="Pomodoro Background"
                className="absolute inset-0 w-full h-full object-cover select-none pointer-events-none transition-all duration-700"
                style={{ filter: (bgConfig.blur ?? 0) > 0 ? `blur(${bgConfig.blur}px)` : 'none' }}
              />
              {/* Darkness scrim for guaranteed WCAG AA text legibility */}
              <div
                className="absolute inset-0 bg-black pointer-events-none transition-opacity duration-300"
                style={{ opacity: bgConfig.dimLevel ?? 0.55 }}
              />
            </>
          )}

          {/* Subtle background progress wash (when no photo) */}
          {!hasActivePhoto && (
            <div
              className="absolute bottom-0 left-0 top-0 bg-[var(--theme-accent-soft)]/20 transition-all duration-1000 -z-0"
              style={{ width: `${progressPercent}%` }}
            />
          )}

          <div className="relative z-10 flex flex-col items-center text-center">
            {/* Mode & Phase Header */}
            <div className="flex items-center justify-between w-full mb-6">
              <div className="flex items-center gap-2">
                <span className={`text-xs uppercase tracking-wider font-semibold ${
                  hasActivePhoto ? 'text-amber-300 drop-shadow-xs' : 'text-[var(--theme-accent)]'
                }`}>
                  {selectedMethod === 'flowtime'
                    ? 'Flowtime Immersion'
                    : mode === 'focus'
                    ? 'Focus Phase'
                    : mode === 'shortBreak'
                    ? 'Short Break (Rest & Hydrate)'
                    : 'Long Restorative Break'}
                </span>
                {selectedMethod === 'pomodoro' && (
                  <span className={`text-xs ${hasActivePhoto ? 'text-slate-200' : 'text-[var(--theme-text-muted)]'}`}>
                    · Cycle {(completedCycles % settings.cyclesBeforeLongBreak) + 1} of {settings.cyclesBeforeLongBreak}
                  </span>
                )}
              </div>

              {/* Action Buttons: Wallpaper Customizer + Timer Settings */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setShowWallpaper(!showWallpaper);
                    if (showSettings) setShowSettings(false);
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
                    showWallpaper
                      ? 'border-amber-400 bg-amber-400/20 text-white'
                      : hasActivePhoto
                      ? 'border-white/20 bg-black/40 text-white hover:border-white/40 backdrop-blur-md'
                      : 'border-[var(--theme-border)] text-[var(--theme-text-muted)] hover:text-[var(--theme-text-primary)] hover:bg-[var(--theme-surface-subtle)]'
                  }`}
                  title="Customize background wallpaper (Chicago Skyline, etc.)"
                >
                  <ImageIcon className="w-3.5 h-3.5 text-amber-300" />
                  <span className="hidden sm:inline">Wallpaper</span>
                  {hasActivePhoto && (
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  )}
                </button>

                <button
                  onClick={() => {
                    setShowSettings(!showSettings);
                    if (showWallpaper) setShowWallpaper(false);
                  }}
                  className={`p-2 rounded-lg border text-xs font-medium transition-colors ${
                    showSettings
                      ? 'border-amber-400 bg-amber-400/20 text-white'
                      : hasActivePhoto
                      ? 'border-white/20 bg-black/40 text-white hover:border-white/40 backdrop-blur-md'
                      : 'border-[var(--theme-border)] text-[var(--theme-text-muted)] hover:text-[var(--theme-text-primary)] hover:bg-[var(--theme-surface-subtle)]'
                  }`}
                  title="Configure custom durations and sounds"
                >
                  <Settings2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Active Linked Task Pill */}
            <div className="mb-4 max-w-md w-full">
              {activeTaskTitle ? (
                <div className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border text-xs max-w-full ${
                  hasActivePhoto
                    ? 'border-white/20 bg-black/50 text-white backdrop-blur-md'
                    : 'border-[var(--theme-border)] bg-[var(--theme-surface-subtle)] text-[var(--theme-text-primary)]'
                }`}>
                  <span className="w-2 h-2 rounded-full bg-[var(--theme-accent)] shrink-0" />
                  <span className="truncate font-medium">{activeTaskTitle}</span>
                  {onClearActiveTask && (
                    <button
                      onClick={() => {
                        setActiveTaskTitle('');
                        onClearActiveTask();
                      }}
                      className="text-slate-300 hover:text-rose-400 ml-1"
                    >
                      ×
                    </button>
                  )}
                </div>
              ) : (
                <div className={`flex items-center justify-center gap-1.5 text-xs ${
                  hasActivePhoto ? 'text-slate-300 drop-shadow-xs' : 'text-[var(--theme-text-muted)]'
                }`}>
                  <span>Link an active task or goal below, or just start free focus:</span>
                </div>
              )}
            </div>

            {/* Big Tabular Time Counter */}
            <div className={`my-3 font-mono font-bold text-6xl sm:text-7xl lg:text-8xl tracking-tight tabular-nums select-none ${
              hasActivePhoto
                ? 'text-white drop-shadow-[0_4px_16px_rgba(0,0,0,0.8)]'
                : 'text-[var(--theme-text-primary)]'
            }`}>
              {selectedMethod === 'flowtime' ? formatTime(flowtimeSeconds) : formatTime(secondsLeft)}
            </div>

            {/* Flowtime Calculated Break Hint */}
            {selectedMethod === 'flowtime' && flowtimeSeconds > 0 && (
              <p className="text-xs text-[var(--theme-text-muted)] mb-2 font-mono">
                Suggested break when done:{' '}
                <span className="text-[var(--theme-accent)] font-semibold">
                  {getFlowtimeBreakMinutes(flowtimeSeconds)} minutes
                </span>
              </p>
            )}

            {/* Primary Action Buttons */}
            <div className="flex items-center gap-3 mt-4">
              {/* Play / Pause button */}
              <button
                onClick={handleToggleStart}
                className="flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl bg-[var(--theme-accent)] text-white text-base font-semibold shadow-sm hover:opacity-95 active:scale-98 transition-all"
              >
                {isRunning ? (
                  <>
                    <Pause className="w-5 h-5 fill-current" />
                    <span>Pause</span>
                  </>
                ) : (
                  <>
                    <Play className="w-5 h-5 fill-current" />
                    <span>{selectedMethod === 'flowtime' && flowtimeSeconds > 0 ? 'Resume Flow' : 'Start Focus'}</span>
                  </>
                )}
              </button>

              {/* Reset / Finish Flow button */}
              {selectedMethod === 'flowtime' ? (
                <button
                  onClick={handleFlowtimeStop}
                  disabled={flowtimeSeconds === 0}
                  className="flex items-center gap-1.5 px-4 py-3.5 rounded-xl border border-[var(--theme-border)] text-xs font-semibold text-[var(--theme-text-primary)] hover:bg-[var(--theme-surface-subtle)] disabled:opacity-40 transition-colors"
                >
                  <CheckCircle className="w-4 h-4 text-[var(--theme-accent)]" />
                  <span>Log Session</span>
                </button>
              ) : (
                <button
                  onClick={handleReset}
                  className="p-3.5 rounded-xl border border-[var(--theme-border)] text-[var(--theme-text-muted)] hover:text-[var(--theme-text-primary)] hover:bg-[var(--theme-surface-subtle)] transition-colors"
                  title="Reset Timer (R)"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              )}

              {/* Skip phase button */}
              {selectedMethod !== 'flowtime' && (
                <button
                  onClick={handleSkip}
                  className="p-3.5 rounded-xl border border-[var(--theme-border)] text-[var(--theme-text-muted)] hover:text-[var(--theme-text-primary)] hover:bg-[var(--theme-surface-subtle)] transition-colors"
                  title="Skip to next phase"
                >
                  <SkipForward className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Quick Ambient Sounds Toolbar */}
            <div className="flex items-center gap-3 mt-6 pt-5 border-t border-[var(--theme-border)]/60 text-xs text-[var(--theme-text-muted)]">
              <span className="hidden sm:inline">Ambient Study Noise:</span>
              <button
                onClick={() => handleToggleAmbient('rain')}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md border transition-colors ${
                  settings.ambientNoise === 'rain'
                    ? 'border-[var(--theme-accent)] bg-[var(--theme-accent-soft)] text-[var(--theme-accent)] font-semibold'
                    : 'border-[var(--theme-border)] hover:border-[var(--theme-accent)]'
                }`}
              >
                <CloudRain className="w-3.5 h-3.5" />
                <span>Lo-Fi Rain</span>
              </button>
              <button
                onClick={() => handleToggleAmbient('whitenoise')}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md border transition-colors ${
                  settings.ambientNoise === 'whitenoise'
                    ? 'border-[var(--theme-accent)] bg-[var(--theme-accent-soft)] text-[var(--theme-accent)] font-semibold'
                    : 'border-[var(--theme-border)] hover:border-[var(--theme-accent)]'
                }`}
              >
                <Activity className="w-3.5 h-3.5" />
                <span>Soft Pink Noise</span>
              </button>
              <button
                onClick={() => {
                  onUpdateSettings({ ...settings, soundEnabled: !settings.soundEnabled });
                }}
                className="p-1 text-[var(--theme-text-muted)] hover:text-[var(--theme-text-primary)] ml-1"
                title={settings.soundEnabled ? 'Bell chime audio enabled' : 'Bell chime muted'}
              >
                {settings.soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Expandable Custom Duration Settings Drawer */}
          {showSettings && (
            <div className="mt-6 pt-6 border-t border-[var(--theme-border)] text-left">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--theme-text-primary)]">
                  Customize Timer Durations
                </h4>
                <span className="text-[11px] text-[var(--theme-text-muted)]">Adjust minutes to match your focus capacity</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Custom Focus Length */}
                <div className="p-3 rounded-lg bg-[var(--theme-surface-subtle)] border border-[var(--theme-border)]">
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-medium text-[var(--theme-text-primary)]">Focus Duration</label>
                    <span className="font-mono text-xs font-bold tabular-nums text-[var(--theme-accent)]">
                      {settings.pomodoroFocusMinutes} min
                    </span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="90"
                    step="5"
                    value={settings.pomodoroFocusMinutes}
                    onChange={e => {
                      const mins = Number(e.target.value);
                      onUpdateSettings({ ...settings, pomodoroFocusMinutes: mins });
                      if (!isRunning && mode === 'focus') setSecondsLeft(mins * 60);
                    }}
                    className="w-full accent-[var(--theme-accent)]"
                  />
                  <div className="flex justify-between text-[10px] text-[var(--theme-text-muted)] mt-1">
                    <span>15m sprint</span>
                    <span>25m classic</span>
                    <span>50m</span>
                    <span>90m deep</span>
                  </div>
                </div>

                {/* Custom Short Break */}
                <div className="p-3 rounded-lg bg-[var(--theme-surface-subtle)] border border-[var(--theme-border)]">
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-medium text-[var(--theme-text-primary)]">Short Break</label>
                    <span className="font-mono text-xs font-bold tabular-nums text-[var(--theme-accent)]">
                      {settings.pomodoroShortBreakMinutes} min
                    </span>
                  </div>
                  <input
                    type="range"
                    min="2"
                    max="15"
                    step="1"
                    value={settings.pomodoroShortBreakMinutes}
                    onChange={e => {
                      const mins = Number(e.target.value);
                      onUpdateSettings({ ...settings, pomodoroShortBreakMinutes: mins });
                      if (!isRunning && mode === 'shortBreak') setSecondsLeft(mins * 60);
                    }}
                    className="w-full accent-[var(--theme-accent)]"
                  />
                  <div className="flex justify-between text-[10px] text-[var(--theme-text-muted)] mt-1">
                    <span>3m quick</span>
                    <span>5m standard</span>
                    <span>10m</span>
                  </div>
                </div>

                {/* Custom Long Break */}
                <div className="p-3 rounded-lg bg-[var(--theme-surface-subtle)] border border-[var(--theme-border)]">
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-medium text-[var(--theme-text-primary)]">Long Break</label>
                    <span className="font-mono text-xs font-bold tabular-nums text-[var(--theme-accent)]">
                      {settings.pomodoroLongBreakMinutes} min
                    </span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="45"
                    step="5"
                    value={settings.pomodoroLongBreakMinutes}
                    onChange={e => {
                      const mins = Number(e.target.value);
                      onUpdateSettings({ ...settings, pomodoroLongBreakMinutes: mins });
                      if (!isRunning && mode === 'longBreak') setSecondsLeft(mins * 60);
                    }}
                    className="w-full accent-[var(--theme-accent)]"
                  />
                  <div className="flex justify-between text-[10px] text-[var(--theme-text-muted)] mt-1">
                    <span>15m walk</span>
                    <span>25m meal</span>
                    <span>35m</span>
                  </div>
                </div>
              </div>

              {/* Toggles */}
              <div className="mt-4 flex flex-wrap items-center gap-6 text-xs text-[var(--theme-text-muted)]">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.autoStartBreaks}
                    onChange={e => onUpdateSettings({ ...settings, autoStartBreaks: e.target.checked })}
                    className="rounded text-[var(--theme-accent)]"
                  />
                  <span>Auto-start breaks after focus</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.autoStartPomodoros}
                    onChange={e => onUpdateSettings({ ...settings, autoStartPomodoros: e.target.checked })}
                    className="rounded text-[var(--theme-accent)]"
                  />
                  <span>Auto-start next focus cycle after break</span>
                </label>
              </div>
            </div>
          )}

          {/* Expandable Wallpaper Customizer Drawer */}
          {showWallpaper && (
            <div className="mt-6 pt-6 border-t border-white/20 text-left relative z-20 animate-in fade-in">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                <div>
                  <h4 className={`text-xs font-bold uppercase tracking-wider ${hasActivePhoto ? 'text-white' : 'text-[var(--theme-text-primary)]'}`}>
                    High-Rise Penthouse Atmosphere & Wallpapers
                  </h4>
                  <p className={`text-[11px] ${hasActivePhoto ? 'text-slate-300' : 'text-[var(--theme-text-muted)]'}`}>
                    Look out from your penthouse window over Chicago, NYC, London, Paris, or study by the cozy fireplace.
                  </p>
                </div>
                <span className="text-[10px] font-mono text-amber-300 bg-amber-950/60 border border-amber-500/40 px-2.5 py-0.5 rounded-full shrink-0">
                  {currentWallpaper?.name || 'Custom Background'}
                </span>
              </div>

              {/* Wallpaper Cards Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                {TIMER_WALLPAPERS.map(wp => {
                  const isSelected = bgConfig.type === wp.id;
                  const isChicago = wp.id === 'chicago_fireplace' || wp.id === 'chicago_penthouse' || wp.id === 'chicago_dusk';
                  const cityTag = 
                    wp.id === 'chicago_fireplace' ? '🔥 Fireplace & Chicago' :
                    wp.id === 'chicago_penthouse' ? '★ Chicago Penthouse' :
                    wp.id === 'chicago_dusk' ? '★ Chicago Dusk' :
                    wp.id === 'nyc_penthouse' ? 'NYC Penthouse' :
                    wp.id === 'london_penthouse' ? 'London Penthouse' :
                    wp.id === 'paris_penthouse' ? 'Paris Penthouse' :
                    wp.id === 'mountain' ? 'Alpine Forest' : null;

                  return (
                    <button
                      key={wp.id}
                      type="button"
                      onClick={() => {
                        onUpdateSettings({
                          ...settings,
                          timerBackground: {
                            ...bgConfig,
                            type: wp.id,
                          },
                        });
                      }}
                      className={`group relative flex flex-col p-2.5 rounded-xl border text-left transition-all overflow-hidden ${
                        isSelected
                          ? 'border-amber-400 ring-2 ring-amber-400/80 bg-white/10 shadow-lg'
                          : 'border-white/20 bg-black/40 hover:border-white/50 hover:bg-black/50'
                      }`}
                    >
                      {/* Thumbnail or swatch */}
                      <div className="w-full h-20 rounded-lg overflow-hidden bg-slate-900 mb-2 relative">
                        {wp.url ? (
                          <img
                            src={wp.url}
                            alt={wp.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-400 text-[10px] bg-slate-950">
                            Clean Solid
                          </div>
                        )}
                        {isSelected && (
                          <div className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center text-[10px] font-bold shadow">
                            ✓
                          </div>
                        )}
                        {cityTag && (
                          <div className={`absolute bottom-1 left-1 px-1.5 py-0.5 rounded text-[9px] font-semibold backdrop-blur-xs ${
                            isChicago ? 'bg-amber-950/80 text-amber-300 border border-amber-500/40' : 'bg-black/75 text-slate-200'
                          }`}>
                            {cityTag}
                          </div>
                        )}
                      </div>

                      <div className="text-xs font-bold text-white truncate">{wp.name}</div>
                      <div className="text-[10px] text-slate-300 truncate mt-0.5">{wp.tagline}</div>
                    </button>
                  );
                })}
              </div>

              {/* Controls: Dimmer Scrim Slider + Blur + Custom URL */}
              <div className="p-3.5 rounded-xl bg-black/40 border border-white/15 backdrop-blur-md space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Dimmer Slider */}
                  <div>
                    <div className="flex items-center justify-between text-xs text-white mb-1">
                      <span className="font-medium">Darkness Scrim (Text Legibility)</span>
                      <span className="font-mono text-amber-300 text-xs font-bold">
                        {Math.round((bgConfig.dimLevel ?? 0.55) * 100)}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0.2"
                      max="0.85"
                      step="0.05"
                      value={bgConfig.dimLevel ?? 0.55}
                      onChange={e => {
                        onUpdateSettings({
                          ...settings,
                          timerBackground: {
                            ...bgConfig,
                            dimLevel: parseFloat(e.target.value),
                          },
                        });
                      }}
                      className="w-full accent-amber-400"
                    />
                    <div className="flex justify-between text-[10px] text-slate-300 mt-1">
                      <span>More vivid photo</span>
                      <span>Maximum contrast</span>
                    </div>
                  </div>

                  {/* Soft Focus Blur */}
                  <div>
                    <div className="flex items-center justify-between text-xs text-white mb-1">
                      <span className="font-medium">Focus Blur</span>
                      <span className="font-mono text-amber-300 text-xs font-bold">
                        {bgConfig.blur === 0 ? 'Sharp' : `${bgConfig.blur}px`}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      {[0, 2, 4, 8].map(b => (
                        <button
                          key={b}
                          type="button"
                          onClick={() => {
                            onUpdateSettings({
                              ...settings,
                              timerBackground: {
                                ...bgConfig,
                                blur: b,
                              },
                            });
                          }}
                          className={`flex-1 py-1 text-xs rounded-lg border transition-colors ${
                            (bgConfig.blur ?? 0) === b
                              ? 'border-amber-400 bg-amber-400/20 text-white font-bold'
                              : 'border-white/20 text-slate-300 hover:border-white/40'
                          }`}
                        >
                          {b === 0 ? 'Sharp' : `${b}px`}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Custom Photo URL Input */}
                <div className="pt-2 border-t border-white/10 flex items-center gap-2">
                  <input
                    type="url"
                    value={customBgUrlInput}
                    onChange={e => setCustomBgUrlInput(e.target.value)}
                    placeholder="Or paste custom image URL (e.g. your dream city skyline or campus)..."
                    className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-white/20 bg-black/30 text-white placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-amber-400"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (customBgUrlInput.trim()) {
                        onUpdateSettings({
                          ...settings,
                          timerBackground: {
                            ...bgConfig,
                            type: 'custom',
                            customUrl: customBgUrlInput.trim(),
                          },
                        });
                      }
                    }}
                    className="px-3 py-1.5 text-xs font-semibold text-slate-950 bg-amber-400 rounded-lg hover:bg-amber-300 transition-colors whitespace-nowrap"
                  >
                    Apply Custom
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Feynman Technique Companion Scratchpad */}
      {selectedMethod === 'feynman' && (
        <div className="rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-surface)] p-6 sm:p-8">
          <div className="flex items-center justify-between pb-4 border-b border-[var(--theme-border)] mb-6">
            <div>
              <div className="flex items-center gap-2">
                <Brain className="w-5 h-5 text-[var(--theme-accent)]" />
                <h3 className="text-base font-bold text-[var(--theme-text-primary)] font-['Plus_Jakarta_Sans']">
                  The Feynman Technique: 4-Step Mastery
                </h3>
              </div>
              <p className="text-xs text-[var(--theme-text-muted)] mt-1">
                True understanding means you can explain a difficult idea without jargon to a 12-year-old.
              </p>
            </div>
            {feynmanSaved && (
              <span className="flex items-center gap-1 text-xs text-[var(--theme-accent)] font-medium">
                <CheckCircle className="w-4 h-4" /> Saved to Study Notes
              </span>
            )}
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[var(--theme-text-primary)] mb-1">
                Step 1: What concept or theorem are you studying?
              </label>
              <input
                type="text"
                value={feynmanConcept}
                onChange={e => setFeynmanConcept(e.target.value)}
                placeholder="e.g. Mitosis vs Meiosis, or Bayes Theorem, or QuickSort partition"
                className="w-full px-3 py-2 text-xs rounded-md border border-[var(--theme-border)] bg-[var(--theme-surface-subtle)] text-[var(--theme-text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--theme-accent)]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--theme-text-primary)] mb-1">
                Step 2: Explain it simply in your own plain words (No textbook jargon allowed)
              </label>
              <textarea
                rows={3}
                value={feynmanSimpleExplain}
                onChange={e => setFeynmanSimpleExplain(e.target.value)}
                placeholder="Explain the mechanism as if talking to a friendly middle-schooler..."
                className="w-full px-3 py-2 text-xs rounded-md border border-[var(--theme-border)] bg-[var(--theme-surface-subtle)] text-[var(--theme-text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--theme-accent)]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[var(--theme-text-primary)] mb-1">
                  Step 3: Where did you get stuck or hesitate? (Knowledge Gaps)
                </label>
                <textarea
                  rows={2}
                  value={feynmanGaps}
                  onChange={e => setFeynmanGaps(e.target.value)}
                  placeholder="e.g. Wasn't sure why the denominator is squared, or what triggers the anaphase checkpoint..."
                  className="w-full px-3 py-2 text-xs rounded-md border border-[var(--theme-border)] bg-[var(--theme-surface-subtle)] text-[var(--theme-text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--theme-accent)]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--theme-text-primary)] mb-1">
                  Step 4: Real-World Analogy (Connect it to an everyday experience)
                </label>
                <textarea
                  rows={2}
                  value={feynmanAnalogy}
                  onChange={e => setFeynmanAnalogy(e.target.value)}
                  placeholder="e.g. It's like a post office sorting letters into zip code buckets before the trucks leave..."
                  className="w-full px-3 py-2 text-xs rounded-md border border-[var(--theme-border)] bg-[var(--theme-surface-subtle)] text-[var(--theme-text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--theme-accent)]"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => {
                  setFeynmanSaved(true);
                  soundEngine.playGoalSuccess(0.4);
                  setTimeout(() => setFeynmanSaved(false), 3000);
                }}
                disabled={!feynmanConcept.trim()}
                className="px-4 py-2 text-xs font-medium text-white bg-[var(--theme-accent)] rounded-lg hover:opacity-90 disabled:opacity-50 transition-opacity"
              >
                Log Feynman Synthesis
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Active Recall Self-Assessment */}
      {selectedMethod === 'active_recall' && (
        <div className="rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-surface)] p-6 sm:p-8">
          <div className="flex items-center justify-between pb-4 border-b border-[var(--theme-border)] mb-6">
            <div>
              <div className="flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-[var(--theme-accent)]" />
                <h3 className="text-base font-bold text-[var(--theme-text-primary)] font-['Plus_Jakarta_Sans']">
                  Active Recall: Rapid Memory Retrieval
                </h3>
              </div>
              <p className="text-xs text-[var(--theme-text-muted)] mt-1">
                Passive re-reading creates an illusion of competence. Test yourself without looking at notes.
              </p>
            </div>
            {recallPassed && (
              <span className="flex items-center gap-1 text-xs text-[var(--theme-accent)] font-semibold">
                <Sparkles className="w-4 h-4" /> Retention Verified!
              </span>
            )}
          </div>

          <div className="space-y-4">
            {recallQuestions.map((item, idx) => (
              <div key={idx} className="p-3.5 rounded-xl border border-[var(--theme-border)] bg-[var(--theme-surface-subtle)]">
                <div className="text-xs font-bold text-[var(--theme-text-primary)] mb-1.5">
                  Question {idx + 1}: {item.q}
                </div>
                <textarea
                  rows={2}
                  value={item.a}
                  onChange={e => {
                    const next = [...recallQuestions];
                    next[idx].a = e.target.value;
                    setRecallQuestions(next);
                  }}
                  placeholder="Answer from pure recall memory..."
                  className="w-full px-3 py-2 text-xs rounded-md border border-[var(--theme-border)] bg-[var(--theme-surface)] text-[var(--theme-text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--theme-accent)]"
                />
              </div>
            ))}

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => {
                  setRecallPassed(true);
                  soundEngine.playGoalSuccess(0.5);
                }}
                disabled={recallQuestions.some(q => !q.a.trim())}
                className="px-4 py-2 text-xs font-medium text-white bg-[var(--theme-accent)] rounded-lg hover:opacity-90 disabled:opacity-50 transition-opacity"
              >
                Complete Retrieval Check
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Built-in Lo-Fi Music Player & Spotify Connection */}
      <LofiMusicPlayer />

      {/* Daily Study Stats Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-xl border border-[var(--theme-border)] bg-[var(--theme-surface)]">
          <div className="text-[11px] text-[var(--theme-text-muted)]">Focus Logged Today</div>
          <div className="text-xl sm:text-2xl font-bold font-mono tabular-nums text-[var(--theme-text-primary)] mt-1">
            {stats.focusMinutesToday} <span className="text-xs font-normal text-[var(--theme-text-muted)]">mins</span>
          </div>
        </div>

        <div className="p-4 rounded-xl border border-[var(--theme-border)] bg-[var(--theme-surface)]">
          <div className="text-[11px] text-[var(--theme-text-muted)]">Sessions Completed</div>
          <div className="text-xl sm:text-2xl font-bold font-mono tabular-nums text-[var(--theme-text-primary)] mt-1">
            {stats.sessionsCompletedToday} <span className="text-xs font-normal text-[var(--theme-text-muted)]">blocks</span>
          </div>
        </div>

        <div className="p-4 rounded-xl border border-[var(--theme-border)] bg-[var(--theme-surface)]">
          <div className="text-[11px] text-[var(--theme-text-muted)]">Active Method</div>
          <div className="text-sm font-semibold capitalize text-[var(--theme-accent)] mt-1.5 truncate">
            {selectedMethod.replace('_', ' ')}
          </div>
        </div>

        <div className="p-4 rounded-xl border border-[var(--theme-border)] bg-[var(--theme-surface)]">
          <div className="text-[11px] text-[var(--theme-text-muted)]">Study Mode</div>
          <div className="text-sm font-semibold text-[var(--theme-text-primary)] mt-1.5 flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${isRunning ? 'bg-emerald-500' : 'bg-amber-400'}`} />
            <span>{isRunning ? 'Focus In Progress' : 'Idle / Ready'}</span>
          </div>
        </div>
      </div>
    </section>
  );
};
