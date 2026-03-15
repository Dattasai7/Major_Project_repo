import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useApp } from '../context/AppContext';
import { sendChat } from '../api';
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
  Loader2,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../components/ui/dropdown-menu';

/**
 * Format a backend response object into a readable string for the chat bubble.
 */
function formatResponse(response: any): string {
  if (!response) return 'No response received.';
  if (typeof response === 'string') return response;

  if (response.identified_condition) {
    let html = `<div class="space-y-6">`;
    
    // 1. Header & Condition
    html += `<div>
               <h3 class="text-lg font-bold border-b border-slate-700 pb-1">Diagnosis Summary</h3>
               <p class="mt-2"><strong>Condition:</strong> <span class="text-indigo-400">${response.identified_condition.toUpperCase()}</span></p>
             </div>`;

    // 2. FDA Approved Medications Section
    const meds = response.approved_medications || [];
    if (meds.length > 0) {
      html += `<div><h4 class="font-bold text-violet-500 mb-3 flex items-center gap-2">
                <span class="size-2 rounded-full bg-violet-500"></span> Clinical Treatments (FDA)
               </h4>`;
      meds.forEach((drug: any, i: number) => {
        html += `<div class="mb-3 p-3 bg-slate-900/40 rounded-lg border border-slate-800 shadow-sm">`;
        html += `<p class="font-bold text-indigo-300">${i + 1}. ${drug.drug_name}</p>`;
        if (drug.primary_use) html += `<p class="text-sm mt-1 opacity-90"><strong>Usage:</strong> ${drug.primary_use}</p>`;
        if (drug.start_dosage) html += `<p class="text-sm opacity-90"><strong>Dosage:</strong> ${drug.start_dosage}</p>`;
        if (drug.important_warning) {
          html += `<p class="text-xs mt-2 text-amber-500 italic bg-amber-500/10 p-2 rounded">Warning: ${drug.important_warning}</p>`;
        }
        html += `</div>`;
      });
      html += `</div>`;
    }

    // 3. Experimental Trials Section
    const trials = response.experimental_trials || [];
    if (trials.length > 0) {
      html += `<div><h4 class="font-bold text-amber-500 mb-3 flex items-center gap-2">
                <span class="size-2 rounded-full bg-amber-500"></span> Experimental Trials
               </h4>`;
      trials.forEach((trial: any, i: number) => {
        html += `<div class="mb-3 p-3 bg-amber-500/5 rounded-lg border border-amber-500/20 shadow-sm">`;
        // Adjust these keys based on what your fetch_experimental_drugs actually returns
        html += `<p class="font-bold text-amber-200">${trial.drug_name || trial.title || 'Experimental Drug'}</p>`;
        if (trial.primary_use || trial.description) {
            html += `<p class="text-sm mt-1 opacity-90">${trial.primary_use || trial.description}</p>`;
        }
        if (trial.phase) html += `<p class="text-xs mt-1 uppercase tracking-wider font-semibold text-amber-400/80">${trial.phase}</p>`;
        html += `</div>`;
      });
      html += `</div>`;
    }

    // 4. If nothing was found
    if (meds.length === 0 && trials.length === 0) {
        html += `<p class="text-slate-400 italic">No specific treatments or trials were identified for this condition.</p>`;
    }

    html += `</div>`;
    return html;
  }
  
  return JSON.stringify(response, null, 2);
}

