import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  User,
  signOut,
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';
import { CalendarMeeting } from '../types';

// Initialize Firebase App singleton
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);

export const CALENDAR_SCOPES = [
  'https://www.googleapis.com/auth/calendar.events.readonly',
  'https://www.googleapis.com/auth/calendar.events',
];

const provider = new GoogleAuthProvider();
CALENDAR_SCOPES.forEach(scope => provider.addScope(scope));

// In-memory token cache (NEVER localStorage per Workspace Skill guidelines)
let cachedAccessToken: string | null = null;
let isSigningIn = false;

export const initGoogleAuth = (
  onSuccess?: (user: User, token: string) => void,
  onFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (cachedAccessToken) {
        if (onSuccess) onSuccess(user, cachedAccessToken);
      } else if (!isSigningIn) {
        cachedAccessToken = null;
        if (onFailure) onFailure();
      }
    } else {
      cachedAccessToken = null;
      if (onFailure) onFailure();
    }
  });
};

export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Failed to obtain Google access token');
    }
    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error) {
    console.error('Google Sign-In Error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const getAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken;
};

export const googleSignOut = async () => {
  await signOut(auth);
  cachedAccessToken = null;
};

// Fetch user's Google Calendar events
export const fetchGoogleCalendarEvents = async (
  accessToken: string,
  timeMin?: string,
  timeMax?: string
): Promise<CalendarMeeting[]> => {
  try {
    const min = timeMin || new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const max = timeMax || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    const url = new URL('https://www.googleapis.com/calendar/v3/calendars/primary/events');
    url.searchParams.set('timeMin', min);
    url.searchParams.set('timeMax', max);
    url.searchParams.set('singleEvents', 'true');
    url.searchParams.set('orderBy', 'startTime');
    url.searchParams.set('maxResults', '50');

    const res = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || `Google Calendar API error (${res.status})`);
    }

    const data = await res.json();
    const items = data.items || [];

    return items.map((item: any) => {
      const startDateTime = item.start?.dateTime || item.start?.date || '';
      const endDateTime = item.end?.dateTime || item.end?.date || '';

      const startDate = startDateTime.includes('T') ? startDateTime.split('T')[0] : startDateTime;
      const startTime = startDateTime.includes('T') ? startDateTime.split('T')[1].substring(0, 5) : '09:00';

      const endDate = endDateTime.includes('T') ? endDateTime.split('T')[0] : startDate;
      const endTime = endDateTime.includes('T') ? endDateTime.split('T')[1].substring(0, 5) : '10:00';

      // Parse video meeting link if present in conferenceData or location
      const meetingLink = item.hangoutLink || 
        (item.location && item.location.startsWith('http') ? item.location : undefined);

      return {
        id: `gcal-${item.id}`,
        googleEventId: item.id,
        isGoogleEvent: true,
        title: item.summary || 'Untitled Event',
        description: item.description || '',
        startDate,
        startTime,
        endDate,
        endTime,
        location: item.location || '',
        meetingLink,
        reminderMinutesBefore: 10,
      };
    });
  } catch (error) {
    console.error('Failed to fetch Google Calendar events:', error);
    throw error;
  }
};

// Insert a new meeting / study block into Google Calendar with notification reminders
export const insertGoogleCalendarEvent = async (
  accessToken: string,
  event: {
    summary: string;
    description?: string;
    startDate: string;
    startTime: string;
    endDate: string;
    endTime: string;
    location?: string;
    meetingLink?: string;
    reminderMinutes?: number;
  }
): Promise<string> => {
  const startDateTime = `${event.startDate}T${event.startTime}:00`;
  const endDateTime = `${event.endDate}T${event.endTime}:00`;
  const reminderMinutes = event.reminderMinutes ?? 10;

  const payload: any = {
    summary: event.summary,
    description: event.description || '',
    start: {
      dateTime: new Date(startDateTime).toISOString(),
    },
    end: {
      dateTime: new Date(endDateTime).toISOString(),
    },
    location: event.location || event.meetingLink || '',
    reminders: {
      useDefault: false,
      overrides: [
        { method: 'popup', minutes: reminderMinutes },
      ],
    },
  };

  const res = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Failed to create calendar event (${res.status})`);
  }

  const data = await res.json();
  return data.id;
};
