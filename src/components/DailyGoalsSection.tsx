import React, { useState } from 'react';
import { DailyGoal, Task } from '../types';
import { CheckCircle2, Circle, Clock, Plus, Play, Trash2, Target, Sparkles, Check } from 'lucide-react';
import { soundEngine } from '../services/audioService';
import confetti from 'canvas-confetti';

interface DailyGoalsProps {
  goals: DailyGoal[];
  tasks: Task[];
  onToggleGoal: (id: string) => void;
  onAddGoal: (text: string, targetTime: string, linkedTaskId?: string) => void;
  onDeleteGoal: (id: string) => void;
  onStartFocusOnGoal: (goal: DailyGoal) => void;
}

export const DailyGoalsSection: React.FC<DailyGoalsProps> = ({
  goals,
  tasks,
  onToggleGoal,
  onAddGoal,
  onDeleteGoal,
  onStartFocusOnGoal,
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newText, setNewText] = useState('');
  const [newTargetTime, setNewTargetTime] = useState('17:00');
  const [selectedTaskId, setSelectedTaskId] = useState('');

  const todayStr = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });

  const completedCount = goals.filter(g => g.isCompleted).length;
  const totalCount = goals.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const handleToggle = (id: string, currentlyCompleted: boolean) => {
    onToggleGoal(id);
    if (!currentlyCompleted) {
      soundEngine.playGoalSuccess(0.5);
      confetti({
        particleCount: 45,
        spread: 60,
        origin: { y: 0.7 },
        colors: ['#7C9082', '#9D8EC2', '#D9886C', '#F7F6F2'],
      });
    }
  };

  const handleCreateGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newText.trim() || !newTargetTime) return;
    onAddGoal(newText.trim(), newTargetTime, selectedTaskId || undefined);
    setNewText('');
    setSelectedTaskId('');
    setIsAdding(false);
  };

  // Calculate live time remaining for a target time ("HH:mm")
  const getTimeRemainingStatus = (targetTime: string, isCompleted: boolean) => {
    if (isCompleted) {
      return { text: 'Completed on time', status: 'done', color: 'text-[var(--theme-accent)]' };
    }

    if (!targetTime) return { text: '', status: 'neutral', color: 'text-[var(--theme-text-muted)]' };

    const [h, m] = targetTime.split(':').map(Number);
    const now = new Date();
    const targetDate = new Date();
    targetDate.setHours(h, m, 0, 0);

    const diffMinutes = Math.round((targetDate.getTime() - now.getTime()) / 60000);

    if (diffMinutes < 0) {
      const overdueMins = Math.abs(diffMinutes);
      const hours = Math.floor(overdueMins / 60);
      const mins = overdueMins % 60;
      const timeStr = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
      return { text: `Past target by ${timeStr}`, status: 'overdue', color: 'text-amber-600 dark:text-amber-400' };
    } else if (diffMinutes <= 30) {
      return { text: `${diffMinutes}m remaining`, status: 'urgent', color: 'text-rose-600 dark:text-rose-400 font-semibold' };
    } else {
      const hours = Math.floor(diffMinutes / 60);
      const mins = diffMinutes % 60;
      return {
        text: hours > 0 ? `${hours}h ${mins}m left` : `${mins}m left`,
        status: 'ontrack',
        color: 'text-[var(--theme-text-muted)]',
      };
    }
  };

  // Convert 24-hr time string "17:00" to "5:00 PM"
  const formatTime12h = (timeStr: string) => {
    if (!timeStr) return '';
    const [hStr, mStr] = timeStr.split(':');
    let h = parseInt(hStr, 10);
    const m = mStr || '00';
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12;
    h = h ? h : 12;
    return `${h}:${m} ${ampm}`;
  };

  return (
    <section className="rounded-xl border border-[var(--theme-border)] bg-[var(--theme-surface)] p-5 sm:p-6 shadow-xs transition-colors">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[var(--theme-border)]">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-[var(--theme-accent-soft)] text-[var(--theme-accent)]">
              <Target className="w-3.5 h-3.5" />
            </span>
            <h2 className="text-lg font-bold tracking-tight text-[var(--theme-text-primary)] font-['Plus_Jakarta_Sans']">
              Goals for Today
            </h2>
            <span className="text-xs text-[var(--theme-text-muted)] font-medium">·</span>
            <span className="text-xs text-[var(--theme-text-muted)] font-medium">{todayStr}</span>
          </div>
          <p className="mt-1 text-xs text-[var(--theme-text-muted)]">
            Declare your core targets for the day and set specific times to wrap them up.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Progress meter */}
          <div className="flex items-center gap-2">
            <div className="w-24 sm:w-32 bg-[var(--theme-surface-subtle)] h-2 rounded-full overflow-hidden border border-[var(--theme-border)]">
              <div
                className="bg-[var(--theme-accent)] h-full rounded-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <span className="font-mono text-xs font-semibold tabular-nums text-[var(--theme-text-primary)]">
              {completedCount}/{totalCount}
            </span>
          </div>

          <button
            onClick={() => setIsAdding(!isAdding)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-[var(--theme-border)] bg-[var(--theme-surface)] text-[var(--theme-text-primary)] hover:bg-[var(--theme-surface-subtle)] transition-colors whitespace-nowrap shrink-0"
          >
            <Plus className="w-3.5 h-3.5 text-[var(--theme-accent)]" />
            <span>Add Goal</span>
          </button>
        </div>
      </div>

      {/* Add Goal Collapsible Card */}
      {isAdding && (
        <form onSubmit={handleCreateGoal} className="mt-4 p-4 rounded-lg bg-[var(--theme-surface-subtle)] border border-[var(--theme-border)]">
          <div className="text-xs font-semibold text-[var(--theme-text-primary)] mb-2">
            Set a Target Goal for Today
          </div>
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
            <div className="md:col-span-6">
              <label className="block text-[11px] font-medium text-[var(--theme-text-muted)] mb-1">
                Goal Description
              </label>
              <input
                type="text"
                value={newText}
                onChange={e => setNewText(e.target.value)}
                placeholder="e.g. Finish reading Bio Chapter 7 and summarize notes"
                className="w-full px-3 py-2 text-xs rounded-md border border-[var(--theme-border)] bg-[var(--theme-surface)] text-[var(--theme-text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--theme-accent)]"
                autoFocus
              />
            </div>

            <div className="md:col-span-3">
              <label className="block text-[11px] font-medium text-[var(--theme-text-muted)] mb-1">
                Target Done By Time
              </label>
              <div className="relative">
                <input
                  type="time"
                  value={newTargetTime}
                  onChange={e => setNewTargetTime(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-mono tabular-nums rounded-md border border-[var(--theme-border)] bg-[var(--theme-surface)] text-[var(--theme-text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--theme-accent)]"
                />
              </div>
            </div>

            <div className="md:col-span-3 flex items-center gap-2">
              <button
                type="submit"
                disabled={!newText.trim()}
                className="flex-1 py-2 px-3 text-xs font-medium text-white bg-[var(--theme-accent)] rounded-md hover:opacity-90 disabled:opacity-50 transition-opacity"
              >
                Save Goal
              </button>
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="py-2 px-3 text-xs font-medium text-[var(--theme-text-muted)] hover:text-[var(--theme-text-primary)] transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>

          {/* Quick preset times */}
          <div className="mt-2.5 flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] text-[var(--theme-text-muted)]">Quick times:</span>
            {['12:00', '15:00', '17:00', '19:30', '21:00', '23:00'].map(t => (
              <button
                type="button"
                key={t}
                onClick={() => setNewTargetTime(t)}
                className={`px-2 py-0.5 text-[10px] font-mono rounded border transition-colors ${
                  newTargetTime === t
                    ? 'border-[var(--theme-accent)] bg-[var(--theme-accent-soft)] text-[var(--theme-accent)]'
                    : 'border-[var(--theme-border)] text-[var(--theme-text-muted)] hover:border-[var(--theme-accent)]'
                }`}
              >
                {formatTime12h(t)}
              </button>
            ))}
          </div>

          {/* Optional Task Linking */}
          {tasks.length > 0 && (
            <div className="mt-3 pt-2.5 border-t border-[var(--theme-border)]/50">
              <label className="block text-[11px] text-[var(--theme-text-muted)] mb-1">
                Link to a task from your planner (optional):
              </label>
              <select
                value={selectedTaskId}
                onChange={e => {
                  setSelectedTaskId(e.target.value);
                  const matched = tasks.find(t => t.id === e.target.value);
                  if (matched && !newText) setNewText(matched.title);
                }}
                className="w-full sm:w-auto px-2.5 py-1.5 text-xs rounded border border-[var(--theme-border)] bg-[var(--theme-surface)] text-[var(--theme-text-primary)]"
              >
                <option value="">-- No linked task --</option>
                {tasks.map(t => (
                  <option key={t.id} value={t.id}>
                    {t.courseName ? `[${t.courseName}] ` : ''}{t.title}
                  </option>
                ))}
              </select>
            </div>
          )}
        </form>
      )}

      {/* Goals List */}
      <div className="mt-4 space-y-2.5">
        {goals.length === 0 ? (
          <div className="py-8 text-center rounded-lg border border-dashed border-[var(--theme-border)]">
            <Sparkles className="w-6 h-6 mx-auto text-[var(--theme-accent)] opacity-60 mb-2" />
            <p className="text-xs font-medium text-[var(--theme-text-primary)]">No goals set for today yet.</p>
            <p className="text-[11px] text-[var(--theme-text-muted)] mt-0.5">
              Set 1–3 high-leverage milestones with specific target times to stay focused.
            </p>
            <button
              onClick={() => setIsAdding(true)}
              className="mt-3 px-3 py-1.5 text-xs font-medium text-white bg-[var(--theme-accent)] rounded-lg hover:opacity-90 transition-opacity"
            >
              Set First Goal
            </button>
          </div>
        ) : (
          goals.map(goal => {
            const timeStatus = getTimeRemainingStatus(goal.targetTime, goal.isCompleted);
            const linkedTask = tasks.find(t => t.id === goal.linkedTaskId);

            return (
              <div
                key={goal.id}
                className={`group flex items-center justify-between gap-3 p-3 sm:px-4 rounded-lg border transition-all ${
                  goal.isCompleted
                    ? 'border-[var(--theme-border)] bg-[var(--theme-surface-subtle)]/50 opacity-70'
                    : 'border-[var(--theme-border)] bg-[var(--theme-surface)] hover:border-[var(--theme-accent)]/60'
                }`}
              >
                {/* Left: Checkbox + Goal text */}
                <div className="flex items-center gap-3 min-w-0">
                  <button
                    onClick={() => handleToggle(goal.id, goal.isCompleted)}
                    className="shrink-0 text-[var(--theme-text-muted)] hover:text-[var(--theme-accent)] transition-colors focus:outline-none"
                    title={goal.isCompleted ? 'Mark incomplete' : 'Mark completed on time!'}
                  >
                    {goal.isCompleted ? (
                      <CheckCircle2 className="w-5 h-5 text-[var(--theme-accent)]" />
                    ) : (
                      <Circle className="w-5 h-5" />
                    )}
                  </button>

                  <div className="min-w-0">
                    <p
                      className={`text-xs sm:text-sm font-medium text-[var(--theme-text-primary)] truncate ${
                        goal.isCompleted ? 'line-through text-[var(--theme-text-muted)]' : ''
                      }`}
                    >
                      {goal.text}
                    </p>
                    {linkedTask && (
                      <div className="flex items-center gap-1.5 mt-0.5 text-[11px] text-[var(--theme-text-muted)] truncate">
                        <span>Linked to:</span>
                        <span className="font-medium text-[var(--theme-text-primary)] truncate">
                          {linkedTask.title}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right: Target time countdown & Action buttons */}
                <div className="flex items-center gap-3 shrink-0">
                  {/* Target Time Badge */}
                  <div className="text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <Clock className="w-3 h-3 text-[var(--theme-text-muted)]" />
                      <span className="font-mono text-xs font-semibold tabular-nums text-[var(--theme-text-primary)]">
                        {formatTime12h(goal.targetTime)}
                      </span>
                    </div>
                    <span className={`text-[10px] font-mono tabular-nums ${timeStatus.color}`}>
                      {timeStatus.text}
                    </span>
                  </div>

                  {/* Focus with Pomodoro Button */}
                  {!goal.isCompleted && (
                    <button
                      onClick={() => onStartFocusOnGoal(goal)}
                      className="hidden sm:flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md bg-[var(--theme-accent-soft)] text-[var(--theme-accent)] hover:opacity-90 transition-opacity whitespace-nowrap"
                      title="Launch Study Timer on this goal"
                    >
                      <Play className="w-3 h-3 fill-current" />
                      <span>Focus</span>
                    </button>
                  )}

                  {/* Delete button */}
                  <button
                    onClick={() => onDeleteGoal(goal.id)}
                    className="p-1 text-[var(--theme-text-muted)] hover:text-rose-600 transition-colors opacity-0 group-hover:opacity-100"
                    title="Delete goal"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
};
