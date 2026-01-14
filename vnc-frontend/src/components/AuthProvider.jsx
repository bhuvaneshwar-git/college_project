import { createContext, useContext, useEffect, useState } from 'react';
import authgear from '@authgear/web';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [accessToken, setAccessToken] = useState(null);

  useEffect(() => {
    initAuthgear();
  }, []);

  const initAuthgear = async () => {
    const startTime = Date.now();
    const minLoadingTime = 3500; // Minimum 800ms loading time for better UX
    
    try {
      await authgear.configure({
        endpoint: import.meta.env.VITE_AUTHGEAR_ENDPOINT,
        clientID: import.meta.env.VITE_AUTHGEAR_CLIENT_ID,
        sessionType: "refresh_token",
        isSSOEnabled: false
      });

      const params = new URLSearchParams(window.location.search);
      const hasCallback = params.get('code') || params.get('state');
      
      if (hasCallback) {
        console.log('🔄 Processing OAuth callback...');
        
        // Use a more robust lock mechanism
        const processingKey = 'authgear_processing';
        const lockTimestamp = sessionStorage.getItem(processingKey);
        const now = Date.now();
        
        // If lock exists and is less than 5 seconds old, wait for it
        if (lockTimestamp && (now - parseInt(lockTimestamp)) < 5000) {
          console.log('⏳ Another instance is processing, waiting...');
          // Wait for the other instance to finish
          await new Promise(resolve => setTimeout(resolve, 2000));
          // Check if authentication succeeded
          const authenticated = authgear.sessionState === "AUTHENTICATED";
          console.log('🔐 Authentication status after wait:', authenticated);
          
          if (authenticated) {
            // The other instance succeeded, just get user info
            await loadUserInfo(hasCallback, startTime, minLoadingTime);
          }
          return;
        }
        
        // Set lock with current timestamp
        sessionStorage.setItem(processingKey, now.toString());
        
        try {
          await authgear.finishAuthentication();
          console.log('✅ Authentication finished successfully');
          sessionStorage.removeItem(processingKey);
        } catch (error) {
          console.error('❌ Error finishing authentication:', error);
          sessionStorage.removeItem(processingKey);
          setIsLoading(false);
          setIsAuthenticated(false);
          return;
        }
      }

      // Check authentication status
      const authenticated = authgear.sessionState === "AUTHENTICATED";
      console.log('🔐 Authentication status:', authenticated);

      if (authenticated) {
        await loadUserInfo(hasCallback, startTime, minLoadingTime);
      } else {
        setIsAuthenticated(false);
        setIsLoading(false);
      }

      console.log('✅ Auth initialization complete. isAuthenticated:', authenticated);
    } catch (error) {
      console.error("❌ Authgear initialization error:", error);
      setIsAuthenticated(false);
      setIsLoading(false);
    }
  };

  const loadUserInfo = async (hasCallback, startTime, minLoadingTime) => {
    try {
      console.log('👤 Fetching user info from Authgear...');
      
      const userInfo = await authgear.fetchUserInfo();
      
      if (!userInfo) {
        console.error('fetchUserInfo returned null or undefined');
        throw new Error('No user info returned');
      }
      
      console.log('=== FULL USER INFO FROM AUTHGEAR ===');
      console.log(JSON.stringify(userInfo, null, 2));
      console.log('====================================');
      
      const token = await authgear.getAccessToken();
      console.log('🔑 Access token obtained:', token ? 'Yes' : 'No');
      
      // Extract username
      const username = extractUsername(userInfo);
      
      setUser({
        id: userInfo.sub,
        username: username,
        email: userInfo.email || ''
      });
      setAccessToken(token);

      console.log('✅ Final username set:', username);

      // Record login only after callback
      if (hasCallback) {
        console.log('💾 Recording login to database...');
        await recordLogin(userInfo, token);
      }
      
      // CRITICAL: Set both states together
      console.log('✅ Setting authenticated=true and loading=false');
      
      // Ensure minimum loading time for smooth UX
      const elapsedTime = Date.now() - startTime;
      const remainingTime = Math.max(0, minLoadingTime - elapsedTime);
      
      if (remainingTime > 0) {
        console.log(`⏳ Waiting ${remainingTime}ms for smooth transition...`);
        await new Promise(resolve => setTimeout(resolve, remainingTime));
      }
      
      setIsAuthenticated(true);
      setIsLoading(false);
      
    } catch (error) {
      console.error('❌ Error getting user info:', error);
      setUser({
        id: 'unknown',
        username: 'User',
        email: ''
      });
      try {
        const token = await authgear.getAccessToken();
        setAccessToken(token);
        setIsAuthenticated(true);
        setIsLoading(false);
      } catch (e) {
        console.error('Error getting access token:', e);
        setIsAuthenticated(false);
        setIsLoading(false);
      }
    }
  };

  const extractUsername = (userInfo) => {
    if (userInfo?.preferredUsername) {
      console.log('✓ Username from "preferredUsername":', userInfo.preferredUsername);
      return userInfo.preferredUsername;
    } else if (userInfo?.preferred_username) {
      console.log('✓ Username from "preferred_username":', userInfo.preferred_username);
      return userInfo.preferred_username;
    } else if (userInfo?.name) {
      console.log('✓ Username from "name":', userInfo.name);
      return userInfo.name;
    } else if (userInfo?.given_name || userInfo?.givenName) {
      const givenName = userInfo.given_name || userInfo.givenName;
      console.log('✓ Username from "given_name/givenName":', givenName);
      return givenName;
    } else if (userInfo?.nickname) {
      console.log('✓ Username from "nickname":', userInfo.nickname);
      return userInfo.nickname;
    } else if (userInfo?.family_name || userInfo?.familyName) {
      const familyName = userInfo.family_name || userInfo.familyName;
      console.log('✓ Username from "family_name/familyName":', familyName);
      return familyName;
    } else if (userInfo?.email) {
      const emailUsername = userInfo.email.split('@')[0];
      console.log('✓ Username from email:', emailUsername);
      return emailUsername;
    }
    console.log('⚠ No username fields found, using: User');
    return 'User';
  };

  const recordLogin = async (userInfo, token) => {
    try {
      const username = extractUsername(userInfo);
      console.log('Recording login for username:', username);

      await fetch('http://localhost:3001/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          username: username,
          email: userInfo.email
        })
      });
    } catch (error) {
      console.error("Failed to record login:", error);
    }
  };

  const recordLogout = async () => {
    try {
      if (accessToken) {
        await fetch('http://localhost:3001/api/logout', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        });
      }
    } catch (error) {
      console.error("Failed to record logout:", error);
    }
  };

  const login = async () => {
    try {
      await authgear.startAuthentication({
        redirectURI: `${window.location.origin}/callback`,
        prompt: "login"
      });
    } catch (error) {
      console.error("Login error:", error);
    }
  };

  const logout = async () => {
    try {
      await recordLogout();
      await authgear.logout({
        redirectURI: `${window.location.origin}/login`
      });
      setIsAuthenticated(false);
      setUser(null);
      setAccessToken(null);
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const value = {
    isLoading,
    isAuthenticated,
    user,
    accessToken,
    login,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
