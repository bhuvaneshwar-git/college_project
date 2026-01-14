import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthProvider';

export default function Callback() {
  const navigate = useNavigate();
  const { isLoading, isAuthenticated } = useAuth();
  const redirected = useRef(false);

  useEffect(() => {
    console.log('🔄 Callback - isLoading:', isLoading, 'isAuthenticated:', isAuthenticated);
    
    // Wait until auth is complete and only redirect once
    if (!isLoading && !redirected.current) {
      redirected.current = true;
      
      console.log('🚀 Auth complete, redirecting...');
      
      // Longer delay for smoother, more visible transition
      setTimeout(() => {
        if (isAuthenticated) {
          console.log('✅ Redirecting to home');
          navigate('/', { replace: true });
        } else {
          console.log('❌ Redirecting to login');
          navigate('/login', { replace: true });
        }
      }, 3500); // Increased from 200ms to 1.5 seconds
    }
  }, [isLoading, isAuthenticated, navigate]);

  return (
    <div className="min-h-screen bg-black relative overflow-hidden flex items-center justify-center">
      {/* Animated background grid */}
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

      {/* Glowing orbs */}
      <div className="absolute top-20 left-20 w-96 h-96 bg-green-500/20 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-20 right-20 w-96 h-96 bg-emerald-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>

      {/* Loading content */}
      <div className="relative z-10 text-center">
        <div className="mb-8">
          {/* Terminal-style loading animation */}
          <div className="flex items-center justify-center gap-2 mb-4">
            {/*<div className="w-3 h-3 rounded-full bg-red-500"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
            <div className="w-3 h-3 rounded-full bg-green-500"></div>*/}
          </div>

          {/* Spinner */}
          <div className="relative w-32 h-32 mx-auto mb-6">
            <div className="absolute inset-0 border-4 border-green-500/20 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-transparent border-t-green-500 rounded-full animate-spin"></div>
            <div className="absolute inset-4 border-4 border-transparent border-t-emerald-400 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1s' }}></div>
          </div>

          {/* Status text */}
          <div>
            <p className="text-green-400 font-mono text-lg mb-2">
              {isLoading ? 'Authenticating...' : 'Success! Redirecting...'}
            </p>
            <div className="flex justify-center gap-1">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
              <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            </div>
          </div>
        </div>

        {/* Terminal-style output */}
        <div className="bg-black/50 border border-green-500/30 rounded p-4 max-w-md mx-auto">
          <div className="font-mono text-xs text-left space-y-1">
            <div className="text-green-400">[<span className="text-green-500">✓</span>] Authentication complete</div>
            <div className="text-green-400">[<span className="text-green-500">✓</span>] Session established</div>
            <div className="text-green-400">[<span className="text-green-500">✓</span>] Credentials validated</div>
            <div className="text-green-400 animate-pulse">[<span className="text-green-500">→</span>] Redirecting to application...</div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes grid-move {
          0% {
            transform: translateY(0);
          }
          100% {
            transform: translateY(50px);
          }
        }
      `}</style>
    </div>
  );
}
