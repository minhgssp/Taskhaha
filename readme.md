# TaskHaha

TaskHaha is a smart task management application designed to provide a seamless and intuitive way to organize your workflow. It features multiple views like Kanban, Calendar, and Weekly planners, and is supercharged with an integrated AI assistant powered by the Google Gemini API.

## ✨ Key Features

- **Multiple Views:** Organize your tasks in the way that works best for you:
  - **List View:** A classic to-do list grouped by date.
  - **Weekly View:** A comprehensive overview of your upcoming week, with a simple column layout and a detailed time-grid layout.
  - **Calendar View:** A 3-week calendar layout for long-term planning.
  - **Kanban Board:** Visualize your workflow with `To Do`, `In Progress`, and `Done` columns.
  - **Notes View:** A dedicated space for freeform notes and ideas.
- **AI Assistant (Powered by Gemini):** Use natural language to manage your tasks.
  - **Dual Modes:** Switch between `Task` mode for actions and `Freechat` mode for general conversation.
  - **Smart Actions:** The AI can create, update, and delete tasks by calling functions.
  - **Plan Proposals:** For complex requests, the AI proposes a plan of action for you to review and approve.
  - **Context-Aware:** The AI understands your current task list, active filters, and custom rules.
- **Task Organization:**
  - **Collections:** Separate your tasks into `Work` and `Life` categories.
  - **Tagging & Filtering:** Add hashtags to your tasks and filter your views instantly.
- **Responsive Design:** A tailored experience for both desktop and mobile devices.
- **Serverless Persistence:** Your data is securely stored using Vercel KV when deployed, ensuring your tasks are saved between sessions.

## 🚀 How It Works

This project is unique in its "no build step" client-side architecture.

- **In-Browser Transpilation:** A Service Worker (`sw.js`) intercepts requests for `.tsx` and `.ts` files and transpiles them into JavaScript on-the-fly using Babel Standalone. This allows for modern React/TypeScript development without a local build process.
- **Data Persistence:**
  - **On Vercel:** The app uses a Vercel Serverless Function (`api/data.ts`) to communicate with a Vercel KV store for data persistence.
  - **Locally/AI Studio:** It falls back to using the browser's `localStorage` for storing tasks and notes.

## 🛠️ Setup & Configuration

### Running the Application

This application requires no build step. You can serve the files from a static server.

### Required Configuration

1.  **Gemini API Key:** The AI Assistant requires a Google Gemini API key. The application will prompt you to enter this key on first launch. You can get a key from [Google AI Studio](https://ai.google.dev/gemini-api/docs/api-key).

### Vercel Deployment

To deploy this project on Vercel and enable data persistence:

1.  **Fork and Deploy:** Deploy your forked repository to Vercel.
2.  **Create a KV Store:** In your Vercel project dashboard, go to the **Storage** tab.
3.  **Connect Upstash:** Select **Upstash** from the marketplace providers to create a new KV (Redis) database. The free tier is sufficient.
4.  **Connect to Project:** Follow the prompts to connect the newly created database to your project. This will automatically add the necessary environment variables (e.g., `TASKMANAGER_KV_REST_API_URL`, `TASKMANAGER_KV_REST_API_TOKEN`).
5.  **Redeploy:** Trigger a new deployment to ensure the serverless function picks up the new environment variables. The application will now use Vercel KV to store your data.
