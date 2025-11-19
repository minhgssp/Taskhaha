export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'DONE';
export type Collection = 'Work' | 'Life';
export type TaskColor = 'red' | 'yellow' | 'teal' | 'pink';
export type ChatMode = 'task' | 'freechat';
export type AuthState = 'pending' | 'guest' | 'premium';

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  collection: Collection;
  dueDate?: string; // YYYY-MM-DD
  dueTime?: string; // HH:MM
  order: number;
  tags?: string[]; // Hashtags for the task
  color?: TaskColor;
  // FIX: Added googleEventId to link tasks with Google Calendar events.
  googleEventId?: string;
}

export interface Column {
  id: TaskStatus;
  title: string;
}

export interface Note {
  id: string;
  title: string;
  content: string;
}

export type Message = {
  sender: 'user' | 'bot';
  text: string;
};

// Types for AI Action Confirmation
export type CreateActionData = Omit<Task, 'id' | 'order'>;
export type UpdateActionData = { 
  taskId: string; 
  newTitle?: string;
  newStatus?: TaskStatus;
  newCollection?: Collection;
  newDescription?: string;
  newDueDate?: string;
  newDueTime?: string;
  newTags?: string[];
  newColor?: TaskColor;
};
export type DeleteActionData = { taskId: string };

export interface Plan {
  creations: CreateActionData[];
  updates: UpdateActionData[];
  deletions: DeleteActionData[];
}

export type PlanAction = 
  | { type: 'CREATE'; data: CreateActionData }
  | { type: 'UPDATE'; data: UpdateActionData }
  | { type: 'DELETE'; data: DeleteActionData };