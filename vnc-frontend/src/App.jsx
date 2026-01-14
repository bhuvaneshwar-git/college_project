import React, { useState, useEffect } from 'react';
import { useAuth } from './components/AuthProvider';
import parrotLogo from './assets/parrot-logo.png';

export default function LinuxOSSelector() {
  const [hoveredCard, setHoveredCard] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [showSessions, setShowSessions] = useState(false);
  const [loadingOS, setLoadingOS] = useState(null);
  const [redirectingOS, setRedirectingOS] = useState(null);
  const [activeSessions, setActiveSessions] = useState({});
  const { user, logout, accessToken } = useAuth();

  const username = user?.username || user?.preferred_username || user?.sub || 'User';
  const email = user?.email || '';
  const userId = user?.sub;

  useEffect(() => {
    if (showSessions && accessToken) {
      fetchSessions();
    }
  }, [showSessions, accessToken]);

  useEffect(() => {
    if (accessToken) {
      console.log('🔑 Access token available, checking active sessions...');
      checkActiveSessions();
    } else {
      console.log('⚠️ No access token yet, skipping session check');
    }
  }, [accessToken]);

  const checkActiveSessions = async () => {
    if (!accessToken) {
      console.log('❌ No access token available for session check');
      return;
    }

    try {
      console.log('🔍 Fetching session info...');
      const response = await fetch('http://localhost:3001/session-info', {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      if (!response.ok) {
        console.error('❌ Session info request failed:', response.status, response.statusText);
        return;
      }

      const data = await response.json();
      console.log('✅ Session info:', data);
      
      if (data.success && data.sessions) {
        const sessionsMap = {};
        data.sessions.forEach(session => {
          sessionsMap[session.os] = session;
        });
        setActiveSessions(sessionsMap);
      }
    } catch (error) {
      console.error("❌ Failed to check active sessions:", error);
    }
  };

  const fetchSessions = async () => {
    if (!accessToken) {
      console.log('❌ No access token for fetching sessions');
      return;
    }

    try {
      const response = await fetch('http://localhost:3001/api/sessions', {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });
      
      if (!response.ok) {
        console.error('Failed to fetch sessions:', response.status);
        return;
      }
      
      const data = await response.json();
      if (data.success) {
        setSessions(data.sessions);
      }
    } catch (error) {
      console.error("Failed to fetch sessions:", error);
    }
  };

  const handleStartOS = async (os) => {
    if (!accessToken) {
      alert('Authentication token not available. Please try logging in again.');
      return;
    }

    console.log(`Starting ${os}...`);
    const osLower = os.toLowerCase();
    setLoadingOS(osLower);
    
    try {
      const response = await fetch(`http://localhost:3001/start-container?os=${osLower}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });
      
      const data = await response.json();
      
      if (data.success) {
        setActiveSessions(prev => ({
          ...prev,
          [data.os]: data
        }));

        setTimeout(() => {
          setLoadingOS(null);
          setRedirectingOS(osLower);
          
          setTimeout(() => {
            window.location.href = data.url;
          }, 15000);
        }, 15000);
      } else {
        alert(`Failed to start container: ${data.message}`);
        setLoadingOS(null);
      }
    } catch (error) {
      console.error('Error starting container:', error);
      alert('Failed to start container. Please try again.');
      setLoadingOS(null);
    }
  };

  const handleStopOS = async (os) => {
    if (!confirm(`Stop ${os} container? Your data will be saved.`)) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:3001/stop-container?os=${os.toLowerCase()}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });
      
      const data = await response.json();
      
      if (data.success) {
        setActiveSessions(prev => {
          const updated = { ...prev };
          delete updated[os.toLowerCase()];
          return updated;
        });
        alert(`${os} container stopped successfully!`);
      } else {
        alert(`Failed to stop container: ${data.message}`);
      }
    } catch (error) {
      console.error('Error stopping container:', error);
      alert('Failed to stop container. Please try again.');
    }
  };

  const handleReconnectOS = (os) => {
    const session = activeSessions[os.toLowerCase()];
    if (session && session.url) {
      window.open(session.url, '_blank', 'width=1400,height=800');
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const calculateDuration = (login, logout) => {
    if (!logout) return 'Active';
    const duration = new Date(logout) - new Date(login);
    const minutes = Math.floor(duration / 60000);
    const hours = Math.floor(minutes / 60);
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    return `${minutes}m`;
  };

  const OSCard = ({ name, color, logoUrl, description, features, isActive, isLoading }) => {
    const osKey = name.toLowerCase().replace(' ', '');
    const session = activeSessions[osKey];

    return (
      <div
        onMouseEnter={() => setHoveredCard(name)}
        onMouseLeave={() => setHoveredCard(null)}
        className="group relative bg-gradient-to-br from-gray-900 to-black border-2 border-green-500/30 rounded-lg p-8 hover:border-green-500 transition-all duration-300"
      >
        <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-green-500"></div>
        <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-green-500"></div>
        <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-green-500"></div>
        <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-green-500"></div>

        {hoveredCard === name && (
          <div className="absolute inset-0 bg-green-500/5 rounded-lg animate-pulse"></div>
        )}

        {session && (
          <div className="absolute top-4 right-4 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
            <span className="text-green-400 text-xs font-mono">ACTIVE</span>
          </div>
        )}

        <div className="relative flex flex-col items-center">
          <div className="w-32 h-32 mb-6 relative">
            <div className={`absolute inset-0 bg-${color}-600 rounded-full blur-xl opacity-50 group-hover:opacity-75 transition-opacity`}></div>
            <div className={`relative w-full h-full rounded-full bg-gradient-to-br from-${color}-500 to-${color}-700 flex items-center justify-center border-2 border-${color}-400 p-4`}>
              <img 
                src={logoUrl} 
                alt={`${name} logo`}
                className="w-full h-full object-contain"
              />
            </div>
          </div>

          <h3 className="text-3xl font-bold text-white mb-2 font-mono">
            {name}
          </h3>
          <div className="h-0.5 w-16 bg-green-500 mb-4"></div>

          <p className="text-gray-400 text-center mb-6 leading-relaxed">
            {description}
          </p>

          <div className="flex gap-6 mb-6 text-sm">
            {features.map((feature, idx) => (
              <div key={idx} className="text-center">
                <div className="text-green-400 font-mono font-bold">{feature.label}</div>
                <div className="text-gray-500">{feature.value}</div>
              </div>
            ))}
          </div>

          <div className="flex gap-3">
            {!session ? (
              <button
                onClick={() => handleStartOS(name.split(' ')[0])}
                disabled={isLoading}
                className="relative bg-green-500 hover:bg-green-400 disabled:bg-gray-600 disabled:cursor-not-allowed text-black font-bold py-3 px-12 transition-all duration-200 overflow-hidden group/btn"
              >
                <span className="relative z-10 font-mono">
                  {isLoading ? 'STARTING...' : `START ${name.split(' ')[0].toUpperCase()}`}
                </span>
                {!isLoading && (
                  <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-emerald-400 transform translate-x-full group-hover/btn:translate-x-0 transition-transform duration-300"></div>
                )}
              </button>
            ) : (
              <>
                <button
                  onClick={() => handleReconnectOS(osKey)}
                  className="relative bg-blue-500 hover:bg-blue-400 text-white font-bold py-3 px-8 transition-all duration-200 font-mono"
                >
                  RECONNECT
                </button>
                <button
                  onClick={() => handleStopOS(osKey)}
                  className="relative bg-red-500 hover:bg-red-400 text-white font-bold py-3 px-8 transition-all duration-200 font-mono"
                >
                  STOP
                </button>
              </>
            )}
          </div>

          {session && (
            <div className="mt-4 text-xs font-mono text-gray-400">
              <div>Port: {session.novncPort}</div>
              <div>Started: {new Date(session.startedAt).toLocaleTimeString()}</div>
            </div>
          )}
        </div>
      </div>
    );
  };

  if (!accessToken) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="relative w-32 h-32 mx-auto mb-6">
            <div className="absolute inset-0 border-4 border-green-500/20 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-transparent border-t-green-500 rounded-full animate-spin"></div>
          </div>
          <p className="text-green-400 font-mono">Loading session...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-green-500/5 to-transparent">
        <div className="absolute inset-0" style={{
          backgroundImage: `
            linear-gradient(rgba(34, 197, 94, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(34, 197, 94, 0.1) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px'
        }}></div>
      </div>

      <div className="absolute top-20 left-20 w-96 h-96 bg-green-500/20 rounded-full blur-3xl"></div>
      <div className="absolute bottom-20 right-20 w-96 h-96 bg-emerald-500/20 rounded-full blur-3xl"></div>

      <div className="relative z-10 min-h-screen p-6">
        <div className="max-w-6xl mx-auto mb-8">
          <div className="bg-gradient-to-br from-gray-900 to-black border-2 border-green-500/30 rounded-lg p-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white font-bold text-xl border-2 border-green-400">
                  {username.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-green-400 font-mono text-sm">root@kali:~$</span>
                    <h2 className="text-white font-bold text-xl font-mono">
                      {username}
                    </h2>
                  </div>
                  {email && (
                    <p className="text-gray-400 text-sm font-mono">{email}</p>
                  )}
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowSessions(!showSessions)}
                  className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-green-400 font-mono text-sm border border-green-500/30 hover:border-green-500 transition-all"
                >
                  {showSessions ? 'HIDE' : 'SHOW'} LOGS
                </button>
                <button
                  onClick={logout}
                  className="px-4 py-2 bg-red-900/30 hover:bg-red-900/50 text-red-400 font-mono text-sm border border-red-500/30 hover:border-red-500 transition-all"
                >
                  LOGOUT
                </button>
              </div>
            </div>

            {showSessions && (
              <div className="mt-6 pt-6 border-t border-green-500/20">
                <h3 className="text-green-400 font-mono text-sm mb-4">{'>'} Login History</h3>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {sessions.length === 0 ? (
                    <p className="text-gray-500 font-mono text-xs">No session logs available</p>
                  ) : (
                    sessions.map((session) => (
                      <div
                        key={session._id}
                        className={`p-3 rounded border ${
                          session.isActive
                            ? 'bg-green-900/20 border-green-500/30'
                            : 'bg-gray-900/50 border-gray-700/30'
                        }`}
                      >
                        <div className="flex justify-between items-start gap-4 text-xs font-mono">
                          <div className="flex-1">
                            <div className="text-gray-400">
                              <span className="text-green-400">IN:</span> {formatDate(session.loginTime)}
                            </div>
                            {session.logoutTime && (
                              <div className="text-gray-400">
                                <span className="text-red-400">OUT:</span> {formatDate(session.logoutTime)}
                              </div>
                            )}
                          </div>
                          <div className="text-right">
                            <span className={session.isActive ? 'text-green-400' : 'text-gray-500'}>
                              {calculateDuration(session.loginTime, session.logoutTime)}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="max-w-6xl mx-auto">
          <div className="mb-12">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
              </div>
              <span className="text-green-400 font-mono text-sm">active session</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-bold mb-4">
              <span className="text-white">Run Linux OS in </span>
              <span className="text-green-500">Your Browser!</span>
            </h1>
            <div className="h-1 w-24 bg-gradient-to-r from-green-500 to-transparent"></div>
          </div>

          <h2 className="text-2xl md:text-3xl font-bold text-green-400 mb-12 font-mono">
            {'>'} Choose Your Operating System
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <OSCard
              name="Parrot Linux"
              color="cyan"
              logoUrl={parrotLogo}
              description="Security and privacy-focused Linux distribution ."
              features={[
                { label: 'Privacy', value: 'Focused' },
                { label: 'Security', value: 'Tools' }
              ]}
              isActive={activeSessions.parrot}
              isLoading={loadingOS === 'parrot' || redirectingOS === 'parrot'}
            />

            <OSCard
              name="Kali Linux"
              color="cyan"
              logoUrl="https://upload.wikimedia.org/wikipedia/commons/2/2b/Kali-dragon-icon.svg"
              description="Security testing and ethical hacking Linux distribution."
              features={[
                { label: 'PenTest', value: 'Tools' },
                { label: 'Ethical', value: 'Hacking' }
              ]}
              isActive={activeSessions.kali}
              isLoading={loadingOS === 'kali' || redirectingOS === 'kali'}
            />
          </div>

          <div className="mt-12 text-center">
            {loadingOS ? (
              <div className="space-y-3">
                <p className="text-green-400 font-mono text-lg animate-pulse">
                  Starting {loadingOS} container...
                </p>
                <div className="flex justify-center gap-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            ) : redirectingOS ? (
              <div className="space-y-3">
                <p className="text-green-400 font-mono text-lg">
                  {redirectingOS} container started! 
                </p>
                <p className="text-green-400 font-mono text-lg animate-pulse">
                  Redirecting...
                </p>
                <div className="flex justify-center gap-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            ) : (
              <p className="text-gray-500 font-mono text-sm">
                [+] Choose your preferred Linux distribution to get started
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
