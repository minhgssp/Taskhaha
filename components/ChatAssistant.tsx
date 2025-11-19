import React, { useState, useRef, useEffect } from 'react';
import { getChatResponse } from '../services/geminiService';
import type { Task, Message, Plan, Collection, ChatMode } from '../types';
import { SendIcon, BotIcon, UserIcon, NewChatIcon } from './Icons';

// A simple component to render basic markdown.
const MarkdownContent: React.FC<{ text: string }> = ({ text }) => {
  // This function converts a string with basic markdown into an HTML string.
  // It's not a full parser, but handles common formatting like bold, italics,
  // inline code, and line breaks for better readability.
  const toHtml = (markdown: string) => {
    return markdown
      // Escape basic HTML characters to prevent XSS.
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      // **bold** -> <strong>bold</strong>
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      // *italic* -> <em>italic</em>
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      // `code` -> <code>code</code>
      .replace(/`(.*?)`/g, '<code class="bg-gray-200 text-accent px-1.5 py-0.5 rounded-md font-mono text-xs">$1</code>')
      // \n -> <br />
      .replace(/\n/g, '<br />');
  };

  return (
    <div
      className="text-sm leading-relaxed"
      dangerouslySetInnerHTML={{ __html: toHtml(text) }}
    />
  );
};

interface ChatAssistantProps {
  tasks: Task[];
  onPlanProposed: (plan: Plan) => void;
  onUpdateRules: (newRules: string) => void;
  systemNote: string;
  rules: string;
  activeTags: string[];
  activeCollection: Collection | 'All';
  chatMode: ChatMode;
  onSetChatMode: (mode: ChatMode) => void;
}

const initialMessage: Message = { sender: 'bot', text: "Xin chào! Tôi là trợ lý của bạn. Tôi có hai chế độ: sử dụng chế độ 'Task' để quản lý công việc của bạn, hoặc chuyển sang 'Freechat' để có một cuộc nói chuyện thông thường. Ở chế độ Task, tôi có thể thêm, sửa và xóa công việc cho bạn bằng ngôn ngữ tự nhiên. Chỉ cần cho tôi biết bạn cần gì." };

