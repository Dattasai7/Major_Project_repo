import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { LogOut, Send } from 'lucide-react';

export const Home = () => {
  const { user, logout } = useAuth();
  const [input, setInput] = useState('');

  const handleLogout = async () => {
    logout();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('User input:', input);
    setInput('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-sky-50">
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Home</h1>
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

      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Enter Your Input</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="userInput" className="block text-sm font-medium text-gray-700 mb-2">
                Your Message
              </label>
              <div className="flex gap-3">
                <input
                  id="userInput"
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                  placeholder="Type something here..."
                  required
                />
                <button
                  type="submit"
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-4 focus:ring-blue-200 transition flex items-center gap-2"
                >
                  <Send className="w-5 h-5" />
                  Send
                </button>
              </div>
            </div>
          </form>

          <div className="mt-8 p-6 bg-gray-50 rounded-lg border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Welcome!</h3>
            <p className="text-gray-600">
              You have successfully logged in. Use the text field above to submit your input.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
