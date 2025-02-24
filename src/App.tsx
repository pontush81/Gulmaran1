import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Home } from './pages/Home';
import { Admin } from './pages/Admin';
import { Pages } from './pages/Pages';
import { Page } from './pages/Page';

function App() {
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      if (event.error?.message?.includes('Connect to Supabase')) {
        setError(event.error.message);
      }
    };

    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, []);

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Configuration Required</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <p className="text-gray-600">Once connected, you'll be able to:</p>
          <ul className="list-disc list-inside text-gray-600 mt-2">
            <li>Register new users</li>
            <li>Log in to the system</li>
            <li>Access the handbook content</li>
            <li>Manage users (as an admin)</li>
          </ul>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/pages" element={<Pages />} />
          <Route path="/p/:slug" element={<Page />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;