import type { Task } from '../types.ts';

declare global {
  interface Window {
    gapi: any;
    google: any;
    tokenClient: any;
  }
}

const DISCOVERY_DOCS = ["https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest"];
const SCOPES = "https://www.googleapis.com/auth/calendar";

let gapiInited = false;
let gisInited = false;

export function initClient(clientId: string, apiKey: string, updateSigninStatus: (isSignedIn: boolean) => void) {
  const loadGapi = () => new Promise<void>((resolve) => window.gapi.load('client', resolve));

  const initialize = async () => {
    await loadGapi();
    await window.gapi.client.init({ apiKey, discoveryDocs: DISCOVERY_DOCS });
    gapiInited = true;
    
    window.tokenClient = window.google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: SCOPES,
      callback: (resp: any) => {
        if (resp.error !== undefined) {
          // This was a likely source of '[object Object]' errors.
          // Instead of throwing an object, handle it gracefully with a user-friendly alert.
          console.error("Google sign-in error:", resp);
          const errorMessage = resp.error_description || resp.error || 'An unknown error occurred.';
          alert(`Google Sign-In Failed: ${errorMessage}`);
          updateSigninStatus(false);
          return;
        }
        updateSigninStatus(true);
      },
    });
    gisInited = true;
  };
  
  if(window.gapi && window.google) {
      // Added error handling for the initialization promise to prevent unhandled rejections.
      initialize().catch(error => {
        console.error("Error initializing Google API client:", error);
        const message = error?.result?.error?.message || "Please verify your Google Client ID and that the Calendar API is enabled.";
        alert(`Could not initialize Google Calendar: ${message}`);
      });
  }
}

export function signIn() {
  if (!gapiInited || !gisInited) {
    alert("Google API client is not initialized yet.");
    return;
  }
  if (window.gapi.client.getToken() === null) {
    window.tokenClient.requestAccessToken({ prompt: 'consent' });
  }
}

export function signOut() {
  const token = window.gapi.client.getToken();
  if (token !== null) {
    window.google.accounts.oauth2.revoke(token.access_token, () => {});
    window.gapi.client.setToken(null);
  }
}

function taskToGoogleEvent(task: Task): object {
  const event: {
    summary: string;
    description: string;
    start: { date?: string; dateTime?: string; timeZone: string; };
    end: { date?: string; dateTime?: string; timeZone: string; };
  } = {
    summary: task.title,
    description: `${task.description || ''}\n\nTags: #${(task.tags || []).join(', #')}`,
    start: { timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone },
    end: { timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone },
  };

  if (task.dueDate && task.dueTime) {
    const startTime = new Date(`${task.dueDate}T${task.dueTime}`).toISOString();
    // Default to 1 hour duration
    const endTime = new Date(new Date(`${task.dueDate}T${task.dueTime}`).getTime() + 60 * 60 * 1000).toISOString();
    event.start.dateTime = startTime;
    event.end.dateTime = endTime;
  } else if (task.dueDate) {
    event.start.date = task.dueDate;
    event.end.date = task.dueDate;
  } else {
      // Cannot create event without a date
      return {};
  }

  return event;
}

export async function createEvent(task: Task) {
    if(!task.dueDate) return;
    const event = taskToGoogleEvent(task);
    const request = window.gapi.client.calendar.events.insert({
        'calendarId': 'primary',
        'resource': event
    });
    const response = await request;
    return response.result;
}

export async function updateEvent(task: Task) {
    if(!task.googleEventId || !task.dueDate) return;
    const event = taskToGoogleEvent(task);
    const request = window.gapi.client.calendar.events.update({
        'calendarId': 'primary',
        'eventId': task.googleEventId,
        'resource': event
    });
    const response = await request;
    return response.result;
}

export async function deleteEvent(eventId: string) {
    const request = window.gapi.client.calendar.events.delete({
        'calendarId': 'primary',
        'eventId': eventId,
    });
    await request;
}

export async function listEvents() {
    const request = {
      'calendarId': 'primary',
      'timeMin': (new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)).toISOString(), // 30 days ago
      'showDeleted': true,
      'singleEvents': true,
      'maxResults': 100,
      'orderBy': 'startTime'
    };
    const response = await window.gapi.client.calendar.events.list(request);
    return response.result.items;
}

function googleEventToTask(event: any, existingTask?: Task): Omit<Task, 'order'> {
    let status: Task['status'] = 'TODO';
    // FIX: The 'collection' property was missing. It's now derived from an existing task or defaults to 'Work'.
    let collection: Task['collection'] = 'Work';
    if(existingTask) {
        status = existingTask.status;
        collection = existingTask.collection;
    }
    
    const dateTime = event.start.dateTime || event.start.date;
    const dueDate = dateTime ? new Date(dateTime).toISOString().split('T')[0] : undefined;
    const dueTime = event.start.dateTime ? new Date(dateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }) : undefined;
    
    return {
        id: existingTask?.id || Date.now().toString(),
        title: event.summary || 'Untitled Event',
        description: event.description,
        status,
        collection,
        dueDate,
        dueTime,
        googleEventId: event.id,
    };
}

export function syncEventsToTasks(events: any[], currentTasks: Task[]): Task[] {
  const newTasks = [...currentTasks];
  const taskMapByEventId = new Map(currentTasks.map(t => [t.googleEventId, t]));
  const eventIdsInResponse = new Set(events.map(e => e.id));

  events.forEach(event => {
    const existingTask = taskMapByEventId.get(event.id);
    if (event.status === 'cancelled') {
        if(existingTask) {
            const index = newTasks.findIndex(t => t.id === existingTask.id);
            if (index !== -1) newTasks.splice(index, 1);
        }
    } else {
        const updatedTaskData = googleEventToTask(event, existingTask);
        if (existingTask) {
            const index = newTasks.findIndex(t => t.id === existingTask.id);
            newTasks[index] = { ...existingTask, ...updatedTaskData };
        } else {
            const maxOrder = newTasks.filter(t => t.status === updatedTaskData.status).length;
            newTasks.push({ ...updatedTaskData, order: maxOrder });
        }
    }
  });

  return newTasks;
}