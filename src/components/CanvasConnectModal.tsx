import React, { useState } from 'react';
import {
  CanvasCourse,
  CanvasAssignment,
} from '../types';
import {
  CanvasClient,
  SAMPLE_CANVAS_COURSES,
  getSampleCanvasAssignments,
} from '../services/canvasService';
import {
  Sparkles,
  X,
  BookOpen,
  Calendar,
  Check,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import { soundEngine } from '../services/audioService';

interface CanvasConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportAssignments: (assignments: CanvasAssignment[]) => void;
  savedDomain: string;
  savedToken: string;
  onSaveConfig: (cfg: { domain: string; token: string; isConnected: boolean; icalUrl: string }) => void;
}

export const CanvasConnectModal: React.FC<CanvasConnectModalProps> = ({
  isOpen,
  onClose,
  onImportAssignments,
  savedDomain,
  savedToken,
  onSaveConfig,
}) => {
  const [activeTab, setActiveTab] = useState<'token' | 'ical' | 'demo'>('token');
  const [domain, setDomain] = useState(savedDomain || 'canvas.instructure.com');
  const [token, setToken] = useState(savedToken || '');
  const [icalUrl, setIcalUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetched results
  const [courses, setCourses] = useState<CanvasCourse[]>([]);
  const [assignments, setAssignments] = useState<CanvasAssignment[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  if (!isOpen) return null;

  const handleFetchCanvas = async () => {
    setLoading(true);
    setError(null);
    try {
      const client = new CanvasClient(domain, token);
      const fetchedCourses = await client.fetchCourses();
      setCourses(fetchedCourses);

      const fetchedAssignments = await client.fetchAssignments(fetchedCourses);
      setAssignments(fetchedAssignments);

      // Select all by default
      setSelectedIds(new Set(fetchedAssignments.map(a => a.id)));

      onSaveConfig({
        domain,
        token,
        isConnected: true,
        icalUrl,
      });
      soundEngine.playGoalSuccess(0.4);
    } catch (err: any) {
      setError(err.message || 'Failed to connect to Canvas. Please verify your domain and access token.');
    } finally {
      setLoading(false);
    }
  };

  const handleLoadDemo = () => {
    setCourses(SAMPLE_CANVAS_COURSES);
    const demo = getSampleCanvasAssignments();
    setAssignments(demo);
    setSelectedIds(new Set(demo.map(a => a.id)));
    onSaveConfig({
      domain: 'canvas.instructure.com',
      token: 'demo-sample-token',
      isConnected: true,
      icalUrl: '',
    });
    soundEngine.playGoalSuccess(0.4);
  };

  const handleToggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const handleConfirmImport = () => {
    const toImport = assignments.filter(a => selectedIds.has(a.id));
    if (toImport.length > 0) {
      onImportAssignments(toImport);
      soundEngine.playGoalSuccess(0.5);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
      <div className="max-w-2xl w-full max-h-[90vh] flex flex-col rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-surface)] shadow-2xl overflow-hidden animate-in fade-in">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-[var(--theme-border)]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-[var(--theme-accent-soft)] text-[var(--theme-accent)]">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[var(--theme-text-primary)] font-['Plus_Jakarta_Sans']">
                Connect Canvas LMS
              </h3>
              <p className="text-xs text-[var(--theme-text-muted)]">
                Import active courses and homework deadlines directly into your study planner.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[var(--theme-text-muted)] hover:text-[var(--theme-text-primary)] hover:bg-[var(--theme-surface-subtle)]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content area */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Method tabs */}
          <div className="flex items-center gap-2 p-1 rounded-xl bg-[var(--theme-surface-subtle)] border border-[var(--theme-border)]">
            <button
              onClick={() => setActiveTab('token')}
              className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                activeTab === 'token'
                  ? 'bg-[var(--theme-surface)] text-[var(--theme-text-primary)] shadow-xs font-semibold'
                  : 'text-[var(--theme-text-muted)] hover:text-[var(--theme-text-primary)]'
              }`}
            >
              API Access Token
            </button>
            <button
              onClick={() => setActiveTab('ical')}
              className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                activeTab === 'ical'
                  ? 'bg-[var(--theme-surface)] text-[var(--theme-text-primary)] shadow-xs font-semibold'
                  : 'text-[var(--theme-text-muted)] hover:text-[var(--theme-text-primary)]'
              }`}
            >
              Canvas Calendar Feed (iCal)
            </button>
            <button
              onClick={() => setActiveTab('demo')}
              className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                activeTab === 'demo'
                  ? 'bg-[var(--theme-surface)] text-[var(--theme-text-primary)] shadow-xs font-semibold'
                  : 'text-[var(--theme-text-muted)] hover:text-[var(--theme-text-primary)]'
              }`}
            >
              Instant Demo Data
            </button>
          </div>

          {/* Tab 1: API Token */}
          {activeTab === 'token' && (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-[var(--theme-text-primary)] mb-1">
                  School Canvas Domain
                </label>
                <input
                  type="text"
                  value={domain}
                  onChange={e => setDomain(e.target.value)}
                  placeholder="e.g. canvas.instructure.com or canvas.harvard.edu"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-[var(--theme-border)] bg-[var(--theme-surface)] text-[var(--theme-text-primary)] font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[var(--theme-text-primary)] mb-1">
                  Canvas Personal Access Token
                </label>
                <input
                  type="password"
                  value={token}
                  onChange={e => setToken(e.target.value)}
                  placeholder="Canvas Settings > Approved Integrations > + New Access Token"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-[var(--theme-border)] bg-[var(--theme-surface)] text-[var(--theme-text-primary)] font-mono"
                />
                <p className="text-[11px] text-[var(--theme-text-muted)] mt-1">
                  In Canvas, go to Account &gt; Settings &gt; Approved Integrations &gt; &quot;+ New Access Token&quot;.
                </p>
              </div>

              {error && (
                <div className="flex items-center gap-2 p-3 text-xs text-rose-600 dark:text-rose-400 rounded-lg bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="flex justify-between items-center pt-2">
                <button
                  type="button"
                  onClick={handleLoadDemo}
                  className="text-xs text-[var(--theme-accent)] hover:underline"
                >
                  Don&apos;t have a token right now? Click to load sample courses
                </button>
                <button
                  onClick={handleFetchCanvas}
                  disabled={loading}
                  className="px-4 py-2 text-xs font-semibold text-white bg-[var(--theme-accent)] rounded-lg hover:opacity-90 disabled:opacity-50"
                >
                  {loading ? 'Connecting...' : 'Fetch Canvas Courses'}
                </button>
              </div>
            </div>
          )}

          {/* Tab 2: iCal Feed */}
          {activeTab === 'ical' && (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-[var(--theme-text-primary)] mb-1">
                  Canvas Calendar iCal Feed URL
                </label>
                <input
                  type="url"
                  value={icalUrl}
                  onChange={e => setIcalUrl(e.target.value)}
                  placeholder="https://canvas.instructure.com/feeds/calendars/user_..."
                  className="w-full px-3 py-2 text-xs rounded-lg border border-[var(--theme-border)] bg-[var(--theme-surface)] text-[var(--theme-text-primary)] font-mono"
                />
                <p className="text-[11px] text-[var(--theme-text-muted)] mt-1">
                  In Canvas, go to Calendar &gt; Calendar Feed &gt; Copy link.
                </p>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={handleFetchCanvas}
                  disabled={loading}
                  className="px-4 py-2 text-xs font-semibold text-white bg-[var(--theme-accent)] rounded-lg hover:opacity-90 disabled:opacity-50"
                >
                  {loading ? 'Reading Feed...' : 'Sync Calendar Feed'}
                </button>
              </div>
            </div>
          )}

          {/* Tab 3: Instant Demo */}
          {activeTab === 'demo' && (
            <div className="space-y-3 p-4 rounded-xl border border-[var(--theme-border)] bg-[var(--theme-surface-subtle)] text-center">
              <BookOpen className="w-8 h-8 mx-auto text-[var(--theme-accent)]" />
              <h4 className="text-sm font-bold text-[var(--theme-text-primary)]">
                Explore Demo Courses
              </h4>
              <p className="text-xs text-[var(--theme-text-muted)] max-w-sm mx-auto">
                Instantly simulate a student Canvas environment with CS 106A, Math 51, Bio 81, and Writing 1 courses and real assignments.
              </p>
              <button
                onClick={handleLoadDemo}
                className="px-4 py-2 text-xs font-semibold text-white bg-[var(--theme-accent)] rounded-lg hover:opacity-90"
              >
                Populate Demo Assignments
              </button>
            </div>
          )}

          {/* Assignment Selection Results */}
          {assignments.length > 0 && (
            <div className="pt-4 border-t border-[var(--theme-border)]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-[var(--theme-text-primary)]">
                  Discovered Canvas Assignments ({assignments.length})
                </span>
                <span className="text-[11px] text-[var(--theme-text-muted)]">
                  Select items to add to your to-do planner
                </span>
              </div>

              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {assignments.map(asg => {
                  const isSelected = selectedIds.has(asg.id);
                  return (
                    <div
                      key={asg.id}
                      onClick={() => handleToggleSelect(asg.id)}
                      className={`flex items-center justify-between p-2.5 rounded-lg border cursor-pointer transition-colors ${
                        isSelected
                          ? 'border-[var(--theme-accent)] bg-[var(--theme-accent-soft)]/40'
                          : 'border-[var(--theme-border)] bg-[var(--theme-surface)] hover:bg-[var(--theme-surface-subtle)]'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className={`w-4 h-4 rounded flex items-center justify-center border ${
                            isSelected
                              ? 'bg-[var(--theme-accent)] border-[var(--theme-accent)] text-white'
                              : 'border-[var(--theme-border)]'
                          }`}
                        >
                          {isSelected && <Check className="w-3 h-3" />}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-[var(--theme-text-primary)] truncate">
                            {asg.name}
                          </p>
                          <div className="flex items-center gap-2 text-[10px] text-[var(--theme-text-muted)] font-mono">
                            <span className="text-[var(--theme-accent)] font-semibold">{asg.courseName}</span>
                            {asg.dueAt && (
                              <span>Due {new Date(asg.dueAt).toLocaleDateString()}</span>
                            )}
                          </div>
                        </div>
                      </div>

                      {asg.htmlUrl && (
                        <a
                          href={asg.htmlUrl}
                          target="_blank"
                          rel="noreferrer"
                          onClick={e => e.stopPropagation()}
                          className="p-1 text-[var(--theme-text-muted)] hover:text-[var(--theme-text-primary)]"
                        >
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-[var(--theme-border)] bg-[var(--theme-surface-subtle)]">
          <span className="text-xs text-[var(--theme-text-muted)]">
            {selectedIds.size} assignment{selectedIds.size === 1 ? '' : 's'} selected
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3 py-1.5 text-xs font-medium text-[var(--theme-text-muted)] hover:text-[var(--theme-text-primary)]"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmImport}
              disabled={selectedIds.size === 0}
              className="px-4 py-1.5 text-xs font-semibold text-white bg-[var(--theme-accent)] rounded-lg hover:opacity-90 disabled:opacity-50"
            >
              Import to Planner
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
