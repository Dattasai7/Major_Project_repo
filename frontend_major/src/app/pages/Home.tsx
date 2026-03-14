import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useApp } from '../context/AppContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { ScrollArea } from '../components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { motion, AnimatePresence } from 'motion/react';
import {
  Sparkles,
  Send,
  User,
  Moon,
  Sun,
  MessageSquare,
  Plus,
  Menu,
  X,
  MoreVertical,
  Edit2,
  Pin,
  Trash2,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../components/ui/dropdown-menu';

export const Home = () => {
  const navigate = useNavigate();
  const { user, theme, toggleTheme, chatHistory, addChatMessage } = useApp();
  const [message, setMessage] = useState('');
  const [mode, setMode] = useState<'fda' | 'experimental'>('fda');
  const [currentChat, setCurrentChat] = useState<{
    id: string;
    messages: { role: 'user' | 'assistant'; content: string; mode?: string }[];
  }>({ id: Date.now().toString(), messages: [] });
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [editingChatId, setEditingChatId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { renameChat, pinChat, deleteChat } = useApp();

  const handleRenameSubmit = (chatId: string) => {
    if (editTitle.trim()) {
      renameChat(chatId, editTitle.trim());
    }
    setEditingChatId(null);
  };

  useEffect(() => {
    if (!user) {
      navigate('/');
    }
  }, [user, navigate]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentChat.messages]);

  const handleSendMessage = () => {
    if (!message.trim()) return;

    const userMessage = {
      role: 'user' as const,
      content: message,
      mode,
    };

    const assistantMessage = {
      role: 'assistant' as const,
      content: `Thank you for your ${mode === 'fda' ? 'FDA-approved' : 'experimental'} query. As an AI health assistant, I've analyzed your request: "${message}". This is a simulated response. In a real application, this would provide personalized health insights based on your profile.`,
    };

    const updatedMessages = [...currentChat.messages, userMessage, assistantMessage];
    setCurrentChat({ ...currentChat, messages: updatedMessages });

    // Save to chat history if it's a new chat
    if (currentChat.messages.length === 0) {
      addChatMessage({
        id: currentChat.id,
        title: message.slice(0, 50),
        timestamp: new Date(),
        messages: updatedMessages,
      });
    }

    setMessage('');
  };

  const startNewChat = () => {
    setCurrentChat({ id: Date.now().toString(), messages: [] });
  };

  const loadChat = (chatId: string) => {
    const chat = chatHistory.find((c) => c.id === chatId);
    if (chat) {
      setCurrentChat({ id: chat.id, messages: chat.messages });
    }
  };

  if (!user) return null;

  return (
    <div className={`h-screen flex ${theme === 'dark' ? 'bg-slate-950' : 'bg-slate-50'}`}>
      {/* Sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ x: -300 }}
            animate={{ x: 0 }}
            exit={{ x: -300 }}
            transition={{ type: 'spring', damping: 25 }}
            className={`w-72 border-r ${
              theme === 'dark'
                ? 'bg-slate-900 border-slate-800'
                : 'bg-white border-slate-200'
            } flex flex-col`}
          >
            <div className="p-4 border-b border-slate-800">
              <Button
                onClick={startNewChat}
                className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white"
              >
                <Plus className="size-4 mr-2" />
                New Chat
              </Button>
            </div>

            <ScrollArea className="flex-1 p-4">
              <div className="space-y-2">
                {chatHistory.map((chat) => (
                  <div key={chat.id} className="relative group flex items-center">
                    <motion.button
                      whileHover={{ x: 4 }}
                      onClick={() => loadChat(chat.id)}
                      className={`w-full text-left p-3 rounded-lg transition-colors pr-10 ${
                        currentChat.id === chat.id
                          ? theme === 'dark'
                            ? 'bg-violet-600/20 text-violet-300'
                            : 'bg-violet-100 text-violet-700'
                          : theme === 'dark'
                          ? 'hover:bg-slate-800 text-slate-300'
                          : 'hover:bg-slate-100 text-slate-700'
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        {chat.isPinned ? (
                          <Pin className="size-4 mt-0.5 flex-shrink-0 text-violet-500 fill-violet-500" />
                        ) : (
                          <MessageSquare className="size-4 mt-0.5 flex-shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                          {editingChatId === chat.id ? (
                            <Input
                              autoFocus
                              value={editTitle}
                              onChange={(e) => setEditTitle(e.target.value)}
                              onBlur={() => handleRenameSubmit(chat.id)}
                              onKeyDown={(e) => e.key === 'Enter' && handleRenameSubmit(chat.id)}
                              className={`h-6 text-sm px-1 py-0 mt-0.5 ${theme === 'dark' ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-300'}`}
                              onClick={(e) => e.stopPropagation()}
                            />
                          ) : (
                            <p className="truncate text-sm font-medium">{chat.title}</p>
                          )}
                          <p className={`text-xs ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>
                            {new Date(chat.timestamp).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </motion.button>
                    
                    <div className="absolute right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="size-8"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <MoreVertical className="size-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className={theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}>
                          <DropdownMenuItem 
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingChatId(chat.id);
                              setEditTitle(chat.title);
                            }}
                            className={theme === 'dark' ? 'hover:bg-slate-800 focus:bg-slate-800' : ''}
                          >
                            <Edit2 className="size-4 mr-2" />
                            Rename
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={(e) => {
                              e.stopPropagation();
                              pinChat(chat.id);
                            }}
                            className={theme === 'dark' ? 'hover:bg-slate-800 focus:bg-slate-800' : ''}
                          >
                            <Pin className="size-4 mr-2" />
                            {chat.isPinned ? 'Unpin Chat' : 'Pin Chat'}
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteChat(chat.id);
                              if (currentChat.id === chat.id) {
                                startNewChat();
                              }
                            }}
                            className={`text-red-500 ${theme === 'dark' ? 'hover:bg-red-950 focus:bg-red-950 focus:text-red-500' : 'hover:bg-red-50 focus:bg-red-50 focus:text-red-500'}`}
                          >
                            <Trash2 className="size-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div
          className={`border-b ${
            theme === 'dark'
              ? 'bg-slate-900/50 border-slate-800 backdrop-blur-lg'
              : 'bg-white/50 border-slate-200 backdrop-blur-lg'
          } px-6 py-4`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className={theme === 'dark' ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'}
              >
                {sidebarOpen ? <X className="size-5" /> : <Menu className="size-5" />}
              </Button>
              <div className="flex items-center gap-2">
                <div className="size-10 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center">
                  <Sparkles className="size-5 text-white" />
                </div>
                <span className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                  HealthAI
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleTheme}
                className={theme === 'dark' ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'}
              >
                {theme === 'dark' ? <Sun className="size-5" /> : <Moon className="size-5" />}
              </Button>
              <Button
                variant="ghost"
                onClick={() => navigate('/profile')}
                className={`gap-2 ${theme === 'dark' ? 'text-slate-300 hover:text-white' : 'text-slate-700 hover:text-slate-900'}`}
              >
                <User className="size-4" />
                My Profile
              </Button>
            </div>
          </div>
        </div>

        {/* Messages Area */}
        <ScrollArea className="flex-1 p-6">
          <div className="max-w-4xl mx-auto">
            {currentChat.messages.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-20"
              >
                <div className="size-20 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center mx-auto mb-6">
                  <Sparkles className="size-10 text-white" />
                </div>
                <h2
                  className={`text-4xl font-bold mb-4 ${
                    theme === 'dark' ? 'text-white' : 'text-slate-900'
                  }`}
                >
                  Hello, {user.name}!
                </h2>
                <p className={theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}>
                  How can I assist you with your health today?
                </p>
              </motion.div>
            ) : (
              <div className="space-y-6">
                {currentChat.messages.map((msg, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={`flex gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    {msg.role === 'assistant' && (
                      <div className="size-10 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center flex-shrink-0">
                        <Sparkles className="size-5 text-white" />
                      </div>
                    )}
                    <div
                      className={`max-w-2xl p-4 rounded-2xl ${
                        msg.role === 'user'
                          ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white'
                          : theme === 'dark'
                          ? 'bg-slate-800 text-white'
                          : 'bg-white text-slate-900 border border-slate-200'
                      }`}
                    >
                      {msg.mode && (
                        <span className="text-xs opacity-70 mb-2 block">
                          {msg.mode === 'fda' ? 'FDA Approved' : 'Experimental'}
                        </span>
                      )}
                      <p>{msg.content}</p>
                    </div>
                    {msg.role === 'user' && (
                      <div
                        className={`size-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                          theme === 'dark' ? 'bg-slate-800' : 'bg-slate-200'
                        }`}
                      >
                        <User className={`size-5 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`} />
                      </div>
                    )}
                  </motion.div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Input Area */}
        <div
          className={`border-t ${
            theme === 'dark' ? 'bg-slate-900/50 border-slate-800' : 'bg-white/50 border-slate-200'
          } p-6`}
        >
          <div className="max-w-4xl mx-auto">
            <div className="flex items-end gap-3">
              <Select value={mode} onValueChange={(val: 'fda' | 'experimental') => setMode(val)}>
                <SelectTrigger
                  className={`w-48 ${
                    theme === 'dark'
                      ? 'bg-slate-800 border-slate-700'
                      : 'bg-white border-slate-300'
                  }`}
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className={theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-300'}>
                  <SelectItem value="fda">FDA Approved</SelectItem>
                  <SelectItem value="experimental">Experimental</SelectItem>
                </SelectContent>
              </Select>

              <Input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Ask me anything about your health..."
                className={`flex-1 ${
                  theme === 'dark'
                    ? 'bg-slate-800 border-slate-700'
                    : 'bg-white border-slate-300'
                }`}
              />

              <Button
                onClick={handleSendMessage}
                size="icon"
                className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white size-10"
              >
                <Send className="size-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
