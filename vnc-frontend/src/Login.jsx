import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from './components/AuthProvider';

export default function Login() {
  const { isLoading, isAuthenticated, login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isProcessingCallback, setIsProcessingCallback] = useState(false);

  useEffect(() => {
    // Check if this is an OAuth callback
    const hasCode = searchParams.get('code');
    const hasState = searchParams.get('state');
    
    if (hasCode || hasState) {
      console.log('OAuth callback detected at /login, processing...');
      setIsProcessingCallback(true);
      // Wait a bit for AuthProvider to process the callback
      setTimeout(() => {
        if (isAuthenticated) {
          navigate('/', { replace: true });
        }
        setIsProcessingCallback(false);
      }, 1000);
      return;
    }

    // If already authenticated and not processing callback, redirect to home
    if (isAuthenticated && !isProcessingCallback) {
      console.log('User already authenticated, redirecting to home...');
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, navigate, searchParams, isProcessingCallback]);

  // Show loading during OAuth callback processing
  if (isLoading || isProcessingCallback) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-green-400 font-mono">
            {isProcessingCallback ? 'Authenticating...' : 'Loading...'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 bg-gradient-to-b from-green-500/5 to-transparent">
        <div className="absolute inset-0" style={{
          backgroundImage: `
            linear-gradient(rgba(34, 197, 94, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(34, 197, 94, 0.1) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px'
        }}></div>
      </div>

      {/* Glowing orbs */}
      <div className="absolute top-20 left-20 w-96 h-96 bg-green-500/20 rounded-full blur-3xl"></div>
      <div className="absolute bottom-20 right-20 w-96 h-96 bg-emerald-500/20 rounded-full blur-3xl"></div>

      <div className="relative z-10 flex items-center justify-center min-h-screen p-6">
        <div className="max-w-md w-full bg-gradient-to-br from-gray-900 to-black border-2 border-green-500/30 rounded-lg p-8 relative">
          {/* Corner accents */}
          <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-green-500"></div>
          <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-green-500"></div>
          <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-green-500"></div>
          <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-green-500"></div>

          <div className="flex items-center gap-3 mb-6">
            <div className="flex gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
            </div>
            <span className="text-green-400 font-mono text-sm">authentication required</span>
          </div>

          <h1 className="text-4xl font-bold text-white mb-2">
            Access <span className="text-green-500">Required</span>
          </h1>
          <div className="h-1 w-16 bg-gradient-to-r from-green-500 to-transparent mb-6"></div>

          <p className="text-gray-400 mb-8 font-mono text-sm">
            {'>'} Please authenticate to access Linux environments
          </p>

          <button
            onClick={login}
            className="w-full relative bg-green-500 hover:bg-green-400 text-black font-bold py-4 px-8 transition-all duration-200 overflow-hidden group"
          >
            <span className="relative z-10 font-mono">LOGIN WITH AUTHGEAR</span>
            <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-emerald-400 transform translate-x-full group-hover:translate-x-0 transition-transform duration-300"></div>
          </button>

          <p className="text-gray-600 text-center mt-6 text-xs font-mono">
            Secure authentication powered by Authgear
          </p>
        </div>
      </div>
    </div>
  );
}
