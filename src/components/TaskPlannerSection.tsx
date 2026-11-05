import React, { useState } from 'react';
import { Task, TaskPriority, TaskCategory } from '../types';
import {
  CheckCircle2,
  Circle,
  Plus,
  Search,
  BookOpen,
  Calendar,
  Sparkles,
  User,
  Clock,
  Play,
  Trash2,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Tag,
  AlertCircle,
  Check,
} from 'lucide-react';
import { soundEngine } from '../services/audioService';

interface TaskPlannerProps {
  tasks: Task[];
  onToggleTask: (id: string) => void;
  onAddTask: (task: Omit<Task, 'id' | 'createdAt'>) => void;
  onDeleteTask: (id: string) => void;
  onToggleSubtask: (taskId: string, subtaskId: string) => void;
  onStartFocus: (task: Task) => void;
}

export const TaskPlannerSection: React.FC<TaskPlannerProps> = ({
  tasks,
  onToggleTask,
  onAddTask,
  onDeleteTask,
  onToggleSubtask,
  onStartFocus,
}) => {
  const [filter, setFilter] = useState<'all' | 'offline' | 'canvas' | 'calendar' | 'today' | 'completed'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);

  // Quick add form state
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newCategory, setNewCategory] = useState<TaskCategory>('offline');
  const [newCourseName, setNewCourseName] = useState('');
  const [newDueDate, setNewDueDate] = useState(new Date().toISOString().split('T')[0]);
  const [newDueTime, setNewDueTime] = useState('17:00');
  const [newPriority, setNewPriority] = useState<TaskPriority>('medium');
  const [newEstimatedMinutes, setNewEstimatedMinutes] = useState('45');
  const [newSubtaskInput, setNewSubtaskInput] = useState('');
  const [subtasksList, setSubtasksList] = useState<string[]>([]);

  const handleAddSubtask = (e: React.KeyboardEvent | React.MouseEvent) => {
    if (newSubtaskInput.trim()) {
      setSubtasksList([...subtasksList, newSubtaskInput.trim()]);
      setNewSubtaskInput('');
    }
  };

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    onAddTask({
      title: newTitle.trim(),
      description: newDescription.trim() || undefined,
      category: newCategory,
      courseName: newCourseName.trim() || undefined,
      dueDate: newDueDate || undefined,
      dueTime: newDueTime || undefined,
      priority: newPriority,
      isCompleted: false,
      estimatedMinutes: parseInt(newEstimatedMinutes, 10) || 30,
      subtasks: subtasksList.map((t, idx) => ({
        id: `st-${Date.now()}-${idx}`,
        title: t,
        completed: false,
      })),
    });

    // Reset form
    setNewTitle('');
    setNewDescription('');
    setNewCourseName('');
    setSubtasksList([]);
    setIsAdding(false);
  };

  // Filter & Search Logic
  const todayStr = new Date().toISOString().split('T')[0];

  const filteredTasks = tasks.filter(task => {
    // Search match
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = task.title.toLowerCase().includes(q);
      const matchCourse = task.courseName?.toLowerCase().includes(q);
      const matchDesc = task.description?.toLowerCase().includes(q);
      if (!matchTitle && !matchCourse && !matchDesc) return false;
    }

    if (filter === 'all') return true;
    if (filter === 'completed') return task.isCompleted;
    if (filter === 'today') return task.dueDate === todayStr;
    if (filter === 'offline') return task.category === 'offline';
    if (filter === 'canvas') return task.category === 'canvas';
    if (filter === 'calendar') return task.category === 'calendar';
    return true;
  });

  const getCategoryIcon = (category: TaskCategory) => {
    switch (category) {
      case 'offline':
        return <BookOpen className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />;
      case 'canvas':
        return <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />;
      case 'calendar':
        return <Calendar className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />;
      default:
        return <User className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />;
    }
  };

  const getPriorityBadge = (priority: TaskPriority) => {
    switch (priority) {
      case 'high':
        return <span className="text-[10px] font-semibold text-rose-600 dark:text-rose-400">High Priority</span>;
      case 'medium':
        return <span className="text-[10px] font-medium text-amber-600 dark:text-amber-400">Med Priority</span>;
      default:
        return <span className="text-[10px] text-[var(--theme-text-muted)]">Low Priority</span>;
    }
  };

  return (
    <section className="space-y-4">
      {/* Search Bar & Filter Strip */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-1 rounded-xl border border-[var(--theme-border)] bg-[var(--theme-surface)]">
        {/* Filter buttons */}
        <div className="flex items-center gap-1 overflow-x-auto p-1">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 ${
              filter === 'all'
                ? 'bg-[var(--theme-accent)] text-white shadow-xs'
                : 'text-[var(--theme-text-muted)] hover:text-[var(--theme-text-primary)] hover:bg-[var(--theme-surface-subtle)]'
            }`}
          >
            All Tasks ({tasks.length})
          </button>
          <button
            onClick={() => setFilter('offline')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 ${
              filter === 'offline'
                ? 'bg-[var(--theme-accent)] text-white shadow-xs'
                : 'text-[var(--theme-text-muted)] hover:text-[var(--theme-text-primary)] hover:bg-[var(--theme-surface-subtle)]'
            }`}
          >
            Offline / Paper ({tasks.filter(t => t.category === 'offline').length})
          </button>
          <button
            onClick={() => setFilter('canvas')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 ${
              filter === 'canvas'
                ? 'bg-[var(--theme-accent)] text-white shadow-xs'
                : 'text-[var(--theme-text-muted)] hover:text-[var(--theme-text-primary)] hover:bg-[var(--theme-surface-subtle)]'
            }`}
          >
            Canvas LMS ({tasks.filter(t => t.category === 'canvas').length})
          </button>
          <button
            onClick={() => setFilter('today')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 ${
              filter === 'today'
                ? 'bg-[var(--theme-accent)] text-white shadow-xs'
                : 'text-[var(--theme-text-muted)] hover:text-[var(--theme-text-primary)] hover:bg-[var(--theme-surface-subtle)]'
            }`}
          >
            Due Today
          </button>
          <button
            onClick={() => setFilter('completed')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 ${
              filter === 'completed'
                ? 'bg-[var(--theme-accent)] text-white shadow-xs'
                : 'text-[var(--theme-text-muted)] hover:text-[var(--theme-text-primary)] hover:bg-[var(--theme-surface-subtle)]'
            }`}
          >
            Completed
          </button>
        </div>

        {/* Search input + New Task button */}
        <div className="flex items-center gap-2 p-1">
          <div className="relative flex-1 sm:w-48">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--theme-text-muted)]" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search tasks..."
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-[var(--theme-border)] bg-[var(--theme-surface-subtle)] text-[var(--theme-text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--theme-accent)]"
            />
          </div>

          <button
            onClick={() => setIsAdding(!isAdding)}
            className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-[var(--theme-accent)] rounded-lg hover:opacity-90 transition-opacity whitespace-nowrap shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Offline Task</span>
          </button>
        </div>
      </div>

      {/* Quick Add Form Drawer */}
      {isAdding && (
        <form onSubmit={handleCreateTask} className="p-5 rounded-xl border border-[var(--theme-border)] bg-[var(--theme-surface)] shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-[var(--theme-border)] mb-4">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-[var(--theme-accent)]" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--theme-text-primary)]">
                Add Offline / Manual Task
              </h3>
            </div>
            <span className="text-[11px] text-[var(--theme-text-muted)]">
              Paper problem sets, textbook readings, lab work, chores
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
            <div className="sm:col-span-8">
              <label className="block text-[11px] font-medium text-[var(--theme-text-muted)] mb-1">
                Task Title *
              </label>
              <input
                type="text"
                value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
                placeholder="e.g. Read Physics Chapter 4: Torque & Rotational Equilibrium"
                className="w-full px-3 py-2 text-xs rounded-md border border-[var(--theme-border)] bg-[var(--theme-surface-subtle)] text-[var(--theme-text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--theme-accent)]"
                autoFocus
                required
              />
            </div>

            <div className="sm:col-span-4">
              <label className="block text-[11px] font-medium text-[var(--theme-text-muted)] mb-1">
                Course or Category
              </label>
              <input
                type="text"
                value={newCourseName}
                onChange={e => setNewCourseName(e.target.value)}
                placeholder="e.g. PHYS 41 or Self Study"
                className="w-full px-3 py-2 text-xs rounded-md border border-[var(--theme-border)] bg-[var(--theme-surface-subtle)] text-[var(--theme-text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--theme-accent)]"
              />
            </div>

            <div className="sm:col-span-12">
              <label className="block text-[11px] font-medium text-[var(--theme-text-muted)] mb-1">
                Notes / Physical Location (optional)
              </label>
              <input
                type="text"
                value={newDescription}
                onChange={e => setNewDescription(e.target.value)}
                placeholder="e.g. Complete on blue engineering paper in binder, bring to TA office hours"
                className="w-full px-3 py-2 text-xs rounded-md border border-[var(--theme-border)] bg-[var(--theme-surface-subtle)] text-[var(--theme-text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--theme-accent)]"
              />
            </div>

            <div className="sm:col-span-3">
              <label className="block text-[11px] font-medium text-[var(--theme-text-muted)] mb-1">Due Date</label>
              <input
                type="date"
                value={newDueDate}
                onChange={e => setNewDueDate(e.target.value)}
                className="w-full px-3 py-1.5 text-xs font-mono rounded-md border border-[var(--theme-border)] bg-[var(--theme-surface-subtle)] text-[var(--theme-text-primary)]"
              />
            </div>

            <div className="sm:col-span-3">
              <label className="block text-[11px] font-medium text-[var(--theme-text-muted)] mb-1">Due Time</label>
              <input
                type="time"
                value={newDueTime}
                onChange={e => setNewDueTime(e.target.value)}
                className="w-full px-3 py-1.5 text-xs font-mono rounded-md border border-[var(--theme-border)] bg-[var(--theme-surface-subtle)] text-[var(--theme-text-primary)]"
              />
            </div>

            <div className="sm:col-span-3">
              <label className="block text-[11px] font-medium text-[var(--theme-text-muted)] mb-1">Priority</label>
              <select
                value={newPriority}
                onChange={e => setNewPriority(e.target.value as TaskPriority)}
                className="w-full px-3 py-1.5 text-xs rounded-md border border-[var(--theme-border)] bg-[var(--theme-surface-subtle)] text-[var(--theme-text-primary)]"
              >
                <option value="low">Low Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="high">High Priority</option>
              </select>
            </div>

            <div className="sm:col-span-3">
              <label className="block text-[11px] font-medium text-[var(--theme-text-muted)] mb-1">
                Estimated Minutes
              </label>
              <input
                type="number"
                min="5"
                max="360"
                step="5"
                value={newEstimatedMinutes}
                onChange={e => setNewEstimatedMinutes(e.target.value)}
                className="w-full px-3 py-1.5 text-xs font-mono rounded-md border border-[var(--theme-border)] bg-[var(--theme-surface-subtle)] text-[var(--theme-text-primary)]"
              />
            </div>

            {/* Checklist / Subtasks Builder */}
            <div className="sm:col-span-12 mt-2 pt-2 border-t border-[var(--theme-border)]/60">
              <label className="block text-[11px] font-medium text-[var(--theme-text-muted)] mb-1">
                Add Subtasks / Checklist Steps (optional):
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newSubtaskInput}
                  onChange={e => setNewSubtaskInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddSubtask(e);
                    }
                  }}
                  placeholder="e.g. Read pages 140-155, then answer practice questions 1 to 5"
                  className="flex-1 px-3 py-1.5 text-xs rounded-md border border-[var(--theme-border)] bg-[var(--theme-surface-subtle)] text-[var(--theme-text-primary)]"
                />
                <button
                  type="button"
                  onClick={handleAddSubtask}
                  className="px-3 py-1.5 text-xs font-medium rounded-md border border-[var(--theme-border)] hover:bg-[var(--theme-surface-subtle)]"
                >
                  Add Step
                </button>
              </div>

              {subtasksList.length > 0 && (
                <div className="mt-2 space-y-1">
                  {subtasksList.map((st, i) => (
                    <div key={i} className="flex items-center justify-between text-xs px-2.5 py-1 rounded bg-[var(--theme-surface-subtle)]">
                      <span>• {st}</span>
                      <button
                        type="button"
                        onClick={() => setSubtasksList(subtasksList.filter((_, idx) => idx !== i))}
                        className="text-[var(--theme-text-muted)] hover:text-rose-500"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 mt-4 pt-3 border-t border-[var(--theme-border)]">
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="px-3.5 py-1.5 text-xs font-medium text-[var(--theme-text-muted)] hover:text-[var(--theme-text-primary)]"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 text-xs font-semibold text-white bg-[var(--theme-accent)] rounded-lg hover:opacity-90"
            >
              Create Offline Task
            </button>
          </div>
        </form>
      )}

      {/* Task List */}
      <div className="space-y-2">
        {filteredTasks.length === 0 ? (
          <div className="py-12 text-center rounded-xl border border-dashed border-[var(--theme-border)] bg-[var(--theme-surface)]">
            <BookOpen className="w-8 h-8 mx-auto text-[var(--theme-accent)] opacity-60 mb-2" />
            <p className="text-xs font-semibold text-[var(--theme-text-primary)]">No tasks match this view.</p>
            <p className="text-[11px] text-[var(--theme-text-muted)] mt-0.5">
              Add your paper homework, textbook readings, or sync with Canvas.
            </p>
            <button
              onClick={() => setIsAdding(true)}
              className="mt-3 px-3 py-1.5 text-xs font-medium text-white bg-[var(--theme-accent)] rounded-lg hover:opacity-90 transition-opacity"
            >
              + Quick Add Task
            </button>
          </div>
        ) : (
          filteredTasks.map(task => {
            const isExpanded = expandedTaskId === task.id;
            const subtaskCompletedCount = task.subtasks.filter(s => s.completed).length;

            return (
              <div
                key={task.id}
                className={`group rounded-xl border transition-all ${
                  task.isCompleted
                    ? 'border-[var(--theme-border)] bg-[var(--theme-surface-subtle)]/40 opacity-75'
                    : 'border-[var(--theme-border)] bg-[var(--theme-surface)] hover:border-[var(--theme-accent)]/60'
                }`}
              >
                <div className="flex items-center justify-between gap-3 p-3.5 sm:px-4">
                  {/* Left: Checkbox + Title + Metadata */}
                  <div className="flex items-center gap-3 min-w-0">
                    <button
                      onClick={() => {
                        onToggleTask(task.id);
                        if (!task.isCompleted) soundEngine.playGoalSuccess(0.4);
                      }}
                      className="shrink-0 text-[var(--theme-text-muted)] hover:text-[var(--theme-accent)] transition-colors focus:outline-none"
                    >
                      {task.isCompleted ? (
                        <CheckCircle2 className="w-5 h-5 text-[var(--theme-accent)]" />
                      ) : (
                        <Circle className="w-5 h-5" />
                      )}
                    </button>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`text-xs sm:text-sm font-semibold text-[var(--theme-text-primary)] truncate ${
                            task.isCompleted ? 'line-through text-[var(--theme-text-muted)]' : ''
                          }`}
                        >
                          {task.title}
                        </span>

                        {task.courseName && (
                          <span className="text-[11px] font-medium text-[var(--theme-accent)] font-mono">
                            {task.courseName}
                          </span>
                        )}
                      </div>

                      {/* Clean typographic unboxed metadata (anti-pill) */}
                      <div className="flex items-center gap-2 mt-1 text-[11px] text-[var(--theme-text-muted)]">
                        <span className="flex items-center gap-1">
                          {getCategoryIcon(task.category)}
                          <span className="capitalize">{task.category}</span>
                        </span>
                        <span aria-hidden="true">·</span>
                        {task.dueDate && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <span className="font-mono tabular-nums">
                              {task.dueDate === todayStr ? 'Today' : task.dueDate}
                              {task.dueTime ? ` at ${task.dueTime}` : ''}
                            </span>
                          </span>
                        )}
                        <span aria-hidden="true">·</span>
                        {getPriorityBadge(task.priority)}
                        {task.subtasks.length > 0 && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span>
                              {subtaskCompletedCount}/{task.subtasks.length} steps
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    {/* Launch Focus Timer on this task */}
                    {!task.isCompleted && (
                      <button
                        onClick={() => onStartFocus(task)}
                        className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md bg-[var(--theme-accent-soft)] text-[var(--theme-accent)] hover:opacity-90 transition-opacity"
                        title="Study this task in Study Hub"
                      >
                        <Play className="w-3 h-3 fill-current" />
                        <span className="hidden sm:inline">Study</span>
                      </button>
                    )}

                    {/* Canvas direct external link if present */}
                    {task.canvasUrl && (
                      <a
                        href={task.canvasUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 text-[var(--theme-text-muted)] hover:text-[var(--theme-text-primary)]"
                        title="Open on Canvas"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}

                    {/* Expand Subtasks toggle */}
                    {task.subtasks.length > 0 && (
                      <button
                        onClick={() => setExpandedTaskId(isExpanded ? null : task.id)}
                        className="p-1 text-[var(--theme-text-muted)] hover:text-[var(--theme-text-primary)]"
                      >
                        {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                      </button>
                    )}

                    {/* Delete button (opens confirmation) */}
                    <button
                      onClick={() => setTaskToDelete(task)}
                      className="p-1 text-[var(--theme-text-muted)] hover:text-rose-600 transition-colors opacity-0 group-hover:opacity-100"
                      title="Delete task"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Expanded Subtasks & Description Drawer */}
                {isExpanded && (
                  <div className="p-3.5 sm:px-4 border-t border-[var(--theme-border)] bg-[var(--theme-surface-subtle)]/40 space-y-2 text-xs">
                    {task.description && (
                      <p className="text-[var(--theme-text-muted)] mb-2.5 italic">
                        {task.description}
                      </p>
                    )}

                    <div className="space-y-1.5">
                      {task.subtasks.map(st => (
                        <div
                          key={st.id}
                          onClick={() => onToggleSubtask(task.id, st.id)}
                          className="flex items-center gap-2 cursor-pointer py-1 px-2 rounded hover:bg-[var(--theme-surface)]"
                        >
                          <div
                            className={`w-3.5 h-3.5 rounded flex items-center justify-center border transition-colors ${
                              st.completed
                                ? 'bg-[var(--theme-accent)] border-[var(--theme-accent)] text-white'
                                : 'border-[var(--theme-border)]'
                            }`}
                          >
                            {st.completed && <Check className="w-2.5 h-2.5" />}
                          </div>
                          <span
                            className={`${
                              st.completed ? 'line-through text-[var(--theme-text-muted)]' : 'text-[var(--theme-text-primary)]'
                            }`}
                          >
                            {st.title}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Delete Confirmation Modal (Required for destructive actions) */}
      {taskToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="max-w-md w-full p-5 rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-surface)] shadow-lg animate-in fade-in">
            <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 mb-2">
              <AlertCircle className="w-5 h-5" />
              <h4 className="text-sm font-bold">Delete Task?</h4>
            </div>
            <p className="text-xs text-[var(--theme-text-muted)] mb-4">
              Are you sure you want to remove &quot;{taskToDelete.title}&quot;? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setTaskToDelete(null)}
                className="px-3 py-1.5 text-xs font-medium rounded-lg border border-[var(--theme-border)] hover:bg-[var(--theme-surface-subtle)]"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onDeleteTask(taskToDelete.id);
                  setTaskToDelete(null);
                }}
                className="px-3.5 py-1.5 text-xs font-semibold text-white bg-rose-600 rounded-lg hover:bg-rose-700"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
