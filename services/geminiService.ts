import { GoogleGenAI, Type, FunctionDeclaration } from "@google/genai";
import type { Task, Message, Plan, Collection, ChatMode } from '../types.ts';
import { generateSystemPrompt, generateFreechatSystemPrompt } from "./promptService.ts";

class QuotaError extends Error {
  public isQuotaError: boolean;
  constructor(message: string) {
    super(message);
    this.name = 'QuotaError';
    this.isQuotaError = true;
  }
}

const createTaskSchema = {
    type: Type.OBJECT,
    description: 'A single task to be created.',
    properties: {
      title: { type: Type.STRING, description: 'The title of the task.' },
      description: { type: Type.STRING, description: 'A detailed description of the task.' },
      dueDate: { type: Type.STRING, description: 'The due date for the task in YYYY-MM-DD format.' },
      dueTime: { type: Type.STRING, description: 'The due time for the task in HH:MM (24h) format.' },
      status: { type: Type.STRING, enum: ['TODO', 'IN_PROGRESS', 'DONE'], description: 'The current status of the task.' },
      collection: { type: Type.STRING, enum: ['Work', 'Life'], description: "The collection the task belongs to, either 'Work' or 'Life'." },
      tags: { type: Type.ARRAY, items: { type: Type.STRING }, description: 'A list of relevant hashtags for the task (e.g., "design", "urgent").' },
      color: { type: Type.STRING, enum: ['red', 'yellow', 'teal', 'pink'], description: "An optional color highlight for the task. Can be one of: 'red', 'yellow', 'teal', 'pink'." }
    },
    required: ['title', 'collection'],
};

const updateTaskSchema = {
    type: Type.OBJECT,
    description: 'A single task to be updated.',
    properties: {
      taskId: { type: Type.STRING, description: 'The unique ID of the task to update.' },
      newStatus: { type: Type.STRING, enum: ['TODO', 'IN_PROGRESS', 'DONE'], description: 'The new status for the task.' },
      newCollection: { type: Type.STRING, enum: ['Work', 'Life'], description: "The new collection for the task, either 'Work' or 'Life'." },
      newTitle: { type: Type.STRING, description: 'The new title for the task.' },
      newDescription: { type: Type.STRING, description: 'The new description for the task.' },
      newDueDate: { type: Type.STRING, description: 'The new due date for the task in YYYY-MM-DD format.' },
      newDueTime: { type: Type.STRING, description: 'The new due time for the task in HH:MM (24h) format.' },
      newTags: { type: Type.ARRAY, items: { type: Type.STRING }, description: 'A new, complete list of hashtags for the task.' },
      newColor: { type: Type.STRING, enum: ['red', 'yellow', 'teal', 'pink'], description: "The new color for the task. Can be one of: 'red', 'yellow', 'teal', 'pink'." }
    },
    required: ['taskId'],
};

const deleteTaskSchema = {
    type: Type.OBJECT,
    description: 'A single task to be deleted.',
    properties: {
        taskId: { type: Type.STRING, description: 'The unique ID of the task to delete.' },
    },
    required: ['taskId'],
};


const proposePlanFunctionDeclaration: FunctionDeclaration = {
    name: 'proposePlan',
    description: "Proposes a comprehensive plan of actions (create, update, delete) to achieve a user's goal. Use this for complex requests that involve multiple tasks.",
    parameters: {
        type: Type.OBJECT,
        properties: {
            creations: { type: Type.ARRAY, items: createTaskSchema, description: "A list of new tasks to be created." },
            updates: { type: Type.ARRAY, items: updateTaskSchema, description: "A list of existing tasks to be modified."},
            deletions: { type: Type.ARRAY, items: deleteTaskSchema, description: "A list of tasks to be deleted." },
        }
    }
};

const deleteTaskFunctionDeclaration: FunctionDeclaration = {
    name: 'deleteTask',
    parameters: deleteTaskSchema
};

const createTaskFunctionDeclaration: FunctionDeclaration = {
  name: 'createTask',
  parameters: createTaskSchema,
};

const updateTaskFunctionDeclaration: FunctionDeclaration = {
    name: 'updateTask',
    parameters: updateTaskSchema,
};

type GeminiResponse = 
  | { type: 'createTaskCall'; data: any }
  | { type: 'updateTaskCall'; data: any }
  | { type: 'deleteTaskCall'; data: any }
  | { type: 'proposePlanCall'; data: Plan }
  | { type: 'text'; data: string };

export async function getChatResponse(
  prompt: string, 
  apiKey: string,
  history: Message[], 
  tasks: Task[], 
  systemNote: string, 
  rules: string, 
  activeTags: string[], 
  activeCollection: Collection | 'All', 
  chatMode: ChatMode
): Promise<GeminiResponse> {
  
  const ai = new GoogleGenAI({ apiKey });
  const model = 'gemini-2.5-flash';
  
  const conversationHistory = history.slice(1).map(msg => ({
      role: msg.sender === 'user' ? ('user' as const) : ('model' as const),
      parts: [{ text: msg.text }]
  }));

  try {
    if (chatMode === 'freechat') {
        const systemInstruction = generateFreechatSystemPrompt({ systemNote });
        const response = await ai.models.generateContent({
            model,
            contents: [...conversationHistory, { role: 'user', parts: [{ text: prompt }] }],
            config: { systemInstruction },
        });
        return { type: 'text', data: response.text };
    }

    // --- Task Mode Logic ---
    const systemInstruction = generateSystemPrompt({ tasks, systemNote, rules, activeTags, activeCollection });
    const response = await ai.models.generateContent({
        model,
        contents: [...conversationHistory, { role: 'user', parts: [{ text: prompt }] }],
        config: {
            systemInstruction,
            tools: [{ functionDeclarations: [createTaskFunctionDeclaration, updateTaskFunctionDeclaration, deleteTaskFunctionDeclaration, proposePlanFunctionDeclaration] }],
        },
    });

    const functionCalls = response.functionCalls;
    if (functionCalls && functionCalls.length > 0) {
        const call = functionCalls[0];
        if (call.name === 'createTask') return { type: 'createTaskCall', data: call.args };
        if (call.name === 'updateTask') return { type: 'updateTaskCall', data: call.args };
        if (call.name === 'deleteTask') return { type: 'deleteTaskCall', data: call.args };
        if (call.name === 'proposePlan') return { type: 'proposePlanCall', data: call.args as unknown as Plan };
    }

    return { type: 'text', data: response.text };

  } catch(e: any) {
    // Check for specific quota-related error messages from the Gemini API
    const errorMessage = e.toString().toLowerCase();
    if (errorMessage.includes('quota') || errorMessage.includes('api key not valid')) {
        throw new QuotaError("API key has exceeded its quota or is invalid.");
    }
    // Re-throw other errors
    throw e;
  }
}