import { useState, useEffect, useCallback } from 'react';
import type { Message } from '../types.ts';

const LOG_STORAGE_KEY = 'zenith_chat_log';

interface Log {
  date: string; // YYYY-MM-DD
  messages: Message[];
}

export const useConversationLogger = () => {
  const [messages, setMessages] = useState<Message[]>([]);

  useEffect(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    try {
      const storedLog = localStorage.getItem(LOG_STORAGE_KEY);
      if (storedLog) {
        const parsedLog: Log = JSON.parse(storedLog);
        if (parsedLog.date === todayStr) {
          setMessages(parsedLog.messages);
        } else {
          // It's a new day, clear the log
          localStorage.removeItem(LOG_STORAGE_KEY);
        }
      }
    } catch (error) {
      console.error("Could not parse chat log from localStorage", error);
      localStorage.removeItem(LOG_STORAGE_KEY);
    }
  }, []);

  const logMessage = useCallback((message: Message) => {
    const todayStr = new Date().toISOString().split('T')[0];
    setMessages(prevMessages => {
      const newMessages = [...prevMessages, message];
      const newLog: Log = {
        date: todayStr,
        messages: newMessages,
      };
      try {
        localStorage.setItem(LOG_STORAGE_KEY, JSON.stringify(newLog));
      } catch (error) {
        console.error("Could not save chat log to localStorage", error);
      }
      return newMessages;
    });
  }, []);

  return { messages, logMessage };
};