export const ChatAssistant: React.FC<ChatAssistantProps> = ({ tasks, onPlanProposed, onUpdateRules, systemNote, rules, activeTags, activeCollection, chatMode, onSetChatMode }) => {
  const [messages, setMessages] = useState<Message[]>([initialMessage]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleNewChat = () => {
    setMessages([initialMessage]);
  };

  const handleSend = async () => {
    if (input.trim() === '' || isLoading) return;

    const userMessage: Message = { sender: 'user', text: input };
    const promptForApi = input; // Capture prompt before clearing input
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Pass the current messages array as history
      const response = await getChatResponse(promptForApi, messages, tasks, systemNote, rules, activeTags, activeCollection, chatMode);

      let botMessage: Message | null = null;
      let plan: Plan = { creations: [], updates: [], deletions: [] };
      let hasPlan = false;

      switch (response.type) {
        case 'createTaskCall':
          plan.creations.push({ ...response.data, status: response.data.status || 'TODO' });
          hasPlan = true;
          break;
        case 'updateTaskCall':
          plan.updates.push(response.data);
          hasPlan = true;
          break;
        case 'deleteTaskCall':
            plan.deletions.push(response.data);
            hasPlan = true;
            break;
        case 'proposePlanCall':
            plan = {
                creations: response.data.creations?.map((t: any) => ({ ...t, status: t.status || 'TODO' })) || [],
                updates: response.data.updates || [],
                deletions: response.data.deletions || [],
            };
            hasPlan = true;
            break;
        case 'updateRulesCall':
          onUpdateRules(response.data.newRules);
          botMessage = { sender: 'bot', text: "Tôi đã cập nhật các quy tắc và yêu cầu của mình theo yêu cầu của bạn." };
          break;
        case 'text':
          botMessage = { sender: 'bot', text: response.data };
          break;
      }

      if (hasPlan) {
        // If there's at least one action, propose the plan for confirmation
        if (plan.creations.length > 0 || plan.updates.length > 0 || plan.deletions.length > 0) {
            botMessage = { sender: 'bot', text: "Tôi đã soạn một kế hoạch dựa trên yêu cầu của bạn. Vui lòng xem lại và xác nhận các hành động." };
            onPlanProposed(plan);
        } else {
            botMessage = { sender: 'bot', text: "Tôi hiểu bạn muốn thực hiện thay đổi, nhưng tôi không thể xác định chi tiết cụ thể. Bạn có thể vui lòng làm rõ hơn không?" };
        }
      }

      if (botMessage) {
        setMessages(prev => [...prev, botMessage as Message]);
      }

    } catch (error) {
      console.error("Error with Gemini API:", error);
      const errorMessage: Message = { sender: 'bot', text: "Xin lỗi, tôi đang gặp sự cố kết nối ngay bây giờ. Vui lòng thử lại sau." };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSend();
    }
  };

  const placeholderText = chatMode === 'task' ? "Yêu cầu tôi tạo một công việc..." : "Hãy trò chuyện về bất cứ điều gì...";

  return (
    <div className="flex flex-col h-full bg-surface">
      <header className="p-4 border-b border-divider flex-shrink-0 flex justify-between items-center">
        <div className="flex items-center gap-4">
            <h2 className="text-xl font-bold text-primary-text">AI Assistant</h2>
            <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-lg">
                <button 
                    onClick={() => onSetChatMode('task')}
                    className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${chatMode === 'task' ? 'bg-accent-dark text-white shadow-sm' : 'text-secondary-text hover:bg-gray-200'}`}
                >
                    Task
                </button>
                <button 
                    onClick={() => onSetChatMode('freechat')}
                    className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${chatMode === 'freechat' ? 'bg-accent-dark text-white shadow-sm' : 'text-secondary-text hover:bg-gray-200'}`}
                >
                    Freechat
                </button>
            </div>
        </div>
        <button
          onClick={handleNewChat}
          className="p-1 text-secondary-text hover:text-primary-text hover:bg-gray-100 rounded-full transition-colors"
          aria-label="Start new chat"
        >
          <NewChatIcon className="w-6 h-6" />
        </button>
      </header>
      <div className="flex-grow p-4 overflow-y-auto">
        <div className="space-y-4">
          {messages.map((msg, index) => (
            <div key={index} className={`flex items-start gap-3 ${msg.sender === 'user' ? 'justify-end' : ''}`}>
              {msg.sender === 'bot' && <BotIcon className="w-8 h-8 flex-shrink-0 text-accent" />}
              <div className={`max-w-xs md:max-w-md px-4 py-2 rounded-lg ${msg.sender === 'user' ? 'bg-accent-dark text-white' : 'bg-gray-100 text-primary-text'}`}>
                {msg.sender === 'bot' ? (
                  <MarkdownContent text={msg.text} />
                ) : (
                  <p className="text-sm">{msg.text}</p>
                )}
              </div>
               {msg.sender === 'user' && <UserIcon className="w-8 h-8 flex-shrink-0 text-secondary-text" />}
            </div>
          ))}
          {isLoading && (
            <div className="flex items-start gap-3">
              <BotIcon className="w-8 h-8 flex-shrink-0 text-accent" />
              <div className="max-w-xs md:max-w-md px-4 py-2 rounded-lg bg-gray-100 text-primary-text">
                 <div className="flex items-center space-x-2">
                    <span className="h-2 w-2 bg-secondary-text rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                    <span className="h-2 w-2 bg-secondary-text rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                    <span className="h-2 w-2 bg-secondary-text rounded-full animate-bounce"></span>
                 </div>
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>
      </div>
      <div className="p-4 border-t border-divider flex-shrink-0">
        <div className="flex items-center bg-gray-100 rounded-lg">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={placeholderText}
            className="w-full bg-transparent p-3 text-primary-text focus:outline-none placeholder:text-secondary-text"
            disabled={isLoading}
          />
          <button
            onClick={handleSend}
            disabled={isLoading}
            className="p-3 text-secondary-text hover:text-accent disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            <SendIcon className="w-6 h-6" />
          </button>
        </div>
      </div>
    </div>
  );
};