export const Home = () => {
  const navigate = useNavigate();
  const { user, theme, toggleTheme, chatHistory, addChatMessage, updateChatMessages } = useApp();
  const [message, setMessage] = useState('');
  const [mode, setMode] = useState<'fda' | 'experimental' | 'both'>('both');
  const [currentChat, setCurrentChat] = useState<{
    id: string;
    messages: { role: 'user' | 'assistant'; content: string; mode?: string }[];
  }>({ id: Date.now().toString(), messages: [] });
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [editingChatId, setEditingChatId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [isLoading, setIsLoading] = useState(false);
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

  const handleSendMessage = async () => {
    if (!message.trim() || isLoading) return;

    const userMessage = {
      role: 'user' as const,
      content: message,
      mode,
    };

    const updatedWithUser = [...currentChat.messages, userMessage];
    setCurrentChat({ ...currentChat, messages: updatedWithUser });
    setMessage('');
    setIsLoading(true);

    try {
      const res = await sendChat(message, mode);
      const assistantContent = formatResponse(res.response);

      const assistantMessage = {
        role: 'assistant' as const,
        content: assistantContent,
      };

      const allMessages = [...updatedWithUser, assistantMessage];
      setCurrentChat((prev) => ({ ...prev, messages: allMessages }));

      // Save to chat history
      if (currentChat.messages.length === 0) {
        addChatMessage({
          id: currentChat.id,
          title: message.slice(0, 50),
          timestamp: new Date(),
          messages: allMessages,
        });
      } else {
        // Update existing chat in history
        updateChatMessages(currentChat.id, allMessages);
      }
    } catch (err: any) {
      const errorMessage = {
        role: 'assistant' as const,
        content: `⚠️ ${err.message || 'Something went wrong. Please try again.'}`,
      };
      const allMessages = [...updatedWithUser, errorMessage];
      setCurrentChat((prev) => ({ ...prev, messages: allMessages }));
    } finally {
      setIsLoading(false);
    }
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
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
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
        <ScrollArea className="flex-1 w-full overflow-y-auto">
          <div className="w-full max-w-4xl mx-auto p-6 md:px-10 pb-24">
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
              <div className="space-y-6 pb-10">
                {currentChat.messages.map((msg, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
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
                      <span className="text-xs opacity-70 mb-2 block font-medium tracking-wide">
                        {msg.mode === 'fda' && 'FDA Approved'}
                        {msg.mode === 'experimental' && 'Experimental'}
                        {msg.mode === 'both' && 'Combined Analysis'}
                      </span>
                      )}
                      <div 
                        className="prose prose-sm dark:prose-invert max-w-none leading-relaxed"
                        dangerouslySetInnerHTML={{ __html: msg.content }}
                      />
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
                {isLoading && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex gap-4 justify-start"
                  >
                    <div className="size-10 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center flex-shrink-0">
                      <Sparkles className="size-5 text-white" />
                    </div>
                    <div
                      className={`p-4 rounded-2xl ${
                        theme === 'dark' ? 'bg-slate-800 text-white' : 'bg-white text-slate-900 border border-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Loader2 className="size-4 animate-spin" />
                        <span className="text-sm opacity-70">Analyzing your query...</span>
                      </div>
                    </div>
                  </motion.div>
                )}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Input Area */}
<div className="w-full flex-shrink-0 px-6 pb-8 pt-2"> 
  {/* Removed the border-t and background from the wrapper to make it transparent */}
  <div className={`max-w-4xl mx-auto rounded-2xl shadow-2xl border ${
    theme === 'dark' 
      ? 'bg-slate-900/80 border-slate-800 backdrop-blur-xl' 
      : 'bg-white/80 border-slate-200 backdrop-blur-xl'
  } p-4`}>
    {/* This inner div is what actually "pops out" */}
    
    <div className="flex items-center gap-3">
      <Select value={mode} onValueChange={(val: 'fda' | 'experimental' | 'both') => setMode(val)}>
        <SelectTrigger
          className={`w-40 h-11 focus:ring-violet-500 ${
            theme === 'dark'
              ? 'bg-slate-800/50 border-slate-700'
              : 'bg-slate-100 border-slate-200'
          }`}
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent className={theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white'}>
          <SelectItem value="fda">FDA Approved</SelectItem>
          <SelectItem value="experimental">Experimental</SelectItem>
          <SelectItem value="both">FDA and Experimental</SelectItem>
        </SelectContent>
      </Select>

      <Input
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
        placeholder="Ask me anything about your health..."
        disabled={isLoading}
        className={`flex-1 h-11 border-none focus-visible:ring-1 focus-visible:ring-violet-500 ${
          theme === 'dark' ? 'bg-transparent text-white' : 'bg-transparent text-slate-900'
        }`}
      />

      <Button
        onClick={handleSendMessage}
        size="icon"
        disabled={isLoading || !message.trim()}
        className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:shadow-lg hover:shadow-violet-500/30 transition-all duration-200 size-11 rounded-xl"
      >
        {isLoading ? <Loader2 className="size-5 animate-spin" /> : <Send className="size-5" />}
      </Button>
    </div>
  </div>
</div>
      </div>
    </div>
  );
};
