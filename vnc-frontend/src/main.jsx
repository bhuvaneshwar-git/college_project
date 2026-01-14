import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import './index.css';
import App from './App.jsx';
import Login from './Login.jsx';
import { AuthProvider, useAuth } from './components/AuthProvider.jsx';
import Callback from './components/Callback.jsx';

// Loading component
function AppLoading() {
  return (
    <div className="min-h-screen bg-black relative overflow-hidden flex items-center justify-center">
      <div className="absolute inset-0 bg-gradient-to-b from-green-500/5 to-transparent">
        <div className="absolute inset-0" style={{
          backgroundImage: `
            linear-gradient(rgba(34, 197, 94, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(34, 197, 94, 0.1) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px',
          animation: 'grid-move 20s linear infinite'
        }}></div>
      </div>

      <div className="relative z-10">
        <div className="relative w-32 h-32 mx-auto mb-6">
          <div className="absolute inset-0 border-4 border-green-500/20 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-transparent border-t-green-500 rounded-full animate-spin"></div>
        </div>
        <p className="text-green-400 font-mono text-center">Initializing...</p>
      </div>

      <style>{`
        @keyframes grid-move {
          0% { transform: translateY(0); }
          100% { transform: translateY(50px); }
        }
      `}</style>
    </div>
  );
}

// Routes Component that uses auth
function AppRoutes() {
  const { isLoading, isAuthenticated } = useAuth();

  console.log('🎯 AppRoutes - isLoading:', isLoading, 'isAuthenticated:', isAuthenticated);

  // CRITICAL: Show loading screen while checking authentication
  // This prevents ANY route from rendering until we know auth status
  if (isLoading) {
    console.log('⏳ Still loading, showing loading screen...');
    return <AppLoading />;
  }

  console.log('✅ Loading complete, rendering routes');

  return (
    <Routes>
      {/* Callback route - always accessible */}
      <Route path="/callback" element={<Callback />} />
      
      {/* Login route - redirect to home if already authenticated */}
      <Route 
        path="/login" 
        element={
          isAuthenticated ? (
            <Navigate to="/" replace />
          ) : (
            <Login />
          )
        } 
      />
      
      {/* Home route - redirect to login if not authenticated */}
      <Route 
        path="/" 
        element={
          isAuthenticated ? (
            <App />
          ) : (
            <Navigate to="/login" replace />
          )
        } 
      />
      
      {/* Catch all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  </React.StrictMode>
);
