
import React, { useState } from 'react';
import type { Task } from '../types';
import { ChatAssistant } from './ChatAssistant';
import { TodoListView } from './TodoListView';
import { MessageIcon, ListIcon } from './Icons';

type Tab = 'chat' | 'list';

interface MobileAppProps {
  tasks: Task[];
  onEditTask: (task: Task) => void;
  onUpdateTask: (taskId: string, updates: Partial<Task>) => void;
  chatAssistantProps: React.ComponentProps<typeof ChatAssistant>;
  showTagsOnTasks: boolean;
}

export const MobileApp: React.FC<MobileAppProps> = ({ tasks, onEditTask, onUpdateTask, chatAssistantProps, showTagsOnTasks }) => {
  const [activeTab, setActiveTab] = useState<Tab>('chat');

  return (
    <div className="bg-bg-main text-primary-text font-sans h-screen flex flex-col antialiased">
      <main className="flex-1 overflow-hidden">
        {activeTab === 'chat' && <ChatAssistant {...chatAssistantProps} />}
        {activeTab === 'list' && (
          <div className="p-4 h-full overflow-y-auto bg-bg-main">
            <TodoListView tasks={tasks} onEditTask={onEditTask} onUpdateTask={onUpdateTask} showTagsOnTasks={showTagsOnTasks} />
          </div>
        )}
      </main>
      <nav className="flex-shrink-0 bg-surface/90 backdrop-blur-sm border-t border-divider shadow-[0_-2px_10px_rgba(0,0,0,0.05)] flex justify-around">
        <button
          onClick={() => setActiveTab('chat')}
          className={`flex flex-col items-center gap-1 p-3 w-full transition-colors ${activeTab === 'chat' ? 'text-accent-dark' : 'text-secondary-text'}`}
        >
          <MessageIcon className="w-6 h-6" />
          <span className="text-xs font-medium">Chat</span>
        </button>
        <button
          onClick={() => setActiveTab('list')}
          className={`flex flex-col items-center gap-1 p-3 w-full transition-colors ${activeTab === 'list' ? 'text-accent-dark' : 'text-secondary-text'}`}
        >
          <ListIcon className="w-6 h-6" />
          <span className="text-xs font-medium">List</span>
        </button>
      </nav>
      <style>{`
        /* Custom scrollbar for webkit browsers */
        ::-webkit-scrollbar { width: 8px; }
        ::-webkit-scrollbar-track { background: #f1f1f1; }
        ::-webkit-scrollbar-thumb { background: #ccc; border-radius: 4px; }
        ::-webkit-scrollbar-thumb:hover { background: #b3b3b3; }
      `}</style>
    </div>
  );
};