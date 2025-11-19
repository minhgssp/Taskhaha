
import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';

// Hooks
import { useDataManager } from './hooks/useDataManager.ts';

// Components
import { KanbanBoard } from './components/KanbanBoard.tsx';
import { CalendarView } from './components/CalendarView.tsx';
import { WeeklyView } from './components/WeeklyView.tsx';
import { TodoListView } from './components/TodoListView.tsx';
import { NotesView } from './components/NotesView.tsx';
import { ChatAssistant } from './components/ChatAssistant.tsx';
import { TaskModal } from './components/TaskModal.tsx';
import { ConfirmationModal } from './components/ConfirmationModal.tsx';
import { SettingsModal } from './components/SettingsModal.tsx';
import { ApiKeyModal } from './components/ApiKeyModal.tsx';
import { LoginModal } from './components/LoginModal.tsx';
import { Notification } from './components/Notification.tsx';
import { KanbanIcon, CalendarIcon, MessageIcon, ListIcon, PlusIcon, WeekIcon, SettingsIcon, NotesIcon, TagIcon, PencilIcon, EyeIcon, EyeOffIcon, KeyIcon, BriefcaseIcon, HomeIcon, ChevronDownIcon, GridIcon, SyncIcon, LogOutIcon } from './components/Icons.tsx';
import { MobileApp } from './components/MobileApp.tsx'; 

// Services and Types
import type { Task, Column, Plan, CreateActionData, UpdateActionData, DeleteActionData, Collection, ChatMode, AuthState } from './types.ts';

type View = 'kanban' | 'calendar' | 'weekly' | 'list' | 'notes';
type WeeklyViewLayout = 'simple' | 'grid';

const columns: Column[] = [
  { id: 'TODO', title: 'To Do' },
  { id: 'IN_PROGRESS', title: 'In Progress' },
  { id: 'DONE', title: 'Done' }
];

// Constants for settings
const SYSTEM_NOTE_KEY = 'taskhaha_system_note';
const RULES_KEY = 'taskhaha_rules';
const TAG_VISIBILITY_KEY = 'taskhaha_show_tags_on_tasks';
const API_KEY_STORAGE_KEY = 'taskhaha_gemini_api_key';
const AUTH_STATE_KEY = 'taskhaha_auth_state';
const MOBILE_BREAKPOINT = 768;

