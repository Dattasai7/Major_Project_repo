import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { sendChat, getChatHistory } from '../lib/api';
import { LogOut, Send, Bot, User as UserIcon } from 'lucide-react';

interface ChatMessage {
  id?: string;
  message: string;
  response: any;
  timestamp: string;
}

export const Home = () => {
  const { user, logout } = useAuth();
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [sending, setSending] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [inputOption, setInputOption] = useState<'disease' | 'symptoms' | null>(null);

  // Load chat history on mount
  useEffect(() => {
    const loadHistory = async () => {
      try {
        const data = await getChatHistory();
        setMessages(data.history || []);
      } catch (err) {
        console.error('Failed to load chat history:', err);
      } finally {
        setLoadingHistory(false);
      }
    };
    loadHistory();
  }, []);

  const handleLogout = () => {
    logout();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || sending) return;

    const prefix = inputOption === 'disease' ? 'Disease Info: ' : 'Symptoms: ';
    const userMessage = prefix + input.trim();
    const displayMessage = input.trim(); // What we show in the UI

    setInput('');
    setSending(true);

    try {
      const data = await sendChat(userMessage);
      setMessages((prev) => [
        ...prev,
        {
          message: displayMessage,
          response: data.response,
          timestamp: data.timestamp,
        },
      ]);
    } catch (err) {
      console.error('Chat failed:', err);
      // Show error as a chat message
      setMessages((prev) => [
        ...prev,
        {
          message: displayMessage,
          response: { error: err instanceof Error ? err.message : 'Something went wrong' },
          timestamp: new Date().toISOString(),
        },
      ]);
    } finally {
      setSending(false);
    }
  };

  const formatResponse = (response: any): string => {
    if (!response) return 'No response';
    if (response.error) return `Error: ${response.error}`;
    if (response.identified_disease) {
      return `Identified Disease: ${response.identified_disease}\nSymptoms: ${response.symptoms}`;
    }
    if (typeof response === 'string') return response;
    return JSON.stringify(response, null, 2);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-sky-50 flex flex-col">
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Medical AI Chat</h1>
            <p className="text-sm text-gray-600">{user?.email}</p>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </nav>

      <div className="flex-1 max-w-4xl w-full mx-auto px-4 py-6 flex flex-col">
        {/* Chat messages area */}
        <div className="flex-1 bg-white rounded-2xl shadow-lg p-6 mb-4 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 220px)' }}>
          {loadingHistory ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="ml-3 text-gray-500">Loading chat history...</p>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-gray-400">
              <Bot className="w-12 h-12 mb-3" />
              <p className="text-lg font-medium">Welcome!</p>
              <p className="text-sm">Describe your symptoms below to get an AI diagnosis.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((msg, idx) => (
                <div key={msg.id || idx} className="space-y-3">
                  {/* User message */}
                  <div className="flex justify-end">
                    <div className="flex items-start gap-2 max-w-[75%]">
                      <div className="bg-blue-600 text-white px-4 py-3 rounded-2xl rounded-tr-sm">
                        <p className="text-sm">{msg.message}</p>
                      </div>
                      <div className="bg-blue-100 p-1.5 rounded-full flex-shrink-0">
                        <UserIcon className="w-4 h-4 text-blue-600" />
                      </div>
                    </div>
                  </div>
                  {/* AI response */}
                  <div className="flex justify-start">
                    <div className="flex items-start gap-2 max-w-[75%]">
                      <div className="bg-gray-100 p-1.5 rounded-full flex-shrink-0">
                        <Bot className="w-4 h-4 text-gray-600" />
                      </div>
                      <div className="bg-gray-100 text-gray-800 px-4 py-3 rounded-2xl rounded-tl-sm">
                        <pre className="text-sm whitespace-pre-wrap font-sans">{formatResponse(msg.response)}</pre>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Input area */}
        <div className="bg-white rounded-2xl shadow-lg p-4">
          {!inputOption ? (
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center p-4">
              <button
                onClick={() => setInputOption('disease')}
                className="flex-1 max-w-sm p-6 border-2 border-dashed border-blue-300 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition flex flex-col items-center justify-center gap-2 group"
              >
                <div className="p-3 bg-blue-100 text-blue-600 rounded-full group-hover:scale-110 transition">
                  <Bot className="w-6 h-6" />
                </div>
                <span className="font-semibold text-gray-700">Enter the disease</span>
                <span className="text-xs text-gray-500 text-center">I know the disease and want to know more about it.</span>
              </button>

              <button
                onClick={() => setInputOption('symptoms')}
                className="flex-1 max-w-sm p-6 border-2 border-dashed border-sky-300 rounded-xl hover:border-sky-500 hover:bg-sky-50 transition flex flex-col items-center justify-center gap-2 group"
              >
                <div className="p-3 bg-sky-100 text-sky-600 rounded-full group-hover:scale-110 transition">
                  <UserIcon className="w-6 h-6" />
                </div>
                <span className="font-semibold text-gray-700">Enter the symptoms</span>
                <span className="text-xs text-gray-500 text-center">I have symptoms and want to identify potential diseases.</span>
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm font-medium text-gray-600">
                  {inputOption === 'disease' ? 'Disease Information Mode' : 'Symptom Checker Mode'}
                </span>
                <button
                  type="button"
                  onClick={() => { setInputOption(null); setInput(''); }}
                  className="text-xs text-gray-500 hover:text-red-500 transition"
                >
                  Change Option
                </button>
              </div>
              <div className="flex gap-3">
                <input
                  id="userInput"
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                  placeholder={inputOption === 'disease' ? "e.g., Type 2 Diabetes" : "e.g., Headache, fever, and fatigue..."}
                  required
                  disabled={sending}
                  autoFocus
                />
                <button
                  type="submit"
                  disabled={sending || !input.trim()}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-4 focus:ring-blue-200 transition flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="w-5 h-5" />
                  {sending ? 'Sending...' : 'Send'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
