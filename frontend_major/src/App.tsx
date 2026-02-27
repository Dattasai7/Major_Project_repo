import { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Login } from './components/Login';
import { Signup } from './components/Signup';
import { Home } from './components/Home';

type View = 'login' | 'signup';

const AppContent = () => {
  const { user, loading } = useAuth();
  const [view, setView] = useState<View>('login');

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (user) {
    return <Home />;
  }

  if (view === 'signup') {
    return <Signup onLoginClick={() => setView('login')} />;
  }

  return <Login onSignupClick={() => setView('signup')} />;
};

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
