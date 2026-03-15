import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getMe, getToken, setToken as storeToken, clearToken } from '../api';
import type { UserData as ApiUserData } from '../api';

export interface UserData {
  id?: string;
  email?: string;
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
  token: string | null;
  setAuthToken: (token: string | null) => void;
  theme: 'dark' | 'light';
  toggleTheme: () => void;
  chatHistory: ChatMessage[];
  addChatMessage: (message: ChatMessage) => void;
  updateChatMessages: (id: string, messages: ChatMessage['messages']) => void;
  clearChatHistory: () => void;
  renameChat: (id: string, newTitle: string) => void;
  pinChat: (id: string) => void;
  deleteChat: (id: string) => void;
  logout: () => void;
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
  const [token, setTokenState] = useState<string | null>(getToken());
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);

  // Load theme and chat history from localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    const savedChats = localStorage.getItem('chatHistory');

    if (savedTheme) {
      setTheme(savedTheme as 'dark' | 'light');
    }
    if (savedChats) {
      setChatHistory(JSON.parse(savedChats));
    }
  }, []);

  // On mount (or when token changes), fetch user profile from backend
  useEffect(() => {
    if (token) {
      getMe()
        .then((data) => {
          setUserState(data as unknown as UserData);
          localStorage.setItem('userData', JSON.stringify(data));
        })
        .catch(() => {
          // Token is invalid or expired – clear it
          clearToken();
          setTokenState(null);
          setUserState(null);
          localStorage.removeItem('userData');
        });
    } else {
      // No token – try to restore user from localStorage (offline fallback)
      const savedUser = localStorage.getItem('userData');
      if (savedUser) {
        setUserState(JSON.parse(savedUser));
      }
    }
  }, [token]);

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

  const setAuthToken = (newToken: string | null) => {
    setTokenState(newToken);
    if (newToken) {
      storeToken(newToken);
    } else {
      clearToken();
    }
  };

  const logout = () => {
    setUserState(null);
    setTokenState(null);
    clearToken();
    localStorage.removeItem('userData');
    localStorage.removeItem('chatHistory');
    setChatHistory([]);
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

  const updateChatMessages = (id: string, messages: ChatMessage['messages']) => {
    const updatedHistory = chatHistory.map(chat =>
      chat.id === id ? { ...chat, messages } : chat
    );
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
        token,
        setAuthToken,
        theme,
        toggleTheme,
        chatHistory,
        addChatMessage,
        updateChatMessages,
        clearChatHistory,
        renameChat,
        pinChat,
        deleteChat,
        logout,
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