const App: React.FC = () => {
  const [authState, setAuthState] = useState<AuthState>(() => {
    return (localStorage.getItem(AUTH_STATE_KEY) as AuthState) || 'pending';
  });
  const [view, setView] = useState<View>('weekly');
  const [weeklyViewLayout, setWeeklyViewLayout] = useState<WeeklyViewLayout>('simple');
  const [isChatVisible, setIsChatVisible] = useState(true);
  const [weeklyViewDays, setWeeklyViewDays] = useState(5);
  const [kanbanFutureDays, setKanbanFutureDays] = useState(7);
  const [isMobile, setIsMobile] = useState(window.innerWidth < MOBILE_BREAKPOINT);
  
  // Data Management now depends on authState
  const { 
    tasks, 
    notes, 
    isLoading, 
    error: dataError,
    addTask, 
    updateTask, 
    deleteTask, 
    moveTask, 
    addNote, 
    updateNote, 
    deleteNote 
  } = useDataManager(authState);

  // Filter State
  const [activeCollection, setActiveCollection] = useState<Collection | 'All'>('All');
  const [activeTags, setActiveTags] = useState<string[]>([]);
  const [isFilterVisible, setIsFilterVisible] = useState(false);
  const [showTagsOnTasks, setShowTagsOnTasks] = useState<boolean>(() => {
    return localStorage.getItem(TAG_VISIBILITY_KEY) !== 'false';
  });

  // Modal States
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<Task | null>(null);
  const [initialDateForNewTask, setInitialDateForNewTask] = useState<string | undefined>();
  const [isConfirmationModalOpen, setIsConfirmationModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isSettingsDropdownOpen, setIsSettingsDropdownOpen] = useState(false);
  const [isCollectionDropdownOpen, setIsCollectionDropdownOpen] = useState(false);
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);
  const [apiKeyError, setApiKeyError] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // AI State
  const [proposedPlan, setProposedPlan] = useState<Plan | null>(null);
  const [systemNote, setSystemNote] = useState<string>(() => localStorage.getItem(SYSTEM_NOTE_KEY) || '');
  const [rules, setRules] = useState<string>(() => localStorage.getItem(RULES_KEY) || '');
  const [defaultApiKey, setDefaultApiKey] = useState<string | null>(null);
  const [localApiKey, setLocalApiKey] = useState<string | null>(() => localStorage.getItem(API_KEY_STORAGE_KEY));
  const [chatMode, setChatMode] = useState<ChatMode>('task');
  
  // Refs
  const settingsDropdownRef = useRef<HTMLDivElement>(null);
  const settingsButtonRef = useRef<HTMLButtonElement>(null);
  const collectionDropdownRef = useRef<HTMLDivElement>(null);
  const collectionButtonRef = useRef<HTMLButtonElement>(null);

  const currentApiKey = useMemo(() => localApiKey || defaultApiKey, [localApiKey, defaultApiKey]);
  
  // Fetch default API key based on auth state
  useEffect(() => {
    if (authState === 'pending') return;

    const fetchDefaultKey = async () => {
      try {
        const response = await fetch(`/api/keys?mode=${authState}`);
        if (response.ok) {
          const { apiKey } = await response.json();
          setDefaultApiKey(apiKey);
        } else {
          console.error("Could not fetch default API key.");
        }
      } catch (error) {
        console.error("Error fetching default API key:", error);
      }
    };
    fetchDefaultKey();
  }, [authState]);
  
  // Mobile detection
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // Keyboard shortcut for chat
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'b') {
        event.preventDefault();
        setIsChatVisible(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
        if (settingsDropdownRef.current && !settingsDropdownRef.current.contains(event.target as Node) && settingsButtonRef.current && !settingsButtonRef.current.contains(event.target as Node)) setIsSettingsDropdownOpen(false);
        if (collectionDropdownRef.current && !collectionDropdownRef.current.contains(event.target as Node) && collectionButtonRef.current && !collectionButtonRef.current.contains(event.target as Node)) setIsCollectionDropdownOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Save tag visibility
  useEffect(() => {
    localStorage.setItem(TAG_VISIBILITY_KEY, String(showTagsOnTasks));
  }, [showTagsOnTasks]);
  
  const showNotification = (message: string, type: 'success' | 'error', duration = 3000) => {
      setNotification({ message, type });
      setTimeout(() => setNotification(null), duration);
  };
  
  const handleLoginSuccess = (state: AuthState) => {
      localStorage.setItem(AUTH_STATE_KEY, state);
      setAuthState(state);
  };
  
  const handleLogout = () => {
      localStorage.removeItem(AUTH_STATE_KEY);
      localStorage.removeItem(API_KEY_STORAGE_KEY); // Also clear local API key on logout
      setLocalApiKey(null);
      setDefaultApiKey(null);
      setAuthState('pending');
      showNotification('You have been logged out successfully.', 'success');
  };

  const handleApiError = useCallback(() => {
    setApiKeyError(`The current API key has exceeded its quota. Please provide a new key to continue. If the issue persists, contact hoangducminh.biz@gmail.com.`);
    setIsApiKeyModalOpen(true);
  }, []);

  const allTags = useMemo(() => Array.from(new Set(tasks.flatMap(task => task.tags || []))).sort(), [tasks]);
  const filteredTasks = useMemo(() => {
    let collectionFiltered = activeCollection === 'All' ? tasks : tasks.filter(task => task.collection === activeCollection);
    return activeTags.length === 0 ? collectionFiltered : collectionFiltered.filter(task => activeTags.every(activeTag => task.tags?.includes(activeTag)));
  }, [tasks, activeTags, activeCollection]);
  const kanbanFilteredTasks = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const limitDate = new Date(today);
    limitDate.setDate(today.getDate() + kanbanFutureDays);
    return filteredTasks.filter(task => {
        if (!task.dueDate) return true;
        try {
            const [year, month, day] = task.dueDate.split('-').map(Number);
            const taskDate = new Date(year, month - 1, day);
            taskDate.setHours(0, 0, 0, 0);
            return taskDate.getTime() <= limitDate.getTime();
        } catch (e) { return true; }
    });
  }, [filteredTasks, kanbanFutureDays]);
  
  const handleSaveApiKey = (key: string) => {
    localStorage.setItem(API_KEY_STORAGE_KEY, key);
    setLocalApiKey(key);
    setIsApiKeyModalOpen(false);
    setApiKeyError(null);
  };

  const handleOpenTaskModal = (task?: Task) => { setTaskToEdit(task || null); setInitialDateForNewTask(undefined); setIsTaskModalOpen(true); };
  const handleAddTaskForDate = (date: string) => { setTaskToEdit(null); setInitialDateForNewTask(date); setIsTaskModalOpen(true); };
  const handleCloseTaskModal = () => { setIsTaskModalOpen(false); setTaskToEdit(null); setInitialDateForNewTask(undefined); };
  const handleSaveTask = async (taskData: Omit<Task, 'id' | 'order'>) => {
    let finalTaskData = { ...taskData };
    if (activeTags.length > 0) {
        const combinedTags = new Set([...(taskData.tags || []), ...activeTags]);
        finalTaskData.tags = Array.from(combinedTags);
    }
    await addTask(finalTaskData);
  };
  const handleUpdateTask = (taskId: string, updates: Partial<Task>) => { updateTask(taskId, updates); };
  const handleDeleteTask = (taskId: string) => { deleteTask(taskId); };
  
  const handlePlanProposed = (plan: Plan) => { 
    setProposedPlan(plan); 
    setIsConfirmationModalOpen(true); 
  };

  const executePlanAction = async (action: CreateActionData | UpdateActionData | DeleteActionData, type: 'CREATE' | 'UPDATE' | 'DELETE') => {
    switch (type) {
      case 'CREATE':
        await addTask(action as CreateActionData);
        break;
      case 'UPDATE':
        {
          const { taskId, ...updates } = action as UpdateActionData;
          
          const mappedUpdates: Partial<Task> = {};
          if (updates.newTitle !== undefined) mappedUpdates.title = updates.newTitle;
          if (updates.newStatus !== undefined) mappedUpdates.status = updates.newStatus;
          if (updates.newCollection !== undefined) mappedUpdates.collection = updates.newCollection;
          if (updates.newDescription !== undefined) mappedUpdates.description = updates.newDescription;
          if (updates.newDueDate !== undefined) mappedUpdates.dueDate = updates.newDueDate;
          if (updates.newDueTime !== undefined) mappedUpdates.dueTime = updates.newDueTime;
          if (updates.newTags !== undefined) mappedUpdates.tags = updates.newTags;
          if (updates.newColor !== undefined) mappedUpdates.color = updates.newColor;

          updateTask(taskId, mappedUpdates);
        }
        break;
      case 'DELETE':
        deleteTask((action as DeleteActionData).taskId);
        break;
    }
  };
  
  const handleConfirmPlan = async (plan: Plan) => {
      for (const c of (plan.creations || [])) {
        await executePlanAction(c, 'CREATE');
      }
      for (const u of (plan.updates || [])) {
        await executePlanAction(u, 'UPDATE');
      }
      for (const d of (plan.deletions || [])) {
        await executePlanAction(d, 'DELETE');
      }
      setIsConfirmationModalOpen(false); 
      setProposedPlan(null);
  };

  const handleSaveSettings = (newSystemNote: string, newRules: string) => {
      setSystemNote(newSystemNote); localStorage.setItem(SYSTEM_NOTE_KEY, newSystemNote);
      setRules(newRules); localStorage.setItem(RULES_KEY, newRules);
      setIsSettingsModalOpen(false);
  };
  const toggleTagFilter = (tag: string) => {
    setActiveTags(prev => 
        prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };
  
  const ViewComponent = useMemo(() => {
    if (isLoading) return <div className="flex items-center justify-center h-full"><SyncIcon className="w-12 h-12 text-accent animate-spin" /></div>;
    const props = { onEditTask: handleOpenTaskModal, onUpdateTask: handleUpdateTask, showTagsOnTasks };
    switch (view) {
      case 'kanban': return <KanbanBoard columns={columns} {...props} tasks={kanbanFilteredTasks} moveTask={moveTask} />;
      case 'calendar': return <CalendarView {...props} tasks={filteredTasks} />;
      case 'weekly': return <WeeklyView {...props} tasks={filteredTasks} weeklyViewDays={weeklyViewDays} onAddTaskForDate={handleAddTaskForDate} layout={weeklyViewLayout} />;
      case 'list': return <TodoListView {...props} tasks={filteredTasks} />;
      case 'notes': return <NotesView notes={notes} addNote={addNote} updateNote={updateNote} deleteNote={deleteNote} />;
      default: return null;
    }
  }, [view, filteredTasks, kanbanFilteredTasks, moveTask, notes, addNote, updateNote, deleteNote, weeklyViewDays, activeTags, showTagsOnTasks, weeklyViewLayout, handleUpdateTask, handleOpenTaskModal, handleAddTaskForDate, isLoading]);

  return (
    <>
      {authState === 'pending' ? (
        <LoginModal onLoginSuccess={handleLoginSuccess} onShowError={showNotification} />
      ) : isMobile ? (
        <>
          <MobileApp
            tasks={filteredTasks}
            onEditTask={handleOpenTaskModal}
            onUpdateTask={handleUpdateTask}
            showTagsOnTasks={showTagsOnTasks}
            chatAssistantProps={{
              tasks: filteredTasks,
              onPlanProposed: handlePlanProposed,
              systemNote,
              rules,
              activeTags,
              activeCollection,
              chatMode,
              onSetChatMode: setChatMode,
              apiKey: currentApiKey,
              handleApiError,
            }}
          />
          <TaskModal isOpen={isTaskModalOpen} onClose={handleCloseTaskModal} onSave={handleSaveTask} onUpdate={handleUpdateTask} onDelete={handleDeleteTask} taskToEdit={taskToEdit} initialDate={initialDateForNewTask}/>
          {isConfirmationModalOpen && proposedPlan && <ConfirmationModal tasks={tasks} plan={proposedPlan} onConfirm={handleConfirmPlan} onCancel={() => setIsConfirmationModalOpen(false)}/>}
          <ApiKeyModal isOpen={isApiKeyModalOpen} onSave={handleSaveApiKey} onClose={() => setIsApiKeyModalOpen(false)} isCancellable={!!localApiKey} errorMessage={apiKeyError} />
        </>
      ) : (
        <div className="bg-bg-main text-primary-text font-sans h-screen flex flex-col antialiased">
          <header className="p-2 bg-surface flex-shrink-0 border-b border-divider flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="relative">
                    <button ref={collectionButtonRef} onClick={() => setIsCollectionDropdownOpen(p => !p)} className="flex items-center gap-2 p-2 bg-gray-100 rounded-lg text-primary-text hover:bg-gray-200">
                        {activeCollection === 'Work' && <BriefcaseIcon className="w-5 h-5" />}
                        {activeCollection === 'Life' && <HomeIcon className="w-5 h-5" />}
                        <span className="font-semibold">{activeCollection}</span>
                        <ChevronDownIcon className="w-4 h-4 text-secondary-text" />
                    </button>
                    {isCollectionDropdownOpen && (
                        <div ref={collectionDropdownRef} className="absolute left-0 mt-2 w-48 origin-top-left bg-surface rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-10">
                            <div className="py-1">
                                {(['All', 'Work', 'Life'] as const).map(collection => (
                                    <button key={collection} onClick={() => { setActiveCollection(collection); setIsCollectionDropdownOpen(false); }} className="w-full text-left px-4 py-2 text-sm text-primary-text hover:bg-gray-100 flex items-center gap-3">
                                        {collection === 'Work' && <BriefcaseIcon className="w-5 h-5" />}
                                        {collection === 'Life' && <HomeIcon className="w-5 h-5" />}
                                        <span>{collection}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
                <nav className="flex items-center gap-2 p-1 bg-gray-100 rounded-lg">
                  {(['list', 'weekly', 'calendar', 'kanban', 'notes'] as View[]).map(v => {
                    const Icon = { kanban: KanbanIcon, list: ListIcon, weekly: WeekIcon, calendar: CalendarIcon, notes: NotesIcon }[v];
                    return (
                      <button
                        key={v}
                        onClick={() => setView(v)}
                        className={`p-2 rounded-md transition-colors ${view === v ? 'bg-accent-dark text-white' : 'text-secondary-text hover:bg-gray-200 hover:text-primary-text'}`}
                      >
                        <Icon className="w-5 h-5" />
                      </button>
                    )
                  })}
                </nav>
                {view === 'weekly' && (
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-lg">
                        <button onClick={() => setWeeklyViewDays(prev => Math.max(1, prev - 1))} className="px-2 py-1 rounded-md text-secondary-text hover:bg-gray-200 hover:text-primary-text">-</button>
                        <span className="text-sm font-medium text-primary-text w-20 text-center">{weeklyViewDays + 2} Days</span>
                        <button onClick={() => setWeeklyViewDays(prev => Math.min(8, prev + 1))} className="px-2 py-1 rounded-md text-secondary-text hover:bg-gray-200 hover:text-primary-text">+</button>
                    </div>
                    <button
                        onClick={() => setWeeklyViewLayout(p => p === 'simple' ? 'grid' : 'simple')}
                        className={`p-2 rounded-lg transition-colors ${weeklyViewLayout === 'grid' ? 'bg-accent-dark text-white' : 'text-secondary-text hover:bg-gray-200 hover:text-primary-text'}`}
                    >
                      <GridIcon className="w-5 h-5" />
                    </button>
                  </div>
                )}
                {view === 'kanban' && (
                  <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-lg">
                      <button onClick={() => setKanbanFutureDays(prev => Math.max(0, prev - 1))} className="px-2 py-1 rounded-md text-secondary-text hover:bg-gray-200 hover:text-primary-text">-</button>
                      <span className="text-sm font-medium text-primary-text w-28 text-center">Future: +{kanbanFutureDays} Days</span>
                      <button onClick={() => setKanbanFutureDays(prev => Math.min(90, prev + 1))} className="px-2 py-1 rounded-md text-secondary-text hover:bg-gray-200 hover:text-primary-text">+</button>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-3">
                  <button onClick={() => handleOpenTaskModal()} className="flex items-center gap-2 px-3 py-1.5 bg-accent-dark hover:bg-indigo-800 text-white font-semibold rounded-lg text-sm"><PlusIcon className="w-5 h-5" /><span>New Task</span></button>
                  <button onClick={() => setIsFilterVisible(prev => !prev)} className="p-2 rounded-lg text-secondary-text hover:bg-gray-200 hover:text-primary-text"><TagIcon className="w-6 h-6" /></button>
                  <div className="relative">
                    <button ref={settingsButtonRef} onClick={() => setIsSettingsDropdownOpen(prev => !prev)} className="p-2 rounded-lg text-secondary-text hover:bg-gray-200 hover:text-primary-text"><SettingsIcon className="w-6 h-6" /></button>
                    {isSettingsDropdownOpen && (
                        <div ref={settingsDropdownRef} className="absolute right-0 mt-2 w-64 origin-top-right bg-surface rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-10">
                            <div className="py-1">
                                <button onClick={() => { setShowTagsOnTasks(prev => !prev); setIsSettingsDropdownOpen(false); }} className="w-full text-left px-4 py-2 text-sm text-primary-text hover:bg-gray-100 flex items-center gap-3">
                                    {showTagsOnTasks ? <EyeOffIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                                    <span>{showTagsOnTasks ? 'Hide Tags' : 'Show Tags'}</span>
                                </button>
                                <button onClick={() => { setApiKeyError(null); setIsApiKeyModalOpen(true); setIsSettingsDropdownOpen(false); }} className="w-full text-left px-4 py-2 text-sm text-primary-text hover:bg-gray-100 flex items-center gap-3">
                                    <KeyIcon className="w-5 h-5" />
                                    <span>Update Gemini API Key</span>
                                </button>
                                <button onClick={() => { setIsSettingsModalOpen(true); setIsSettingsDropdownOpen(false); }} className="w-full text-left px-4 py-2 text-sm text-primary-text hover:bg-gray-100 flex items-center gap-3">
                                    <PencilIcon className="w-5 h-5" />
                                    <span>Customize AI Prompt</span>
                                </button>
                                <div className="border-t border-divider my-1"></div>
                                <button onClick={() => { handleLogout(); setIsSettingsDropdownOpen(false); }} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-3">
                                    <LogOutIcon className="w-5 h-5" />
                                    <span>Logout</span>
                                </button>
                            </div>
                        </div>
                    )}
                  </div>
                  <button onClick={() => setIsChatVisible(!isChatVisible)} className="p-2 rounded-lg text-secondary-text hover:bg-gray-200 hover:text-primary-text"><MessageIcon className="w-6 h-6" /></button>
              </div>
            </div>
            {isFilterVisible && allTags.length > 0 && (
                <div className="flex items-center gap-2 flex-wrap border-t border-divider pt-2">
                    <span className="text-sm font-medium text-secondary-text mr-2">Filter by tag:</span>
                    {allTags.map(tag => (
                        <button key={tag} onClick={() => toggleTagFilter(tag)} className={`px-2.5 py-1 text-xs font-medium rounded-full ${activeTags.includes(tag) ? 'bg-accent-dark text-white' : 'bg-gray-200 text-secondary-text hover:bg-gray-300'}`}>{tag}</button>
                    ))}
                    {activeTags.length > 0 && (<button onClick={() => setActiveTags([])} className="ml-2 text-xs text-accent hover:text-accent-dark font-semibold">Clear Filter</button>)}
                </div>
            )}
          </header>

          <main className="flex-1 flex overflow-hidden">
            <div className="flex-1 p-4 overflow-auto">{ViewComponent}</div>
            {isChatVisible && currentApiKey && (<aside className="w-full md:w-1/3 max-w-md border-l border-divider flex-shrink-0"><ChatAssistant tasks={filteredTasks} onPlanProposed={handlePlanProposed} systemNote={systemNote} rules={rules} activeTags={activeTags} activeCollection={activeCollection} chatMode={chatMode} onSetChatMode={setChatMode} apiKey={currentApiKey} handleApiError={handleApiError} /></aside>)}
            {isChatVisible && !currentApiKey && (<aside className="w-full md:w-1/3 max-w-md border-l border-divider flex-shrink-0 flex items-center justify-center p-4"><div className="text-center text-secondary-text">Please set up an API key to use the AI Assistant.</div></aside>)}
          </main>
          
          <TaskModal isOpen={isTaskModalOpen} onClose={handleCloseTaskModal} onSave={handleSaveTask} onUpdate={handleUpdateTask} onDelete={handleDeleteTask} taskToEdit={taskToEdit} initialDate={initialDateForNewTask}/>
          {isConfirmationModalOpen && proposedPlan && (<ConfirmationModal tasks={tasks} plan={proposedPlan} onConfirm={handleConfirmPlan} onCancel={() => setIsConfirmationModalOpen(false)}/>)}
          <SettingsModal isOpen={isSettingsModalOpen} onClose={() => setIsSettingsModalOpen(false)} onSave={handleSaveSettings} initialSystemNote={systemNote} initialRules={rules}/>
          <ApiKeyModal isOpen={isApiKeyModalOpen} onSave={handleSaveApiKey} onClose={() => { if(localApiKey || defaultApiKey) setIsApiKeyModalOpen(false) }} isCancellable={!!(localApiKey || defaultApiKey)} errorMessage={apiKeyError} />

          <style>{`
            /* Custom scrollbar */
            ::-webkit-scrollbar { width: 8px; } ::-webkit-scrollbar-track { background: #f1f1f1; } ::-webkit-scrollbar-thumb { background: #ccc; border-radius: 4px; } ::-webkit-scrollbar-thumb:hover { background: #b3b3b3; }
          `}</style>
        </div>
      )}

      {/* Common notifications, rendered outside the main layouts but only when logged in */}
      {authState !== 'pending' && notification && <Notification message={notification.message} type={notification.type} onClose={() => setNotification(null)} />}
      {authState !== 'pending' && dataError && <Notification message={dataError} type="error" onClose={() => {}} />}
    </>
  );
};

export default App;
