import React, { useState } from 'react';
import { QuickNote, Task } from '../types';
import {
  StickyNote,
  X,
  Plus,
  ArrowRight,
  Trash2,
  Pin,
  Sparkles,
  Check,
  Minimize2,
} from 'lucide-react';
import { soundEngine } from '../services/audioService';

interface QuickNotesProps {
  notes: QuickNote[];
  onAddNote: (content: string, color: QuickNote['color'], isPinned?: boolean) => void;
  onDeleteNote: (id: string) => void;
  onTogglePin: (id: string) => void;
  onConvertToTask: (note: QuickNote) => void;
}

export const FloatingQuickNotes: React.FC<QuickNotesProps> = ({
  notes,
  onAddNote,
  onDeleteNote,
  onTogglePin,
  onConvertToTask,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [newContent, setNewContent] = useState('');
  const [selectedColor, setSelectedColor] = useState<QuickNote['color']>('default');
  const [isPinned, setIsPinned] = useState(false);
  const [isComposing, setIsComposing] = useState(false);
  const [convertedId, setConvertedId] = useState<string | null>(null);

  const handleCreateNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContent.trim()) return;
    onAddNote(newContent.trim(), selectedColor, isPinned);
    setNewContent('');
    setIsComposing(false);
    soundEngine.playGoalSuccess(0.3);
  };

  const handleConvert = (note: QuickNote) => {
    onConvertToTask(note);
    setConvertedId(note.id);
    soundEngine.playGoalSuccess(0.5);
    setTimeout(() => {
      setConvertedId(null);
    }, 2000);
  };

  // Sort: pinned first, then newest
  const sortedNotes = [...notes].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const getColorClasses = (color?: QuickNote['color']) => {
    switch (color) {
      case 'sage':
        return 'bg-emerald-50/70 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/60';
      case 'peach':
        return 'bg-amber-50/70 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800/60';
      case 'lavender':
        return 'bg-purple-50/70 dark:bg-purple-950/20 border-purple-200 dark:border-purple-800/60';
      default:
        return 'bg-[var(--theme-surface-subtle)] border-[var(--theme-border)]';
    }
  };

  // Time ago formatter
  const formatTimeAgo = (isoDate: string) => {
    const diffMs = Date.now() - new Date(isoDate).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return new Date(isoDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <>
      {/* Floating Toggle Button (Always visible on bottom-right) */}
      <div className="fixed bottom-5 right-5 z-40">
        {!isOpen && (
          <button
            onClick={() => setIsOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-full border border-[var(--theme-border)] bg-[var(--theme-surface)] text-[var(--theme-text-primary)] shadow-lg hover:shadow-xl hover:border-[var(--theme-accent)] transition-all active:scale-95 group"
            title="Open Quick Notes scratchpad"
          >
            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[var(--theme-accent-soft)] text-[var(--theme-accent)] group-hover:scale-110 transition-transform">
              <StickyNote className="w-3.5 h-3.5" />
            </div>
            <span className="text-xs font-semibold font-['Plus_Jakarta_Sans']">Quick Notes</span>
            {notes.length > 0 && (
              <span className="flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-[var(--theme-accent)] text-white text-[10px] font-mono font-bold">
                {notes.length}
              </span>
            )}
          </button>
        )}
      </div>

      {/* Floating Notes Panel */}
      {isOpen && (
        <div className="fixed bottom-5 right-4 sm:right-6 z-50 w-[92vw] sm:w-96 max-h-[82vh] flex flex-col rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-surface)] shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-4">
          {/* Header */}
          <div className="flex items-center justify-between p-3.5 border-b border-[var(--theme-border)] bg-[var(--theme-surface-subtle)]/50">
            <div className="flex items-center gap-2">
              <StickyNote className="w-4 h-4 text-[var(--theme-accent)]" />
              <h3 className="text-xs font-bold text-[var(--theme-text-primary)] font-['Plus_Jakarta_Sans']">
                Quick Scratchpad ({notes.length})
              </h3>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setIsComposing(!isComposing)}
                className={`p-1.5 rounded-lg border text-xs font-medium transition-colors ${
                  isComposing
                    ? 'border-[var(--theme-accent)] bg-[var(--theme-accent-soft)] text-[var(--theme-accent)]'
                    : 'border-[var(--theme-border)] text-[var(--theme-text-muted)] hover:text-[var(--theme-text-primary)]'
                }`}
                title="New Quick Note"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg text-[var(--theme-text-muted)] hover:text-[var(--theme-text-primary)] hover:bg-[var(--theme-surface)] transition-colors"
                title="Minimize Quick Notes"
              >
                <Minimize2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* New Note Composer Drawer */}
          {isComposing && (
            <form onSubmit={handleCreateNote} className="p-3.5 border-b border-[var(--theme-border)] bg-[var(--theme-surface-subtle)]/70 space-y-2.5">
              <textarea
                rows={3}
                value={newContent}
                onChange={e => setNewContent(e.target.value)}
                placeholder="Jot down a thought, study reminder, or formula..."
                className="w-full px-3 py-2 text-xs rounded-lg border border-[var(--theme-border)] bg-[var(--theme-surface)] text-[var(--theme-text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--theme-accent)] placeholder:text-[var(--theme-text-muted)]"
                autoFocus
              />

              <div className="flex items-center justify-between gap-2">
                {/* Color swatches */}
                <div className="flex items-center gap-1">
                  {(['default', 'sage', 'peach', 'lavender'] as QuickNote['color'][]).map(c => (
                    <button
                      type="button"
                      key={c}
                      onClick={() => setSelectedColor(c)}
                      className={`w-4 h-4 rounded-full border transition-all ${
                        selectedColor === c ? 'ring-2 ring-[var(--theme-accent)] scale-110' : 'opacity-70 hover:opacity-100'
                      }`}
                      style={{
                        backgroundColor:
                          c === 'sage'
                            ? '#7C9082'
                            : c === 'peach'
                            ? '#D9886C'
                            : c === 'lavender'
                            ? '#9D8EC2'
                            : '#8E9BAE',
                      }}
                    />
                  ))}

                  <button
                    type="button"
                    onClick={() => setIsPinned(!isPinned)}
                    className={`ml-1 p-1 rounded hover:bg-[var(--theme-surface)] transition-colors ${
                      isPinned ? 'text-[var(--theme-accent)]' : 'text-[var(--theme-text-muted)]'
                    }`}
                    title={isPinned ? 'Pinned to top' : 'Pin note'}
                  >
                    <Pin className="w-3 h-3" />
                  </button>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setIsComposing(false)}
                    className="px-2.5 py-1 text-xs text-[var(--theme-text-muted)] hover:text-[var(--theme-text-primary)]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!newContent.trim()}
                    className="px-3 py-1 text-xs font-semibold text-white bg-[var(--theme-accent)] rounded-lg hover:opacity-90 disabled:opacity-50"
                  >
                    Save Note
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* Notes Stream */}
          <div className="flex-1 overflow-y-auto p-3.5 space-y-2.5 max-h-[55vh]">
            {sortedNotes.length === 0 ? (
              <div className="py-8 text-center text-xs text-[var(--theme-text-muted)] space-y-1">
                <Sparkles className="w-5 h-5 mx-auto text-[var(--theme-accent)] opacity-60 mb-1" />
                <p className="font-semibold text-[var(--theme-text-primary)]">Your scratchpad is empty.</p>
                <p className="text-[11px]">Jot down fleeting lecture takeaways or tasks to convert later.</p>
                <button
                  onClick={() => setIsComposing(true)}
                  className="mt-2 px-3 py-1 text-xs font-medium rounded-md border border-[var(--theme-border)] text-[var(--theme-accent)] hover:bg-[var(--theme-surface-subtle)]"
                >
                  + Write a note
                </button>
              </div>
            ) : (
              sortedNotes.map(note => {
                const isConverted = convertedId === note.id;
                return (
                  <div
                    key={note.id}
                    className={`group relative p-3 rounded-xl border transition-all ${getColorClasses(
                      note.color
                    )}`}
                  >
                    {/* Note Content */}
                    <p className="text-xs text-[var(--theme-text-primary)] leading-relaxed whitespace-pre-wrap select-text pr-5">
                      {note.content}
                    </p>

                    {/* Footer: Time ago & Actions */}
                    <div className="flex items-center justify-between gap-2 mt-2 pt-2 border-t border-black/5 dark:border-white/5 text-[10px] text-[var(--theme-text-muted)]">
                      <span className="font-mono">{formatTimeAgo(note.createdAt)}</span>

                      <div className="flex items-center gap-1.5">
                        {/* 1-Click Convert to Task */}
                        <button
                          onClick={() => handleConvert(note)}
                          disabled={isConverted}
                          className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-[var(--theme-surface)] text-[var(--theme-accent)] font-semibold border border-[var(--theme-border)] hover:border-[var(--theme-accent)] transition-all shadow-xs"
                          title="Convert this note into a to-do task"
                        >
                          {isConverted ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-500" />
                              <span className="text-emerald-600 dark:text-emerald-400">Converted!</span>
                            </>
                          ) : (
                            <>
                              <ArrowRight className="w-3 h-3" />
                              <span>To Task</span>
                            </>
                          )}
                        </button>

                        {/* Pin toggle */}
                        <button
                          onClick={() => onTogglePin(note.id)}
                          className={`p-1 rounded hover:bg-black/5 dark:hover:bg-white/5 transition-colors ${
                            note.isPinned ? 'text-[var(--theme-accent)]' : 'text-[var(--theme-text-muted)]'
                          }`}
                          title={note.isPinned ? 'Unpin' : 'Pin'}
                        >
                          <Pin className="w-3 h-3" />
                        </button>

                        {/* Delete note */}
                        <button
                          onClick={() => onDeleteNote(note.id)}
                          className="p-1 rounded text-[var(--theme-text-muted)] hover:text-rose-500 hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                          title="Delete note"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Quick Footer hint */}
          <div className="p-2.5 border-t border-[var(--theme-border)] bg-[var(--theme-surface-subtle)] text-[10px] text-[var(--theme-text-muted)] flex items-center justify-between">
            <span>Saved in local storage</span>
            <button
              onClick={() => setIsComposing(true)}
              className="font-medium text-[var(--theme-accent)] hover:underline"
            >
              + Quick Note
            </button>
          </div>
        </div>
      )}
    </>
  );
};
