import React, { useState } from 'react';
import { CalendarMeeting } from '../types';
import {
  Calendar,
  Clock,
  MapPin,
  Video,
  Plus,
  Bell,
  Trash2,
  ExternalLink,
  AlertCircle,
  Sparkles,
} from 'lucide-react';

interface MeetingCalendarProps {
  meetings: CalendarMeeting[];
  onAddMeeting: (meeting: Omit<CalendarMeeting, 'id'>) => Promise<void>;
  onDeleteMeeting: (id: string) => void;
  isGoogleConnected: boolean;
  onConnectGoogle: () => void;
}

export const MeetingCalendarSection: React.FC<MeetingCalendarProps> = ({
  meetings,
  onAddMeeting,
  onDeleteMeeting,
  isGoogleConnected,
  onConnectGoogle,
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [meetingToDelete, setMeetingToDelete] = useState<CalendarMeeting | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Form state
  const todayStr = new Date().toISOString().split('T')[0];
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState(todayStr);
  const [startTime, setStartTime] = useState('14:00');
  const [endDate, setEndDate] = useState(todayStr);
  const [endTime, setEndTime] = useState('15:00');
  const [location, setLocation] = useState('');
  const [meetingLink, setMeetingLink] = useState('');
  const [reminderMinutes, setReminderMinutes] = useState(15);
  const [syncToGcal, setSyncToGcal] = useState(isGoogleConnected);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsSaving(true);
    try {
      await onAddMeeting({
        title: title.trim(),
        description: description.trim() || undefined,
        startDate,
        startTime,
        endDate: endDate || startDate,
        endTime,
        location: location.trim() || undefined,
        meetingLink: meetingLink.trim() || undefined,
        reminderMinutesBefore: reminderMinutes,
        isGoogleEvent: syncToGcal && isGoogleConnected,
      });

      // Reset
      setTitle('');
      setDescription('');
      setLocation('');
      setMeetingLink('');
      setIsAdding(false);
    } catch (err) {
      console.error('Error adding meeting:', err);
    } finally {
      setIsSaving(false);
    }
  };

  // Convert 24-hr time string "14:00" to "2:00 PM"
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

  // Sort meetings by date & time
  const sortedMeetings = [...meetings].sort((a, b) => {
    const aTime = `${a.startDate} ${a.startTime}`;
    const bTime = `${b.startDate} ${b.startTime}`;
    return aTime.localeCompare(bTime);
  });

  return (
    <section className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-surface)]">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-[var(--theme-accent-soft)] text-[var(--theme-accent)]">
              <Calendar className="w-3.5 h-3.5" />
            </span>
            <h2 className="text-lg font-bold tracking-tight text-[var(--theme-text-primary)] font-['Plus_Jakarta_Sans']">
              Schedule & Meetings
            </h2>
          </div>
          <p className="mt-1 text-xs text-[var(--theme-text-muted)]">
            Keep classes, office hours, and study sessions organized with automatic prior notifications.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {!isGoogleConnected ? (
            <button
              onClick={onConnectGoogle}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-[var(--theme-border)] hover:bg-[var(--theme-surface-subtle)] transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5 text-[var(--theme-accent)]" />
              <span>Connect Google Calendar</span>
            </button>
          ) : (
            <span className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md bg-[var(--theme-accent-soft)] text-[var(--theme-accent)]">
              <span className="w-2 h-2 rounded-full bg-[var(--theme-accent)]" />
              <span>Google Calendar Synced</span>
            </span>
          )}

          <button
            onClick={() => setIsAdding(!isAdding)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-[var(--theme-accent)] rounded-lg hover:opacity-90 transition-opacity whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Meeting</span>
          </button>
        </div>
      </div>

      {/* Add Meeting Form Modal / Card */}
      {isAdding && (
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-surface)] shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-[var(--theme-border)] mb-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--theme-text-primary)]">
              Schedule New Meeting or Class
            </h3>
            <span className="text-[11px] text-[var(--theme-text-muted)]">
              Includes automatic alert notification prior to start
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3.5">
            <div className="sm:col-span-12">
              <label className="block text-[11px] font-medium text-[var(--theme-text-muted)] mb-1">
                Meeting / Event Title *
              </label>
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="e.g. Physics 41 Discussion Section or TA Office Hours with Alex"
                className="w-full px-3 py-2 text-xs rounded-md border border-[var(--theme-border)] bg-[var(--theme-surface-subtle)] text-[var(--theme-text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--theme-accent)]"
                autoFocus
                required
              />
            </div>

            <div className="sm:col-span-3">
              <label className="block text-[11px] font-medium text-[var(--theme-text-muted)] mb-1">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                className="w-full px-3 py-1.5 text-xs font-mono rounded-md border border-[var(--theme-border)] bg-[var(--theme-surface-subtle)] text-[var(--theme-text-primary)]"
                required
              />
            </div>

            <div className="sm:col-span-3">
              <label className="block text-[11px] font-medium text-[var(--theme-text-muted)] mb-1">Start Time</label>
              <input
                type="time"
                value={startTime}
                onChange={e => setStartTime(e.target.value)}
                className="w-full px-3 py-1.5 text-xs font-mono rounded-md border border-[var(--theme-border)] bg-[var(--theme-surface-subtle)] text-[var(--theme-text-primary)]"
                required
              />
            </div>

            <div className="sm:col-span-3">
              <label className="block text-[11px] font-medium text-[var(--theme-text-muted)] mb-1">End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                className="w-full px-3 py-1.5 text-xs font-mono rounded-md border border-[var(--theme-border)] bg-[var(--theme-surface-subtle)] text-[var(--theme-text-primary)]"
                required
              />
            </div>

            <div className="sm:col-span-3">
              <label className="block text-[11px] font-medium text-[var(--theme-text-muted)] mb-1">End Time</label>
              <input
                type="time"
                value={endTime}
                onChange={e => setEndTime(e.target.value)}
                className="w-full px-3 py-1.5 text-xs font-mono rounded-md border border-[var(--theme-border)] bg-[var(--theme-surface-subtle)] text-[var(--theme-text-primary)]"
                required
              />
            </div>

            <div className="sm:col-span-6">
              <label className="block text-[11px] font-medium text-[var(--theme-text-muted)] mb-1">
                Location or Room
              </label>
              <input
                type="text"
                value={location}
                onChange={e => setLocation(e.target.value)}
                placeholder="e.g. Science Center Room 204 or Green Library"
                className="w-full px-3 py-2 text-xs rounded-md border border-[var(--theme-border)] bg-[var(--theme-surface-subtle)] text-[var(--theme-text-primary)]"
              />
            </div>

            <div className="sm:col-span-6">
              <label className="block text-[11px] font-medium text-[var(--theme-text-muted)] mb-1">
                Virtual Video Link (Zoom / Meet)
              </label>
              <input
                type="url"
                value={meetingLink}
                onChange={e => setMeetingLink(e.target.value)}
                placeholder="e.g. https://meet.google.com/xyz or https://zoom.us/j/..."
                className="w-full px-3 py-2 text-xs rounded-md border border-[var(--theme-border)] bg-[var(--theme-surface-subtle)] text-[var(--theme-text-primary)]"
              />
            </div>

            <div className="sm:col-span-6">
              <label className="block text-[11px] font-medium text-[var(--theme-text-muted)] mb-1">
                Notify Me Prior To Meeting:
              </label>
              <select
                value={reminderMinutes}
                onChange={e => setReminderMinutes(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs rounded-md border border-[var(--theme-border)] bg-[var(--theme-surface-subtle)] text-[var(--theme-text-primary)]"
              >
                <option value={5}>5 minutes prior</option>
                <option value={10}>10 minutes prior</option>
                <option value={15}>15 minutes prior (recommended)</option>
                <option value={30}>30 minutes prior</option>
                <option value={60}>1 hour prior</option>
              </select>
            </div>

            <div className="sm:col-span-6 flex items-center pt-5">
              {isGoogleConnected ? (
                <label className="flex items-center gap-2 text-xs text-[var(--theme-text-primary)] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={syncToGcal}
                    onChange={e => setSyncToGcal(e.target.checked)}
                    className="rounded text-[var(--theme-accent)]"
                  />
                  <span>Sync also to Google Calendar live</span>
                </label>
              ) : (
                <span className="text-[11px] text-[var(--theme-text-muted)]">
                  (Connect Google Calendar to sync directly to your Google account)
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2.5 mt-5 pt-3 border-t border-[var(--theme-border)]">
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="px-3.5 py-1.5 text-xs font-medium text-[var(--theme-text-muted)] hover:text-[var(--theme-text-primary)]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-4 py-1.5 text-xs font-semibold text-white bg-[var(--theme-accent)] rounded-lg hover:opacity-90 disabled:opacity-50"
            >
              {isSaving ? 'Saving...' : 'Add Meeting & Schedule Alert'}
            </button>
          </div>
        </form>
      )}

      {/* Meetings Schedule List */}
      <div className="space-y-3">
        {sortedMeetings.length === 0 ? (
          <div className="py-12 text-center rounded-2xl border border-dashed border-[var(--theme-border)] bg-[var(--theme-surface)]">
            <Calendar className="w-8 h-8 mx-auto text-[var(--theme-accent)] opacity-60 mb-2" />
            <p className="text-xs font-semibold text-[var(--theme-text-primary)]">No upcoming meetings or classes.</p>
            <p className="text-[11px] text-[var(--theme-text-muted)] mt-0.5">
              Add your lectures, study groups, and office hours with custom notification times.
            </p>
            <button
              onClick={() => setIsAdding(true)}
              className="mt-3 px-3 py-1.5 text-xs font-medium text-white bg-[var(--theme-accent)] rounded-lg hover:opacity-90"
            >
              + Add First Meeting
            </button>
          </div>
        ) : (
          sortedMeetings.map(meeting => {
            const isToday = meeting.startDate === todayStr;

            return (
              <div
                key={meeting.id}
                className="group flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border border-[var(--theme-border)] bg-[var(--theme-surface)] hover:border-[var(--theme-accent)]/60 transition-all"
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div className="flex flex-col items-center justify-center w-12 h-12 rounded-lg bg-[var(--theme-surface-subtle)] border border-[var(--theme-border)] shrink-0 font-mono">
                    <span className="text-[10px] text-[var(--theme-text-muted)] uppercase">
                      {new Date(meeting.startDate + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short' })}
                    </span>
                    <span className="text-sm font-bold text-[var(--theme-text-primary)]">
                      {meeting.startDate.split('-')[2]}
                    </span>
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs sm:text-sm font-bold text-[var(--theme-text-primary)] truncate">
                        {meeting.title}
                      </h4>
                      {isToday && (
                        <span className="text-[10px] font-semibold text-[var(--theme-accent)] font-mono">
                          Today
                        </span>
                      )}
                      {meeting.isGoogleEvent && (
                        <span className="text-[10px] text-blue-600 dark:text-blue-400 font-mono">
                          Google Calendar
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3 mt-1 text-[11px] text-[var(--theme-text-muted)] flex-wrap">
                      <span className="flex items-center gap-1 font-mono tabular-nums">
                        <Clock className="w-3 h-3" />
                        <span>
                          {formatTime12h(meeting.startTime)} – {formatTime12h(meeting.endTime)}
                        </span>
                      </span>

                      {meeting.location && (
                        <span className="flex items-center gap-1 truncate max-w-xs">
                          <MapPin className="w-3 h-3 shrink-0" />
                          <span className="truncate">{meeting.location}</span>
                        </span>
                      )}

                      <span className="flex items-center gap-1 text-[var(--theme-accent)] font-mono">
                        <Bell className="w-3 h-3" />
                        <span>Alert: {meeting.reminderMinutesBefore}m prior</span>
                      </span>
                    </div>

                    {meeting.description && (
                      <p className="mt-1 text-[11px] text-[var(--theme-text-muted)] italic truncate">
                        {meeting.description}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 shrink-0">
                  {meeting.meetingLink && (
                    <a
                      href={meeting.meetingLink}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg bg-[var(--theme-accent-soft)] text-[var(--theme-accent)] hover:opacity-90 transition-opacity"
                    >
                      <Video className="w-3.5 h-3.5" />
                      <span>Join Call</span>
                    </a>
                  )}

                  <button
                    onClick={() => setMeetingToDelete(meeting)}
                    className="p-1.5 text-[var(--theme-text-muted)] hover:text-rose-600 transition-colors opacity-0 group-hover:opacity-100"
                    title="Delete meeting"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {meetingToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="max-w-md w-full p-5 rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-surface)] shadow-lg animate-in fade-in">
            <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 mb-2">
              <AlertCircle className="w-5 h-5" />
              <h4 className="text-sm font-bold">Delete Meeting?</h4>
            </div>
            <p className="text-xs text-[var(--theme-text-muted)] mb-4">
              Are you sure you want to remove &quot;{meetingToDelete.title}&quot;?
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setMeetingToDelete(null)}
                className="px-3 py-1.5 text-xs font-medium rounded-lg border border-[var(--theme-border)] hover:bg-[var(--theme-surface-subtle)]"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onDeleteMeeting(meetingToDelete.id);
                  setMeetingToDelete(null);
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
