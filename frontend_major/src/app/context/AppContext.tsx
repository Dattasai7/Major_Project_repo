import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface UserData {
  name: string;
  ageRange: string;
  country: string;
  city: string;
  language: string;
  gender: string;
  height: string;
  weight: string;
  conditions: string;
  personalization?: string;
}

interface AppContextType {
  user: UserData | null;
  setUser: (user: UserData | null) => void;
  theme: 'dark' | 'light';
  toggleTheme: () => void;
  chatHistory: ChatMessage[];
  addChatMessage: (message: ChatMessage) => void;
  clearChatHistory: () => void;
  renameChat: (id: string, newTitle: string) => void;
  pinChat: (id: string) => void;
  deleteChat: (id: string) => void;
}

export interface ChatMessage {
  id: string;
  title: string;
  isPinned?: boolean;
  timestamp: Date;
  messages: { role: 'user' | 'assistant'; content: string; mode?: string }[];
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUserState] = useState<UserData | null>(null);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);

  // Load user data and theme from localStorage
  useEffect(() => {
    const savedUser = localStorage.getItem('userData');
    const savedTheme = localStorage.getItem('theme');
    const savedChats = localStorage.getItem('chatHistory');

    if (savedUser) {
      setUserState(JSON.parse(savedUser));
    }
    if (savedTheme) {
      setTheme(savedTheme as 'dark' | 'light');
    }
    if (savedChats) {
      setChatHistory(JSON.parse(savedChats));
    }
  }, []);

  // Apply theme to document
  useEffect(() => {
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(theme);
  }, [theme]);

  const setUser = (userData: UserData | null) => {
    setUserState(userData);
    if (userData) {
      localStorage.setItem('userData', JSON.stringify(userData));
    } else {
      localStorage.removeItem('userData');
    }
  };

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
  };

  const addChatMessage = (message: ChatMessage) => {
    const updatedHistory = [...chatHistory, message];
    setChatHistory(updatedHistory);
    localStorage.setItem('chatHistory', JSON.stringify(updatedHistory));
  };

  const clearChatHistory = () => {
    setChatHistory([]);
    localStorage.removeItem('chatHistory');
  };

  const renameChat = (id: string, newTitle: string) => {
    const updatedHistory = chatHistory.map(chat => 
      chat.id === id ? { ...chat, title: newTitle } : chat
    );
    setChatHistory(updatedHistory);
    localStorage.setItem('chatHistory', JSON.stringify(updatedHistory));
  };

  const pinChat = (id: string) => {
    const updatedHistory = chatHistory.map(chat => 
      chat.id === id ? { ...chat, isPinned: !chat.isPinned } : chat
    );
    setChatHistory(updatedHistory);
    localStorage.setItem('chatHistory', JSON.stringify(updatedHistory));
  };

  const deleteChat = (id: string) => {
    const updatedHistory = chatHistory.filter(chat => chat.id !== id);
    setChatHistory(updatedHistory);
    localStorage.setItem('chatHistory', JSON.stringify(updatedHistory));
  };

  return (
    <AppContext.Provider
      value={{
        user,
        setUser,
        theme,
        toggleTheme,
        chatHistory,
        addChatMessage,
        clearChatHistory,
        renameChat,
        pinChat,
        deleteChat,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
};
